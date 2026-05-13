import React, { useState } from 'react';
import { Smile, Frown, Meh, Star, Save } from 'lucide-react';
import { saveEmotionLog } from '../utils/storage';

const EmotionScreen = ({ lastSession, onSave }) => {
  const [emotion, setEmotion] = useState('😊');
  const [intensity, setIntensity] = useState(50);
  const [reason, setReason] = useState('보람참');
  const [note, setNote] = useState('');

  const emotions = ['😊', '🤩', '😐', '😴', '😫'];
  const reasons = ['보람참', '이해됨', '집중안됨', '피곤함', '어려움'];

  const handleSave = () => {
    saveEmotionLog({
      emotion,
      intensity,
      reason,
      note,
      subject: lastSession?.subject || '알 수 없음',
      duration: lastSession?.durationMinutes || 0
    });
    onSave();
  };

  return (
    <div className="screen-container" style={{ justifyContent: 'center' }}>
      <div style={{ width: '100%' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>감정 기록</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>오늘 공부는 어떠셨나요?</p>

        <div className="card" style={{ background: 'var(--primary-light)', border: 'none', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: '600' }}>{lastSession?.subject}</span>
            <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{lastSession?.durationMinutes}분 완료</span>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>지금 기분은 어떤가요?</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            {emotions.map(e => (
              <button 
                key={e} 
                onClick={() => setEmotion(e)}
                style={{ 
                  fontSize: '32px', 
                  background: emotion === e ? 'var(--primary-light)' : 'transparent',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '8px',
                  cursor: 'pointer'
                }}
              >
                {e}
              </button>
            ))}
          </div>

          <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>감정 강도: {intensity}%</h3>
          <input 
            type="range" 
            min="0" max="100" 
            value={intensity} 
            onChange={(e) => setIntensity(e.target.value)}
            style={{ width: '100%', marginBottom: '24px', accentColor: 'var(--primary-color)' }}
          />

          <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>이유 선택</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
            {reasons.map(r => (
              <button 
                key={r} 
                onClick={() => setReason(r)}
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: '20px', 
                  border: '1px solid #E5E5EA',
                  background: reason === r ? 'var(--primary-color)' : 'white',
                  color: reason === r ? 'white' : 'var(--text-primary)',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                {r}
              </button>
            ))}
          </div>

          <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>한 줄 메모</h3>
          <input 
            type="text" 
            placeholder="오늘 공부 소감을 적어주세요."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '12px', 
              border: '1px solid #E5E5EA',
              marginBottom: '24px'
            }}
          />

          <button className="btn-primary" onClick={handleSave}>
            <Save size={20} />
            기록 저장하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmotionScreen;
