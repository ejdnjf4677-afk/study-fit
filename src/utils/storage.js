// src/utils/storage.js
import { POINTS } from './logic';
import { fireAndForget } from '../services/supabaseService';
import { addStudyRecord, deleteStudyRecord } from '../services/studyRecordService';
import { setPointBalance, addPointTransaction } from '../services/pointService';
import { patchUserSettings } from '../services/userSettingsService';
import { addUserBadge, setRepresentativeBadge } from '../services/badgeService';

export const loadData = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error('Failed to load', key, e);
    return defaultValue;
  }
};

export const saveData = (key, data) => {
  try {
    const previous = loadData(key, null);
    localStorage.setItem(key, JSON.stringify(data));
    syncKnownKey(key, data, previous);
  } catch (e) {
    console.error('Failed to save', key, e);
  }
};

const syncKnownKey = (key, data, previous) => {
  if (key === 'user_points') {
    fireAndForget((userId) => setPointBalance(userId, data));
    const delta = Number(data || 0) - Number(previous || 0);
    if (delta !== 0) {
      fireAndForget((userId) => addPointTransaction(userId, delta, delta > 0 ? 'point_earned' : 'point_spent'));
    }
  }
  if (key === 'owned_badges' && Array.isArray(data)) {
    data.forEach((badgeId) => {
      fireAndForget((userId) => addUserBadge(userId, badgeId));
    });
  }
  if (key === 'selected_badge_id' && data) {
    fireAndForget((userId) => setRepresentativeBadge(userId, data));
  }
};

// Keys
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
export const getAppSettings = () => loadData(KEYS.SETTINGS, { dailyGoal: 240, isPremium: false, ipadMode: false, ipadOrientation: 'portrait' });
export const getStreak = () => loadData(KEYS.STREAK, { count: 0, lastDate: null });
export const getSubjects = () => loadData(KEYS.SUBJECTS, ['수학', '영어', '국어', '과학', '사회']);
export const getNotifications = () => loadData(KEYS.NOTIFICATIONS, { studyStart: true, breakTime: true, goalReached: true });
export const saveStudyRecord = (record) => {
  const records = getStudyRecords();
  const newRecord = {
    ...record,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  records.push(newRecord);
  saveData(KEYS.RECORDS, records);
  fireAndForget((userId) => addStudyRecord(userId, newRecord));
  
  if (record.durationMinutes >= 50) {
    addPoints(POINTS.SESSION_50MIN);
  }
};

export const addPoints = (amount) => {
  if (amount <= 0) return;
  const current = getUserPoints();
  const nextPoints = current + amount;
  saveData(KEYS.POINTS, nextPoints);
  saveData(KEYS.LAST_POINTS, amount); // Store last earned points for ad reward
};

export const saveEmotionLog = (log) => {
  const logs = getEmotionLogs();
  logs.push({ ...log, id: Date.now(), timestamp: new Date().toISOString() });
  saveData(KEYS.EMOTIONS, logs);
  addPoints(POINTS.EMOTION_LOG);
};

export const saveFailureLog = (log) => {
  const logs = getFailureLogs();
  logs.push({ ...log, id: Date.now(), timestamp: new Date().toISOString() });
  saveData(KEYS.FAILURES, logs);
  addPoints(POINTS.FAILURE_LOG);
};

export const saveSubjects = (subjects) => {
  saveData(KEYS.SUBJECTS, subjects);
  fireAndForget((userId) => patchUserSettings(userId, { subjects }));
};

export const saveNotifications = (notifs) => {
  saveData(KEYS.NOTIFICATIONS, notifs);
  fireAndForget((userId) => patchUserSettings(userId, { notifications: notifs }));
};

export const saveAppSettings = (settings) => {
  saveData(KEYS.SETTINGS, settings);
  fireAndForget((userId) => patchUserSettings(userId, { settings, theme: settings.theme || null }));
};

export const deleteRecord = (key, id) => {
  const data = loadData(key, []);
  const filtered = data.filter(item => item.id !== id);
  saveData(key, filtered);
  if (key === KEYS.RECORDS) {
    fireAndForget((userId) => deleteStudyRecord(userId, id));
  }
};

export const clearAllData = () => {
  localStorage.clear();
  window.location.reload();
};
