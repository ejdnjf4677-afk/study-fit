import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
당신은 스터디핏 앱의 친절한 AI 공부 코치입니다.
사용자의 공부 고민, 집중력 문제, 공부 루틴, 실패 원인, 감정 기록을 바탕으로 현실적인 조언을 해주세요.
답변은 한국어로 하고, 따뜻하지만 과장하지 말고, 바로 실천 가능한 행동 2~4개를 포함하세요.
의학적/정신건강 위기처럼 보이는 내용은 전문가나 주변 도움을 권하고, 앱의 점수나 기록을 벌처럼 표현하지 마세요.
`;

const createFallbackReply = (message = '', context = {}) => {
  const input = message.toLowerCase();
  const today = context.today || {};
  const minutes = today.studyMinutes || 0;
  const pauses = today.totalPauses || 0;

  if (input.includes('핸드폰') || input.includes('휴대폰') || input.includes('폰') || input.includes('스마트폰')) {
    return '지금은 임시 코치 모드로 답할게요. 핸드폰이 신경 쓰이면 의지로 버티기보다 환경을 바꾸는 게 빨라요. 20분만 방해금지 모드로 두고, 화면이 안 보이게 뒤집어 놓은 뒤 첫 문제 하나만 시작해보세요.';
  }

  if (input.includes('시험') || input.includes('중간') || input.includes('기말') || input.includes('과제')) {
    return '시험 앞에서는 범위를 전부 보려 하면 더 막막해져요. 오늘은 “가장 자주 틀리는 단원 1개”만 고르고, 25분 복습 후 5문제만 풀어보세요. 끝나면 틀린 이유를 한 줄로 남기면 내일 훨씬 편해집니다.';
  }

  if (input.includes('계획') || input.includes('플랜') || input.includes('루틴') || input.includes('일정')) {
    return '계획은 촘촘할수록 쉽게 무너져요. 오늘은 3칸만 잡아보세요: 시작 10분, 핵심 공부 25분, 정리 5분. 특히 첫 칸은 너무 쉬워야 실제로 시작할 확률이 높아집니다.';
  }

  if (input.includes('졸림') || input.includes('졸려') || input.includes('잠') || input.includes('피곤')) {
    return '졸릴 때는 억지로 오래 앉아 있어도 효율이 잘 안 나와요. 물 한 잔 마시고 5분만 걷거나, 정말 졸리면 15분 타이머로 짧게 눈을 붙여보세요. 돌아오면 암기보다 쉬운 문제풀이부터 시작하는 게 좋아요.';
  }

  if (input.includes('불안') || input.includes('초조') || input.includes('걱정') || input.includes('멘탈')) {
    return '불안할 땐 공부량보다 “다음 행동”을 작게 만드는 게 먼저예요. 지금 할 일은 딱 하나만 정해보세요. 예를 들면 강의 1개가 아니라 첫 3분 보기, 문제집 한 장이 아니라 1번 문제 읽기처럼요.';
  }

  if (input.includes('실패') || input.includes('망') || input.includes('안돼') || input.includes('딴짓')) {
    return '실패 기록은 혼나는 기록이 아니라 패턴 찾는 기록이에요. 오늘 방해 원인을 하나만 고르고, 다음 세션 전에 그 원인을 1단계만 줄여보세요. 예: 알림 끄기, 책상 위 물건 3개 치우기, 목표를 15분으로 낮추기.';
  }

  if (input.includes('집중') || input.includes('몰입') || input.includes('산만')) {
    return `임시 코치 모드로 답할게요. 오늘 공부 시간은 ${minutes}분, 중단은 ${pauses}회로 기록돼 있어요. 지금은 20분 집중보다 “시작 3분”이 더 중요합니다. 타이머를 켜고 가장 쉬운 부분부터 손을 대보세요.`;
  }

  return '지금은 임시 코치 모드로 짧게 답할게요. 고민을 크게 해결하려 하기보다 다음 10분만 정해보세요. 책 펴기, 문제 1개 읽기, 강의 3분 보기처럼 작게 시작하면 흐름이 훨씬 쉽게 생깁니다.';
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'POST 요청만 지원합니다.' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY가 서버 환경변수에 설정되지 않았습니다.' });
  }

  try {
    const { message, history = [], context = {} } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message 값이 필요합니다.' });
    }

    const recentHistory = Array.isArray(history) ? history.slice(-8) : [];
    const historyText = recentHistory
      .map(item => `${item.role === 'user' ? '사용자' : '코치'}: ${item.text}`)
      .join('\n');

    const response = await client.responses.create({
      model: 'gpt-4.1-mini',
      instructions: SYSTEM_PROMPT,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `
사용자 질문:
${message}

최근 채팅:
${historyText || '없음'}

앱 기록 요약:
${JSON.stringify(context, null, 2)}
`,
            },
          ],
        },
      ],
      max_output_tokens: 700,
    });

    return res.status(200).json({
      reply: response.output_text || createFallbackReply(message, context),
      fallback: !response.output_text,
    });
  } catch (error) {
    console.error('AI coach error:', error);
    const isRateLimited = error?.status === 429 || error?.code === 'rate_limit_exceeded';

    return res.status(200).json({
      reply: createFallbackReply(req.body?.message, req.body?.context),
      fallback: true,
      reason: isRateLimited ? 'temporary_limit' : 'temporary_error',
    });
  }
}
