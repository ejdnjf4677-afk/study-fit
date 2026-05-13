import React, { useState } from 'react';
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

function App() {
  const [screen, setScreen] = useState('start');
  const [lastSession, setLastSession] = useState(null);

  const handleTimerFinish = (sessionData) => {
    setLastSession(sessionData);
    setScreen('emotion');
  };

  const renderScreen = () => {
    switch (screen) {
      case 'start':
        return <StartScreen onStart={() => setScreen('home')} />;
      case 'home':
        return <HomeScreen onStartStudy={() => setScreen('timer')} />;
      case 'timer':
        return <TimerScreen onFinish={handleTimerFinish} onBack={() => setScreen('home')} />;
      case 'emotion':
        return <EmotionScreen lastSession={lastSession} onSave={() => setScreen('failure')} />;
      case 'failure':
        return <FailureScreen lastSession={lastSession} onSave={() => setScreen('home')} />;
      case 'records':
        return <RecordsScreen />;
      case 'stats':
        return <StatsScreen />;
      case 'reward':
        return <RewardsScreen />;
      case 'aicoach':
        return <AICoachScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <HomeScreen onStartStudy={() => setScreen('timer')} />;
    }
  };

  return (
    <>
      {renderScreen()}
      {screen !== 'start' && 
       screen !== 'timer' && 
       screen !== 'emotion' && 
       screen !== 'failure' && (
        <BottomNav setScreen={setScreen} activeScreen={screen} />
      )}
    </>
  );
}

export default App;
