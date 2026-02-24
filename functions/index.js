/**
 * Firebase Cloud Functions 진입점
 * 모든 함수 모듈을 여기서 익스포트
 */
const admin = require('firebase-admin');
admin.initializeApp();

const { aiCoach } = require('./aiProxy');
const { monthlyRefundCalculation } = require('./monthlyRefund');
const { dailyMealReminder } = require('./notifications');

// Vision API 프록시 (음식 이미지 분석)
const functions = require('firebase-functions');
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: functions.config().openai.key });

exports.aiCoach = aiCoach;
exports.monthlyRefundCalculation = monthlyRefundCalculation;
exports.dailyMealReminder = dailyMealReminder;

/**
 * 음식 이미지 분석 프록시
 */
exports.analyzeFood = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }

  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ message: '이미지가 없습니다.' });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '이 이미지에서 음식을 인식해주세요. 음식 이름만 한국어로 JSON 배열 형식으로 반환하세요. 예: {"foods": ["밥", "김치", "된장국"]}',
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
          ],
        },
      ],
      max_tokens: 200,
    });

    const text = response.choices[0].message.content;
    const parsed = JSON.parse(text.match(/\{.*\}/s)?.[0] || '{"foods":[]}');
    return res.json(parsed);
  } catch (error) {
    console.error('Vision error:', error);
    return res.status(500).json({ message: '이미지 분석에 실패했습니다.' });
  }
});
