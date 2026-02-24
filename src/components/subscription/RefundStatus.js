import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

/**
 * 이번 달 성실도 현황 컴포넌트
 */
const RefundStatus = ({ currentMonthStats, estimatedRefund, subscriptionPrice = 9900 }) => {
  const { recordCount, avgScore, earnedRefund } = currentMonthStats;
  const estimatedAmount = Math.round(subscriptionPrice * (estimatedRefund / 100));

  const milestones = [
    { days: 15, label: '15일', percent: 10 },
    { days: 20, label: '20일', percent: 30 },
    { days: 25, label: '25일', percent: 50 },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>이번 달 성실도</Text>

      {/* 기록 현황 */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{recordCount}</Text>
          <Text style={styles.statLabel}>기록일 수</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{avgScore ?? '--'}</Text>
          <Text style={styles.statLabel}>평균 비정제지수</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>{estimatedRefund}%</Text>
          <Text style={styles.statLabel}>예상 환급률</Text>
        </View>
      </View>

      {/* 진행 바 */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(100, (recordCount / 25) * 100)}%` }]} />
          {milestones.map(({ days, label, percent }) => (
            <View key={days} style={[styles.milestone, { left: `${(days / 31) * 100}%` }]}>
              <View style={[styles.milestoneMarker, recordCount >= days && styles.milestoneReached]} />
              <Text style={styles.milestoneLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 예상 환급 금액 */}
      <View style={styles.refundAmount}>
        <Text style={styles.refundLabel}>예상 환급 금액</Text>
        <Text style={styles.refundValue}>
          {estimatedAmount.toLocaleString()}원
          {avgScore >= 70 && <Text style={styles.bonusTag}> +10% 보너스 포함</Text>}
        </Text>
        <Text style={styles.refundNote}>* 최종 확정은 매월 1일 Cloud Function이 집계합니다</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 1 },
  title: { fontSize: 15, fontWeight: '700', color: theme.colors.text, marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: theme.colors.text },
  statLabel: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  divider: { width: 1, backgroundColor: '#F0F0F0' },
  progressSection: { marginBottom: 20 },
  progressBar: {
    height: 8, backgroundColor: '#E8E8E8', borderRadius: 4,
    position: 'relative', overflow: 'visible',
  },
  progressFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 4 },
  milestone: { position: 'absolute', alignItems: 'center', top: -2 },
  milestoneMarker: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#C8E6C9', borderWidth: 2, borderColor: '#fff' },
  milestoneReached: { backgroundColor: theme.colors.primary },
  milestoneLabel: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 14, width: 28, textAlign: 'center' },
  refundAmount: { backgroundColor: '#F1F8E9', borderRadius: 10, padding: 14 },
  refundLabel: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 4 },
  refundValue: { fontSize: 20, fontWeight: '800', color: theme.colors.primary },
  bonusTag: { fontSize: 13, color: theme.colors.accent, fontWeight: '600' },
  refundNote: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 6 },
});

export default RefundStatus;
