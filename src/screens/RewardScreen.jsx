import React, { useEffect, useMemo, useState } from 'react';
import { Gift, PlayCircle, Sparkles, Crown, CheckCircle, AlertCircle, Medal } from 'lucide-react';
import { getUserPoints, addPoints, loadData, saveData } from '../utils/storage';

const rewards = [
  { name: '스타벅스 아메리카노 Tall', cost: 15000, color: '#00704A' },
  { name: 'GS25 모바일 상품권 5,000원', cost: 20000, color: '#00D4EA' },
  { name: '배달의민족 상품권 10,000원', cost: 35000, color: '#2AC1BC' },
  { name: '문화상품권 10,000원', cost: 40000, color: '#F2994A' },
];

const badges = [
  { id: 'focus-sprout', name: '집중 새싹', price: 100, description: '공부 습관을 시작한 사용자', emoji: '🌱' },
  { id: 'escape-3days', name: '작심삼일 탈출', price: 250, description: '3일 이상 꾸준히 공부한 사용자', emoji: '🔥' },
  { id: 'routine-maker', name: '루틴 메이커', price: 500, description: '계획적으로 공부하는 사용자', emoji: '📅' },
  { id: 'todo-master', name: 'To-do 마스터', price: 800, description: '할 일을 꾸준히 완료하는 사용자', emoji: '✅' },
  { id: 'exam-survivor', name: '시험기간 생존자', price: 1200, description: '시험기간을 버텨낸 사용자', emoji: '🧠' },
  { id: 'night-owl', name: '새벽 공부러', price: 1800, description: '늦은 시간에도 공부한 사용자', emoji: '🌙' },
  { id: 'focus-cat', name: '집중 고양이', price: 2500, description: '높은 집중력을 보여준 사용자', emoji: '🐱' },
  { id: 'steady-proof', name: '꾸준함의 증명', price: 3500, description: '장기간 꾸준히 공부한 사용자', emoji: '🏅' },
  { id: 'studyfit-master', name: '스터디핏 마스터', price: 5000, description: '스터디핏을 꾸준히 사용한 최종 고급 사용자', emoji: '👑' },
];

const AD_COOLDOWN_MS = 5 * 60 * 1000;
const AD_LAST_WATCHED_KEY = 'ad_last_watched_at';
const OWNED_BADGES_KEY = 'owned_badges';
const SELECTED_BADGE_KEY = 'selected_badge_id';

const tabs = [
  { id: 'badge-shop', label: '배지 상점' },
  { id: 'my-badges', label: '내 배지' },
  { id: 'rewards', label: '상품 교환' },
];

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
  const [activeTab, setActiveTab] = useState('badge-shop');
  const [ownedBadges, setOwnedBadges] = useState(() => loadData(OWNED_BADGES_KEY, []));
  const [selectedBadgeId, setSelectedBadgeId] = useState(() => loadData(SELECTED_BADGE_KEY, null));
  const [infoModal, setInfoModal] = useState(null);

  const ownedBadgeSet = useMemo(() => new Set(ownedBadges), [ownedBadges]);

  useEffect(() => {
    setPoints(getUserPoints());

    const timer = setInterval(() => {
      setAdRemainingMs(getRemainingAdTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const showModal = (title, message, type = 'info') => setInfoModal({ title, message, type });

  const handleAdWatch = () => {
    const remaining = getRemainingAdTime();
    if (remaining > 0) {
      setAdRemainingMs(remaining);
      showModal('잠시 후 가능', `광고 보상은 5분마다 받을 수 있어요.\n남은 시간: ${formatRemainingTime(remaining)}`, 'info');
      return;
    }

    addPoints(10);
    saveData(AD_LAST_WATCHED_KEY, new Date().toISOString());
    setPoints(getUserPoints());
    setAdRemainingMs(AD_COOLDOWN_MS);
    showModal('보상 획득!', '광고 시청 완료! 10P를 획득했습니다.', 'success');
  };

  const handlePremium = () => {
    showModal(
      '프리미엄 혜택 안내',
      '광고 영구 제거\nAI 코치 분석 무제한\n고급 통계 리포트 제공\n포인트 적립 1.5배 적용',
      'info',
    );
  };

  const claimReward = (reward) => {
    if (points < reward.cost) {
      showModal('포인트 부족', '포인트가 부족합니다.', 'error');
      return;
    }

    const newPoints = points - reward.cost;
    saveData('user_points', newPoints);
    setPoints(newPoints);
    showModal('교환 완료', `${reward.name} 교환이 완료되었습니다!\n남은 포인트: ${newPoints.toLocaleString()}P`, 'success');
  };

  const handleBuyBadge = (badge) => {
    if (ownedBadgeSet.has(badge.id)) return;

    if (points < badge.price) {
      showModal('포인트 부족', '포인트가 부족합니다', 'error');
      return;
    }

    const newPoints = points - badge.price;
    const updatedOwned = [...ownedBadges, badge.id];

    saveData('user_points', newPoints);
    saveData(OWNED_BADGES_KEY, updatedOwned);

    setPoints(newPoints);
    setOwnedBadges(updatedOwned);

    showModal('배지 구매 완료', `${badge.name} 배지를 구매했어요!`, 'success');
  };

  const handleSelectBadge = (badgeId) => {
    if (!ownedBadgeSet.has(badgeId)) return;

    saveData(SELECTED_BADGE_KEY, badgeId);
    setSelectedBadgeId(badgeId);
    showModal('대표 배지 설정', '대표 배지로 설정되었습니다.', 'success');
  };

  const iconMap = {
    success: <CheckCircle size={28} color="#34C759" />,
    error: <AlertCircle size={28} color="#FF3B30" />,
    info: <Sparkles size={28} color="var(--primary-color)" />,
  };

  const btnColorMap = {
    success: '#34C759',
    error: '#FF3B30',
    info: 'var(--primary-color)',
  };

  const isAdCoolingDown = adRemainingMs > 0;

  return (
    <div className="screen-container animate-fade-in" style={{ paddingBottom: '120px' }}>
      <header style={{ paddingTop: '16px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '6px' }}>보상 상점</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: '500' }}>열심히 공부한 만큼 보상을 모아보세요!</p>
      </header>

      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.9), rgba(var(--primary-rgb), 0.68))',
          color: 'white',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '32px 24px',
          marginBottom: '24px',
          borderRadius: '24px',
          boxShadow: '0 16px 32px rgba(var(--primary-rgb), 0.14)',
        }}
      >
        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '50%', marginBottom: '16px' }}>
          <Sparkles size={28} color="white" />
        </div>
        <div style={{ fontSize: '15px', fontWeight: '600', opacity: 0.9, marginBottom: '8px' }}>나의 포인트</div>
        <div style={{ fontSize: '40px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-1px' }}>
          {points.toLocaleString()} <span style={{ fontSize: '24px', opacity: 0.9 }}>P</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <button
          className="btn-secondary"
          onClick={handleAdWatch}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px 16px',
            gap: '12px',
            opacity: isAdCoolingDown ? 0.65 : 1,
            background: 'var(--secondary-bg)',
            border: '2px solid var(--tertiary-bg)',
            boxShadow: 'var(--card-shadow)',
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
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px 16px',
            gap: '12px',
            background: 'linear-gradient(135deg, #9B51E0, #BB6BD9)',
            boxShadow: '0 8px 16px rgba(155, 81, 224, 0.25)',
          }}
        >
          <Crown size={28} color="white" />
          <span style={{ fontSize: '14px', fontWeight: '700' }}>프리미엄 혜택</span>
        </button>
      </div>

      <div className="tabs-container" style={{ marginBottom: '16px' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'badge-shop' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {badges.map((badge) => {
            const isOwned = ownedBadgeSet.has(badge.id);
            return (
              <div key={badge.id} className="card" style={{ padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0 }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                      {badge.emoji}
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{badge.name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{badge.description}</div>
                      <div style={{ marginTop: '4px', fontSize: '13px', fontWeight: '800', color: 'var(--primary-color)' }}>{badge.price.toLocaleString()}P</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleBuyBadge(badge)}
                    disabled={isOwned}
                    style={{
                      border: 'none',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: isOwned ? 'default' : 'pointer',
                      background: isOwned ? 'var(--tertiary-bg)' : 'var(--primary-color)',
                      color: isOwned ? 'var(--text-tertiary)' : 'white',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isOwned ? '보유 중' : '구매'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'my-badges' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {ownedBadges.length === 0 && (
            <div className="card" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              아직 구매한 배지가 없습니다
            </div>
          )}

          {badges
            .filter((badge) => ownedBadgeSet.has(badge.id))
            .map((badge) => {
              const isRepresentative = selectedBadgeId === badge.id;
              return (
                <div key={badge.id} className="card" style={{ padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                        {badge.emoji}
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{badge.name}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{badge.description}</div>
                        {isRepresentative && (
                          <div style={{ marginTop: '4px', fontSize: '12px', fontWeight: '700', color: 'var(--primary-color)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Medal size={14} /> 대표 배지
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectBadge(badge.id)}
                      disabled={isRepresentative}
                      style={{
                        border: 'none',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: isRepresentative ? 'default' : 'pointer',
                        background: isRepresentative ? 'var(--tertiary-bg)' : 'var(--primary-color)',
                        color: isRepresentative ? 'var(--text-tertiary)' : 'white',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isRepresentative ? '대표 배지' : '대표로 설정'}
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {activeTab === 'rewards' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {rewards.map((reward) => (
            <div key={reward.name} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', background: `${reward.color}15`, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Gift size={24} color={reward.color} />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>{reward.name}</div>
                  <div style={{ fontSize: '14px', color: 'var(--primary-color)', fontWeight: '800' }}>{reward.cost.toLocaleString()} P</div>
                </div>
              </div>
              <button
                onClick={() => claimReward(reward)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '16px',
                  border: 'none',
                  background: points >= reward.cost ? 'var(--primary-color)' : 'var(--tertiary-bg)',
                  color: points >= reward.cost ? 'white' : 'var(--text-tertiary)',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: points >= reward.cost ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  boxShadow: points >= reward.cost ? '0 4px 12px rgba(var(--primary-rgb), 0.14)' : 'none',
                }}
              >
                교환
              </button>
            </div>
          ))}
        </div>
      )}

      {infoModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '24px' }}>
          <div style={{ background: 'var(--secondary-bg)', borderRadius: '24px', padding: '28px 24px', width: '100%', maxWidth: '320px', boxShadow: '0 24px 48px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              {iconMap[infoModal.type]}
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>{infoModal.title}</h3>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.7', whiteSpace: 'pre-line' }}>{infoModal.message}</p>
            <button
              onClick={() => setInfoModal(null)}
              style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: btnColorMap[infoModal.type], color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}
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
