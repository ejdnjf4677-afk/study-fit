import { deleteDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { timestampToIso, userCollection, userDocument } from './firebaseDataHelpers';

const toRow = (record) => {
  const timestamp = record.timestamp || new Date().toISOString();
  return {
    subject: record.subject || '미분류',
    studied_on: timestamp.slice(0, 10),
    duration_minutes: record.durationMinutes || 0,
    duration_seconds: record.durationSeconds ?? Math.max(0, Math.round((record.durationMinutes || 0) * 60)),
    focus_score: record.focusScore ?? record.concentrationScore ?? null,
    pause_count: record.pauseCount || 0,
    pause_minutes: record.pauseMinutes || 0,
    started_at: timestamp,
    metadata: record,
    updated_at: serverTimestamp(),
    created_at: serverTimestamp(),
  };
};

export const listStudyRecords = async (userId) => {
  const snapshot = await getDocs(userCollection(userId, 'studyRecords'));
  return snapshot.docs
    .map((docSnapshot) => {
      const row = docSnapshot.data();
      return {
        ...(row.metadata || {}),
        id: docSnapshot.id,
        subject: row.subject,
        durationMinutes: row.duration_minutes,
        durationSeconds: row.duration_seconds ?? Math.max(0, Math.round((row.duration_minutes || 0) * 60)),
        pauseCount: row.pause_count,
        pauseMinutes: row.pause_minutes,
        focusScore: row.focus_score,
        timestamp: row.started_at || timestampToIso(row.created_at) || new Date().toISOString(),
      };
    })
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

export const addStudyRecord = async (userId, record) => {
  const recordId = record.id || crypto.randomUUID();
  await setDoc(userDocument(userId, 'studyRecords', recordId), toRow({ ...record, id: recordId }), { merge: true });
  return { id: recordId };
};

export const deleteStudyRecord = async (userId, id) => {
  await deleteDoc(userDocument(userId, 'studyRecords', id));
};
