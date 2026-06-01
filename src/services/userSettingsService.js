import { supabase } from '../lib/supabase';

export const getUserSettings = async (userId) => {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const upsertUserSettings = async (userId, payload = {}) => {
  const { data, error } = await supabase
    .from('user_settings')
    .upsert(
      {
        user_id: userId,
        theme: payload.theme ?? null,
        accent_color: payload.accentColor ?? payload.accent_color ?? null,
        selected_badge_id: payload.selectedBadgeId ?? payload.selected_badge_id ?? null,
        settings: payload.settings || {},
        subjects: payload.subjects || [],
        notifications: payload.notifications || {},
      },
      { onConflict: 'user_id' },
    )
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const patchUserSettings = async (userId, patch = {}) => {
  const { data, error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
};
