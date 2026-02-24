import React from 'react';
import { StatusBar } from 'react-native';
import RootNavigator from './src/navigation/index';
import { theme } from './src/styles/theme';

/**
 * murggling 앱 진입점
 * - RootNavigator가 인증 상태에 따라 AuthStack / MainTab 전환
 * - ErrorBoundary는 추후 react-error-boundary 패키지로 추가 가능
 */
const App = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <RootNavigator />
    </>
  );
};

export default App;
