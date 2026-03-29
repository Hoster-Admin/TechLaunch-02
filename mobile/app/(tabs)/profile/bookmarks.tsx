import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { PostCard } from '@/components/PostCard';
import { ProductCard } from '@/components/ProductCard';
import { Colors } from '@/constants/Colors';
import { api, getApiError } from '@/lib/api';
import { adaptPost, adaptProduct } from '@/lib/adapters';
import type { Post, Product } from '@/types';

type Tab = 'products' | 'posts';

export default function BookmarksScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('products');

  const bookmarksQuery = useQuery<{ products: Product[]; posts: Post[] }>({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      try {
        const res = await api.get('/users/me/bookmarks');
        const raw = res.data?.data ?? res.data;
        if (Array.isArray(raw)) {
          const products = raw.filter((b: Record<string, unknown>) => b.type === 'product' || b.name || b.tagline).map(adaptProduct);
          const posts = raw.filter((b: Record<string, unknown>) => b.type === 'post' || b.content || b.post_type).map(adaptPost);
          return { products, posts };
        }
        const products = Array.isArray(raw?.products) ? raw.products.map(adaptProduct) : [];
        const posts = Array.isArray(raw?.posts) ? raw.posts.map(adaptPost) : [];
        return { products, posts };
      } catch {
        return { products: [], posts: [] };
      }
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: (id: string) => api.post(`/products/${id}/bookmark`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
    onError: (e) => Alert.alert('Could not update bookmark', getApiError(e)),
  });

  const upvoteMutation = useMutation({
    mutationFn: (id: string) => api.post(`/products/${id}/upvote`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
    onError: (e) => Alert.alert('Could not upvote', getApiError(e)),
  });

  const likeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/launcher/${id}/like`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
    onError: (e) => Alert.alert('Could not like', getApiError(e)),
  });

  const handleBookmark = (product: Product) => {
    if (product.bookmarked) {
      Alert.alert(
        'Remove from Saved',
        `Are you sure you want to remove "${product.name}" from your saved products?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => bookmarkMutation.mutate(product.id),
          },
        ],
      );
    } else {
      bookmarkMutation.mutate(product.id);
    }
  };

  const isLoading = bookmarksQuery.isLoading;
  const isRefetching = bookmarksQuery.isRefetching;
  const refetch = bookmarksQuery.refetch;

  const products = bookmarksQuery.data?.products ?? [];
  const posts = bookmarksQuery.data?.posts ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg.secondary, paddingBottom: Platform.OS === 'web' ? 0 : insets.bottom }}>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'products' && styles.tabActive]}
          onPress={() => setActiveTab('products')}
        >
          <Feather name="box" size={14} color={activeTab === 'products' ? Colors.brand.orange : Colors.text.secondary} />
          <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>Products</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'posts' && styles.tabActive]}
          onPress={() => setActiveTab('posts')}
        >
          <Feather name="zap" size={14} color={activeTab === 'posts' ? Colors.brand.orange : Colors.text.secondary} />
          <Text style={[styles.tabText, activeTab === 'posts' && styles.tabTextActive]}>Posts</Text>
        </Pressable>
      </View>

      {activeTab === 'products' ? (
        <FlatList
          data={products}
          keyExtractor={(p) => p.id}
          contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!products.length}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.brand.orange} />}
          ListEmptyComponent={
            <View style={{ flex: 1 }}>
              <EmptyState
                icon="bookmark"
                title={isLoading ? 'Loading...' : 'No saved products'}
                subtitle="Save products to find them here"
              />
            </View>
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => router.push({ pathname: '/(tabs)/discover/[id]', params: { id: item.id } })}
              onUpvote={() => upvoteMutation.mutate(item.id)}
              onBookmark={() => handleBookmark(item)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!posts.length}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.brand.orange} />}
          ListEmptyComponent={
            <View style={{ flex: 1 }}>
              <EmptyState
                icon="bookmark"
                title={isLoading ? 'Loading...' : 'No saved posts'}
                subtitle="Save launcher posts to find them here"
              />
            </View>
          }
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={() => router.push({ pathname: '/(tabs)/launcher/[id]', params: { id: item.id } })}
              onLike={() => likeMutation.mutate(item.id)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8, padding: 12, backgroundColor: Colors.bg.primary, borderBottomWidth: 1, borderBottomColor: Colors.border.default },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.bg.secondary, borderWidth: 1.5, borderColor: Colors.border.default },
  tabActive: { backgroundColor: Colors.brand.light, borderColor: Colors.brand.orange },
  tabText: { fontSize: 13, fontWeight: '500', color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },
  tabTextActive: { color: Colors.brand.orange },
  list: { padding: 16, flexGrow: 1 },
});
