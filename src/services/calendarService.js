import { getDocs, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import { userCollection, userDocument } from './firebaseDataHelpers';

export const listSchedules = async (userId) => {
  const snapshot = await getDocs(userCollection(userId, 'schedules'));
  return snapshot.docs
    .map((docSnapshot) => ({
      id: docSnapshot.id,
      ...docSnapshot.data(),
    }))
    .sort((a, b) => {
      if (a.schedule_date !== b.schedule_date) {
        return String(a.schedule_date || '').localeCompare(String(b.schedule_date || ''));
      }

      if (!!a.all_day !== !!b.all_day) {
        return a.all_day ? -1 : 1;
      }

      return String(a.schedule_time || '').localeCompare(String(b.schedule_time || ''));
    });
};

export const replaceSchedulesForDate = async (userId, dateKey, schedules = []) => {
  const collectionRef = userCollection(userId, 'schedules');
  const existingSnapshot = await getDocs(query(collectionRef, where('schedule_date', '==', dateKey)));
  const batch = writeBatch(collectionRef.firestore);

  existingSnapshot.forEach((docSnapshot) => {
    batch.delete(docSnapshot.ref);
  });

  schedules.forEach((schedule) => {
    const scheduleId = schedule.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    batch.set(userDocument(userId, 'schedules', scheduleId), {
      schedule_date: dateKey,
      title: schedule.title || '',
      schedule_time: schedule.allDay ? '' : (schedule.time || ''),
      memo: schedule.memo || '',
      all_day: !!schedule.allDay,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  });

  await batch.commit();
  return listSchedules(userId);
};

export const buildCalendarData = (todos = [], schedules = []) => {
  const data = {};

  todos.forEach((todo) => {
    const date = todo.todo_date;
    if (!data[date]) data[date] = { todos: [], schedules: [] };
    data[date].todos.push({
      id: todo.id,
      text: todo.content,
      completed: !!todo.completed,
    });
  });

  schedules.forEach((schedule) => {
    const date = schedule.schedule_date;
    if (!data[date]) data[date] = { todos: [], schedules: [] };
    data[date].schedules.push({
      id: schedule.id,
      title: schedule.title,
      time: schedule.schedule_time || '',
      memo: schedule.memo || '',
      allDay: !!schedule.all_day,
    });
  });

  return data;
};
