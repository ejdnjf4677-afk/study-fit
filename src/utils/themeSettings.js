import { syncLocalKeyForCurrentUser } from '../services/dataSyncService';
import { getUserSettings, patchUserSettings } from '../services/settingsService';

export const DEFAULT_ACCENT_ID = 'sky';

export const ACCENT_OPTIONS = [
  { id: 'sky', label: 'Sky Blue', color: '#2F80ED', light: '#EEF5FF', dark: '#1A5CBC', rgb: '47, 128, 237' },
  { id: 'purple', label: 'Purple', color: '#8B5CF6', light: '#F3E8FF', dark: '#6D28D9', rgb: '139, 92, 246' },
  { id: 'green', label: 'Green', color: '#22C55E', light: '#DCFCE7', dark: '#15803D', rgb: '34, 197, 94' },
  { id: 'pink', label: 'Light Pink', color: '#F472B6', light: '#FDF2F8', dark: '#DB2777', rgb: '244, 114, 182' },
  { id: 'orange', label: 'Orange', color: '#F97316', light: '#FFEDD5', dark: '#C2410C', rgb: '249, 115, 22' },
  { id: 'yellow', label: 'Yellow', color: '#EAB308', light: '#FEF9C3', dark: '#A16207', rgb: '234, 179, 8' },
  { id: 'red', label: 'Red', color: '#EF4444', light: '#FEE2E2', dark: '#B91C1C', rgb: '239, 68, 68' },
  { id: 'lightblue', label: 'Light Blue', color: '#38BDF8', light: '#E0F2FE', dark: '#0284C7', rgb: '56, 189, 248' },
  { id: 'deepgreen', label: 'Deep Green', color: '#166534', light: '#DCFCE7', dark: '#14532D', rgb: '22, 101, 52' },
  { id: 'black', label: 'Black', color: '#111111', light: '#F4F4F5', dark: '#000000', rgb: '17, 17, 17' },
  { id: 'darkgray', label: 'Dark Gray', color: '#4B5563', light: '#E5E7EB', dark: '#374151', rgb: '75, 85, 99' },
  { id: 'brown', label: 'Brown', color: '#8B5E3C', light: '#F3E8DD', dark: '#6E462A', rgb: '139, 94, 60' },
  { id: 'lightgray', label: 'Light Gray', color: '#9CA3AF', light: '#F3F4F6', dark: '#6B7280', rgb: '156, 163, 175' },
];

const FALLBACK_KEY = 'studyfit_accent_fallback';

export const getAccentOption = (accentId = DEFAULT_ACCENT_ID) => (
  ACCENT_OPTIONS.find((option) => option.id === accentId) || ACCENT_OPTIONS[0]
);

const getEffectiveAccentOption = (accentId = DEFAULT_ACCENT_ID) => {
  const option = getAccentOption(accentId);
  const isDarkMode = document.body.classList.contains('dark');

  if (accentId === 'black' && isDarkMode) {
    return {
      ...option,
      color: '#FFFFFF',
      light: '#F5F5F5',
      dark: '#E5E7EB',
      rgb: '255, 255, 255',
    };
  }

  return option;
};

export const applyAccentColor = (accentId = DEFAULT_ACCENT_ID) => {
  const option = getEffectiveAccentOption(accentId);
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

export const getFallbackAccent = () => {
  const rawValue = localStorage.getItem(FALLBACK_KEY);

  if (!rawValue) {
    return DEFAULT_ACCENT_ID;
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    return typeof parsedValue === 'string' ? parsedValue : rawValue;
  } catch {
    return rawValue;
  }
};

export const loadUserAccent = async (userId) => {
  const fallbackAccent = getFallbackAccent();

  if (!userId) {
    return fallbackAccent;
  }

  try {
    const settings = await getUserSettings(userId);
    return settings?.accentColor || fallbackAccent;
  } catch (error) {
    console.error(error);
    return fallbackAccent;
  }
};

export const saveUserAccent = async (userId, accentId) => {
  localStorage.setItem(FALLBACK_KEY, accentId);
  syncLocalKeyForCurrentUser(FALLBACK_KEY, accentId);

  if (!userId) {
    return { ok: true, fallback: true, error: null };
  }

  try {
    await patchUserSettings(userId, { accentColor: getAccentOption(accentId).id });
    return { ok: true, fallback: false, error: null };
  } catch (error) {
    console.error(error);
    return { ok: false, fallback: true, error };
  }
};
