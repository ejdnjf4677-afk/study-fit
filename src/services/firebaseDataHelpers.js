import { collection, doc } from 'firebase/firestore';
import { db } from '../lib/firebaseClient';

export const userCollection = (userId, collectionName) => (
  collection(db, 'users', userId, collectionName)
);

export const userDocument = (userId, collectionName, documentId) => (
  doc(db, 'users', userId, collectionName, documentId)
);

export const timestampToIso = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();

  try {
    return new Date(value).toISOString();
  } catch {
    return null;
  }
};
