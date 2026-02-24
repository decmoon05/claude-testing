# murggling 개발 컨텍스트

## 핵심 결정 사항

### 왜 Zustand인가?
- 상태관리 매뉴얼(state.md)에 따라 전역 상태는 Zustand 사용
- Redux Toolkit보다 보일러플레이트 적음
- 식이장애 앱 특성상 상태 단순성이 중요

### 왜 Cloud Function으로 AI 프록시인가?
- OpenAI API 키를 클라이언트에 노출하지 않기 위함
- 서버사이드에서 가드레일 시스템 프롬프트 강제 적용
- 요청 속도 제한(rate limiting) 적용 가능

### 왜 pHash + EXIF인가?
- 구독료 환급 시스템의 어뷰징 방지 필수 요소
- 동일 사진을 여러 번 제출하는 행위 차단
- 촬영 시간 조작 방지

### Firestore 컬렉션 설계 이유
- users/{uid} : 프로필 + 캐릭터 + 구독 통합 (조회 효율)
- meals/{uid}/entries/{mealId} : 사용자별 서브컬렉션 (보안 규칙 적용 용이)
- coaching/{uid}/conversations/{convId} : 대화 분리 저장 (개인정보)

## 참고 파일 위치
- 모바일 UI 규칙: docs/manuals/mobile-ui.md
- API 연동 규칙: docs/manuals/api.md
- 상태관리 규칙: docs/manuals/state.md

## 주의사항
- 건강 정보(healthInfo)는 민감 데이터 → Firestore 보안 규칙으로 본인만 접근
- AI 응답에서 식이장애 조장 내용 절대 금지 (System Prompt 가드레일)
- 환급 성실도 계산은 반드시 서버(Cloud Function)에서만 수행
