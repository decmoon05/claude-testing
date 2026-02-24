import { collection, doc, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
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
 */
export const checkMinInterval = async (userId) => {
  const q = query(
    collection(db, 'meals', userId, 'entries'),
    orderBy('timestamp', 'desc')
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
 */
export const saveMealEntry = async (userId, mealData) => {
  const { imageUri, imageHash, items, totalScore, inputMethod } = mealData;

  // 중복 이미지 검사
  if (imageHash) {
    const isDuplicate = await checkDuplicateHash(userId, imageHash);
    if (isDuplicate) throw new Error('이미 등록한 식단입니다.');
  }

  // 기록 간격 검사 (2시간)
  const intervalOk = await checkMinInterval(userId);
  if (!intervalOk) throw new Error('기록 간격이 너무 짧습니다. 2시간 후 다시 시도해주세요.');

  // 하루 3끼 제한
  const dailyCount = await getDailyMealCount(userId);
  if (dailyCount >= 3) throw new Error('하루 최대 3끼까지 기록할 수 있습니다.');

  const mealId = `${userId}_${Date.now()}`;
  let imageUrl = null;

  if (imageUri) {
    imageUrl = await uploadMealImage(userId, imageUri, mealId);
  }

  const entryRef = await addDoc(collection(db, 'meals', userId, 'entries'), {
    mealId,
    userId,
    timestamp: serverTimestamp(),
    imageUrl,
    imageHash: imageHash || null,
    items,
    totalScore,
    inputMethod,
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
