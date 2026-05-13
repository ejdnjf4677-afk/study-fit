import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Target, Play, CheckCircle2, TrendingUp } from 'lucide-react';
import { getStudyRecords, getUserPoints, getAppSettings, getStreak, getTodos, saveTodos } from '../utils/storage';
import { calculateConcentrationScore } from '../utils/logic';

const HomeScreen = ({ onStartStudy }) => {
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
  }, []);

  const toggleTodo = (id) => {
    const updated = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTodos(updated);
    saveTodos(updated);
  };

  return (
    <div className="screen-container" style={{ justifyContent: 'center' }}>
      <div style={{ width: '100%' }}>
        <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>안녕하세요! 👋</h2>
            <p style={{ color: 'var(--text-secondary)' }}>오늘도 공부 핏을 맞춰볼까요?</p>
          </div>
          <div className="badge badge-primary" style={{ padding: '8px 12px' }}>
            <TrendingUp size={14} style={{ marginRight: '4px' }} />
            {stats.points}P
          </div>
        </header>

        <div className="card" style={{ background: 'linear-gradient(135deg, #007AFF, #00C6FF)', color: 'white', border: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', opacity: 0.9 }}>오늘의 공부 시간</span>
            <Clock size={20} />
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>
            {Math.floor(stats.todayMinutes / 60)}시간 {stats.todayMinutes % 60}분
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '16px' }}>
            목표 달성률 {stats.achievementRate}%
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '4px' }}>
            <div style={{ width: `${stats.achievementRate}%`, height: '100%', backgroundColor: 'white', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="card">
            <TrendingUp size={20} color="var(--primary-color)" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>집중력 점수</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{stats.concentrationScore}점</div>
          </div>
          <div className="card">
            <Calendar size={20} color="#FF9500" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>연속 달성일</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{stats.streak}일째</div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>오늘 할 일</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {todos.length > 0 ? todos.map((task) => (
              <div 
                key={task.id} 
                style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                onClick={() => toggleTodo(task.id)}
              >
                <CheckCircle2 size={20} color={task.completed ? 'var(--primary-color)' : '#E5E5EA'} />
                <span style={{ 
                  fontSize: '14px', 
                  color: task.completed ? 'var(--text-secondary)' : 'var(--text-primary)',
                  textDecoration: task.completed ? 'line-through' : 'none'
                }}>
                  {task.text}
                </span>
              </div>
            )) : <p style={{ fontSize: '13px', color: '#8E8E93', textAlign: 'center' }}>할 일이 없습니다. 설정에서 추가해주세요!</p>}
          </div>
        </div>

        <button className="btn-primary" onClick={onStartStudy} style={{ marginTop: '8px' }}>
          <Play size={20} fill="white" />
          공부 시작하기
        </button>
      </div>
    </div>
  );
};

export default HomeScreen;
