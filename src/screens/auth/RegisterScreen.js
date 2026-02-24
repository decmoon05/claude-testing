import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { theme } from '../../styles/theme';
import useAuth from '../../hooks/useAuth';

const RegisterScreen = ({ navigation }) => {
  const { signUp } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', passwordConfirm: '', nickname: '' });
  const [loading, setLoading] = useState(false);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    if (!form.email.trim() || !form.password || !form.nickname.trim()) {
      Alert.alert('알림', '모든 항목을 입력해주세요.');
      return false;
    }
    if (form.password.length < 6) {
      Alert.alert('알림', '비밀번호는 6자 이상이어야 합니다.');
      return false;
    }
    if (form.password !== form.passwordConfirm) {
      Alert.alert('알림', '비밀번호가 일치하지 않습니다.');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await signUp({ email: form.email.trim(), password: form.password, nickname: form.nickname.trim() });
    } catch (error) {
      Alert.alert('회원가입 실패', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>회원가입</Text>
          <Text style={styles.subtitle}>murggling과 함께 건강한 습관을 만들어요</Text>

          {[
            { key: 'nickname', placeholder: '닉네임', label: '닉네임 입력' },
            { key: 'email', placeholder: '이메일', label: '이메일 입력', keyboard: 'email-address' },
            { key: 'password', placeholder: '비밀번호 (6자 이상)', label: '비밀번호 입력', secure: true },
            { key: 'passwordConfirm', placeholder: '비밀번호 확인', label: '비밀번호 확인 입력', secure: true },
          ].map(({ key, placeholder, label, keyboard, secure }) => (
            <TextInput
              key={key}
              style={styles.input}
              placeholder={placeholder}
              value={form[key]}
              onChangeText={(v) => update(key, v)}
              keyboardType={keyboard || 'default'}
              autoCapitalize="none"
              secureTextEntry={secure}
              accessibilityLabel={label}
            />
          ))}

          <Text style={styles.disclaimer}>
            이 앱은 생활 습관 관리를 돕는 도구이며, 의료 행위를 제공하지 않습니다.
          </Text>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            accessibilityLabel="회원가입 완료"
            accessibilityHint="입력한 정보로 계정을 만듭니다"
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>가입하기</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={() => navigation.goBack()}>
            <Text style={styles.linkText}>이미 계정이 있으신가요? <Text style={styles.linkHighlight}>로그인</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: {
    paddingHorizontal: theme.spacing.horizontal,
    paddingTop: 40,
    paddingBottom: 40,
  },
  title: { fontSize: 24, fontWeight: '800', color: theme.colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 32 },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  disclaimer: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 44,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkButton: { marginTop: 20, alignItems: 'center' },
  linkText: { color: theme.colors.textSecondary, fontSize: 14 },
  linkHighlight: { color: theme.colors.primary, fontWeight: '600' },
});

export default RegisterScreen;
