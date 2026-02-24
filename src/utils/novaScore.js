/**
 * 비정제 지수(Natural Food Index) 알고리즘
 * NOVA 분류 체계 기반 + 한국 발효식품 가중치
 */

// ─── NOVA 등급 점수표 ───────────────────────────────────────────────
const NOVA_BASE_SCORES = { 1: 100, 2: 70, 3: 40, 4: 10 };

// ─── 한국 발효식품 보너스 목록 ────────────────────────────────────────
const FERMENTED_FOODS = ['김치', '된장', '청국장', '간장', '고추장', '막걸리', '식혜', '젓갈', '도라지', '나토'];

// ─── 내장 식품 데이터베이스 (NOVA 등급 포함) ─────────────────────────
export const FOOD_DATABASE = [
  // NOVA 1 (비가공/최소가공)
  { name: '현미밥', novaGrade: 1, macros: { carb: 38, protein: 3, fat: 0.5, calories: 170 } },
  { name: '백미밥', novaGrade: 2, macros: { carb: 40, protein: 3, fat: 0.3, calories: 168 } },
  { name: '잡곡밥', novaGrade: 1, macros: { carb: 37, protein: 3.5, fat: 0.8, calories: 165 } },
  { name: '닭가슴살', novaGrade: 1, macros: { carb: 0, protein: 23, fat: 1.2, calories: 109 } },
  { name: '연어', novaGrade: 1, macros: { carb: 0, protein: 20, fat: 12, calories: 182 } },
  { name: '삶은달걀', novaGrade: 1, macros: { carb: 0.6, protein: 13, fat: 11, calories: 155 } },
  { name: '두부', novaGrade: 1, macros: { carb: 2, protein: 8, fat: 4, calories: 76 } },
  { name: '브로콜리', novaGrade: 1, macros: { carb: 7, protein: 3, fat: 0.4, calories: 34 } },
  { name: '고구마', novaGrade: 1, macros: { carb: 20, protein: 1.6, fat: 0.1, calories: 90 } },
  { name: '바나나', novaGrade: 1, macros: { carb: 23, protein: 1.1, fat: 0.3, calories: 89 } },
  // NOVA 2 (조리용 재료)
  { name: '올리브오일', novaGrade: 2, macros: { carb: 0, protein: 0, fat: 14, calories: 120 } },
  { name: '소금', novaGrade: 2, macros: { carb: 0, protein: 0, fat: 0, calories: 0 } },
  // 발효식품 (NOVA 2이지만 보너스)
  { name: '김치', novaGrade: 2, macros: { carb: 3, protein: 1.5, fat: 0.5, calories: 15 }, fermented: true },
  { name: '된장', novaGrade: 2, macros: { carb: 9, protein: 9, fat: 3, calories: 85 }, fermented: true },
  { name: '청국장', novaGrade: 2, macros: { carb: 5, protein: 11, fat: 4, calories: 90 }, fermented: true },
  // NOVA 3 (가공식품)
  { name: '치즈', novaGrade: 3, macros: { carb: 1.3, protein: 25, fat: 33, calories: 400 } },
  { name: '참치캔', novaGrade: 3, macros: { carb: 0, protein: 25, fat: 8, calories: 180 } },
  { name: '고추장', novaGrade: 3, macros: { carb: 15, protein: 3, fat: 1, calories: 50 }, fermented: true },
  // NOVA 4 (초가공식품)
  { name: '라면', novaGrade: 4, macros: { carb: 60, protein: 9, fat: 15, calories: 415, sodium: 1700, transFat: 0.5 } },
  { name: '과자', novaGrade: 4, macros: { carb: 65, protein: 4, fat: 20, calories: 450, sugar: 20 } },
  { name: '탄산음료', novaGrade: 4, macros: { carb: 35, protein: 0, fat: 0, calories: 140, sugar: 35 } },
  { name: '햄버거', novaGrade: 4, macros: { carb: 43, protein: 17, fat: 20, calories: 420, sodium: 800 } },
];

// ─── 핵심 점수 계산 함수들 ────────────────────────────────────────────

/**
 * 1) 비정제도 점수 (NOVA 등급 기반 + 발효 보너스)
 * @param {number} novaGrade - 1~4
 * @param {boolean} isFermented
 * @returns {number} 0~100
 */
export const computeNovaScore = (novaGrade, isFermented = false) => {
  const base = NOVA_BASE_SCORES[novaGrade] ?? 10;
  const bonus = isFermented ? 15 : 0;
  return Math.min(100, base + bonus);
};

/**
 * 2) 영양균형 점수 (탄:단:지 = 5:2:3 권장 비율 근접도)
 * @param {{ carb, protein, fat }} macros
 * @returns {number} 0~100
 */
export const computeNutritionBalanceScore = ({ carb, protein, fat }) => {
  const total = carb + protein + fat;
  if (total === 0) return 50;

  const actualCarb = carb / total;
  const actualProtein = protein / total;
  const actualFat = fat / total;

  const IDEAL = { carb: 0.5, protein: 0.2, fat: 0.3 };
  const deviation =
    Math.abs(actualCarb - IDEAL.carb) +
    Math.abs(actualProtein - IDEAL.protein) +
    Math.abs(actualFat - IDEAL.fat);

  // deviation 0 = 100점, deviation 1.0+ = 0점
  return Math.max(0, Math.round(100 - deviation * 100));
};

/**
 * 3) 페널티 점수
 * @param {{ sodium, sugar, transFat }} macros
 * @returns {number} 0~100 (높을수록 나쁨 → 최종 계산 시 차감)
 */
export const computePenaltyScore = ({ sodium = 0, sugar = 0, transFat = 0 }) => {
  let penalty = 0;
  if (sodium > 600) penalty += 30;        // 나트륨 600mg 초과
  else if (sodium > 300) penalty += 15;
  if (sugar > 25) penalty += 30;           // 당류 25g 초과
  else if (sugar > 12) penalty += 15;
  if (transFat > 0.5) penalty += 40;       // 트랜스지방 0.5g 초과
  return Math.min(100, penalty);
};

/**
 * 4) 식품 단건 최종 점수
 * = (비정제도 × 0.5) + (영양균형 × 0.3) - (페널티 × 0.2)
 */
export const computeSingleFoodScore = (food) => {
  const isFermented = FERMENTED_FOODS.some((f) => food.name.includes(f)) || food.fermented;
  const novaScore = computeNovaScore(food.novaGrade, isFermented);
  const balanceScore = food.macros ? computeNutritionBalanceScore(food.macros) : 70;
  const penaltyScore = food.macros ? computePenaltyScore(food.macros) : 0;

  return Math.round(novaScore * 0.5 + balanceScore * 0.3 - penaltyScore * 0.2);
};

/**
 * 5) 한 끼 식단 전체 점수 (items 배열의 가중 평균)
 * @param {Array<{ name, novaGrade, macros, portion }>} items
 * @returns {number} 0~100
 */
export const calculateMealScore = (items) => {
  if (!items || items.length === 0) return 0;

  // 데이터베이스에서 상세 정보 보완
  const enriched = items.map((item) => {
    const dbEntry = FOOD_DATABASE.find((f) => f.name === item.name);
    return dbEntry ? { ...dbEntry, ...item } : item;
  });

  const totalPortion = enriched.reduce((sum, item) => sum + (item.portion || 1), 0);
  const weightedScore = enriched.reduce((sum, item) => {
    const score = computeSingleFoodScore(item);
    return sum + score * (item.portion || 1);
  }, 0);

  return Math.round(weightedScore / totalPortion);
};

/**
 * 6) 점수 → 등급 변환
 */
export const scoreToGrade = (score) => {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'D';
};

/**
 * 점수가 낮은 원인 분석 (항목별 피드백)
 */
export const analyzeScoreFactors = (items) => {
  const factors = [];

  items.forEach((item) => {
    const dbEntry = FOOD_DATABASE.find((f) => f.name === item.name);
    if (!dbEntry) return;

    if (dbEntry.novaGrade === 4) {
      factors.push({ item: item.name, reason: `초가공식품(NOVA 4단계)`, impact: -20 });
    }
    if (dbEntry.macros?.sodium > 600) {
      factors.push({ item: item.name, reason: '나트륨 과다', impact: -15 });
    }
    if (dbEntry.macros?.sugar > 25) {
      factors.push({ item: item.name, reason: '당류 과다', impact: -15 });
    }
    if (dbEntry.macros?.transFat > 0.5) {
      factors.push({ item: item.name, reason: '트랜스지방 포함', impact: -20 });
    }
  });

  return factors.sort((a, b) => a.impact - b.impact);
};

/**
 * 이미지 콘텐츠 기반 해시 계산
 * - 실제 배포 시 react-native-image-hash 라이브러리의 pHash로 교체한다
 * - Date.now() / Math.random() 등 가변 값을 절대 섞지 않는다 (api.md §8 참고)
 * @param {string} imageUri - 로컬 이미지 URI
 * @returns {string} 이미지 콘텐츠 기반 해시값
 */
export const computeImageHash = async (imageUri) => {
  try {
    // 이미지 파일을 바이너리로 읽어 해시 계산 (콘텐츠 기반 → 동일 이미지 = 동일 해시)
    const response = await fetch(imageUri);
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // djb2 해시: 이미지 픽셀 데이터만 입력 (가변값 없음)
    let hash = 5381;
    for (let i = 0; i < bytes.length; i++) {
      hash = ((hash << 5) + hash) ^ bytes[i];
      hash |= 0; // 32bit 정수 유지
    }
    return Math.abs(hash).toString(16);
  } catch {
    // 해시 계산 실패 시 null 반환 → 중복 체크 건너뜀 (saveMealEntry에서 처리)
    return null;
  }
};
