import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarDays, ChevronLeft, ChevronRight, Clock, Flame, Target } from 'lucide-react';
import { getStudyRecords } from '../utils/storage';

const RANGE_OPTIONS = [
  { id: 'today', label: '오늘' },
  { id: 'weekly', label: '주간' },
  { id: 'monthly', label: '월간' },
];

const WEEK_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
const TIME_SLOTS = ['06-09', '09-12', '12-15', '15-18', '18-21', '21-24'];
const SUBJECT_COLORS = [
  'var(--primary-color)',
  'rgba(var(--primary-rgb), 0.86)',
  'rgba(var(--primary-rgb), 0.74)',
  'rgba(var(--primary-rgb), 0.62)',
  'rgba(var(--primary-rgb), 0.50)',
  'rgba(var(--primary-rgb), 0.38)',
  'rgba(var(--primary-rgb), 0.26)',
];

const getDateKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfWeek = (date) => {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

const startOfMonth = (date) => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const filterByRange = (records, range) => {
  const now = new Date();
  const dayStart = startOfDay(now).getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  const weekStart = startOfWeek(now).getTime();
  const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000;
  const monthStart = startOfMonth(now).getTime();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();

  return records.filter((record) => {
    const timestamp = new Date(record.timestamp).getTime();
    if (Number.isNaN(timestamp)) return false;
    if (range === 'today') return timestamp >= dayStart && timestamp < dayEnd;
    if (range === 'weekly') return timestamp >= weekStart && timestamp < weekEnd;
    return timestamp >= monthStart && timestamp < monthEnd;
  });
};

const formatMinutes = (minutes) => `${Math.floor(minutes / 60)}시간 ${minutes % 60}분`;

const formatDurationWithSeconds = (seconds) => {
  const total = Math.max(0, Math.round(seconds || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  return `${hours}h ${minutes}m ${secs}s`;
};

const RangeTabs = ({ value, onChange }) => (
  <div style={{ display: 'flex', background: 'var(--tertiary-bg)', borderRadius: '12px', padding: '3px', gap: '2px', flexShrink: 0 }}>
    {RANGE_OPTIONS.map((option) => {
      const active = value === option.id;
      return (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          style={{
            background: active ? 'var(--secondary-bg)' : 'transparent',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: active ? '700' : '500',
            color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
            boxShadow: active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);

const DonutChart = ({ segments, totalMinutes }) => {
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const r = 50;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const arcs = segments.map((segment, index) => {
    const dash = (segment.pct / 100) * circumference;
    const gap = circumference - dash;
    const arc = { dash, gap, offset, color: SUBJECT_COLORS[index % SUBJECT_COLORS.length] };
    offset += dash;
    return arc;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--tertiary-bg)" strokeWidth={strokeWidth} />
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arc.dash} ${arc.gap}`}
          strokeDashoffset={-arc.offset}
          strokeLinecap="round"
        />
      ))}
      <text
        x={cx}
        y={cy - 8}
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
        x={cx}
        y={cy + 10}
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

const MonthlyStudyCalendar = ({ records }) => {
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dailyMinutes = useMemo(() => records.reduce((acc, record) => {
    const key = getDateKey(record.timestamp);
    acc[key] = (acc[key] || 0) + (record.durationMinutes || 0);
    return acc;
  }, {}), [records]);

  const selectedKey = getDateKey(selectedDate);
  const selectedMinutes = dailyMinutes[selectedKey] || 0;
  const selectedSessions = records.filter((record) => getDateKey(record.timestamp) === selectedKey).length;

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
    }),
  ];

  const getIntensity = (minutes) => Math.min(4, Math.floor(minutes / 120));
  const getCellColor = (minutes) => {
    const palette = [
      'var(--tertiary-bg)',
      'rgba(var(--primary-rgb), 0.16)',
      'rgba(var(--primary-rgb), 0.3)',
      'rgba(var(--primary-rgb), 0.46)',
      'rgba(var(--primary-rgb), 0.64)',
    ];
    return palette[getIntensity(minutes)];
  };

  const moveMonth = (offset) => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
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
        {WEEK_LABELS.map((day) => (
          <div key={day} style={{ textAlign: 'center', fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)' }}>{day}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
        {cells.map((cell) => {
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
                background: getCellColor(cell.minutes),
                color: getIntensity(cell.minutes) >= 3 ? 'white' : 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                fontSize: '13px',
                fontWeight: '800',
                boxShadow: hasStudy ? '0 4px 10px rgba(var(--primary-rgb), 0.1)' : 'none',
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
        {[0, 120, 240, 360, 480].map((minutes) => (
          <div key={minutes} style={{ width: '18px', height: '18px', borderRadius: '5px', background: getCellColor(minutes) }} />
        ))}
        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: '600' }}>8h+</span>
      </div>
    </div>
  );
};

const getBuckets = (range) => {
  const now = new Date();

  if (range === 'today') {
    return Array.from({ length: 24 }, (_, hour) => ({
      key: `h-${hour}`,
      label: `${hour}시`,
      dateKey: null,
      hour,
    }));
  }

  if (range === 'weekly') {
    const start = startOfWeek(now);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        key: getDateKey(date),
        label: WEEK_LABELS[index],
        dateKey: getDateKey(date),
        hour: null,
      };
    });
  }

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), index + 1);
    return {
      key: getDateKey(date),
      label: String(index + 1),
      dateKey: getDateKey(date),
      hour: null,
    };
  });
};

const getBucketValues = (records, range) => {
  const buckets = getBuckets(range);
  return buckets.map((bucket) => {
    if (range === 'today') {
      return records
        .filter((record) => {
          const d = new Date(record.timestamp);
          return d.getHours() === bucket.hour;
        })
        .reduce((sum, record) => sum + (record.durationMinutes || 0), 0);
    }

    return records
      .filter((record) => getDateKey(record.timestamp) === bucket.dateKey)
      .reduce((sum, record) => sum + (record.durationMinutes || 0), 0);
  });
};

const getHeatmapData = (records, range) => {
  if (range === 'today') {
    const labels = ['오늘'];
    const matrix = Array.from({ length: TIME_SLOTS.length }, () => [0]);

    records.forEach((record) => {
      const hour = new Date(record.timestamp).getHours();
      let slotIdx = -1;
      if (hour >= 6 && hour < 9) slotIdx = 0;
      else if (hour >= 9 && hour < 12) slotIdx = 1;
      else if (hour >= 12 && hour < 15) slotIdx = 2;
      else if (hour >= 15 && hour < 18) slotIdx = 3;
      else if (hour >= 18 && hour < 21) slotIdx = 4;
      else if (hour >= 21 && hour < 24) slotIdx = 5;
      if (slotIdx >= 0) matrix[slotIdx][0] += 1;
    });

    return { labels, matrix };
  }

  const labels = WEEK_LABELS;
  const matrix = Array.from({ length: TIME_SLOTS.length }, () => Array(7).fill(0));

  records.forEach((record) => {
    const d = new Date(record.timestamp);
    const dayIdx = (d.getDay() + 6) % 7;
    const hour = d.getHours();
    let slotIdx = -1;
    if (hour >= 6 && hour < 9) slotIdx = 0;
    else if (hour >= 9 && hour < 12) slotIdx = 1;
    else if (hour >= 12 && hour < 15) slotIdx = 2;
    else if (hour >= 15 && hour < 18) slotIdx = 3;
    else if (hour >= 18 && hour < 21) slotIdx = 4;
    else if (hour >= 21 && hour < 24) slotIdx = 5;
    if (slotIdx >= 0) matrix[slotIdx][dayIdx] += 1;
  });

  return { labels, matrix };
};

const MetricCard = ({ title, icon, range, onRangeChange, value, unit, subtitle }) => (
  <div className="card" style={{ padding: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <RangeTabs value={range} onChange={onRangeChange} />
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        <div style={{ background: 'var(--primary-light)', padding: '7px', borderRadius: '12px', flexShrink: 0 }}>
          {icon}
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: 0 }}>{title}</span>
      </div>
    </div>
    <div style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'baseline', gap: '3px', flexWrap: 'wrap' }}>
      {value}
      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '600' }}>{unit}</span>
    </div>
    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '600' }}>{subtitle}</div>
  </div>
);

const ChartCard = ({ title, icon, range, onRangeChange, subtitle, children }) => (
  <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
      <RangeTabs value={range} onChange={onRangeChange} />
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '18px' }}>
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>{title}</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{subtitle}</p>
      </div>
      {icon}
    </div>
    {children}
  </div>
);

const StatsScreen = () => {
  const [records, setRecords] = useState([]);
  const [totalRange, setTotalRange] = useState('today');
  const [sessionRange, setSessionRange] = useState('today');
  const [subjectRange, setSubjectRange] = useState('today');
  const [trendRange, setTrendRange] = useState('weekly');
  const [heatmapRange, setHeatmapRange] = useState('weekly');

  useEffect(() => {
    setRecords(getStudyRecords());
  }, []);

  const totalRecords = filterByRange(records, totalRange);
  const sessionRecords = filterByRange(records, sessionRange);
  const subjectRecords = filterByRange(records, subjectRange);
  const trendRecords = filterByRange(records, trendRange);
  const heatmapRecords = filterByRange(records, heatmapRange);

  const totalMinutes = totalRecords.reduce((sum, record) => sum + (record.durationMinutes || 0), 0);
  const totalSeconds = totalRecords.reduce((sum, record) => sum + (record.durationSeconds ?? Math.round((record.durationMinutes || 0) * 60)), 0);
  const sessionCount = sessionRecords.length;

  const subjectMap = subjectRecords.reduce((acc, record) => {
    const subject = record.subject || '미분류';
    acc[subject] = (acc[subject] || 0) + (record.durationMinutes || 0);
    return acc;
  }, {});

  const subjectStats = Object.entries(subjectMap)
    .map(([name, minutes]) => ({ name, minutes }))
    .sort((a, b) => b.minutes - a.minutes);

  const subjectTotal = subjectStats.reduce((sum, item) => sum + item.minutes, 0);
  const segments = subjectStats.map((item) => ({
    name: item.name,
    minutes: item.minutes,
    pct: subjectTotal > 0 ? Math.round((item.minutes / subjectTotal) * 100) : 0,
  }));

  const trendBuckets = getBuckets(trendRange);
  const trendValues = getBucketValues(trendRecords, trendRange);
  const maxTrendValue = Math.max(...trendValues, 1);
  const heatmap = getHeatmapData(heatmapRecords, heatmapRange);
  const maxHeatmapValue = Math.max(...heatmap.matrix.flat(), 1);

  const getHeatmapColor = (value) => {
    const intensity = value / maxHeatmapValue;
    if (intensity === 0) return 'var(--tertiary-bg)';
    return `rgba(var(--primary-rgb), ${(0.12 + intensity * 0.56).toFixed(2)})`;
  };

  const totalSubtitle = totalRange === 'today' ? '오늘' : totalRange === 'weekly' ? '주간' : '월간';
  const sessionSubtitle = sessionRange === 'today' ? '오늘' : sessionRange === 'weekly' ? '주간' : '월간';
  const subjectSubtitle = subjectRange === 'today' ? '오늘' : subjectRange === 'weekly' ? '주간' : '월간';

  return (
    <div className="screen-container animate-fade-in" style={{ paddingBottom: '120px' }}>
      <header style={{ paddingTop: '16px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>통계</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>공부 흐름을 시간대별로 확인해보세요.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <MetricCard
          title="총공부시간"
          icon={<Clock size={16} color="var(--primary-color)" />}
          range={totalRange}
          onRangeChange={setTotalRange}
          value={formatDurationWithSeconds(totalSeconds)}
          unit=""
          subtitle={`${totalSubtitle} 합계`}
        />
        <MetricCard
          title="집중세션"
          icon={<Target size={16} color="var(--success-color)" />}
          range={sessionRange}
          onRangeChange={setSessionRange}
          value={`${sessionCount}`}
          unit="개"
          subtitle={`${sessionSubtitle} 세션 수`}
        />
      </div>

      <MonthlyStudyCalendar records={records} />

      <ChartCard
        title="누적시간"
        subtitle={trendRange === 'today' ? '오늘' : trendRange === 'weekly' ? '이번 주' : '이번 달'}
        range={trendRange}
        onRangeChange={setTrendRange}
        icon={<CalendarDays size={18} color="var(--text-tertiary)" />}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
          {trendBuckets.map((bucket, index) => {
            const value = trendValues[index] || 0;
            const height = (value / maxTrendValue) * 120;
            const isHighlight = trendRange === 'today'
              ? index === new Date().getHours()
              : trendRange === 'weekly'
                ? index === ((new Date().getDay() + 6) % 7)
                : index + 1 === new Date().getDate();

            return (
              <div key={bucket.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: trendRange === 'today' ? '34px' : trendRange === 'weekly' ? '36px' : '24px' }}>
                <div
                  style={{
                    width: '100%',
                    maxWidth: '20px',
                    height: `${Math.max(height, 4)}px`,
                    minHeight: '4px',
                    background: isHighlight
                      ? 'linear-gradient(180deg, rgba(var(--primary-rgb), 0.88), rgba(var(--primary-rgb), 0.58))'
                      : 'var(--tertiary-bg)',
                    borderRadius: '8px',
                    position: 'relative',
                  }}
                >
                  {isHighlight && value > 0 && (
                    <div style={{ position: 'absolute', top: '-22px', left: '50%', transform: 'translateX(-50%)', background: 'var(--primary-color)', color: 'white', fontSize: '9px', padding: '2px 5px', borderRadius: '4px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                      {formatMinutes(value)}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '11px', fontWeight: isHighlight ? '700' : '500', color: isHighlight ? 'var(--primary-color)' : 'var(--text-tertiary)' }}>
                  {bucket.label}
                </span>
              </div>
            );
          })}
        </div>
      </ChartCard>

      <ChartCard
        title="과목별 누적 공부시간"
        subtitle={subjectSubtitle}
        range={subjectRange}
        onRangeChange={setSubjectRange}
        icon={<BookOpen size={18} color="var(--text-tertiary)" />}
      >
        {segments.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '24px', background: 'var(--tertiary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={24} color="var(--text-tertiary)" />
            </div>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>아직 기록된 공부 데이터가 없습니다.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexDirection: 'column' }}>
            <DonutChart segments={segments} totalMinutes={subjectTotal} />
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {segments.map((segment, index) => (
                <div key={segment.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: SUBJECT_COLORS[index % SUBJECT_COLORS.length], flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {segment.name}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatMinutes(segment.minutes)}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', width: '30px', textAlign: 'right' }}>{segment.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </ChartCard>

      <ChartCard
        title="집중시간대"
        subtitle={heatmapRange === 'today' ? '오늘' : heatmapRange === 'weekly' ? '주간' : '월간'}
        range={heatmapRange}
        onRangeChange={setHeatmapRange}
        icon={<Flame size={18} color="#F2994A" />}
      >
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `44px repeat(${heatmap.labels.length}, minmax(34px, 1fr))`, gap: '4px', marginBottom: '4px' }}>
            <div />
            {heatmap.labels.map((label) => (
              <div key={label} style={{ textAlign: 'center', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)' }}>{label}</div>
            ))}
          </div>

          {TIME_SLOTS.map((slot, slotIndex) => (
            <div key={slot} style={{ display: 'grid', gridTemplateColumns: `44px repeat(${heatmap.labels.length}, minmax(34px, 1fr))`, gap: '4px', marginBottom: '4px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', fontWeight: '500' }}>{slot}</div>
              {heatmap.matrix[slotIndex].map((value, valueIndex) => (
                <div
                  key={`${slot}-${valueIndex}`}
                  title={`${heatmap.labels[valueIndex]} ${slot}: ${value}`}
                  style={{
                    height: '28px',
                    borderRadius: '6px',
                    background: getHeatmapColor(value),
                    transition: 'background 0.3s',
                  }}
                />
              ))}
            </div>
          ))}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '8px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>낮음</span>
            {[0.08, 0.18, 0.32, 0.48, 0.68].map((alpha) => (
              <div key={alpha} style={{ width: '16px', height: '16px', borderRadius: '4px', background: `rgba(var(--primary-rgb), ${alpha})` }} />
            ))}
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>높음</span>
          </div>
        </div>
      </ChartCard>
    </div>
  );
};

export default StatsScreen;
