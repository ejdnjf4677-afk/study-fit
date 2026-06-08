import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, ChevronDown, ArrowLeft, Headphones, Heart, AlertCircle, CheckCircle, X } from 'lucide-react';
import { saveStudyRecord, saveEmotionLog, saveFailureLog, getAppSettings, getSubjects } from '../utils/storage';

const WHITE_NOISE_OPTIONS = [
  { id: 'none', label: '없음' },
  { id: 'rain', label: '빗소리' },
  { id: 'cafe', label: '카페' },
  { id: 'library', label: '도서관' },
];

/* ── 감정 옵션 ── */
const EMOTIONS = [
  { emoji: '😊', label: '좋음', value: 'good' },
  { emoji: '😐', label: '보통', value: 'neutral' },
  { emoji: '😩', label: '힘듦', value: 'tired' },
  { emoji: '😤', label: '화남', value: 'focused' },
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
              background: selectedEmotion && feltFailure !== null ? 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.9), rgba(var(--primary-rgb), 0.72))' : 'var(--tertiary-bg)',
              color: selectedEmotion && feltFailure !== null ? 'white' : 'var(--text-tertiary)',
              fontSize: '16px', fontWeight: '700', cursor: selectedEmotion && feltFailure !== null ? 'pointer' : 'default',
              transition: 'all 0.3s',
              boxShadow: selectedEmotion && feltFailure !== null ? '0 8px 16px rgba(var(--primary-rgb), 0.18)' : 'none'
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
const SESSION_KEY = 'studyfit_active_session';

const TimerScreen = ({ onFinish, onBack }) => {
  // Date.now() 기반 정확한 타이머를 위한 ref
  const startTimeRef = useRef(null);  // 마지막으로 재시작된 시각 (ms)
  const accumulatedRef = useRef(0);   // 이전 세그먼트에서 누적된 초
  const soundRef = useRef({
    context: null,
    sources: [],
    gains: [],
    filters: [],
    currentPreset: 'none',
  });

  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [pauseCount, setPauseCount] = useState(0);
  const [pauseStartedAt, setPauseStartedAt] = useState(null);
  const [totalPausedSeconds, setTotalPausedSeconds] = useState(0);
  const [subjects] = useState(getSubjects());
  const [selectedSubject, setSelectedSubject] = useState(getSubjects()[0] || '공부');
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [noise, setNoise] = useState('none');
  const [showPostModal, setShowPostModal] = useState(false);
  const [sessionData, setSessionData] = useState(null);

  /* ── 앱 시작 시 이전 세션 복원 ── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const session = JSON.parse(raw);

      const accumulated = session.accumulatedSeconds || 0;
      setPauseCount(session.pauseCount || 0);
      setTotalPausedSeconds(session.totalPausedSeconds || 0);
      if (session.selectedSubject) setSelectedSubject(session.selectedSubject);

      if (session.startTime) {
        // 앱 종료 전에 타이머가 실행 중이었음 → 경과 시간 자동 누적
        const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
        const newAcc = accumulated + elapsed;
        accumulatedRef.current = newAcc;
        startTimeRef.current = Date.now();
        setDisplaySeconds(newAcc);
        setIsActive(true);
        localStorage.setItem(SESSION_KEY, JSON.stringify({
          ...session,
          startTime: Date.now(),
          accumulatedSeconds: newAcc,
        }));
      } else {
        // 일시정지 상태로 종료됨
        accumulatedRef.current = accumulated;
        setDisplaySeconds(accumulated);
        if (session.pauseStartedAt) setPauseStartedAt(session.pauseStartedAt);
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  useEffect(() => {
    return () => stopWhiteNoise(true);
  }, []);

  /* ── 화면 갱신 인터벌 (0.5초, UI 전용) ── */
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      if (startTimeRef.current !== null) {
        setDisplaySeconds(
          accumulatedRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000)
        );
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isActive]);

  /* ── 일시정지 / 재시작 ── */
  const handlePause = () => {
    if (isActive) {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const newAcc = accumulatedRef.current + elapsed;
      const newPauseCount = pauseCount + 1;
      const psa = Date.now();

      accumulatedRef.current = newAcc;
      startTimeRef.current = null;
      setDisplaySeconds(newAcc);
      setPauseCount(newPauseCount);
      setPauseStartedAt(psa);
      setIsActive(false);
      stopWhiteNoise(true);

      localStorage.setItem(SESSION_KEY, JSON.stringify({
        startTime: null,
        accumulatedSeconds: newAcc,
        pauseCount: newPauseCount,
        totalPausedSeconds,
        pauseStartedAt: psa,
        selectedSubject,
      }));
    } else {
      const now = Date.now();
      let newTps = totalPausedSeconds;
      if (pauseStartedAt) {
        newTps = totalPausedSeconds + Math.round((now - pauseStartedAt) / 1000);
        setTotalPausedSeconds(newTps);
        setPauseStartedAt(null);
      }
      startTimeRef.current = now;
      setIsActive(true);
      if (noise !== 'none') {
        startWhiteNoise(noise);
      }

      localStorage.setItem(SESSION_KEY, JSON.stringify({
        startTime: now,
        accumulatedSeconds: accumulatedRef.current,
        pauseCount,
        totalPausedSeconds: newTps,
        pauseStartedAt: null,
        selectedSubject,
      }));
    }
  };

  /* ── 정지 ── */
  const handleStop = () => {
    const finalSeconds = startTimeRef.current !== null
      ? accumulatedRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000)
      : accumulatedRef.current;
    const activePauseSeconds = pauseStartedAt
      ? Math.round((Date.now() - pauseStartedAt) / 1000)
      : 0;
    const finalPausedSeconds = totalPausedSeconds + activePauseSeconds;

    setIsActive(false);
    stopWhiteNoise(true);
    localStorage.removeItem(SESSION_KEY);
    startTimeRef.current = null;
    accumulatedRef.current = 0;

    const data = {
      subject: selectedSubject,
      durationMinutes: Math.round(finalSeconds / 60),
      durationSeconds: finalSeconds,
      pauseCount,
      pauseMinutes: Math.round(finalPausedSeconds / 60),
      timestamp: new Date().toISOString(),
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

  function createNoiseBuffer(context, seconds = 8) {
    const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  function stopWhiteNoise(releaseContext = false) {
    const controller = soundRef.current;
    controller.sources.forEach((source) => {
      try {
        source.stop(0);
      } catch {
        // 이미 정지된 소스는 무시
      }
      try {
        source.disconnect();
      } catch {
        // ignore
      }
    });
    controller.filters.forEach((filter) => {
      try {
        filter.disconnect();
      } catch {
        // ignore
      }
    });
    controller.gains.forEach((gain) => {
      try {
        gain.disconnect();
      } catch {
        // ignore
      }
    });
    controller.sources = [];
    controller.filters = [];
    controller.gains = [];
    controller.currentPreset = 'none';

    if (releaseContext && controller.context) {
      try {
        controller.context.close();
      } catch {
        // ignore
      }
      controller.context = null;
    }
  }

  function startWhiteNoise(nextPreset) {
    stopWhiteNoise(true);
    if (nextPreset === 'none') return;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const context = new AudioCtx();
    const controller = soundRef.current;
    controller.context = context;
    controller.currentPreset = nextPreset;

    const masterGain = context.createGain();
    masterGain.gain.value = 0.08;

    const noiseSource = context.createBufferSource();
    noiseSource.buffer = createNoiseBuffer(context, 8);
    noiseSource.loop = true;

    const nodes = [noiseSource];
    const gains = [masterGain];
    const filters = [];

    const addBand = (type, frequency, q = 1) => {
      const filter = context.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = frequency;
      filter.Q.value = q;

      const gain = context.createGain();
      gain.gain.value = 1;

      filters.push(filter);
      gains.push(gain);
      return { filter, gain };
    };

    if (nextPreset === 'rain') {
      const rainBody = addBand('bandpass', 1800, 0.45);
      const rainSoftener = addBand('lowpass', 4200, 0.6);
      const rainLow = addBand('lowpass', 900, 0.5);
      rainLow.gain.gain.value = 0.18;

      noiseSource.connect(rainBody.filter);
      rainBody.filter.connect(rainBody.gain);
      rainBody.gain.connect(rainSoftener.filter);
      rainSoftener.filter.connect(rainSoftener.gain);
      rainSoftener.gain.connect(masterGain);

      noiseSource.connect(rainLow.filter);
      rainLow.filter.connect(rainLow.gain);
      rainLow.gain.connect(masterGain);

      const rainPulse = context.createOscillator();
      rainPulse.type = 'sine';
      rainPulse.frequency.value = 0.12;
      const rainPulseDepth = context.createGain();
      rainPulseDepth.gain.value = 0.015;
      rainPulse.connect(rainPulseDepth);
      rainPulseDepth.connect(masterGain.gain);
      rainPulse.start();

      nodes.push(rainPulse);
      gains.push(rainPulseDepth);
      masterGain.gain.value = 0.1;
    } else if (nextPreset === 'cafe') {
      const bandpass = addBand('bandpass', 700, 0.9);
      const lowpass = addBand('lowpass', 6000, 0.7);
      noiseSource.connect(bandpass.filter);
      bandpass.filter.connect(bandpass.gain);
      bandpass.gain.connect(lowpass.filter);
      lowpass.filter.connect(lowpass.gain);
      lowpass.gain.connect(masterGain);
      masterGain.gain.value = 0.12;

      const hum = context.createOscillator();
      hum.type = 'sine';
      hum.frequency.value = 110;
      const humGain = context.createGain();
      humGain.gain.value = 0.02;
      hum.connect(humGain);
      humGain.connect(masterGain);
      hum.start();
      nodes.push(hum);
      gains.push(humGain);
    } else if (nextPreset === 'library') {
      const highpass = addBand('highpass', 180, 0.8);
      const lowpass = addBand('lowpass', 2500, 0.8);
      noiseSource.connect(highpass.filter);
      highpass.filter.connect(highpass.gain);
      highpass.gain.connect(lowpass.filter);
      lowpass.filter.connect(lowpass.gain);
      lowpass.gain.connect(masterGain);
      masterGain.gain.value = 0.07;

      const fan = context.createOscillator();
      fan.type = 'triangle';
      fan.frequency.value = 60;
      const fanGain = context.createGain();
      fanGain.gain.value = 0.015;
      fan.connect(fanGain);
      fanGain.connect(masterGain);
      fan.start();
      nodes.push(fan);
      gains.push(fanGain);
    } else {
      noiseSource.connect(masterGain);
      masterGain.gain.value = 0.08;
    }

    masterGain.connect(context.destination);

    if (context.state === 'suspended') {
      context.resume().catch(() => {});
    }

    noiseSource.start();

    controller.sources = nodes;
    controller.filters = filters;
    controller.gains = gains;
  }

  function handleNoiseSelect(nextNoise) {
    setNoise(nextNoise);

    if (nextNoise === 'none') {
      stopWhiteNoise(true);
      return;
    }

    if (isActive) {
      startWhiteNoise(nextNoise);
    } else {
      stopWhiteNoise(true);
    }
  }

  const dailyGoal = getAppSettings().dailyGoal;
  const progress = Math.min(displaySeconds / (dailyGoal * 60), 1);

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
                  <stop offset="0%" stopColor={`rgba(var(--primary-rgb), 0.9)`} />
                  <stop offset="100%" stopColor={`rgba(var(--primary-rgb), 0.62)`} />
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
              {formatTime(displaySeconds)}
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
            {WHITE_NOISE_OPTIONS.map(option => (
              <button
                key={option.id}
                onClick={() => handleNoiseSelect(option.id)}
                style={{
                  flex: 1, padding: '12px 8px', borderRadius: '12px',
                  border: noise === option.id ? '2px solid var(--primary-color)' : '2px solid transparent',
                  background: noise === option.id ? 'var(--primary-light)' : 'var(--tertiary-bg)',
                  color: noise === option.id ? 'var(--primary-color)' : 'var(--text-secondary)',
                  fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >{option.label}</button>
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
              boxShadow: isActive ? '0 8px 16px rgba(242,153,74,0.2)' : '0 8px 16px rgba(var(--primary-rgb), 0.14)',
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
