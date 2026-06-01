import { supabase } from '../lib/supabase';

const toRow = (userId, record) => {
  const timestamp = record.timestamp || new Date().toISOString();
  return {
    id: record.id,
    user_id: userId,
    studied_on: timestamp.slice(0, 10),
    subject: record.subject || '공부',
    duration_minutes: record.durationMinutes || 0,
    focus_score: record.focusScore ?? record.concentrationScore ?? null,
    pause_count: record.pauseCount || 0,
    pause_minutes: record.pauseMinutes || 0,
    started_at: timestamp,
    metadata: record,
  };
};

export const listStudyRecords = async (userId) => {
  const { data, error } = await supabase
    .from('study_records')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: true });

  if (error) throw error;
  return (data || []).map((row) => ({
    ...(row.metadata || {}),
    id: row.id,
    subject: row.subject,
    durationMinutes: row.duration_minutes,
    pauseCount: row.pause_count,
    pauseMinutes: row.pause_minutes,
    timestamp: row.started_at || row.created_at,
  }));
};

export const addStudyRecord = async (userId, record) => {
  const { data, error } = await supabase
    .from('study_records')
    .insert(toRow(userId, record))
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteStudyRecord = async (userId, id) => {
  const { error } = await supabase
    .from('study_records')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);

  if (error) throw error;
};
