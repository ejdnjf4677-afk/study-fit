import { deleteDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { timestampToIso, userCollection, userDocument } from './firebaseDataHelpers';

export const listFailureRecords = async (userId) => {
  const snapshot = await getDocs(userCollection(userId, 'failureRecords'));
  return snapshot.docs
    .map((docSnapshot) => {
      const row = docSnapshot.data();
      return {
        id: docSnapshot.id,
        reason: row.reason || '',
        causes: row.causes || [],
        detail: row.detail || '',
        improvement: row.improvement || '',
        note: row.note || '',
        subject: row.subject || '자율 기록',
        durationMinutes: row.duration_minutes || 0,
        targetMinutes: row.target_minutes || 0,
        actualMinutes: row.actual_minutes || 0,
        timestamp: row.recorded_at || timestampToIso(row.created_at) || new Date().toISOString(),
      };
    })
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

export const addFailureRecord = async (userId, record) => {
  const recordId = String(record.id || Date.now());
  await setDoc(userDocument(userId, 'failureRecords', recordId), {
    reason: record.reason || '',
    causes: record.causes || [],
    detail: record.detail || '',
    improvement: record.improvement || '',
    note: record.note || '',
    subject: record.subject || '자율 기록',
    duration_minutes: record.durationMinutes || 0,
    target_minutes: record.targetMinutes || 0,
    actual_minutes: record.actualMinutes || 0,
    recorded_at: record.timestamp || new Date().toISOString(),
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  }, { merge: true });
  return { id: recordId };
};

export const deleteFailureRecord = async (userId, id) => {
  await deleteDoc(userDocument(userId, 'failureRecords', String(id)));
};
