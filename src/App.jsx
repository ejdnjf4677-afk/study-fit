import React, { useEffect, useState } from 'react';
import StartScreen from './screens/StartScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import HomeScreen from './screens/HomeScreen';
import TimerScreen from './screens/TimerScreen';
import RecordsScreen from './screens/RecordsScreen';
import CalendarScreen from './screens/CalendarScreen';
import SettingsScreen from './screens/SettingsScreen';
import StatsScreen from './screens/StatsScreen';
import RewardsScreen from './screens/RewardScreen';
import AICoachScreen from './screens/AICoachScreen';
import BottomNav from './components/BottomNav';
import { getCurrentSession } from './utils/auth';
import { supabase } from './lib/supabase';
import { applyAccentColor, DEFAULT_ACCENT_ID, loadUserAccent } from './utils/themeSettings';
import { clearUserCache, hydrateUserData } from './services/dataSyncService';
import { DATA_SYNC_ERROR_EVENT, resetRemoteSyncState } from './services/supabaseService';

const withTimeout = (promise, timeoutMs, fallbackValue = null) => (
  Promise.race([
    promise,
    new Promise((resolve) => {
      setTimeout(() => resolve(fallbackValue), timeoutMs);
    }),
  ])
);

const applyStoredTheme = () => {
  const storedSettings = localStorage.getItem('app_settings');
  if (!storedSettings) {
    document.body.classList.remove('dark');
    return;
  }

  try {
    const settings = JSON.parse(storedSettings);
    document.body.classList.toggle('dark', settings.theme === 'dark');
  } catch {
    document.body.classList.remove('dark');
  }
};

function App() {
  const [screen, setScreen] = useState('start');
  const [lastSession, setLastSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncError, setSyncError] = useState('');

  useEffect(() => {
    const syncUserData = async (userId) => {
      try {
        const result = await withTimeout(hydrateUserData(userId), 5000, 'timeout');
        if (result === 'timeout') {
          setSyncError('데이터 불러오기가 지연되고 있어요. 앱은 기존 저장값으로 먼저 열었습니다.');
        }
        applyStoredTheme();
      } catch (error) {
        console.error(error);
        setSyncError('데이터를 불러오지 못했어요. 네트워크 상태나 Supabase 테이블 설정을 확인해주세요.');
      }

      try {
        const accentId = await withTimeout(loadUserAccent(userId), 3000, DEFAULT_ACCENT_ID);
        applyAccentColor(accentId || DEFAULT_ACCENT_ID);
      } catch (error) {
        console.error(error);
        applyAccentColor(DEFAULT_ACCENT_ID);
      }
    };

    const initializeApp = async () => {
      resetRemoteSyncState();
      applyStoredTheme();
      localStorage.removeItem('studyfit_users');
      localStorage.removeItem('studyfit_current_user');

      const isResetPasswordPath = window.location.pathname === '/reset-password';
      const session = await withTimeout(getCurrentSession(), 5000, null);

      if (isResetPasswordPath) {
        setScreen('reset-password');
      } else if (session?.user) {
        setSyncError('');
        setCurrentUser(session.user);
        setScreen('home');
        syncUserData(session.user.id);
      } else {
        clearUserCache();
        setCurrentUser(null);
        applyAccentColor(DEFAULT_ACCENT_ID);
        setScreen('start');
      }

      setAuthLoading(false);
    };

    initializeApp().catch((error) => {
      console.error(error);
      setAuthLoading(false);
      setSyncError('로그인 상태를 확인하지 못했어요. 잠시 후 다시 시도해주세요.');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user || null;
      setCurrentUser(user);

      if (event === 'PASSWORD_RECOVERY') {
        setScreen('reset-password');
        return;
      }

      if (event === 'SIGNED_IN') {
        setSyncError('');
        if (user?.id) {
          resetRemoteSyncState();
          setTimeout(() => syncUserData(user.id), 0);
        }
        setScreen('home');
      }

      if (event === 'SIGNED_OUT') {
        resetRemoteSyncState();
        clearUserCache();
        applyAccentColor(DEFAULT_ACCENT_ID);
        setScreen('start');
      }
    });

    const handleNavigate = (event) => {
      if (event.detail?.screen) setScreen(event.detail.screen);
    };

    const handleDataSyncError = (event) => {
      setSyncError(event.detail?.message || '데이터 동기화에 실패했어요. 잠시 후 다시 시도해주세요.');
    };

    window.addEventListener('studyfit:navigate', handleNavigate);
    window.addEventListener(DATA_SYNC_ERROR_EVENT, handleDataSyncError);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('studyfit:navigate', handleNavigate);
      window.removeEventListener(DATA_SYNC_ERROR_EVENT, handleDataSyncError);
    };
  }, []);

  const handleTimerFinish = (sessionData) => {
    setLastSession(sessionData);
    setScreen('home');
  };

  const renderScreen = () => {
    switch (screen) {
      case 'start':
        return <StartScreen onStart={(user) => { setCurrentUser(user); setScreen('home'); }} />;
      case 'forgot-password':
        return <ForgotPasswordScreen onBack={() => setScreen('start')} />;
      case 'reset-password':
        return <ResetPasswordScreen onDone={() => setScreen('start')} />;
      case 'home':
        return <HomeScreen user={currentUser} onStartStudy={() => setScreen('timer')} />;
      case 'timer':
        return <TimerScreen onFinish={handleTimerFinish} onBack={() => setScreen('home')} />;
      case 'records':
        return <RecordsScreen />;
      case 'calendar':
        return <CalendarScreen />;
      case 'stats':
        return <StatsScreen />;
      case 'reward':
        return <RewardsScreen />;
      case 'aicoach':
        return <AICoachScreen />;
      case 'settings':
        return <SettingsScreen user={currentUser} onLogout={() => { setCurrentUser(null); setScreen('start'); }} />;
      default:
        return <HomeScreen user={currentUser} onStartStudy={() => setScreen('timer')} />;
    }
  };

  if (authLoading) {
    return (
      <div className="screen-container centered-screen">
        <div style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: '700' }}>로그인 상태 확인 중...</div>
      </div>
    );
  }

  return (
    <>
      {renderScreen()}
      {syncError && !currentUser && (
        <div
          role="status"
          onClick={() => setSyncError('')}
          style={{
            position: 'absolute',
            left: '18px',
            right: '18px',
            bottom: '104px',
            zIndex: 2000,
            padding: '12px 14px',
            borderRadius: '14px',
            background: 'rgba(235, 87, 87, 0.95)',
            color: 'white',
            fontSize: '13px',
            fontWeight: '700',
            lineHeight: 1.45,
            boxShadow: '0 10px 24px rgba(235, 87, 87, 0.24)',
            cursor: 'pointer',
          }}
        >
          {syncError}
        </div>
      )}
      {screen !== 'start' &&
        screen !== 'timer' &&
        screen !== 'forgot-password' &&
        screen !== 'reset-password' && (
          <BottomNav setScreen={setScreen} activeScreen={screen} />
        )}
    </>
  );
}

export default App;
