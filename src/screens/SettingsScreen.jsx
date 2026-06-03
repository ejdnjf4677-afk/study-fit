import React, { useEffect, useState } from 'react';
import {
  Bell,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Info,
  ListTodo,
  LogOut,
  Moon,
  Palette,
  RefreshCcw,
  Target,
  Trash2,
  User,
} from 'lucide-react';
import {
  getAppSettings,
  saveAppSettings,
  getSubjects,
  saveSubjects,
  getNotifications,
  saveNotifications,
  clearAllData,
} from '../utils/storage';
import { createCalendarItemId, getDateKey, getTodosForDate, saveTodosForDate } from '../utils/calendarStorage';
import { signOut, updateNickname } from '../utils/auth';
import { ACCENT_OPTIONS, applyAccentColor, loadUserAccent, saveUserAccent } from '../utils/themeSettings';

const helpItems = [
  { title: '홈', body: '오늘 공부 시간, 집중 점수, 오늘 To-do를 한눈에 확인해요.' },
  { title: '타이머', body: '과목을 고르고 집중 시간을 기록해 공부 흐름을 이어가요.' },
  { title: '기록', body: '공부, 감정, 실패 기록을 모아 나의 패턴을 파악해요.' },
  { title: '통계', body: '공부량, 감정, 실패 요인, 캘린더 히트맵을 확인해요.' },
  { title: '캘린더', body: '날짜별 To-do와 일정을 관리하고 하루를 정리해요.' },
  { title: 'AI 코치', body: '집중, 루틴, 멘탈, 실패 원인 등 공부 고민을 상담해요.' },
  { title: '설정', body: '목표 시간, 과목, 알림, 테마, 포인트 색상을 관리해요.' },
];

const dividerStyle = {
  height: '1px',
  background: 'color-mix(in srgb, var(--text-tertiary) 22%, transparent)',
  margin: '0 16px',
};

const menuButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '16px',
  cursor: 'pointer',
  border: 'none',
  background: 'transparent',
  color: 'var(--text-primary)',
  textAlign: 'left',
  boxShadow: 'none',
  borderRadius: 0,
};

const SettingsScreen = ({ user, onLogout, onUserUpdate }) => {
  const [settings, setSettings] = useState(getAppSettings());
  const [subjects, setSubjects] = useState(getSubjects());
  const [notifications, setNotifications] = useState(getNotifications());
  const todayKey = getDateKey(new Date());
  const [todos, setTodos] = useState(() => getTodosForDate(todayKey));
  const [newSubject, setNewSubject] = useState('');
  const [newTodo, setNewTodo] = useState('');
  const [confirmModal, setConfirmModal] = useState(null);
  const [infoModal, setInfoModal] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedAccent, setSelectedAccent] = useState('sky');
  const [themeSaving, setThemeSaving] = useState(false);
  const [themeMessage, setThemeMessage] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [nicknameMessage, setNicknameMessage] = useState('');

  useEffect(() => {
    let active = true;

    const syncAccent = async () => {
      const accentId = await loadUserAccent(user?.id);
      if (!active) return;
      setSelectedAccent(accentId);
      applyAccentColor(accentId);
    };

    syncAccent();
    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    setNicknameInput(user?.user_metadata?.nickname || user?.email?.split('@')[0] || '');
    setNicknameMessage('');
  }, [user]);

  const handleGoalChange = (e) => {
    const newGoal = parseInt(e.target.value, 10);
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

  const removeSubject = (subject) => {
    const updated = subjects.filter((item) => item !== subject);
    setSubjects(updated);
    saveSubjects(updated);
  };

  const toggleNotification = (key) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    saveNotifications(updated);
  };

  const handleAccentSelect = async (accentId) => {
    if (settings.theme === 'dark' && accentId === 'black') {
      return;
    }

    setSelectedAccent(accentId);
    applyAccentColor(accentId);
    setThemeSaving(true);
    setThemeMessage('');

    const result = await saveUserAccent(user?.id, accentId);
    setThemeSaving(false);
    setThemeMessage(
      result.ok
        ? '색상 설정이 이 기기에 저장되었어요.'
        : '색상 설정 저장에 실패했어요.',
    );
  };

  const handleReset = () => {
    setConfirmModal({
      type: 'reset',
      title: '데이터 초기화',
      message: '정말 모든 데이터를 초기화할까요?\n이 작업은 되돌릴 수 없어요.',
    });
  };

  const handleConfirm = async () => {
    if (confirmModal?.type === 'logout') {
      await signOut();
      setConfirmModal(null);
      if (onLogout) onLogout();
      return;
    }

    if (confirmModal?.type === 'reset') {
      setConfirmModal(null);
      await clearAllData();
    }
  };

  const handleNicknameSave = async () => {
    const trimmedNickname = nicknameInput.trim();

    if (!trimmedNickname) {
      setNicknameMessage('닉네임을 입력해주세요.');
      return;
    }

    if (trimmedNickname === (user?.user_metadata?.nickname || user?.email?.split('@')[0] || '')) {
      setNicknameMessage('이미 사용 중인 닉네임이에요.');
      return;
    }

    setNicknameSaving(true);
    setNicknameMessage('');
    const result = await updateNickname(trimmedNickname);
    setNicknameSaving(false);
    setNicknameMessage(result.message);

    if (result.success && result.user && onUserUpdate) {
      onUserUpdate(result.user);
    }
  };

  const addTodo = () => {
    if (newTodo.trim()) {
      const updated = [...todos, { id: createCalendarItemId(), text: newTodo.trim(), completed: false }];
      setTodos(updated);
      saveTodosForDate(todayKey, updated);
      setNewTodo('');
    }
  };

  const toggleTodo = (id) => {
    const updated = todos.map((todo) => (
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
    setTodos(updated);
    saveTodosForDate(todayKey, updated);
  };

  const removeTodo = (id) => {
    const updated = todos.filter((todo) => todo.id !== id);
    setTodos(updated);
    saveTodosForDate(todayKey, updated);
  };

  return (
    <div className="screen-container" style={{ paddingBottom: '140px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>설정</h2>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Target size={20} color="var(--primary-color)" />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>하루 목표 시간</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="range"
            min="30"
            max="1440"
            step="30"
            value={settings.dailyGoal}
            onChange={handleGoalChange}
            style={{ width: '100%', accentColor: 'var(--primary-color)' }}
          />
          <span style={{ fontWeight: '700', width: '100%', textAlign: 'right', color: 'var(--text-secondary)' }}>
            {Math.floor(settings.dailyGoal / 60)}시간 {settings.dailyGoal % 60}분
          </span>
        </div>
      </div>

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
            style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--tertiary-bg)', background: 'var(--secondary-bg)', color: 'var(--text-primary)' }}
          />
          <button onClick={addSubject} className="btn-primary" style={{ width: 'auto', padding: '8px 16px' }}>+</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {subjects.map((subject) => (
            <div
              key={subject}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'var(--tertiary-bg)',
                color: 'var(--text-primary)',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '13px',
              }}
            >
              {subject}
              <Trash2 size={14} color="#FF3B30" style={{ cursor: 'pointer' }} onClick={() => removeSubject(subject)} />
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <ListTodo size={20} color="var(--primary-color)" />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>오늘 To-do 관리</h3>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="To-do 추가하기..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--tertiary-bg)', background: 'var(--secondary-bg)', color: 'var(--text-primary)' }}
          />
          <button onClick={addTodo} className="btn-primary" style={{ width: 'auto', padding: '8px 16px' }}>+</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {todos.length > 0 ? todos.map((todo) => (
            <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => toggleTodo(todo.id)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', flex: 1, border: 'none', background: 'transparent', padding: 0, textAlign: 'left' }}
              >
                <CheckCircle2 size={20} color={todo.completed ? 'var(--primary-color)' : '#E5E5EA'} />
                <span
                  style={{
                    fontSize: '14px',
                    color: todo.completed ? 'var(--text-secondary)' : 'var(--text-primary)',
                    textDecoration: todo.completed ? 'line-through' : 'none',
                  }}
                >
                  {todo.text}
                </span>
              </button>
              <Trash2 size={16} color="#FF3B30" style={{ cursor: 'pointer' }} onClick={() => removeTodo(todo.id)} />
            </div>
          )) : (
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
              등록된 To-do가 없습니다.
            </p>
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Moon size={20} color="var(--primary-color)" />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>테마 설정</h3>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px' }}>다크 모드</span>
          <button
            type="button"
            aria-label="다크 모드 전환"
            onClick={() => {
              const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
              const updated = { ...settings, theme: newTheme };
              setSettings(updated);
              saveAppSettings(updated);
              document.body.classList.toggle('dark', newTheme === 'dark');
              if (newTheme === 'dark' && selectedAccent === 'black') {
                const fallbackAccent = 'lightgray';
                setSelectedAccent(fallbackAccent);
                applyAccentColor(fallbackAccent);
                saveUserAccent(user?.id, fallbackAccent);
              } else {
                applyAccentColor(selectedAccent);
              }
            }}
            style={{
              width: '44px',
              height: '24px',
              borderRadius: '12px',
              background: settings.theme === 'dark' ? 'var(--primary-color)' : '#E5E5EA',
              position: 'relative',
              cursor: 'pointer',
              border: 'none',
              padding: 0,
            }}
          >
            <span
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '10px',
                background: 'white',
                position: 'absolute',
                top: '2px',
                left: settings.theme === 'dark' ? '22px' : '2px',
                transition: 'left 0.3s',
              }}
            />
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Palette size={20} color="var(--primary-color)" />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>포인트 색상 변경</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
          {ACCENT_OPTIONS.map((option) => {
            const selected = selectedAccent === option.id;
            const isBlackDisabledInDark = settings.theme === 'dark' && option.id === 'black';
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleAccentSelect(option.id)}
                aria-label={`${option.label} 선택`}
                title={option.label}
                disabled={isBlackDisabledInDark}
                style={{
                  aspectRatio: '1',
                  borderRadius: '16px',
                  border: selected ? `3px solid ${option.color}` : '1px solid var(--tertiary-bg)',
                  background: option.light,
                  color: option.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isBlackDisabledInDark ? 'not-allowed' : 'pointer',
                  boxShadow: selected ? `0 8px 18px ${option.color}33` : 'none',
                  opacity: isBlackDisabledInDark ? 0.6 : 1,
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: option.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selected && <Check size={15} color="white" />}
                </span>
                {isBlackDisabledInDark && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      width: '30px',
                      height: '2px',
                      background: '#EF4444',
                      transform: 'rotate(-45deg)',
                      borderRadius: '2px',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: '1.5' }}>
          {themeSaving ? '계정 설정 저장 중...' : themeMessage || '선택한 포인트 색상은 로그인한 계정별로 저장됩니다.'}
        </p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Bell size={20} color="var(--primary-color)" />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>알림 설정</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { key: 'studyStart', label: '공부 시작 알림' },
            { key: 'breakTime', label: '휴식 시간 알림' },
            { key: 'goalReached', label: '목표 달성 알림' },
          ].map((item) => (
            <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px' }}>{item.label}</span>
              <button
                type="button"
                aria-label={`${item.label} 전환`}
                onClick={() => toggleNotification(item.key)}
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '12px',
                  background: notifications[item.key] ? 'var(--primary-color)' : '#E5E5EA',
                  position: 'relative',
                  cursor: 'pointer',
                  border: 'none',
                  padding: 0,
                }}
              >
                <span
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '10px',
                    background: 'white',
                    position: 'absolute',
                    top: '2px',
                    left: notifications[item.key] ? '22px' : '2px',
                    transition: 'left 0.3s',
                  }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: '8px 0' }}>
        {user?.email && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px' }}>
              <Info size={20} color="var(--primary-color)" style={{ marginRight: '12px' }} />
              <span style={{ flex: 1, fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
            </div>
            <div style={dividerStyle} />
          </>
        )}
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <User size={20} color="var(--primary-color)" />
            <span style={{ fontWeight: '600' }}>닉네임 변경</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="닉네임 입력"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              maxLength={20}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--tertiary-bg)',
                background: 'var(--secondary-bg)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              type="button"
              onClick={handleNicknameSave}
              disabled={nicknameSaving}
              className="btn-primary"
              style={{ width: 'auto', padding: '10px 16px', opacity: nicknameSaving ? 0.7 : 1 }}
            >
              {nicknameSaving ? '저장 중' : '저장'}
            </button>
          </div>
          <p style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: '1.5' }}>
            {nicknameMessage || '홈 화면에 표시되는 이름을 바꿀 수 있어요.'}
          </p>
        </div>
        <div style={dividerStyle} />
        <button type="button" onClick={() => setShowHelp(true)} style={menuButtonStyle}>
          <HelpCircle size={20} color="var(--primary-color)" style={{ marginRight: '12px' }} />
          <span style={{ flex: 1, fontWeight: '600' }}>사용방법</span>
          <ChevronRight size={20} color="#C7C7CC" />
        </button>
        <div style={dividerStyle} />
        <button type="button" onClick={() => setConfirmModal({ type: 'logout', title: '로그아웃', message: '정말 로그아웃 하시겠어요?' })} style={menuButtonStyle}>
          <LogOut size={20} color="var(--primary-color)" style={{ marginRight: '12px' }} />
          <span style={{ flex: 1, fontWeight: '600' }}>로그아웃</span>
          <ChevronRight size={20} color="#C7C7CC" />
        </button>
        <div style={dividerStyle} />
        <button type="button" onClick={handleReset} style={menuButtonStyle}>
          <RefreshCcw size={20} color="#FF3B30" style={{ marginRight: '12px' }} />
          <span style={{ flex: 1, color: '#FF3B30', fontWeight: '600' }}>데이터 초기화</span>
          <ChevronRight size={20} color="#C7C7CC" />
        </button>
        <div style={dividerStyle} />
        <button type="button" onClick={() => setInfoModal({ title: '앱 정보', message: 'StudyFit v1.0.0 (Beta)\nDeveloped by Team AntiGravity' })} style={menuButtonStyle}>
          <Info size={20} color="#8E8E93" style={{ marginRight: '12px' }} />
          <span style={{ flex: 1 }}>앱 정보</span>
          <span style={{ fontSize: '13px', color: '#C7C7CC', marginRight: '8px' }}>v1.0.0</span>
          <ChevronRight size={20} color="#C7C7CC" />
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: '#C7C7CC' }}>
        © 2026 StudyFit. All rights reserved.
      </div>

      {confirmModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '24px',
        }}>
          <div style={{
            background: 'var(--secondary-bg)',
            borderRadius: '24px',
            padding: '28px 24px',
            width: '100%',
            maxWidth: '320px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: 'var(--text-primary)' }}>
              {confirmModal.title}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
              {confirmModal.message}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setConfirmModal(null)}
                style={{
                  flex: 1, padding: '14px', borderRadius: '14px',
                  border: '1.5px solid var(--tertiary-bg)',
                  background: 'var(--tertiary-bg)',
                  color: 'var(--text-secondary)',
                  fontSize: '15px', fontWeight: '600', cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  flex: 1, padding: '14px', borderRadius: '14px',
                  border: 'none',
                  background: confirmModal.type === 'reset' ? '#FF3B30' : 'var(--primary-color)',
                  color: 'white',
                  fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                }}
              >
                {confirmModal.type === 'logout' ? '로그아웃' : '초기화'}
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
          zIndex: 9999, padding: '24px',
        }}>
          <div style={{
            background: 'var(--secondary-bg)',
            borderRadius: '24px',
            padding: '28px 24px',
            width: '100%', maxWidth: '320px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: 'var(--text-primary)' }}>
              {infoModal.title}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
              {infoModal.message}
            </p>
            <button
              onClick={() => setInfoModal(null)}
              style={{
                width: '100%', padding: '14px', borderRadius: '14px',
                border: 'none', background: 'var(--primary-color)',
                color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
              }}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {showHelp && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '24px',
        }}>
          <div style={{
            background: 'var(--secondary-bg)',
            borderRadius: '24px',
            padding: '24px',
            width: '100%',
            maxWidth: '360px',
            maxHeight: '78vh',
            overflowY: 'auto',
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ fontSize: '19px', fontWeight: '800', marginBottom: '16px', color: 'var(--text-primary)' }}>
              사용방법
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {helpItems.map((item) => (
                <div key={item.title} style={{ padding: '12px', borderRadius: '14px', background: 'var(--tertiary-bg)' }}>
                  <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: 'var(--primary-color)' }}>
                    {item.title}
                  </strong>
                  <p style={{ fontSize: '13px', lineHeight: '1.55', color: 'var(--text-secondary)' }}>
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowHelp(false)}
              style={{
                width: '100%', marginTop: '18px', padding: '14px', borderRadius: '14px',
                border: 'none', background: 'var(--primary-color)',
                color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
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

export default SettingsScreen;
