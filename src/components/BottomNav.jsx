import React from 'react';
import { Home, Timer, List, BarChart2, Gift, Bot, Settings } from 'lucide-react';

const BottomNav = ({ setScreen, activeScreen }) => {
  const tabs = [
    { id: 'home', label: '홈', icon: Home },
    { id: 'timer', label: '타이머', icon: Timer },
    { id: 'records', label: '기록', icon: List },
    { id: 'stats', label: '통계', icon: BarChart2 },
    { id: 'reward', label: '보상', icon: Gift },
    { id: 'aicoach', label: 'AI 코치', icon: Bot },
    { id: 'settings', label: '설정', icon: Settings },
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      width: '100%',
      maxWidth: '390px',
      height: '84px',
      backgroundColor: '#FFFFFF',
      borderTop: '1px solid #E5E5EA',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingBottom: '20px',
      zIndex: 1000
    }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeScreen === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setScreen(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              color: isActive ? 'var(--primary-color)' : '#8E8E93',
              transition: 'color 0.2s ease'
            }}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{ fontSize: '10px', fontWeight: isActive ? '600' : '400' }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
