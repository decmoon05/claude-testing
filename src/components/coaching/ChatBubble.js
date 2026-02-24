import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

/**
 * 채팅 말풍선 컴포넌트
 */
const ChatBubble = ({ message, isUser, isLoading }) => {
  return (
    <View style={[styles.row, isUser && styles.rowUser]}>
      {!isUser && (
        <View style={styles.avatar} accessibilityLabel="AI 코치 아이콘">
          <Text style={styles.avatarText}>🌿</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        {isLoading ? (
          <View style={styles.loadingDots}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.dot, { opacity: 0.3 + i * 0.3 }]} />
            ))}
          </View>
        ) : (
          <Text style={[styles.text, isUser && styles.textUser]}>{message}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12, paddingHorizontal: theme.spacing.horizontal },
  rowUser: { flexDirection: 'row-reverse' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  avatarText: { fontSize: 16 },
  bubble: { maxWidth: '75%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleAI: { backgroundColor: '#fff', borderBottomLeftRadius: 4, elevation: 1 },
  bubbleUser: { backgroundColor: theme.colors.primary, borderBottomRightRadius: 4 },
  text: { fontSize: 15, color: theme.colors.text, lineHeight: 22 },
  textUser: { color: '#fff' },
  loadingDots: { flexDirection: 'row', gap: 4, paddingVertical: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary },
});

export default ChatBubble;
