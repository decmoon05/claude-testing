# murggling 앱 개발 계획서

## 앱 개요
- 이름: murggling
- 대상: 10~30대 식이장애 관련 사용자
- 핵심 철학: 칼로리 강박 대신 '비정제 지수(Natural Food Index)'로 식품의 질 평가
- 플랫폼: React Native (iOS + Android)

## 기술 스택
| 영역 | 기술 |
|------|------|
| 프레임워크 | React Native (Expo 또는 CLI) |
| 백엔드/DB | Firebase (Firestore, Auth, Storage, Functions) |
| 상태관리 | Zustand (전역), 로컬 useState |
| AI | OpenAI GPT-4o mini API (서버사이드 프록시) |
| 이미지 분석 | OpenAI Vision API |
| 중복 방지 | pHash 알고리즘 |
| 바코드 | react-native-vision-camera |
| 네비게이션 | react-navigation v6 |

## 8단계 구현 계획

### STEP 1 - 아키텍처 설계
- 폴더 구조 확정
- Firestore 컬렉션 설계
- 라이브러리 목록 확정

### STEP 2 - Firebase + 인증
- firebase.config.js 초기화
- 이메일/비밀번호 회원가입/로그인
- useAuth 커스텀 훅
- Firestore 보안 규칙

### STEP 3 - 식단 입력 모듈
- 카메라 촬영 + Vision API 인식
- 바코드 스캔 + 식품안전처 API
- 직접 검색 입력
- pHash 중복 방지

### STEP 4 - 비정제 지수 알고리즘
- NOVA 분류 기반 점수 계산
- 한국 발효식품 가중치
- 등급 시각화 컴포넌트

### STEP 5 - AI 코칭 (RAG)
- GPT-4o mini + 강력한 가드레일
- Cloud Function으로 API 키 보호
- 채팅 UI

### STEP 6 - 게이미피케이션
- 경험치/레벨 시스템
- 연속 기록 스트릭
- 홈 대시보드

### STEP 7 - 구독/환급 시스템
- 월 9,900원 구독
- 성실도 기반 환급 (Cloud Function)
- 어뷰징 방지 (서버사이드)

### STEP 8 - 네비게이션 통합
- AuthStack / MainTab 구성
- FCM 푸시 알림
- 글로벌 테마 설정
