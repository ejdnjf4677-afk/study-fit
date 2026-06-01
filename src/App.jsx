import React, { useState, useEffect } from 'react';
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
import EmotionScreen from './screens/EmotionScreen';
import FailureScreen from './screens/FailureScreen';
import BottomNav from './components/BottomNav';
import { getCurrentSession } from './utils/auth';
import { supabase } from './lib/supabase';
import { applyAccentColor, DEFAULT_ACCENT_ID, loadUserAccent } from './utils/themeSettings';
import { clearUserCache, hydrateUserData } from './services/dataSyncService';
import { DATA_SYNC_ERROR_EVENT } from './services/supabaseService';

const applyStoredTheme = () => {
  const storedSettings = localStorage.getItem('app_settings');
  if (!storedSettings) {
    document.body.classList.remove('dark');
    return;
  }

  const settings = JSON.parse(storedSettings);
  document.body.classList.toggle('dark', settings.theme === 'dark');
};

function App() {
  const [screen, setScreen] = useState('start');
  const [lastSession, setLastSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncError, setSyncError] = useState('');

  useEffect(() => {
    const initializeApp = async () => {
      // Theme Check
      applyStoredTheme();

      // Session Check
      localStorage.removeItem('studyfit_users');
      localStorage.removeItem('studyfit_current_user');
      const isResetPasswordPath = window.location.pathname === '/reset-password';
      const session = await getCurrentSession();
      if (isResetPasswordPath) {
        setScreen('reset-password');
      } else if (session?.user) {
        setCurrentUser(session.user);
        try {
          await hydrateUserData(session.user.id);
          applyStoredTheme();
        } catch (error) {
          console.error(error);
          setSyncError('데이터를 불러오지 못했어요. 네트워크 상태를 확인해주세요.');
        }
        const accentId = await loadUserAccent(session.user.id);
        applyAccentColor(accentId);
        setScreen('home');
      } else {
        clearUserCache();
        setCurrentUser(null);
        applyAccentColor(DEFAULT_ACCENT_ID);
        setScreen('start');
      }
      setAuthLoading(false);
    };

    initializeApp().catch((e) => {
      console.error(e);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user || null;
      setCurrentUser(user);
      if (event === 'PASSWORD_RECOVERY') {
        setScreen('reset-password');
        return;
      }
      if (event === 'SIGNED_IN') {
        if (user?.id) {
          try {
            await hydrateUserData(user.id);
            applyStoredTheme();
          } catch (error) {
            console.error(error);
            setSyncError('데이터를 불러오지 못했어요. 네트워크 상태를 확인해주세요.');
          }
          loadUserAccent(user.id).then(applyAccentColor);
        }
        setScreen('home');
      }
      if (event === 'SIGNED_OUT') {
        clearUserCache();
        applyAccentColor(DEFAULT_ACCENT_ID);
        setScreen('start');
      }
    });

    const handleNavigate = (event) => {
      if (event.detail?.screen) setScreen(event.detail.screen);
    };

    window.addEventListener('studyfit:navigate', handleNavigate);
    const handleDataSyncError = (event) => {
      setSyncError(event.detail?.message || '데이터 동기화에 실패했어요. 잠시 후 다시 시도해주세요.');
    };

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
      {syncError && (
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
