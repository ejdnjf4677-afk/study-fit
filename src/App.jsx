import React, { useEffect, useRef, useState } from 'react';
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
import {
  clearUserCache,
  hydrateUserData,
  persistCurrentCacheForUser,
  restoreUserCache,
} from './services/dataSyncService';
import { setCurrentUserIdHint } from './services/supabaseService';

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
  const currentUserRef = useRef(null);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    const syncUserData = async (userId) => {
      await withTimeout(hydrateUserData(userId), 500, null);
      restoreUserCache(userId);
      applyStoredTheme();

      try {
        const accentId = await withTimeout(loadUserAccent(userId), 500, DEFAULT_ACCENT_ID);
        applyAccentColor(accentId || DEFAULT_ACCENT_ID);
      } catch (error) {
        console.error(error);
        applyAccentColor(DEFAULT_ACCENT_ID);
      }
    };

    const initializeApp = async () => {
      clearUserCache();
      localStorage.removeItem('studyfit_users');
      localStorage.removeItem('studyfit_current_user');

      const isResetPasswordPath = window.location.pathname === '/reset-password';
      const session = await withTimeout(getCurrentSession(), 5000, null);

      if (isResetPasswordPath) {
        setScreen('reset-password');
      } else if (session?.user) {
        setCurrentUserIdHint(session.user.id);
        setCurrentUser(session.user);
        setScreen('home');
        await syncUserData(session.user.id);
      } else {
        clearUserCache();
        setCurrentUser(null);
        setCurrentUserIdHint(null);
        applyAccentColor(DEFAULT_ACCENT_ID);
        setScreen('start');
      }

      setAuthLoading(false);
    };

    initializeApp().catch((error) => {
      console.error(error);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user || null;
      setCurrentUser(user);

      if (event === 'PASSWORD_RECOVERY') {
        setScreen('reset-password');
        return;
      }

      if (event === 'SIGNED_IN') {
        if (user?.id) {
          setCurrentUserIdHint(user.id);
          setTimeout(() => syncUserData(user.id), 0);
        }
        setScreen('home');
      }

      if (event === 'SIGNED_OUT') {
        persistCurrentCacheForUser(user?.id || currentUserRef.current?.id);
        clearUserCache();
        setCurrentUserIdHint(null);
        applyAccentColor(DEFAULT_ACCENT_ID);
        setScreen('start');
      }
    });

    const handleNavigate = (event) => {
      if (event.detail?.screen) {
        setScreen(event.detail.screen);
      }
    };

    window.addEventListener('studyfit:navigate', handleNavigate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('studyfit:navigate', handleNavigate);
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
        return (
          <SettingsScreen
            user={currentUser}
            onUserUpdate={setCurrentUser}
            onLogout={() => {
              setCurrentUser(null);
              setScreen('start');
            }}
          />
        );
      default:
        return <HomeScreen user={currentUser} onStartStudy={() => setScreen('timer')} />;
    }
  };

  if (authLoading) {
    return (
      <div className="screen-container centered-screen">
        <div style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: '700' }}>
          로그인 상태 확인 중...
        </div>
      </div>
    );
  }

  return (
    <>
      {renderScreen()}
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
