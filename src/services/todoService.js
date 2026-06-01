import { supabase } from '../lib/supabase';

export const listTodos = async (userId) => {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .order('todo_date', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const replaceTodosForDate = async (userId, dateKey, todos = []) => {
  const { error: deleteError } = await supabase
    .from('todos')
    .delete()
    .eq('user_id', userId)
    .eq('todo_date', dateKey);

  if (deleteError) throw deleteError;

  if (todos.length === 0) return [];

  const rows = todos.map((todo) => ({
    user_id: userId,
    todo_date: dateKey,
    content: todo.text || todo.content || '',
    completed: !!todo.completed,
  }));

  const { data, error } = await supabase
    .from('todos')
    .insert(rows)
    .select();

  if (error) throw error;
  return data || [];
};
