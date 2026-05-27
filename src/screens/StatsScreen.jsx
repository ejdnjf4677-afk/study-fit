import React, { useState, useEffect, useRef } from 'react';
import { Clock, Target, CalendarDays, Flame, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { getStudyRecords } from '../utils/storage';

/* ─── palette ─── */
const COLORS = ['#5B8DEF', '#F2994A', '#6FCF97', '#9B51E0', '#EB5757', '#56CCF2', '#F2C94C'];

/* ─── Donut Chart (SVG) ─── */
const DonutChart = ({ segments, totalMinutes }) => {
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const r = 50;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const arcs = segments.map((seg, i) => {
    const dash = (seg.pct / 100) * circumference;
    const gap = circumference - dash;
    const arc = { dash, gap, offset, color: COLORS[i % COLORS.length] };
    offset += dash;
    return arc;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      {/* background circle */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--tertiary-bg)" strokeWidth={strokeWidth} />
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arc.dash} ${arc.gap}`}
          strokeDashoffset={-arc.offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      ))}
      {/* center label */}
      <text
        x={cx} y={cy - 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--text-primary)"
        fontSize="15"
        fontWeight="800"
        style={{ transform: 'rotate(90deg)', transformOrigin: `${cx}px ${cy}px` }}
      >
        {Math.floor(totalMinutes / 60)}h
      </text>
      <text
        x={cx} y={cy + 10}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--text-secondary)"
        fontSize="12"
        fontWeight="600"
        style={{ transform: 'rotate(90deg)', transformOrigin: `${cx}px ${cy}px` }}
      >
        {totalMinutes % 60}m
      </text>
    </svg>
  );
};

/* ─── Focus Heatmap ─── */
const TIME_SLOTS = ['06-09', '09-12', '12-15', '15-18', '18-21', '21-24'];
const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

const FocusHeatmap = ({ records }) => {
  // Build a 6×7 matrix (timeSlot × dayOfWeek) counting sessions
  const matrix = Array.from({ length: TIME_SLOTS.length }, () => Array(7).fill(0));

  records.forEach(r => {
    const d = new Date(r.timestamp);
    const dayIdx = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
    const hour = d.getHours();
    let slotIdx = -1;
    if (hour >= 6 && hour < 9)  slotIdx = 0;
    else if (hour >= 9 && hour < 12)  slotIdx = 1;
    else if (hour >= 12 && hour < 15) slotIdx = 2;
    else if (hour >= 15 && hour < 18) slotIdx = 3;
    else if (hour >= 18 && hour < 21) slotIdx = 4;
    else if (hour >= 21 && hour < 24) slotIdx = 5;
    if (slotIdx >= 0) matrix[slotIdx][dayIdx]++;
  });

  const maxVal = Math.max(...matrix.flat(), 1);

  const cellColor = (val) => {
    const intensity = val / maxVal;
    if (intensity === 0) return 'var(--tertiary-bg)';
    const alpha = 0.15 + intensity * 0.85;
    return `rgba(47, 128, 237, ${alpha.toFixed(2)})`;
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      {/* day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '44px repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
        <div />
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)' }}>{d}</div>
        ))}
      </div>
      {/* rows */}
      {TIME_SLOTS.map((slot, si) => (
        <div key={slot} style={{ display: 'grid', gridTemplateColumns: '44px repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', fontWeight: '500' }}>{slot}</div>
          {matrix[si].map((val, di) => (
            <div
              key={di}
              title={`${DAYS[di]} ${slot}: ${val}회`}
              style={{
                height: '28px',
                borderRadius: '6px',
                background: cellColor(val),
                transition: 'background 0.3s'
              }}
            />
          ))}
        </div>
      ))}
      {/* legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '8px' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>낮음</span>
        {[0.1, 0.3, 0.55, 0.75, 1].map(a => (
          <div key={a} style={{ width: '16px', height: '16px', borderRadius: '4px', background: `rgba(47,128,237,${a})` }} />
        ))}
        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>높음</span>
      </div>
    </div>
  );
};

/* ─── Monthly Study Calendar ─── */
const StudyCalendar = ({ records }) => {
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const getDateKey = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const dailyMinutes = records.reduce((acc, record) => {
    const key = getDateKey(record.timestamp);
    acc[key] = (acc[key] || 0) + (record.durationMinutes || 0);
    return acc;
  }, {});

  const selectedKey = getDateKey(selectedDate);
  const selectedMinutes = dailyMinutes[selectedKey] || 0;
  const selectedSessions = records.filter(record => getDateKey(record.timestamp) === selectedKey).length;
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: firstDay }, (_, i) => ({ key: `empty-${i}`, empty: true })),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, month, i + 1);
      const key = getDateKey(date);
      return { key, date, day: i + 1, minutes: dailyMinutes[key] || 0 };
    })
  ];

  const getIntensity = (minutes) => Math.min(4, Math.floor(minutes / 120));
  const getCellColor = (minutes, selected) => {
    if (selected) return 'var(--primary-color)';
    const colors = ['var(--tertiary-bg)', 'rgba(47, 128, 237, 0.22)', 'rgba(47, 128, 237, 0.45)', 'rgba(47, 128, 237, 0.68)', 'rgba(47, 128, 237, 0.92)'];
    return colors[getIntensity(minutes)];
  };
  const moveMonth = (offset) => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };
  const formatTime = (minutes) => `${Math.floor(minutes / 60)}시간 ${minutes % 60}분`;

  return (
    <div className="card" style={{ padding: '22px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <button onClick={() => moveMonth(-1)} aria-label="이전 달" style={{ width: '34px', height: '34px', border: 'none', borderRadius: '12px', background: 'var(--tertiary-bg)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>공부 캘린더</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
            {calendarMonth.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
          </p>
        </div>
        <button onClick={() => moveMonth(1)} aria-label="다음 달" style={{ width: '34px', height: '34px', border: 'none', borderRadius: '12px', background: 'var(--tertiary-bg)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '8px' }}>
        {['일', '월', '화', '수', '목', '금', '토'].map(day => (
          <div key={day} style={{ textAlign: 'center', fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)' }}>{day}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
        {cells.map(cell => {
          if (cell.empty) return <div key={cell.key} style={{ aspectRatio: '1 / 1' }} />;
          const selected = cell.key === selectedKey;
          const hasStudy = cell.minutes > 0;
          return (
            <button
              key={cell.key}
              onClick={() => setSelectedDate(cell.date)}
              title={`${cell.day}일 ${formatTime(cell.minutes)}`}
              style={{
                aspectRatio: '1 / 1',
                border: selected ? '2px solid var(--primary-dark)' : '1px solid transparent',
                borderRadius: '12px',
                background: getCellColor(cell.minutes, selected),
                color: selected ? 'white' : getIntensity(cell.minutes) >= 3 ? 'white' : 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                fontSize: '13px',
                fontWeight: '800',
                boxShadow: hasStudy ? '0 4px 10px rgba(47, 128, 237, 0.14)' : 'none'
              }}
            >
              {cell.day}
              {hasStudy && <span style={{ fontSize: '9px', fontWeight: '700', opacity: 0.9 }}>{Math.floor(cell.minutes / 60)}h</span>}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: '16px', padding: '14px', borderRadius: '16px', background: 'var(--tertiary-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '4px' }}>
            {selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
          </div>
          <div style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)' }}>{formatTime(selectedMinutes)}</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: '700' }}>
          {selectedSessions}세션
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px', marginTop: '12px' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: '600' }}>0h</span>
        {[0, 120, 240, 360, 480].map(minutes => (
          <div key={minutes} style={{ width: '18px', height: '18px', borderRadius: '5px', background: getCellColor(minutes, false) }} />
        ))}
        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: '600' }}>8h+</span>
      </div>
    </div>
  );
};

/* ─── Main Screen ─── */
const StatsScreen = () => {
  const [records, setRecords] = useState([]);
  const [data, setData] = useState({
    totalMinutes: 0,
    sessionCount: 0,
    weeklyData: [45, 30, 60, 45, 90, 120, 80],
    subjectStats: [],
    segments: []
  });
  const [activeTab, setActiveTab] = useState('weekly');

  useEffect(() => {
    const recs = getStudyRecords();
    setRecords(recs);

    const totalMinutes = recs.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);

    const subjectMap = {};
    recs.forEach(r => {
      subjectMap[r.subject] = (subjectMap[r.subject] || 0) + (r.durationMinutes || 0);
    });

    const subjectStats = Object.entries(subjectMap)
      .map(([name, minutes]) => ({ name, minutes }))
      .sort((a, b) => b.minutes - a.minutes);

    const segments = subjectStats.map(s => ({
      name: s.name,
      minutes: s.minutes,
      pct: totalMinutes > 0 ? Math.round((s.minutes / totalMinutes) * 100) : 0
    }));

    setData({
      totalMinutes,
      sessionCount: recs.length,
      weeklyData: [45, 30, 60, 45, 90, 120, (totalMinutes % 180) + 20],
      subjectStats,
      segments
    });
  }, []);

  const maxWeeklyValue = Math.max(...data.weeklyData, 1);

  const fmtTime = (min) => `${Math.floor(min / 60)}h ${min % 60}m`;

  return (
    <div className="screen-container animate-fade-in" style={{ paddingBottom: '120px' }}>
      {/* Header */}
      <header style={{ paddingTop: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>통계</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>나의 공부 패턴을 확인해보세요</p>
        </div>
        <div style={{ background: 'var(--tertiary-bg)', display: 'flex', borderRadius: '12px', padding: '4px', gap: '2px' }}>
          {[{ id: 'weekly', label: '주간' }, { id: 'monthly', label: '월간' }].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? 'var(--secondary-bg)' : 'transparent',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: activeTab === tab.id ? '700' : '500',
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >{tab.label}</button>
          ))}
        </div>
      </header>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'var(--primary-light)', padding: '8px', borderRadius: '12px' }}>
              <Clock size={18} color="var(--primary-color)" />
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>총 공부 시간</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', display: 'flex', alignItems: 'baseline', gap: '3px' }}>
            {Math.floor(data.totalMinutes / 60)}<span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: '600' }}>h</span>&nbsp;
            {data.totalMinutes % 60}<span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: '600' }}>m</span>
          </div>
        </div>
        <div className="card" style={{ padding: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: '#E6F9EC', padding: '8px', borderRadius: '12px' }}>
              <Target size={18} color="var(--success-color)" />
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>집중 세션</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', display: 'flex', alignItems: 'baseline', gap: '3px' }}>
            {data.sessionCount}<span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: '600' }}>회</span>
          </div>
        </div>
      </div>

      <StudyCalendar records={records} />

      {/* Weekly Bar Chart */}
      <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>{activeTab === 'weekly' ? '이번 주' : '이번 달'} 공부 시간</h3>
          <CalendarDays size={18} color="var(--text-tertiary)" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '120px', padding: '0 4px' }}>
          {['월', '화', '수', '목', '금', '토', '일'].map((day, i) => {
            const isToday = i === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
            const h = (data.weeklyData[i] / maxWeeklyValue) * 100;
            return (
              <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
                <div style={{
                  width: '100%', maxWidth: '20px', height: `${h}%`, minHeight: '4px',
                  background: isToday ? 'linear-gradient(180deg, var(--primary-color), #56CCF2)' : 'var(--tertiary-bg)',
                  borderRadius: '8px', position: 'relative'
                }}>
                  {isToday && (
                    <div style={{ position: 'absolute', top: '-22px', left: '50%', transform: 'translateX(-50%)', background: 'var(--primary-color)', color: 'white', fontSize: '9px', padding: '2px 5px', borderRadius: '4px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                      {data.weeklyData[i]}m
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '11px', fontWeight: isToday ? '700' : '500', color: isToday ? 'var(--primary-color)' : 'var(--text-tertiary)' }}>{day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 과목별 누적 공부 시간 (Donut + List) ── */}
      <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>과목별 누적 공부 시간</h3>
          <BookOpen size={18} color="var(--text-tertiary)" />
        </div>

        {data.segments.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '24px', background: 'var(--tertiary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={24} color="var(--text-tertiary)" />
            </div>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>아직 기록된 공부 데이터가 없습니다.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            {/* Donut */}
            <div style={{ flexShrink: 0 }}>
              <DonutChart segments={data.segments} totalMinutes={data.totalMinutes} />
            </div>
            {/* Legend list */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.segments.map((seg, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{seg.name}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{fmtTime(seg.minutes)}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', width: '30px', textAlign: 'right' }}>{seg.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 집중 시간대 Heatmap ── */}
      <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>집중 시간대</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{activeTab === 'weekly' ? '이번 주' : '이번 달'}</p>
          </div>
          <Flame size={18} color="#F2994A" />
        </div>
        <FocusHeatmap records={records} />
      </div>
    </div>
  );
};

export default StatsScreen;
