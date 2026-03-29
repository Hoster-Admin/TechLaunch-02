import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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

const PERSONAS = ['Founder', 'Investor', 'Product Manager', 'Developer', 'Accelerator', 'Enthusiast'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
}

export default function RegisterScreen() {
  const { register } = useAuth();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [persona, setPersona] = useState('');
  const [country, setCountry] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const countryRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  useEffect(() => {
    if (name && !handle) {
      setHandle(slugify(name));
    }
  }, [name]);

  const validateEmail = (v: string): string => {
    if (!v.trim()) return '';
    if (!EMAIL_REGEX.test(v.trim())) return 'Please enter a valid email address.';
    return '';
  };

  const isEmailValid = !email.trim() || EMAIL_REGEX.test(email.trim());

  const handleRegister = async () => {
    const emailErr = validateEmail(email);
    if (emailErr) { setEmailError(emailErr); return; }

    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Name, email, and password are required');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setError('');
    setEmailError('');
    setIsLoading(true);
    try {
      await register(
        name.trim(),
        email.trim(),
        password,
        handle.trim() || undefined,
        persona || undefined,
        country.trim() || undefined,
      );
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
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: botPad + 24 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Feather name="arrow-left" size={22} color={Colors.text.primary} />
      </Pressable>

      <View style={styles.formSection}>
        <Text style={styles.heading}>Create account</Text>
        <Text style={styles.subheading}>Join the MENA tech community</Text>

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
          <Text style={styles.label}>Full Name *</Text>
          <View style={styles.inputRow}>
            <Feather name="user" size={18} color={Colors.text.tertiary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Your full name"
              placeholderTextColor={Colors.text.tertiary}
              value={name}
              onChangeText={setName}
              returnKeyType="next"
              onSubmitEditing={() => handleRef.current?.focus()}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Username (handle)</Text>
          <View style={styles.inputRow}>
            <Text style={styles.atSign}>@</Text>
            <TextInput
              ref={handleRef}
              style={styles.input}
              placeholder="yourhandle"
              placeholderTextColor={Colors.text.tertiary}
              value={handle}
              onChangeText={(v) => setHandle(slugify(v))}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email *</Text>
          <View style={[styles.inputRow, !!emailError && styles.inputRowError]}>
            <Feather name="mail" size={18} color={Colors.text.tertiary} style={styles.inputIcon} />
            <TextInput
              ref={emailRef}
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={Colors.text.tertiary}
              value={email}
              onChangeText={(v) => { setEmail(v); if (emailError) setEmailError(validateEmail(v)); }}
              onBlur={() => setEmailError(validateEmail(email))}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => countryRef.current?.focus()}
            />
          </View>
          {!!emailError && <Text style={styles.fieldError}>{emailError}</Text>}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Country</Text>
          <View style={styles.inputRow}>
            <Feather name="map-pin" size={18} color={Colors.text.tertiary} style={styles.inputIcon} />
            <TextInput
              ref={countryRef}
              style={styles.input}
              placeholder="e.g. Saudi Arabia, UAE, Egypt"
              placeholderTextColor={Colors.text.tertiary}
              value={country}
              onChangeText={setCountry}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>I am a...</Text>
          <View style={styles.personaRow}>
            {PERSONAS.map((p) => (
              <Pressable
                key={p}
                style={[styles.personaChip, persona === p && styles.personaChipActive]}
                onPress={() => setPersona(persona === p ? '' : p)}
              >
                <Text style={[styles.personaChipText, persona === p && styles.personaChipTextActive]}>{p}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password *</Text>
          <View style={styles.inputRow}>
            <Feather name="lock" size={18} color={Colors.text.tertiary} style={styles.inputIcon} />
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder="Min 8 characters"
              placeholderTextColor={Colors.text.tertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={Colors.text.tertiary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Confirm Password *</Text>
          <View style={styles.inputRow}>
            <Feather name="lock" size={18} color={Colors.text.tertiary} style={styles.inputIcon} />
            <TextInput
              ref={confirmRef}
              style={styles.input}
              placeholder="Repeat your password"
              placeholderTextColor={Colors.text.tertiary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
            <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
              <Feather name={showConfirmPassword ? 'eye-off' : 'eye'} size={18} color={Colors.text.tertiary} />
            </Pressable>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, { opacity: !isEmailValid ? 0.5 : pressed || isLoading ? 0.85 : 1 }]}
          onPress={handleRegister}
          disabled={isLoading || !isEmailValid}
        >
          <Text style={styles.primaryBtnText}>{isLoading ? 'Creating account...' : 'Create Account'}</Text>
        </Pressable>
      </View>

      <View style={styles.loginRow}>
        <Text style={styles.loginHint}>Already have an account? </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.loginLink}>Sign in</Text>
        </Pressable>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  flex: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 24 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  formSection: { gap: 16 },
  heading: { fontSize: 26, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold' },
  subheading: { fontSize: 14, color: Colors.text.secondary, fontFamily: 'Inter_400Regular', marginTop: -8 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { flex: 1, fontSize: 13, color: Colors.status.error, fontFamily: 'Inter_400Regular' },
  fieldGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.text.primary, fontFamily: 'Inter_500Medium' },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border.default, borderRadius: 14, backgroundColor: Colors.bg.secondary },
  inputRowError: { borderColor: Colors.status.error },
  inputIcon: { paddingLeft: 14 },
  atSign: { paddingLeft: 14, fontSize: 16, color: Colors.text.tertiary, fontFamily: 'Inter_500Medium' },
  input: { flex: 1, paddingHorizontal: 10, paddingVertical: 14, fontSize: 15, color: Colors.text.primary, fontFamily: 'Inter_400Regular' },
  eyeBtn: { padding: 14 },
  fieldError: { fontSize: 12, color: Colors.status.error, fontFamily: 'Inter_400Regular' },
  personaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  personaChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border.default, backgroundColor: Colors.bg.secondary },
  personaChipActive: { backgroundColor: Colors.brand.light, borderColor: Colors.brand.orange },
  personaChipText: { fontSize: 13, color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },
  personaChipTextActive: { color: Colors.brand.orange },
  primaryBtn: { backgroundColor: Colors.brand.orange, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#fff', fontFamily: 'Inter_600SemiBold' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginHint: { fontSize: 14, color: Colors.text.secondary, fontFamily: 'Inter_400Regular' },
  loginLink: { fontSize: 14, color: Colors.brand.orange, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
});
