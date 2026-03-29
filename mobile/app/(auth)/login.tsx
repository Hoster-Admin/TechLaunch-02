import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { getApiError } from '@/lib/api';

export default function LoginScreen() {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await login(email.trim(), password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (e) {
      setError(getApiError(e));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 32, paddingBottom: botPad + 24 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.logoSection}>
        <View style={styles.logoBadge}>
          <Image
            source={require('../../assets/images/tlmena-logo.png')}
            style={styles.logoImg}
            contentFit="contain"
          />
        </View>
        <Text style={styles.brandName}>Tech Launch MENA</Text>
        <Text style={styles.brandTagline}>Discover the MENA tech ecosystem</Text>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.heading}>Welcome back</Text>

        {!!error && (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={16} color={Colors.status.error} style={{ marginTop: 2 }} />
            <View style={{ flex: 1, gap: 2 }}>
              {error.split('\n').map((line, i) => (
                <Text key={i} style={styles.errorText}>{line}</Text>
              ))}
            </View>
          </View>
        )}

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputRow}>
            <Feather name="mail" size={18} color={Colors.text.tertiary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={Colors.text.tertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputRow}>
            <Feather name="lock" size={18} color={Colors.text.tertiary} style={styles.inputIcon} />
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Colors.text.tertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={Colors.text.tertiary} />
            </Pressable>
          </View>
        </View>

        <Pressable onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotWrap}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, { opacity: pressed || isLoading ? 0.85 : 1 }]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.primaryBtnText}>{isLoading ? 'Signing in...' : 'Sign In'}</Text>
        </Pressable>
      </View>

      <View style={styles.signupRow}>
        <Text style={styles.signupHint}>Don't have an account? </Text>
        <Pressable onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.signupLink}>Sign up</Text>
        </Pressable>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  flex: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 32 },
  logoSection: { alignItems: 'center', gap: 8 },
  logoBadge: { width: 80, height: 80, borderRadius: 20, backgroundColor: Colors.brand.orange, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  logoImg: { width: 60, height: 60 },
  brandName: { fontSize: 17, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold' },
  brandTagline: { fontSize: 13, color: Colors.text.secondary, fontFamily: 'Inter_400Regular' },
  formSection: { gap: 16 },
  heading: { fontSize: 26, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { flex: 1, fontSize: 13, color: Colors.status.error, fontFamily: 'Inter_400Regular' },
  fieldGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.text.primary, fontFamily: 'Inter_500Medium' },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border.default, borderRadius: 14, backgroundColor: Colors.bg.secondary },
  inputIcon: { paddingLeft: 14 },
  input: { flex: 1, paddingHorizontal: 10, paddingVertical: 14, fontSize: 15, color: Colors.text.primary, fontFamily: 'Inter_400Regular' },
  eyeBtn: { padding: 14 },
  forgotWrap: { alignSelf: 'flex-end' },
  forgotText: { fontSize: 13, fontWeight: '500', color: Colors.brand.orange, fontFamily: 'Inter_500Medium' },
  primaryBtn: { backgroundColor: Colors.brand.orange, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#fff', fontFamily: 'Inter_600SemiBold' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signupHint: { fontSize: 14, color: Colors.text.secondary, fontFamily: 'Inter_400Regular' },
  signupLink: { fontSize: 14, color: Colors.brand.orange, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
});
