import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AuthStack from './AuthStack';
import MainTab from './MainTab';
import useAuth from '../hooks/useAuth';
import { theme } from '../styles/theme';

/**
 * 루트 네비게이터
 * - 인증 상태에 따라 AuthStack / MainTab 전환
 * - 초기 로딩 중 스플래시 표시
 */
const RootNavigator = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainTab /> : <AuthStack />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
});

export default RootNavigator;
