import React from 'react';
import { Clock, Heart, AlertCircle, Save } from 'lucide-react';

const StartScreen = ({ onStart }) => {
  const features = [
    { icon: Clock, label: '공부 시간', color: '#007AFF' },
    { icon: Heart, label: '감정 관리', color: '#FF2D55' },
    { icon: AlertCircle, label: '실패 분석', color: '#FF9500' },
    { icon: Save, label: '기록 저장', color: '#34C759' },
  ];

  return (
    <div className="screen-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ 
          width: '120px', 
          height: '120px', 
          backgroundColor: 'var(--primary-color)', 
          borderRadius: '30px', 
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 20px rgba(0, 122, 255, 0.3)'
        }}>
          <span style={{ color: 'white', fontSize: '48px', fontWeight: 'bold' }}>SF</span>
        </div>
        
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>StudyFit</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '18px', marginBottom: '40px' }}>나에게 맞는 공부 습관 찾기</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%', maxWidth: '300px' }}>
          {features.map((f, i) => (
            <div key={i} className="card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', margin: 0 }}>
              <f.icon size={24} color={f.color} />
              <span style={{ fontSize: '12px', fontWeight: '600' }}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ paddingBottom: '40px' }}>
        <button className="btn-primary" onClick={onStart} style={{ marginBottom: '12px' }}>시작하기</button>
        <button className="btn-secondary" onClick={() => alert('기존 데이터를 불러옵니다.')}>기록 불러오기</button>
      </div>
    </div>
  );
};

export default StartScreen;
