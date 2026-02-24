import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/home/HomeScreen';
import MealInputScreen from '../screens/meal/MealInputScreen';
import CoachingScreen from '../screens/coaching/CoachingScreen';
import SubscriptionScreen from '../screens/mypage/SubscriptionScreen';
import TabBar from '../components/navigation/TabBar';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 마이페이지 스택 (SubscriptionScreen 포함)
const MyPageStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="MyPageMain" component={SubscriptionScreen} options={{ title: 'MY' }} />
  </Stack.Navigator>
);

// 식단 목록 (플레이스홀더 — 실제 구현 시 MealListScreen 교체)
const MealListPlaceholder = () => null;

const MainTab = () => (
  <Tab.Navigator
    tabBar={(props) => <TabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="MealList" component={MealListPlaceholder} />
    <Tab.Screen name="MealInput" component={MealInputScreen} />
    <Tab.Screen name="Coaching" component={CoachingScreen} />
    <Tab.Screen name="MyPage" component={MyPageStack} />
  </Tab.Navigator>
);

export default MainTab;
