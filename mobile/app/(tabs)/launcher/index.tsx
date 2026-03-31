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
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { PostCard } from '@/components/PostCard';
import { SidebarDrawer } from '@/components/SidebarDrawer';
import { WriteModal } from '@/components/WriteModal';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { api, getApiError } from '@/lib/api';
import { adaptPostsPage, adaptUsersPage } from '@/lib/adapters';
import type { PaginatedResponse, Post, User } from '@/types';

type LauncherTab = 'posts' | 'people';

const TABS: { id: LauncherTab; label: string }[] = [
  { id: 'posts', label: 'Posts' },
  { id: 'people', label: 'People' },
];

function PeopleList({ currentUser }: { currentUser: User | null }) {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery<PaginatedResponse<User>>({
      queryKey: ['launcher-people', search],
      queryFn: async ({ pageParam = 1 }) => {
        const params: Record<string, string | number> = { page: pageParam as number, limit: 20 };
        if (search.trim()) params.search = search.trim();
        const res = await api.get('/users/people', { params });
        return adaptUsersPage(res.data);
      },
      initialPageParam: 1,
      getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    });

  const followMutation = useMutation({
    mutationFn: (handle: string) => api.post(`/users/${handle}/follow`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['launcher-people'] }),
    onError: (e) => Alert.alert('Could not follow', getApiError(e)),
  });

  const people = data?.pages.flatMap(p => p.items) ?? [];

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.searchBar}>
        <Feather name="search" size={16} color={Colors.text.tertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search people..."
          placeholderTextColor={Colors.text.tertiary}
          value={searchInput}
          onChangeText={setSearchInput}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {!!searchInput && (
          <Pressable onPress={() => { setSearchInput(''); setSearch(''); }}>
            <Feather name="x" size={14} color={Colors.text.tertiary} />
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.brand.orange} style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={people}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.3}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.brand.orange} />}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={Colors.brand.orange} style={{ paddingVertical: 16 }} /> : null}
          renderItem={({ item }) => {
            const isMe = item.username === currentUser?.username;
            return (
              <Pressable
                style={({ pressed }) => [styles.personCard, { opacity: pressed ? 0.9 : 1 }]}
                onPress={() => router.push({ pathname: '/(tabs)/discover/people/[id]', params: { id: item.username } })}
              >
                <Avatar uri={item.avatar} name={item.name} size={46} />
                <View style={styles.personMeta}>
                  <Text style={styles.personName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.personHandle} numberOfLines={1}>@{item.username}</Text>
                  {item.role && <Text style={styles.personRole} numberOfLines={1}>{item.role}</Text>}
                </View>
                {!isMe && (
                  <Pressable
                    style={[styles.followBtn, item.isFollowing && styles.followBtnActive]}
                    onPress={() => followMutation.mutate(item.username || item.id)}
                  >
                    <Text style={[styles.followBtnText, item.isFollowing && styles.followBtnTextActive]}>
                      {item.isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </Pressable>
                )}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="users"
              title={search ? 'No people found' : 'No members yet'}
              subtitle={search ? 'Try a different search term' : 'Be the first to join the community'}
            />
          }
        />
      )}
    </View>
  );
}

export default function LauncherScreen() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<LauncherTab>('posts');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [writeModalOpen, setWriteModalOpen] = useState(false);

  const queryKey = ['launcher-posts'] as const;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useInfiniteQuery<PaginatedResponse<Post>>({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get('/launcher', { params: { page: pageParam, limit: 20 } });
      return adaptPostsPage(res.data);
    },
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    enabled: activeTab === 'posts',
  });

  const likeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/launcher/${id}/like`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (e) => Alert.alert('Could not like', getApiError(e)),
  });

  const deletePostMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/launcher/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (e) => Alert.alert('Could not delete post', getApiError(e)),
  });

  const posts = data?.pages.flatMap((p) => p.items) ?? [];

  const renderPost = useCallback(
    ({ item }: { item: Post }) => {
      const isOwn = item.user.username === user?.username;
      return (
        <PostCard
          post={item}
          onPress={() => router.push({ pathname: '/(tabs)/launcher/[id]', params: { id: item.id } })}
          onLike={() => likeMutation.mutate(item.id)}
          isOwn={isOwn}
          onEdit={() => router.push({
            pathname: '/(tabs)/launcher/compose',
            params: { editId: item.id, editTitle: item.title ?? '', editBody: item.body },
          })}
          onDelete={() => {
            Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deletePostMutation.mutate(item.id) },
            ]);
          }}
          onReport={() => api.post(`/launcher/${item.id}/report`).catch(() => {})}
        />
      );
    },
    [likeMutation, deletePostMutation, user],
  );

  return (
    <View style={styles.container}>
      <AppHeader onMenuPress={() => setDrawerOpen(true)} />
      <SidebarDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <WriteModal
        visible={writeModalOpen}
        onClose={() => setWriteModalOpen(false)}
        onSuccess={() => refetch()}
      />

      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <Pressable
            key={tab.id}
            style={[styles.tabItem, activeTab === tab.id && styles.tabItemActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab(tab.id);
            }}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'people' ? (
        <PeopleList currentUser={user} />
      ) : (
        <>
          {isError ? (
            <View style={styles.errorState}>
              <Feather name="alert-circle" size={28} color={Colors.text.tertiary} />
              <Text style={styles.errorStateTitle}>Couldn't load posts</Text>
              <Text style={styles.errorStateSubtitle}>Pull to refresh and try again</Text>
              <Pressable onPress={() => refetch()} style={styles.retryBtn}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </Pressable>
            </View>
          ) : isLoading ? (
            <View style={styles.skeletonWrap}>
              {[1, 2, 3].map((i) => <View key={i} style={styles.skeleton} />)}
            </View>
          ) : (
            <FlatList
              data={posts}
              keyExtractor={(item) => item.id}
              renderItem={renderPost}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
              onEndReachedThreshold={0.3}
              refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.brand.orange} />}
              ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={Colors.brand.orange} style={{ paddingVertical: 16 }} /> : null}
              ListEmptyComponent={
                <EmptyState
                  icon="zap"
                  title="No posts yet"
                  subtitle="Start the conversation in the MENA community"
                />
              }
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
          )}
        </>
      )}

      {activeTab === 'posts' && (
        <Pressable
          style={[styles.fab, { bottom: insets.bottom + 49 + 16 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setWriteModalOpen(true);
          }}
        >
          <Feather name="edit-3" size={22} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.secondary },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.bg.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    paddingHorizontal: 16,
  },
  tabItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabItemActive: { borderBottomColor: Colors.brand.orange },
  tabText: { fontSize: 14, fontWeight: '500', color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },
  tabTextActive: { color: Colors.brand.orange, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  skeletonWrap: { padding: 16, gap: 12 },
  skeleton: { height: 140, borderRadius: 14, backgroundColor: Colors.bg.tertiary },
  listContent: { padding: 16, paddingBottom: 120 },
  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  errorStateTitle: { fontSize: 16, fontWeight: '600', color: Colors.text.primary, fontFamily: 'Inter_600SemiBold' },
  errorStateSubtitle: { fontSize: 13, color: Colors.text.secondary, fontFamily: 'Inter_400Regular' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: Colors.brand.orange, borderRadius: 20, marginTop: 4 },
  retryBtnText: { fontSize: 14, fontWeight: '600', color: '#fff', fontFamily: 'Inter_600SemiBold' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 12,
    marginBottom: 4,
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
  personCard: {
    backgroundColor: Colors.bg.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  personMeta: { flex: 1, gap: 2 },
  personName: { fontSize: 14, fontWeight: '600', color: Colors.text.primary, fontFamily: 'Inter_600SemiBold' },
  personHandle: { fontSize: 12, color: Colors.text.tertiary, fontFamily: 'Inter_400Regular' },
  personRole: { fontSize: 12, color: Colors.brand.orange, fontFamily: 'Inter_400Regular', marginTop: 2 },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    backgroundColor: Colors.bg.secondary,
  },
  followBtnActive: { borderColor: Colors.brand.orange, backgroundColor: Colors.brand.light },
  followBtnText: { fontSize: 13, fontWeight: '600', color: Colors.text.secondary, fontFamily: 'Inter_600SemiBold' },
  followBtnTextActive: { color: Colors.brand.orange },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.brand.orange,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.brand.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
