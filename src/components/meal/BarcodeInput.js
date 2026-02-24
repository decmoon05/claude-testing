import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../../styles/theme';
import useMealInput from '../../hooks/useMealInput';

/**
 * 바코드 스캔 컴포넌트
 * react-native-vision-camera 사용
 */
const BarcodeInput = ({ onFoodFound }) => {
  const { loading, error, lookupBarcode } = useMealInput();
  const [scanning, setScanning] = useState(false);
  const [scannedFood, setScannedFood] = useState(null);

  const handleBarcodeScan = async (barcode) => {
    setScanning(false);
    const food = await lookupBarcode(barcode);
    if (food) {
      setScannedFood(food);
      onFoodFound?.(food);
    }
  };

  // 실제 카메라 사용 시 react-native-vision-camera의 Camera 컴포넌트로 교체
  // 여기서는 스캔 트리거 UI만 구현
  return (
    <View style={styles.container}>
      {scanning ? (
        <View style={styles.scanArea}>
          <View style={styles.scanFrame} />
          <Text style={styles.scanHint}>바코드를 프레임 안에 맞춰주세요</Text>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setScanning(false)}>
            <Text style={styles.cancelText}>취소</Text>
          </TouchableOpacity>
          {/* 실제 구현 시: <Camera ... onBarCodeScanned={handleBarcodeScan} /> */}
        </View>
      ) : (
        <View>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => setScanning(true)}
            disabled={loading}
            accessibilityLabel="바코드 스캔"
            accessibilityHint="카메라로 식품 바코드를 스캔합니다"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.scanButtonText}>바코드 스캔</Text>
            )}
          </TouchableOpacity>

          {scannedFood && (
            <View style={styles.resultCard}>
              <Text style={styles.resultName}>{scannedFood.name}</Text>
              <Text style={styles.resultManufacturer}>{scannedFood.manufacturer}</Text>
              <View style={styles.macroRow}>
                {[
                  { label: '탄수화물', value: `${scannedFood.macros.carb}g` },
                  { label: '단백질', value: `${scannedFood.macros.protein}g` },
                  { label: '지방', value: `${scannedFood.macros.fat}g` },
                ].map(({ label, value }) => (
                  <View key={label} style={styles.macroItem}>
                    <Text style={styles.macroValue}>{value}</Text>
                    <Text style={styles.macroLabel}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: theme.spacing.horizontal },
  scanArea: { height: 300, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', borderRadius: 12 },
  scanFrame: { width: 200, height: 120, borderWidth: 2, borderColor: theme.colors.primary, borderRadius: 8 },
  scanHint: { color: '#fff', marginTop: 16, fontSize: 13 },
  cancelButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  cancelText: { color: '#fff' },
  scanButton: {
    backgroundColor: theme.colors.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', minHeight: 44,
  },
  scanButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resultCard: { marginTop: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2 },
  resultName: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  resultManufacturer: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 12 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around' },
  macroItem: { alignItems: 'center' },
  macroValue: { fontSize: 16, fontWeight: '700', color: theme.colors.primary },
  macroLabel: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  errorText: { color: theme.colors.error, marginTop: 8, fontSize: 13 },
});

export default BarcodeInput;
