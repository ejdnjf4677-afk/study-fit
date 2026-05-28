import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const missingConfigError = {
  message: 'Supabase URL과 anon key를 .env 파일에 설정해주세요.',
};
const missingConfigQuery = {
  select: () => missingConfigQuery,
  insert: () => missingConfigQuery,
  upsert: () => missingConfigQuery,
  update: () => missingConfigQuery,
  delete: () => missingConfigQuery,
  eq: () => missingConfigQuery,
  maybeSingle: async () => ({ data: null, error: missingConfigError }),
  single: async () => ({ data: null, error: missingConfigError }),
};

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 환경변수가 설정되지 않았습니다. .env 파일을 확인해주세요.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : {
      auth: {
        signUp: async () => ({ data: null, error: missingConfigError }),
        signInWithPassword: async () => ({ data: null, error: missingConfigError }),
        signOut: async () => ({ error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => missingConfigQuery,
    };

export const getUserScopedQuery = (tableName, userId) => (
  supabase
    .from(tableName)
    .select('*')
    .eq('user_id', userId)
);

export const withUserId = (userId, payload) => ({
  ...payload,
  user_id: userId,
});
