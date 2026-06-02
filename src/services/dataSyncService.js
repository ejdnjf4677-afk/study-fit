import { getCurrentUserIdHint } from './supabaseService';

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

export const hydrateUserData = async (userId) => {
  restoreUserCache(userId);
  return null;
};
