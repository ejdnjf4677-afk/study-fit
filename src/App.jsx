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
import { getCurrentUser } from './utils/storage';

function App() {
  const [screen, setScreen] = useState('start');
  const [lastSession, setLastSession] = useState(null);

  useEffect(() => {
    try {
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
      const user = getCurrentUser();
      if (user) {
        setScreen('home');
      } else {
        setScreen('start');
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleTimerFinish = (sessionData) => {
    setLastSession(sessionData);
    setScreen('home');
  };

  const renderScreen = () => {
    switch (screen) {
      case 'start':
        return <StartScreen onStart={() => setScreen('home')} />;
      case 'home':
        return <HomeScreen onStartStudy={() => setScreen('timer')} />;
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
        return <SettingsScreen onLogout={() => setScreen('start')} />;
      default:
        return <HomeScreen onStartStudy={() => setScreen('timer')} />;
    }
  };

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
