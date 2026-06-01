import { supabase } from '../lib/supabase';

export const DATA_SYNC_ERROR_EVENT = 'studyfit:data-sync-error';

export const getCurrentUserId = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user?.id) return null;
  return data.user.id;
};

export const notifyDataSyncError = (error) => {
  const message = error?.message || '네트워크 상태를 확인해주세요. 데이터 동기화에 실패했습니다.';
  window.dispatchEvent(new CustomEvent(DATA_SYNC_ERROR_EVENT, { detail: { message } }));
};

export const runForCurrentUser = async (task) => {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  return task(userId);
};

export const fireAndForget = (task) => {
  runForCurrentUser(task).catch((error) => {
    console.error(error);
    notifyDataSyncError(error);
  });
};
