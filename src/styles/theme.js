/**
 * 앱 전체 글로벌 스타일 상수
 * murggling 디자인 시스템
 */
export const theme = {
  colors: {
    primary: '#4CAF82',        // 자연스러운 녹색 (메인)
    accent: '#FF8C42',         // 따뜻한 오렌지 (포인트)
    background: '#FAFAF8',     // 크림색 배경
    text: '#1A1A1A',           // 기본 텍스트
    textSecondary: '#757575',  // 보조 텍스트
    error: '#E53935',          // 오류
    success: '#43A047',        // 성공
    warning: '#FFB300',        // 경고
    white: '#FFFFFF',
  },

  spacing: {
    horizontal: 16,  // 화면 양쪽 패딩 (mobile-ui.md 규칙)
    vertical: 12,    // 수직 패딩
    gap: 12,
  },

  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
    full: 999,
  },

  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    hero: 32,
  },

  shadow: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
  },
};
