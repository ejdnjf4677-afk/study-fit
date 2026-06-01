import React, { useMemo, useState } from 'react';
import { CalendarDays, CheckSquare, Clock, Edit3, Plus, Save, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { createCalendarItemId, getCalendarData, getDateKey, saveDayData } from '../utils/calendarStorage';

const emptyTodoForm = { text: '' };
const emptyScheduleForm = { title: '', time: '', memo: '', allDay: false };

const CalendarScreen = () => {
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState(getCalendarData());
  const [todoForm, setTodoForm] = useState(emptyTodoForm);
  const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm);
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [editingScheduleId, setEditingScheduleId] = useState(null);

  const selectedKey = getDateKey(selectedDate);
  const selectedDayData = calendarData[selectedKey] || { todos: [], schedules: [] };

  const calendarCells = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return [
      ...Array.from({ length: firstDay }, (_, i) => ({ key: `empty-${i}`, empty: true })),
      ...Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(year, month, i + 1);
        const key = getDateKey(date);
        return { key, date, day: i + 1, data: calendarData[key] };
      }),
    ];
  }, [calendarMonth, calendarData]);

  const updateSelectedDay = (nextDayData) => {
    saveDayData(selectedKey, nextDayData);
    setCalendarData(getCalendarData());
  };

  const resetForms = () => {
    setTodoForm(emptyTodoForm);
    setScheduleForm(emptyScheduleForm);
    setEditingTodoId(null);
    setEditingScheduleId(null);
  };

  const saveTodo = () => {
    const text = todoForm.text.trim();
    if (!text) return;

    const todos = editingTodoId
      ? selectedDayData.todos.map((todo) => (todo.id === editingTodoId ? { ...todo, text } : todo))
      : [...selectedDayData.todos, { id: createCalendarItemId(), text, completed: false }];

    updateSelectedDay({ ...selectedDayData, todos });
    setTodoForm(emptyTodoForm);
    setEditingTodoId(null);
  };

  const saveSchedule = () => {
    const title = scheduleForm.title.trim();
    if (!title) return;

    const schedule = {
      title,
      time: scheduleForm.allDay ? '' : scheduleForm.time,
      memo: scheduleForm.memo.trim(),
      allDay: !!scheduleForm.allDay,
    };

    const schedules = editingScheduleId
      ? selectedDayData.schedules.map((item) => (item.id === editingScheduleId ? { ...item, ...schedule } : item))
      : [...selectedDayData.schedules, { id: createCalendarItemId(), ...schedule }];

    updateSelectedDay({ ...selectedDayData, schedules });
    setScheduleForm(emptyScheduleForm);
    setEditingScheduleId(null);
  };

  const toggleTodo = (id) => {
    const todos = selectedDayData.todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo));
    updateSelectedDay({ ...selectedDayData, todos });
  };

  const deleteTodo = (id) => {
    updateSelectedDay({ ...selectedDayData, todos: selectedDayData.todos.filter((todo) => todo.id !== id) });
    if (editingTodoId === id) {
      setEditingTodoId(null);
      setTodoForm(emptyTodoForm);
    }
  };

  const deleteSchedule = (id) => {
    updateSelectedDay({ ...selectedDayData, schedules: selectedDayData.schedules.filter((item) => item.id !== id) });
    if (editingScheduleId === id) {
      setEditingScheduleId(null);
      setScheduleForm(emptyScheduleForm);
    }
  };

  const startEditTodo = (todo) => {
    setEditingTodoId(todo.id);
    setTodoForm({ text: todo.text });
  };

  const startEditSchedule = (schedule) => {
    setEditingScheduleId(schedule.id);
    setScheduleForm({
      title: schedule.title,
      time: schedule.time || '',
      memo: schedule.memo || '',
      allDay: !!schedule.allDay,
    });
  };

  const moveMonth = (offset) => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const selectDate = (date) => {
    setSelectedDate(date);
    resetForms();
  };

  return (
    <div className="screen-container animate-fade-in" style={{ paddingBottom: '130px' }}>
      <header style={{ paddingTop: '16px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '4px' }}>캘린더</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500' }}>To-do와 일정을 날짜별로 정리해보세요</p>
      </header>

      <div className="card" style={{ padding: '20px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <button onClick={() => moveMonth(-1)} aria-label="이전 달" style={iconButtonStyle}>
            <ChevronLeft size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '17px', fontWeight: '800' }}>
            <CalendarDays size={18} color="var(--primary-color)" />
            {calendarMonth.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
          </div>
          <button onClick={() => moveMonth(1)} aria-label="다음 달" style={iconButtonStyle}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '8px' }}>
          {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
            <div key={day} style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '800' }}>{day}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
          {calendarCells.map((cell) => {
            if (cell.empty) return <div key={cell.key} style={{ aspectRatio: '1 / 1' }} />;
            const isSelected = cell.key === selectedKey;
            const todos = cell.data?.todos || [];
            const schedules = cell.data?.schedules || [];
            const hasItems = todos.length > 0 || schedules.length > 0;

            return (
              <button
                key={cell.key}
                onClick={() => selectDate(cell.date)}
                style={{
                  aspectRatio: '1 / 1',
                  border: isSelected ? '2px solid var(--primary-color)' : '1px solid transparent',
                  borderRadius: '14px',
                  background: hasItems ? 'var(--secondary-bg)' : 'var(--tertiary-bg)',
                  color: 'var(--text-primary)',
                  boxShadow: hasItems ? '0 4px 12px rgba(15, 23, 42, 0.06)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  fontSize: '13px',
                  fontWeight: '800',
                }}
              >
                {cell.day}
                <span style={{ display: 'flex', gap: '3px', minHeight: '5px' }}>
                  {todos.length > 0 && <span style={dotStyle('var(--primary-color)')} />}
                  {schedules.length > 0 && <span style={dotStyle('var(--warning-color)')} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
        <div className="card" style={{ padding: '16px', margin: 0 }}>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: '700', marginBottom: '6px' }}>선택 날짜</div>
          <div style={{ fontSize: '17px', fontWeight: '800' }}>{selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</div>
        </div>
        <div className="card" style={{ padding: '16px', margin: 0 }}>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: '700', marginBottom: '6px' }}>오늘 항목</div>
          <div style={{ fontSize: '17px', fontWeight: '800' }}>{selectedDayData.todos.length + selectedDayData.schedules.length}개</div>
        </div>
      </div>

      <section className="card" style={{ padding: '20px', marginBottom: '18px' }}>
        <SectionTitle icon={CheckSquare} title="To-do" />
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <input value={todoForm.text} onChange={(e) => setTodoForm({ text: e.target.value })} placeholder="예: 수학 과제하기" style={inputStyle} />
          <button onClick={saveTodo} aria-label={editingTodoId ? 'To-do 수정' : 'To-do 추가'} style={smallPrimaryButtonStyle}>
            {editingTodoId ? <Save size={18} /> : <Plus size={18} />}
          </button>
          {editingTodoId && (
            <button onClick={() => { setEditingTodoId(null); setTodoForm(emptyTodoForm); }} aria-label="To-do 수정 취소" style={iconButtonStyle}>
              <X size={18} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {selectedDayData.todos.length > 0 ? selectedDayData.todos.map((todo) => (
            <div key={todo.id} style={listItemStyle}>
              <button onClick={() => toggleTodo(todo.id)} aria-label="완료 전환" style={{ ...iconButtonStyle, flexShrink: 0 }}>
                <CheckSquare size={18} color={todo.completed ? 'var(--primary-color)' : 'var(--text-tertiary)'} />
              </button>
              <span style={{ flex: 1, fontSize: '14px', color: todo.completed ? 'var(--text-tertiary)' : 'var(--text-primary)', textDecoration: todo.completed ? 'line-through' : 'none', fontWeight: '600' }}>{todo.text}</span>
              <button onClick={() => startEditTodo(todo)} aria-label="To-do 수정" style={plainIconStyle}><Edit3 size={16} /></button>
              <button onClick={() => deleteTodo(todo.id)} aria-label="To-do 삭제" style={plainIconStyle}><Trash2 size={16} color="var(--error-color)" /></button>
            </div>
          )) : <EmptyState text="아직 등록된 To-do가 없습니다." />}
        </div>
      </section>

      <section className="card" style={{ padding: '20px' }}>
        <SectionTitle icon={Clock} title="일정" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
          <input
            value={scheduleForm.title}
            onChange={(e) => setScheduleForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="일정 제목"
            style={inputStyle}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px' }}>
            <input
              type="time"
              value={scheduleForm.time}
              onChange={(e) => setScheduleForm((prev) => ({ ...prev, time: e.target.value }))}
              disabled={scheduleForm.allDay}
              style={{ ...inputStyle, opacity: scheduleForm.allDay ? 0.55 : 1 }}
            />
            <button
              type="button"
              onClick={() => setScheduleForm((prev) => ({ ...prev, allDay: !prev.allDay, time: prev.allDay ? prev.time : '' }))}
              style={{
                ...inputStyle,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                background: 'var(--secondary-bg)',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>종일 일정</span>
              <span
                style={{
                  width: '40px',
                  height: '22px',
                  borderRadius: '999px',
                  background: scheduleForm.allDay ? 'var(--primary-color)' : 'var(--tertiary-bg)',
                  position: 'relative',
                  transition: 'background 0.2s ease',
                }}
              >
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'white',
                    position: 'absolute',
                    top: '2px',
                    left: scheduleForm.allDay ? '20px' : '2px',
                    transition: 'left 0.2s ease',
                  }}
                />
              </span>
            </button>
          </div>

          <input
            value={scheduleForm.memo}
            onChange={(e) => setScheduleForm((prev) => ({ ...prev, memo: e.target.value }))}
            placeholder="메모"
            style={inputStyle}
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={saveSchedule} className="btn-primary" style={{ padding: '13px', borderRadius: '14px', fontSize: '14px' }}>
              {editingScheduleId ? <Save size={18} /> : <Plus size={18} />}
              {editingScheduleId ? '일정 수정' : '일정 추가'}
            </button>
            {editingScheduleId && (
              <button onClick={() => { setEditingScheduleId(null); setScheduleForm(emptyScheduleForm); }} style={{ ...iconButtonStyle, width: '48px', height: '48px' }}>
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {selectedDayData.schedules.length > 0 ? selectedDayData.schedules
            .slice()
            .sort((a, b) => {
              const aAllDay = !!a.allDay;
              const bAllDay = !!b.allDay;
              if (aAllDay && !bAllDay) return -1;
              if (!aAllDay && bAllDay) return 1;
              return (a.time || '').localeCompare(b.time || '');
            })
            .map((schedule) => (
              <div key={schedule.id} style={{ ...listItemStyle, alignItems: 'flex-start' }}>
                <div style={{ minWidth: '60px', color: 'var(--primary-color)', fontWeight: '800', fontSize: '13px', paddingTop: '2px' }}>
                  {schedule.allDay ? '종일' : (schedule.time || '--:--')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>{schedule.title}</div>
                  {schedule.memo && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{schedule.memo}</div>}
                </div>
                <button onClick={() => startEditSchedule(schedule)} aria-label="일정 수정" style={plainIconStyle}><Edit3 size={16} /></button>
                <button onClick={() => deleteSchedule(schedule.id)} aria-label="일정 삭제" style={plainIconStyle}><Trash2 size={16} color="var(--error-color)" /></button>
              </div>
            )) : <EmptyState text="아직 등록된 일정이 없습니다." />}
        </div>
      </section>
    </div>
  );
};

const SectionTitle = ({ icon: Icon, title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
    <div style={{ width: '32px', height: '32px', borderRadius: '12px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={17} color="var(--primary-color)" />
    </div>
    <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>{title}</h3>
  </div>
);

const EmptyState = ({ text }) => (
  <div style={{ padding: '18px', borderRadius: '16px', background: 'var(--tertiary-bg)', color: 'var(--text-tertiary)', fontSize: '13px', textAlign: 'center', fontWeight: '600' }}>{text}</div>
);

const dotStyle = (color) => ({
  width: '5px',
  height: '5px',
  borderRadius: '50%',
  background: color,
});

const iconButtonStyle = {
  width: '36px',
  height: '36px',
  border: 'none',
  borderRadius: '12px',
  background: 'var(--tertiary-bg)',
  color: 'var(--text-secondary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

const plainIconStyle = {
  border: 'none',
  background: 'transparent',
  color: 'var(--text-tertiary)',
  padding: '6px',
  cursor: 'pointer',
};

const inputStyle = {
  width: '100%',
  minWidth: 0,
  padding: '13px 14px',
  borderRadius: '14px',
  border: '1px solid var(--border-color, #E2E8F0)',
  background: 'var(--bg-color)',
  color: 'var(--text-primary)',
  fontSize: '14px',
  fontFamily: 'inherit',
  outline: 'none',
};

const smallPrimaryButtonStyle = {
  ...iconButtonStyle,
  width: '46px',
  height: '46px',
  background: 'var(--primary-color)',
  color: 'white',
  flexShrink: 0,
};

const listItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px',
  borderRadius: '16px',
  background: 'var(--tertiary-bg)',
};

export default CalendarScreen;
