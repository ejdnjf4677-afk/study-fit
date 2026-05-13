import React, { useState, useEffect } from 'react';
import { Gift, Coins, CreditCard, PlayCircle } from 'lucide-react';
import { getUserPoints, getLastEarnedPoints, addPoints, saveData } from '../utils/storage';

const rewards = [
  { name: '스타벅스 아메리카노 Tall', cost: 15000 },
  { name: 'GS25 모바일 상품권 5,000원', cost: 20000 },
  { name: '배달의민족 상품권 10,000원', cost: 35000 },
  { name: '문화상품권 10,000원', cost: 40000 },
  { name: '자기계발 도서 교환권', cost: 45000 },
];

const RewardScreen = () => {
  const [points, setPoints] = useState(getUserPoints());
  const [lastEarned, setLastEarned] = useState(getLastEarnedPoints());
  const [adWatched, setAdWatched] = useState(false);

  useEffect(() => {
    // Refresh points from storage in case they changed elsewhere
    setPoints(getUserPoints());
    setLastEarned(getLastEarnedPoints());
  }, []);

  const handleAdWatch = () => {
    if (adWatched) {
      alert('이미 광고 보상을 받았습니다.');
      return;
    }
    if (lastEarned <= 0) {
      alert('추가로 지급할 최근 포인트 기록이 없습니다.');
      return;
    }
    
    addPoints(lastEarned);
    setPoints(getUserPoints());
    setAdWatched(true);
    alert(`광고 시청 완료! 직전 획득한 ${lastEarned}P를 추가로 받았습니다.`);
  };

  const handlePremium = () => {
    alert('프리미엄 서비스 안내\n- 광고 영구 제거\n- AI 코치 분석 무제한\n- 정밀 통계 보고서 제공\n- 포인트 적립 1.5배 상시 적용');
  };

  const claimReward = (reward) => {
    if (points >= reward.cost) {
      const newPoints = points - reward.cost;
      saveData('user_points', newPoints);
      setPoints(newPoints);
      alert(`${reward.name} 교환이 완료되었습니다!\n남은 포인트: ${newPoints}P`);
    } else {
      alert('포인트가 부족합니다. 공부를 더 해서 포인트를 모아보세요!');
    }
  };

  return (
    <div className="screen-container">
      <header style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>보상 상점</h2>
        <p style={{ color: 'var(--text-secondary)' }}>열심히 공부한 당신, 보상을 누리세요!</p>
      </header>

      <div className="card" style={{ 
        background: 'linear-gradient(135deg, #007AFF, #00C6FF)', 
        color: 'white', 
        border: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>보유 포인트</div>
        <div style={{ fontSize: '32px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Coins size={28} />
          {points.toLocaleString()} P
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <button 
          className="btn-secondary" 
          onClick={handleAdWatch}
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            padding: '16px', 
            gap: '8px',
            opacity: (adWatched || lastEarned <= 0) ? 0.6 : 1
          }}
        >
          <PlayCircle size={24} color="var(--primary-color)" />
          <span style={{ fontSize: '12px', fontWeight: '600' }}>광고 보고 +{lastEarned}P</span>
        </button>
        <button 
          className="btn-primary" 
          onClick={handlePremium}
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            padding: '16px', 
            gap: '8px'
          }}
        >
          <CreditCard size={24} color="white" />
          <span style={{ fontSize: '12px', fontWeight: '600' }}>프리미엄 구매</span>
        </button>
      </div>

      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>포인트 교환 상품</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '100px' }}>
        {rewards.map((r, i) => (
          <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: '#F2F2F7', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Gift size={20} color="var(--primary-color)" />
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>{r.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{r.cost.toLocaleString()} P</div>
              </div>
            </div>
            <button 
              onClick={() => claimReward(r)}
              style={{ 
                padding: '8px 16px', 
                borderRadius: '20px', 
                border: 'none', 
                background: points >= r.cost ? 'var(--primary-color)' : '#E5E5EA',
                color: points >= r.cost ? 'white' : '#8E8E93',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: points >= r.cost ? 'pointer' : 'default'
              }}
            >
              교환하기
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RewardScreen;
