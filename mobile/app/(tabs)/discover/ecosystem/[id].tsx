import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
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
import { adaptEntity } from '@/lib/adapters';
import type { EcosystemEntity } from '@/types';

export default function EntityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [showApplyForm, setShowApplyForm] = useState(false);
  const [formStartup, setFormStartup] = useState('');
  const [formStage, setFormStage] = useState('');
  const [formPitch, setFormPitch] = useState('');
  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState(false);

  const { data: entity, isLoading } = useQuery<EcosystemEntity>({
    queryKey: ['entity', id],
    queryFn: async () => {
      const res = await api.get(`/entities/${id}`);
      return adaptEntity(res.data.data ?? res.data);
    },
  });

  const applyMutation = useMutation({
    mutationFn: () =>
      api.post(`/entities/${id}/apply`, {
        startup_name: formStartup,
        stage: formStage,
        pitch: formPitch,
      }),
    onSuccess: () => {
      setApplySuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (e) => {
      setApplyError(getApiError(e));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={Colors.text.primary} />
          </Pressable>
        </View>
        <ActivityIndicator color={Colors.brand.orange} style={{ marginTop: 60 }} />
      </View>
    );
  }

  if (!entity) return null;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.hero}>
          {entity.logo ? (
            <Image source={{ uri: entity.logo }} style={styles.logo} contentFit="contain" />
          ) : (
            <View style={[styles.logo, styles.logoFallback]}>
              <Text style={styles.logoText}>{entity.name.charAt(0)}</Text>
            </View>
          )}
          <Text style={styles.entityName}>{entity.name}</Text>
          <Text style={styles.entityDesc}>{entity.description}</Text>
          <View style={styles.tagRow}>
            {entity.country && <View style={styles.tag}><Text style={styles.tagText}>{entity.country}</Text></View>}
            {entity.focus?.slice(0, 3).map((f) => (
              <View key={f} style={styles.tag}><Text style={styles.tagText}>{f}</Text></View>
            ))}
          </View>
        </View>

        {entity.stage && entity.stage.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Investment Stage</Text>
            <View style={styles.stageRow}>
              {entity.stage.map((s) => (
                <View key={s} style={styles.stageChip}>
                  <Text style={styles.stageText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.actionRow}>
          {entity.website && (
            <Pressable style={styles.websiteBtn} onPress={() => Linking.openURL(entity.website!)}>
              <Feather name="globe" size={16} color={Colors.brand.orange} />
              <Text style={styles.websiteBtnText}>Website</Text>
            </Pressable>
          )}
          <Pressable style={styles.applyBtn} onPress={() => setShowApplyForm(true)}>
            <Feather name="send" size={16} color="#fff" />
            <Text style={styles.applyBtnText}>Apply / Pitch</Text>
          </Pressable>
        </View>

        {showApplyForm && !applySuccess && (
          <View style={styles.applyForm}>
            <Text style={styles.applyFormTitle}>Submit Your Application</Text>
            {!!applyError && (
              <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={14} color={Colors.status.error} />
                <Text style={styles.errorText}>{applyError}</Text>
              </View>
            )}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Startup Name</Text>
              <TextInput style={styles.fieldInput} value={formStartup} onChangeText={setFormStartup} placeholder="Your startup name" placeholderTextColor={Colors.text.tertiary} />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Stage</Text>
              <TextInput style={styles.fieldInput} value={formStage} onChangeText={setFormStage} placeholder="e.g. Pre-seed, Seed, Series A" placeholderTextColor={Colors.text.tertiary} />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Pitch</Text>
              <TextInput
                style={[styles.fieldInput, { height: 100, textAlignVertical: 'top' }]}
                value={formPitch}
                onChangeText={setFormPitch}
                placeholder="Tell them about your startup and why you're applying..."
                placeholderTextColor={Colors.text.tertiary}
                multiline
              />
            </View>
            <Pressable
              style={({ pressed }) => [styles.submitBtn, { opacity: pressed || applyMutation.isPending ? 0.85 : 1 }]}
              onPress={() => applyMutation.mutate()}
              disabled={applyMutation.isPending}
            >
              <Text style={styles.submitBtnText}>{applyMutation.isPending ? 'Submitting...' : 'Submit Application'}</Text>
            </Pressable>
          </View>
        )}

        {applySuccess && (
          <View style={styles.successBanner}>
            <Feather name="check-circle" size={24} color={Colors.status.success} />
            <Text style={styles.successText}>Application submitted! They'll reach out soon.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.secondary },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.bg.primary, borderBottomWidth: 1, borderBottomColor: Colors.border.default },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  hero: { backgroundColor: Colors.bg.primary, alignItems: 'center', padding: 24, gap: 10 },
  logo: { width: 80, height: 80, borderRadius: 18, borderWidth: 1, borderColor: Colors.border.light },
  logoFallback: { backgroundColor: Colors.brand.light, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 30, fontWeight: '700', color: Colors.brand.orange, fontFamily: 'Inter_700Bold' },
  entityName: { fontSize: 22, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  entityDesc: { fontSize: 14, color: Colors.text.secondary, textAlign: 'center', lineHeight: 20, fontFamily: 'Inter_400Regular' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  tag: { backgroundColor: Colors.bg.tertiary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11, color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },
  section: { backgroundColor: Colors.bg.primary, padding: 16, gap: 10, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold' },
  stageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stageChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.brand.orange, backgroundColor: Colors.brand.light },
  stageText: { fontSize: 13, color: Colors.brand.orange, fontFamily: 'Inter_500Medium' },
  actionRow: { flexDirection: 'row', gap: 10, padding: 16, backgroundColor: Colors.bg.primary, marginTop: 8 },
  websiteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.brand.orange, backgroundColor: Colors.brand.light },
  websiteBtnText: { fontSize: 15, fontWeight: '600', color: Colors.brand.orange, fontFamily: 'Inter_600SemiBold' },
  applyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 12, backgroundColor: Colors.brand.orange },
  applyBtnText: { fontSize: 15, fontWeight: '600', color: '#fff', fontFamily: 'Inter_600SemiBold' },
  applyForm: { backgroundColor: Colors.bg.primary, margin: 16, borderRadius: 14, padding: 16, gap: 14, borderWidth: 1.5, borderColor: Colors.border.default },
  applyFormTitle: { fontSize: 17, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 8, padding: 10 },
  errorText: { flex: 1, fontSize: 13, color: Colors.status.error, fontFamily: 'Inter_400Regular' },
  field: { gap: 6 },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: Colors.text.primary, fontFamily: 'Inter_500Medium' },
  fieldInput: { borderWidth: 1.5, borderColor: Colors.border.default, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.text.primary, fontFamily: 'Inter_400Regular', backgroundColor: Colors.bg.secondary },
  submitBtn: { backgroundColor: Colors.brand.orange, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitBtnText: { fontSize: 15, fontWeight: '600', color: '#fff', fontFamily: 'Inter_600SemiBold' },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#D1FAE5', borderRadius: 12, padding: 16, margin: 16 },
  successText: { flex: 1, fontSize: 14, color: '#065F46', fontFamily: 'Inter_500Medium' },
});
