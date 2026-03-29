import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { ProductCard } from '@/components/ProductCard';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { api, getApiError } from '@/lib/api';
import { adaptProduct } from '@/lib/adapters';
import type { Product } from '@/types';

export default function SubmissionsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery<Product[]>({
    queryKey: ['submissions'],
    queryFn: async () => {
      const handle = user?.username;
      if (!handle) return [];
      const res = await api.get(`/users/${handle}`);
      const rawProducts = Array.isArray(res.data?.data?.products) ? res.data.data.products : [];
      return rawProducts.map(adaptProduct);
    },
    enabled: !!user?.username,
  });

  const upvoteMutation = useMutation({
    mutationFn: (id: string) => api.post(`/products/${id}/upvote`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['submissions'] }),
    onError: (e) => Alert.alert('Could not upvote', getApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['home-products'] });
    },
    onError: (e) => Alert.alert('Could not delete', getApiError(e)),
  });

  const handleDelete = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(product.id),
        },
      ],
    );
  };

  const handleEdit = (product: Product) => {
    router.push({
      pathname: '/(tabs)/discover/submit',
      params: {
        editId: product.id,
        editName: product.name,
        editTagline: product.tagline,
        editDescription: product.description ?? '',
        editWebsite: product.website ?? '',
        editIndustry: product.industry ?? '',
        editCountry: product.country ?? '',
      },
    });
  };

  const products = data ?? [];

  return (
    <FlatList
      data={products}
      keyExtractor={(p) => p.id}
      contentContainerStyle={[
        styles.list,
        { paddingBottom: Platform.OS === 'web' ? 100 : insets.bottom + 100 },
      ]}
      showsVerticalScrollIndicator={false}
      scrollEnabled={!!products.length}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.brand.orange} />}
      ListEmptyComponent={
        <View style={{ flex: 1 }}>
          <EmptyState
            icon="box"
            title={isLoading ? 'Loading...' : 'No submissions yet'}
            subtitle="Launch your first product and share it with the community"
          />
        </View>
      }
      renderItem={({ item }) => (
        <ProductCard
          product={item}
          onPress={() => router.push({ pathname: '/(tabs)/discover/[id]', params: { id: item.id } })}
          onUpvote={() => upvoteMutation.mutate(item.id)}
          onEdit={() => handleEdit(item)}
          onDelete={() => handleDelete(item)}
        />
      )}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, flexGrow: 1, backgroundColor: Colors.bg.secondary },
});
