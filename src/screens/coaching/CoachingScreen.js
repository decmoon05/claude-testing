import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView, View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { sendMessageToCoach, buildDietContext, buildUserContext } from '../../services/ai/aiService';
import { getMealsByDate } from '../../services/firebase/mealService';
import ChatBubble from '../../components/coaching/ChatBubble';
import useAuthStore from '../../store/authStore';
import { theme } from '../../styles/theme';

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'ai',
  text: '안녕하세요! 저는 murggling AI 코치예요.\n오늘 식단에 대해 궁금한 점이 있으신가요?',
};

const CoachingScreen = () => {
  const { user, profile } = useAuthStore();
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [todayMeals, setTodayMeals] = useState([]);
  const flatListRef = useRef(null);

  useEffect(() => {
    loadTodayMeals();
  }, []);

  const loadTodayMeals = async () => {
    try {
      const meals = await getMealsByDate(user.uid, new Date());
      setTodayMeals(meals);
    } catch {}
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg = { id: Date.now().toString(), role: 'user', text };
    const aiPlaceholder = { id: 'loading', role: 'ai', text: '', isLoading: true };

    setMessages((prev) => [...prev, userMsg, aiPlaceholder]);
    setInput('');
    setIsLoading(true);

    try {
      const dietContext = buildDietContext(todayMeals);
      const userContext = buildUserContext(profile);
      const history = messages
        .filter((m) => m.id !== 'welcome' && !m.isLoading)
        .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));

      let aiText = '';
      await sendMessageToCoach(
        { userMessage: text, dietContext, userContext, conversationHistory: history },
        (chunk) => {
          aiText += chunk;
          setMessages((prev) =>
            prev.map((m) => (m.id === 'loading' ? { ...m, text: aiText } : m))
          );
        }
      );

      const finalId = Date.now().toString();
      setMessages((prev) =>
        prev.map((m) => (m.id === 'loading' ? { id: finalId, role: 'ai', text: aiText } : m))
      );

      // Firestore에 대화 저장
      await addDoc(collection(db, 'coaching', user.uid, 'conversations'), {
        userMessage: text,
        aiResponse: aiText,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === 'loading'
            ? { id: Date.now().toString(), role: 'ai', text: '죄송해요, 일시적인 오류가 발생했어요. 다시 시도해주세요.' }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* 의료 면책 문구 - 상단 고정 */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          이 앱은 생활 습관 관리를 돕는 도구이며, 의료 행위를 제공하지 않습니다.
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatBubble message={item.text} isUser={item.role === 'user'} isLoading={item.isLoading} />
          )}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          contentContainerStyle={styles.messageList}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="AI 코치에게 물어보세요..."
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            accessibilityLabel="AI 코치에게 메시지 입력"
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
            accessibilityLabel="메시지 전송"
            accessibilityHint="AI 코치에게 메시지를 보냅니다"
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  disclaimer: {
    backgroundColor: '#FFF3CD', paddingHorizontal: theme.spacing.horizontal,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#FFE082',
  },
  disclaimerText: { fontSize: 11, color: '#856404', textAlign: 'center', lineHeight: 16 },
  messageList: { paddingTop: 16, paddingBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: theme.spacing.horizontal,
    paddingVertical: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  textInput: {
    flex: 1, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100,
    backgroundColor: '#FAFAFA',
  },
  sendButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },
  sendButtonDisabled: { backgroundColor: '#C8E6C9' },
  sendIcon: { color: '#fff', fontSize: 18, fontWeight: '700' },
});

export default CoachingScreen;
