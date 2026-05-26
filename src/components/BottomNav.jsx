import React from 'react';
import { Home, Timer, CalendarCheck, BarChart2, Gift, Bot, Settings } from 'lucide-react';

const BottomNav = ({ setScreen, activeScreen }) => {
  const tabs = [
    { id: 'home', label: '홈', icon: Home },
    { id: 'records', label: '기록', icon: CalendarCheck },
    { id: 'stats', label: '통계', icon: BarChart2 },
    { id: 'reward', label: '보상', icon: Gift },
    { id: 'aicoach', label: 'AI 코치', icon: Bot },
    { id: 'settings', label: '설정', icon: Settings },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeScreen === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setScreen(tab.id)}
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} color={isActive ? 'var(--primary-color)' : 'var(--text-tertiary)'} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
