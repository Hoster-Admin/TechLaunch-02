import { Feather } from '@expo/vector-icons';
import { useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
  { key: 'company',        label: 'Companies',       singular: 'Company',         icon: 'briefcase' as const },
  { key: 'accelerator',    label: 'Accelerators',    singular: 'Accelerator',     icon: 'trending-up' as const },
  { key: 'investor',       label: 'Investors',        singular: 'Investment Firm', icon: 'dollar-sign' as const },
  { key: 'venture_studio', label: 'Venture Studios', singular: 'Venture Studio',  icon: 'layers' as const },
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
  const [industry, setIndustry] = useState('');
  const [founded, setFounded] = useState('');
  const [twitter, setTwitter] = useState('');
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
        focus: industry.trim() ? industry.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        founded_year: founded.trim() ? Number(founded.trim()) : undefined,
        twitter: twitter.trim() || undefined,
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
    setWebsite(''); setCountry(''); setIndustry(''); setFounded('');
    setTwitter(''); setFormError(''); setSubmitted(false);
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

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Industry / Focus</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={industry}
                    onChangeText={setIndustry}
                    placeholder="e.g. Foodtech, Fintech, SaaS"
                    placeholderTextColor={Colors.text.tertiary}
                  />
                  <Text style={styles.fieldHint}>Separate multiple with commas</Text>
                </View>

                <View style={styles.fieldRow}>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Founded Year</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={founded}
                      onChangeText={setFounded}
                      placeholder="e.g. 2023"
                      placeholderTextColor={Colors.text.tertiary}
                      keyboardType="number-pad"
                      maxLength={4}
                    />
                  </View>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Twitter / X</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={twitter}
                      onChangeText={setTwitter}
                      placeholder="@handle"
                      placeholderTextColor={Colors.text.tertiary}
                      autoCapitalize="none"
                    />
                  </View>
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
  const [search, setSearch] = useState('');

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
        const raw = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : [];
        const items = raw.map(adaptEntity).filter((e: EcosystemEntity) => !!e.name);
        const pag = res.data?.pagination ?? res.data?.meta;
        const page = (pag?.page ?? pageParam) as number;
        const hasMore = pag ? (pag.page ?? 1) < (pag.pages ?? pag.total_pages ?? 1) : false;
        return { items, hasMore, page };
      } catch {
        return { items: [], hasMore: false, page: 1 };
      }
    },
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });

  const allEntities = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

  const countByType = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of TYPES) {
      const a = TYPE_API_ALIASES[t.key] ?? [t.key];
      counts[t.key] = allEntities.filter(
        (e) => !e.type || a.includes((e.type as string).toLowerCase()),
      ).length;
    }
    return counts;
  }, [allEntities]);

  const entities = useMemo(() => {
    const aliases = TYPE_API_ALIASES[activeType] ?? [activeType];
    const byType = allEntities.filter(
      (e) => !e.type || aliases.includes((e.type as string).toLowerCase()),
    );
    if (!search.trim()) return byType;
    const q = search.trim().toLowerCase();
    return byType.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.country?.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.focus?.some((f) => f.toLowerCase().includes(q)),
    );
  }, [allEntities, activeType, search]);

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
        {TYPES.map((t) => {
          const count = countByType[t.key] ?? 0;
          const isActive = activeType === t.key;
          return (
            <Pressable
              key={t.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => {
                if (activeType !== t.key) {
                  Haptics.selectionAsync();
                  setActiveType(t.key);
                  setSearch('');
                }
              }}
            >
              <Feather
                name={t.icon}
                size={14}
                color={isActive ? Colors.brand.orange : Colors.text.secondary}
              />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {t.label}
              </Text>
              {count > 0 && (
                <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                  <Text style={[styles.countBadgeText, isActive && styles.countBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.searchWrap}>
        <Feather name="search" size={15} color={Colors.text.tertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={`Search ${TYPES.find(t => t.key === activeType)?.label ?? ''}…`}
          placeholderTextColor={Colors.text.tertiary}
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {isLoading ? (
        <View style={[styles.listContent, { gap: 12 }]}>
          {[1, 2, 3, 4].map((i) => <View key={i} style={styles.skeleton} />)}
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={entities}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
          onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.3}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.brand.orange}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, { opacity: pressed ? 0.93 : 1 }]}
              onPress={() => {
                Haptics.selectionAsync();
                router.push({
                  pathname: '/(tabs)/discover/ecosystem/[id]',
                  params: { id: item.slug ?? item.id },
                });
              }}
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
                  {(item.country || (item.focus && item.focus.length > 0) || (item.stage && item.stage.length > 0)) && (
                    <View style={styles.tagRow}>
                      {item.country && (
                        <View style={styles.tag}>
                          <Feather name="map-pin" size={10} color={Colors.text.tertiary} />
                          <Text style={styles.tagText}>{item.country}</Text>
                        </View>
                      )}
                      {item.focus?.slice(0, 2).map((f) => (
                        <View key={f} style={styles.tagFocus}>
                          <Text style={styles.tagFocusText}>{f}</Text>
                        </View>
                      ))}
                      {item.stage?.slice(0, 1).map((s) => (
                        <View key={s} style={styles.tag}>
                          <Text style={styles.tagText}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                <Feather name="chevron-right" size={16} color={Colors.text.tertiary} />
              </View>
            </Pressable>
          )}
          ListHeaderComponent={
            entities.length > 0 && !search ? (
              <Text style={styles.listCount}>
                {entities.length} {TYPES.find(t => t.key === activeType)?.label ?? 'results'}
              </Text>
            ) : search && entities.length > 0 ? (
              <Text style={styles.listCount}>
                {entities.length} result{entities.length !== 1 ? 's' : ''} for "{search}"
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="layers"
              title={search ? 'No matches found' : 'Nothing here yet'}
              subtitle={
                search
                  ? `No results for "${search}" in this category`
                  : 'None listed for this category yet'
              }
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={Colors.brand.orange} style={{ paddingVertical: 16 }} />
            ) : null
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
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
    flexGrow: 0,
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
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Colors.bg.secondary,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
  },
  tabActive: { backgroundColor: Colors.brand.light, borderColor: Colors.brand.orange },
  tabText: { fontSize: 13, color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },
  tabTextActive: { color: Colors.brand.orange, fontFamily: 'Inter_600SemiBold' },
  countBadge: {
    backgroundColor: Colors.border.default,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  countBadgeActive: { backgroundColor: Colors.brand.orange },
  countBadgeText: { fontSize: 10, color: Colors.text.secondary, fontFamily: 'Inter_600SemiBold' },
  countBadgeTextActive: { color: '#fff' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.primary,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    fontFamily: 'Inter_400Regular',
    padding: 0,
  },
  listContent: { paddingTop: 12, paddingHorizontal: 16 },
  listCount: {
    fontSize: 12,
    color: Colors.text.tertiary,
    fontFamily: 'Inter_500Medium',
    marginBottom: 10,
  },
  skeleton: { height: 80, borderRadius: 14, backgroundColor: Colors.border.default },
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
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, alignItems: 'center' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.bg.tertiary,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tagText: { fontSize: 11, color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },
  tagFocus: {
    backgroundColor: Colors.brand.light,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tagFocusText: { fontSize: 11, color: Colors.brand.orange, fontFamily: 'Inter_500Medium' },
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
  fieldHint: { fontSize: 12, color: Colors.text.tertiary, fontFamily: 'Inter_400Regular' },
  fieldRow: { flexDirection: 'row', gap: 12 },
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
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: Colors.brand.orange,
    marginTop: 4,
  },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: '#fff', fontFamily: 'Inter_600SemiBold' },
  successWrap: { alignItems: 'center', gap: 16, paddingVertical: 40 },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.brand.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: { fontSize: 22, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold' },
  successSubtitle: { fontSize: 14, color: Colors.text.secondary, textAlign: 'center', lineHeight: 20, fontFamily: 'Inter_400Regular', paddingHorizontal: 20 },
});
