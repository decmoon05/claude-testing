import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { recognizeFoodFromImage, getFoodVariants } from '../services/vision/visionService';
import { fetchFoodByBarcodeWithRetry } from '../services/barcode/barcodeService';
import { saveMealEntry } from '../services/firebase/mealService';
import { calculateMealScore } from '../utils/novaScore';
import useAuthStore from '../store/authStore';

/**
 * 식단 입력 커스텀 훅
 * 카메라/바코드/직접입력 세 가지 방식 통합 관리
 */
const useMealInput = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recognizedFoods, setRecognizedFoods] = useState([]);  // Vision AI 인식 결과
  const [pendingVariants, setPendingVariants] = useState(null); // 세부 선택지 팝업

  const clearError = () => setError(null);

  // --- 카메라 입력 ---
  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setError('카메라 권한이 필요합니다.');
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      exif: true, // EXIF 메타데이터 포함 (촬영 시간 검증)
    });
    return result.canceled ? null : result.assets[0];
  };

  const analyzeImage = async (imageAsset) => {
    setLoading(true);
    setError(null);
    try {
      const result = await recognizeFoodFromImage(imageAsset.uri);
      const withVariants = result.foods.map((food) => ({
        name: food,
        variants: getFoodVariants(food),
        selected: food,
      }));
      setRecognizedFoods(withVariants);
      return withVariants;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // --- 바코드 입력 ---
  const lookupBarcode = async (barcode) => {
    setLoading(true);
    setError(null);
    try {
      const foodInfo = await fetchFoodByBarcodeWithRetry(barcode);
      return foodInfo;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // --- 식단 저장 ---
  const submitMeal = async ({ imageUri, imageHash, items, inputMethod, exifTimestamp }) => {
    setLoading(true);
    setError(null);
    try {
      // EXIF 촬영 시간 검증: 24시간 이내인지 확인
      if (exifTimestamp) {
        const shotTime = new Date(exifTimestamp);
        const diffHours = (Date.now() - shotTime.getTime()) / (1000 * 60 * 60);
        if (diffHours > 24) {
          throw new Error('24시간 이전에 촬영된 사진은 등록할 수 없습니다.');
        }
      }

      const totalScore = calculateMealScore(items);

      await saveMealEntry(user.uid, {
        imageUri,
        imageHash,
        items,
        totalScore,
        inputMethod,
      });

      return { success: true, score: totalScore };
    } catch (err) {
      setError(err.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    recognizedFoods,
    pendingVariants,
    clearError,
    openCamera,
    analyzeImage,
    lookupBarcode,
    submitMeal,
  };
};

export default useMealInput;
