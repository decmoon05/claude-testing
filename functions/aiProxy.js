/**
 * Firebase Cloud Function: AI 코치 프록시
 * OpenAI API 키를 서버사이드에서 보호
 * 강력한 가드레일 System Prompt 적용
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: functions.config().openai.key });

// api.md §2: 허용 도메인만 CORS 허용
const ALLOWED_ORIGINS = ['https://murggling.app'];

const setCorsHeaders = (req, res) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

// 식이장애 앱용 강력한 가드레일 System Prompt
const SYSTEM_PROMPT = `당신은 murggling 앱의 식단 관리 보조 AI입니다.

【절대 원칙】
1. 치료나 진단을 하지 않습니다. "전문가 상담을 권장합니다"라고 안내합니다.
2. 반드시 제공된 지식 베이스 내의 정보만 바탕으로 답변합니다.
3. 거식증, 폭식증 등 식이장애를 조장하거나 극단적 식이 제한을 권유하지 않습니다.
4. 칼로리 계산 강박을 유발하는 답변을 하지 않습니다.
5. 특정 식품을 "나쁜 음식"으로 단정하지 않습니다.
6. 사용자가 자해, 극단적 다이어트, 정신건강 위기를 언급하면 즉시 전문가 상담을 권유합니다.

【답변 원칙】
- 비정제 지수(NOVA 분류) 기반으로 식품의 질을 설명합니다.
- "대신 이런 식품은 어떨까요?" 방식의 긍정적 제안을 합니다.
- 한국 식문화와 발효식품의 건강 이점을 적극 설명합니다.
- 따뜻하고 격려하는 말투를 사용합니다.`;

exports.aiCoach = functions.https.onRequest(async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  // api.md §1: Firebase Auth 토큰 검증
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!idToken) return res.status(401).json({ message: '인증이 필요합니다.' });

  let userId;
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ message: '유효하지 않은 인증 토큰입니다.' });
  }

  const { userMessage, dietContext, userContext, conversationHistory, stream } = req.body;

  // api.md §3: 입력 길이/타입 검증
  if (typeof userMessage !== 'string' || !userMessage.trim()) {
    return res.status(400).json({ message: '메시지가 비어있습니다.' });
  }
  if (userMessage.length > 1000) {
    return res.status(400).json({ message: '최대 1000자까지 입력 가능합니다.' });
  }

  // api.md §4: conversationHistory에서 system 역할 필터링 (프롬프트 인젝션 차단)
  const safeHistory = (Array.isArray(conversationHistory) ? conversationHistory : [])
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .slice(-10);

  const contextBlock = [dietContext, userContext].filter(Boolean).join('\n');
  const systemWithContext = contextBlock
    ? `${SYSTEM_PROMPT}\n\n【현재 사용자 컨텍스트】\n${contextBlock}`
    : SYSTEM_PROMPT;

  const messages = [
    { role: 'system', content: systemWithContext },
    ...safeHistory,
    { role: 'user', content: userMessage },
  ];

  try {
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');

      const streamResp = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 600,
        temperature: 0.7,
        stream: true,
      });

      for await (const chunk of streamResp) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 600,
      temperature: 0.7,
    });

    return res.json({ message: completion.choices[0].message.content });
  } catch (error) {
    // 오류 상세는 서버 로그에만 기록, 클라이언트에는 일반 메시지만 반환
    functions.logger.error('OpenAI error', { userId, error: error.message });
    return res.status(500).json({ message: 'AI 서비스 연결에 실패했습니다.' });
  }
});
