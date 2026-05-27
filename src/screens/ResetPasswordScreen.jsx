import React, { useState } from 'react';
import { Lock, Save } from 'lucide-react';
import { signOut, updatePassword } from '../utils/auth';

const ResetPasswordScreen = ({ onDone }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    const res = await updatePassword(password);
    setLoading(false);

    if (res.success) {
      setMessage(res.message);
      await signOut();
      window.history.replaceState({}, '', '/');
      setTimeout(() => onDone(), 1200);
    } else {
      setError(res.message || '비밀번호를 변경하지 못했습니다. 재설정 링크를 다시 확인해주세요.');
    }
  };

  return (
    <div className="screen-container animate-fade-in centered-screen" style={{ padding: '24px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '360px', padding: '26px 24px', borderRadius: '24px' }}>
        <div style={{ width: '54px', height: '54px', borderRadius: '18px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
          <Lock size={26} color="var(--primary-color)" />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>새 비밀번호 설정</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '22px' }}>
          앞으로 사용할 새 비밀번호를 입력해주세요.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="새 비밀번호"
            style={inputStyle}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="새 비밀번호 확인"
            style={inputStyle}
          />

          {message && <div style={successStyle}>{message}</div>}
          {error && <div style={errorStyle}>{error}</div>}

          <button className="btn-primary" type="submit" disabled={loading} style={{ padding: '15px', borderRadius: '14px', opacity: loading ? 0.75 : 1 }}>
            <Save size={18} />
            {loading ? '변경 중...' : '비밀번호 변경하기'}
          </button>
        </form>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: '14px',
  border: '1px solid var(--border-color, #E2E8F0)',
  background: 'var(--bg-color)',
  color: 'var(--text-primary)',
  fontSize: '15px',
  fontFamily: 'inherit',
  outline: 'none',
};

const successStyle = {
  color: 'var(--success-color)',
  background: 'rgba(33, 150, 83, 0.1)',
  padding: '12px',
  borderRadius: '12px',
  fontSize: '13px',
  fontWeight: '700',
  lineHeight: 1.5,
};

const errorStyle = {
  color: 'var(--error-color)',
  background: 'rgba(235, 87, 87, 0.1)',
  padding: '12px',
  borderRadius: '12px',
  fontSize: '13px',
  fontWeight: '700',
  lineHeight: 1.5,
};

export default ResetPasswordScreen;
