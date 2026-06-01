import { supabase } from '../lib/supabase';
import { patchUserSettings } from './userSettingsService';

export const listUserBadges = async (userId) => {
  const { data, error } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', userId)
    .order('purchased_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const addUserBadge = async (userId, badgeId) => {
  const { data, error } = await supabase
    .from('user_badges')
    .upsert({ user_id: userId, badge_id: badgeId }, { onConflict: 'user_id,badge_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const setRepresentativeBadge = async (userId, badgeId) => (
  patchUserSettings(userId, { selected_badge_id: badgeId })
);
