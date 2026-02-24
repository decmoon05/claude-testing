import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { scoreToGrade } from '../../utils/novaScore';
import { theme } from '../../styles/theme';

const GRADE_COLORS = {
  S: '#4CAF50',
  A: '#8BC34A',
  B: '#FFC107',
  C: '#FF9800',
  D: '#F44336',
};

/**
 * 원형 게이지로 비정제지수 점수 표시
 */
const ScoreGauge = ({ score, size = 140 }) => {
  const grade = scoreToGrade(score ?? 0);
  const color = GRADE_COLORS[grade];
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = ((score ?? 0) / 100) * circumference;
  const center = size / 2;

  return (
    <View style={styles.container} accessibilityLabel={`비정제지수 ${score}점 ${grade}등급`}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.6" />
          </LinearGradient>
        </Defs>
        {/* 배경 원 */}
        <Circle
          cx={center} cy={center} r={radius}
          stroke="#E8E8E8" strokeWidth={12} fill="none"
        />
        {/* 점수 원호 */}
        <Circle
          cx={center} cy={center} r={radius}
          stroke="url(#scoreGrad)" strokeWidth={12} fill="none"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>

      <View style={[styles.innerContent, { width: size, height: size }]}>
        <Text style={[styles.gradeText, { color }]}>{grade}</Text>
        <Text style={styles.scoreText}>{score ?? '--'}</Text>
        <Text style={styles.scoreLabel}>점</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  innerContent: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center',
  },
  gradeText: { fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  scoreText: { fontSize: 28, fontWeight: '800', color: theme.colors.text, lineHeight: 32 },
  scoreLabel: { fontSize: 13, color: theme.colors.textSecondary },
});

export default ScoreGauge;
