import { doc, setDoc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { scoreToGrade } from '../../utils/novaScore';

/**
 * 일별 식단 점수를 Firestore에 저장
 */
export const saveDailyScore = async (userId, date, { totalScore, mealScores }) => {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  await setDoc(doc(db, 'dailyScores', userId, 'records', dateStr), {
    date: dateStr,
    totalScore,
    grade: scoreToGrade(totalScore),
    mealScores,
    updatedAt: new Date(),
  });
};

/**
 * 특정 날짜 점수 조회
 */
export const getDailyScore = async (userId, date) => {
  const dateStr = date.toISOString().split('T')[0];
  const snap = await getDoc(doc(db, 'dailyScores', userId, 'records', dateStr));
  return snap.exists() ? snap.data() : null;
};

/**
 * 주간 점수 조회 (최근 7일)
 */
export const getWeeklyScores = async (userId) => {
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  });

  const results = await Promise.all(
    dates.map(async (dateStr) => {
      const snap = await getDoc(doc(db, 'dailyScores', userId, 'records', dateStr));
      return snap.exists() ? snap.data() : { date: dateStr, totalScore: null, grade: null };
    })
  );

  return results.reverse(); // 오래된 날짜 → 최신 순
};

/**
 * 월간 평균 점수 계산
 */
export const getMonthlyAvgScore = async (userId, year, month) => {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const snap = await getDocs(
    query(
      collection(db, 'dailyScores', userId, 'records'),
      where('date', '>=', `${monthStr}-01`),
      where('date', '<=', `${monthStr}-31`)
    )
  );

  const records = snap.docs.map((d) => d.data()).filter((r) => r.totalScore !== null);
  if (records.length === 0) return null;

  const avg = records.reduce((sum, r) => sum + r.totalScore, 0) / records.length;
  return Math.round(avg);
};
