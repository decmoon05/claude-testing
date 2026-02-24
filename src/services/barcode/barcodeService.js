/**
 * 바코드 스캔 → 한국 식품안전처 오픈 API 연동
 * API: https://various.foodsafetykorea.go.kr/nutrient
 */

const FOOD_SAFETY_API_KEY = process.env.FOOD_SAFETY_API_KEY;
const FOOD_SAFETY_BASE_URL = 'https://various.foodsafetykorea.go.kr/api';

/**
 * 바코드 번호로 식품 영양성분 조회
 * @param {string} barcode - 바코드 번호
 * @returns {{ name, manufacturer, macros: { carb, protein, fat, calories }, novaGrade }}
 */
export const fetchFoodByBarcode = async (barcode) => {
  const url = `${FOOD_SAFETY_BASE_URL}/${FOOD_SAFETY_API_KEY}/C005/json/1/5/BARCODE_NO=${barcode}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('식품 정보를 불러오지 못했습니다.');

  const data = await response.json();
  const items = data?.C005?.row;

  if (!items || items.length === 0) {
    throw new Error('등록되지 않은 바코드입니다.');
  }

  const item = items[0];
  return parseFoodSafetyItem(item);
};

/**
 * 식품안전처 API 응답을 앱 내부 형식으로 변환
 */
const parseFoodSafetyItem = (item) => ({
  name: item.PRDLST_NM || '알 수 없는 식품',
  manufacturer: item.BSSH_NM || '',
  barcode: item.BARCODE_NO,
  macros: {
    calories: parseFloat(item.NUTR_CONT1) || 0,   // 열량 (kcal)
    carb: parseFloat(item.NUTR_CONT2) || 0,         // 탄수화물 (g)
    protein: parseFloat(item.NUTR_CONT3) || 0,      // 단백질 (g)
    fat: parseFloat(item.NUTR_CONT4) || 0,           // 지방 (g)
    sodium: parseFloat(item.NUTR_CONT5) || 0,        // 나트륨 (mg)
    sugar: parseFloat(item.NUTR_CONT6) || 0,         // 당류 (g)
    transFat: parseFloat(item.NUTR_CONT7) || 0,      // 트랜스지방 (g)
    saturatedFat: parseFloat(item.NUTR_CONT8) || 0,  // 포화지방 (g)
  },
  servingSize: parseFloat(item.SERVING_SIZE) || 100,
  novaGrade: null, // 바코드 조회 시 NOVA 등급은 별도 추론 필요
});

/**
 * 재시도 로직이 포함된 바코드 조회 (api.md 가이드라인 준수)
 * 최대 3회, 지수 백오프
 */
export const fetchFoodByBarcodeWithRetry = async (barcode, maxRetries = 3) => {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetchFoodByBarcode(barcode);
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  throw lastError;
};
