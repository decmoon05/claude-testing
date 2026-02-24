import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { getCharacterImageKey } from '../../utils/gamification';
import { theme } from '../../styles/theme';

// 레벨별 캐릭터 이미지 매핑 (실제 assets 폴더에 이미지 추가 필요)
const CHARACTER_IMAGES = {
  sad: require('../../../assets/characters/sad.png'),
  beginner: require('../../../assets/characters/beginner.png'),
  intermediate: require('../../../assets/characters/intermediate.png'),
  advanced: require('../../../assets/characters/advanced.png'),
  master: require('../../../assets/characters/master.png'),
  legendary: require('../../../assets/characters/legendary.png'),
};

/**
 * 캐릭터 표시 컴포넌트
 * 레벨 / 상태에 따라 다른 이미지 표시
 */
const CharacterView = ({ character, levelInfo, isTodayRecorded, size = 120 }) => {
  if (!character || !levelInfo) return null;

  const imageKey = getCharacterImageKey(character.level, character.streakDays, isTodayRecorded);

  return (
    <View style={styles.container}>
      <View style={[styles.characterFrame, { width: size + 20, height: size + 20 }]}>
        <Image
          source={CHARACTER_IMAGES[imageKey] ?? CHARACTER_IMAGES.beginner}
          style={{ width: size, height: size }}
          resizeMode="contain"
          accessibilityLabel={`레벨 ${character.level} 캐릭터`}
        />
      </View>

      <Text style={styles.characterNickname}>{character.nickname ?? '나의 몬'}</Text>
      <Text style={styles.levelBadge}>Lv. {character.level}</Text>

      {/* EXP 바 */}
      <View style={styles.expBarContainer}>
        <View style={[styles.expBar, { width: `${levelInfo.progressPercent}%` }]} />
      </View>
      <Text style={styles.expText}>
        {levelInfo.expInLevel} / {levelInfo.requiredExp} EXP
      </Text>

      {/* 연속 기록 스트릭 */}
      <View style={styles.streakRow}>
        <Text style={styles.streakIcon}>{isTodayRecorded ? '🔥' : '💤'}</Text>
        <Text style={styles.streakText}>
          {character.streakDays}일 연속 기록 {isTodayRecorded ? '' : '(오늘 미기록)'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 16 },
  characterFrame: {
    borderRadius: 60, backgroundColor: '#E8F5E9',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  characterNickname: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 2 },
  levelBadge: {
    backgroundColor: theme.colors.primary, color: '#fff',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, fontSize: 12, fontWeight: '700',
    marginBottom: 10,
  },
  expBarContainer: {
    width: 180, height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden', marginBottom: 4,
  },
  expBar: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 4 },
  expText: { fontSize: 11, color: theme.colors.textSecondary, marginBottom: 8 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  streakIcon: { fontSize: 16 },
  streakText: { fontSize: 13, color: theme.colors.textSecondary },
});

export default CharacterView;
