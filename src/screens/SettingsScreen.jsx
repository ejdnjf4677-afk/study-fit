import React, { useState } from 'react';
import { Bell, Target, BookOpen, Trash2, Info, RefreshCcw, ChevronRight, CheckCircle2, ListTodo, Moon, Tablet, LogOut } from 'lucide-react';
import { getAppSettings, saveAppSettings, getSubjects, saveSubjects, getNotifications, saveNotifications, clearAllData, getTodos, saveTodos, logoutUser } from '../utils/storage';

const SettingsScreen = ({ onLogout }) => {
  const [settings, setSettings] = useState(getAppSettings());
  const [subjects, setSubjects] = useState(getSubjects());
  const [notifications, setNotifications] = useState(getNotifications());
  const [todos, setTodos] = useState(getTodos());
  const [newSubject, setNewSubject] = useState('');
  const [newTodo, setNewTodo] = useState('');

  const handleGoalChange = (e) => {
    const newGoal = parseInt(e.target.value);
    const updated = { ...settings, dailyGoal: newGoal };
    setSettings(updated);
    saveAppSettings(updated);
  };

  const addSubject = () => {
    if (newSubject.trim() && !subjects.includes(newSubject.trim())) {
      const updated = [...subjects, newSubject.trim()];
      setSubjects(updated);
      saveSubjects(updated);
      setNewSubject('');
    }
  };

  const removeSubject = (subj) => {
    const updated = subjects.filter(s => s !== subj);
    setSubjects(updated);
    saveSubjects(updated);
  };

  const toggleNotification = (key) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    saveNotifications(updated);
  };

  const handleReset = () => {
    if (window.confirm('정말 모든 데이터를 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      clearAllData();
    }
  };

  // To-Do Logic
  const addTodo = () => {
    if (newTodo.trim()) {
      const updated = [...todos, { id: Date.now(), text: newTodo.trim(), completed: false }];
      setTodos(updated);
      saveTodos(updated);
      setNewTodo('');
    }
  };

  const toggleTodo = (id) => {
    const updated = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTodos(updated);
    saveTodos(updated);
  };

  const removeTodo = (id) => {
    const updated = todos.filter(t => t.id !== id);
    setTodos(updated);
    saveTodos(updated);
  };

  return (
    <div className="screen-container" style={{ paddingBottom: '100px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>설정</h2>

      {/* 목표 설정 */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Target size={20} color="var(--primary-color)" />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>하루 목표 시간</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="range"
            min="30" max="600" step="30"
            value={settings.dailyGoal}
            onChange={handleGoalChange}
            style={{ flex: 1, accentColor: 'var(--primary-color)' }}
          />
          <span style={{ fontWeight: '600', width: '60px' }}>{Math.floor(settings.dailyGoal / 60)}시간 {settings.dailyGoal % 60}분</span>
        </div>
      </div>

      {/* 과목 관리 */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <BookOpen size={20} color="var(--primary-color)" />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>과목 관리</h3>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="새 과목 입력"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E5EA' }}
          />
          <button onClick={addSubject} className="btn-primary" style={{ width: 'auto', padding: '8px 16px' }}>추가</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {subjects.map(s => (
            <div key={s} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: '#F2F2F7',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '13px'
            }}>
              {s}
              <Trash2 size={14} color="#FF3B30" style={{ cursor: 'pointer' }} onClick={() => removeSubject(s)} />
            </div>
          ))}
        </div>
      </div>

      {/* 오늘 할 일 관리 */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <ListTodo size={20} color="var(--primary-color)" />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>오늘 할 일 관리</h3>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="할 일 추가하기..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E5EA' }}
          />
          <button onClick={addTodo} className="btn-primary" style={{ width: 'auto', padding: '8px 16px' }}>추가</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {todos.length > 0 ? todos.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                onClick={() => toggleTodo(t.id)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}
              >
                <CheckCircle2 size={20} color={t.completed ? 'var(--primary-color)' : '#E5E5EA'} />
                <span style={{
                  fontSize: '14px',
                  color: t.completed ? 'var(--text-secondary)' : 'var(--text-primary)',
                  textDecoration: t.completed ? 'line-through' : 'none'
                }}>
                  {t.text}
                </span>
              </div>
              <Trash2 size={16} color="#FF3B30" style={{ cursor: 'pointer' }} onClick={() => removeTodo(t.id)} />
            </div>
          )) : <p style={{ fontSize: '13px', color: '#8E8E93', textAlign: 'center' }}>등록된 할 일이 없습니다.</p>}
        </div>
      </div>

      {/* 테마 설정 */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Moon size={20} color="var(--primary-color)" />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>테마 설정</h3>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px' }}>어두운 테마 (Dark Mode)</span>
          <div
            onClick={() => {
              const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
              const updated = { ...settings, theme: newTheme };
              setSettings(updated);
              saveAppSettings(updated);
              if (newTheme === 'dark') {
                document.body.classList.add('dark');
              } else {
                document.body.classList.remove('dark');
              }
            }}
            style={{
              width: '44px',
              height: '24px',
              borderRadius: '12px',
              background: settings.theme === 'dark' ? 'var(--primary-color)' : '#E5E5EA',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background 0.3s'
            }}
          >
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '10px',
              background: 'white',
              position: 'absolute',
              top: '2px',
              left: settings.theme === 'dark' ? '22px' : '2px',
              transition: 'left 0.3s'
            }} />
          </div>
        </div>
      </div>

      {/* 알림 설정 */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Bell size={20} color="var(--primary-color)" />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>알림 설정</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { key: 'studyStart', label: '공부 시작 알림' },
            { key: 'breakTime', label: '휴식 시간 알림' },
            { key: 'goalReached', label: '목표 달성 알림' }
          ].map(item => (
            <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px' }}>{item.label}</span>
              <div
                onClick={() => toggleNotification(item.key)}
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '12px',
                  background: notifications[item.key] ? 'var(--primary-color)' : '#E5E5EA',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.3s'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '10px',
                  background: 'white',
                  position: 'absolute',
                  top: '2px',
                  left: notifications[item.key] ? '22px' : '2px',
                  transition: 'left 0.3s'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* 기타 설정 */}
      <div className="card" style={{ padding: '8px 0' }}>
        <div onClick={() => {
          if (window.confirm('정말 로그아웃 하시겠습니까?')) {
            logoutUser();
            if (onLogout) onLogout();
          }
        }} style={{ display: 'flex', alignItems: 'center', padding: '16px', cursor: 'pointer' }}>
          <LogOut size={20} color="var(--primary-color)" style={{ marginRight: '12px' }} />
          <span style={{ flex: 1, fontWeight: '600' }}>로그아웃</span>
          <ChevronRight size={20} color="#C7C7CC" />
        </div>
        <div style={{ height: '1px', background: '#F2F2F7', margin: '0 16px' }} />
        <div onClick={handleReset} style={{ display: 'flex', alignItems: 'center', padding: '16px', cursor: 'pointer' }}>
          <RefreshCcw size={20} color="#FF3B30" style={{ marginRight: '12px' }} />
          <span style={{ flex: 1, color: '#FF3B30', fontWeight: '600' }}>데이터 초기화</span>
          <ChevronRight size={20} color="#C7C7CC" />
        </div>
        <div style={{ height: '1px', background: '#F2F2F7', margin: '0 16px' }} />
        <div onClick={() => alert('StudyFit v1.0.0 (Beta)\nDeveloped by Team AntiGravity')} style={{ display: 'flex', alignItems: 'center', padding: '16px', cursor: 'pointer' }}>
          <Info size={20} color="#8E8E93" style={{ marginRight: '12px' }} />
          <span style={{ flex: 1 }}>앱 정보</span>
          <span style={{ fontSize: '13px', color: '#C7C7CC', marginRight: '8px' }}>v1.0.0</span>
          <ChevronRight size={20} color="#C7C7CC" />
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: '#C7C7CC' }}>
        © 2026 StudyFit. All rights reserved.
      </div>
    </div>
  );
};

export default SettingsScreen;
