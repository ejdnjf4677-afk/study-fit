import React, { useState, useEffect } from 'react';
import { Clock, Heart, AlertCircle, Save, User, Lock, LogIn, UserPlus, Smile } from 'lucide-react';
import { loginUser, registerUser } from '../utils/storage';
import lightIcon from '../스터디 핏 아이콘 (밝은버전).png';
import darkIcon from '../스터디 핏 아이콘 (어두운버전).png';

const StartScreen = ({ onStart }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => document.body.classList.contains('dark'));

  useEffect(() => {
    setIsDarkMode(document.body.classList.contains('dark'));

    const observer = new MutationObserver(() => {
      setIsDarkMode(document.body.classList.contains('dark'));
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!username.trim() || !password.trim()) {
      setError('아이디와 비밀번호를 모두 입력해 주세요.');
      return;
    }

    const res = loginUser(username.trim(), password);
    if (res.success) {
      onStart();
    } else {
      setError(res.message);
    }
  };

  const handleSignup = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!username.trim() || !password.trim() || !confirmPassword.trim() || !nickname.trim()) {
      setError('모든 필드를 입력해 주세요.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 4) {
      setError('비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }

    const res = registerUser(username.trim(), password, nickname.trim());
    if (res.success) {
      setSuccessMsg(res.message);
      // Automatically switch to login after short delay and pre-fill username
      setTimeout(() => {
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        setNickname('');
        setSuccessMsg('');
      }, 1500);
    } else {
      setError(res.message);
    }
  };

  const features = [
    { icon: Clock, label: '공부 시간', color: '#007AFF' },
    { icon: Heart, label: '감정 관리', color: '#FF2D55' },
    { icon: AlertCircle, label: '실패 분석', color: '#FF9500' },
    { icon: Save, label: '기록 저장', color: '#34C759' },
  ];

  return (
    <div className="screen-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: '360px', margin: '0 auto' }}>

        {/* Logo and Title */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '24px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 20px rgba(0, 122, 255, 0.2)',
            marginLeft: 'auto',
            marginRight: 'auto',
            overflow: 'hidden'
          }}>
            <img
              src={isDarkMode ? darkIcon : lightIcon}
              alt="스터디핏 아이콘"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '6px', letterSpacing: '-0.5px' }}>스터디핏</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>나에게 맞는 공부 습관 찾기</p>
        </div>

        {/* Card containing Login/Signup Form */}
        <div className="card" style={{ width: '100%', padding: '24px', borderRadius: '24px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', margin: '0 0 20px 0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', textAlign: 'left', color: 'var(--text-primary)' }}>
            {mode === 'login' ? '로그인' : '회원가입'}
          </h2>

          <form onSubmit={mode === 'login' ? handleLogin : handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Username field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>아이디</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input
                  type="text"
                  placeholder="아이디를 입력하세요"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>
            </div>

            {/* Nickname field (Signup only) */}
            {mode === 'signup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>닉네임</label>
                <div style={{ position: 'relative' }}>
                  <Smile size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                  <input
                    type="text"
                    placeholder="사용하실 닉네임을 입력하세요"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 40px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                  />
                </div>
              </div>
            )}

            {/* Password field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>비밀번호</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>
            </div>

            {/* Confirm Password field (Signup only) */}
            {mode === 'signup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>비밀번호 확인</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                  <input
                    type="password"
                    placeholder="비밀번호를 다시 입력하세요"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 40px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div style={{ color: '#FF2D55', fontSize: '13px', fontWeight: '500', textAlign: 'left', marginTop: '4px' }}>
                {error}
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div style={{ color: '#34C759', fontSize: '13px', fontWeight: '500', textAlign: 'left', marginTop: '4px' }}>
                {successMsg}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '10px',
                cursor: 'pointer'
              }}
            >
              {mode === 'login' ? (
                <>
                  <LogIn size={18} />
                  로그인
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  회원가입 완료
                </>
              )}
            </button>
          </form>

          {/* Switch Mode Link */}
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            {mode === 'login' ? (
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                계정이 없으신가요?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                    setSuccessMsg('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-color)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '13px',
                    textDecoration: 'underline'
                  }}
                >
                  회원가입
                </button>
              </span>
            ) : (
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                이미 계정이 있으신가요?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setSuccessMsg('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-color)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '13px',
                    textDecoration: 'underline'
                  }}
                >
                  로그인
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Feature Icons Grid (Mini Version for Aesthetics) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', width: '100%', marginTop: '10px' }}>
          {features.map((f, i) => (
            <div key={i} className="card" style={{ padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', margin: 0, borderRadius: '12px' }}>
              <f.icon size={16} color={f.color} />
              <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-secondary)' }}>{f.label}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default StartScreen;
