/**
 * 게이미피케이션 로직: 경험치, 레벨, 스트릭 계산
 */

// ─── EXP 획득 조건 ────────────────────────────────────────────────────
export const EXP_REWARDS = {
  MEAL_LOGGED: 10,         // 식단 기록 1회
  HIGH_SCORE_BONUS: 20,    // 비정제지수 80점 이상
  STREAK_7_DAYS: 100,      // 7일 연속 기록
  AI_COACHING: 5,          // AI 코칭 1회 이용
};

/**
 * 레벨 업에 필요한 누적 EXP (level × 100)
 */
export const requiredExpForLevel = (level) => level * 100;

/**
 * 총 EXP로 현재 레벨과 레벨 내 진행도 계산
 * @param {number} totalExp
 * @returns {{ level, expInLevel, requiredExp, progressPercent }}
 */
export const calculateLevelInfo = (totalExp) => {
  let level = 1;
  let remaining = totalExp;

  while (remaining >= requiredExpForLevel(level)) {
    remaining -= requiredExpForLevel(level);
    level++;
    if (level >= 50) break; // 최대 레벨 50
  }

  const required = requiredExpForLevel(level);
  return {
    level,
    expInLevel: remaining,
    requiredExp: required,
    progressPercent: Math.min(100, Math.round((remaining / required) * 100)),
  };
};

/**
 * 식단 기록에 따른 EXP 계산
 * @param {{ score, isStreak7Days, usedAI }} params
 * @returns {{ total, breakdown }}
 */
export const calculateEarnedExp = ({ score = 0, isStreak7Days = false, usedAI = false }) => {
  const breakdown = [{ reason: '식단 기록', exp: EXP_REWARDS.MEAL_LOGGED }];

  if (score >= 80) {
    breakdown.push({ reason: '비정제지수 80점 이상', exp: EXP_REWARDS.HIGH_SCORE_BONUS });
  }
  if (isStreak7Days) {
    breakdown.push({ reason: '7일 연속 기록 달성!', exp: EXP_REWARDS.STREAK_7_DAYS });
  }
  if (usedAI) {
    breakdown.push({ reason: 'AI 코칭 이용', exp: EXP_REWARDS.AI_COACHING });
  }

  return {
    total: breakdown.reduce((sum, b) => sum + b.exp, 0),
    breakdown,
  };
};

/**
 * 스트릭 업데이트: 연속 기록일 계산
 * @param {{ streakDays, lastRecordDate }} character
 * @returns {{ newStreakDays, isStreak7Days }}
 */
export const updateStreak = (character) => {
  const today = new Date().toDateString();
  const lastDate = character.lastRecordDate
    ? new Date(character.lastRecordDate).toDateString()
    : null;

  if (!lastDate) {
    return { newStreakDays: 1, isStreak7Days: false };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (lastDate === today) {
    // 오늘 이미 기록함 → 스트릭 유지
    return { newStreakDays: character.streakDays, isStreak7Days: false };
  }

  if (lastDate === yesterday.toDateString()) {
    // 어제 기록함 → 연속
    const newStreakDays = character.streakDays + 1;
    return { newStreakDays, isStreak7Days: newStreakDays % 7 === 0 };
  }

  // 하루 이상 건너뜀 → 스트릭 리셋
  return { newStreakDays: 1, isStreak7Days: false };
};

/**
 * 레벨업 여부 감지
 * @param {number} prevTotalExp
 * @param {number} newTotalExp
 * @returns {{ leveledUp: boolean, newLevel: number } | null}
 */
export const detectLevelUp = (prevTotalExp, newTotalExp) => {
  const prev = calculateLevelInfo(prevTotalExp);
  const next = calculateLevelInfo(newTotalExp);
  if (next.level > prev.level) {
    return { leveledUp: true, newLevel: next.level };
  }
  return null;
};

/**
 * 레벨에 따른 캐릭터 이미지 키 반환
 */
export const getCharacterImageKey = (level, streakDays, isTodayRecorded) => {
  if (!isTodayRecorded && streakDays === 0) return 'sad';
  if (level >= 40) return 'legendary';
  if (level >= 30) return 'master';
  if (level >= 20) return 'advanced';
  if (level >= 10) return 'intermediate';
  return 'beginner';
};
