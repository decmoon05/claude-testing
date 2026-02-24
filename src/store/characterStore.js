import { create } from 'zustand';

/**
 * 캐릭터 전역 상태 (Zustand)
 */
const useCharacterStore = create((set) => ({
  character: null,
  levelUpEvent: null, // { newLevel } 레벨업 이벤트 (모달 표시용)

  setCharacter: (character) => set({ character }),
  setLevelUpEvent: (event) => set({ levelUpEvent: event }),
  clearLevelUpEvent: () => set({ levelUpEvent: null }),
}));

export default useCharacterStore;
