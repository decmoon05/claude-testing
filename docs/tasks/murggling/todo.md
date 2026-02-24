# murggling 개발 체크리스트

## STEP 1 - 아키텍처 설계
- [x] 폴더 구조 생성
- [x] plan.md 작성
- [x] context.md 작성

## STEP 2 - Firebase + 인증
- [ ] src/config/firebase.config.js
- [ ] src/services/firebase/auth.js
- [ ] src/store/authStore.js
- [ ] src/hooks/useAuth.js
- [ ] src/screens/auth/LoginScreen.js
- [ ] src/screens/auth/RegisterScreen.js
- [ ] firestore.rules

## STEP 3 - 식단 입력
- [ ] src/services/vision/visionService.js
- [ ] src/services/barcode/barcodeService.js
- [ ] src/services/firebase/mealService.js
- [ ] src/hooks/useMealInput.js
- [ ] src/components/meal/CameraInput.js
- [ ] src/components/meal/BarcodeInput.js
- [ ] src/components/meal/ManualInput.js
- [ ] src/screens/meal/MealInputScreen.js

## STEP 4 - 비정제 지수
- [ ] src/utils/novaScore.js
- [ ] src/services/firebase/scoreService.js
- [ ] src/components/score/ScoreGauge.js
- [ ] src/components/score/ScoreBreakdown.js

## STEP 5 - AI 코칭
- [ ] src/services/ai/aiService.js
- [ ] src/screens/coaching/CoachingScreen.js
- [ ] src/components/coaching/ChatBubble.js
- [ ] functions/aiProxy.js

## STEP 6 - 게이미피케이션
- [ ] src/utils/gamification.js
- [ ] src/hooks/useCharacter.js
- [ ] src/store/characterStore.js
- [ ] src/screens/home/HomeScreen.js
- [ ] src/components/character/CharacterView.js

## STEP 7 - 구독/환급
- [ ] src/hooks/useSubscription.js
- [ ] src/screens/mypage/SubscriptionScreen.js
- [ ] src/components/subscription/RefundStatus.js
- [ ] functions/monthlyRefund.js

## STEP 8 - 네비게이션 통합
- [ ] src/styles/theme.js
- [ ] src/navigation/AuthStack.js
- [ ] src/navigation/MainTab.js
- [ ] src/navigation/index.js
- [ ] src/components/navigation/TabBar.js
- [ ] functions/notifications.js
- [ ] functions/index.js
- [ ] App.js
- [ ] package.json
- [ ] .env.example
