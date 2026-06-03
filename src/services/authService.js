import {
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword as firebaseUpdatePassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../lib/firebaseClient';

let currentUserIdHint = null;

const normalizeUser = (user) => {
  if (!user) return null;

  const nickname = user.displayName || user.email?.split('@')[0] || '사용자';

  return {
    uid: user.uid,
    id: user.uid,
    email: user.email,
    displayName: user.displayName || nickname,
    emailVerified: user.emailVerified,
    user_metadata: {
      nickname,
    },
  };
};

const getAuthErrorMessage = (error = {}) => {
  const code = error.code || '';

  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return '이메일 또는 비밀번호가 올바르지 않습니다.';
  }
  if (code === 'auth/email-already-in-use') {
    return '이미 가입된 이메일입니다.';
  }
  if (code === 'auth/weak-password') {
    return '비밀번호는 최소 6자 이상이어야 합니다.';
  }
  if (code === 'auth/invalid-email') {
    return '올바른 이메일 주소를 입력해주세요.';
  }
  if (code === 'auth/missing-password') {
    return '비밀번호를 입력해주세요.';
  }
  if (code === 'auth/too-many-requests') {
    return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
  }
  if (code === 'auth/network-request-failed') {
    return '네트워크 연결을 확인한 뒤 다시 시도해주세요.';
  }
  if (code === 'auth/expired-action-code' || code === 'auth/invalid-action-code') {
    return '비밀번호 재설정 링크가 유효하지 않거나 만료되었습니다.';
  }

  return error.message || '인증 처리 중 문제가 발생했습니다.';
};

const waitForInitialAuth = async () => {
  if (typeof auth.authStateReady === 'function') {
    await auth.authStateReady();
    return;
  }

  await new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      unsubscribe();
      resolve();
    });
  });
};

export const getCurrentUserIdHint = () => currentUserIdHint;

export const setCurrentUserIdHint = (userId) => {
  currentUserIdHint = userId || null;
};

export const getCurrentUser = async () => {
  await waitForInitialAuth();
  const user = normalizeUser(auth.currentUser);
  currentUserIdHint = user?.uid || null;
  return user;
};

export const getCurrentSession = async () => {
  const user = await getCurrentUser();
  return user ? { user } : null;
};

export const subscribeToAuthChanges = (callback) => (
  onAuthStateChanged(auth, (user) => {
    const normalizedUser = normalizeUser(user);
    currentUserIdHint = normalizedUser?.uid || null;
    callback(normalizedUser);
  })
);

export const signUpWithEmail = async ({ email, password, nickname }) => {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const trimmedNickname = nickname?.trim() || email.split('@')[0];

    await updateProfile(credential.user, {
      displayName: trimmedNickname,
    });

    const user = normalizeUser({
      ...credential.user,
      displayName: trimmedNickname,
    });

    currentUserIdHint = user.uid;

    return {
      success: true,
      user,
      session: true,
      message: '회원가입이 완료되었어요.',
    };
  } catch (error) {
    return { success: false, message: getAuthErrorMessage(error) };
  }
};

export const signInWithEmail = async ({ email, password }) => {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const user = normalizeUser(credential.user);
    currentUserIdHint = user.uid;
    return { success: true, user, session: true };
  } catch (error) {
    return { success: false, message: getAuthErrorMessage(error) };
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
    currentUserIdHint = null;
    return { success: true };
  } catch (error) {
    return { success: false, message: getAuthErrorMessage(error) };
  }
};

export const updateNickname = async (nickname) => {
  const trimmedNickname = nickname.trim();

  if (!trimmedNickname) {
    return { success: false, message: '닉네임을 입력해주세요.' };
  }

  if (!auth.currentUser) {
    return { success: false, message: '로그인 상태를 다시 확인해주세요.' };
  }

  try {
    await updateProfile(auth.currentUser, { displayName: trimmedNickname });
    const user = normalizeUser({
      ...auth.currentUser,
      displayName: trimmedNickname,
    });
    currentUserIdHint = user.uid;
    return { success: true, user, message: '닉네임이 변경되었어요.' };
  } catch (error) {
    return { success: false, message: getAuthErrorMessage(error) };
  }
};

export const sendPasswordResetEmail = async ({ email, redirectTo }) => {
  try {
    const actionCodeSettings = redirectTo
      ? { url: redirectTo }
      : undefined;

    await firebaseSendPasswordResetEmail(auth, email, actionCodeSettings);
    return {
      success: true,
      message: '비밀번호 재설정 메일을 보냈습니다. 이메일을 확인해주세요.',
    };
  } catch (error) {
    return { success: false, message: getAuthErrorMessage(error) };
  }
};

export const getPasswordResetCodeFromUrl = () => (
  new URLSearchParams(window.location.search).get('oobCode')
);

export const updatePassword = async (password, oobCode = getPasswordResetCodeFromUrl()) => {
  try {
    if (oobCode) {
      await confirmPasswordReset(auth, oobCode, password);
    } else if (auth.currentUser) {
      await firebaseUpdatePassword(auth.currentUser, password);
    } else {
      return { success: false, message: '비밀번호를 변경할 수 있는 인증 정보가 없습니다.' };
    }

    return {
      success: true,
      message: '비밀번호가 변경되었습니다. 다시 로그인해주세요.',
    };
  } catch (error) {
    return { success: false, message: getAuthErrorMessage(error) };
  }
};
