import React, { useState, useEffect } from 'react';
import { Calendar, Trash2, Clock, Smile, AlertCircle, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { getStudyRecords, getEmotionLogs, getFailureLogs, deleteRecord } from '../utils/storage';

const RecordsScreen = () => {
  const [records, setRecords] = useState([]);
  const [emotions, setEmotions] = useState([]);
  const [failures, setFailures] = useState([]);
  const [activeTab, setActiveTab] = useState('study'); // study, emotion, failure
  const [expandedDate, setExpandedDate] = useState(new Date().toLocaleDateString());

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    setRecords(getStudyRecords());
    setEmotions(getEmotionLogs());
    setFailures(getFailureLogs());
  };

  const handleDelete = (type, id) => {
    if (window.confirm('기록을 삭제하시겠습니까?')) {
      const keyMap = {
        study: 'study_records',
        emotion: 'emotion_logs',
        failure: 'failure_logs'
      };
      deleteRecord(keyMap[type], id);
      loadAllData();
    }
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

  const renderStudyTab = () => (
    <>
      {/* 과목별 통계 차트 (간단 막대) */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <BarChart3 size={18} color="var(--primary-color)" />
          <h3 style={{ fontSize: '15px', fontWeight: 'bold' }}>과목별 집중 시간 (분)</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {getSubjectStats().length > 0 ? getSubjectStats().map(([subj, mins]) => (
            <div key={subj}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span>{subj}</span>
                <span style={{ fontWeight: 'bold' }}>{mins}분</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#F2F2F7', borderRadius: '4px' }}>
                <div style={{ 
                  width: `${Math.min(100, (mins / (getSubjectStats()[0][1] || 1)) * 100)}%`, 
                  height: '100%', 
                  background: 'var(--primary-color)', 
                  borderRadius: '4px' 
                }} />
              </div>
            </div>
          )) : <p style={{ fontSize: '13px', color: '#8E8E93', textAlign: 'center' }}>데이터가 없습니다.</p>}
        </div>
      </div>

      {/* 오늘 기록 */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="var(--primary-color)" /> 오늘 공부
        </h3>
        {getTodayRecords().length > 0 ? getTodayRecords().map(r => (
          <div key={r.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>{r.subject}</div>
              <div style={{ fontSize: '12px', color: '#8E8E93' }}>{r.durationMinutes}분 집중 · 중단 {r.pauseCount}회</div>
            </div>
            <Trash2 size={16} color="#FF3B30" style={{ cursor: 'pointer' }} onClick={() => handleDelete('study', r.id)} />
          </div>
        )) : <div className="card" style={{ textAlign: 'center', color: '#8E8E93', fontSize: '13px' }}>오늘 완료한 공부가 없습니다.</div>}
      </div>

      {/* 날짜별 기록 */}
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Calendar size={18} color="var(--primary-color)" /> 날짜별 기록
      </h3>
      {getGroupedRecords().map(([date, items]) => (
        <div key={date} style={{ marginBottom: '8px' }}>
          <div 
            onClick={() => setExpandedDate(expandedDate === date ? null : date)}
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '12px 16px', 
              background: '#F2F2F7', 
              borderRadius: '12px',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: '600' }}>{date} ({items.length}건)</span>
            {expandedDate === date ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
          {expandedDate === date && (
            <div style={{ marginTop: '8px', paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.map(r => (
                <div key={r.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', margin: 0 }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>{r.subject}</div>
                    <div style={{ fontSize: '11px', color: '#8E8E93' }}>{r.durationMinutes}분 집중</div>
                  </div>
                  <Trash2 size={14} color="#FF3B30" style={{ cursor: 'pointer' }} onClick={() => handleDelete('study', r.id)} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );

  const renderEmotionTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {emotions.length > 0 ? emotions.slice().reverse().map(e => (
        <div key={e.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#8E8E93' }}>{new Date(e.timestamp).toLocaleString()}</span>
            <Trash2 size={16} color="#FF3B30" style={{ cursor: 'pointer' }} onClick={() => handleDelete('emotion', e.id)} />
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '32px' }}>{e.emotion}</span>
            <div>
              <div style={{ fontWeight: '600', fontSize: '15px' }}>{e.reason} ({e.intensity}%)</div>
              <div style={{ fontSize: '13px', color: '#48484A', marginTop: '4px' }}>{e.note || '메모 없음'}</div>
              <div style={{ fontSize: '11px', color: 'var(--primary-color)', marginTop: '4px' }}>{e.subject} · {e.duration}분 학습 후</div>
            </div>
          </div>
        </div>
      )) : <div style={{ textAlign: 'center', marginTop: '40px', color: '#8E8E93' }}>감정 기록이 없습니다.</div>}
    </div>
  );

  const renderFailureTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {failures.length > 0 ? failures.slice().reverse().map(f => (
        <div key={f.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#8E8E93' }}>{new Date(f.timestamp).toLocaleString()}</span>
            <Trash2 size={16} color="#FF3B30" style={{ cursor: 'pointer' }} onClick={() => handleDelete('failure', f.id)} />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: '#FFF5F5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={24} color="#FF3B30" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#FF3B30' }}>원인: {f.reason}</div>
              <div style={{ fontSize: '13px', marginTop: '6px' }}><strong>상세:</strong> {f.detail}</div>
              <div style={{ fontSize: '13px', marginTop: '4px', color: 'var(--primary-color)' }}><strong>개선:</strong> {f.improvement}</div>
            </div>
          </div>
        </div>
      )) : <div style={{ textAlign: 'center', marginTop: '40px', color: '#8E8E93' }}>실패 기록이 없습니다.</div>}
    </div>
  );

  return (
    <div className="screen-container" style={{ paddingBottom: '100px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>기록 보관함</h2>

      <div style={{ display: 'flex', background: '#F2F2F7', borderRadius: '10px', padding: '4px', marginBottom: '20px' }}>
        {[
          { id: 'study', label: '공부', icon: BookOpenIcon },
          { id: 'emotion', label: '감정', icon: Smile },
          { id: 'failure', label: '실패', icon: AlertCircle }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              flex: 1, 
              padding: '8px', 
              border: 'none', 
              borderRadius: '8px', 
              background: activeTab === tab.id ? 'white' : 'transparent',
              boxShadow: activeTab === tab.id ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? 'bold' : '400',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <tab.icon size={16} color={activeTab === tab.id ? 'var(--primary-color)' : '#8E8E93'} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'study' && renderStudyTab()}
      {activeTab === 'emotion' && renderEmotionTab()}
      {activeTab === 'failure' && renderFailureTab()}
    </div>
  );
};

const BookOpenIcon = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

export default RecordsScreen;
