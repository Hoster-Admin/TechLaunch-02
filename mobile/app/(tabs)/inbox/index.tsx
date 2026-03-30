import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { SidebarDrawer } from '@/components/SidebarDrawer';
import { Colors } from '@/constants/Colors';
import { api } from '@/lib/api';
import { adaptThread } from '@/lib/adapters';
import { timeAgo } from '@/lib/utils';
import type { Conversation } from '@/types';

export default function InboxScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const [inboxErrorDetail, setInboxErrorDetail] = useState('');
  const { data, isLoading, isError, refetch, isRefetching } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      setInboxErrorDetail('');
      try {
        const res = await api.get('/messages/threads');
        const raw = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data?.conversations)
          ? res.data.conversations
          : Array.isArray(res.data)
          ? res.data
          : [];
        return raw.map(adaptThread);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        const detail = [status ? `HTTP ${status}` : '', msg ?? ''].filter(Boolean).join(' — ');
        console.warn('[Inbox] Failed to load conversations:', detail || String(err));
        if (status === 401) console.warn('[Inbox] 401 Unauthorized — auth token may be missing or expired');
        setInboxErrorDetail(detail);
        throw err;
      }
    },
    retry: 1,
  });

  const conversations = data ?? [];

  return (
    <View style={styles.container}>
      <AppHeader onMenuPress={() => setDrawerOpen(true)} />
      <SidebarDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <View style={styles.titleRow}>
        <Text style={styles.screenTitle}>Inbox</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          {[1, 2, 3].map((i) => <View key={i} style={styles.skeleton} />)}
        </View>
      ) : isError ? (
        <View style={styles.errorWrap}>
          <Feather name="wifi-off" size={36} color={Colors.text.tertiary} />
          <Text style={styles.errorTitle}>Couldn't load messages</Text>
          <Text style={styles.errorSubtitle}>
            {inboxErrorDetail
              ? inboxErrorDetail.startsWith('HTTP')
                ? 'The server returned an error'
                : 'Check your connection and try again'
              : 'Check your connection and try again'}
          </Text>
          {!!inboxErrorDetail && (
            <Text style={styles.errorDetail}>{inboxErrorDetail}</Text>
          )}
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: 100 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!conversations.length}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.brand.orange}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="message-square"
              title="No messages yet"
              subtitle="Start a conversation by visiting someone's profile"
            />
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.threadCard, { opacity: pressed ? 0.95 : 1 }]}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/inbox/[id]',
                  params: { id: item.participant.username, name: item.participant.name },
                })
              }
            >
              <View style={styles.avatarWrap}>
                <Avatar uri={item.participant.avatar} name={item.participant.name} size={50} />
                {(item.unreadCount ?? 0) > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                  </View>
                )}
              </View>
              <View style={styles.threadInfo}>
                <View style={styles.threadTopRow}>
                  <Text
                    style={[
                      styles.participantName,
                      (item.unreadCount ?? 0) > 0 && styles.participantNameBold,
                    ]}
                  >
                    {item.participant.name}
                  </Text>
                  {!!timeAgo(item.updatedAt) && (
                    <Text style={styles.threadTime}>{timeAgo(item.updatedAt)}</Text>
                  )}
                </View>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {item.lastMessage?.body ?? 'No messages yet'}
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={Colors.text.tertiary} />
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  titleRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.primary,
    fontFamily: 'Inter_700Bold',
  },
  loadingWrap: { padding: 16, gap: 12 },
  skeleton: {
    height: 70,
    borderRadius: 14,
    backgroundColor: Colors.bg.tertiary,
  },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  errorSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  errorDetail: {
    fontSize: 11,
    color: Colors.text.tertiary,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 4,
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.brand.orange,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
  },
  listContent: { paddingVertical: 8 },
  threadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  avatarWrap: { position: 'relative' },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.brand.orange,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  unreadBadgeText: {
    fontSize: 9,
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  threadInfo: { flex: 1, gap: 4 },
  threadTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantName: {
    fontSize: 15,
    color: Colors.text.primary,
    fontFamily: 'Inter_500Medium',
  },
  participantNameBold: { fontFamily: 'Inter_700Bold', fontWeight: '700' },
  threadTime: {
    fontSize: 12,
    color: Colors.text.tertiary,
    fontFamily: 'Inter_400Regular',
  },
  lastMessage: {
    fontSize: 13,
    color: Colors.text.tertiary,
    fontFamily: 'Inter_400Regular',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginLeft: 78,
  },
});
