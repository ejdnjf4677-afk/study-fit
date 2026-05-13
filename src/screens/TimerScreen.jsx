import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Music, ChevronDown, ArrowLeft } from 'lucide-react';
import { saveStudyRecord, getAppSettings, getSubjects } from '../utils/storage';

const TimerScreen = ({ onFinish, onBack }) => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [pauseCount, setPauseCount] = useState(0);
  const [subjects, setSubjects] = useState(getSubjects());
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || '공부');
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [noise, setNoise] = useState('없음');

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const handlePause = () => {
    if (isActive) {
      setPauseCount(p => p + 1);
      setIsActive(false);
    } else {
      setIsActive(true);
    }
  };

  const handleStop = () => {
    const durationMinutes = Math.round(seconds / 60);
    const sessionData = {
      subject: selectedSubject,
      durationMinutes,
      pauseCount,
      timestamp: new Date().toISOString()
    };
    saveStudyRecord(sessionData);
    onFinish(sessionData); // Pass data to next screens
  };

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="screen-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', position: 'relative' }}>
      {/* Back Button */}
      <button 
        onClick={onBack}
        style={{ 
          position: 'absolute', 
          top: '20px', 
          left: '20px', 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10
        }}
      >
        <ArrowLeft size={24} color="var(--text-primary)" />
      </button>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px' }}>
        <div className="card" style={{ width: '100%', cursor: 'pointer' }} onClick={() => setShowSubjectPicker(!showSubjectPicker)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>공부 중인 과목</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{selectedSubject}</div>
            </div>
            <ChevronDown size={20} color="var(--text-secondary)" />
          </div>
          {showSubjectPicker && (
            <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {subjects.map(s => (
                <div 
                  key={s} 
                  onClick={(e) => { e.stopPropagation(); setSelectedSubject(s); setShowSubjectPicker(false); }}
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: '20px', 
                    background: selectedSubject === s ? 'var(--primary-color)' : 'var(--secondary-bg)',
                    color: selectedSubject === s ? 'white' : 'var(--text-primary)',
                    fontSize: '13px'
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '20px 0'
        }}>
          <div style={{ 
            width: '280px', 
            height: '280px', 
            borderRadius: '50%', 
            border: '10px solid var(--secondary-bg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', fontFamily: 'monospace' }}>
              {formatTime(seconds)}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
              목표: {getAppSettings().dailyGoal}분
            </div>
            
            <svg style={{ position: 'absolute', top: -10, left: -10, width: 300, height: 300, transform: 'rotate(-90deg)' }}>
              <circle
                cx="150" cy="150" r="140"
                fill="none"
                stroke="var(--primary-color)"
                strokeWidth="10"
                strokeDasharray={880}
                strokeDashoffset={880 - (Math.min(seconds / (getAppSettings().dailyGoal * 60), 1) * 880)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
          </div>
        </div>

        <div className="card" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Music size={20} color="var(--primary-color)" />
            <span style={{ fontWeight: '600' }}>백색소음</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['없음', '빗소리', '카페', '숲'].map(n => (
              <button 
                key={n}
                onClick={() => setNoise(n)}
                style={{ 
                  flex: 1, 
                  padding: '8px', 
                  borderRadius: '8px', 
                  border: '1px solid #E5E5EA',
                  background: noise === n ? 'var(--primary-light)' : 'white',
                  color: noise === n ? 'var(--primary-color)' : 'var(--text-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
          <button 
            className="btn-secondary" 
            onClick={handlePause}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {isActive ? <Pause size={20} /> : <Play size={20} />}
            {isActive ? '일시정지' : '다시시작'}
          </button>
          <button 
            className="btn-primary" 
            onClick={handleStop}
            style={{ flex: 1, background: 'var(--error-color)' }}
          >
            <Square size={20} fill="white" />
            공부 종료
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimerScreen;
