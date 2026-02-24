import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import useAuthStore from '../store/authStore';

/**
 * 구독 상태 관리 훅
 * Firestore 실시간 구독
 */
const useSubscription = () => {
  const { user } = useAuthStore();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = onSnapshot(
      doc(db, 'subscriptions', user.uid),
      (snap) => {
        setSubscription(snap.exists() ? snap.data() : null);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return unsubscribe;
  }, [user?.uid]);

  const isActive = subscription?.isActive ?? false;

  /**
   * 이번 달 성실도 현황
   */
  const currentMonthStats = subscription?.currentMonth ?? {
    recordCount: 0,
    avgScore: 0,
    earnedRefund: 0,
  };

  /**
   * 예상 환급 퍼센트 계산 (클라이언트 미리보기 용도 - 실제 확정은 Cloud Function)
   */
  const estimateRefundPercent = (recordCount, avgScore) => {
    let percent = 0;
    if (recordCount >= 25) percent = 50;
    else if (recordCount >= 20) percent = 30;
    else if (recordCount >= 15) percent = 10;

    if (percent > 0 && avgScore >= 70) percent += 10;
    return Math.min(60, percent);
  };

  const estimatedRefund = estimateRefundPercent(
    currentMonthStats.recordCount,
    currentMonthStats.avgScore
  );

  return {
    subscription,
    loading,
    isActive,
    currentMonthStats,
    estimatedRefund,
    refundHistory: subscription?.refundHistory ?? [],
    SUBSCRIPTION_PRICE: 9900,
  };
};

export default useSubscription;
