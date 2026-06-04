import { getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { userDocument } from './firebaseDataHelpers';

export const getUserSettings = async (userId) => {
  const snapshot = await getDoc(userDocument(userId, 'settings', 'main'));
  return snapshot.exists() ? snapshot.data() : null;
};

export const patchUserSettings = async (userId, patch = {}) => {
  const payload = {
    updatedAt: serverTimestamp(),
  };

  if (patch.theme !== undefined) payload.theme = patch.theme;
  if (patch.accentColor !== undefined || patch.accent_color !== undefined) {
    payload.accentColor = patch.accentColor ?? patch.accent_color ?? null;
  }
  if (patch.selectedBadgeId !== undefined || patch.selected_badge_id !== undefined) {
    payload.selectedBadgeId = patch.selectedBadgeId ?? patch.selected_badge_id ?? null;
  }
  if (patch.settings !== undefined) payload.settings = patch.settings;
  if (patch.subjects !== undefined) payload.subjects = patch.subjects;
  if (patch.notifications !== undefined) payload.notifications = patch.notifications;
  if (patch.studyStreak !== undefined || patch.study_streak !== undefined) {
    payload.studyStreak = patch.studyStreak ?? patch.study_streak ?? { count: 0, lastDate: null };
  }
  if (patch.lastEarnedPoints !== undefined || patch.last_earned_points !== undefined) {
    payload.lastEarnedPoints = patch.lastEarnedPoints ?? patch.last_earned_points ?? 0;
  }
  if (patch.adLastWatchedAt !== undefined || patch.ad_last_watched_at !== undefined) {
    payload.adLastWatchedAt = patch.adLastWatchedAt ?? patch.ad_last_watched_at ?? null;
  }

  await setDoc(userDocument(userId, 'settings', 'main'), payload, { merge: true });
  return getUserSettings(userId);
};

export const upsertUserSettings = patchUserSettings;
