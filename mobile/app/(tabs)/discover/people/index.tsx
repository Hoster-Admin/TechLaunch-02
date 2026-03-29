import { Feather } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { Colors } from '@/constants/Colors';
import { api } from '@/lib/api';
import { adaptUser } from '@/lib/adapters';
import type { User } from '@/types';

interface PeoplePage {
  items: User[];
  hasMore: boolean;
  page: number;
}

export default function PeopleScreen() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const {
    data,
    isLoading,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<PeoplePage>({
    queryKey: ['people', search],
    queryFn: async ({ pageParam = 1 }) => {
      const params: Record<string, string | number> = {
        page: pageParam as number,
        limit: 20,
      };
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/users', { params });
      const body = res.data;
      const raw: unknown[] =
        Array.isArray(body?.data) ? body.data :
        Array.isArray(body?.users) ? body.users :
        Array.isArray(body?.members) ? body.members :
        Array.isArray(body) ? body :
        [];
      const items = (raw as Record<string, unknown>[]).map(adaptUser);
      const pag = body?.pagination;
      const page = (pag?.page ?? pageParam) as number;
      const hasMore = pag ? pag.page < pag.pages : false;
      return { items, hasMore, page };
    },
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    enabled: true,
  });

  const users = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : 0 }]}>
      <View style={styles.searchBar}>
        <Feather name="search" size={18} color={Colors.text.tertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search people..."
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

      {isLoading ? (
        <View style={styles.listContent}>
          {[1, 2, 3, 4].map((i) => <View key={i} style={styles.skeleton} />)}
        </View>
      ) : (
        <FlatList
          data={users}
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
          ListEmptyComponent={
            <EmptyState
              icon="users"
              title={search ? 'No people found' : 'No members yet'}
              subtitle={
                search
                  ? 'Try a different search term'
                  : 'Be the first to join the community'
              }
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
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.userCard, { opacity: pressed ? 0.95 : 1 }]}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/discover/people/[id]',
                  params: { id: item.username || item.id },
                })
              }
            >
              <Avatar uri={item.avatar} name={item.name} size={48} />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                {item.username && (
                  <Text style={styles.userHandle}>@{item.username}</Text>
                )}
                {item.role && <Text style={styles.userRole}>{item.role}</Text>}
                {item.country && (
                  <View style={styles.countryRow}>
                    <Feather name="map-pin" size={11} color={Colors.text.tertiary} />
                    <Text style={styles.countryText}>{item.country}</Text>
                  </View>
                )}
              </View>
              <Feather name="chevron-right" size={16} color={Colors.text.tertiary} />
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.secondary },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.bg.primary,
    borderRadius: 12,
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
  listContent: { paddingHorizontal: 16, gap: 10 },
  skeleton: { height: 70, borderRadius: 14, backgroundColor: Colors.bg.tertiary },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.bg.primary,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
  },
  userInfo: { flex: 1, gap: 2 },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  userHandle: { fontSize: 12, color: Colors.brand.orange, fontFamily: 'Inter_400Regular' },
  userRole: { fontSize: 13, color: Colors.text.secondary, fontFamily: 'Inter_400Regular' },
  countryRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  countryText: { fontSize: 12, color: Colors.text.tertiary, fontFamily: 'Inter_400Regular' },
});
