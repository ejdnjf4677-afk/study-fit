import React, { useState } from 'react';
import { AlertCircle, Target, ArrowRight, Save } from 'lucide-react';
import { saveFailureLog, getAppSettings } from '../utils/storage';

const FailureScreen = ({ lastSession, onSave }) => {
  const [reason, setReason] = useState('스마트폰');
  const [detail, setDetail] = useState('');
  const [improvement, setImprovement] = useState('');

  const failureReasons = ['스마트폰', '졸음', '계획 과다', '환경 소음', '의지 부족'];

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
    <div className="screen-container" style={{ justifyContent: 'center' }}>
      <div style={{ width: '100%' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>실패 분석</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>무엇이 방해가 되었나요?</p>

        <div className="card" style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>목표 시간</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{getAppSettings().dailyGoal}분</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ArrowRight size={20} color="#E5E5EA" />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>실제 공부</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--error-color)' }}>{lastSession?.durationMinutes || 0}분</div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>주요 실패 원인</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '24px' }}>
            {failureReasons.map(r => (
              <button 
                key={r} 
                onClick={() => setReason(r)}
                style={{ 
                  padding: '12px', 
                  borderRadius: '12px', 
                  border: '1px solid #E5E5EA',
                  background: reason === r ? 'var(--primary-light)' : 'white',
                  borderColor: reason === r ? 'var(--primary-color)' : '#E5E5EA',
                  color: reason === r ? 'var(--primary-color)' : 'var(--text-primary)',
                  fontSize: '14px',
                  fontWeight: reason === r ? '600' : '400',
                  cursor: 'pointer'
                }}
              >
                {r}
              </button>
            ))}
          </div>

          <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>자세한 이유</h3>
          <textarea 
            placeholder="방해 요소를 구체적으로 적어주세요."
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            style={{ 
              width: '100%', 
              height: '80px',
              padding: '12px', 
              borderRadius: '12px', 
              border: '1px solid #E5E5EA',
              marginBottom: '24px',
              resize: 'none',
              fontFamily: 'inherit'
            }}
          />

          <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>다음 개선 방법</h3>
          <textarea 
            placeholder="내일은 어떻게 개선해볼까요?"
            value={improvement}
            onChange={(e) => setImprovement(e.target.value)}
            style={{ 
              width: '100%', 
              height: '80px',
              padding: '12px', 
              borderRadius: '12px', 
              border: '1px solid #E5E5EA',
              marginBottom: '24px',
              resize: 'none',
              fontFamily: 'inherit'
            }}
          />

          <button className="btn-primary" onClick={handleSave} style={{ background: 'var(--warning-color)' }}>
            <Save size={20} />
            분석 결과 저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default FailureScreen;
