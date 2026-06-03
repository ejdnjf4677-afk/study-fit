import { deleteDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { timestampToIso, userCollection, userDocument } from './firebaseDataHelpers';

export const listEmotionRecords = async (userId) => {
  const snapshot = await getDocs(userCollection(userId, 'emotionRecords'));
  return snapshot.docs
    .map((docSnapshot) => {
      const row = docSnapshot.data();
      return {
        id: docSnapshot.id,
        emotion: row.emotion,
        intensity: row.intensity ?? 50,
        reason: row.reason || '',
        note: row.note || '',
        subject: row.subject || '자율 기록',
        durationMinutes: row.duration_minutes || 0,
        timestamp: row.recorded_at || timestampToIso(row.created_at) || new Date().toISOString(),
      };
    })
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

export const addEmotionRecord = async (userId, record) => {
  const recordId = String(record.id || Date.now());
  await setDoc(userDocument(userId, 'emotionRecords', recordId), {
    emotion: record.emotion,
    intensity: record.intensity ?? 50,
    reason: record.reason || '',
    note: record.note || '',
    subject: record.subject || '자율 기록',
    duration_minutes: record.durationMinutes || record.duration || 0,
    recorded_at: record.timestamp || new Date().toISOString(),
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  }, { merge: true });
  return { id: recordId };
};

export const deleteEmotionRecord = async (userId, id) => {
  await deleteDoc(userDocument(userId, 'emotionRecords', String(id)));
};
