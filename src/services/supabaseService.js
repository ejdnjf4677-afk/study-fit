import { supabase } from '../lib/supabase';

export const DATA_SYNC_ERROR_EVENT = 'studyfit:data-sync-error';

let remoteSyncDisabled = false;
let remoteSyncNoticeShown = false;

export const isSchemaMissingError = (error) => (
  error?.code === 'PGRST205' ||
  error?.message?.includes('schema cache') ||
  error?.message?.includes('Could not find the table')
);

export const isRemoteSyncDisabled = () => remoteSyncDisabled;

export const disableRemoteSync = () => {
  remoteSyncDisabled = true;
};

export const resetRemoteSyncState = () => {
  remoteSyncDisabled = false;
  remoteSyncNoticeShown = false;
};

export const getCurrentUserId = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user?.id) return null;
  return data.user.id;
};

export const notifyDataSyncError = (error) => {
  let message = error?.message || '네트워크 상태를 확인해주세요. 데이터 동기화에 실패했습니다.';

  if (isSchemaMissingError(error)) {
    disableRemoteSync();
    if (remoteSyncNoticeShown) return;
    remoteSyncNoticeShown = true;
    message = 'Supabase 데이터 테이블이 아직 준비되지 않아 이 기기 저장소로 계속 사용하고 있습니다.';
  }

  window.dispatchEvent(new CustomEvent(DATA_SYNC_ERROR_EVENT, { detail: { message } }));
};

export const runForCurrentUser = async (task) => {
  if (remoteSyncDisabled) return null;
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
