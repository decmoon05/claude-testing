import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

const TAB_ICONS = {
  Home: { icon: '🏠', label: '홈' },
  MealList: { icon: '📋', label: '식단' },
  MealInput: { icon: '+', label: '기록', isCenter: true },
  Coaching: { icon: '💬', label: 'AI' },
  MyPage: { icon: '👤', label: 'MY' },
};

/**
 * 커스텀 하단 탭바
 * 중앙 버튼(식단 입력)을 강조
 */
const TabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const tabInfo = TAB_ICONS[route.name];

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        if (tabInfo?.isCenter) {
          return (
            <TouchableOpacity
              key={route.key}
              style={styles.centerTabWrapper}
              onPress={onPress}
              accessibilityLabel="식단 기록"
              accessibilityHint="식단 입력 화면으로 이동합니다"
            >
              <View style={styles.centerTab}>
                <Text style={styles.centerTabIcon}>+</Text>
              </View>
              <Text style={styles.centerTabLabel}>기록</Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            onPress={onPress}
            accessibilityLabel={tabInfo?.label}
          >
            <Text style={[styles.tabIcon, isFocused && styles.tabIconActive]}>
              {tabInfo?.icon}
            </Text>
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {tabInfo?.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', backgroundColor: '#fff', paddingBottom: 8, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: '#F0F0F0', elevation: 8,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 4, minHeight: 44 },
  tabIcon: { fontSize: 22, opacity: 0.4 },
  tabIconActive: { opacity: 1 },
  tabLabel: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 2 },
  tabLabelActive: { color: theme.colors.primary, fontWeight: '700' },
  centerTabWrapper: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 2 },
  centerTab: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center', marginTop: -20,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  centerTabIcon: { color: '#fff', fontSize: 26, fontWeight: '300' },
  centerTabLabel: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 2 },
});

export default TabBar;
