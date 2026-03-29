import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React from 'react';
import {
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
import { Colors } from '@/constants/Colors';
import { api } from '@/lib/api';
import { adaptNotification } from '@/lib/adapters';
import { timeAgo } from '@/lib/utils';
import type { Notification } from '@/types';

type FeatherIconName = 'heart' | 'message-circle' | 'user-plus' | 'bell' | 'star' | 'trending-up' | 'at-sign';
const NOTIFICATION_ICONS: Record<string, FeatherIconName> = {
  like: 'heart',
  comment: 'message-circle',
  follow: 'user-plus',
  mention: 'at-sign',
  upvote: 'trending-up',
};

function navigateFromNotification(item: Notification) {
  const d = item.data ?? {};
  switch (item.type) {
    case 'like':
    case 'comment':
    case 'mention':
      if (d.post_id) {
        router.navigate({ pathname: '/(tabs)/launcher/[id]', params: { id: String(d.post_id) } });
      } else if (d.product_id) {
        router.navigate({ pathname: '/(tabs)/discover/[id]', params: { id: String(d.product_id) } });
      }
      break;
    case 'upvote':
      if (d.product_id) {
        router.navigate({ pathname: '/(tabs)/discover/[id]', params: { id: String(d.product_id) } });
      } else if (d.post_id) {
        router.navigate({ pathname: '/(tabs)/launcher/[id]', params: { id: String(d.post_id) } });
      }
      break;
    case 'follow':
      if (d.user_handle || d.username) {
        router.navigate({ pathname: '/(tabs)/discover/people/[id]', params: { id: String(d.user_handle ?? d.username) } });
      }
      break;
    default:
      break;
  }
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const res = await api.get('/users/me/notifications');
        const raw = Array.isArray(res.data?.data) ? res.data.data : [];
        return raw.map(adaptNotification);
      } catch {
        return [];
      }
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.post('/users/me/notifications/read'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.post('/users/me/notifications/read', { id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.topBarTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <Pressable
            style={styles.markAllBtn}
            onPress={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingList}>
          {[1, 2, 3, 4].map((i) => <View key={i} style={styles.skeleton} />)}
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.brand.orange} />}
          ListEmptyComponent={
            <EmptyState
              icon="bell"
              title="No notifications yet"
              subtitle="Activity from your products and posts will appear here"
            />
          }
          renderItem={({ item }) => {
            const iconName = NOTIFICATION_ICONS[item.type] ?? 'bell';
            return (
              <Pressable
                style={({ pressed }) => [
                  styles.notifCard,
                  !item.read && styles.notifCardUnread,
                  { opacity: pressed ? 0.9 : 1 },
                ]}
                onPress={() => {
                  if (!item.read) markReadMutation.mutate(item.id);
                  navigateFromNotification(item);
                }}
              >
                <View style={[styles.iconWrap, !item.read && styles.iconWrapUnread]}>
                  <Feather name={iconName} size={18} color={!item.read ? Colors.brand.orange : Colors.text.secondary} />
                </View>
                <View style={styles.notifContent}>
                  <Text style={[styles.notifMessage, !item.read && styles.notifMessageBold]}>
                    {item.message}
                  </Text>
                  <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
                </View>
                {!item.read && <View style={styles.unreadDot} />}
              </Pressable>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.secondary },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.bg.primary, borderBottomWidth: 1, borderBottomColor: Colors.border.default },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  topBarTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold' },
  markAllBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  markAllText: { fontSize: 13, color: Colors.brand.orange, fontFamily: 'Inter_500Medium' },
  loadingList: { padding: 16, gap: 12 },
  skeleton: { height: 70, borderRadius: 14, backgroundColor: Colors.bg.tertiary },
  list: { paddingVertical: 8 },
  notifCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Colors.bg.primary },
  notifCardUnread: { backgroundColor: '#FFF7F4' },
  iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bg.tertiary, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  iconWrapUnread: { backgroundColor: Colors.brand.light },
  notifContent: { flex: 1, gap: 3 },
  notifMessage: { fontSize: 14, color: Colors.text.primary, lineHeight: 20, fontFamily: 'Inter_400Regular' },
  notifMessageBold: { fontFamily: 'Inter_500Medium' },
  notifTime: { fontSize: 12, color: Colors.text.tertiary, fontFamily: 'Inter_400Regular' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.brand.orange },
  divider: { height: 1, backgroundColor: Colors.border.light },
});
