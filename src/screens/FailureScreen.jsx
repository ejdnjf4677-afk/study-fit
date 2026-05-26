import React, { useState } from 'react';
import { Target, ArrowRight, Save, AlertTriangle, Smartphone, Moon, ZapOff, Users, Clock, Flame, Info } from 'lucide-react';
import { saveFailureLog, getAppSettings } from '../utils/storage';

const FailureScreen = ({ lastSession, onSave }) => {
  const [reason, setReason] = useState('스마트폰');
  const [detail, setDetail] = useState('');
  const [improvement, setImprovement] = useState('');

  const failureReasons = [
    { label: '스마트폰', icon: Smartphone },
    { label: '졸음/피로', icon: Moon },
    { label: '의지 부족', icon: ZapOff },
    { label: '약속/소음', icon: Users },
    { label: '계획 과다', icon: Clock },
    { label: '동기 하락', icon: Flame },
  ];

  const handleSave = () => {
    saveFailureLog({
      reason,
      detail,
      improvement,
      subject: lastSession?.subject || '알 수 없음',
      targetMinutes: getAppSettings().dailyGoal,
      actualMinutes: lastSession?.durationMinutes || 0
    });
    onSave();
  };

  return (
    <div className="screen-container animate-fade-in" style={{ paddingBottom: '100px' }}>
      <header style={{ paddingTop: '16px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '6px' }}>실패 분석</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: '500' }}>무엇이 방해가 되었나요?</p>
      </header>

      <div className="card" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '24px',
        marginBottom: '24px',
        background: '#FFF5F5',
        border: '1px solid #FFE0E0',
        borderRadius: '20px'
      }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '6px' }}>목표 시간</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>{getAppSettings().dailyGoal}<span style={{ fontSize: '14px' }}>분</span></div>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '8px', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <ArrowRight size={20} color="var(--error-color)" />
          </div>
        </div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '6px' }}>실제 공부</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--error-color)' }}>{lastSession?.durationMinutes || 0}<span style={{ fontSize: '14px' }}>분</span></div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertTriangle size={18} color="var(--error-color)" />
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>가장 큰 실패 원인 하나</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {failureReasons.map((r, idx) => {
              const Icon = r.icon;
              return (
                <button 
                  key={idx} 
                  onClick={() => setReason(r.label)}
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '14px', 
                    borderRadius: '16px', 
                    border: reason === r.label ? '2px solid var(--error-color)' : '2px solid transparent',
                    background: reason === r.label ? '#FFF5F5' : 'var(--tertiary-bg)',
                    color: reason === r.label ? 'var(--error-color)' : 'var(--text-secondary)',
                    fontSize: '14px',
                    fontWeight: reason === r.label ? '700' : '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Icon size={18} />
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Info size={16} color="var(--primary-color)" />
            구체적인 방해 요소
          </h3>
          <textarea 
            placeholder="어떤 점이 방해가 되었는지 자유롭게 적어주세요."
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            style={{ 
              width: '100%', 
              height: '100px',
              padding: '16px', 
              borderRadius: '16px', 
              border: '1px solid #E2E8F0',
              background: '#F8F9FB',
              marginBottom: '8px',
              resize: 'none',
              fontFamily: 'inherit',
              fontSize: '15px',
              outline: 'none',
              transition: 'border 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
            onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
          />
        </div>

        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={16} color="var(--primary-color)" />
            다음 공부 개선 방안
          </h3>
          <textarea 
            placeholder="내일은 어떻게 해보면 좋을까요? (예: 폰은 다른 방에 둔다)"
            value={improvement}
            onChange={(e) => setImprovement(e.target.value)}
            style={{ 
              width: '100%', 
              height: '100px',
              padding: '16px', 
              borderRadius: '16px', 
              border: '1px solid #E2E8F0',
              background: '#F8F9FB',
              resize: 'none',
              fontFamily: 'inherit',
              fontSize: '15px',
              outline: 'none',
              transition: 'border 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
            onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
          />
        </div>

        <button 
          onClick={handleSave} 
          style={{ 
            background: 'linear-gradient(135deg, #EB5757, #F2994A)', 
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            padding: '18px',
            fontSize: '16px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            cursor: 'pointer',
            boxShadow: '0 8px 16px rgba(235, 87, 87, 0.25)',
            marginTop: '8px',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.96)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(235, 87, 87, 0.2)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(235, 87, 87, 0.25)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(235, 87, 87, 0.25)'; }}
        >
          <Save size={20} />
          실패 분석 저장하기
        </button>
      </div>
    </div>
  );
};

export default FailureScreen;
