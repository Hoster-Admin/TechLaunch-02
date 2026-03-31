import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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

function EntityLogoImage({ uri, name }: { uri?: string; name: string }) {
  const [err, setErr] = useState(false);
  React.useEffect(() => { setErr(false); }, [uri]);
  if (uri && !err) {
    return (
      <Image source={{ uri }} style={[styles.logo, { overflow: 'hidden' }]} contentFit="contain" onError={() => setErr(true)} />
    );
  }
  return (
    <View style={[styles.logo, styles.logoFallback]}>
      <Text style={styles.logoText}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

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
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: topPad }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <EntityLogoImage uri={entity.logo} name={entity.name} />
          <Text style={styles.entityName}>{entity.name}</Text>
          {!!entity.description && (
            <Text style={styles.entityDesc}>{entity.description}</Text>
          )}
          {(entity.country || (entity.focus && entity.focus.length > 0)) && (
            <View style={styles.tagRow}>
              {entity.country && <View style={styles.tag}><Text style={styles.tagText}>{entity.country}</Text></View>}
              {entity.focus?.slice(0, 3).map((f) => (
                <View key={f} style={styles.tag}><Text style={styles.tagText}>{f}</Text></View>
              ))}
            </View>
          )}
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

        {showApplyForm && !applySuccess && (
          <View style={styles.applyForm}>
            <Text style={styles.applyFormTitle}>Submit Your Application</Text>
            <Text style={styles.applyFormSub}>
              Tell {entity.name} about your startup and why you'd be a great fit.
            </Text>
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
                style={[styles.fieldInput, { height: 110, textAlignVertical: 'top', paddingTop: 12 }]}
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
              <Text style={styles.submitBtnText}>{applyMutation.isPending ? 'Submitting…' : 'Submit Application'}</Text>
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

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {entity.website && (
          <Pressable
            style={({ pressed }) => [styles.websiteBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => Linking.openURL(entity.website!)}
          >
            <Feather name="globe" size={16} color={Colors.brand.orange} />
            <Text style={styles.websiteBtnText}>Website</Text>
          </Pressable>
        )}
        <Pressable
          style={({ pressed }) => [styles.applyBtn, { flex: entity.website ? 1 : undefined, opacity: pressed ? 0.85 : 1 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowApplyForm(v => !v);
          }}
        >
          <Feather name="send" size={16} color="#fff" />
          <Text style={styles.applyBtnText}>{showApplyForm ? 'Hide Form' : 'Apply / Pitch'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  logo: { width: 80, height: 80, borderRadius: 18 },
  logoFallback: { backgroundColor: Colors.brand.light, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 30, fontWeight: '700', color: Colors.brand.orange, fontFamily: 'Inter_700Bold' },
  entityName: { fontSize: 22, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  entityDesc: { fontSize: 14, color: Colors.text.secondary, textAlign: 'center', lineHeight: 20, fontFamily: 'Inter_400Regular' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  tag: { backgroundColor: Colors.bg.tertiary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 12, color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },
  section: { padding: 20, gap: 12, borderBottomWidth: 1, borderBottomColor: Colors.border.default },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold' },
  stageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stageChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.brand.orange, backgroundColor: Colors.brand.light },
  stageText: { fontSize: 13, color: Colors.brand.orange, fontFamily: 'Inter_500Medium' },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
    backgroundColor: Colors.bg.primary,
  },
  websiteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.brand.orange, backgroundColor: Colors.brand.light },
  websiteBtnText: { fontSize: 15, fontWeight: '600', color: Colors.brand.orange, fontFamily: 'Inter_600SemiBold' },
  applyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.brand.orange },
  applyBtnText: { fontSize: 15, fontWeight: '600', color: '#fff', fontFamily: 'Inter_600SemiBold' },
  applyForm: { margin: 16, borderRadius: 14, padding: 16, gap: 14, borderWidth: 1.5, borderColor: Colors.border.default, backgroundColor: Colors.bg.secondary },
  applyFormTitle: { fontSize: 17, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold' },
  applyFormSub: { fontSize: 13, color: Colors.text.secondary, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 8, padding: 10 },
  errorText: { flex: 1, fontSize: 13, color: Colors.status.error, fontFamily: 'Inter_400Regular' },
  field: { gap: 6 },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: Colors.text.primary, fontFamily: 'Inter_500Medium' },
  fieldInput: { borderWidth: 1.5, borderColor: Colors.border.default, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.text.primary, fontFamily: 'Inter_400Regular', backgroundColor: Colors.bg.primary },
  submitBtn: { backgroundColor: Colors.brand.orange, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitBtnText: { fontSize: 15, fontWeight: '600', color: '#fff', fontFamily: 'Inter_600SemiBold' },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#D1FAE5', borderRadius: 12, padding: 16, margin: 16 },
  successText: { flex: 1, fontSize: 14, color: '#065F46', fontFamily: 'Inter_500Medium' },
});
