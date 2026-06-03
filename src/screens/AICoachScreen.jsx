import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, Brain, Heart, AlertTriangle } from 'lucide-react';
import { getStudyRecords, getEmotionLogs, getFailureLogs, getAppSettings, getUserPoints, loadData, saveData } from '../utils/storage';
import { calculateConcentrationScore } from '../utils/logic';

const AICoachScreen = () => {
  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState(() => loadData('ai_coach_chat', []));
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  useEffect(() => {
    saveData('ai_coach_chat', chat.slice(-30));
  }, [chat]);

  const getStudyContext = () => {
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
    const concentrationScore = todayRecords.length > 0
      ? calculateConcentrationScore(Math.min(100, (todayMins / settings.dailyGoal) * 100), totalPauses, {
          records: todayRecords,
          emotions: todayEmotions,
          failures: todayFailures
        })
      : 0;

    return {
      dailyGoalMinutes: settings.dailyGoal,
      points,
      today: {
        studyMinutes: todayMins,
        sessionCount: todayRecords.length,
        totalPauses,
        avgPauses,
        emotionCount: todayEmotions.length,
        failureCount: todayFailures.length,
        concentrationScore
      },
      allTime: {
        recordCount: records.length,
        topSubject,
        recentEmotions: emotions.slice(-5),
        recentFailures: failures.slice(-5)
      }
    };
  };

  const analyzeData = (userInput) => {
    const context = getStudyContext();
    const input = userInput.toLowerCase();
    const { dailyGoalMinutes, points, today, allTime } = context;

    if (input.includes('핸드폰') || input.includes('휴대폰') || input.includes('폰') || input.includes('스마트폰')) {
      return '핸드폰은 의지로 이기기보다 안 보이게 만드는 게 제일 빨라요. 20분만 방해금지 모드로 두고, 화면을 뒤집어 놓은 다음 첫 문제 하나만 시작해보세요.';
    }

    if (input.includes('안녕') || input.includes('반가워')) {
      return `안녕하세요! 오늘 하루도 목표 ${dailyGoalMinutes}분 달성을 향해 차근차근 가보면 좋겠습니다. 어떤 공부 고민부터 같이 볼까요?`;
    }

    if (input.includes('시험') || input.includes('중간') || input.includes('기말') || input.includes('과제')) {
      return '시험 준비는 범위를 전부 보려 하면 더 막막해져요. 오늘은 자주 틀리는 단원 하나만 고르고, 25분 복습 후 5문제만 풀어보세요. 끝나면 틀린 이유를 한 줄로 남기면 충분합니다.';
    }

    if (input.includes('계획') || input.includes('플랜') || input.includes('루틴') || input.includes('일정')) {
      return '루틴은 거창할수록 오래가기 어려워요. 시작 10분, 핵심 공부 25분, 정리 5분 이렇게 3칸만 잡아보세요. 첫 칸은 쉬워야 진짜 시작됩니다.';
    }

    if (input.includes('졸림') || input.includes('졸려') || input.includes('잠') || input.includes('피곤')) {
      return '졸릴 때는 오래 앉아 있는 것보다 회복이 먼저예요. 물 한 잔 마시고 5분 걷거나, 너무 졸리면 15분만 눈을 붙여보세요. 돌아오면 암기보다 쉬운 문제풀이부터 추천해요.';
    }

    if (input.includes('불안') || input.includes('초조') || input.includes('걱정') || input.includes('멘탈')) {
      return '불안할 땐 목표를 작게 줄이는 게 먼저예요. 지금은 “공부 다 하기” 말고 첫 3분 보기, 1번 문제 읽기처럼 다음 행동 하나만 정해보세요.';
    }

    if (input.includes('실패 원인') || input.includes('실패') || input.includes('망') || input.includes('딴짓') || input.includes('안돼')) {
      return '실패 기록은 혼나는 기록이 아니라 패턴 찾는 기록이에요. 방해 원인을 하나만 고르고, 다음 세션 전에 그 원인을 1단계만 줄여보세요. 예: 알림 끄기, 책상 위 물건 3개 치우기, 목표 15분으로 낮추기.';
    }

    if (input.includes('집중') || input.includes('몰입') || input.includes('산만')) {
      if (today.avgPauses > 3) return `오늘은 세션당 평균 중단 횟수가 ${today.avgPauses.toFixed(1)}회라서, 다음 세션은 25분만 잡고 휴대폰 알림을 먼저 꺼보세요.`;
      if (today.studyMinutes > 120) return `오늘 이미 ${today.studyMinutes}분 공부했어요. 지금은 10분 쉬고 다음 세션 목표를 하나만 정하는 게 좋아 보입니다.`;
      if (allTime.recordCount === 0) return '아직 공부 기록이 충분하지 않아요. 지금은 책상 정리 2분, 타이머 10분, 쉬운 문제 1개로 시작해보세요.';
      return `현재 주력 과목은 '${allTime.topSubject}'로 보여요. 집중이 안 될 땐 이 과목으로 10분 워밍업한 뒤 어려운 과목으로 넘어가보세요.`;
    }

    if (input.includes('감정') || input.includes('기분') || input.includes('힘들') || input.includes('스트레스')) {
      const negativeEmotions = allTime.recentEmotions.filter(e => ['😫', '😴', 'tired', 'anxious', 'sleepy'].includes(e.emotion));
      if (negativeEmotions.length > 3) return "최근 감정 기록에서 '피곤함'이나 '나쁨'이 자주 관찰됩니다. 번아웃이 올 수 있으니 오늘은 무리한 계획보다는 푹 쉬는 것을 최우선으로 고려해 보세요. 건강이 제일 중요합니다!";
      const positiveEmotions = allTime.recentEmotions.filter(e => ['😊', '🤩', 'good', 'focused'].includes(e.emotion));
      if (positiveEmotions.length > 0) return "최근 '보람차다'는 긍정적인 감정을 느끼셨군요! 이럴 때 자신이 공부했던 성과를 되돌아보면 동기부여에 아주 좋습니다.";
      return "학습 후 감정을 꾸준히 기록하면 나의 멘탈 패턴을 알 수 있습니다. 오늘 공부 후에도 꼭 감정 기록을 남겨주세요.";
    }

    if (input.includes('보상') || input.includes('포인트') || input.includes('선물')) {
      const target = 15000;
      if (points >= target) return `현재 ${points.toLocaleString()}P를 획득하셨습니다! 보상 상점에서 원하시는 기프티콘으로 당장 교환하실 수 있어요. 수고 많으셨습니다.`;
      return `현재 ${points.toLocaleString()}P를 보유하고 계십니다. 스타벅스 커피 기프티콘(15,000P)까지 ${(target - points).toLocaleString()}P 남았습니다! 매일 기록을 성실히 남겨 포인트를 모아보세요.`;
    }

    if (input.includes('과목') || input.includes('어떤 거')) {
      if (allTime.topSubject !== '없음') return `기록에 따르면 '${allTime.topSubject}' 과목에 가장 많은 시간을 투자하고 계시네요. 밸런스를 위해 평소 덜 하던 과목을 오늘 도전해보는 건 어떨까요?`;
    }

    if (today.studyMinutes === 0) {
      return "아직 오늘의 공부 기록이 없습니다. 완벽하게 하려는 마음을 내려놓고 딱 10분만 일단 시작해보는 건 어떨까요? 시작이 반입니다!";
    }
    if (today.concentrationScore > 85) return `분석 결과 오늘 집중 점수가 ${today.concentrationScore}점으로 상당히 높습니다. 이 흐름을 유지해서 가장 까다로운 과목을 짧게라도 공략해보세요.`;
    return `오늘 하루 ${today.studyMinutes}분 공부했고 목표 대비 달성률은 ${(today.studyMinutes / dailyGoalMinutes * 100).toFixed(1)}%입니다. 다음 세션은 25분 집중과 5분 휴식으로 작게 이어가보세요.`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userMsg = { role: 'user', text: question };
    const nextChat = [...chat, userMsg];
    setChat(nextChat);
    setQuestion('');
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.text,
          history: chat,
          context: getStudyContext()
        })
      });

      if (!response.ok) {
        throw new Error('AI 코치 서버 응답이 원활하지 않습니다.');
      }

      const data = await response.json();
      if (data.fallback) {
        setErrorMessage('지금은 AI 코치가 임시 모드로 답변 중이에요.');
      }
      setChat(prev => [...prev, { role: 'ai', text: data.reply || analyzeData(userMsg.text) }]);
    } catch (error) {
      console.error(error);
      setErrorMessage('지금은 AI 코치가 임시 모드로 답변 중이에요.');
      setChat(prev => [...prev, { role: 'ai', text: analyzeData(userMsg.text) }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '110px' }}>
      <header style={{ paddingTop: '16px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles color="var(--primary-color)" /> AI 학습 코치
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: '500', marginTop: '4px' }}>데이터 기반 개인 맞춤형 피드백</p>
      </header>

      {errorMessage && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', borderRadius: '14px', background: '#FFF5F5', color: 'var(--error-color)', fontSize: '12px', fontWeight: '700', marginBottom: '12px' }}>
          <AlertTriangle size={16} />
          {errorMessage}
        </div>
      )}

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
