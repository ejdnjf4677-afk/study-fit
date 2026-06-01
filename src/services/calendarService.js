import { supabase } from '../lib/supabase';

export const listSchedules = async (userId) => {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('user_id', userId)
    .order('schedule_date', { ascending: true })
    .order('all_day', { ascending: false })
    .order('schedule_time', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const replaceSchedulesForDate = async (userId, dateKey, schedules = []) => {
  const { error: deleteError } = await supabase
    .from('schedules')
    .delete()
    .eq('user_id', userId)
    .eq('schedule_date', dateKey);

  if (deleteError) throw deleteError;

  if (schedules.length === 0) return [];

  const rows = schedules.map((schedule) => ({
    user_id: userId,
    schedule_date: dateKey,
    title: schedule.title || '',
    schedule_time: schedule.allDay ? null : (schedule.time || null),
    memo: schedule.memo || null,
    all_day: !!schedule.allDay,
  }));

  const { data, error } = await supabase
    .from('schedules')
    .insert(rows)
    .select();

  if (error) throw error;
  return data || [];
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
