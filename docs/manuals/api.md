# API 연동 규칙

## 개요
이 문서는 외부 API 연동 방법과 규칙을 정의합니다.

## 기본 원칙
- 모든 API 호출은 src/services/ 디렉터리에서 관리한다
- API 응답 타입은 반드시 TypeScript 인터페이스로 정의한다
- 네트워크 오류는 반드시 try-catch로 처리한다

## 에러 처리
- HTTP 4xx: 사용자에게 안내 메시지 표시
- HTTP 5xx: 재시도 로직 적용 (최대 3회, 지수 백오프)
- 네트워크 없음: 오프라인 안내 화면 표시

## 인증
- 액세스 토큰은 SecureStore에 저장
- 토큰 만료 시 자동 갱신 처리
- 갱신 실패 시 로그인 화면으로 이동

---

## [필수] Cloud Function 보안 규칙

### 1. 모든 Cloud Function은 Firebase Auth 토큰을 검증해야 한다
```js
const authHeader = req.headers.authorization || '';
const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
if (!idToken) return res.status(401).json({ message: '인증이 필요합니다.' });
const decoded = await admin.auth().verifyIdToken(idToken);
const userId = decoded.uid;
```

### 2. CORS는 `*`를 절대 사용하지 않는다
```js
// 금지: res.set('Access-Control-Allow-Origin', '*');
// 올바른 방법:
const ALLOWED_ORIGINS = ['https://murggling.app'];
if (ALLOWED_ORIGINS.includes(req.headers.origin)) {
  res.set('Access-Control-Allow-Origin', req.headers.origin);
}
```

### 3. 모든 사용자 입력은 길이/타입을 검증한다
```js
if (typeof userMessage !== 'string' || !userMessage.trim()) {
  return res.status(400).json({ message: '메시지가 비어있습니다.' });
}
if (userMessage.length > 1000) {
  return res.status(400).json({ message: '최대 1000자까지 입력 가능합니다.' });
}
```

### 4. AI 엔드포인트에서 conversationHistory는 반드시 역할 필터링을 한다
```js
// system 역할 주입 방지 (프롬프트 인젝션 차단)
const safeHistory = (conversationHistory || [])
  .filter(m => m.role === 'user' || m.role === 'assistant')
  .slice(-10);
```

### 5. Firestore 조회는 반드시 limit()을 사용한다
```js
// 금지: getDocs(query(collection(...), orderBy('timestamp', 'desc')))
// 올바른 방법:
getDocs(query(collection(...), orderBy('timestamp', 'desc'), limit(1)))
```

### 6. 어뷰징 방지 최종 판정은 서버사이드에서만 수행한다
- 클라이언트 검증은 UX 용도로만 사용
- 환급 성실도, 이미지 중복 판정은 Cloud Function에서만

### 7. 대량 작업 시 배치 처리를 사용한다 (100개 단위)
```js
// 금지: await Promise.all(allUsers.map(...))
// 올바른 방법:
const BATCH_SIZE = 100;
for (let i = 0; i < users.length; i += BATCH_SIZE) {
  await Promise.all(users.slice(i, i + BATCH_SIZE).map(async (u) => { ... }));
}
```

### 8. pHash는 Date.now()를 포함하지 않는다
- 이미지 해시는 순수하게 이미지 픽셀 데이터만으로 계산해야 한다
- Date.now() / Math.random() 등 가변 값을 해시 입력에 섞으면 중복 감지가 무력화된다
