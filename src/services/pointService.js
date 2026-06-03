import { addDoc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { userCollection, userDocument } from './firebaseDataHelpers';

export const getPointBalance = async (userId) => {
  const snapshot = await getDoc(userDocument(userId, 'points', 'main'));
  if (!snapshot.exists()) return 0;
  return snapshot.data().currentPoints || 0;
};

export const setPointBalance = async (userId, currentPoints) => {
  await setDoc(userDocument(userId, 'points', 'main'), {
    currentPoints: Math.max(0, Number(currentPoints) || 0),
    updatedAt: serverTimestamp(),
  }, { merge: true });

  return getPointBalance(userId);
};

export const addPointTransaction = async (userId, amount, reason = 'point_change', related = {}) => {
  const docRef = await addDoc(userCollection(userId, 'pointLogs'), {
    amount,
    transactionType: amount >= 0 ? 'earn' : 'spend',
    reason,
    relatedType: related.type || null,
    relatedId: related.id || null,
    createdAt: serverTimestamp(),
  });

  return { id: docRef.id };
};

export const listPointTransactions = async (userId) => {
  const snapshot = await getDocs(query(userCollection(userId, 'pointLogs'), orderBy('createdAt', 'desc')));
  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
};
