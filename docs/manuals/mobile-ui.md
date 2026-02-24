# 모바일 UI 규칙

## 개요
이 문서는 모바일 앱의 UI 컴포넌트 작성 규칙을 정의합니다.

## 레이아웃 규칙
- 모든 화면은 SafeAreaView를 최상위 컨테이너로 사용한다
- 터치 가능한 요소의 최소 크기는 44x44pt 이상이어야 한다
- 화면 간 일관된 padding: 수평 16px, 수직 12px 기본 적용

## 컴포넌트 규칙
- 공통 컴포넌트는 src/components/ 에 위치
- 화면별 컴포넌트는 src/screens/[화면명]/components/ 에 위치
- 스타일은 StyleSheet.create()를 사용하여 컴포넌트 하단에 정의

## 접근성
- 모든 이미지에 accessibilityLabel 추가
- 중요 동작 버튼에 accessibilityHint 추가
