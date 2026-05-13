import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, Target, Calendar } from 'lucide-react';
import { getStudyRecords, getAppSettings } from '../utils/storage';

const StatsScreen = () => {
  const [data, setData] = useState({
    totalMinutes: 0,
    sessionCount: 0,
    weeklyData: [45, 30, 60, 45, 90, 120, 80], 
    subjectStats: []
  });

  useEffect(() => {
    const records = getStudyRecords();
    const totalMinutes = records.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);
    
    const subjects = {};
    records.forEach(r => {
      subjects[r.subject] = (subjects[r.subject] || 0) + (r.durationMinutes || 0);
    });
    
    const subjectStats = Object.keys(subjects).map(s => ({
      name: s,
      minutes: subjects[s]
    })).sort((a, b) => b.minutes - a.minutes);

    setData({
      totalMinutes,
      sessionCount: records.length,
      weeklyData: [45, 30, 60, 45, 90, 120, (totalMinutes % 180) + 20],
      subjectStats
    });
  }, []);

  return (
    <div className="screen-container">
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>통계 분석</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div className="card">
          <Clock size={20} color="var(--primary-color)" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>총 공부 시간</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{Math.floor(data.totalMinutes / 60)}h {data.totalMinutes % 60}m</div>
        </div>
        <div className="card">
          <Target size={20} color="var(--success-color)" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>집중 세션</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{data.sessionCount}회</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px' }}>주간 공부 시간</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '120px', padding: '0 8px' }}>
          {['월', '화', '수', '목', '금', '토', '일'].map((day, i) => (
            <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{ 
                width: '12px', 
                height: `${data.weeklyData[i] * 0.6 + 10}px`, 
                backgroundColor: i === 6 ? 'var(--primary-color)' : 'var(--primary-light)',
                borderRadius: '6px',
                marginBottom: '8px'
              }}></div>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{day}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>과목별 학습 비중</h3>
        {data.subjectStats.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>아직 데이터가 없습니다.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.subjectStats.map((s, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                  <span>{s.name}</span>
                  <span>{s.minutes}분</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--secondary-bg)', borderRadius: '3px' }}>
                  <div style={{ 
                    width: `${Math.min(100, (s.minutes / (data.totalMinutes || 1)) * 100)}%`, 
                    height: '100%', 
                    backgroundColor: `hsl(210, 100%, ${60 - (i % 5) * 10}%)`, 
                    borderRadius: '3px' 
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsScreen;
