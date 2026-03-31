import { Feather } from '@expo/vector-icons';
import { useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { Colors } from '@/constants/Colors';
import { api, getApiError } from '@/lib/api';
import { adaptEntity } from '@/lib/adapters';
import type { EcosystemEntity } from '@/types';

const TYPES = [
  { key: 'company',        label: 'Companies',       singular: 'Company',        icon: 'briefcase' as const },
  { key: 'accelerator',    label: 'Accelerators',    singular: 'Accelerator',    icon: 'trending-up' as const },
  { key: 'investor',       label: 'Investors',       singular: 'Investment Firm', icon: 'dollar-sign' as const },
  { key: 'venture_studio', label: 'Venture Studios', singular: 'Venture Studio', icon: 'layers' as const },
];

const TYPE_API_ALIASES: Record<string, string[]> = {
  company:        ['company', 'startup'],
  accelerator:    ['accelerator'],
  investor:       ['investor', 'vc', 'venture_capital'],
  venture_studio: ['venture_studio', 'studio'],
};

interface EntityPage {
  items: EcosystemEntity[];
  hasMore: boolean;
  page: number;
}

function EntityLogoImage({ uri, name }: { uri?: string; name: string }) {
  const [err, setErr] = useState(false);
  useEffect(() => { setErr(false); }, [uri]);
  if (uri && !err) {
    return (
      <Image source={{ uri }} style={styles.logo} contentFit="contain" onError={() => setErr(true)} />
    );
  }
  return (
    <View style={[styles.logo, styles.logoFallback]}>
      <Text style={styles.logoText}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

interface SubmitFormProps {
  visible: boolean;
  defaultType: string;
  onClose: () => void;
  onSuccess: () => void;
}

function SubmitEntityModal({ visible, defaultType, onClose, onSuccess }: SubmitFormProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [type, setType] = useState(defaultType);
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [country, setCountry] = useState('');
  const [formError, setFormError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/entities', {
        name: name.trim(),
        type,
        description: description.trim(),
        website: website.trim() || undefined,
        country: country.trim() || undefined,
      }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
    },
    onError: (e) => {
      setFormError(getApiError(e));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  function reset() {
    setName(''); setType(defaultType); setDescription('');
    setWebsite(''); setCountry(''); setFormError(''); setSubmitted(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit() {
    setFormError('');
    if (!name.trim()) { setFormError('Name is required.'); return; }
    if (!description.trim()) { setFormError('Description is required.'); return; }
    mutation.mutate();
  }

  function handleSuccessDone() {
    reset();
    onSuccess();
    onClose();
  }

  const activeType = TYPES.find(t => t.key === type);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.modalContainer, { paddingTop: Platform.OS === 'web' ? 20 : 0 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>List Your Organization</Text>
            <Pressable onPress={handleClose} hitSlop={10} style={styles.modalCloseBtn}>
              <Feather name="x" size={22} color={Colors.text.secondary} />
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.modalBody, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {submitted ? (
              <View style={styles.successWrap}>
                <View style={styles.successIcon}>
                  <Feather name="check-circle" size={48} color={Colors.brand.orange} />
                </View>
                <Text style={styles.successTitle}>Submitted!</Text>
                <Text style={styles.successSubtitle}>
                  Your listing for <Text style={{ fontWeight: '700' }}>{name}</Text> has been submitted for review. We'll publish it once it's verified.
                </Text>
                <Pressable style={styles.submitBtn} onPress={handleSuccessDone}>
                  <Text style={styles.submitBtnText}>Done</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={styles.modalSubtitle}>
                  Submit your {activeType?.singular ?? 'organization'} to be listed in the Tech Launch ecosystem directory.
                </Text>

                {!!formError && (
                  <View style={styles.errorBanner}>
                    <Feather name="alert-circle" size={14} color={Colors.status.error} />
                    <Text style={styles.errorText}>{formError}</Text>
                  </View>
                )}

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Category</Text>
                  <View style={styles.typeRow}>
                    {TYPES.map(t => (
                      <Pressable
                        key={t.key}
                        style={[styles.typeChip, type === t.key && styles.typeChipActive]}
                        onPress={() => setType(t.key)}
                      >
                        <Text style={[styles.typeChipText, type === t.key && styles.typeChipTextActive]}>
                          {t.singular}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Organization Name <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={name}
                    onChangeText={setName}
                    placeholder={`e.g. ${activeType?.singular ?? 'Organization'} name`}
                    placeholderTextColor={Colors.text.tertiary}
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Description <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={[styles.fieldInput, styles.fieldMultiline]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="What does your organization do?"
                    placeholderTextColor={Colors.text.tertiary}
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Website</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={website}
                    onChangeText={setWebsite}
                    placeholder="https://yoursite.com"
                    placeholderTextColor={Colors.text.tertiary}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Country</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={country}
                    onChangeText={setCountry}
                    placeholder="e.g. Saudi Arabia, UAE, Egypt"
                    placeholderTextColor={Colors.text.tertiary}
                  />
                </View>

                <Pressable
                  style={({ pressed }) => [styles.submitBtn, { opacity: pressed || mutation.isPending ? 0.85 : 1 }]}
                  onPress={handleSubmit}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather name="send" size={16} color="#fff" />
                      <Text style={styles.submitBtnText}>Submit for Review</Text>
                    </>
                  )}
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function EcosystemScreen() {
  const { type: typeParam } = useLocalSearchParams<{ type?: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const validKeys = TYPES.map((t) => t.key);
  const initial = typeParam && validKeys.includes(typeParam) ? typeParam : 'company';
  const [activeType, setActiveType] = useState<string>(initial);
  const [showSubmit, setShowSubmit] = useState(false);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery<EntityPage>({
    queryKey: ['ecosystem-all'],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const res = await api.get('/entities', {
          params: { page: pageParam, limit: 100 },
        });
        const raw = Array.isArray(res.data?.data) ? res.data.data : [];
        const items = raw.map(adaptEntity);
        const pag = res.data?.pagination;
        const page = (pag?.page ?? pageParam) as number;
        const hasMore = pag ? pag.page < pag.pages : false;
        return { items, hasMore, page };
      } catch {
        return { items: [], hasMore: false, page: 1 };
      }
    },
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });

  const allEntities = data?.pages.flatMap((p) => p.items) ?? [];
  const aliases = TYPE_API_ALIASES[activeType] ?? [activeType];
  const entities = allEntities.filter(
    (e) => !e.type || aliases.includes((e.type as string).toLowerCase()),
  );
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Ecosystem</Text>
        <Pressable
          style={styles.addBtn}
          hitSlop={8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowSubmit(true);
          }}
        >
          <Feather name="plus" size={20} color={Colors.brand.orange} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        style={styles.tabsScroll}
      >
        {TYPES.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tab, activeType === t.key && styles.tabActive]}
            onPress={() => setActiveType(t.key)}
          >
            <Feather
              name={t.icon}
              size={14}
              color={activeType === t.key ? Colors.brand.orange : Colors.text.secondary}
            />
            <Text style={[styles.tabText, activeType === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.listContent}>
          {[1, 2, 3].map((i) => <View key={i} style={styles.skeleton} />)}
        </View>
      ) : (
        <FlatList
          data={entities}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
          onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.brand.orange}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, { opacity: pressed ? 0.95 : 1 }]}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/discover/ecosystem/[id]',
                  params: { id: item.slug ?? item.id },
                })
              }
            >
              <View style={styles.cardRow}>
                <EntityLogoImage uri={item.logo} name={item.name} />
                <View style={styles.cardInfo}>
                  <Text style={styles.entityName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {!!item.description && (
                    <Text style={styles.entityDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                  <View style={styles.tagRow}>
                    {item.country && (
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>{item.country}</Text>
                      </View>
                    )}
                    {item.stage?.slice(0, 2).map((s) => (
                      <View key={s} style={styles.tag}>
                        <Text style={styles.tagText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <Feather name="chevron-right" size={16} color={Colors.text.tertiary} />
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="layers"
              title="No results found"
              subtitle="None listed for this category yet"
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={Colors.brand.orange} style={{ paddingVertical: 16 }} />
            ) : null
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}

      <SubmitEntityModal
        visible={showSubmit}
        defaultType={activeType}
        onClose={() => setShowSubmit(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['ecosystem-all'] });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.secondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.bg.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.bg.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    fontFamily: 'Inter_700Bold',
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.brand.light,
    borderWidth: 1.5,
    borderColor: Colors.brand.orange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsScroll: {
    backgroundColor: Colors.bg.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Colors.bg.secondary,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
  },
  tabActive: { backgroundColor: Colors.brand.light, borderColor: Colors.brand.orange },
  tabText: { fontSize: 13, color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },
  tabTextActive: { color: Colors.brand.orange, fontFamily: 'Inter_600SemiBold' },
  listContent: { padding: 16 },
  skeleton: { height: 100, borderRadius: 14, backgroundColor: Colors.bg.tertiary },
  card: {
    backgroundColor: Colors.bg.primary,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    padding: 14,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 52, height: 52, borderRadius: 12, flexShrink: 0, overflow: 'hidden' },
  logoFallback: { backgroundColor: Colors.brand.light, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
  logoText: { fontSize: 20, fontWeight: '700', color: Colors.brand.orange, fontFamily: 'Inter_700Bold' },
  cardInfo: { flex: 1, gap: 4 },
  entityName: { fontSize: 15, fontWeight: '600', color: Colors.text.primary, fontFamily: 'Inter_600SemiBold' },
  entityDesc: { fontSize: 13, color: Colors.text.secondary, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tag: { backgroundColor: Colors.bg.tertiary, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  tagText: { fontSize: 11, color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },
  modalContainer: { flex: 1, backgroundColor: Colors.bg.primary },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold' },
  modalCloseBtn: { padding: 4 },
  modalBody: { padding: 20, gap: 18 },
  modalSubtitle: { fontSize: 14, color: Colors.text.secondary, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
  },
  errorText: { flex: 1, fontSize: 13, color: Colors.status.error, fontFamily: 'Inter_400Regular' },
  field: { gap: 7 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: Colors.text.primary, fontFamily: 'Inter_600SemiBold' },
  required: { color: Colors.status.error },
  fieldInput: {
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text.primary,
    fontFamily: 'Inter_400Regular',
    backgroundColor: Colors.bg.secondary,
  },
  fieldMultiline: { height: 110, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    backgroundColor: Colors.bg.secondary,
  },
  typeChipActive: { borderColor: Colors.brand.orange, backgroundColor: Colors.brand.light },
  typeChipText: { fontSize: 13, color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },
  typeChipTextActive: { color: Colors.brand.orange, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.brand.orange,
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 4,
  },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  successWrap: { alignItems: 'center', gap: 16, paddingTop: 40 },
  successIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.brand.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: { fontSize: 24, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold' },
  successSubtitle: { fontSize: 15, color: Colors.text.secondary, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
});
