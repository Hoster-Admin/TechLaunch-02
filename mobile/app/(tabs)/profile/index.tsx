import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppHeader } from '@/components/AppHeader';
import { Avatar } from '@/components/Avatar';
import { PostCard } from '@/components/PostCard';
import { ProductCard } from '@/components/ProductCard';
import { SidebarDrawer } from '@/components/SidebarDrawer';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { api, getApiError } from '@/lib/api';
import { adaptActivityItem, adaptPost, adaptProduct, adaptUser } from '@/lib/adapters';
import { timeAgo } from '@/lib/utils';
import type { ActivityItem, Post, Product, User } from '@/types';

type ProfileTab = 'activity' | 'products' | 'posts' | 'interests';

const TABS: { id: ProfileTab; label: string }[] = [
  { id: 'posts', label: 'Posts' },
  { id: 'products', label: 'Products' },
  { id: 'activity', label: 'Activity' },
  { id: 'interests', label: 'Interests' },
];

function sinceYear(createdAt?: string): string | null {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  if (isNaN(d.getTime())) return null;
  return String(d.getFullYear());
}

function activityIcon(type: string): React.ComponentProps<typeof Feather>['name'] {
  switch (type) {
    case 'comment': return 'message-circle';
    case 'upvote': return 'arrow-up';
    case 'post': return 'edit-2';
    case 'follow': return 'user-plus';
    default: return 'bell';
  }
}

function activityLabel(item: ActivityItem): { verb: string; target: string } {
  switch (item.type) {
    case 'comment': return { verb: 'Commented on', target: item.targetName ?? '' };
    case 'upvote': return { verb: 'Upvoted', target: item.targetName ?? '' };
    case 'post': return { verb: 'Posted', target: item.targetName ?? '' };
    case 'follow': return { verb: 'Followed', target: item.targetName ?? '' };
    default: return { verb: 'Activity', target: item.targetName ?? '' };
  }
}

interface ProfileData {
  user: User;
  products: Product[];
  posts: Post[];
  articles: Post[];
  activity: ActivityItem[];
  bookmarksCount: number;
}

export default function ProfileScreen() {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);

  useEffect(() => {
    if (params.tab === 'products') {
      setActiveTab('products');
    }
  }, [params.tab]);

  const { data, isLoading } = useQuery<ProfileData>({
    queryKey: ['myProfile', me?.username],
    queryFn: async () => {
      if (!me?.username) return { user: me as User, products: [], posts: [], articles: [], activity: [], bookmarksCount: 0 };
      const res = await api.get(`/users/${me.username}`);
      const raw = res.data?.data ?? res.data ?? {};
      const user = adaptUser(raw);
      const products = Array.isArray(raw.products) ? raw.products.map(adaptProduct) : [];
      let posts: Post[] = Array.isArray(raw.posts) ? raw.posts.map(adaptPost) : [];
      try {
        const postsRes = await api.get(`/launcher?user=${me.username}&limit=50`);
        const postsRaw = postsRes.data?.data ?? postsRes.data ?? [];
        if (Array.isArray(postsRaw) && postsRaw.length > 0) posts = postsRaw.map(adaptPost);
      } catch { /* posts not available */ }
      let activity: ActivityItem[] = [];
      try {
        const actRes = await api.get(`/users/${me.username}/activity`);
        const actRaw = actRes.data?.data ?? actRes.data ?? [];
        activity = Array.isArray(actRaw) ? actRaw.map(adaptActivityItem) : [];
      } catch { /* activity not available */ }
      let articles: Post[] = [];
      try {
        const artRes = await api.get(`/launcher?user=${me.username}&post_type=article&limit=50`);
        const artRaw = artRes.data?.data ?? artRes.data ?? [];
        if (Array.isArray(artRaw)) articles = artRaw.map(adaptPost);
      } catch { /* articles not available */ }
      let bookmarksCount = 0;
      try {
        const bmRes = await api.get('/users/me/bookmarks');
        const bmRaw = bmRes.data?.data ?? bmRes.data ?? [];
        bookmarksCount = Array.isArray(bmRaw) ? bmRaw.length : 0;
      } catch { /* bookmarks not available */ }
      return { user, products, posts, articles, activity, bookmarksCount };
    },
    enabled: !!me?.username,
  });

  const upvoteMutation = useMutation({
    mutationFn: (id: string) => api.post(`/products/${id}/upvote`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myProfile', me?.username] }),
    onError: (e) => Alert.alert('Could not upvote', getApiError(e)),
  });

  const likeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/launcher/${id}/like`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myProfile', me?.username] }),
    onError: (e) => Alert.alert('Could not like', getApiError(e)),
  });

  const profile = data?.user ?? me;
  const products = data?.products ?? [];
  const posts = data?.posts ?? [];
  const articles = data?.articles ?? [];
  const activity = data?.activity ?? [];
  const bookmarksCount = data?.bookmarksCount ?? 0;
  const year = sinceYear(profile?.createdAt);
  const activityCount = activity.length;

  const upvotedActivity = activity.filter(a => a.type === 'upvote');

  function getListData(): Array<Product | Post | ActivityItem> {
    switch (activeTab) {
      case 'products': return products;
      case 'posts': return posts;
      case 'activity': return activity;
      case 'interests': return upvotedActivity;
      default: return [];
    }
  }

  const listData = getListData();

  const hasSocials = !!(profile?.website || profile?.twitter || profile?.linkedin);
  const hasAbout = !!(profile?.bio || year || profile?.country || hasSocials);

  const ProfileHeader = () => (
    <View>
      <View style={[styles.cover, { backgroundColor: profile?.avatarColor ?? '#111827' }]} />

      <View style={styles.profileTopRow}>
        <View style={styles.avatarContainer}>
          <Avatar uri={profile?.avatar} name={profile?.name ?? '?'} size={80} color={profile?.avatarColor} />
        </View>
        <View style={styles.headerBtns}>
          <Pressable
            style={({ pressed }) => [styles.editBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => router.push('/(tabs)/profile/settings/edit-profile')}
          >
            <Feather name="settings" size={13} color={Colors.text.secondary} />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.profileInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{profile?.name}</Text>
          {profile?.verified && (
            <View style={styles.verifiedIconWrap}>
              <Feather name="check-circle" size={18} color="#2563EB" />
            </View>
          )}
        </View>
        {profile?.username && (
          <Text style={styles.handle}>@{profile.username}</Text>
        )}
        {profile?.role && (
          <View style={styles.personaPill}>
            <Text style={styles.personaText}>{profile.role}</Text>
          </View>
        )}

        {profile?.headline ? (
          <Text style={styles.headlineText}>{profile.headline}</Text>
        ) : null}

        {hasAbout && (
          <View style={styles.aboutSection}>
            <Pressable style={styles.aboutHeader} onPress={() => setAboutExpanded(v => !v)}>
              <Text style={styles.aboutLabel}>About</Text>
              <Feather
                name={aboutExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={Colors.text.tertiary}
              />
            </Pressable>
            {aboutExpanded && (
              <View style={styles.aboutBox}>
                {profile?.bio ? <Text style={styles.aboutText}>{profile.bio}</Text> : null}
                <View style={styles.metaRow}>
                  {year && (
                    <View style={styles.sinceChip}>
                      <Feather name="calendar" size={12} color={Colors.text.secondary} />
                      <Text style={styles.sinceText}>Since {year}</Text>
                    </View>
                  )}
                  {profile?.country && (
                    <View style={styles.sinceChip}>
                      <Feather name="map-pin" size={12} color={Colors.text.secondary} />
                      <Text style={styles.sinceText}>{profile.country}</Text>
                    </View>
                  )}
                </View>
                {hasSocials && (
                  <View style={styles.socialRow}>
                    {profile?.website && (
                      <Pressable hitSlop={12} style={styles.socialBtn} onPress={() => Linking.openURL(profile.website!)}>
                        <Feather name="globe" size={15} color={Colors.text.secondary} />
                      </Pressable>
                    )}
                    {profile?.twitter && (
                      <Pressable hitSlop={12} style={styles.socialBtn} onPress={() => Linking.openURL(profile.twitter!.startsWith('http') ? profile.twitter! : `https://x.com/${profile.twitter}`)}>
                        <Text style={styles.xIcon}>𝕏</Text>
                      </Pressable>
                    )}
                    {profile?.linkedin && (
                      <Pressable hitSlop={12} style={styles.socialBtn} onPress={() => Linking.openURL(profile.linkedin!)}>
                        <Feather name="linkedin" size={15} color={Colors.text.secondary} />
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{activityCount}</Text>
            <Text style={styles.statLabel}>ACTIVITY</Text>
          </View>
          <View style={styles.statDivider} />
          <Pressable
            style={styles.statItem}
            onPress={() => router.push({
              pathname: '/(tabs)/profile/follow-list',
              params: { userId: profile?.username ?? profile?.id ?? me?.username ?? '', type: 'followers' },
            })}
          >
            <Text style={styles.statNumber}>{profile?.followersCount ?? 0}</Text>
            <Text style={styles.statLabel}>FOLLOWERS</Text>
          </Pressable>
          <View style={styles.statDivider} />
          <Pressable
            style={styles.statItem}
            onPress={() => router.push({
              pathname: '/(tabs)/profile/follow-list',
              params: { userId: profile?.username ?? profile?.id ?? me?.username ?? '', type: 'following' },
            })}
          >
            <Text style={styles.statNumber}>{profile?.followingCount ?? 0}</Text>
            <Text style={styles.statLabel}>FOLLOWING</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.tabBarWrap}>
        <View style={styles.tabBar}>
          {TABS.map(tab => (
            <Pressable
              key={tab.id}
              style={[styles.tabItem, activeTab === tab.id && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {activeTab === 'products' && (
        <Pressable
          style={styles.submitProductBtn}
          onPress={() => router.push('/(tabs)/discover/submit')}
        >
          <Feather name="plus" size={15} color={Colors.brand.orange} />
          <Text style={styles.submitProductText}>Submit a Product</Text>
        </Pressable>
      )}
    </View>
  );

  if (isLoading && !data) {
    return (
      <View style={styles.container}>
        <AppHeader onMenuPress={() => setDrawerOpen(true)} />
        <SidebarDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
        <ActivityIndicator color={Colors.brand.orange} style={{ marginTop: 60 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader onMenuPress={() => setDrawerOpen(true)} />
      <SidebarDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <FlatList
        data={listData}
        keyExtractor={(item, i) => ('id' in item ? item.id : String(i))}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ProfileHeader}
        renderItem={({ item }) => {
          if (activeTab === 'products') {
            const product = item as Product;
            return (
              <View style={styles.itemWrap}>
                <ProductCard
                  product={product}
                  onPress={() => router.push({ pathname: '/(tabs)/discover/[id]', params: { id: product.id } })}
                  onUpvote={() => upvoteMutation.mutate(product.id)}
                />
              </View>
            );
          }
          if (activeTab === 'posts') {
            const post = item as Post;
            return (
              <View style={styles.itemWrap}>
                <PostCard
                  post={post}
                  onPress={() => router.push({ pathname: '/(tabs)/launcher/[id]', params: { id: post.id } })}
                  onLike={() => likeMutation.mutate(post.id)}
                />
              </View>
            );
          }
          if (activeTab === 'activity') {
            const act = item as ActivityItem;
            const { verb, target } = activityLabel(act);
            const isNavigable = (act.type === 'comment' || act.type === 'upvote') && act.targetId;
            const handleActivityPress = () => {
              if (!isNavigable) return;
              router.push({
                pathname: '/(tabs)/discover/[id]',
                params: {
                  id: act.targetId!,
                  ...(act.type === 'comment' && act.commentId ? { scrollToComment: act.commentId } : {}),
                },
              });
            };
            const handleActivityMenu = () => {
              if (act.type !== 'comment') return;
              Alert.alert('Comment', undefined, [
                {
                  text: 'Delete Comment',
                  style: 'destructive',
                  onPress: () => Alert.alert('Delete this comment?', undefined, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete', style: 'destructive',
                      onPress: async () => {
                        try {
                          const endpoint = act.targetType === 'launcher'
                            ? `/launcher/comments/${act.id}`
                            : `/products/comments/${act.id}`;
                          await api.delete(endpoint);
                          queryClient.invalidateQueries({ queryKey: ['myProfile', me?.username] });
                        } catch { Alert.alert('Error', 'Could not delete comment.'); }
                      },
                    },
                  ]),
                },
                { text: 'Cancel', style: 'cancel' },
              ]);
            };
            return (
              <View style={styles.itemWrap}>
                <Pressable
                  style={({ pressed }) => [styles.activityCard, isNavigable && { opacity: pressed ? 0.92 : 1 }]}
                  onPress={handleActivityPress}
                  disabled={!isNavigable}
                >
                  <View style={styles.activityTop}>
                    <View style={styles.activityLeft}>
                      <View style={styles.activityIconWrap}>
                        <Feather name={activityIcon(act.type)} size={14} color={Colors.brand.orange} />
                      </View>
                      <View style={styles.activityMeta}>
                        <Text style={styles.activityLabel}>
                          {verb}{' '}
                          <Text style={styles.activityTarget}>{target}</Text>
                        </Text>
                        <Text style={styles.activityTime}>{timeAgo(act.createdAt)}</Text>
                      </View>
                    </View>
                    {act.type === 'comment' && (
                      <Pressable onPress={handleActivityMenu} hitSlop={8} style={styles.activityMenuBtn}>
                        <Feather name="more-vertical" size={15} color={Colors.text.tertiary} />
                      </Pressable>
                    )}
                  </View>
                  {act.body && (
                    <View style={styles.activityBodyWrap}>
                      <Text style={styles.activityBody}>"{act.body}"</Text>
                    </View>
                  )}
                </Pressable>
              </View>
            );
          }
          if (activeTab === 'interests') {
            const act = item as ActivityItem;
            return (
              <View style={styles.itemWrap}>
                <Pressable
                  style={({ pressed }) => [styles.interestCard, { opacity: pressed ? 0.9 : 1 }]}
                  onPress={() => router.push({ pathname: '/(tabs)/discover/[id]', params: { id: act.targetId! } })}
                >
                  <View style={styles.interestIcon}>
                    <Text style={{ fontSize: 18 }}>🎉</Text>
                  </View>
                  <Text style={styles.interestName} numberOfLines={1}>{act.targetName}</Text>
                  <Feather name="chevron-right" size={15} color={Colors.text.tertiary} />
                </Pressable>
              </View>
            );
          }
          return null;
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>
              {activeTab === 'activity' ? 'No activity yet' :
               activeTab === 'products' ? 'No products submitted yet' :
               activeTab === 'posts' ? 'No posts yet' :
               '✨ No interests yet'}
            </Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 40 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.secondary },
  cover: { height: 95, width: '100%' },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: -40,
    marginBottom: 12,
  },
  avatarContainer: {
    borderRadius: 44,
    borderWidth: 3,
    borderColor: Colors.bg.primary,
    overflow: 'hidden',
    width: 86,
    height: 86,
  },
  headerBtns: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.bg.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  editBtnText: { fontSize: 14, fontWeight: '500', color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },
  profileInfo: {
    backgroundColor: Colors.bg.primary,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 22, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold' },
  verifiedIconWrap: { marginLeft: 2, justifyContent: 'center', alignItems: 'center' },
  handle: { fontSize: 14, color: Colors.text.tertiary, fontFamily: 'Inter_400Regular', marginTop: -4 },
  personaPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.brand.light,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  personaText: { fontSize: 13, fontWeight: '600', color: Colors.brand.orange, fontFamily: 'Inter_600SemiBold' },
  headlineText: { fontSize: 13, color: Colors.text.secondary, fontFamily: 'Inter_400Regular', marginTop: 2 },
  aboutSection: { gap: 6 },
  aboutHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  aboutLabel: { fontSize: 14, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold' },
  aboutBox: {
    backgroundColor: Colors.bg.secondary,
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  aboutText: { fontSize: 14, color: Colors.text.secondary, lineHeight: 20, fontFamily: 'Inter_400Regular' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sinceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.bg.secondary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  sinceText: { fontSize: 13, color: Colors.text.secondary, fontFamily: 'Inter_400Regular' },
  socialRow: { flexDirection: 'row', gap: 8 },
  socialBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.bg.primary,
    borderWidth: 1,
    borderColor: Colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: 14,
    marginTop: 4,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statNumber: { fontSize: 23, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 9, color: Colors.text.tertiary, fontFamily: 'Inter_500Medium', letterSpacing: 0.6 },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.border.light },
  tabBarWrap: {
    backgroundColor: Colors.bg.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    marginTop: 8,
  },
  tabBar: { flexDirection: 'row', paddingVertical: 2 },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: Colors.brand.orange },
  tabText: { fontSize: 13, fontWeight: '500', color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },
  tabTextActive: { color: Colors.brand.orange, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  listContent: { paddingBottom: 120 },
  itemWrap: { paddingHorizontal: 16, paddingTop: 12 },
  activityCard: {
    backgroundColor: Colors.bg.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: 14,
    gap: 10,
  },
  activityTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  activityLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  activityIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.brand.light,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  activityMeta: { flex: 1, gap: 2 },
  activityLabel: { fontSize: 13, color: Colors.text.secondary, fontFamily: 'Inter_400Regular' },
  activityTarget: { fontWeight: '600', color: Colors.brand.orange, fontFamily: 'Inter_600SemiBold' },
  activityTime: { fontSize: 12, color: Colors.text.tertiary, fontFamily: 'Inter_400Regular' },
  activityBodyWrap: {
    backgroundColor: Colors.bg.secondary,
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.border.default,
  },
  activityBody: { fontSize: 13, color: Colors.text.secondary, fontFamily: 'Inter_400Regular', fontStyle: 'italic' },
  activityMenuBtn: { padding: 4 },
  interestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.bg.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: 14,
  },
  interestIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.brand.light, justifyContent: 'center', alignItems: 'center' },
  interestName: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text.primary, fontFamily: 'Inter_600SemiBold' },
  xIcon: { fontSize: 14, fontWeight: '700', color: Colors.text.secondary, fontFamily: 'Inter_700Bold' },
  emptyWrap: { padding: 40, alignItems: 'center', gap: 10 },
  emptyText: { color: Colors.text.tertiary, fontSize: 14, fontFamily: 'Inter_400Regular' },
  submitProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.brand.orange,
    backgroundColor: Colors.brand.light,
  },
  submitProductText: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.brand.orange, fontFamily: 'Inter_600SemiBold' },
});
