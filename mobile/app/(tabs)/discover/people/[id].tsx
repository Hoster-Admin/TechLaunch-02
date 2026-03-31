import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { notifyFollow } from '@/lib/notify';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { PostCard } from '@/components/PostCard';
import { ProductCard } from '@/components/ProductCard';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { api, getApiError } from '@/lib/api';
import { adaptPost, adaptProduct, adaptUser } from '@/lib/adapters';
import { timeAgo } from '@/lib/utils';
import type { ActivityItem, Post, Product, User } from '@/types';

interface UserProfile { user: User; products: Product[]; posts: Post[]; activity: ActivityItem[]; interests: Product[] }

type ProfileTab = 'posts' | 'products' | 'activity' | 'interests';

const TABS: { id: ProfileTab; label: string }[] = [
  { id: 'posts',     label: 'Posts' },
  { id: 'products',  label: 'Products' },
  { id: 'activity',  label: 'Activity' },
  { id: 'interests', label: 'Interests' },
];

const ROLE_EMOJI: Record<string, string> = {
  founder: '🚀',
  investor: '💰',
  enthusiast: '🌟',
  developer: '💻',
  'product manager': '📋',
  accelerator: '🏢',
  designer: '🎨',
  marketer: '📣',
};

function getRoleEmoji(role?: string): string {
  if (!role) return '🌟';
  return ROLE_EMOJI[role.toLowerCase()] ?? '🌟';
}

function getSinceYear(createdAt?: string): string | null {
  if (!createdAt) return null;
  const year = new Date(createdAt).getFullYear();
  if (isNaN(year)) return null;
  return String(year);
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

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 0 : insets.top;
  const queryClient = useQueryClient();
  const { user: me } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [aboutExpanded, setAboutExpanded] = useState(false);

  const { data, isLoading } = useQuery<UserProfile>({
    queryKey: ['userProfile', id],
    queryFn: async () => {
      const [userRes, activityRes] = await Promise.all([
        api.get(`/users/${id}`),
        api.get(`/users/${id}/activity`).catch(() => ({ data: { data: [] } })),
      ]);
      const raw = userRes.data?.data ?? userRes.data;
      const user = adaptUser(raw);
      const products = Array.isArray(raw.products) ? raw.products.map(adaptProduct) : [];
      const posts = Array.isArray(raw.posts) ? raw.posts.map(adaptPost) : [];
      const actRaw =
        Array.isArray(activityRes.data?.data) ? activityRes.data.data :
        Array.isArray(activityRes.data?.activity) ? activityRes.data.activity :
        Array.isArray(activityRes.data) ? activityRes.data : [];
      const activity: ActivityItem[] = actRaw.map((a: Record<string, unknown>) => ({
        id: String(a.id ?? ''),
        type: String(a.type ?? 'unknown'),
        targetName: String(a.target_name ?? a.targetName ?? a.product_name ?? ''),
        targetId: String(a.target_id ?? a.targetId ?? ''),
        targetType: String(a.target_type ?? a.targetType ?? ''),
        body: a.body ? String(a.body) : undefined,
        createdAt: String(a.created_at ?? a.createdAt ?? ''),
      }));

      let interests: Product[] = [];
      try {
        const interestsRes = await api.get(`/users/${id}/interests`);
        const interestsRaw = interestsRes.data?.data ?? interestsRes.data ?? [];
        if (Array.isArray(interestsRaw) && interestsRaw.length > 0) {
          interests = interestsRaw.map(adaptProduct);
        } else {
          throw new Error('empty');
        }
      } catch {
        const upvoteItems = activity.filter(a => a.type === 'upvote' && a.targetId);
        if (upvoteItems.length > 0) {
          const settled = await Promise.allSettled(
            upvoteItems.slice(0, 20).map(a => api.get(`/products/${a.targetId}`))
          );
          interests = settled
            .filter((r): r is PromiseFulfilledResult<{ data: unknown }> => r.status === 'fulfilled')
            .map(r => adaptProduct((r.value.data as Record<string, unknown>)?.data ?? r.value.data));
        }
      }

      return { user, products, posts, activity, interests };
    },
  });

  const upvoteMutation = useMutation({
    mutationFn: (pid: string) => api.post(`/products/${pid}/upvote`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userProfile', id] }),
    onError: (e) => Alert.alert('Could not upvote', getApiError(e)),
  });

  const likeMutation = useMutation({
    mutationFn: (pid: string) => api.post(`/launcher/${pid}/like`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userProfile', id] }),
    onError: (e) => Alert.alert('Could not like', getApiError(e)),
  });

  const followMutation = useMutation({
    mutationFn: (isFollowing: boolean) =>
      isFollowing
        ? api.delete(`/users/${id}/follow`).catch(() => api.post(`/users/${id}/unfollow`))
        : api.post(`/users/${id}/follow`),
    onMutate: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    onSuccess: (_res, wasFollowing) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', id] });
      if (!wasFollowing) {
        const targetUsername = data?.user.username ?? id;
        const followerName = me?.username ?? me?.name ?? '';
        if (targetUsername && followerName && targetUsername !== followerName) {
          notifyFollow({ targetUsername, followerName });
        }
      }
    },
    onError: () => Alert.alert('Error', 'Could not update follow status. Please try again.'),
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: topPad + 10, paddingBottom: 12 }}>
          <Pressable onPress={() => router.back()} style={styles.backBtnCover}>
            <Feather name="arrow-left" size={22} color={Colors.text.primary} />
          </Pressable>
        </View>
        <ActivityIndicator color={Colors.brand.orange} style={{ marginTop: 60 }} />
      </View>
    );
  }

  if (!data) return null;
  const { user, products, posts, activity, interests } = data;
  const isOwnProfile = me?.username === user.username || me?.id === user.id;
  const isFollowing = user.isFollowing ?? false;
  const sinceYear = getSinceYear(user.createdAt);
  const roleEmoji = getRoleEmoji(user.role);

  const hasSocials = !!(user.website || user.twitter || user.linkedin);
  const hasAbout = !!(user.bio || sinceYear || user.country || hasSocials);

  function getListData(): Array<Product | Post | ActivityItem> {
    switch (activeTab) {
      case 'products': return products;
      case 'posts': return posts;
      case 'activity': return activity;
      case 'interests': return interests as unknown as Array<Product | Post | ActivityItem>;
      default: return [];
    }
  }

  const listData = getListData();

  return (
    <View style={styles.container}>
      <FlatList
        data={listData}
        keyExtractor={(item) => (item as { id: string }).id}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Cover banner */}
            <View style={[styles.cover, { paddingTop: topPad, backgroundColor: user.avatarColor ?? '#111827' }]}>
              <View style={[styles.coverInner, { paddingTop: topPad }]}>
                <Pressable onPress={() => router.back()} style={styles.backBtnCover}>
                  <Feather name="arrow-left" size={22} color="#fff" />
                </Pressable>
              </View>
            </View>

            {/* Avatar + buttons row */}
            <View style={{ backgroundColor: Colors.bg.primary }}>
              <View style={styles.avatarRow}>
                <View style={styles.avatarWrap}>
                  <Avatar uri={user.avatar} name={user.name} size={84} color={user.avatarColor} />
                </View>
                {!isOwnProfile && (
                  <View style={styles.actionBtns}>
                    <Pressable
                      style={[styles.followBtn, isFollowing && styles.followBtnActive]}
                      onPress={() => followMutation.mutate(isFollowing)}
                      disabled={followMutation.isPending}
                    >
                      <Feather
                        name={isFollowing ? 'user-check' : 'user-plus'}
                        size={14}
                        color={isFollowing ? Colors.status.success : '#fff'}
                      />
                      <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
                        {isFollowing ? 'Following' : '+ Follow'}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={styles.messageBtn}
                      onPress={() => router.push({ pathname: '/(tabs)/inbox/[id]', params: { id: user.username, name: user.name } })}
                    >
                      <Feather name="message-circle" size={14} color={Colors.text.secondary} />
                      <Text style={styles.messageBtnText}>Message</Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {/* Name / handle / role */}
              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                {user.username ? <Text style={styles.userHandle}>@{user.username}</Text> : null}
                {user.role ? (
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>{roleEmoji} {user.role}</Text>
                  </View>
                ) : null}

                {user.headline ? (
                  <Text style={styles.headline}>{user.headline}</Text>
                ) : null}

                {/* Collapsible About section */}
                {hasAbout ? (
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
                        {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
                        <View style={styles.metaRow}>
                          {sinceYear && (
                            <View style={styles.metaChip}>
                              <Feather name="calendar" size={12} color={Colors.text.secondary} />
                              <Text style={styles.metaChipText}>Since {sinceYear}</Text>
                            </View>
                          )}
                          {user.country && (
                            <View style={styles.metaChip}>
                              <Feather name="map-pin" size={12} color={Colors.text.secondary} />
                              <Text style={styles.metaChipText}>{user.country}</Text>
                            </View>
                          )}
                        </View>
                        {hasSocials && (
                          <View style={styles.socialRow}>
                            {user.website && (
                              <Pressable hitSlop={12} style={styles.socialBtn} onPress={() => Linking.openURL(user.website!)}>
                                <Feather name="globe" size={15} color={Colors.text.secondary} />
                              </Pressable>
                            )}
                            {user.twitter && (
                              <Pressable hitSlop={12} style={styles.socialBtn} onPress={() => Linking.openURL(user.twitter!.startsWith('http') ? user.twitter! : `https://x.com/${user.twitter}`)}>
                                <Text style={styles.xIcon}>𝕏</Text>
                              </Pressable>
                            )}
                            {user.linkedin && (
                              <Pressable hitSlop={12} style={styles.socialBtn} onPress={() => Linking.openURL(user.linkedin!)}>
                                <Feather name="linkedin" size={15} color={Colors.text.secondary} />
                              </Pressable>
                            )}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                ) : null}

                {/* Stats: Activity | Followers | Following */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{activity.length}</Text>
                    <Text style={styles.statLabel}>ACTIVITY</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <Pressable
                    style={styles.statItem}
                    onPress={() => router.push({
                      pathname: '/(tabs)/profile/follow-list',
                      params: { userId: user.username || user.id, type: 'followers' },
                    })}
                  >
                    <Text style={styles.statNumber}>{user.followersCount ?? 0}</Text>
                    <Text style={styles.statLabel}>FOLLOWERS</Text>
                  </Pressable>
                  <View style={styles.statDivider} />
                  <Pressable
                    style={styles.statItem}
                    onPress={() => router.push({
                      pathname: '/(tabs)/profile/follow-list',
                      params: { userId: user.username || user.id, type: 'following' },
                    })}
                  >
                    <Text style={styles.statNumber}>{user.followingCount ?? 0}</Text>
                    <Text style={styles.statLabel}>FOLLOWING</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Underline tab bar */}
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
          </View>
        }
        renderItem={({ item }) => {
          if (activeTab === 'activity') {
            const act = item as ActivityItem;
            const { verb, target } = activityLabel(act);
            return (
              <View style={styles.itemWrap}>
                <View style={styles.activityCard}>
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
                  </View>
                  {act.body && (
                    <View style={styles.activityBodyWrap}>
                      <Text style={styles.activityBody}>"{act.body}"</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          }
          if (activeTab === 'interests') {
            const product = item as Product;
            return (
              <View style={styles.itemWrap}>
                <ProductCard
                  product={product}
                  onPress={() => router.push({ pathname: '/(tabs)/discover/[id]', params: { id: product.id } })}
                  onUpvote={() => upvoteMutation.mutate(product.id)}
                  compact
                />
              </View>
            );
          }
          if (activeTab === 'products') {
            const product = item as Product;
            return (
              <View style={styles.itemWrap}>
                <ProductCard
                  product={product}
                  onPress={() => router.push({ pathname: '/(tabs)/discover/[id]', params: { id: product.id } })}
                  onUpvote={() => upvoteMutation.mutate(product.id)}
                  compact
                />
              </View>
            );
          }
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
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>
              {activeTab === 'activity' ? 'No activity yet'
                : activeTab === 'products' ? 'No products yet'
                : activeTab === 'interests' ? '✨ No interests yet'
                : 'No posts yet'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const COVER_HEIGHT = 140;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.secondary },

  cover: { height: COVER_HEIGHT, backgroundColor: '#111827' },
  coverInner: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  backBtnCover: { width: 36, height: 36, justifyContent: 'center' },

  avatarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: -42, marginBottom: 8 },
  avatarWrap: { borderRadius: 50, borderWidth: 3, borderColor: Colors.bg.primary },
  actionBtns: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  followBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: Colors.brand.orange },
  followBtnActive: { backgroundColor: '#D1FAE5', borderWidth: 1.5, borderColor: Colors.status.success },
  followBtnText: { fontSize: 13, fontWeight: '600', color: '#fff', fontFamily: 'Inter_600SemiBold' },
  followBtnTextActive: { color: Colors.status.success },
  messageBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border.default, backgroundColor: Colors.bg.primary },
  messageBtnText: { fontSize: 13, fontWeight: '500', color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },

  profileInfo: { backgroundColor: Colors.bg.primary, paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  userName: { fontSize: 22, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold' },
  userHandle: { fontSize: 14, color: Colors.brand.orange, fontFamily: 'Inter_400Regular', marginTop: -4 },
  roleBadge: { alignSelf: 'flex-start', backgroundColor: Colors.brand.light, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  roleBadgeText: { fontSize: 13, color: Colors.brand.orange, fontFamily: 'Inter_500Medium' },
  headline: { fontSize: 13, color: Colors.text.secondary, fontFamily: 'Inter_400Regular', marginTop: 2 },

  aboutSection: { gap: 6 },
  aboutHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  aboutLabel: { fontSize: 14, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold' },
  aboutBox: { backgroundColor: Colors.bg.secondary, borderRadius: 10, padding: 12, gap: 10 },
  bio: { fontSize: 14, color: Colors.text.secondary, lineHeight: 20, fontFamily: 'Inter_400Regular' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.bg.secondary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border.light },
  metaChipText: { fontSize: 13, color: Colors.text.secondary, fontFamily: 'Inter_400Regular' },
  socialRow: { flexDirection: 'row', gap: 8 },
  socialBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.bg.primary, borderWidth: 1, borderColor: Colors.border.default, justifyContent: 'center', alignItems: 'center' },
  xIcon: { fontSize: 14, fontWeight: '700', color: Colors.text.secondary, fontFamily: 'Inter_700Bold' },

  statsRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border.light, paddingTop: 14, marginTop: 4 },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statNumber: { fontSize: 20, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 10, color: Colors.text.tertiary, fontFamily: 'Inter_500Medium', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.border.light },

  tabBarWrap: { backgroundColor: Colors.bg.primary, borderBottomWidth: 1, borderBottomColor: Colors.border.default, marginTop: 8 },
  tabBar: { flexDirection: 'row', paddingVertical: 2 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: Colors.brand.orange },
  tabText: { fontSize: 13, fontWeight: '500', color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },
  tabTextActive: { color: Colors.brand.orange, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },

  itemWrap: { paddingHorizontal: 16, paddingTop: 12 },

  activityCard: { backgroundColor: Colors.bg.primary, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.default, padding: 14, gap: 10 },
  activityTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  activityLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  activityIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.brand.light, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  activityMeta: { flex: 1, gap: 2 },
  activityLabel: { fontSize: 13, color: Colors.text.secondary, fontFamily: 'Inter_400Regular' },
  activityTarget: { fontWeight: '600', color: Colors.brand.orange, fontFamily: 'Inter_600SemiBold' },
  activityTime: { fontSize: 12, color: Colors.text.tertiary, fontFamily: 'Inter_400Regular' },
  activityBodyWrap: { backgroundColor: Colors.bg.secondary, borderRadius: 8, padding: 10, borderLeftWidth: 3, borderLeftColor: Colors.border.default },
  activityBody: { fontSize: 13, color: Colors.text.secondary, fontFamily: 'Inter_400Regular', fontStyle: 'italic' },

  emptyWrap: { padding: 40, alignItems: 'center', gap: 10 },
  emptyText: { textAlign: 'center', color: Colors.text.tertiary, fontSize: 14, fontFamily: 'Inter_400Regular', padding: 32 },
});
