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
  ScrollView,
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

interface UserProfile { user: User; products: Product[]; posts: Post[]; activity: ActivityItem[] }

type ProfileTab = 'activity' | 'products' | 'posts' | 'articles';

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

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 0 : insets.top;
  const queryClient = useQueryClient();
  const { user: me } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('activity');
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
      return { user, products, posts, activity };
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
  const { user, products, posts, activity } = data;
  const articles = posts.filter(p => p.postType === 'article');
  const isOwnProfile = me?.username === user.username || me?.id === user.id;
  const isFollowing = user.isFollowing ?? false;
  const sinceYear = getSinceYear(user.createdAt);
  const roleEmoji = getRoleEmoji(user.role);

  const TABS: { key: ProfileTab; label: string; emoji: string; count?: number }[] = [
    { key: 'activity',  label: 'Activity',  emoji: '🗒️' },
    { key: 'products',  label: 'Products',  emoji: '🚀', count: products.length },
    { key: 'posts',     label: 'Posts',     emoji: '💬', count: posts.length },
    { key: 'articles',  label: 'Articles',  emoji: '📚', count: articles.length },
  ];

  function getActivityDescription(item: ActivityItem): string {
    switch (item.type) {
      case 'comment':  return `Commented on ${item.targetName}`;
      case 'upvote':   return `Upvoted ${item.targetName}`;
      case 'post':     return `Posted ${item.body ? `"${item.body.slice(0, 40)}..."` : ''}`;
      case 'follow':   return `Followed ${item.targetName}`;
      default:         return item.targetName ?? item.type;
    }
  }

  const activeContent = activeTab === 'products' ? products
    : activeTab === 'posts' ? posts
    : activeTab === 'articles' ? articles
    : [];

  return (
    <View style={styles.container}>
      <FlatList
        data={activeTab === 'activity' ? activity : activeContent as unknown[]}
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
            <View style={styles.avatarRow}>
              <View style={styles.avatarWrap}>
                <Avatar uri={user.avatar} name={user.name} size={84} />
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

              {/* Bio + since + country inside collapsible About */}
              {(user.bio || sinceYear || user.country) ? (
                <View style={styles.aboutSection}>
                  <Pressable style={styles.aboutHeader} onPress={() => setAboutExpanded(v => !v)}>
                    <Text style={styles.aboutLabel}>About {aboutExpanded ? '▲' : '▼'}</Text>
                  </Pressable>
                  {aboutExpanded && (
                    <View style={styles.aboutBox}>
                      {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
                      <View style={styles.metaRow}>
                        {sinceYear && (
                          <View style={styles.metaChip}>
                            <Text style={styles.metaChipText}>🗓️ Since {sinceYear}</Text>
                          </View>
                        )}
                        {user.country && (
                          <View style={styles.metaChip}>
                            <Feather name="map-pin" size={12} color={Colors.text.tertiary} />
                            <Text style={styles.metaChipText}>{user.country}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              ) : null}

              {/* Stats: Products | Followers | Following */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{products.length + posts.length + activity.filter(a => a.type === 'comment' || a.type === 'upvote').length}</Text>
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

              {/* Social links */}
              {(user.website || user.twitter || user.linkedin) ? (
                <View style={styles.socialRow}>
                  {user.website && (
                    <Pressable style={styles.socialBtn} onPress={() => Linking.openURL(user.website!)}>
                      <Feather name="globe" size={15} color={Colors.text.secondary} />
                    </Pressable>
                  )}
                  {user.twitter && (
                    <Pressable style={styles.socialBtn} onPress={() => Linking.openURL(user.twitter!.startsWith('http') ? user.twitter! : `https://x.com/${user.twitter}`)}>
                      <Text style={styles.xIcon}>𝕏</Text>
                    </Pressable>
                  )}
                  {user.linkedin && (
                    <Pressable style={styles.socialBtn} onPress={() => Linking.openURL(user.linkedin!)}>
                      <Feather name="linkedin" size={15} color={Colors.text.secondary} />
                    </Pressable>
                  )}
                </View>
              ) : null}
            </View>

            {/* Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
              {TABS.map(tab => (
                <Pressable
                  key={tab.key}
                  style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Text style={styles.tabEmoji}>{tab.emoji}</Text>
                  <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                    {tab.label}{tab.count !== undefined ? ` (${tab.count})` : ''}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => {
          if (activeTab === 'activity') {
            const a = item as ActivityItem;
            return (
              <View style={styles.activityItem}>
                <View style={styles.activityDot} />
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>{getActivityDescription(a)}</Text>
                  <Text style={styles.activityTime}>{timeAgo(a.createdAt)}</Text>
                </View>
              </View>
            );
          }
          if (activeTab === 'products' || activeTab === 'articles') {
            const product = item as Product;
            return (
              <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
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
            <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
              <PostCard
                post={post}
                onPress={() => router.push({ pathname: '/(tabs)/launcher/[id]', params: { id: post.id } })}
                onLike={() => likeMutation.mutate(post.id)}
              />
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {activeTab === 'activity' ? 'No activity yet'
              : activeTab === 'products' ? 'No products yet'
              : activeTab === 'articles' ? 'No articles yet'
              : 'No posts yet'}
          </Text>
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
  msgBtnCover: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },

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
  aboutHeader: { flexDirection: 'row', alignItems: 'center' },
  aboutLabel: { fontSize: 14, fontWeight: '600', color: Colors.text.secondary, fontFamily: 'Inter_600SemiBold' },
  aboutBox: { gap: 8, paddingTop: 4 },
  bio: { fontSize: 14, color: Colors.text.secondary, lineHeight: 20, fontFamily: 'Inter_400Regular' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.bg.secondary, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  metaChipText: { fontSize: 13, color: Colors.text.tertiary, fontFamily: 'Inter_400Regular' },
  statsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statNumber: { fontSize: 20, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 10, color: Colors.text.tertiary, fontFamily: 'Inter_500Medium', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.border.default },
  socialRow: { flexDirection: 'row', gap: 8 },
  socialBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.bg.secondary, borderWidth: 1.5, borderColor: Colors.border.default, justifyContent: 'center', alignItems: 'center' },
  xIcon: { fontSize: 14, fontWeight: '700', color: Colors.text.secondary, fontFamily: 'Inter_700Bold' },

  tabScroll: { backgroundColor: Colors.bg.primary, marginTop: 10 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: Colors.border.default },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border.default, backgroundColor: Colors.bg.secondary },
  tabActive: { backgroundColor: Colors.brand.light, borderColor: Colors.brand.orange },
  tabEmoji: { fontSize: 13 },
  tabText: { fontSize: 13, fontWeight: '500', color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },
  tabTextActive: { color: Colors.brand.orange },

  activityItem: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.bg.primary, marginBottom: 1 },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.brand.orange, marginTop: 5 },
  activityContent: { flex: 1, gap: 2 },
  activityText: { fontSize: 14, color: Colors.text.primary, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  activityTime: { fontSize: 12, color: Colors.text.tertiary, fontFamily: 'Inter_400Regular' },

  emptyText: { textAlign: 'center', color: Colors.text.tertiary, fontSize: 14, fontFamily: 'Inter_400Regular', padding: 32 },
});
