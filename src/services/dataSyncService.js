import { deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import { listAiChats } from './aiChatService';
import { listUserBadges } from './badgeService';
import { listSchedules, buildCalendarData } from './calendarService';
import { listEmotionRecords } from './emotionService';
import { listFailureRecords } from './failureService';
import { userCollection, userDocument } from './firebaseDataHelpers';
import { getPointBalance } from './pointService';
import { getUserSettings } from './settingsService';
import { listStudyRecords } from './studyRecordService';
import { listTodos } from './todoService';
import { getCurrentUserIdHint } from './authService';

export const USER_CACHE_KEYS = [
  'study_records',
  'emotion_logs',
  'failure_logs',
  'user_points',
  'last_earned_points',
  'app_settings',
  'study_streak',
  'user_subjects',
  'user_notifications',
  'studyfit_calendar_items',
  'studyfit_accent_fallback',
  'owned_badges',
  'selected_badge_id',
  'ad_last_watched_at',
  'ai_coach_chat',
];

const USER_CACHE_NAMESPACE = 'studyfit_user_cache:';

const getUserCacheKey = (userId) => `${USER_CACHE_NAMESPACE}${userId}`;

const readSnapshot = (userId) => {
  try {
    return JSON.parse(localStorage.getItem(getUserCacheKey(userId)) || '{}');
  } catch {
    return {};
  }
};

const writeSnapshot = (userId, snapshot) => {
  localStorage.setItem(getUserCacheKey(userId), JSON.stringify(snapshot));
};

const saveLocal = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const syncLocalKeyForCurrentUser = (key, value) => {
  const userId = getCurrentUserIdHint();
  if (!userId) return;

  const snapshot = readSnapshot(userId);
  snapshot[key] = JSON.stringify(value);
  writeSnapshot(userId, snapshot);
};

export const persistCurrentCacheForUser = (userId) => {
  if (!userId) return;

  const snapshot = {};
  USER_CACHE_KEYS.forEach((key) => {
    const rawValue = localStorage.getItem(key);
    if (rawValue !== null) {
      snapshot[key] = rawValue;
    }
  });

  writeSnapshot(userId, snapshot);
};

export const restoreUserCache = (userId) => {
  if (!userId) return false;

  const snapshot = readSnapshot(userId);
  const entries = Object.entries(snapshot);

  clearUserCache();

  if (entries.length === 0) return false;

  entries.forEach(([key, rawValue]) => {
    localStorage.setItem(key, rawValue);
  });

  return true;
};

export const clearUserCache = () => {
  USER_CACHE_KEYS.forEach((key) => localStorage.removeItem(key));
};

const clearCollection = async (userId, collectionName) => {
  const collectionRef = userCollection(userId, collectionName);
  const snapshot = await getDocs(collectionRef);

  if (snapshot.empty) return;

  const batch = writeBatch(collectionRef.firestore);
  snapshot.forEach((docSnapshot) => {
    batch.delete(docSnapshot.ref);
  });
  await batch.commit();
};

export const deleteAllUserData = async (userId) => {
  if (!userId) return;

  await Promise.all([
    clearCollection(userId, 'todos'),
    clearCollection(userId, 'schedules'),
    clearCollection(userId, 'studyRecords'),
    clearCollection(userId, 'emotionRecords'),
    clearCollection(userId, 'failureRecords'),
    clearCollection(userId, 'pointLogs'),
    clearCollection(userId, 'badges'),
    clearCollection(userId, 'aiChats'),
    deleteDoc(userDocument(userId, 'settings', 'main')),
    deleteDoc(userDocument(userId, 'points', 'main')),
  ]);
};

export const hydrateUserData = async (userId) => {
  if (!userId) return null;

  const [settings, studyRecords, emotionRecords, failureRecords, todos, schedules, pointBalance, badges, aiChats] = await Promise.all([
    getUserSettings(userId),
    listStudyRecords(userId),
    listEmotionRecords(userId),
    listFailureRecords(userId),
    listTodos(userId),
    listSchedules(userId),
    getPointBalance(userId),
    listUserBadges(userId),
    listAiChats(userId),
  ]);

  clearUserCache();

  if (settings?.settings) saveLocal('app_settings', settings.settings);
  if (settings?.subjects) saveLocal('user_subjects', settings.subjects);
  if (settings?.notifications) saveLocal('user_notifications', settings.notifications);
  if (settings?.selectedBadgeId) saveLocal('selected_badge_id', settings.selectedBadgeId);
  if (settings?.accentColor) saveLocal('studyfit_accent_fallback', settings.accentColor);

  saveLocal('study_records', studyRecords);
  saveLocal('emotion_logs', emotionRecords);
  saveLocal('failure_logs', failureRecords);
  saveLocal('studyfit_calendar_items', buildCalendarData(todos, schedules));
  saveLocal('user_points', pointBalance);
  saveLocal('owned_badges', badges.map((badge) => badge.badge_id));
  saveLocal('ai_coach_chat', aiChats);
  persistCurrentCacheForUser(userId);

  return {
    settings,
    studyRecords,
    emotionRecords,
    failureRecords,
    todos,
    schedules,
    pointBalance,
    badges,
    aiChats,
  };
};
