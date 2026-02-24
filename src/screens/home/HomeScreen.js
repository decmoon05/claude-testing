import React, { useEffect, useState } from 'react';
import {
  SafeAreaView, View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Modal, Alert,
} from 'react-native';
import { theme } from '../../styles/theme';
import CharacterView from '../../components/character/CharacterView';
import ScoreGauge from '../../components/score/ScoreGauge';
import useCharacter from '../../hooks/useCharacter';
import { getDailyScore } from '../../services/firebase/scoreService';
import useAuthStore from '../../store/authStore';

const HomeScreen = ({ navigation }) => {
  const { user, profile } = useAuthStore();
  const { character, levelInfo, levelUpEvent, clearLevelUpEvent, isTodayRecorded } = useCharacter();
  const [todayScore, setTodayScore] = useState(null);

  useEffect(() => {
    loadTodayScore();
  }, []);

  const loadTodayScore = async () => {
    try {
      const record = await getDailyScore(user.uid, new Date());
      setTodayScore(record?.totalScore ?? null);
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.greeting}>안녕하세요, {profile?.nickname ?? ''}님 👋</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}</Text>
        </View>

        {/* 캐릭터 섹션 */}
        <View style={styles.card}>
          <CharacterView
            character={character}
            levelInfo={levelInfo}
            isTodayRecorded={isTodayRecorded}
          />
        </View>

        {/* 오늘의 비정제지수 */}
        <View style={styles.scoreCard}>
          <Text style={styles.cardTitle}>오늘의 비정제지수</Text>
          <View style={styles.gaugeRow}>
            <ScoreGauge score={todayScore} size={120} />
            <View style={styles.scoreInfo}>
              {todayScore !== null ? (
                <>
                  <Text style={styles.scoreMessage}>
                    {todayScore >= 80 ? '훌륭한 식단이에요!' :
                     todayScore >= 60 ? '조금 더 개선해봐요' : '개선이 필요해요'}
                  </Text>
                  <TouchableOpacity
                    style={styles.detailButton}
                    onPress={() => navigation.navigate('MealList')}
                  >
                    <Text style={styles.detailButtonText}>상세 보기</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.noRecordText}>오늘 식단을 기록해보세요</Text>
              )}
            </View>
          </View>
        </View>

        {/* 빠른 입력 버튼 */}
        <TouchableOpacity
          style={styles.quickInputButton}
          onPress={() => navigation.navigate('MealInput')}
          accessibilityLabel="식단 빠른 입력"
          accessibilityHint="식단 입력 화면으로 이동합니다"
        >
          <Text style={styles.quickInputIcon}>+</Text>
          <Text style={styles.quickInputText}>식단 기록하기</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 레벨업 축하 모달 */}
      <Modal visible={!!levelUpEvent} transparent animationType="fade">
        <View style={styles.levelUpOverlay}>
          <View style={styles.levelUpModal}>
            <Text style={styles.levelUpEmoji}>🎉</Text>
            <Text style={styles.levelUpTitle}>레벨 업!</Text>
            <Text style={styles.levelUpLevel}>Lv. {levelUpEvent?.newLevel}</Text>
            <Text style={styles.levelUpMessage}>꾸준한 식단 관리로 성장했어요!</Text>
            <TouchableOpacity
              style={styles.levelUpButton}
              onPress={clearLevelUpEvent}
              accessibilityLabel="레벨업 축하 확인"
            >
              <Text style={styles.levelUpButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: theme.spacing.horizontal, paddingTop: theme.spacing.vertical, paddingBottom: 32 },
  header: { marginBottom: 20 },
  greeting: { fontSize: 22, fontWeight: '800', color: theme.colors.text },
  date: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 1 },
  scoreCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, elevation: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },
  gaugeRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  scoreInfo: { flex: 1 },
  scoreMessage: { fontSize: 14, color: theme.colors.text, fontWeight: '600', marginBottom: 10 },
  detailButton: { backgroundColor: '#E8F5E9', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14, alignSelf: 'flex-start' },
  detailButtonText: { color: theme.colors.primary, fontSize: 13, fontWeight: '600' },
  noRecordText: { fontSize: 13, color: theme.colors.textSecondary },
  quickInputButton: {
    backgroundColor: theme.colors.primary, borderRadius: 16, paddingVertical: 18,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, minHeight: 44,
  },
  quickInputIcon: { color: '#fff', fontSize: 22, fontWeight: '300' },
  quickInputText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  levelUpOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  levelUpModal: { backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center', width: 280 },
  levelUpEmoji: { fontSize: 48, marginBottom: 8 },
  levelUpTitle: { fontSize: 24, fontWeight: '900', color: theme.colors.text },
  levelUpLevel: { fontSize: 40, fontWeight: '900', color: theme.colors.primary, marginVertical: 8 },
  levelUpMessage: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  levelUpButton: { backgroundColor: theme.colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 40, minHeight: 44 },
  levelUpButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default HomeScreen;
