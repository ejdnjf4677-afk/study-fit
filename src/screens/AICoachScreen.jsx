import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, TrendingUp, Brain, Heart, Target, AlertTriangle } from 'lucide-react';
import { getStudyRecords, getEmotionLogs, getFailureLogs, getAppSettings, getUserPoints } from '../utils/storage';
import { calculateConcentrationScore } from '../utils/logic';

const AICoachScreen = () => {
  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  const analyzeData = (userInput) => {
    const records = getStudyRecords();
    const emotions = getEmotionLogs();
    const failures = getFailureLogs();
    const settings = getAppSettings();
    const points = getUserPoints();

    const today = new Date().toLocaleDateString();
    const todayRecords = records.filter(r => new Date(r.timestamp).toLocaleDateString() === today);
    const todayMins = todayRecords.reduce((acc, r) => acc + r.durationMinutes, 0);
    const avgPauses = todayRecords.length > 0 ? todayRecords.reduce((acc, r) => acc + r.pauseCount, 0) / todayRecords.length : 0;
    
    // Keyword based analysis
    const input = userInput.toLowerCase();
    
    if (input.includes('집중') || input.includes('몰입')) {
      if (avgPauses > 3) return `오늘 평균 중단 횟수가 ${avgPauses.toFixed(1)}회로 다소 높아요. 휴대폰을 다른 방에 두거나 뽀모도로(25분 집중/5분 휴식) 타이머를 사용해보는 건 어떨까요?`;
      if (todayMins > 120) return `오늘 이미 ${todayMins}분이나 집중하셨네요! 뇌의 피로를 풀기 위해 15분 정도 가벼운 스트레칭을 추천드려요.`;
      return "집중력을 높이려면 공부 시작 전 '5분 명상'이 큰 도움이 됩니다. 지금 바로 시작해보세요!";
    }

    if (input.includes('감정') || input.includes('기분') || input.includes('힘들어')) {
      const negativeEmotions = emotions.filter(e => ['😫', '😴'].includes(e.emotion));
      if (negativeEmotions.length > 2) return "최근 피로나 스트레스 수치가 높게 기록되고 있어요. 오늘은 무리한 계획보다는 핵심 과제 하나만 끝내고 일찍 쉬는 것이 장기적으로 더 유리합니다.";
      return "감정 기록은 메타인지를 높이는 아주 좋은 습관이에요. 지금처럼 공부 후의 기분을 솔직하게 적어보세요!";
    }

    if (input.includes('실패') || input.includes('왜 안돼') || input.includes('의지')) {
      const phoneFailures = failures.filter(f => f.reason === '스마트폰');
      if (phoneFailures.length > 1) return "스마트폰이 가장 큰 방해 요소로 나타나고 있어요. 'Focus' 모드를 활용하거나 공부 중엔 전원을 끄는 과감한 조치가 필요해 보입니다.";
      return "실패는 분석을 위한 데이터일 뿐이에요. 오늘 작성한 개선 방안을 내일 첫 번째 공부 루틴에 바로 적용해보세요.";
    }

    if (input.includes('보상') || input.includes('포인트') || input.includes('선물')) {
      return `현재 ${points}P를 보유 중이시네요! ${15000 - points > 0 ? 15000 - points + 'P만 더 모으면 스타벅스 커피를 마실 수 있어요.' : '지금 바로 상점에서 기프티콘으로 교환해보세요!'}`;
    }

    // General context aware response
    if (todayMins === 0) return "아직 오늘 공부 기록이 없네요. 10분만이라도 가볍게 시작해보는 건 어떨까요? 시작이 반입니다!";
    const score = calculateConcentrationScore(Math.min(100, (todayMins/settings.dailyGoal)*100), avgPauses);
    
    if (score > 85) return `오늘 집중 점수가 ${score}점으로 매우 높아요! 이 흐름을 유지해서 가장 어려운 과목을 지금 공략해보세요.`;
    return `오늘 ${todayMins}분 동안 열심히 하셨네요. 목표 달성률은 ${(todayMins/settings.dailyGoal*100).toFixed(1)}%입니다. 남은 시간도 파이팅입니다!`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userMsg = { role: 'user', text: question };
    setChat(prev => [...prev, userMsg]);
    setQuestion('');
    setLoading(true);

    setTimeout(() => {
      const aiResponse = analyzeData(userMsg.text);
      setChat(prev => [...prev, { role: 'ai', text: aiResponse }]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="screen-container" style={{ justifyContent: 'center', paddingBottom: '20px' }}>
      <header style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles color="var(--primary-color)" /> AI 학습 코치
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>데이터 기반 개인 맞춤형 피드백</p>
      </header>

      {/* 분석 대시보드 요약 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <div className="card" style={{ margin: 0, padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-color)', marginBottom: '4px' }}>
            <Brain size={16} />
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>집중 패턴</span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: '600' }}>오전 집중형</div>
        </div>
        <div className="card" style={{ margin: 0, padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FF2D55', marginBottom: '4px' }}>
            <Heart size={16} />
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>정서 상태</span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: '600' }}>보람차고 긍정적</div>
        </div>
      </div>

      {/* 채팅 영역 */}
      <div className="card" style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '400px', 
        maxHeight: '450px',
        padding: '16px',
        background: '#f9f9fb',
        border: '1px solid #eee'
      }}>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {chat.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: '60px', color: '#ccc' }}>
              <Bot size={48} style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '14px' }}>학습 습관에 대해 무엇이든 물어보세요!</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginTop: '16px' }}>
                {['내 집중도는 어때?', '왜 자꾸 쉴까?', '피곤할 땐 어떡해?'].map(q => (
                  <button 
                    key={q} 
                    onClick={() => setQuestion(q)}
                    style={{ fontSize: '11px', padding: '6px 10px', borderRadius: '15px', border: '1px solid #ddd', background: 'white', color: '#666' }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {chat.map((msg, i) => (
            <div key={i} style={{ 
              display: 'flex', 
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              {msg.role === 'ai' && (
                <div style={{ width: '28px', height: '28px', background: 'var(--primary-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={16} color="white" />
                </div>
              )}
              <div style={{ 
                maxWidth: '80%',
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                background: msg.role === 'user' ? 'var(--primary-color)' : 'white',
                color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                fontSize: '13px',
                lineHeight: '1.5',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ width: '28px', height: '28px', background: 'var(--primary-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={16} color="white" />
              </div>
              <div style={{ padding: '10px 14px', background: 'white', borderRadius: '4px 16px 16px 16px', fontSize: '13px', color: '#888' }}>
                분석 중...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            placeholder="코치에게 질문하기..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
            style={{ 
              flex: 1, 
              padding: '12px 16px', 
              borderRadius: '12px', 
              border: '1px solid #ddd',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button 
            type="submit"
            disabled={loading || !question.trim()}
            style={{ 
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'var(--primary-color)',
              border: 'none',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Send size={20} />
          </button>
        </form>
      </div>

      {/* 프리미엄 유도 */}
      <div className="card" style={{ marginTop: '16px', background: 'linear-gradient(90deg, #FDFCFB 0%, #E2D1C3 100%)', border: 'none', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', color: '#555', fontWeight: '600' }}>✨ 프리미엄 코칭으로 더 정밀한 분석을</div>
        <button style={{ color: 'var(--primary-color)', background: 'none', border: 'none', fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>업그레이드 하기 ›</button>
      </div>
    </div>
  );
};

export default AICoachScreen;
