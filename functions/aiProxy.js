/**
 * Firebase Cloud Function: AI 코치 프록시
 * OpenAI API 키를 서버사이드에서 보호
 * 강력한 가드레일 System Prompt 적용
 */
const functions = require('firebase-functions');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: functions.config().openai.key });

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
  // CORS 헤더
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }

  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { userMessage, dietContext, userContext, conversationHistory = [], stream } = req.body;

  if (!userMessage) return res.status(400).json({ message: '메시지가 비어있습니다.' });

  // 컨텍스트 주입
  const contextBlock = [dietContext, userContext].filter(Boolean).join('\n');
  const systemWithContext = contextBlock
    ? `${SYSTEM_PROMPT}\n\n【현재 사용자 컨텍스트】\n${contextBlock}`
    : SYSTEM_PROMPT;

  const messages = [
    { role: 'system', content: systemWithContext },
    ...conversationHistory,
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
    console.error('OpenAI error:', error);
    return res.status(500).json({ message: 'AI 서비스 연결에 실패했습니다.' });
  }
});
