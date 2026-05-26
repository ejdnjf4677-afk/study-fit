import React, { useState, useEffect } from 'react';
import { CalendarCheck, Clock, Play, CheckCircle2, Circle, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';
import { getStudyRecords, getUserPoints, getAppSettings, getStreak, getTodos, saveTodos, getCurrentUser } from '../utils/storage';
import { calculateConcentrationScore } from '../utils/logic';

const HomeScreen = ({ onStartStudy }) => {
  const [nickname, setNickname] = useState('사용자');
  const [stats, setStats] = useState({
    todayMinutes: 0,
    achievementRate: 0,
    concentrationScore: 0,
    streak: 0,
    points: 0
  });
  const [todos, setTodos] = useState(getTodos());

  useEffect(() => {
    const records = getStudyRecords();
    const settings = getAppSettings();
    const userPoints = getUserPoints();
    const userStreak = getStreak();

    // Calculate today's minutes
    const today = new Date().toLocaleDateString();
    const todayRecords = records.filter(r => new Date(r.timestamp).toLocaleDateString() === today);
    const todayMinutes = todayRecords.reduce((acc, r) => acc + r.durationMinutes, 0);

    const achievementRate = Math.min(100, Math.round((todayMinutes / settings.dailyGoal) * 100));

    // Average concentration score for today
    const totalPauses = todayRecords.reduce((acc, r) => acc + r.pauseCount, 0);
    const concentrationScore = todayRecords.length > 0
      ? calculateConcentrationScore(achievementRate, totalPauses)
      : 0;

    setStats({
      todayMinutes,
      achievementRate,
      concentrationScore,
      streak: userStreak.count,
      points: userPoints
    });
    setTodos(getTodos());

    const currentUser = getCurrentUser();
    if (currentUser) {
      setNickname(currentUser.nickname || currentUser.username || '사용자');
    }
  }, []);

  const toggleTodo = (id) => {
    const updated = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTodos(updated);
    saveTodos(updated);
  };

  return (
    <div className="screen-container animate-fade-in" style={{ padding: '32px 24px', paddingBottom: '120px' }}>
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px', letterSpacing: '-0.5px' }}>{nickname}님</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500' }}>오늘도 공부 핏을 맞춰볼까요?</p>
        </div>
        <div className="badge badge-primary" style={{ padding: '8px 14px', borderRadius: '14px', boxShadow: '0 4px 12px rgba(47,128,237,0.1)' }}>
          <Sparkles size={16} style={{ marginRight: '4px' }} color="var(--primary-color)" />
          <span style={{ fontSize: '14px', fontWeight: '700' }}>{stats.points} P</span>
        </div>
      </header>

      <div className="card" style={{
        background: 'linear-gradient(135deg, #2F80ED, #56CCF2)',
        color: 'white',
        borderRadius: '24px',
        padding: '8px 24px',
        boxShadow: '0 16px 32px rgba(47, 128, 237, 0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '15px', fontWeight: '600', opacity: 0.9 }}>오늘의 공부 시간</span>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '12px' }}>
            <Clock size={20} color="white" />
          </div>
        </div>
        <div style={{ fontSize: '42px', fontWeight: '800', marginBottom: '12px', letterSpacing: '-1px' }}>
          {Math.floor(stats.todayMinutes / 60)}<span style={{ fontSize: '24px', fontWeight: '600', opacity: 0.9 }}>시간</span> {stats.todayMinutes % 60}<span style={{ fontSize: '24px', fontWeight: '600', opacity: 0.9 }}>분</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', fontWeight: '600', opacity: 0.9, marginBottom: '8px' }}>
          <span>일일 목표 달성률</span>
          <span>{stats.achievementRate}%</span>
        </div>
        <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${stats.achievementRate}%`, height: '100%', backgroundColor: 'white', borderRadius: '4px', transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)' }}></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>집중력 점수</div>
            <div style={{ background: 'var(--primary-light)', padding: '6px', borderRadius: '10px' }}>
              <TrendingUp size={16} color="var(--primary-color)" />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>
            {stats.concentrationScore}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '2px' }}>점</span>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>연속 달성일</div>
            <div style={{ background: '#FFF3E0', padding: '6px', borderRadius: '10px' }}>
              <CalendarCheck size={16} color="#F2994A" />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>
            {stats.streak}<span style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginLeft: '2px' }}>일째</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="card-title" style={{ margin: 0 }}>오늘 할 일</h3>
          <ChevronRight size={20} color="var(--text-tertiary)" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {todos.length > 0 ? todos.map((task) => (
            <div
              key={task.id}
              style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', padding: '4px 0' }}
              onClick={() => toggleTodo(task.id)}
            >
              {task.completed ? (
                <CheckCircle2 size={24} color="var(--primary-color)" fill="var(--primary-light)" />
              ) : (
                <Circle size={24} color="var(--text-tertiary)" />
              )}
              <span style={{
                fontSize: '15px',
                fontWeight: task.completed ? '500' : '600',
                color: task.completed ? 'var(--text-tertiary)' : 'var(--text-primary)',
                textDecoration: task.completed ? 'line-through' : 'none',
                transition: 'all 0.2s'
              }}>
                {task.text}
              </span>
            </div>
          )) : (
            <div style={{ padding: '20px 0', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', fontWeight: '500' }}>할 일이 없습니다. 설정에서 추가해주세요!</p>
            </div>
          )}
        </div>
      </div>

      <button className="btn-primary" onClick={onStartStudy} style={{ padding: '20px', borderRadius: '20px', fontSize: '18px' }}>
        <Play size={24} fill="white" />
        공부 시작하기
      </button>
    </div>
  );
};

export default HomeScreen;
