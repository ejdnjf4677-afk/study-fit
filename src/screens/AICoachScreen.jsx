import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, TrendingUp, Brain, Heart, Target, AlertTriangle, MessageSquare } from 'lucide-react';
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
    const todayEmotions = emotions.filter(e => new Date(e.timestamp).toLocaleDateString() === today);
    const todayFailures = failures.filter(f => new Date(f.timestamp).toLocaleDateString() === today);
    const todayMins = todayRecords.reduce((acc, r) => acc + r.durationMinutes, 0);
    const totalPauses = todayRecords.reduce((acc, r) => acc + (r.pauseCount || 0), 0);
    const avgPauses = todayRecords.length > 0 ? totalPauses / todayRecords.length : 0;

    // Find most studied subject
    const subjectMins = {};
    records.forEach(r => { subjectMins[r.subject] = (subjectMins[r.subject] || 0) + r.durationMinutes; });
    const topSubject = Object.entries(subjectMins).sort((a, b) => b[1] - a[1])[0]?.[0] || '없음';

    const input = userInput.toLowerCase();

    // 1. 인사 및 격려
    if (input.includes('안녕') || input.includes('반가워')) {
      return `안녕하세요! 오늘 하루도 목표 ${settings.dailyGoal}분 달성을 향해 화이팅입니다. 어떤 부분이 궁금하신가요?`;
    }

    // 2. 집중 및 몰입 관련 심층 분석
    if (input.includes('집중') || input.includes('몰입') || input.includes('산만')) {
      if (avgPauses > 3) return `최근 기록을 분석해보니, 공부 세션 당 평균 중단 횟수가 ${avgPauses.toFixed(1)}회로 다소 높은 편입니다. 백색소음을 '빗소리'로 설정하거나 25분 집중, 5분 휴식하는 '뽀모도로 기법'을 활용해 보세요.`;
      if (todayMins > 120) return `오늘 벌써 ${todayMins}분이나 집중하셨네요! 장시간 집중 후에는 뇌도 휴식이 필요합니다. 15분 정도 산책이나 가벼운 스트레칭을 추천드립니다.`;
      if (records.length === 0) return "아직 공부 기록이 충분하지 않아요. 집중력을 높이려면 공부 시작 전 주변을 정리하고 5분간 명상하는 것이 큰 도움이 됩니다.";
      return `현재 회원님의 주력 과목은 '${topSubject}'(으)로 분석됩니다. 이 과목을 공부할 때 가장 깊이 몰입하는 경향이 있으니, 집중이 안 될 땐 이 과목부터 시작해 워밍업을 해보세요.`;
    }

    // 3. 감정 및 스트레스 분석
    if (input.includes('감정') || input.includes('기분') || input.includes('힘들') || input.includes('스트레스')) {
      const negativeEmotions = emotions.filter(e => ['😫', '😴'].includes(e.emotion));
      if (negativeEmotions.length > 3) return "최근 감정 기록에서 '피곤함'이나 '나쁨'이 자주 관찰됩니다. 번아웃이 올 수 있으니 오늘은 무리한 계획보다는 푹 쉬는 것을 최우선으로 고려해 보세요. 건강이 제일 중요합니다!";
      const positiveEmotions = emotions.filter(e => ['😊', '🤩'].includes(e.emotion));
      if (positiveEmotions.length > 0) return "최근 '보람차다'는 긍정적인 감정을 느끼셨군요! 이럴 때 자신이 공부했던 성과를 되돌아보면 동기부여에 아주 좋습니다.";
      return "학습 후 감정을 꾸준히 기록하면 나의 멘탈 패턴을 알 수 있습니다. 오늘 공부 후에도 꼭 감정 기록을 남겨주세요.";
    }

    // 4. 실패 원인 및 휴식 분석
    if (input.includes('왜 자꾸 쉴까') || input.includes('실패') || input.includes('딴짓') || input.includes('안돼')) {
      const phoneFailures = failures.filter(f => f.reason === '스마트폰');
      const sleepFailures = failures.filter(f => f.reason.includes('졸음') || f.reason.includes('피로'));
      if (phoneFailures.length >= 2) return "분석 결과, 실패 원인 중 '스마트폰'이 가장 큰 비중을 차지하고 있습니다. 내일은 공부 시작 전 스마트폰을 아예 다른 방에 두고 시작해보는 과감한 환경 통제가 필요합니다.";
      if (sleepFailures.length >= 1) return "수면 부족이나 피로가 방해 요소로 기록되었어요. 수면 시간을 일정하게 유지하는 것이 학습 효율의 핵심입니다.";
      return "모든 실패는 더 나은 학습을 위한 데이터입니다. 이전에 작성하신 개선 방안(예: '책상 정리하기')을 내일 가장 먼저 실천해 보세요!";
    }

    // 5. 해결책 제시
    if (input.includes('피곤') || input.includes('졸려') || input.includes('잠와')) {
      return "피로가 누적된 상태에서 억지로 책상에 앉아있는 것은 비효율적입니다. 눈을 감고 10~15분 정도의 파워 낮잠(Power Nap)을 주무시거나, 시원한 물을 한 잔 마시고 오시는 것을 추천합니다.";
    }

    // 6. 보상 및 목표
    if (input.includes('보상') || input.includes('포인트') || input.includes('선물')) {
      const target = 15000;
      if (points >= target) return `현재 ${points.toLocaleString()}P를 획득하셨습니다! 보상 상점에서 원하시는 기프티콘으로 당장 교환하실 수 있어요. 수고 많으셨습니다.`;
      return `현재 ${points.toLocaleString()}P를 보유하고 계십니다. 스타벅스 커피 기프티콘(15,000P)까지 ${(target - points).toLocaleString()}P 남았습니다! 매일 기록을 성실히 남겨 포인트를 모아보세요.`;
    }

    if (input.includes('과목') || input.includes('어떤 거')) {
      if (topSubject !== '없음') return `기록에 따르면 '${topSubject}' 과목에 가장 많은 시간을 투자하고 계시네요. 밸런스를 위해 평소 덜 하던 과목을 오늘 도전해보는 건 어떨까요?`;
    }

    // 7. 기본 분석 (문맥 파악 불가 시)
    if (todayMins === 0) {
      return "아직 오늘의 공부 기록이 없습니다. 완벽하게 하려는 마음을 내려놓고 딱 10분만 일단 시작해보는 건 어떨까요? 시작이 반입니다!";
    }
    const score = calculateConcentrationScore(Math.min(100, (todayMins / settings.dailyGoal) * 100), totalPauses, {
      records: todayRecords,
      emotions: todayEmotions,
      failures: todayFailures
    });
    if (score > 85) return `분석 결과 오늘 집중 점수가 ${score}점으로 상당히 높습니다! 이 좋은 흐름을 유지해서, 평소에 미루던 가장 까다로운 과목을 지금 바로 공략해 보세요.`;
    return `오늘 하루 ${todayMins}분 동안 정말 열심히 하셨습니다. 목표 대비 달성률은 ${(todayMins / settings.dailyGoal * 100).toFixed(1)}% 입니다. 조금만 더 힘내서 목표를 채워볼까요?`;
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
    }, 2500);
  };

  return (
    <div className="screen-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '110px' }}>
      <header style={{ paddingTop: '16px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles color="var(--primary-color)" /> AI 학습 코치
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: '500', marginTop: '4px' }}>데이터 기반 개인 맞춤형 피드백</p>
      </header>

      {/* 분석 대시보드 요약 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div className="card" style={{ margin: 0, padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-color)' }}>
            <Brain size={18} />
            <span style={{ fontSize: '13px', fontWeight: '700' }}>나의 집중 패턴</span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>오전 집중형 ☀️</div>
        </div>
        <div className="card" style={{ margin: 0, padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EB5757' }}>
            <Heart size={18} />
            <span style={{ fontSize: '13px', fontWeight: '700' }}>최근 정서 상태</span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>보람차고 긍정적 😊</div>
        </div>
      </div>

      {/* 채팅 영역 */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', margin: 0, marginBottom: '16px', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingRight: '4px' }} className="hide-scrollbar">
          {chat.length === 0 && (
            <div style={{ textAlign: 'center', margin: 'auto 0', padding: '20px' }}>
              <div style={{ width: '64px', height: '64px', background: 'var(--primary-light)', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Bot size={32} color="var(--primary-color)" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>무엇이든 물어보세요!</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>지금까지의 기록을 분석해서<br />가장 효율적인 학습법을 제안해드릴게요.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['내 집중도는 어때?', '왜 자꾸 쉴까?', '피곤할 땐 어떡해?'].map(q => (
                  <button
                    key={q}
                    onClick={() => { setQuestion(q); }}
                    style={{
                      fontSize: '14px',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      border: '1px solid var(--primary-light)',
                      background: 'white',
                      color: 'var(--primary-color)',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(47,128,237,0.05)'
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chat.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: '12px', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              {msg.role === 'ai' && (
                <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #2F80ED, #56CCF2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(47,128,237,0.2)' }}>
                  <Bot size={20} color="white" />
                </div>
              )}
              <div style={{ maxWidth: '75%', padding: '14px 18px', borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '4px 20px 20px 20px', background: msg.role === 'user' ? 'var(--primary-color)' : 'var(--tertiary-bg)', color: msg.role === 'user' ? 'white' : 'var(--text-primary)', fontSize: '15px', lineHeight: '1.6', fontWeight: msg.role === 'user' ? '500' : '500', boxShadow: msg.role === 'user' ? '0 4px 12px rgba(47,128,237,0.15)' : 'none' }}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', animation: 'fadeIn 0.3s ease' }}>
              <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #2F80ED, #56CCF2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={20} color="white" />
              </div>
              <div style={{ padding: '14px 18px', background: 'var(--tertiary-bg)', borderRadius: '4px 20px 20px 20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div className="typing-dot"></div>
                <div className="typing-dot" style={{ animationDelay: '0.2s' }}></div>
                <div className="typing-dot" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="코치에게 질문하기..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
          style={{
            flex: 1,
            padding: '16px 20px',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            fontSize: '15px',
            outline: 'none',
            background: 'white',
            fontFamily: 'inherit',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
            transition: 'border 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
          onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '20px',
            background: (loading || !question.trim()) ? 'var(--tertiary-bg)' : 'var(--primary-color)',
            border: 'none',
            color: (loading || !question.trim()) ? 'var(--text-tertiary)' : 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: (loading || !question.trim()) ? 'default' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: (loading || !question.trim()) ? 'none' : '0 4px 12px rgba(47,128,237,0.25)'
          }}
        >
          <Send size={22} />
        </button>
      </form>

      <style>{`
        .typing-dot {
          width: 6px;
          height: 6px;
          background: var(--text-tertiary);
          border-radius: 50%;
          animation: typingBounce 1.4s infinite ease-in-out both;
        }
        @keyframes typingBounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default AICoachScreen;
