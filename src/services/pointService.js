import { supabase } from '../lib/supabase';

export const getPointBalance = async (userId) => {
  const { data, error } = await supabase
    .from('point_balances')
    .select('current_points')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data?.current_points || 0;
};

export const setPointBalance = async (userId, currentPoints) => {
  const { data, error } = await supabase
    .from('point_balances')
    .upsert(
      { user_id: userId, current_points: Math.max(0, Number(currentPoints) || 0) },
      { onConflict: 'user_id' },
    )
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const addPointTransaction = async (userId, amount, reason = 'point_change', related = {}) => {
  const { data, error } = await supabase
    .from('point_transactions')
    .insert({
      user_id: userId,
      amount,
      transaction_type: amount >= 0 ? 'earn' : 'spend',
      reason,
      related_type: related.type || null,
      related_id: related.id || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const listPointTransactions = async (userId) => {
  const { data, error } = await supabase
    .from('point_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};
