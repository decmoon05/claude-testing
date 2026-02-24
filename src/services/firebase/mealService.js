import { collection, doc, addDoc, getDocs, query, where, orderBy, limit, runTransaction, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase.config';

/**
 * pHash 중복 체크: Firestore에 동일 해시 존재 여부 확인
 */
export const checkDuplicateHash = async (userId, imageHash) => {
  const q = query(
    collection(db, 'meals', userId, 'entries'),
    where('imageHash', '==', imageHash)
  );
  const snap = await getDocs(q);
  return !snap.empty;
};

/**
 * 기록 간격 체크: 마지막 기록 이후 2시간 경과 여부
 * api.md §5: limit(1)으로 최신 1건만 조회
 */
export const checkMinInterval = async (userId) => {
  const q = query(
    collection(db, 'meals', userId, 'entries'),
    orderBy('timestamp', 'desc'),
    limit(1)  // 전체 조회 금지 → 최신 1건만
  );
  const snap = await getDocs(q);
  if (snap.empty) return true;

  const lastEntry = snap.docs[0].data();
  const lastTime = lastEntry.timestamp?.toDate();
  if (!lastTime) return true;

  const diffHours = (Date.now() - lastTime.getTime()) / (1000 * 60 * 60);
  return diffHours >= 2;
};

/**
 * 하루 기록 수 체크: 최대 3끼 인정
 */
export const getDailyMealCount = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const q = query(
    collection(db, 'meals', userId, 'entries'),
    where('timestamp', '>=', today),
    where('timestamp', '<', tomorrow)
  );
  const snap = await getDocs(q);
  return snap.size;
};

/**
 * 이미지를 Firebase Storage에 업로드
 * @returns {string} 다운로드 URL
 */
export const uploadMealImage = async (userId, imageUri, mealId) => {
  const response = await fetch(imageUri);
  const blob = await response.blob();
  const storageRef = ref(storage, `meals/${userId}/${mealId}.jpg`);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
};

/**
 * 식단 기록 저장 (어뷰징 방지 검증 포함)
 * Race Condition 방지: 검증 + 저장을 Firestore 트랜잭션으로 원자적 처리
 */
export const saveMealEntry = async (userId, mealData) => {
  const { imageUri, imageHash, items, totalScore, inputMethod } = mealData;

  // 이미지 업로드는 트랜잭션 밖에서 선행 처리 (Storage는 트랜잭션 미지원)
  let imageUrl = null;
  if (imageUri) {
    const tempMealId = `${userId}_${Date.now()}`;
    imageUrl = await uploadMealImage(userId, imageUri, tempMealId);
  }

  // 트랜잭션으로 검증 + 저장 원자적 처리 (Race Condition 방지)
  const entryRef = await runTransaction(db, async (transaction) => {
    // 1. 중복 이미지 검사
    if (imageHash) {
      const hashQuery = query(
        collection(db, 'meals', userId, 'entries'),
        where('imageHash', '==', imageHash),
        limit(1)
      );
      const hashSnap = await getDocs(hashQuery);
      if (!hashSnap.empty) throw new Error('이미 등록한 식단입니다.');
    }

    // 2. 기록 간격 검사 (2시간) - api.md §5: limit(1)
    const intervalQuery = query(
      collection(db, 'meals', userId, 'entries'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    const intervalSnap = await getDocs(intervalQuery);
    if (!intervalSnap.empty) {
      const lastTime = intervalSnap.docs[0].data().timestamp?.toDate();
      if (lastTime) {
        const diffHours = (Date.now() - lastTime.getTime()) / (1000 * 60 * 60);
        if (diffHours < 2) throw new Error('기록 간격이 너무 짧습니다. 2시간 후 다시 시도해주세요.');
      }
    }

    // 3. 하루 3끼 제한
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dailyQuery = query(
      collection(db, 'meals', userId, 'entries'),
      where('timestamp', '>=', today),
      where('timestamp', '<', tomorrow)
    );
    const dailySnap = await getDocs(dailyQuery);
    if (dailySnap.size >= 3) throw new Error('하루 최대 3끼까지 기록할 수 있습니다.');

    // 4. 검증 통과 → 저장
    const newRef = doc(collection(db, 'meals', userId, 'entries'));
    transaction.set(newRef, {
      mealId: newRef.id,
      userId,
      timestamp: serverTimestamp(),
      imageUrl,
      imageHash: imageHash || null,
      items,
      totalScore,
      inputMethod,
    });
    return newRef;
  });

  return entryRef.id;
};

/**
 * 특정 날짜의 식단 목록 조회
 */
export const getMealsByDate = async (userId, date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const q = query(
    collection(db, 'meals', userId, 'entries'),
    where('timestamp', '>=', start),
    where('timestamp', '<=', end),
    orderBy('timestamp', 'asc')
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
