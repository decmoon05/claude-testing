import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { analyzeScoreFactors } from '../../utils/novaScore';
import { theme } from '../../styles/theme';

/**
 * 점수 하락 원인 분석 및 항목별 피드백 컴포넌트
 */
const ScoreBreakdown = ({ items = [], totalScore }) => {
  const factors = analyzeScoreFactors(items);

  if (factors.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.goodMessage}>훌륭해요! 오늘 식단에 큰 문제가 없어요.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>점수 분석</Text>
      {factors.map((factor, index) => (
        <View key={index} style={styles.factorRow}>
          <View style={styles.factorLeft}>
            <Text style={styles.itemName}>{factor.item}</Text>
            <Text style={styles.reason}>{factor.reason}</Text>
          </View>
          <Text style={styles.impact}>{factor.impact}점</Text>
        </View>
      ))}

      <View style={styles.tipSection}>
        <Text style={styles.tipTitle}>개선 팁</Text>
        {factors.slice(0, 2).map((factor, index) => (
          <Text key={index} style={styles.tip}>
            • {factor.item} → {getSuggestion(factor.reason)}
          </Text>
        ))}
      </View>
    </View>
  );
};

const getSuggestion = (reason) => {
  if (reason.includes('초가공식품')) return '가공되지 않은 자연식품으로 교체해보세요';
  if (reason.includes('나트륨')) return '저염 식품이나 신선 채소로 대체해보세요';
  if (reason.includes('당류')) return '과일이나 무가당 식품으로 바꿔보세요';
  if (reason.includes('트랜스지방')) return '자연 지방(아보카도, 견과류)으로 대체해보세요';
  return '더 자연에 가까운 식품을 선택해보세요';
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: theme.spacing.horizontal, paddingVertical: 16 },
  goodMessage: { fontSize: 15, color: theme.colors.primary, textAlign: 'center', fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },
  factorRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  factorLeft: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  reason: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  impact: { fontSize: 14, color: theme.colors.error, fontWeight: '700' },
  tipSection: { marginTop: 16, backgroundColor: '#FFF8F0', borderRadius: 10, padding: 12 },
  tipTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.accent, marginBottom: 8 },
  tip: { fontSize: 13, color: theme.colors.text, lineHeight: 20, marginBottom: 4 },
});

export default ScoreBreakdown;
