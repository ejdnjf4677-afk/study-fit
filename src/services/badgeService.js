import { getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { patchUserSettings } from './settingsService';
import { userCollection, userDocument } from './firebaseDataHelpers';

export const listUserBadges = async (userId) => {
  const snapshot = await getDocs(userCollection(userId, 'badges'));
  return snapshot.docs
    .map((docSnapshot) => ({
      badge_id: docSnapshot.id,
      ...docSnapshot.data(),
    }))
    .sort((a, b) => String(a.purchasedAt || '').localeCompare(String(b.purchasedAt || '')));
};

export const addUserBadge = async (userId, badgeId) => {
  await setDoc(userDocument(userId, 'badges', badgeId), {
    badgeId,
    purchasedAt: serverTimestamp(),
  }, { merge: true });

  return { badge_id: badgeId };
};

export const setRepresentativeBadge = async (userId, badgeId) => (
  patchUserSettings(userId, { selectedBadgeId: badgeId })
);
