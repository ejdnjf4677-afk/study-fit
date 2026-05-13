// src/utils/storage.js
import { calculateConcentrationScore, POINTS } from './logic';

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
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save', key, e);
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
  TODOS: 'user_todos',
};

export const getStudyRecords = () => loadData(KEYS.RECORDS, []);
export const getEmotionLogs = () => loadData(KEYS.EMOTIONS, []);
export const getFailureLogs = () => loadData(KEYS.FAILURES, []);
export const getUserPoints = () => loadData(KEYS.POINTS, 0);
export const getLastEarnedPoints = () => loadData(KEYS.LAST_POINTS, 0);
export const getAppSettings = () => loadData(KEYS.SETTINGS, { dailyGoal: 240, isPremium: false });
export const getStreak = () => loadData(KEYS.STREAK, { count: 0, lastDate: null });
export const getSubjects = () => loadData(KEYS.SUBJECTS, ['수학', '영어', '국어', '과학', '사회']);
export const getNotifications = () => loadData(KEYS.NOTIFICATIONS, { studyStart: true, breakTime: true, goalReached: true });
export const getTodos = () => loadData(KEYS.TODOS, [
  { id: 1, text: '수학 문제 풀이', completed: false },
  { id: 2, text: '영어 단어 암기', completed: false },
  { id: 3, text: '네트워크 강의 수강', completed: false }
]);

export const saveStudyRecord = (record) => {
  const records = getStudyRecords();
  const newRecord = { ...record, id: Date.now(), timestamp: new Date().toISOString() };
  records.push(newRecord);
  saveData(KEYS.RECORDS, records);
  
  if (record.durationMinutes >= 50) {
    addPoints(POINTS.SESSION_50MIN);
  }
};

export const addPoints = (amount) => {
  if (amount <= 0) return;
  const current = getUserPoints();
  saveData(KEYS.POINTS, current + amount);
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

export const saveSubjects = (subjects) => saveData(KEYS.SUBJECTS, subjects);
export const saveNotifications = (notifs) => saveData(KEYS.NOTIFICATIONS, notifs);
export const saveAppSettings = (settings) => saveData(KEYS.SETTINGS, settings);
export const saveTodos = (todos) => saveData(KEYS.TODOS, todos);

export const deleteRecord = (key, id) => {
  const data = loadData(key, []);
  const filtered = data.filter(item => item.id !== id);
  saveData(key, filtered);
};

export const clearAllData = () => {
  localStorage.clear();
  window.location.reload();
};
