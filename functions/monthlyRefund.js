/**
 * Firebase Cloud Function: 월별 성실도 자동 집계 및 환급 확정
 * 매월 1일 00:00 실행
 * 클라이언트 조작 방지를 위해 서버사이드에서만 실행
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();
const SUBSCRIPTION_PRICE = 9900;

/**
 * 성실도 기반 환급 퍼센트 계산 (서버사이드 신뢰 계산)
 */
const calculateRefundPercent = (recordCount, avgScore) => {
  let percent = 0;
  if (recordCount >= 25) percent = 50;
  else if (recordCount >= 20) percent = 30;
  else if (recordCount >= 15) percent = 10;

  // 평균 비정제지수 70점 이상 시 보너스
  if (percent > 0 && avgScore >= 70) percent += 10;
  return Math.min(60, percent);
};

/**
 * 지난달 기록 집계
 * - 하루 최대 3끼 인정
 * - 기록 간 2시간 간격 강제 (이미 saveMealEntry에서 검증됨)
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

exports.monthlyRefundCalculation = functions.pubsub
  .schedule('0 0 1 * *')  // 매월 1일 00:00
  .timeZone('Asia/Seoul')
  .onRun(async () => {
    const usersSnap = await db.collection('subscriptions').where('isActive', '==', true).get();

    const promises = usersSnap.docs.map(async (doc) => {
      const userId = doc.id;
      try {
        const { recordedDays, avgScore } = await aggregateLastMonthRecords(userId);
        const refundPercent = calculateRefundPercent(recordedDays, avgScore);
        const refundAmount = Math.round(SUBSCRIPTION_PRICE * (refundPercent / 100));

        const lastMonthStr = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
          .toISOString()
          .slice(0, 7);

        await db.collection('subscriptions').doc(userId).update({
          'currentMonth.recordCount': 0,
          'currentMonth.avgScore': 0,
          'currentMonth.earnedRefund': 0,
          refundHistory: admin.firestore.FieldValue.arrayUnion({
            month: lastMonthStr,
            recordedDays,
            avgScore,
            refundPercent,
            amount: refundAmount,
            calculatedAt: new Date().toISOString(),
          }),
        });

        // 푸시 알림 발송 (FCM)
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
            });
          }
        }
      } catch (error) {
        console.error(`Failed to process userId: ${userId}`, error);
      }
    });

    await Promise.all(promises);
    console.log(`Monthly refund processed for ${usersSnap.size} users`);
    return null;
  });
