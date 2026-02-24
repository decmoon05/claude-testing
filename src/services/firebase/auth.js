import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../config/firebase.config';

/**
 * 이메일/비밀번호 회원가입
 * Firestore에 기본 사용자 프로필 생성
 */
export const registerWithEmail = async ({ email, password, nickname }) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const { uid } = credential.user;

  await setDoc(doc(db, 'users', uid), {
    uid,
    email,
    nickname,
    createdAt: serverTimestamp(),
    healthInfo: {
      conditions: [],   // 식이장애 관련 진단 (선택 입력)
      concerns: [],     // 개인 우려사항
    },
    subscription: {
      isActive: false,
      plan: null,
      startDate: null,
    },
    character: {
      level: 1,
      exp: 0,
      type: 'default',
      streakDays: 0,
      lastRecordDate: null,
      totalMealsLogged: 0,
      avgScore7days: 0,
    },
  });

  return credential.user;
};

/**
 * 이메일/비밀번호 로그인
 */
export const loginWithEmail = async ({ email, password }) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
};

/**
 * 로그아웃
 */
export const logout = () => signOut(auth);

/**
 * 인증 상태 변화 구독 (자동 로그인 유지)
 * @param {function} callback - (user | null) 을 받는 콜백
 * @returns unsubscribe 함수
 */
export const subscribeAuthState = (callback) => onAuthStateChanged(auth, callback);

/**
 * Firebase Auth 에러 코드를 한국어 메시지로 변환
 */
export const parseAuthError = (error) => {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return '이미 사용 중인 이메일입니다.';
    case 'auth/invalid-email':
      return '이메일 형식이 올바르지 않습니다.';
    case 'auth/weak-password':
      return '비밀번호는 6자 이상이어야 합니다.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return '이메일 또는 비밀번호가 올바르지 않습니다.';
    case 'auth/too-many-requests':
      return '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
    default:
      return '오류가 발생했습니다. 다시 시도해주세요.';
  }
};
