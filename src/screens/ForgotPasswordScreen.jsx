import React, { useState } from 'react';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import { sendPasswordResetEmail } from '../utils/auth';

const getResetRedirectUrl = () => `${window.location.origin}/reset-password`;

const ForgotPasswordScreen = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!email.trim() || !email.includes('@')) {
      setError('가입한 이메일 주소를 입력해주세요.');
      return;
    }

    setLoading(true);
    const res = await sendPasswordResetEmail({
      email: email.trim(),
      redirectTo: getResetRedirectUrl(),
    });
    setLoading(false);

    if (res.success) {
      setMessage(res.message);
    } else {
      setError(res.message || '메일을 보내지 못했습니다. 이메일 주소를 확인해주세요.');
    }
  };

  return (
    <div className="screen-container animate-fade-in centered-screen" style={{ padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <button onClick={onBack} style={backButtonStyle}>
          <ArrowLeft size={18} />
          로그인으로 돌아가기
        </button>

        <div className="card" style={{ padding: '26px 24px', borderRadius: '24px' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '18px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
            <Mail size={26} color="var(--primary-color)" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>비밀번호 찾기</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '22px' }}>
            가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드릴게요.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
              style={inputStyle}
            />

            {message && <div style={successStyle}>{message}</div>}
            {error && <div style={errorStyle}>{error}</div>}

            <button className="btn-primary" type="submit" disabled={loading} style={{ padding: '15px', borderRadius: '14px', opacity: loading ? 0.75 : 1 }}>
              <Send size={18} />
              {loading ? '메일 보내는 중...' : '재설정 메일 보내기'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const backButtonStyle = {
  border: 'none',
  background: 'transparent',
  color: 'var(--text-secondary)',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '14px',
  fontWeight: '700',
  marginBottom: '14px',
  cursor: 'pointer',
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

export default ForgotPasswordScreen;
