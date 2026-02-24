import React, { useState } from 'react';
import {
  SafeAreaView, View, Text, TouchableOpacity,
  StyleSheet, ScrollView, Alert,
} from 'react-native';
import { theme } from '../../styles/theme';
import CameraInput from '../../components/meal/CameraInput';
import BarcodeInput from '../../components/meal/BarcodeInput';
import ManualInput from '../../components/meal/ManualInput';
import useMealInput from '../../hooks/useMealInput';
import { computeImageHash } from '../../utils/novaScore';

const TABS = ['카메라', '바코드', '직접입력'];

const MealInputScreen = ({ navigation }) => {
  const { submitMeal, loading } = useMealInput();
  const [activeTab, setActiveTab] = useState(0);
  const [pendingItems, setPendingItems] = useState([]);
  const [pendingImage, setPendingImage] = useState(null);

  const handleCameraFoods = async (foods, imageAsset) => {
    const items = foods.map((name) => ({ name, novaGrade: null, portion: 1 }));
    setPendingItems(items);
    setPendingImage(imageAsset);
  };

  const handleBarcodeFood = (food) => {
    setPendingItems((prev) => [...prev, { name: food.name, novaGrade: food.novaGrade, macros: food.macros, portion: 1 }]);
  };

  const handleManualFood = (food) => {
    setPendingItems((prev) => [...prev, { name: food.name, novaGrade: food.novaGrade, portion: 1 }]);
  };

  const handleSave = async () => {
    if (pendingItems.length === 0) {
      Alert.alert('알림', '식단 항목을 추가해주세요.');
      return;
    }

    let imageHash = null;
    if (pendingImage) {
      imageHash = await computeImageHash(pendingImage.uri);
    }

    const result = await submitMeal({
      imageUri: pendingImage?.uri,
      imageHash,
      items: pendingItems,
      inputMethod: ['camera', 'barcode', 'manual'][activeTab],
      exifTimestamp: pendingImage?.exif?.DateTime,
    });

    if (result.success) {
      Alert.alert('저장 완료!', `비정제지수 ${result.score}점을 획득했어요!`, [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('저장 실패', '다시 시도해주세요.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView>
        <Text style={styles.header}>식단 입력</Text>

        {/* 입력 방식 탭 */}
        <View style={styles.tabBar}>
          {TABS.map((tab, index) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === index && styles.tabActive]}
              onPress={() => setActiveTab(index)}
              accessibilityLabel={`${tab} 입력 방식 선택`}
            >
              <Text style={[styles.tabText, activeTab === index && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputArea}>
          {activeTab === 0 && <CameraInput onFoodsConfirmed={handleCameraFoods} />}
          {activeTab === 1 && <BarcodeInput onFoodFound={handleBarcodeFood} />}
          {activeTab === 2 && <ManualInput onFoodSelected={handleManualFood} />}
        </View>

        {/* 추가된 항목 */}
        {pendingItems.length > 0 && (
          <View style={styles.itemsSection}>
            <Text style={styles.sectionTitle}>추가된 식단 ({pendingItems.length})</Text>
            {pendingItems.map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <TouchableOpacity onPress={() => setPendingItems((prev) => prev.filter((_, idx) => idx !== i))}>
                  <Text style={styles.removeText}>삭제</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
          accessibilityLabel="식단 저장"
          accessibilityHint="입력한 식단을 저장합니다"
        >
          <Text style={styles.saveButtonText}>{loading ? '저장 중...' : '식단 저장하기'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: { fontSize: 22, fontWeight: '800', color: theme.colors.text, paddingHorizontal: theme.spacing.horizontal, paddingTop: theme.spacing.vertical, marginBottom: 16 },
  tabBar: { flexDirection: 'row', marginHorizontal: theme.spacing.horizontal, backgroundColor: '#F0F0F0', borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, minHeight: 44 },
  tabActive: { backgroundColor: '#fff', elevation: 2 },
  tabText: { fontSize: 14, color: theme.colors.textSecondary },
  tabTextActive: { color: theme.colors.primary, fontWeight: '700' },
  inputArea: { marginBottom: 24 },
  itemsSection: { paddingHorizontal: theme.spacing.horizontal, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', minHeight: 44 },
  itemName: { fontSize: 14, color: theme.colors.text },
  removeText: { color: theme.colors.error, fontSize: 13 },
  saveButton: { marginHorizontal: theme.spacing.horizontal, marginBottom: 32, backgroundColor: theme.colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', minHeight: 44 },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default MealInputScreen;
