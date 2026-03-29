import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { Colors } from '@/constants/Colors';
import { api, getApiError } from '@/lib/api';

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handleSubmit = async () => {
    if (!token.trim() || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { token: token.trim(), password });
      setSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setError(getApiError(e));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16 }]}
      bottomOffset={60}
    >
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Feather name="arrow-left" size={22} color={Colors.text.primary} />
      </Pressable>

      {success ? (
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Feather name="check" size={32} color={Colors.status.success} />
          </View>
          <Text style={styles.title}>Password reset!</Text>
          <Text style={styles.successText}>
            Your password has been updated. You can now sign in with your new password.
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              router.dismissAll();
              router.replace('/(auth)/login');
            }}
          >
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.title}>Set new password</Text>
          <Text style={styles.subtitle}>Enter the reset code from your email and choose a new password</Text>

          {!!error && (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={16} color={Colors.status.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Reset Code</Text>
            <View style={styles.inputContainer}>
              <Feather name="key" size={18} color={Colors.text.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Paste your reset code"
                placeholderTextColor={Colors.text.tertiary}
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={18} color={Colors.text.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Min 8 characters"
                placeholderTextColor={Colors.text.tertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={Colors.text.secondary} />
              </Pressable>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={18} color={Colors.text.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Repeat your new password"
                placeholderTextColor={Colors.text.tertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.primaryButton, { opacity: pressed || isLoading ? 0.85 : 1 }]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>{isLoading ? 'Resetting...' : 'Reset Password'}</Text>
          </Pressable>

          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>← Back to Sign In</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  content: { paddingHorizontal: 24, gap: 20, paddingBottom: 40 },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  form: { gap: 16 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 14, color: Colors.text.secondary, fontFamily: 'Inter_400Regular', marginTop: -8, lineHeight: 20 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { flex: 1, fontSize: 13, color: Colors.status.error, fontFamily: 'Inter_400Regular' },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.text.primary, fontFamily: 'Inter_500Medium' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border.default, borderRadius: 12, backgroundColor: Colors.bg.secondary },
  inputIcon: { paddingLeft: 14 },
  input: { flex: 1, paddingVertical: 14, paddingHorizontal: 10, fontSize: 15, color: Colors.text.primary, fontFamily: 'Inter_400Regular' },
  eyeBtn: { padding: 14 },
  primaryButton: { backgroundColor: Colors.brand.orange, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  primaryButtonText: { fontSize: 16, fontWeight: '600', color: '#fff', fontFamily: 'Inter_600SemiBold' },
  backLink: { alignItems: 'center', paddingVertical: 8 },
  backLinkText: { fontSize: 14, color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },
  successContainer: { alignItems: 'center', gap: 16, paddingTop: 40 },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center' },
  successText: { fontSize: 15, color: Colors.text.secondary, textAlign: 'center', fontFamily: 'Inter_400Regular', lineHeight: 22 },
});
