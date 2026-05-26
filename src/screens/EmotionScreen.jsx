import React, { useState } from 'react';
import { Sparkles, Save, ChevronRight, Activity } from 'lucide-react';
import { saveEmotionLog } from '../utils/storage';

const EmotionScreen = ({ lastSession, onSave }) => {
  const [emotion, setEmotion] = useState('😊');
  const [intensity, setIntensity] = useState(50);
  const [reason, setReason] = useState('보람참');
  const [note, setNote] = useState('');

  const emotions = [
    { emoji: '😊', label: '매우 좋음' },
    { emoji: '🤩', label: '좋음' },
    { emoji: '😐', label: '보통' },
    { emoji: '😴', label: '피곤함' },
    { emoji: '😫', label: '나쁨' }
  ];
  
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
    <div className="screen-container animate-fade-in" style={{ paddingBottom: '100px' }}>
      <header style={{ paddingTop: '16px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '6px' }}>감정 기록</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: '500' }}>오늘 공부는 어떠셨나요?</p>
      </header>

      <div className="card" style={{ 
        background: 'linear-gradient(135deg, var(--primary-color), #56CCF2)', 
        color: 'white', 
        border: 'none',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px',
        marginBottom: '24px',
        borderRadius: '20px',
        boxShadow: '0 12px 24px rgba(47, 128, 237, 0.2)'
      }}>
        <div>
          <div style={{ fontSize: '14px', opacity: 0.9, fontWeight: '500', marginBottom: '4px' }}>완료한 공부</div>
          <div style={{ fontSize: '20px', fontWeight: '800' }}>{lastSession?.subject || '알 수 없음'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14px', opacity: 0.9, fontWeight: '500', marginBottom: '4px' }}>집중 시간</div>
          <div style={{ fontSize: '20px', fontWeight: '800' }}>{lastSession?.durationMinutes || 0}분</div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sparkles size={18} color="var(--primary-color)" />
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>지금 기분은 어떤가요?</h3>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
            {emotions.map(e => (
              <button 
                key={e.emoji} 
                onClick={() => setEmotion(e.emoji)}
                style={{ 
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  background: emotion === e.emoji ? 'var(--primary-light)' : 'var(--tertiary-bg)',
                  border: emotion === e.emoji ? '2px solid var(--primary-color)' : '2px solid transparent',
                  borderRadius: '16px',
                  padding: '12px 0',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: emotion === e.emoji ? '0 4px 12px rgba(47,128,237,0.1)' : 'none'
                }}
              >
                <span style={{ fontSize: '32px' }}>{e.emoji}</span>
                <span style={{ fontSize: '12px', fontWeight: emotion === e.emoji ? '700' : '500', color: emotion === e.emoji ? 'var(--primary-color)' : 'var(--text-secondary)' }}>{e.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="var(--primary-color)" />
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>감정 강도</h3>
            </div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary-color)' }}>{intensity}%</div>
          </div>
          <input 
            type="range" 
            min="0" max="100" 
            value={intensity} 
            onChange={(e) => setIntensity(e.target.value)}
            style={{ width: '100%', accentColor: 'var(--primary-color)', height: '8px', borderRadius: '4px' }}
          />
        </div>

        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>그렇게 느낀 주된 이유</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {reasons.map(r => (
              <button 
                key={r} 
                onClick={() => setReason(r)}
                style={{ 
                  padding: '12px 18px', 
                  borderRadius: '12px', 
                  background: reason === r ? 'var(--primary-color)' : 'var(--tertiary-bg)',
                  color: reason === r ? 'white' : 'var(--text-secondary)',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: reason === r ? '700' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: reason === r ? '0 4px 12px rgba(47,128,237,0.2)' : 'none'
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>한 줄 메모</h3>
          <input 
            type="text" 
            placeholder="오늘 공부 소감을 자유롭게 적어주세요."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '16px', 
              borderRadius: '16px', 
              border: '1px solid #E2E8F0',
              background: '#F8F9FB',
              fontSize: '15px',
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'border 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
            onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
          />
        </div>

        <button className="btn-primary" onClick={handleSave} style={{ marginTop: '8px', padding: '18px' }}>
          <Save size={20} />
          기록 저장하기
        </button>
      </div>
    </div>
  );
};

export default EmotionScreen;
