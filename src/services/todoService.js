import { deleteDoc, getDocs, query, serverTimestamp, setDoc, where, writeBatch } from 'firebase/firestore';
import { userCollection, userDocument } from './firebaseDataHelpers';

export const listTodos = async (userId) => {
  const snapshot = await getDocs(userCollection(userId, 'todos'));
  return snapshot.docs
    .map((docSnapshot) => ({
      id: docSnapshot.id,
      ...docSnapshot.data(),
    }))
    .sort((a, b) => {
      if (a.todo_date === b.todo_date) return String(a.created_at || '').localeCompare(String(b.created_at || ''));
      return String(a.todo_date || '').localeCompare(String(b.todo_date || ''));
    });
};

export const replaceTodosForDate = async (userId, dateKey, todos = []) => {
  const collectionRef = userCollection(userId, 'todos');
  const existingSnapshot = await getDocs(query(collectionRef, where('todo_date', '==', dateKey)));
  const batch = writeBatch(collectionRef.firestore);

  existingSnapshot.forEach((docSnapshot) => {
    batch.delete(docSnapshot.ref);
  });

  todos.forEach((todo) => {
    const todoId = todo.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    batch.set(userDocument(userId, 'todos', todoId), {
      todo_date: dateKey,
      content: todo.text || todo.content || '',
      completed: !!todo.completed,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  });

  await batch.commit();
  return listTodos(userId);
};

export const deleteTodo = async (userId, todoId) => {
  await deleteDoc(userDocument(userId, 'todos', todoId));
};
