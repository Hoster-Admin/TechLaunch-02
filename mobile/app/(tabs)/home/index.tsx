import { Feather } from '@expo/vector-icons';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppHeader } from '@/components/AppHeader';
import { EmptyState } from '@/components/EmptyState';
import { ProductCard } from '@/components/ProductCard';
import { SidebarDrawer } from '@/components/SidebarDrawer';
import { Colors } from '@/constants/Colors';
import { api, getApiError } from '@/lib/api';
import { adaptProductsPage } from '@/lib/adapters';
import type { PaginatedResponse, Product } from '@/types';

type SortFilter = 'all' | 'new' | 'soon' | 'top';

const SORT_PILLS: { id: SortFilter; label: string; emoji?: string }[] = [
  { id: 'all',  label: 'All' },
  { id: 'new',  label: 'New',  emoji: '🆕' },
  { id: 'soon', label: 'Soon', emoji: '⏳' },
  { id: 'top',  label: 'Top',  emoji: '🏆' },
];

const COUNTRIES = ['All', 'Saudi Arabia', 'UAE', 'Egypt', 'Jordan', 'Lebanon', 'Kuwait', 'Qatar', 'Bahrain', 'Oman', 'Morocco', 'Tunisia', 'Iraq'];
const INDUSTRIES = ['All', 'Fintech', 'Edtech', 'Healthtech', 'E-Commerce Tech', 'Proptech', 'Agritech', 'Logistics Tech', 'AI & ML Tech', 'SaaS Tech', 'Gaming Tech', 'Cleantech', 'Foodtech', 'Traveltech', 'Cybersecurity Tech', 'HR & Work Tech', 'Media Tech', 'Dev Tools Tech', 'Web3 Tech'];

function getSortParams(sort: SortFilter): Record<string, string> {
  if (sort === 'new') return { sort: 'newest' };
  if (sort === 'top') return { sort: 'upvotes' };
  if (sort === 'soon') return { status: 'upcoming' };
  return {};
}

export default function HomeScreen() {
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sortFilter, setSortFilter] = useState<SortFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('All');
  const [industry, setIndustry] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const qKey = ['home-products', sortFilter, search, country, industry] as const;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch, isRefetching } =
    useInfiniteQuery<PaginatedResponse<Product>>({
      queryKey: qKey,
      queryFn: async ({ pageParam = 1 }) => {
        const params: Record<string, string | number> = {
          page: pageParam as number,
          limit: 20,
          ...getSortParams(sortFilter),
        };
        if (search) params.search = search;
        if (country !== 'All') params.country = country;
        if (industry !== 'All') params.industry = industry;
        const res = await api.get('/products', { params });
        return adaptProductsPage(res.data);
      },
      initialPageParam: 1,
      getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    });

  const upvoteMutation = useMutation({
    mutationFn: (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return api.post(`/products/${id}/upvote`);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: qKey });
      const prev = queryClient.getQueryData(qKey);
      queryClient.setQueryData<{ pages: PaginatedResponse<Product>[]; pageParams: unknown[] }>(qKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((p) =>
              p.id === id
                ? { ...p, upvoted: !p.upvoted, upvotes: p.upvoted ? Math.max(0, p.upvotes - 1) : p.upvotes + 1 }
                : p,
            ),
          })),
        };
      });
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(qKey, ctx.prev);
      Alert.alert('Could not upvote', getApiError(_err));
    },
  });

  const allProducts = data?.pages.flatMap((p) => p.items) ?? [];
  const totalCount = data?.pages[0]?.total ?? allProducts.length;
  const hasActiveFilters = country !== 'All' || industry !== 'All';

  const renderProduct = useCallback(
    ({ item, index }: { item: Product; index: number }) => (
      <ProductCard
        product={item}
        rank={index + 1}
        onPress={() => router.push({ pathname: '/(tabs)/home/[id]', params: { id: item.id } })}
        onUpvote={() => upvoteMutation.mutate(item.id)}
        upvotePending={upvoteMutation.isPending && upvoteMutation.variables === item.id}
      />
    ),
    [upvoteMutation],
  );

  const listTitle = search
    ? 'Search Results'
    : sortFilter === 'new'
    ? 'New Products'
    : sortFilter === 'soon'
    ? 'Coming Soon'
    : sortFilter === 'top'
    ? 'Top Products'
    : 'Today\'s Top Products';

  const ListHeader = (
    <>
      <View style={styles.listHeading}>
        <Text style={styles.listTitle}>{listTitle}</Text>
        {totalCount > 0 && (
          <Text style={styles.listCount}>{totalCount} products</Text>
        )}
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <AppHeader
        onMenuPress={() => setDrawerOpen(true)}
        onSearchChange={(text) => setSearchInput(text)}
      />
      <SidebarDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <View style={styles.pillRow}>
        <Pressable
          style={[styles.pill, styles.filtersPill, hasActiveFilters && styles.filtersPillActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Feather name="filter" size={13} color={hasActiveFilters ? Colors.brand.orange : Colors.text.secondary} />
          <Text style={[styles.pillText, hasActiveFilters && styles.pillTextOrange]}>Filters</Text>
          <Feather name="chevron-down" size={12} color={hasActiveFilters ? Colors.brand.orange : Colors.text.secondary} />
          {hasActiveFilters && <View style={styles.filterDot} />}
        </Pressable>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillScroll}>
          {SORT_PILLS.map((pill) => (
            <Pressable
              key={pill.id}
              style={[styles.pill, sortFilter === pill.id && styles.pillActive]}
              onPress={() => setSortFilter(pill.id)}
            >
              {pill.emoji && (
                <Text style={styles.pillEmoji}>{pill.emoji}</Text>
              )}
              <Text style={[styles.pillText, sortFilter === pill.id && styles.pillTextActive]}>
                {pill.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {showFilters && (
        <View style={styles.filterSection}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterLabel}>Country</Text>
            {country !== 'All' && (
              <Pressable onPress={() => setCountry('All')}>
                <Text style={styles.clearFilter}>Clear</Text>
              </Pressable>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterOptions}>
              {COUNTRIES.map((c) => (
                <Pressable
                  key={c}
                  style={[styles.filterOption, country === c && styles.filterOptionActive]}
                  onPress={() => setCountry(c)}
                >
                  <Text style={[styles.filterOptionText, country === c && styles.filterOptionTextActive]}>{c}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <View style={[styles.filterHeader, { marginTop: 8 }]}>
            <Text style={styles.filterLabel}>Industry</Text>
            {industry !== 'All' && (
              <Pressable onPress={() => setIndustry('All')}>
                <Text style={styles.clearFilter}>Clear</Text>
              </Pressable>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterOptions}>
              {INDUSTRIES.map((i) => (
                <Pressable
                  key={i}
                  style={[styles.filterOption, industry === i && styles.filterOptionActive]}
                  onPress={() => setIndustry(i)}
                >
                  <Text style={[styles.filterOptionText, industry === i && styles.filterOptionTextActive]}>{i}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {hasActiveFilters && (
            <Pressable
              style={styles.clearAllBtn}
              onPress={() => { setCountry('All'); setIndustry('All'); setShowFilters(false); }}
            >
              <Text style={styles.clearAllBtnText}>Clear All Filters</Text>
            </Pressable>
          )}
        </View>
      )}

      {isLoading ? (
        <View style={styles.listContent}>
          {[1, 2, 3, 4, 5].map(i => <View key={i} style={styles.skeleton} />)}
        </View>
      ) : (
        <FlatList
          data={allProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
          onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.brand.orange} />
          }
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <EmptyState
              icon="box"
              title="No products found"
              subtitle={search || hasActiveFilters ? 'Try adjusting your search or filters' : 'Be the first to launch in MENA'}
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={Colors.brand.orange} style={{ paddingVertical: 20 }} />
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
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    paddingLeft: 12,
  },
  pillScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    backgroundColor: Colors.bg.secondary,
  },
  filtersPill: {
    flexShrink: 0,
    marginVertical: 10,
    backgroundColor: Colors.bg.secondary,
    borderColor: Colors.border.default,
    position: 'relative',
  },
  filtersPillActive: {
    borderColor: Colors.brand.orange,
    backgroundColor: Colors.brand.light,
  },
  pillActive: {
    backgroundColor: Colors.brand.orange,
    borderColor: Colors.brand.orange,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
    fontFamily: 'Inter_600SemiBold',
  },
  pillTextActive: { color: '#fff' },
  pillTextOrange: { color: Colors.brand.orange },
  pillEmoji: { fontSize: 13 },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.brand.orange,
    marginLeft: 2,
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.bg.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.bg.secondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text.primary,
    fontFamily: 'Inter_400Regular',
  },
  filterSection: {
    backgroundColor: Colors.bg.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    paddingVertical: 10,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.tertiary,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearFilter: { fontSize: 13, color: Colors.brand.orange, fontFamily: 'Inter_500Medium' },
  filterOptions: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.bg.secondary,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
  },
  filterOptionActive: { backgroundColor: Colors.brand.orange, borderColor: Colors.brand.orange },
  filterOptionText: { fontSize: 13, color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },
  filterOptionTextActive: { color: '#fff' },
  clearAllBtn: {
    marginHorizontal: 16,
    marginTop: 10,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: Colors.bg.secondary,
    borderWidth: 1,
    borderColor: Colors.brand.orange,
    alignItems: 'center',
  },
  clearAllBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.brand.orange,
    fontFamily: 'Inter_600SemiBold',
  },
  listContent: { padding: 16, gap: 12 },
  listHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    fontFamily: 'Inter_700Bold',
  },
  listCount: {
    fontSize: 13,
    color: Colors.text.tertiary,
    fontFamily: 'Inter_400Regular',
  },
  skeleton: { height: 88, borderRadius: 14, backgroundColor: Colors.bg.tertiary },
});
