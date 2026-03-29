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

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) { setError('Please enter your email'); return; }
    setError('');
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setError(getApiError(e));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

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
            <Feather name="mail" size={32} color={Colors.status.success} />
          </View>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.successText}>
            If <Text style={styles.emailHighlight}>{email}</Text> is registered, you'll receive a reset link shortly.
          </Text>
          <View style={styles.tipsCard}>
            <View style={styles.tipRow}>
              <Feather name="alert-circle" size={14} color={Colors.brand.orange} />
              <Text style={styles.tipText}>Check your spam or junk folder</Text>
            </View>
            <View style={styles.tipRow}>
              <Feather name="clock" size={14} color={Colors.brand.orange} />
              <Text style={styles.tipText}>It may take a few minutes to arrive</Text>
            </View>
            <View style={styles.tipRow}>
              <Feather name="check-circle" size={14} color={Colors.brand.orange} />
              <Text style={styles.tipText}>Make sure you used your registered email</Text>
            </View>
          </View>
          <Pressable style={styles.primaryButton} onPress={() => router.push('/(auth)/reset-password')}>
            <Text style={styles.primaryButtonText}>I have a reset code →</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => { setSuccess(false); setEmail(''); }}>
            <Text style={styles.secondaryButtonText}>Try a different email</Text>
          </Pressable>
          <Pressable style={styles.backLinkBtn} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>← Back to Sign In</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.title}>Reset password</Text>
          <Text style={styles.subtitle}>Enter your email to receive a reset link</Text>

          {!!error && (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={16} color={Colors.status.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Feather name="mail" size={18} color={Colors.text.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={Colors.text.tertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.primaryButton, { opacity: pressed || isLoading ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>{isLoading ? 'Sending...' : 'Send Reset Link'}</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  content: { paddingHorizontal: 24, gap: 24, paddingBottom: 40 },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  form: { gap: 16 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 14, color: Colors.text.secondary, fontFamily: 'Inter_400Regular', marginTop: -8 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { flex: 1, fontSize: 13, color: Colors.status.error, fontFamily: 'Inter_400Regular' },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.text.primary, fontFamily: 'Inter_500Medium' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    borderRadius: 12,
    backgroundColor: Colors.bg.secondary,
  },
  inputIcon: { paddingLeft: 14 },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    fontSize: 15,
    color: Colors.text.primary,
    fontFamily: 'Inter_400Regular',
  },
  primaryButton: {
    backgroundColor: Colors.brand.orange,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: { fontSize: 16, fontWeight: '600', color: '#fff', fontFamily: 'Inter_600SemiBold' },
  secondaryButton: { alignItems: 'center', paddingVertical: 10 },
  secondaryButtonText: { fontSize: 14, color: Colors.brand.orange, fontFamily: 'Inter_500Medium' },
  backLinkBtn: { alignItems: 'center', paddingVertical: 6 },
  backLinkText: { fontSize: 14, color: Colors.text.tertiary, fontFamily: 'Inter_400Regular' },
  tipsCard: { width: '100%', backgroundColor: Colors.bg.secondary, borderRadius: 14, padding: 14, gap: 10, borderWidth: 1.5, borderColor: Colors.border.default },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipText: { fontSize: 13, color: Colors.text.secondary, fontFamily: 'Inter_400Regular', flex: 1 },
  successContainer: { alignItems: 'center', gap: 16, paddingTop: 40 },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successText: { fontSize: 15, color: Colors.text.secondary, textAlign: 'center', fontFamily: 'Inter_400Regular', lineHeight: 22 },
  emailHighlight: { fontWeight: '600', color: Colors.text.primary, fontFamily: 'Inter_600SemiBold' },
});
