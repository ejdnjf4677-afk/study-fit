import { supabase } from '../lib/supabase';

export const DEFAULT_ACCENT_ID = 'sky';

export const ACCENT_OPTIONS = [
  { id: 'sky', label: '하늘색', color: '#2F80ED', light: '#EEF5FF', dark: '#1A5CBC', rgb: '47, 128, 237' },
  { id: 'purple', label: '보라색', color: '#8B5CF6', light: '#F3E8FF', dark: '#6D28D9', rgb: '139, 92, 246' },
  { id: 'green', label: '초록색', color: '#22C55E', light: '#DCFCE7', dark: '#15803D', rgb: '34, 197, 94' },
  { id: 'pink', label: '분홍색', color: '#EC4899', light: '#FCE7F3', dark: '#BE185D', rgb: '236, 72, 153' },
  { id: 'orange', label: '주황색', color: '#F97316', light: '#FFEDD5', dark: '#C2410C', rgb: '249, 115, 22' },
];

const FALLBACK_KEY = 'studyfit_accent_fallback';

export const getAccentOption = (accentId = DEFAULT_ACCENT_ID) => (
  ACCENT_OPTIONS.find((option) => option.id === accentId) || ACCENT_OPTIONS[0]
);

export const applyAccentColor = (accentId = DEFAULT_ACCENT_ID) => {
  const option = getAccentOption(accentId);
  const root = document.documentElement;

  root.style.setProperty('--accent-color', option.color);
  root.style.setProperty('--accent-light', option.light);
  root.style.setProperty('--accent-dark', option.dark);
  root.style.setProperty('--accent-rgb', option.rgb);
  root.style.setProperty('--primary-color', option.color);
  root.style.setProperty('--primary-light', option.light);
  root.style.setProperty('--primary-dark', option.dark);
  root.style.setProperty('--primary-rgb', option.rgb);
};

export const getFallbackAccent = () => (
  localStorage.getItem(FALLBACK_KEY) || DEFAULT_ACCENT_ID
);

export const loadUserAccent = async (userId) => {
  if (!userId) return DEFAULT_ACCENT_ID;

  const { data, error } = await supabase
    .from('user_settings')
    .select('accent_color')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return getFallbackAccent();
  }

  return data?.accent_color || DEFAULT_ACCENT_ID;
};

export const saveUserAccent = async (userId, accentId) => {
  localStorage.setItem(FALLBACK_KEY, accentId);

  if (!userId) {
    return { ok: false, fallback: true };
  }

  const { error } = await supabase
    .from('user_settings')
    .upsert(
      {
        user_id: userId,
        accent_color: getAccentOption(accentId).id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

  return { ok: !error, fallback: !!error, error };
};
