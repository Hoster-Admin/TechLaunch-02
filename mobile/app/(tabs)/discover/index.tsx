import { Feather } from '@expo/vector-icons';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppHeader } from '@/components/AppHeader';
import { EmptyState } from '@/components/EmptyState';
import { ProductCard } from '@/components/ProductCard';
import { SidebarDrawer } from '@/components/SidebarDrawer';
import { Colors } from '@/constants/Colors';
import { api } from '@/lib/api';
import { adaptProductsPage } from '@/lib/adapters';
import type { PaginatedResponse, Product } from '@/types';

const COUNTRIES = ['All', 'Saudi Arabia', 'UAE', 'Egypt', 'Jordan', 'Lebanon', 'Kuwait', 'Qatar', 'Bahrain', 'Oman', 'Morocco', 'Tunisia', 'Iraq'];
const INDUSTRIES = ['All', 'Fintech', 'EdTech', 'HealthTech', 'E-Commerce', 'PropTech', 'AgriTech', 'Logistics', 'AI/ML', 'SaaS', 'Gaming', 'CleanTech'];

export default function DiscoverScreen() {
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('All');
  const [industry, setIndustry] = useState('All');
  const [showCountryFilter, setShowCountryFilter] = useState(false);
  const [showIndustryFilter, setShowIndustryFilter] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch, isRefetching } =
    useInfiniteQuery<PaginatedResponse<Product>>({
      queryKey: ['products', search, country, industry],
      queryFn: async ({ pageParam = 1 }) => {
        const params: Record<string, string | number> = { page: pageParam as number, limit: 20 };
        if (search) params.search = search;
        if (country !== 'All') params.country = country;
        if (industry !== 'All') params.industry = industry;
        const res = await api.get('/products', { params });
        return adaptProductsPage(res.data);
      },
      initialPageParam: 1,
      getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    });

  const qKey = ['products', search, country, industry] as const;

  const upvoteMutation = useMutation({
    mutationFn: (id: string) => api.post(`/products/${id}/upvote`),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(qKey, ctx.prev);
    },
  });
  const bookmarkMutation = useMutation({
    mutationFn: (id: string) => api.post(`/products/${id}/bookmark`),
    onMutate: async (id) => {
      const qKey = ['products', search, country, industry] as const;
      await queryClient.cancelQueries({ queryKey: qKey });
      const prev = queryClient.getQueryData(qKey);
      queryClient.setQueryData<{ pages: PaginatedResponse<Product>[]; pageParams: unknown[] }>(qKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((p) =>
              p.id === id ? { ...p, bookmarked: !p.bookmarked } : p,
            ),
          })),
        };
      });
      return { prev, qKey };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(ctx.qKey, ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['home-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });

  const allProducts = data?.pages.flatMap((p) => p.items) ?? [];

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => (
      <ProductCard
        product={item}
        onPress={() => router.push({ pathname: '/(tabs)/discover/[id]', params: { id: item.id } })}
        onUpvote={() => upvoteMutation.mutate(item.id)}
        onBookmark={() => bookmarkMutation.mutate(item.id)}
        upvotePending={upvoteMutation.isPending && upvoteMutation.variables === item.id}
      />
    ),
    [upvoteMutation, bookmarkMutation],
  );

  return (
    <View style={styles.container}>
      <AppHeader onMenuPress={() => setDrawerOpen(true)} />
      <SidebarDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <View style={styles.headerSection}>
        <View style={styles.headerTopRow}>
          <Text style={styles.discoverTitle}>Discover</Text>
          <View style={styles.discoverActions}>
            <Pressable style={styles.headerBtn} onPress={() => router.push('/(tabs)/discover/ecosystem/')}>
              <Feather name="layers" size={19} color={Colors.text.secondary} />
            </Pressable>
            <Pressable style={styles.headerBtn} onPress={() => router.push('/(tabs)/discover/people/')}>
              <Feather name="users" size={19} color={Colors.text.secondary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Feather name="search" size={16} color={Colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={Colors.text.tertiary}
            value={searchInput}
            onChangeText={setSearchInput}
            returnKeyType="search"
          />
          {!!searchInput && (
            <Pressable onPress={() => { setSearchInput(''); setSearch(''); }}>
              <Feather name="x" size={16} color={Colors.text.tertiary} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.filterRow}>
        <Pressable
          style={[styles.filterChip, country !== 'All' && styles.filterChipActive]}
          onPress={() => setShowCountryFilter(!showCountryFilter)}
        >
          <Feather name="map-pin" size={13} color={country !== 'All' ? Colors.brand.orange : Colors.text.secondary} />
          <Text style={[styles.filterChipText, country !== 'All' && styles.filterChipTextActive]}>
            {country === 'All' ? 'Country' : country}
          </Text>
          <Feather name="chevron-down" size={13} color={country !== 'All' ? Colors.brand.orange : Colors.text.secondary} />
        </Pressable>
        <Pressable
          style={[styles.filterChip, industry !== 'All' && styles.filterChipActive]}
          onPress={() => setShowIndustryFilter(!showIndustryFilter)}
        >
          <Feather name="tag" size={13} color={industry !== 'All' ? Colors.brand.orange : Colors.text.secondary} />
          <Text style={[styles.filterChipText, industry !== 'All' && styles.filterChipTextActive]}>
            {industry === 'All' ? 'Industry' : industry}
          </Text>
          <Feather name="chevron-down" size={13} color={industry !== 'All' ? Colors.brand.orange : Colors.text.secondary} />
        </Pressable>
        {(country !== 'All' || industry !== 'All') && (
          <Pressable onPress={() => { setCountry('All'); setIndustry('All'); }}>
            <Text style={styles.clearFilter}>Clear</Text>
          </Pressable>
        )}
      </View>

      {showCountryFilter && (
        <View style={styles.filterDropdown}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterOptions}>
              {COUNTRIES.map((c) => (
                <Pressable
                  key={c}
                  style={[styles.filterOption, country === c && styles.filterOptionActive]}
                  onPress={() => { setCountry(c); setShowCountryFilter(false); }}
                >
                  <Text style={[styles.filterOptionText, country === c && styles.filterOptionTextActive]}>{c}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {showIndustryFilter && (
        <View style={styles.filterDropdown}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterOptions}>
              {INDUSTRIES.map((i) => (
                <Pressable
                  key={i}
                  style={[styles.filterOption, industry === i && styles.filterOptionActive]}
                  onPress={() => { setIndustry(i); setShowIndustryFilter(false); }}
                >
                  <Text style={[styles.filterOptionText, industry === i && styles.filterOptionTextActive]}>{i}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {isLoading ? (
        <View style={styles.listContent}>
          {[1,2,3,4].map(i => <View key={i} style={styles.skeleton} />)}
        </View>
      ) : (
        <FlatList
          data={allProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!allProducts.length}
          ListHeaderComponent={
            allProducts.length > 0 ? (
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderText}>
                  {search || country !== 'All' || industry !== 'All'
                    ? `${allProducts.length} result${allProducts.length !== 1 ? 's' : ''}`
                    : `Today · ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`}
                </Text>
                <Text style={styles.listHeaderCount}>{allProducts.length} products</Text>
              </View>
            ) : null
          }
          onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.brand.orange} />
          }
          ListEmptyComponent={
            <EmptyState icon="search" title="No products found" subtitle="Try adjusting your search or filters" />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={Colors.brand.orange} style={{ paddingVertical: 20 }} />
            ) : null
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.secondary },
  headerSection: {
    backgroundColor: Colors.bg.primary,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discoverTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    fontFamily: 'Inter_700Bold',
  },
  discoverActions: { flexDirection: 'row', gap: 6 },
  headerBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.bg.secondary,
    borderRadius: 10,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  searchInput: { flex: 1, paddingVertical: 9, fontSize: 14, color: Colors.text.primary, fontFamily: 'Inter_400Regular' },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.bg.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border.default, backgroundColor: Colors.bg.secondary },
  filterChipActive: { borderColor: Colors.brand.orange, backgroundColor: Colors.brand.light },
  filterChipText: { fontSize: 13, color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },
  filterChipTextActive: { color: Colors.brand.orange },
  clearFilter: { fontSize: 13, color: Colors.brand.orange, fontFamily: 'Inter_500Medium' },
  filterDropdown: { backgroundColor: Colors.bg.primary, borderBottomWidth: 1, borderBottomColor: Colors.border.default, paddingVertical: 8 },
  filterOptions: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  filterOption: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.bg.secondary, borderWidth: 1, borderColor: Colors.border.default },
  filterOptionActive: { backgroundColor: Colors.brand.orange, borderColor: Colors.brand.orange },
  filterOptionText: { fontSize: 13, color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },
  filterOptionTextActive: { color: '#fff' },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listHeaderText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  listHeaderCount: {
    fontSize: 12,
    color: Colors.text.tertiary,
    fontFamily: 'Inter_400Regular',
  },
  listContent: { padding: 16 },
  skeleton: { height: 104, borderRadius: 14, backgroundColor: Colors.bg.tertiary, marginBottom: 12 },
});
