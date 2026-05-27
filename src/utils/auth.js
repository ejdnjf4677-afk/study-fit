import { supabase } from '../lib/supabase';

const getAuthErrorMessage = (message = '') => {
  if (message.includes('Invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않습니다.';
  if (message.includes('User already registered')) return '이미 가입된 이메일입니다.';
  if (message.includes('Password should be at least')) return '비밀번호는 최소 6자 이상이어야 합니다.';
  if (message.includes('Email not confirmed')) return '이메일 인증 후 로그인해주세요.';
  return message || '인증 처리 중 문제가 발생했습니다.';
};

export const signUpWithEmail = async ({ email, password, nickname }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nickname: nickname || email.split('@')[0],
      },
    },
  });

  if (error) {
    return { success: false, message: getAuthErrorMessage(error.message) };
  }

  return {
    success: true,
    user: data.user,
    session: data.session,
    message: data.session
      ? '회원가입이 완료되었습니다.'
      : '회원가입이 완료되었습니다. 이메일 인증이 필요하면 메일함을 확인해주세요.',
  };
};

export const signInWithEmail = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { success: false, message: getAuthErrorMessage(error.message) };
  }

  return { success: true, user: data.user, session: data.session };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) return { success: false, message: getAuthErrorMessage(error.message) };
  return { success: true };
};

export const sendPasswordResetEmail = async ({ email, redirectTo }) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    return { success: false, message: getAuthErrorMessage(error.message) };
  }

  return {
    success: true,
    message: '비밀번호 재설정 메일을 보냈습니다. 이메일을 확인해주세요.',
  };
};

export const updatePassword = async (password) => {
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { success: false, message: getAuthErrorMessage(error.message) };
  }

  return {
    success: true,
    message: '비밀번호가 변경되었습니다. 다시 로그인해주세요.',
  };
};

export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session;
};

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
};
