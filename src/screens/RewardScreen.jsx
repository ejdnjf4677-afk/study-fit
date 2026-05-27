import React, { useState, useEffect } from 'react';
import { Gift, PlayCircle, Sparkles, Crown, CheckCircle, AlertCircle } from 'lucide-react';
import { getUserPoints, addPoints, loadData, saveData } from '../utils/storage';

const rewards = [
  { name: '스타벅스 아메리카노 Tall', cost: 15000, color: '#00704A' },
  { name: 'GS25 모바일 상품권 5,000원', cost: 20000, color: '#00D4EA' },
  { name: '배달의민족 상품권 10,000원', cost: 35000, color: '#2AC1BC' },
  { name: '문화상품권 10,000원', cost: 40000, color: '#F2994A' },
];

const AD_COOLDOWN_MS = 30 * 60 * 1000;
const AD_LAST_WATCHED_KEY = 'ad_last_watched_at';

const getRemainingAdTime = () => {
  const lastWatchedAt = loadData(AD_LAST_WATCHED_KEY, null);
  if (!lastWatchedAt) return 0;

  const elapsed = Date.now() - new Date(lastWatchedAt).getTime();
  return Math.max(0, AD_COOLDOWN_MS - elapsed);
};

const formatRemainingTime = (milliseconds) => {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const RewardScreen = () => {
  const [points, setPoints] = useState(getUserPoints());
  const [adRemainingMs, setAdRemainingMs] = useState(getRemainingAdTime());
  // { title, message, type: 'success'|'info'|'error' }
  const [infoModal, setInfoModal] = useState(null);

  useEffect(() => {
    setPoints(getUserPoints());

    const timer = setInterval(() => {
      setAdRemainingMs(getRemainingAdTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const showModal = (title, message, type = 'info') =>
    setInfoModal({ title, message, type });

  const handleAdWatch = () => {
    const remaining = getRemainingAdTime();
    if (remaining > 0) {
      setAdRemainingMs(remaining);
      showModal('잠시 후 가능', `광고 보상은 30분마다 받을 수 있어요.\n남은 시간: ${formatRemainingTime(remaining)}`, 'info');
      return;
    }

    addPoints(10);
    saveData(AD_LAST_WATCHED_KEY, new Date().toISOString());
    setPoints(getUserPoints());
    setAdRemainingMs(AD_COOLDOWN_MS);
    showModal('보상 획득! 🎉', '광고 시청 완료! 10P를 획득했습니다.', 'success');
  };

  const handlePremium = () => {
    showModal(
      '프리미엄 서비스 안내 👑',
      '• 광고 영구 제거\n• AI 코치 분석 무제한\n• 정밀 통계 보고서 제공\n• 포인트 적립 1.5배 상시 적용',
      'info'
    );
  };

  const claimReward = (reward) => {
    if (points >= reward.cost) {
      const newPoints = points - reward.cost;
      saveData('user_points', newPoints);
      setPoints(newPoints);
      showModal(
        '교환 완료! 🎁',
        `${reward.name} 교환이 완료되었습니다!\n남은 포인트: ${newPoints.toLocaleString()}P`,
        'success'
      );
    } else {
      showModal('포인트 부족', '포인트가 부족합니다.\n공부를 더 해서 포인트를 모아보세요!', 'error');
    }
  };

  const iconMap = {
    success: <CheckCircle size={28} color="#34C759" />,
    error:   <AlertCircle size={28} color="#FF3B30" />,
    info:    <Sparkles size={28} color="var(--primary-color)" />,
  };

  const btnColorMap = {
    success: '#34C759',
    error:   '#FF3B30',
    info:    'var(--primary-color)',
  };
  const isAdCoolingDown = adRemainingMs > 0;

  return (
    <div className="screen-container animate-fade-in" style={{ paddingBottom: '120px' }}>
      <header style={{ paddingTop: '16px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '6px' }}>보상 상점</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: '500' }}>열심히 공부한 당신, 보상을 누리세요!</p>
      </header>

      {/* 포인트 카드 */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #2F80ED, #56CCF2)',
        color: 'white',
        border: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 24px',
        marginBottom: '24px',
        borderRadius: '24px',
        boxShadow: '0 16px 32px rgba(47, 128, 237, 0.2)'
      }}>
        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '50%', marginBottom: '16px' }}>
          <Sparkles size={28} color="white" />
        </div>
        <div style={{ fontSize: '15px', fontWeight: '600', opacity: 0.9, marginBottom: '8px' }}>나의 포인트</div>
        <div style={{ fontSize: '40px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-1px' }}>
          {points.toLocaleString()} <span style={{ fontSize: '24px', opacity: 0.9 }}>P</span>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        <button
          className="btn-secondary"
          onClick={handleAdWatch}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '20px 16px', gap: '12px',
            opacity: isAdCoolingDown ? 0.65 : 1,
            background: 'var(--secondary-bg)',
            border: '2px solid var(--tertiary-bg)',
            boxShadow: 'var(--card-shadow)'
          }}
        >
          <PlayCircle size={28} color={isAdCoolingDown ? 'var(--text-tertiary)' : 'var(--primary-color)'} />
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
            {isAdCoolingDown ? '광고 대기 중' : '광고 시청 +10P'}
          </span>
          {isAdCoolingDown && (
            <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary-color)', background: 'var(--primary-light)', padding: '5px 9px', borderRadius: '10px' }}>
              남은 시간 {formatRemainingTime(adRemainingMs)}
            </span>
          )}
        </button>
        <button
          className="btn-primary"
          onClick={handlePremium}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '20px 16px', gap: '12px',
            background: 'linear-gradient(135deg, #9B51E0, #BB6BD9)',
            boxShadow: '0 8px 16px rgba(155, 81, 224, 0.25)'
          }}
        >
          <Crown size={28} color="white" />
          <span style={{ fontSize: '14px', fontWeight: '700' }}>프리미엄 혜택</span>
        </button>
      </div>

      {/* 상품 교환 목록 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Gift size={20} color="var(--primary-color)" />
        <h3 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px', margin: 0 }}>상품 교환</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {rewards.map((r, i) => (
          <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: `${r.color}15`, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Gift size={24} color={r.color} />
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>{r.name}</div>
                <div style={{ fontSize: '14px', color: 'var(--primary-color)', fontWeight: '800' }}>{r.cost.toLocaleString()} P</div>
              </div>
            </div>
            <button
              onClick={() => claimReward(r)}
              style={{
                padding: '10px 20px', borderRadius: '16px', border: 'none',
                background: points >= r.cost ? 'var(--primary-color)' : 'var(--tertiary-bg)',
                color: points >= r.cost ? 'white' : 'var(--text-tertiary)',
                fontSize: '14px', fontWeight: '700',
                cursor: points >= r.cost ? 'pointer' : 'default',
                transition: 'all 0.2s',
                boxShadow: points >= r.cost ? '0 4px 12px rgba(47,128,237,0.2)' : 'none'
              }}
            >
              교환
            </button>
          </div>
        ))}
      </div>

      {/* 인앱 알림 모달 */}
      {infoModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '24px'
        }}>
          <div style={{
            background: 'var(--secondary-bg)',
            borderRadius: '24px',
            padding: '28px 24px',
            width: '100%', maxWidth: '320px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
            animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              {iconMap[infoModal.type]}
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                {infoModal.title}
              </h3>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
              {infoModal.message}
            </p>
            <button
              onClick={() => setInfoModal(null)}
              style={{
                width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                background: btnColorMap[infoModal.type],
                color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer'
              }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardScreen;
