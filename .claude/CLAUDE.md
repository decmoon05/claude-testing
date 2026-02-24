# 프로젝트 규칙

## 필독 매뉴얼 목차
- 모바일 UI 규칙 → docs/manuals/mobile-ui.md
- API 연동 규칙 → docs/manuals/api.md
- 상태관리 규칙 → docs/manuals/state.md
- 보안 규칙 → docs/manuals/security.md

## 작업 시작 전 반드시 할 것
1. 관련 매뉴얼 챕터를 **모두** 읽어라 (건너뛰지 마라)
2. docs/tasks/ 폴더에 현재 진행 중인 작업 문서가 있으면 읽어라
3. docs/tasks/[기능명]/ 아래 plan.md / context.md / todo.md 3문서를 먼저 작성하라
4. 계획을 나에게 보여주고 **명시적 승인**을 받아라
5. 승인 전에는 코드를 단 한 줄도 작성하지 마라

## 작업 완료 후 반드시 할 것 (순서대로)
1. 수정한 파일 목록을 나열하라
2. 에러 처리를 빠뜨린 곳은 없는가 확인하라
3. **보안 체크리스트를 실행하라** (docs/manuals/security.md 참고):
   - [ ] 외부 API 호출 시 인증 토큰 검증 있는가?
   - [ ] 사용자 입력에 길이/타입 검증 있는가?
   - [ ] CORS가 `*`로 열려있지 않은가?
   - [ ] API 키/시크릿이 클라이언트 코드에 없는가?
   - [ ] Firestore 읽기에 불필요한 전체 조회가 없는가?
4. `/project:review` 커맨드를 실행하여 코드 리뷰를 받아라 ← **생략 금지**
5. 리뷰에서 "수정 필요" 판정이 나오면 수정 후 다시 리뷰하라
6. 체크리스트(todo.md)를 업데이트하라

## 상기사항
- 사용자가 상세한 요구사항을 줬더라도 3문서 작성 → 계획 승인 → 구현 순서를 지켜라
- quality_check.py는 .ts/.tsx/.js/.jsx 모두 검사한다. 경고가 뜨면 무조건 수정하라
- Cloud Function은 반드시 Firebase Auth 토큰 검증을 포함해야 한다
