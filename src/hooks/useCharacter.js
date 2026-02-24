import { useEffect } from 'react';
import { doc, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { calculateLevelInfo, calculateEarnedExp, updateStreak, detectLevelUp } from '../utils/gamification';
import useAuthStore from '../store/authStore';
import useCharacterStore from '../store/characterStore';

/**
 * 캐릭터/게이미피케이션 커스텀 훅
 * Firestore 실시간 업데이트 구독
 */
const useCharacter = () => {
  const { user } = useAuthStore();
  const { character, levelUpEvent, setCharacter, setLevelUpEvent, clearLevelUpEvent } = useCharacterStore();

  useEffect(() => {
    if (!user?.uid) return;

    // Firestore 실시간 구독
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        setCharacter(snap.data().character);
      }
    });

    return unsubscribe;
  }, [user?.uid]);

  /**
   * 식단 기록 후 EXP 및 스트릭 업데이트
   */
  const onMealLogged = async ({ score, usedAI = false }) => {
    if (!user?.uid || !character) return;

    const { newStreakDays, isStreak7Days } = updateStreak(character);
    const { total: earnedExp, breakdown } = calculateEarnedExp({
      score,
      isStreak7Days,
      usedAI,
    });

    const prevExp = character.exp;
    const newExp = prevExp + earnedExp;
    const levelInfo = calculateLevelInfo(newExp);

    const levelUpInfo = detectLevelUp(prevExp, newExp);

    await updateDoc(doc(db, 'users', user.uid), {
      'character.exp': newExp,
      'character.level': levelInfo.level,
      'character.streakDays': newStreakDays,
      'character.lastRecordDate': new Date().toISOString(),
      'character.totalMealsLogged': increment(1),
    });

    if (levelUpInfo) {
      setLevelUpEvent(levelUpInfo);
    }

    return { earnedExp, breakdown, levelUpInfo };
  };

  const levelInfo = character ? calculateLevelInfo(character.exp) : null;

  const isTodayRecorded = () => {
    if (!character?.lastRecordDate) return false;
    const last = new Date(character.lastRecordDate).toDateString();
    return last === new Date().toDateString();
  };

  return {
    character,
    levelInfo,
    levelUpEvent,
    clearLevelUpEvent,
    onMealLogged,
    isTodayRecorded: isTodayRecorded(),
  };
};

export default useCharacter;
