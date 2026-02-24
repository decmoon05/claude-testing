/**
 * Firebase Cloud Function: 월별 성실도 자동 집계 및 환급 확정
 * 매월 1일 00:00 실행
 * 클라이언트 조작 방지를 위해 서버사이드에서만 실행
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();
const SUBSCRIPTION_PRICE = 9900;
const BATCH_SIZE = 100; // api.md §7: 100명씩 배치 처리

/**
 * 성실도 기반 환급 퍼센트 계산 (서버사이드 신뢰 계산)
 */
const calculateRefundPercent = (recordedDays, avgScore) => {
  let percent = 0;
  if (recordedDays >= 25) percent = 50;
  else if (recordedDays >= 20) percent = 30;
  else if (recordedDays >= 15) percent = 10;

  if (percent > 0 && avgScore >= 70) percent += 10;
  return Math.min(60, percent);
};

/**
 * 지난달 기록 집계
 * - 하루 최대 3끼 인정
 */
const aggregateLastMonthRecords = async (userId) => {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const snap = await db
    .collection('meals')
    .doc(userId)
    .collection('entries')
    .where('timestamp', '>=', lastMonth)
    .where('timestamp', '<', thisMonth)
    .orderBy('timestamp', 'asc')
    .get();

  // 날짜별 그룹화 + 하루 3끼 제한 적용
  const byDate = {};
  snap.docs.forEach((doc) => {
    const data = doc.data();
    const dateStr = data.timestamp.toDate().toISOString().split('T')[0];
    if (!byDate[dateStr]) byDate[dateStr] = [];
    if (byDate[dateStr].length < 3) {
      byDate[dateStr].push(data.totalScore ?? 0);
    }
  });

  const recordedDays = Object.keys(byDate).length;
  const allScores = Object.values(byDate).flat();
  const avgScore = allScores.length > 0
    ? Math.round(allScores.reduce((s, v) => s + v, 0) / allScores.length)
    : 0;

  return { recordedDays, avgScore };
};

/**
 * 사용자 1명 처리: 집계 → 저장 → 알림
 */
const processUser = async (userId, lastMonthStr) => {
  const { recordedDays, avgScore } = await aggregateLastMonthRecords(userId);
  const refundPercent = calculateRefundPercent(recordedDays, avgScore);
  const refundAmount = Math.round(SUBSCRIPTION_PRICE * (refundPercent / 100));

  // subscriptions 문서 리셋 (이번 달 카운터 초기화)
  await db.collection('subscriptions').doc(userId).update({
    'currentMonth.recordCount': 0,
    'currentMonth.avgScore': 0,
    'currentMonth.earnedRefund': 0,
  });

  // api.md §: refundHistory는 서브컬렉션으로 분리 (문서 크기 제한 방지)
  await db
    .collection('subscriptions')
    .doc(userId)
    .collection('refundHistory')
    .doc(lastMonthStr)
    .set({
      month: lastMonthStr,
      recordedDays,
      avgScore,
      refundPercent,
      amount: refundAmount,
      calculatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  // FCM 알림 (환급 발생 시에만)
  if (refundAmount > 0) {
    const userDoc = await db.collection('users').doc(userId).get();
    const fcmToken = userDoc.data()?.fcmToken;
    if (fcmToken) {
      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: '환급 포인트가 적립됐어요!',
          body: `지난달 성실도 ${refundPercent}% → ${refundAmount.toLocaleString()}원 적립 완료!`,
        },
      }).catch((err) => {
        // FCM 실패는 환급 처리에 영향 없음
        functions.logger.warn(`FCM failed for ${userId}`, err.message);
      });
    }
  }
};

exports.monthlyRefundCalculation = functions.pubsub
  .schedule('0 0 1 * *')
  .timeZone('Asia/Seoul')
  .onRun(async () => {
    const usersSnap = await db.collection('subscriptions').where('isActive', '==', true).get();
    const userIds = usersSnap.docs.map((d) => d.id);

    const lastMonthStr = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
      .toISOString()
      .slice(0, 7);

    let successCount = 0;
    let failCount = 0;

    // api.md §7: 100명씩 배치 처리 (동시 요청 폭발 방지)
    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      const batch = userIds.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((userId) => processUser(userId, lastMonthStr))
      );
      results.forEach((r) => {
        if (r.status === 'fulfilled') successCount++;
        else {
          failCount++;
          functions.logger.error('processUser failed', r.reason);
        }
      });
    }

    functions.logger.info(`Monthly refund done: ${successCount} success, ${failCount} fail`);
    return null;
  });
