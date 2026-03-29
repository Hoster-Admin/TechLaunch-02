import { Feather } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
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
import { api, getApiError } from '@/lib/api';

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const newRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/users/me/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      }),
    onSuccess: () => {
      setSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => router.back(), 1500);
    },
    onError: (e) => {
      setError(getApiError(e));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const handleSubmit = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setError('');
    mutation.mutate();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20, paddingBottom: Platform.OS === 'web' ? 100 : insets.bottom + 100, gap: 16 }}
    >
      {!!error && (
        <View style={styles.errorBanner}>
          <Feather name="alert-circle" size={14} color={Colors.status.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {success && (
        <View style={styles.successBanner}>
          <Feather name="check-circle" size={14} color={Colors.status.success} />
          <Text style={styles.successText}>Password changed successfully!</Text>
        </View>
      )}

      <View style={styles.field}>
        <Text style={styles.label}>Current Password</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="••••••••"
            placeholderTextColor={Colors.text.tertiary}
            secureTextEntry={!showPassword}
            returnKeyType="next"
            onSubmitEditing={() => newRef.current?.focus()}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color={Colors.text.secondary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>New Password</Text>
        <View style={styles.inputContainer}>
          <TextInput
            ref={newRef}
            style={[styles.input, { flex: 1 }]}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Min 8 characters"
            placeholderTextColor={Colors.text.tertiary}
            secureTextEntry={!showPassword}
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Confirm New Password</Text>
        <View style={styles.inputContainer}>
          <TextInput
            ref={confirmRef}
            style={[styles.input, { flex: 1 }]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            placeholderTextColor={Colors.text.tertiary}
            secureTextEntry={!showPassword}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.saveBtn, { opacity: pressed || mutation.isPending ? 0.85 : 1 }]}
        onPress={handleSubmit}
        disabled={mutation.isPending}
      >
        <Text style={styles.saveBtnText}>{mutation.isPending ? 'Updating...' : 'Update Password'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.secondary },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12 },
  errorText: { flex: 1, fontSize: 13, color: Colors.status.error, fontFamily: 'Inter_400Regular' },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#D1FAE5', borderRadius: 10, padding: 12 },
  successText: { flex: 1, fontSize: 13, color: Colors.status.success, fontFamily: 'Inter_500Medium' },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.text.primary, fontFamily: 'Inter_500Medium' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border.default, borderRadius: 12, backgroundColor: Colors.bg.primary },
  input: { paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: Colors.text.primary, fontFamily: 'Inter_400Regular' },
  eyeBtn: { padding: 12 },
  saveBtn: { backgroundColor: Colors.brand.orange, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: '#fff', fontFamily: 'Inter_600SemiBold' },
});
