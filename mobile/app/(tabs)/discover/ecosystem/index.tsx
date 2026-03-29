import { Feather } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { Colors } from '@/constants/Colors';
import { api } from '@/lib/api';
import { adaptEntity } from '@/lib/adapters';
import type { EcosystemEntity } from '@/types';

const TYPES = [
  { key: 'company',        label: 'Companies',             icon: 'briefcase' as const },
  { key: 'accelerator',    label: 'Accelerators',          icon: 'trending-up' as const },
  { key: 'investor',       label: 'Investors',             icon: 'dollar-sign' as const },
  { key: 'venture_studio', label: 'Venture Studios',       icon: 'layers' as const },
];

interface EntityPage {
  items: EcosystemEntity[];
  hasMore: boolean;
  page: number;
}

export default function EcosystemScreen() {
  const { type: typeParam } = useLocalSearchParams<{ type?: string }>();
  const insets = useSafeAreaInsets();
  const validKeys = TYPES.map((t) => t.key);
  const initial = typeParam && validKeys.includes(typeParam) ? typeParam : 'company';
  const [activeType, setActiveType] = useState<string>(initial);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery<EntityPage>({
    queryKey: ['ecosystem', activeType],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const res = await api.get('/entities', {
          params: { type: activeType, page: pageParam, limit: 20 },
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

  const entities = data?.pages.flatMap((p) => p.items) ?? [];

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Ecosystem</Text>
        <View style={{ width: 38 }} />
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
                {item.logo ? (
                  <Image source={{ uri: item.logo }} style={styles.logo} contentFit="contain" />
                ) : (
                  <View style={[styles.logo, styles.logoFallback]}>
                    <Text style={styles.logoText}>{item.name.charAt(0)}</Text>
                  </View>
                )}
                <View style={styles.cardInfo}>
                  <Text style={styles.entityName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.entityDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
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
              <ActivityIndicator
                color={Colors.brand.orange}
                style={{ paddingVertical: 16 }}
              />
            ) : null
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
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
  tabsScroll: {
    backgroundColor: Colors.bg.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: Colors.bg.secondary,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
  },
  tabActive: { backgroundColor: Colors.brand.light, borderColor: Colors.brand.orange },
  tabText: { fontSize: 13, color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },
  tabTextActive: { color: Colors.brand.orange },
  listContent: { padding: 16, gap: 12 },
  skeleton: { height: 100, borderRadius: 14, backgroundColor: Colors.bg.tertiary },
  card: {
    backgroundColor: Colors.bg.primary,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    padding: 14,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 52, height: 52, borderRadius: 12, flexShrink: 0 },
  logoFallback: {
    backgroundColor: Colors.brand.light,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.brand.orange,
    fontFamily: 'Inter_700Bold',
  },
  cardInfo: { flex: 1, gap: 4 },
  entityName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  entityDesc: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    fontFamily: 'Inter_400Regular',
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tag: { backgroundColor: Colors.bg.tertiary, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  tagText: { fontSize: 11, color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },
});
