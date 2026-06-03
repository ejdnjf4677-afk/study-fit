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

  await setDoc(userDocument(userId, 'settings', 'main'), payload, { merge: true });
  return getUserSettings(userId);
};

export const upsertUserSettings = patchUserSettings;
