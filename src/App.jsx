import React, { useEffect, useRef, useState } from 'react';
import BottomNav from './components/BottomNav';
import CalendarScreen from './screens/CalendarScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import HomeScreen from './screens/HomeScreen';
import RecordsScreen from './screens/RecordsScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import RewardsScreen from './screens/RewardScreen';
import SettingsScreen from './screens/SettingsScreen';
import StartScreen from './screens/StartScreen';
import StatsScreen from './screens/StatsScreen';
import TimerScreen from './screens/TimerScreen';
import AICoachScreen from './screens/AICoachScreen';
import { getCurrentSession, setCurrentUserIdHint, subscribeToAuthChanges } from './services/authService';
import {
  clearUserCache,
  hydrateUserData,
  persistCurrentCacheForUser,
  restoreUserCache,
} from './services/dataSyncService';
import { applyAccentColor, DEFAULT_ACCENT_ID, loadUserAccent } from './utils/themeSettings';

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
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const currentUserRef = useRef(null);
  const authInitializedRef = useRef(false);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    const syncUserData = async (userId) => {
      try {
        const hydratedData = await withTimeout(hydrateUserData(userId), 5000, null);
        if (!hydratedData) {
          restoreUserCache(userId);
        }
      } catch (error) {
        console.error(error);
        restoreUserCache(userId);
      }

      applyStoredTheme();

      try {
        const accentId = await withTimeout(loadUserAccent(userId), 1000, DEFAULT_ACCENT_ID);
        applyAccentColor(accentId || DEFAULT_ACCENT_ID);
      } catch (error) {
        console.error(error);
        applyAccentColor(DEFAULT_ACCENT_ID);
      }
    };

    const finishSignedInState = async (user) => {
      setAuthLoading(true);
      setCurrentUserIdHint(user.uid);
      setCurrentUser(user);
      await syncUserData(user.uid);
      setScreen('home');
      setAuthLoading(false);
    };

    const finishSignedOutState = () => {
      persistCurrentCacheForUser(currentUserRef.current?.uid);
      clearUserCache();
      setCurrentUser(null);
      setCurrentUserIdHint(null);
      document.body.classList.remove('dark');
      applyAccentColor(DEFAULT_ACCENT_ID);
      setScreen(window.location.pathname === '/reset-password' ? 'reset-password' : 'start');
      setAuthLoading(false);
    };

    const initializeApp = async () => {
      clearUserCache();
      const isResetPasswordPath = window.location.pathname === '/reset-password';
      const session = await withTimeout(getCurrentSession(), 5000, null);

      if (isResetPasswordPath) {
        setScreen('reset-password');
        setAuthLoading(false);
      } else if (session?.user) {
        await finishSignedInState(session.user);
      } else {
        finishSignedOutState();
      }

      authInitializedRef.current = true;
    };

    initializeApp().catch((error) => {
      console.error(error);
      authInitializedRef.current = true;
      setAuthLoading(false);
    });

    const unsubscribe = subscribeToAuthChanges((user) => {
      if (!authInitializedRef.current) {
        return;
      }

      if (user?.uid) {
        void finishSignedInState(user);
        return;
      }

      finishSignedOutState();
    });

    const handleNavigate = (event) => {
      if (event.detail?.screen) {
        setScreen(event.detail.screen);
      }
    };

    window.addEventListener('studyfit:navigate', handleNavigate);

    return () => {
      unsubscribe();
      window.removeEventListener('studyfit:navigate', handleNavigate);
    };
  }, []);

  const renderScreen = () => {
    switch (screen) {
      case 'start':
        return <StartScreen onStart={(user) => { setCurrentUser(user); }} />;
      case 'forgot-password':
        return <ForgotPasswordScreen onBack={() => setScreen('start')} />;
      case 'reset-password':
        return <ResetPasswordScreen onDone={() => setScreen('start')} />;
      case 'home':
        return <HomeScreen user={currentUser} onStartStudy={() => setScreen('timer')} />;
      case 'timer':
        return <TimerScreen onFinish={() => setScreen('home')} onBack={() => setScreen('home')} />;
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
          정보를 불러오는 중...
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
