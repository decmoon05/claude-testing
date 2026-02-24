import { useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { subscribeAuthState, loginWithEmail, registerWithEmail, logout, parseAuthError } from '../services/firebase/auth';
import useAuthStore from '../store/authStore';

/**
 * 인증 커스텀 훅
 * - 앱 시작 시 자동 로그인 상태 복원
 * - 로그인/회원가입/로그아웃 액션 제공
 */
const useAuth = () => {
  const { user, profile, isLoading, setUser, setProfile, setLoading, clearAuth } = useAuthStore();

  useEffect(() => {
    const unsubscribe = subscribeAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          // Firestore에서 프로필 로드
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          setProfile(snap.exists() ? snap.data() : null);
        } catch (error) {
          // 네트워크 오류 등으로 프로필 로드 실패 시 로그아웃 처리
          console.error('프로필 로드 실패:', error);
          clearAuth();
        }
      } else {
        clearAuth();
      }
      setLoading(false);
    });

    return unsubscribe; // 컴포넌트 언마운트 시 구독 해제
  }, []);

  const signIn = async ({ email, password }) => {
    try {
      await loginWithEmail({ email, password });
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  };

  const signUp = async ({ email, password, nickname }) => {
    try {
      await registerWithEmail({ email, password, nickname });
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  };

  const signOut = async () => {
    try {
      await logout();
    } catch {
      // 로그아웃 실패는 로컬 상태만 초기화
      clearAuth();
    }
  };

  return { user, profile, isLoading, signIn, signUp, signOut };
};

export default useAuth;
