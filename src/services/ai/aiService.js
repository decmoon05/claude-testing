/**
 * AI 코칭 서비스 (Cloud Function 프록시 경유)
 * OpenAI API 키는 절대 클라이언트에 노출하지 않음
 */

const AI_PROXY_URL = process.env.CLOUD_FUNCTION_BASE_URL + '/aiCoach';

/**
 * 오늘의 식단 데이터를 프롬프트용 텍스트로 변환
 * @param {Array} mealEntries - 오늘 식단 기록 배열
 * @returns {string}
 */
export const buildDietContext = (mealEntries) => {
  if (!mealEntries || mealEntries.length === 0) {
    return '오늘 아직 식단 기록이 없습니다.';
  }

  const lines = mealEntries.map((entry, i) => {
    const items = entry.items?.map((item) => `${item.name}(NOVA ${item.novaGrade ?? '?'})`).join(', ');
    return `${i + 1}끼: ${items} | 비정제지수 ${entry.totalScore ?? '?'}점`;
  });

  return `오늘의 식단:\n${lines.join('\n')}`;
};

/**
 * 사용자 건강 우려사항을 프롬프트용 텍스트로 변환
 */
export const buildUserContext = (profile) => {
  if (!profile?.healthInfo?.concerns?.length) return '';
  return `사용자 건강 우려사항: ${profile.healthInfo.concerns.join(', ')}`;
};

/**
 * AI 코치에게 메시지 전송 (스트리밍 지원)
 * @param {{ userMessage, dietContext, userContext, conversationHistory }} params
 * @param {function} onChunk - 스트리밍 청크 콜백 (text) => void
 * @returns {string} 전체 응답 텍스트
 */
export const sendMessageToCoach = async (
  { userMessage, dietContext, userContext, conversationHistory = [] },
  onChunk
) => {
  const response = await fetch(AI_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userMessage,
      dietContext,
      userContext,
      conversationHistory: conversationHistory.slice(-10), // 최근 10턴만 전송
      stream: !!onChunk,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'AI 코치 연결에 실패했습니다.');
  }

  if (onChunk && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));
      for (const line of lines) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.content) {
            fullText += data.content;
            onChunk(data.content);
          }
        } catch {}
      }
    }
    return fullText;
  }

  const data = await response.json();
  return data.message;
};
