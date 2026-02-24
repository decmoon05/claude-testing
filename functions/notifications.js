/**
 * Firebase Cloud Function: FCM 푸시 알림
 * 오늘 식단 미기록 시 저녁 8시 리마인더
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

exports.dailyMealReminder = functions.pubsub
  .schedule('0 20 * * *')   // 매일 저녁 8시
  .timeZone('Asia/Seoul')
  .onRun(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 오늘 식단을 기록하지 않은 활성 사용자 조회
    const usersSnap = await db.collection('users').get();

    const notifications = [];

    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      const fcmToken = userData.fcmToken;
      if (!fcmToken) continue;

      // 오늘 기록 여부 확인
      const mealSnap = await db
        .collection('meals')
        .doc(userDoc.id)
        .collection('entries')
        .where('timestamp', '>=', today)
        .limit(1)
        .get();

      if (mealSnap.empty) {
        notifications.push(
          admin.messaging().send({
            token: fcmToken,
            notification: {
              title: '오늘 식단을 기록해볼까요? 🌿',
              body: `${userData.nickname ?? ''}님, 오늘의 비정제지수를 확인해보세요!`,
            },
            data: {
              screen: 'MealInput',
            },
          })
        );
      }
    }

    await Promise.allSettled(notifications);
    console.log(`Sent reminders to ${notifications.length} users`);
    return null;
  });
