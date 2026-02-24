import React from 'react';
import {
  SafeAreaView, View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Alert,
} from 'react-native';
import { theme } from '../../styles/theme';
import RefundStatus from '../../components/subscription/RefundStatus';
import useSubscription from '../../hooks/useSubscription';

const SubscriptionScreen = () => {
  const { subscription, isActive, currentMonthStats, estimatedRefund, refundHistory, SUBSCRIPTION_PRICE } = useSubscription();

  const handleSubscribe = () => {
    // 실제 인앱 결제 연동 시 구현 (예: react-native-iap)
    Alert.alert('구독 안내', `월 ${SUBSCRIPTION_PRICE.toLocaleString()}원으로 AI 코칭과 환급 혜택을 받으세요.\n\n(결제 모듈 연동 예정)`);
  };

  const handleUnsubscribe = () => {
    Alert.alert('구독 해지', '구독을 해지하면 AI 코칭과 환급 혜택이 중단됩니다.\n정말 해지하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '해지', style: 'destructive', onPress: () => { /* 해지 API 호출 */ } },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>구독 관리</Text>

        {/* 구독 상태 카드 */}
        <View style={[styles.statusCard, isActive ? styles.statusActive : styles.statusInactive]}>
          <Text style={styles.statusBadge}>{isActive ? '구독 중' : '미구독'}</Text>
          <Text style={styles.planPrice}>
            {isActive ? `월 ${SUBSCRIPTION_PRICE.toLocaleString()}원` : '구독이 필요합니다'}
          </Text>
          {isActive && subscription?.startDate && (
            <Text style={styles.startDate}>
              {new Date(subscription.startDate).toLocaleDateString('ko-KR')}부터 구독 중
            </Text>
          )}
        </View>

        {/* 구독 혜택 안내 */}
        <View style={styles.benefitCard}>
          <Text style={styles.cardTitle}>구독 혜택</Text>
          {[
            { icon: '🤖', text: 'AI 코칭 무제한 이용' },
            { icon: '💰', text: '성실도에 따라 구독료 최대 50% 환급' },
            { icon: '📊', text: '주간/월간 상세 분석 리포트' },
            { icon: '🎯', text: '맞춤형 식단 개선 추천' },
          ].map(({ icon, text }) => (
            <View key={text} style={styles.benefitRow}>
              <Text style={styles.benefitIcon}>{icon}</Text>
              <Text style={styles.benefitText}>{text}</Text>
            </View>
          ))}
        </View>

        {/* 환급 조건 */}
        <View style={styles.refundRuleCard}>
          <Text style={styles.cardTitle}>환급 조건</Text>
          {[
            { days: '25일 이상', percent: '50%', bonus: false },
            { days: '20~24일', percent: '30%', bonus: false },
            { days: '15~19일', percent: '10%', bonus: false },
            { days: '+ 평균 비정제지수 70점 이상', percent: '+10%', bonus: true },
          ].map(({ days, percent, bonus }) => (
            <View key={days} style={styles.ruleRow}>
              <Text style={[styles.ruleDay, bonus && styles.bonusText]}>{days}</Text>
              <Text style={[styles.rulePercent, bonus && styles.bonusText]}>{percent} 환급</Text>
            </View>
          ))}
        </View>

        {/* 이번 달 현황 */}
        {isActive && (
          <RefundStatus
            currentMonthStats={currentMonthStats}
            estimatedRefund={estimatedRefund}
            subscriptionPrice={SUBSCRIPTION_PRICE}
          />
        )}

        {/* 환급 내역 */}
        {refundHistory.length > 0 && (
          <View style={styles.historyCard}>
            <Text style={styles.cardTitle}>환급 내역</Text>
            {refundHistory.map((record, i) => (
              <View key={i} style={styles.historyRow}>
                <Text style={styles.historyMonth}>{record.month}</Text>
                <Text style={styles.historyAmount}>{record.amount.toLocaleString()}원</Text>
              </View>
            ))}
          </View>
        )}

        {/* CTA 버튼 */}
        {isActive ? (
          <TouchableOpacity
            style={styles.unsubscribeButton}
            onPress={handleUnsubscribe}
            accessibilityLabel="구독 해지"
          >
            <Text style={styles.unsubscribeText}>구독 해지</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={handleSubscribe}
            accessibilityLabel="구독 시작"
            accessibilityHint="월 9,900원으로 구독을 시작합니다"
          >
            <Text style={styles.subscribeText}>월 {SUBSCRIPTION_PRICE.toLocaleString()}원으로 시작하기</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: theme.spacing.horizontal, paddingTop: theme.spacing.vertical, paddingBottom: 40 },
  header: { fontSize: 22, fontWeight: '800', color: theme.colors.text, marginBottom: 20 },
  statusCard: { borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center' },
  statusActive: { backgroundColor: theme.colors.primary },
  statusInactive: { backgroundColor: '#F5F5F5' },
  statusBadge: { color: '#fff', fontWeight: '700', fontSize: 13, backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  planPrice: { color: '#fff', fontSize: 24, fontWeight: '900' },
  startDate: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 },
  benefitCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  benefitIcon: { fontSize: 18, marginRight: 10 },
  benefitText: { fontSize: 14, color: theme.colors.text },
  refundRuleCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 1 },
  ruleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  ruleDay: { fontSize: 14, color: theme.colors.text },
  rulePercent: { fontSize: 14, fontWeight: '700', color: theme.colors.primary },
  bonusText: { color: theme.colors.accent },
  historyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 1 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  historyMonth: { fontSize: 14, color: theme.colors.text },
  historyAmount: { fontSize: 14, fontWeight: '700', color: theme.colors.primary },
  subscribeButton: { backgroundColor: theme.colors.primary, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 8, minHeight: 44 },
  subscribeText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  unsubscribeButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8, minHeight: 44 },
  unsubscribeText: { color: theme.colors.textSecondary, fontSize: 15 },
});

export default SubscriptionScreen;
