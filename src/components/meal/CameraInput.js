import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, StyleSheet, Modal,
  FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { theme } from '../../styles/theme';
import useMealInput from '../../hooks/useMealInput';

/**
 * 카메라 촬영 + AI 음식 인식 컴포넌트
 */
const CameraInput = ({ onFoodsConfirmed }) => {
  const { loading, error, analyzeImage, openCamera } = useMealInput();
  const [capturedImage, setCapturedImage] = useState(null);
  const [recognizedFoods, setRecognizedFoods] = useState([]);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [currentFoodIndex, setCurrentFoodIndex] = useState(0);
  const [selectedFoods, setSelectedFoods] = useState([]);

  const handleCapture = async () => {
    const asset = await openCamera();
    if (!asset) return;
    setCapturedImage(asset);

    const foods = await analyzeImage(asset);
    if (foods) {
      setRecognizedFoods(foods);
      setSelectedFoods(foods.map((f) => ({ ...f, selected: f.variants ? null : f.name })));
      setCurrentFoodIndex(0);
      setShowVariantModal(true);
    }
  };

  const handleSelectVariant = (variant) => {
    const updated = [...selectedFoods];
    updated[currentFoodIndex] = { ...updated[currentFoodIndex], selected: variant };
    setSelectedFoods(updated);

    const nextIndex = currentFoodIndex + 1;
    if (nextIndex < selectedFoods.length && selectedFoods[nextIndex].variants) {
      setCurrentFoodIndex(nextIndex);
    } else {
      setShowVariantModal(false);
      const confirmed = updated.filter((f) => f.selected).map((f) => f.selected);
      onFoodsConfirmed?.(confirmed, capturedImage);
    }
  };

  const currentFood = recognizedFoods[currentFoodIndex];

  return (
    <View style={styles.container}>
      {capturedImage ? (
        <Image
          source={{ uri: capturedImage.uri }}
          style={styles.preview}
          accessibilityLabel="촬영된 음식 사진"
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>📷</Text>
          <Text style={styles.placeholderText}>카메라로 음식을 찍어보세요</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.captureButton}
        onPress={handleCapture}
        disabled={loading}
        accessibilityLabel="사진 촬영"
        accessibilityHint="카메라를 열어 음식을 촬영합니다"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.captureButtonText}>📷 사진 촬영</Text>
        )}
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* 음식 세부 선택 모달 */}
      <Modal visible={showVariantModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {currentFood && (
              <>
                <Text style={styles.modalTitle}>
                  AI가 인식한 음식: <Text style={styles.foodName}>{currentFood.name}</Text>
                </Text>
                <Text style={styles.modalSubtitle}>어떤 종류인가요?</Text>
                <FlatList
                  data={currentFood.variants || [currentFood.name]}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.variantItem}
                      onPress={() => handleSelectVariant(item)}
                    >
                      <Text style={styles.variantText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: theme.spacing.horizontal },
  preview: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
  placeholder: {
    width: '100%', height: 200, borderRadius: 12, backgroundColor: '#F0F0F0',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  placeholderIcon: { fontSize: 40, marginBottom: 8 },
  placeholderText: { color: theme.colors.textSecondary, fontSize: 14 },
  captureButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 44,
  },
  captureButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  errorText: { color: theme.colors.error, marginTop: 8, fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, maxHeight: '60%',
  },
  modalTitle: { fontSize: 16, color: theme.colors.text, marginBottom: 4 },
  foodName: { color: theme.colors.primary, fontWeight: '700' },
  modalSubtitle: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 16 },
  variantItem: {
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10,
    backgroundColor: '#F5F5F5', marginBottom: 8, minHeight: 44, justifyContent: 'center',
  },
  variantText: { fontSize: 15, color: theme.colors.text },
});

export default CameraInput;
