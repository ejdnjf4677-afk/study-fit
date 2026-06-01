import { fireAndForget } from '../services/supabaseService';
import { replaceTodosForDate } from '../services/todoService';
import { replaceSchedulesForDate } from '../services/calendarService';

const CALENDAR_KEY = 'studyfit_calendar_items';

export const getDateKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getCalendarData = () => {
  try {
    return JSON.parse(localStorage.getItem(CALENDAR_KEY) || '{}');
  } catch {
    return {};
  }
};

export const saveCalendarData = (data) => {
  localStorage.setItem(CALENDAR_KEY, JSON.stringify(data));
};

export const getDayData = (dateKey) => {
  const data = getCalendarData();
  return data[dateKey] || { todos: [], schedules: [] };
};

export const getTodosForDate = (dateKey) => getDayData(dateKey).todos || [];

export const saveDayData = (dateKey, dayData) => {
  const data = getCalendarData();
  saveCalendarData({
    ...data,
    [dateKey]: {
      todos: dayData.todos || [],
      schedules: dayData.schedules || [],
    },
  });
  fireAndForget((userId) => replaceTodosForDate(userId, dateKey, dayData.todos || []));
  fireAndForget((userId) => replaceSchedulesForDate(userId, dateKey, dayData.schedules || []));
};

export const saveTodosForDate = (dateKey, todos) => {
  const dayData = getDayData(dateKey);
  saveDayData(dateKey, { ...dayData, todos });
};

export const createCalendarItemId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const toUserScopedCalendarRows = (userId, data = getCalendarData()) => (
  Object.entries(data).map(([date, value]) => ({
    user_id: userId,
    date,
    todos: value.todos || [],
    schedules: value.schedules || [],
  }))
);
