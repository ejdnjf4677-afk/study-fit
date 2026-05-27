import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, ChevronDown, ArrowLeft, Headphones, Heart, AlertCircle, CheckCircle, X } from 'lucide-react';
import { saveStudyRecord, saveEmotionLog, saveFailureLog, getAppSettings, getSubjects } from '../utils/storage';

/* ── 감정 옵션 ── */
const EMOTIONS = [
  { emoji: '😊', label: '좋음', value: 'good' },
  { emoji: '😐', label: '보통', value: 'neutral' },
  { emoji: '😩', label: '힘듦', value: 'tired' },
  { emoji: '😤', label: '집중됨', value: 'focused' },
  { emoji: '😰', label: '불안함', value: 'anxious' },
  { emoji: '😴', label: '졸림', value: 'sleepy' },
];

/* ── 실패 원인 옵션 ── */
const FAILURE_CAUSES = [
  { emoji: '📱', label: '스마트폰', value: 'phone' },
  { emoji: '💬', label: '주변 소음', value: 'noise' },
  { emoji: '😴', label: '졸음', value: 'sleepiness' },
  { emoji: '😰', label: '불안 / 걱정', value: 'anxiety' },
  { emoji: '🤯', label: '과부하', value: 'overload' },
  { emoji: '🎮', label: '유튜브/게임', value: 'distraction' },
  { emoji: '😷', label: '컨디션 난조', value: 'health' },
  { emoji: '❓', label: '기타', value: 'etc' },
];

/* ── Post-session Modal ── */
const PostSessionModal = ({ sessionData, onDone }) => {
  const [step, setStep] = useState('emotion');   // 'emotion' | 'failure' | 'done'
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [selectedCauses, setSelectedCauses] = useState([]);
  const [feltFailure, setFeltFailure] = useState(null);  // true | false | null
  const [note, setNote] = useState('');

  const durationStr = `${Math.floor(sessionData.durationMinutes / 60)}시간 ${sessionData.durationMinutes % 60}분`;

  const toggleCause = (v) =>
    setSelectedCauses(prev =>
      prev.includes(v) ? prev.filter(c => c !== v) : [...prev, v]
    );

  const handleEmotionNext = () => {
    if (!selectedEmotion) return;
    if (feltFailure === true) {
      setStep('failure');
    } else {
      finalize();
    }
  };

  const finalize = () => {
    // 공부 기록 저장
    saveStudyRecord(sessionData);

    // 감정 로그 저장
    if (selectedEmotion) {
      saveEmotionLog({ emotion: selectedEmotion, subject: sessionData.subject, durationMinutes: sessionData.durationMinutes });
    }

    // 실패 원인 저장
    if (feltFailure && selectedCauses.length > 0) {
      saveFailureLog({ causes: selectedCauses, note, subject: sessionData.subject, durationMinutes: sessionData.durationMinutes });
    }

    onDone();
  };

  /* ─── STEP 1: 감정 + 실패 여부 ─── */
  if (step === 'emotion') {
    return (
      <div className="modal-overlay" style={{ backgroundColor: 'rgba(15,23,42,0.75)' }}>
        <div style={{
          background: 'var(--secondary-bg)',
          borderRadius: '28px',
          padding: '28px 24px',
          width: '100%',
          maxWidth: '360px',
          boxShadow: '0 32px 64px rgba(0,0,0,0.2)',
          animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)'
        }}>
          {/* 세션 요약 */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🎉</div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>공부 완료!</h3>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'var(--primary-light)', color: 'var(--primary-color)',
              borderRadius: '12px', padding: '6px 14px', fontSize: '14px', fontWeight: '700'
            }}>
              <Heart size={14} />
              {sessionData.subject} · {durationStr}
            </div>
          </div>

          {/* 감정 선택 */}
          <p style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px', color: 'var(--text-primary)' }}>
            지금 기분이 어때요?
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '22px' }}>
            {EMOTIONS.map(em => (
              <button
                key={em.value}
                onClick={() => setSelectedEmotion(em.value)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  padding: '12px 8px',
                  borderRadius: '16px',
                  border: selectedEmotion === em.value ? '2px solid var(--primary-color)' : '2px solid var(--tertiary-bg)',
                  background: selectedEmotion === em.value ? 'var(--primary-light)' : 'var(--tertiary-bg)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '24px' }}>{em.emoji}</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: selectedEmotion === em.value ? 'var(--primary-color)' : 'var(--text-secondary)' }}>
                  {em.label}
                </span>
              </button>
            ))}
          </div>

          {/* 실패 여부 */}
          <p style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>
            이번 세션이 실패했다고 느끼나요?
          </p>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
            <button
              onClick={() => setFeltFailure(false)}
              style={{
                flex: 1, padding: '12px', borderRadius: '14px',
                border: feltFailure === false ? '2px solid var(--success-color)' : '2px solid var(--tertiary-bg)',
                background: feltFailure === false ? '#E6F9EC' : 'var(--tertiary-bg)',
                color: feltFailure === false ? 'var(--success-color)' : 'var(--text-secondary)',
                fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              <CheckCircle size={16} /> 성공!
            </button>
            <button
              onClick={() => setFeltFailure(true)}
              style={{
                flex: 1, padding: '12px', borderRadius: '14px',
                border: feltFailure === true ? '2px solid var(--error-color)' : '2px solid var(--tertiary-bg)',
                background: feltFailure === true ? '#FFF0F0' : 'var(--tertiary-bg)',
                color: feltFailure === true ? 'var(--error-color)' : 'var(--text-secondary)',
                fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              <AlertCircle size={16} /> 아쉬워요
            </button>
          </div>

          <button
            onClick={handleEmotionNext}
            disabled={!selectedEmotion || feltFailure === null}
            style={{
              width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
              background: selectedEmotion && feltFailure !== null ? 'linear-gradient(135deg, var(--primary-color), #56CCF2)' : 'var(--tertiary-bg)',
              color: selectedEmotion && feltFailure !== null ? 'white' : 'var(--text-tertiary)',
              fontSize: '16px', fontWeight: '700', cursor: selectedEmotion && feltFailure !== null ? 'pointer' : 'default',
              transition: 'all 0.3s',
              boxShadow: selectedEmotion && feltFailure !== null ? '0 8px 16px rgba(47,128,237,0.25)' : 'none'
            }}
          >
            {feltFailure ? '다음 →' : '완료 🎉'}
          </button>
        </div>
      </div>
    );
  }

  /* ─── STEP 2: 실패 원인 분석 ─── */
  return (
    <div className="modal-overlay" style={{ backgroundColor: 'rgba(15,23,42,0.75)' }}>
      <div style={{
        background: 'var(--secondary-bg)',
        borderRadius: '28px',
        padding: '28px 24px',
        width: '100%',
        maxWidth: '360px',
        boxShadow: '0 32px 64px rgba(0,0,0,0.2)',
        animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <h3 style={{ fontSize: '19px', fontWeight: '800' }}>실패 원인 분석</h3>
          <button onClick={finalize} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={20} color="var(--text-tertiary)" />
          </button>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          집중을 방해한 원인을 선택해주세요. (복수 선택 가능)
        </p>

        {/* 원인 그리드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
          {FAILURE_CAUSES.map(cause => {
            const selected = selectedCauses.includes(cause.value);
            return (
              <button
                key={cause.value}
                onClick={() => toggleCause(cause.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '14px 12px',
                  borderRadius: '16px',
                  border: selected ? '2px solid var(--error-color)' : '2px solid var(--tertiary-bg)',
                  background: selected ? '#FFF0F0' : 'var(--tertiary-bg)',
                  color: selected ? 'var(--error-color)' : 'var(--text-secondary)',
                  fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
                  textAlign: 'left'
                }}
              >
                <span style={{ fontSize: '20px' }}>{cause.emoji}</span>
                {cause.label}
              </button>
            );
          })}
        </div>

        {/* 메모 */}
        <textarea
          placeholder="추가로 기록할 내용이 있으면 적어주세요... (선택)"
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          style={{
            width: '100%', padding: '12px 14px', borderRadius: '14px',
            border: '1.5px solid var(--tertiary-bg)',
            background: 'var(--tertiary-bg)',
            color: 'var(--text-primary)',
            fontSize: '14px', fontFamily: 'inherit',
            resize: 'none', outline: 'none', marginBottom: '20px',
            transition: 'border-color 0.2s'
          }}
          onFocus={e => e.target.style.borderColor = 'var(--primary-color)'}
          onBlur={e => e.target.style.borderColor = 'var(--tertiary-bg)'}
        />

        {/* 선택된 원인 요약 */}
        {selectedCauses.length > 0 && (
          <div style={{
            background: 'var(--primary-light)', borderRadius: '12px', padding: '10px 14px',
            marginBottom: '16px', fontSize: '13px', color: 'var(--primary-color)', fontWeight: '600'
          }}>
            선택된 원인: {selectedCauses.map(v => FAILURE_CAUSES.find(c => c.value === v)?.label).join(', ')}
          </div>
        )}

        <button
          onClick={finalize}
          style={{
            width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
            background: 'linear-gradient(135deg, #EB5757, #F2994A)',
            color: 'white', fontSize: '16px', fontWeight: '700', cursor: 'pointer',
            boxShadow: '0 8px 16px rgba(235,87,87,0.25)', transition: 'all 0.3s'
          }}
        >
          분석 완료 ✓
        </button>
      </div>
    </div>
  );
};

/* ── TimerScreen ── */
const TimerScreen = ({ onFinish, onBack }) => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [pauseCount, setPauseCount] = useState(0);
  const [pauseStartedAt, setPauseStartedAt] = useState(null);
  const [totalPausedSeconds, setTotalPausedSeconds] = useState(0);
  const [subjects] = useState(getSubjects());
  const [selectedSubject, setSelectedSubject] = useState(getSubjects()[0] || '공부');
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [noise, setNoise] = useState('없음');
  const [showPostModal, setShowPostModal] = useState(false);
  const [sessionData, setSessionData] = useState(null);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const handlePause = () => {
    if (isActive) {
      setPauseCount(p => p + 1);
      setPauseStartedAt(Date.now());
      setIsActive(false);
    } else {
      if (pauseStartedAt) {
        setTotalPausedSeconds(prev => prev + Math.round((Date.now() - pauseStartedAt) / 1000));
        setPauseStartedAt(null);
      }
      setIsActive(true);
    }
  };

  const handleStop = () => {
    setIsActive(false);
    const activePauseSeconds = pauseStartedAt ? Math.round((Date.now() - pauseStartedAt) / 1000) : 0;
    const finalPausedSeconds = totalPausedSeconds + activePauseSeconds;
    const durationMinutes = Math.round(seconds / 60);
    const data = {
      subject: selectedSubject,
      durationMinutes,
      pauseCount,
      pauseMinutes: Math.round(finalPausedSeconds / 60),
      timestamp: new Date().toISOString()
    };
    setSessionData(data);
    setShowPostModal(true);
  };

  const handleModalDone = () => {
    setShowPostModal(false);
    onFinish(sessionData);
  };

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const dailyGoal = getAppSettings().dailyGoal;
  const progress = Math.min(seconds / (dailyGoal * 60), 1);

  return (
    <div className="screen-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0 24px', backgroundColor: 'var(--bg-color)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '24px', paddingBottom: '16px' }}>
        <button
          onClick={onBack}
          style={{ background: 'var(--secondary-bg)', border: '1px solid var(--tertiary-bg)', borderRadius: '50%', cursor: 'pointer', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--card-shadow)' }}
        >
          <ArrowLeft size={20} color="var(--text-primary)" />
        </button>
        <span style={{ fontSize: '18px', fontWeight: '700' }}>타이머</span>
        <div style={{ width: '42px' }} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '32px' }}>

        {/* Subject Dropdown */}
        <div style={{ position: 'relative', marginTop: '16px', zIndex: 10 }}>
          <div className="card" style={{ cursor: 'pointer', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '20px' }} onClick={() => setShowSubjectPicker(!showSubjectPicker)}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '4px' }}>현재 공부 중인 과목</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary-color)' }}>{selectedSubject}</div>
            </div>
            <div style={{ background: 'var(--primary-light)', padding: '8px', borderRadius: '50%' }}>
              <ChevronDown size={20} color="var(--primary-color)" style={{ transform: showSubjectPicker ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
            </div>
          </div>
          {showSubjectPicker && (
            <div className="card animate-slide-up" style={{ position: 'absolute', top: '90px', left: 0, right: 0, padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '10px', zIndex: 20 }}>
              {subjects.map(s => (
                <div
                  key={s}
                  onClick={(e) => { e.stopPropagation(); setSelectedSubject(s); setShowSubjectPicker(false); }}
                  style={{
                    padding: '10px 16px', borderRadius: '12px',
                    background: selectedSubject === s ? 'var(--primary-color)' : 'var(--tertiary-bg)',
                    color: selectedSubject === s ? 'white' : 'var(--text-secondary)',
                    fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >{s}</div>
              ))}
            </div>
          )}
        </div>

        {/* Timer Circle */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, margin: '20px 0' }}>
          <div style={{ width: '280px', height: '280px', borderRadius: '50%', background: 'var(--secondary-bg)', boxShadow: 'var(--card-shadow)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <defs>
                <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2F80ED" />
                  <stop offset="100%" stopColor="#56CCF2" />
                </linearGradient>
              </defs>
              <circle cx="140" cy="140" r="130" fill="none" stroke="var(--tertiary-bg)" strokeWidth="12" />
              <circle
                cx="140" cy="140" r="130" fill="none"
                stroke="url(#timerGradient)" strokeWidth="12"
                strokeDasharray={816}
                strokeDashoffset={816 - (progress * 816)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div style={{ fontSize: '56px', fontWeight: '800', letterSpacing: '-2px', color: 'var(--text-primary)', zIndex: 2 }}>
              {formatTime(seconds)}
            </div>
            <div style={{ color: 'var(--text-tertiary)', fontSize: '15px', fontWeight: '600', marginTop: '4px', zIndex: 2 }}>
              목표: {dailyGoal}분
            </div>
          </div>
        </div>

        {/* Noise Selector */}
        <div className="card" style={{ padding: '20px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Headphones size={20} color="var(--primary-color)" />
            <span style={{ fontWeight: '700', fontSize: '16px' }}>백색소음</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['없음', '빗소리', '카페', '도서관'].map(n => (
              <button
                key={n}
                onClick={() => setNoise(n)}
                style={{
                  flex: 1, padding: '12px 8px', borderRadius: '12px',
                  border: noise === n ? '2px solid var(--primary-color)' : '2px solid transparent',
                  background: noise === n ? 'var(--primary-light)' : 'var(--tertiary-bg)',
                  color: noise === n ? 'var(--primary-color)' : 'var(--text-secondary)',
                  fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >{n}</button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
          <button
            onClick={handlePause}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              background: isActive ? 'var(--warning-color)' : 'var(--primary-color)',
              color: 'white', border: 'none', borderRadius: '20px', padding: '18px',
              fontSize: '18px', fontWeight: '700', cursor: 'pointer',
              boxShadow: isActive ? '0 8px 16px rgba(242,153,74,0.2)' : '0 8px 16px rgba(47,128,237,0.2)',
              transition: 'all 0.3s'
            }}
          >
            {isActive ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
            {isActive ? '일시정지' : '다시시작'}
          </button>

          <button
            onClick={handleStop}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--secondary-bg)', color: 'var(--error-color)',
              border: '2px solid var(--error-color)', borderRadius: '20px',
              padding: '16px 24px', cursor: 'pointer', transition: 'all 0.3s'
            }}
          >
            <Square size={24} fill="currentColor" />
          </button>
        </div>
      </div>

      {/* Post-session Modal */}
      {showPostModal && sessionData && (
        <PostSessionModal sessionData={sessionData} onDone={handleModalDone} />
      )}
    </div>
  );
};

export default TimerScreen;
