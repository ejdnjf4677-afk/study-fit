import React, { useState, useEffect } from 'react';
import StartScreen from './screens/StartScreen';
import HomeScreen from './screens/HomeScreen';
import TimerScreen from './screens/TimerScreen';
import RecordsScreen from './screens/RecordsScreen';
import SettingsScreen from './screens/SettingsScreen';
import StatsScreen from './screens/StatsScreen';
import RewardsScreen from './screens/RewardScreen';
import AICoachScreen from './screens/AICoachScreen';
import EmotionScreen from './screens/EmotionScreen';
import FailureScreen from './screens/FailureScreen';
import BottomNav from './components/BottomNav';
import { getCurrentSession } from './utils/auth';
import { supabase } from './lib/supabase';

function App() {
  const [screen, setScreen] = useState('start');
  const [lastSession, setLastSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      // Theme Check
      const storedSettings = localStorage.getItem('app_settings');
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        if (settings.theme === 'dark') {
          document.body.classList.add('dark');
        } else {
          document.body.classList.remove('dark');
        }
      }

      // Session Check
      localStorage.removeItem('studyfit_users');
      localStorage.removeItem('studyfit_current_user');
      const session = await getCurrentSession();
      if (session?.user) {
        setCurrentUser(session.user);
        setScreen('home');
      } else {
        setCurrentUser(null);
        setScreen('start');
      }
      setAuthLoading(false);
    };

    initializeApp().catch((e) => {
      console.error(e);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user || null;
      setCurrentUser(user);
      if (event === 'SIGNED_IN') setScreen('home');
      if (event === 'SIGNED_OUT') setScreen('start');
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleTimerFinish = (sessionData) => {
    setLastSession(sessionData);
    setScreen('home');
  };

  const renderScreen = () => {
    switch (screen) {
      case 'start':
        return <StartScreen onStart={(user) => { setCurrentUser(user); setScreen('home'); }} />;
      case 'home':
        return <HomeScreen user={currentUser} onStartStudy={() => setScreen('timer')} />;
      case 'timer':
        return <TimerScreen onFinish={handleTimerFinish} onBack={() => setScreen('home')} />;
      case 'records':
        return <RecordsScreen />;
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
      {screen !== 'start' &&
        screen !== 'timer' && (
          <BottomNav setScreen={setScreen} activeScreen={screen} />
        )}
    </>
  );
}

export default App;
