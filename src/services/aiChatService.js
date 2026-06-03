import { getDocs, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { userCollection, userDocument } from './firebaseDataHelpers';

export const listAiChats = async (userId) => {
  const snapshot = await getDocs(userCollection(userId, 'aiChats'));
  return snapshot.docs
    .map((docSnapshot) => ({
      id: docSnapshot.id,
      ...docSnapshot.data(),
    }))
    .sort((a, b) => (a.index || 0) - (b.index || 0))
    .map(({ role, text }) => ({ role, text }));
};

export const replaceAiChats = async (userId, chats = []) => {
  const collectionRef = userCollection(userId, 'aiChats');
  const existingSnapshot = await getDocs(collectionRef);
  const batch = writeBatch(collectionRef.firestore);

  existingSnapshot.forEach((docSnapshot) => {
    batch.delete(docSnapshot.ref);
  });

  chats.slice(-30).forEach((chat, index) => {
    const chatId = `chat-${String(index + 1).padStart(3, '0')}`;
    batch.set(userDocument(userId, 'aiChats', chatId), {
      role: chat.role,
      text: chat.text,
      index,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  });

  await batch.commit();
  return listAiChats(userId);
};
