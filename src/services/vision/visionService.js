/**
 * OpenAI Vision API를 이용한 음식 이미지 인식 서비스
 * API 키는 Cloud Function 프록시를 통해 서버사이드에서 처리
 */

const VISION_PROXY_URL = process.env.CLOUD_FUNCTION_BASE_URL + '/analyzeFood';

/**
 * 음식 이미지를 base64로 변환
 */
export const imageToBase64 = async (imageUri) => {
  const response = await fetch(imageUri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * 이미지에서 음식 인식 (Cloud Function 프록시 경유)
 * @param {string} imageUri - 로컬 이미지 URI
 * @returns {{ foods: string[], confidence: number, rawResponse: string }}
 */
export const recognizeFoodFromImage = async (imageUri) => {
  const base64 = await imageToBase64(imageUri);

  const response = await fetch(VISION_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64 }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || '음식 인식에 실패했습니다.');
  }

  return response.json();
};

/**
 * 인식된 음식명에 대한 세부 선택지 반환
 * 예: "밥" → ["백미밥", "현미밥", "곤약밥", "잡곡밥"]
 */
export const getFoodVariants = (foodName) => {
  const VARIANTS_MAP = {
    밥: ['백미밥', '현미밥', '곤약밥', '잡곡밥', '보리밥'],
    빵: ['통밀빵', '흰빵', '바게트', '크로아상', '호밀빵'],
    면: ['통밀면', '일반면', '쌀국수면', '곤약면'],
    고기: ['닭가슴살', '삼겹살', '소고기', '돼지고기', '오리고기'],
    생선: ['연어', '고등어', '참치', '갈치', '조기'],
    두부: ['순두부', '연두부', '단단한두부'],
    달걀: ['삶은달걀', '스크램블', '후라이'],
  };

  for (const [key, variants] of Object.entries(VARIANTS_MAP)) {
    if (foodName.includes(key)) return variants;
  }
  return null; // 세부 선택지 없음 → 그대로 사용
};
