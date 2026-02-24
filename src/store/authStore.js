import { create } from 'zustand';

/**
 * 인증 전역 상태 (Zustand)
 * - 상태관리 매뉴얼에 따라 하나의 store는 하나의 관심사만 담당
 */
const useAuthStore = create((set) => ({
  user: null,          // Firebase Auth user 객체
  profile: null,       // Firestore 사용자 프로필
  isLoading: true,     // 초기 인증 상태 확인 중

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),

  clearAuth: () => set({ user: null, profile: null, isLoading: false }),
}));

export default useAuthStore;
