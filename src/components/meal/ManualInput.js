import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { theme } from '../../styles/theme';
import { FOOD_DATABASE } from '../../utils/novaScore';

/**
 * 직접 검색/선택 식단 입력 컴포넌트
 */
const ManualInput = ({ onFoodSelected }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [favorites, setFavorites] = useState([]);

  const handleSearch = (text) => {
    setQuery(text);
    if (text.length < 1) {
      setResults([]);
      return;
    }
    const filtered = FOOD_DATABASE.filter((food) =>
      food.name.includes(text)
    );
    setResults(filtered.slice(0, 10));
  };

  const handleSelectFood = (food) => {
    setQuery('');
    setResults([]);
    onFoodSelected?.(food);
  };

  const toggleFavorite = (food) => {
    setFavorites((prev) =>
      prev.find((f) => f.name === food.name)
        ? prev.filter((f) => f.name !== food.name)
        : [...prev, food]
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="식품 이름으로 검색..."
        value={query}
        onChangeText={handleSearch}
        accessibilityLabel="식품 검색"
      />

      {results.length > 0 && (
        <View style={styles.resultsList}>
          {results.map((food) => (
            <TouchableOpacity
              key={food.name}
              style={styles.resultItem}
              onPress={() => handleSelectFood(food)}
              accessibilityLabel={`${food.name} 선택`}
            >
              <View style={styles.resultInfo}>
                <Text style={styles.resultName}>{food.name}</Text>
                <Text style={styles.resultNova}>NOVA {food.novaGrade}단계</Text>
              </View>
              <TouchableOpacity
                onPress={() => toggleFavorite(food)}
                accessibilityLabel={`${food.name} 즐겨찾기`}
              >
                <Text style={styles.starIcon}>
                  {favorites.find((f) => f.name === food.name) ? '★' : '☆'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {favorites.length > 0 && (
        <View style={styles.favoritesSection}>
          <Text style={styles.sectionTitle}>자주 먹는 식품</Text>
          {favorites.map((food) => (
            <TouchableOpacity
              key={food.name}
              style={styles.favoriteItem}
              onPress={() => handleSelectFood(food)}
              accessibilityLabel={`${food.name} 선택`}
            >
              <Text style={styles.favoriteIcon}>★</Text>
              <Text style={styles.favoriteName}>{food.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: theme.spacing.horizontal },
  searchInput: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, backgroundColor: '#fff',
  },
  resultsList: { marginTop: 8, backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  resultItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', minHeight: 44,
  },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 15, color: theme.colors.text, fontWeight: '500' },
  resultNova: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  starIcon: { fontSize: 20, color: '#FFB800' },
  favoritesSection: { marginTop: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
  favoriteItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0', minHeight: 44,
  },
  favoriteIcon: { fontSize: 16, color: '#FFB800', marginRight: 10 },
  favoriteName: { fontSize: 15, color: theme.colors.text },
});

export default ManualInput;
