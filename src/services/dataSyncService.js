import { listSchedules, buildCalendarData } from './calendarService';
import { listTodos } from './todoService';
import { listStudyRecords } from './studyRecordService';
import { getPointBalance } from './pointService';
import { listUserBadges } from './badgeService';
import { getUserSettings } from './userSettingsService';

const USER_CACHE_KEYS = [
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
  'owned_badges',
  'selected_badge_id',
  'ad_last_watched_at',
];

const saveLocal = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const clearUserCache = () => {
  USER_CACHE_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const hydrateUserData = async (userId) => {
  const [settings, studyRecords, todos, schedules, pointBalance, badges] = await Promise.all([
    getUserSettings(userId),
    listStudyRecords(userId),
    listTodos(userId),
    listSchedules(userId),
    getPointBalance(userId),
    listUserBadges(userId),
  ]);

  clearUserCache();

  if (settings?.settings) saveLocal('app_settings', settings.settings);
  if (settings?.subjects) saveLocal('user_subjects', settings.subjects);
  if (settings?.notifications) saveLocal('user_notifications', settings.notifications);
  if (settings?.selected_badge_id) saveLocal('selected_badge_id', settings.selected_badge_id);
  if (settings?.accent_color) saveLocal('studyfit_accent_fallback', settings.accent_color);

  saveLocal('study_records', studyRecords);
  saveLocal('studyfit_calendar_items', buildCalendarData(todos, schedules));
  saveLocal('user_points', pointBalance);
  saveLocal('owned_badges', badges.map((badge) => badge.badge_id));

  return {
    settings,
    studyRecords,
    todos,
    schedules,
    pointBalance,
    badges,
  };
};
