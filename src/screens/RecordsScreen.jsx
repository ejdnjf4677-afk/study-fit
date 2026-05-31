import React, { useState, useEffect } from 'react';
import { Calendar, Trash2, Clock, Smile, AlertCircle, BarChart3, ChevronDown, ChevronUp, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { getStudyRecords, getEmotionLogs, getFailureLogs, deleteRecord, saveEmotionLog, saveFailureLog } from '../utils/storage';

const RecordsScreen = () => {
  const [records, setRecords] = useState([]);
  const [emotions, setEmotions] = useState([]);
  const [failures, setFailures] = useState([]);
  const [activeTab, setActiveTab] = useState('study');
  const [expandedDate, setExpandedDate] = useState(new Date().toLocaleDateString());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [deleteModal, setDeleteModal] = useState(null); // { type, id }
  const [infoModal, setInfoModal] = useState(null);   // { message }

  // Emotion Form State
  const [emotion, setEmotion] = useState('😊');
  const [emotionIntensity, setEmotionIntensity] = useState(50);
  const [emotionReason, setEmotionReason] = useState('성취감을 느껴서');
  const [emotionNote, setEmotionNote] = useState('');

  const emotionOptions = ['매우 좋음', '좋음', '보통', '나쁨', '매우 나쁨'];
  const emotionReasons = ['목표를 달성해서', '공부가 재미있어서', '이해가 잘돼서', '성취감을 느껴서', '계획대로 진행돼서', '자신감이 생겨서', '기타'];

  // Failure Form State
  const [failureReason, setFailureReason] = useState('집중력 부족');
  const [failureDetail, setFailureDetail] = useState('');
  const [failureImprovement, setFailureImprovement] = useState('');

  const failureReasons = ['집중력 부족', '스마트폰 사용', '피로/컨디션', '약속/일정', '시간 관리 실패', '이해 부족', '동기 부족', '기타'];

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    setRecords(getStudyRecords());
    setEmotions(getEmotionLogs());
    setFailures(getFailureLogs());
  };

  const handleDelete = (type, id) => {
    setDeleteModal({ type, id });
  };

  const confirmDelete = () => {
    if (!deleteModal) return;
    const keyMap = {
      study: 'study_records',
      emotion: 'emotion_logs',
      failure: 'failure_logs'
    };
    deleteRecord(keyMap[deleteModal.type], deleteModal.id);
    setDeleteModal(null);
    loadAllData();
  };

  const handleSaveEmotion = () => {
    saveEmotionLog({
      emotion,
      intensity: emotionIntensity,
      reason: emotionReason,
      note: emotionNote,
      subject: '자율 기록',
      duration: 0
    });
    setInfoModal({ message: '감정 기록이 저장되었습니다.' });
    setEmotionNote('');
    loadAllData();
  };

  const handleSaveFailure = () => {
    saveFailureLog({
      reason: failureReason,
      detail: failureDetail,
      improvement: failureImprovement,
      subject: '자율 기록',
      targetMinutes: 0,
      actualMinutes: 0
    });
    setInfoModal({ message: '분석 결과가 저장되었습니다.' });
    setFailureDetail('');
    setFailureImprovement('');
    loadAllData();
  };

  const getTodayRecords = () => {
    const today = new Date().toLocaleDateString();
    return records.filter(r => new Date(r.timestamp).toLocaleDateString() === today);
  };

  const getGroupedRecords = () => {
    const groups = {};
    records.forEach(r => {
      const date = new Date(r.timestamp).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(r);
    });
    return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  };

  const getSubjectStats = () => {
    const stats = {};
    records.forEach(r => {
      stats[r.subject] = (stats[r.subject] || 0) + r.durationMinutes;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  };

  const getDateKey = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const selectedDateKey = getDateKey(selectedDate);
  const selectedDateLabel = selectedDate.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });

  const getCalendarData = () => {
    const data = {};
    const add = (type, item) => {
      const key = getDateKey(item.timestamp);
      if (!data[key]) data[key] = { study: 0, emotion: 0, failure: 0, minutes: 0 };
      data[key][type] += 1;
      if (type === 'study') data[key].minutes += item.durationMinutes || 0;
    };

    records.forEach(item => add('study', item));
    emotions.forEach(item => add('emotion', item));
    failures.forEach(item => add('failure', item));
    return data;
  };

  const getSelectedSummary = () => {
    const isSelectedDay = (item) => getDateKey(item.timestamp) === selectedDateKey;
    return {
      study: records.filter(isSelectedDay),
      emotion: emotions.filter(isSelectedDay),
      failure: failures.filter(isSelectedDay)
    };
  };

  const moveCalendarMonth = (offset) => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const renderCalendar = () => {
    const calendarData = getCalendarData();
    const selectedSummary = getSelectedSummary();
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [
      ...Array.from({ length: firstDay }, (_, i) => ({ key: `empty-${i}`, empty: true })),
      ...Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(year, month, i + 1);
        const key = getDateKey(date);
        return { key, date, day: i + 1, data: calendarData[key] };
      })
    ];

    return (
      <div className="card" style={{ padding: '18px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <button onClick={() => moveCalendarMonth(-1)} aria-label="이전 달" style={{ width: '34px', height: '34px', border: 'none', borderRadius: '12px', background: 'var(--tertiary-bg)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ChevronLeft size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '17px', fontWeight: '800' }}>
            <Calendar size={18} color="var(--primary-color)" />
            {calendarMonth.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
          </div>
          <button onClick={() => moveCalendarMonth(1)} aria-label="다음 달" style={{ width: '34px', height: '34px', border: 'none', borderRadius: '12px', background: 'var(--tertiary-bg)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '8px' }}>
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <div key={day} style={{ textAlign: 'center', fontSize: '12px', fontWeight: '700', color: 'var(--text-tertiary)' }}>{day}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
          {cells.map(cell => {
            if (cell.empty) return <div key={cell.key} style={{ aspectRatio: '1 / 1' }} />;
            const isSelected = cell.key === selectedDateKey;
            const hasData = cell.data && (cell.data.study || cell.data.emotion || cell.data.failure);
            return (
              <button
                key={cell.key}
                onClick={() => {
                  setSelectedDate(cell.date);
                  setExpandedDate(cell.date.toLocaleDateString());
                }}
                style={{
                  aspectRatio: '1 / 1',
                  border: isSelected ? '2px solid var(--primary-color)' : '1px solid transparent',
                  borderRadius: '14px',
                  background: hasData ? 'var(--secondary-bg)' : 'var(--tertiary-bg)',
                  color: 'var(--text-primary)',
                  boxShadow: hasData ? '0 4px 12px rgba(15, 23, 42, 0.06)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  fontSize: '13px',
                  fontWeight: '800'
                }}
              >
                {cell.day}
                <span style={{ display: 'flex', gap: '3px', minHeight: '5px' }}>
                  {cell.data?.study > 0 && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--primary-color)' }} />}
                  {cell.data?.emotion > 0 && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#FF2D55' }} />}
                  {cell.data?.failure > 0 && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--warning-color)' }} />}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: '16px', padding: '14px', borderRadius: '16px', background: 'var(--tertiary-bg)' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '10px' }}>{selectedDateLabel}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              { label: '공부', value: `${selectedSummary.study.length}건`, color: 'var(--primary-color)' },
              { label: '감정', value: `${selectedSummary.emotion.length}건`, color: '#FF2D55' },
              { label: '실패', value: `${selectedSummary.failure.length}건`, color: 'var(--warning-color)' }
            ].map(item => (
              <div key={item.label} style={{ background: 'var(--secondary-bg)', borderRadius: '12px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: '700', marginBottom: '4px' }}>{item.label}</div>
                <div style={{ fontSize: '15px', color: item.color, fontWeight: '800' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderStudyTab = () => (
    <div className="animate-fade-in">
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <div style={{ background: 'var(--primary-light)', padding: '6px', borderRadius: '10px' }}>
            <BarChart3 size={18} color="var(--primary-color)" />
          </div>
          <h3 className="card-title" style={{ margin: 0 }}>과목별 집중 시간</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {getSubjectStats().length > 0 ? getSubjectStats().map(([subj, mins]) => (
            <div key={subj}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{subj}</span>
                <span style={{ color: 'var(--text-primary)' }}>{mins}분</span>
              </div>
              <div style={{ width: '100%', height: '10px', background: 'var(--tertiary-bg)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${Math.min(100, (mins / (getSubjectStats()[0][1] || 1)) * 100)}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, var(--primary-color), #56CCF2)', 
                  borderRadius: '6px' 
                }} />
              </div>
            </div>
          )) : <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', textAlign: 'center' }}>데이터가 없습니다.</p>}
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.5px' }}>
          오늘 공부
        </h3>
        {getTodayRecords().length > 0 ? getTodayRecords().map(r => (
          <div key={r.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'var(--tertiary-bg)', width: '48px', height: '48px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} color="var(--text-secondary)" />
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)', marginBottom: '4px' }}>{r.subject}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: '500' }}>{r.durationMinutes}분 집중 · 중단 {r.pauseCount}회</div>
              </div>
            </div>
            <button onClick={() => handleDelete('study', r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
              <Trash2 size={18} color="var(--error-color)" />
            </button>
          </div>
        )) : <div className="card" style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px', fontWeight: '500', padding: '24px' }}>오늘 완료한 공부가 없습니다.</div>}
      </div>

      <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', letterSpacing: '-0.5px' }}>
        날짜별 기록
      </h3>
      {getGroupedRecords().map(([date, items]) => (
        <div key={date} style={{ marginBottom: '12px' }}>
          <div 
            onClick={() => setExpandedDate(expandedDate === date ? null : date)}
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '18px 20px', 
              background: 'var(--secondary-bg)', 
              borderRadius: '20px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              border: expandedDate === date ? '2px solid var(--primary-light)' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Calendar size={18} color="var(--primary-color)" />
              <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{date}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: '600' }}>{items.length}건</span>
            </div>
            {expandedDate === date ? <ChevronUp size={20} color="var(--text-tertiary)" /> : <ChevronDown size={20} color="var(--text-tertiary)" />}
          </div>
          {expandedDate === date && (
            <div className="animate-slide-up" style={{ marginTop: '12px', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {items.map(r => (
                <div key={r.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', margin: 0, borderLeft: '4px solid var(--primary-color)', borderRadius: '0 16px 16px 0' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '4px' }}>{r.subject}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>{r.durationMinutes}분 집중</div>
                  </div>
                  <button onClick={() => handleDelete('study', r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
                    <Trash2 size={16} color="var(--error-color)" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderEmotionTab = () => (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card" style={{ padding: '24px' }}>
        <h3 className="card-title">새로운 감정 기록</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '12px' }}>감정 선택</div>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '12px' }} className="hide-scrollbar">
            {emotionOptions.map(e => (
              <button 
                key={e} 
                onClick={() => setEmotion(e)}
                style={{ 
                  padding: '10px 16px',
                  whiteSpace: 'nowrap',
                  borderRadius: '14px', 
                  border: emotion === e ? 'none' : '1px solid var(--border-color, #E2E8F0)',
                  background: emotion === e ? 'var(--primary-color)' : 'var(--secondary-bg, white)',
                  color: emotion === e ? 'white' : 'var(--text-secondary)',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: emotion === e ? '0 4px 12px rgba(47,128,237,0.2)' : 'none'
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>감정 강도</div>
            <div style={{ fontSize: '14px', color: 'var(--primary-color)', fontWeight: '700' }}>{emotionIntensity}점</div>
          </div>
          <input 
            type="range" 
            min="1" max="100" 
            value={emotionIntensity} 
            onChange={(e) => setEmotionIntensity(e.target.value)}
            style={{ width: '100%', accentColor: 'var(--primary-color)', height: '6px' }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '12px' }}>감정을 느낀 이유</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {emotionReasons.map(r => (
              <button 
                key={r} 
                onClick={() => setEmotionReason(r)}
                style={{ 
                  padding: '10px 16px', 
                  borderRadius: '12px', 
                  background: emotionReason === r ? 'var(--primary-light)' : 'var(--tertiary-bg)',
                  color: emotionReason === r ? 'var(--primary-color)' : 'var(--text-secondary)',
                  border: emotionReason === r ? '1px solid var(--primary-color)' : '1px solid transparent',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '12px' }}>한 줄 메모</div>
          <input 
            type="text" 
            placeholder="오늘 기분이나 느낌을 적어주세요."
            value={emotionNote}
            onChange={(e) => setEmotionNote(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '16px', 
              borderRadius: '16px', 
              border: '1px solid var(--border-color, #E2E8F0)',
              background: 'var(--bg-color, #F8F9FB)',
              color: 'var(--text-primary)',
              fontSize: '15px',
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'border 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-color, #E2E8F0)'}
          />
        </div>

        <button className="btn-primary" onClick={handleSaveEmotion}>
          <Save size={20} />
          감정 기록 저장하기
        </button>
      </div>

      <h3 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px' }}>이전 기록</h3>
      {emotions.length > 0 ? emotions.slice().reverse().map(e => (
        <div key={e.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smile size={16} color="var(--primary-color)" />
              <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: '600' }}>{new Date(e.timestamp).toLocaleString()}</span>
            </div>
            <button onClick={() => handleDelete('emotion', e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
              <Trash2 size={16} color="var(--text-tertiary)" />
            </button>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ background: 'var(--primary-light)', padding: '16px', borderRadius: '16px', color: 'var(--primary-color)', fontWeight: '800', fontSize: '16px' }}>
              {e.emotion}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)' }}>{e.reason}</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary-color)', background: 'var(--primary-light)', padding: '4px 8px', borderRadius: '8px' }}>
                  {Math.round(e.intensity/10)}점
                </div>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5', padding: '12px', background: 'var(--tertiary-bg)', borderRadius: '12px' }}>
                {e.note || '메모 없음'}
              </div>
            </div>
          </div>
        </div>
      )) : <div className="card" style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontWeight: '500', padding: '24px' }}>감정 기록이 없습니다.</div>}
    </div>
  );

  const renderFailureTab = () => (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card" style={{ padding: '24px' }}>
        <h3 className="card-title">새로운 실패 원인 분석</h3>
        
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '12px' }}>실패 원인 선택</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {failureReasons.map(r => (
              <button 
                key={r} 
                onClick={() => setFailureReason(r)}
                style={{ 
                  padding: '10px 16px', 
                  borderRadius: '12px', 
                  background: failureReason === r ? '#FFF5F5' : 'var(--tertiary-bg)',
                  color: failureReason === r ? 'var(--error-color)' : 'var(--text-secondary)',
                  border: failureReason === r ? '1px solid var(--error-color)' : '1px solid transparent',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '12px' }}>상세 내용</div>
          <textarea 
            placeholder="어떤 상황이었나요?"
            value={failureDetail}
            onChange={(e) => setFailureDetail(e.target.value)}
            style={{ 
              width: '100%', 
              height: '100px',
              padding: '16px', 
              borderRadius: '16px', 
              border: '1px solid var(--border-color, #E2E8F0)',
              background: 'var(--bg-color, #F8F9FB)',
              color: 'var(--text-primary)',
              resize: 'none',
              fontFamily: 'inherit',
              fontSize: '15px',
              outline: 'none',
              transition: 'border 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-color, #E2E8F0)'}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '12px' }}>개선 방안</div>
          <textarea 
            placeholder="다음에는 어떻게 개선해볼 수 있을까요?"
            value={failureImprovement}
            onChange={(e) => setFailureImprovement(e.target.value)}
            style={{ 
              width: '100%', 
              height: '100px',
              padding: '16px', 
              borderRadius: '16px', 
              border: '1px solid var(--border-color, #E2E8F0)',
              background: 'var(--bg-color, #F8F9FB)',
              color: 'var(--text-primary)',
              resize: 'none',
              fontFamily: 'inherit',
              fontSize: '15px',
              outline: 'none',
              transition: 'border 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-color, #E2E8F0)'}
          />
        </div>

        <button className="btn-primary" onClick={handleSaveFailure} style={{ background: 'linear-gradient(135deg, #EB5757, #F2994A)', boxShadow: '0 8px 16px rgba(235, 87, 87, 0.25)' }}>
          <Save size={20} />
          분석 결과 저장하기
        </button>
      </div>

      <h3 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px' }}>이전 기록</h3>
      {failures.length > 0 ? failures.slice().reverse().map(f => (
        <div key={f.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} color="var(--error-color)" />
              <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: '600' }}>{new Date(f.timestamp).toLocaleString()}</span>
            </div>
            <button onClick={() => handleDelete('failure', f.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
              <Trash2 size={16} color="var(--text-tertiary)" />
            </button>
          </div>
          <div style={{ background: 'rgba(235, 87, 87, 0.12)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(235, 87, 87, 0.25)' }}>
            <div style={{ fontWeight: '800', fontSize: '16px', color: 'var(--error-color)', marginBottom: '12px' }}>{f.reason}</div>
            {f.detail && <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '8px', lineHeight: '1.5' }}><strong style={{ color: 'var(--text-secondary)' }}>상세:</strong> {f.detail}</div>}
            {f.improvement && <div style={{ fontSize: '14px', color: 'var(--primary-color)', lineHeight: '1.5' }}><strong>개선:</strong> {f.improvement}</div>}
          </div>
        </div>
      )) : <div className="card" style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontWeight: '500', padding: '24px' }}>실패 기록이 없습니다.</div>}
    </div>
  );

  return (
    <div className="screen-container" style={{ paddingBottom: '120px' }}>
      <header style={{ paddingTop: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>기록 보관함</h2>
      </header>

      {renderCalendar()}

      <div className="tabs-container" style={{ padding: '6px', borderRadius: '16px', background: 'var(--tertiary-bg)' }}>
        {[
          { id: 'study', label: '공부' },
          { id: 'emotion', label: '감정' },
          { id: 'failure', label: '실패' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            style={{ padding: '14px', borderRadius: '12px', fontSize: '15px' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: '24px' }}>
        {activeTab === 'study' && renderStudyTab()}
        {activeTab === 'emotion' && renderEmotionTab()}
        {activeTab === 'failure' && renderFailureTab()}
      </div>

      {/* 인앱 삭제 확인 모달 */}
      {deleteModal && (
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
            width: '100%',
            maxWidth: '320px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
            animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: 'var(--text-primary)' }}>
              기록 삭제
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
              이 기록을 삭제하시겠습니까?{`\n`}삭제 후 복구할 수 없습니다.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setDeleteModal(null)}
                style={{
                  flex: 1, padding: '14px', borderRadius: '14px',
                  border: '1.5px solid var(--tertiary-bg)',
                  background: 'var(--tertiary-bg)',
                  color: 'var(--text-secondary)',
                  fontSize: '15px', fontWeight: '600', cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  flex: 1, padding: '14px', borderRadius: '14px',
                  border: 'none',
                  background: '#FF3B30',
                  color: 'white',
                  fontSize: '15px', fontWeight: '700', cursor: 'pointer'
                }}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

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
            width: '100%',
            maxWidth: '320px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
            animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: 'var(--text-primary)' }}>
              ✅ 저장 완료
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
              {infoModal.message}
            </p>
            <button
              onClick={() => setInfoModal(null)}
              style={{
                width: '100%', padding: '14px', borderRadius: '14px',
                border: 'none',
                background: 'var(--primary-color)',
                color: 'white',
                fontSize: '15px', fontWeight: '700', cursor: 'pointer'
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

export default RecordsScreen;
