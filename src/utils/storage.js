import { getCurrentUserIdHint } from '../services/authService';
import { replaceAiChats } from '../services/aiChatService';
import { addUserBadge, setRepresentativeBadge } from '../services/badgeService';
import { deleteAllUserData, syncLocalKeyForCurrentUser } from '../services/dataSyncService';
import { addEmotionRecord, deleteEmotionRecord } from '../services/emotionService';
import { addFailureRecord, deleteFailureRecord } from '../services/failureService';
import { addPointTransaction, setPointBalance } from '../services/pointService';
import { patchUserSettings } from '../services/settingsService';
import { addStudyRecord, deleteStudyRecord } from '../services/studyRecordService';
import { POINTS } from './logic';

const runRemoteSync = async (task) => {
  const userId = getCurrentUserIdHint();
  if (!userId) return null;

  try {
    return await task(userId);
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const loadData = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Failed to load', key, error);
    return defaultValue;
  }
};

export const saveData = (key, data) => {
  try {
    const previous = loadData(key, null);
    localStorage.setItem(key, JSON.stringify(data));
    syncLocalKeyForCurrentUser(key, data);
    syncKnownKey(key, data, previous);
  } catch (error) {
    console.error('Failed to save', key, error);
  }
};

const syncKnownKey = (key, data, previous) => {
  if (key === 'user_points') {
    runRemoteSync((userId) => setPointBalance(userId, data));
    const delta = Number(data || 0) - Number(previous || 0);
    if (delta !== 0) {
      runRemoteSync((userId) => addPointTransaction(userId, delta, delta > 0 ? 'point_earned' : 'point_spent'));
    }
  }

  if (key === 'owned_badges' && Array.isArray(data)) {
    data.forEach((badgeId) => {
      runRemoteSync((userId) => addUserBadge(userId, badgeId));
    });
  }

  if (key === 'selected_badge_id' && data) {
    runRemoteSync((userId) => setRepresentativeBadge(userId, data));
  }

  if (key === 'user_subjects') {
    runRemoteSync((userId) => patchUserSettings(userId, { subjects: data }));
  }

  if (key === 'user_notifications') {
    runRemoteSync((userId) => patchUserSettings(userId, { notifications: data }));
  }

  if (key === 'app_settings') {
    runRemoteSync((userId) => patchUserSettings(userId, { settings: data, theme: data?.theme || null }));
  }

  if (key === 'ai_coach_chat' && Array.isArray(data)) {
    runRemoteSync((userId) => replaceAiChats(userId, data));
  }
};

const KEYS = {
  RECORDS: 'study_records',
  EMOTIONS: 'emotion_logs',
  FAILURES: 'failure_logs',
  POINTS: 'user_points',
  LAST_POINTS: 'last_earned_points',
  SETTINGS: 'app_settings',
  STREAK: 'study_streak',
  SUBJECTS: 'user_subjects',
  NOTIFICATIONS: 'user_notifications',
};

export const getStudyRecords = () => loadData(KEYS.RECORDS, []);
export const getEmotionLogs = () => loadData(KEYS.EMOTIONS, []);
export const getFailureLogs = () => loadData(KEYS.FAILURES, []);
export const getUserPoints = () => loadData(KEYS.POINTS, 0);
export const getLastEarnedPoints = () => loadData(KEYS.LAST_POINTS, 0);
export const getAppSettings = () => loadData(KEYS.SETTINGS, {
  dailyGoal: 240,
  isPremium: false,
  ipadMode: false,
  ipadOrientation: 'portrait',
  theme: 'light',
});
export const getStreak = () => loadData(KEYS.STREAK, { count: 0, lastDate: null });
export const getSubjects = () => loadData(KEYS.SUBJECTS, ['수학', '영어', '국어', '과학', '사회']);
export const getNotifications = () => loadData(KEYS.NOTIFICATIONS, { studyStart: true, breakTime: true, goalReached: true });

export const saveStudyRecord = (record) => {
  const records = getStudyRecords();
  const newRecord = {
    ...record,
    id: record.id || crypto.randomUUID(),
    timestamp: record.timestamp || new Date().toISOString(),
  };
  records.push(newRecord);
  saveData(KEYS.RECORDS, records);
  runRemoteSync((userId) => addStudyRecord(userId, newRecord));

  if (record.durationMinutes >= 50) {
    addPoints(POINTS.SESSION_50MIN);
  }
};

export const addPoints = (amount) => {
  if (amount <= 0) return;
  const current = getUserPoints();
  const nextPoints = current + amount;
  saveData(KEYS.POINTS, nextPoints);
  saveData(KEYS.LAST_POINTS, amount);
};

export const saveEmotionLog = (log) => {
  const logs = getEmotionLogs();
  const newLog = { ...log, id: log.id || Date.now(), timestamp: log.timestamp || new Date().toISOString() };
  logs.push(newLog);
  saveData(KEYS.EMOTIONS, logs);
  runRemoteSync((userId) => addEmotionRecord(userId, newLog));
  addPoints(POINTS.EMOTION_LOG);
};

export const saveFailureLog = (log) => {
  const logs = getFailureLogs();
  const newLog = { ...log, id: log.id || Date.now(), timestamp: log.timestamp || new Date().toISOString() };
  logs.push(newLog);
  saveData(KEYS.FAILURES, logs);
  runRemoteSync((userId) => addFailureRecord(userId, newLog));
  addPoints(POINTS.FAILURE_LOG);
};

export const saveSubjects = (subjects) => {
  saveData(KEYS.SUBJECTS, subjects);
};

export const saveNotifications = (notifs) => {
  saveData(KEYS.NOTIFICATIONS, notifs);
};

export const saveAppSettings = (settings) => {
  saveData(KEYS.SETTINGS, settings);
};

export const deleteRecord = (key, id) => {
  const data = loadData(key, []);
  const filtered = data.filter((item) => item.id !== id);
  saveData(key, filtered);

  if (key === KEYS.RECORDS) {
    runRemoteSync((userId) => deleteStudyRecord(userId, id));
  }

  if (key === KEYS.EMOTIONS) {
    runRemoteSync((userId) => deleteEmotionRecord(userId, id));
  }

  if (key === KEYS.FAILURES) {
    runRemoteSync((userId) => deleteFailureRecord(userId, id));
  }
};

export const clearAllData = async () => {
  const userId = getCurrentUserIdHint();
  if (userId) {
    await runRemoteSync(() => deleteAllUserData(userId));
  }
  localStorage.clear();
  window.location.reload();
};
