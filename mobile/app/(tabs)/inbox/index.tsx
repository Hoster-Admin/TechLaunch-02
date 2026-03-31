import { Feather } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
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
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { adaptThread, adaptDirectMessage } from '@/lib/adapters';
import { timeAgo } from '@/lib/utils';
import type { Conversation, DirectMessage } from '@/types';

export default function InboxScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuth();

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
        const conversations = raw.map(adaptThread);

        const missing = conversations.filter((c: Conversation) => !c.lastMessage?.body?.trim());
        if (missing.length > 0) {
          await Promise.all(
            missing.map(async (conv: Conversation) => {
              const username = conv.participant.username;
              if (!username) return;
              try {
                const msgRes = await api.get(`/messages/${username}`);
                const msgs = Array.isArray(msgRes.data?.data)
                  ? msgRes.data.data
                  : Array.isArray(msgRes.data?.messages)
                  ? msgRes.data.messages
                  : Array.isArray(msgRes.data)
                  ? msgRes.data
                  : [];
                if (msgs.length > 0) {
                  const last = adaptDirectMessage(msgs[msgs.length - 1]);
                  conv.lastMessage = {
                    body: last.body,
                    senderHandle: last.senderHandle,
                    createdAt: last.createdAt,
                  };
                }
              } catch {
                // silently ignore per-thread fetch failures
              }
            })
          );
        }

        return conversations;
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
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);

  function getLastMessagePreview(item: Conversation): string {
    const getBody = () => {
      const body = item.lastMessage?.body || '';
      if (body) return { body, senderHandle: item.lastMessage?.senderHandle ?? '' };
      const cached = queryClient.getQueryData<DirectMessage[]>(['conversation', item.participant.username]);
      if (cached && cached.length > 0) {
        const last = cached[cached.length - 1];
        return { body: last.body || '', senderHandle: last.senderHandle || '' };
      }
      return { body: '', senderHandle: '' };
    };
    const { body, senderHandle } = getBody();
    if (!body) return '';
    const isMe = senderHandle && user?.username && senderHandle === user.username;
    return isMe ? `You: ${body}` : body;
  }

  return (
    <View style={styles.container}>
      <AppHeader onMenuPress={() => setDrawerOpen(true)} />
      <SidebarDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <View style={styles.titleRow}>
        <Text style={styles.screenTitle}>Inbox</Text>
        {totalUnread > 0 && (
          <View style={styles.unreadCountBadge}>
            <Text style={styles.unreadCountText}>{totalUnread}</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <Pressable
          style={({ pressed }) => [styles.composeBtn, { opacity: pressed ? 0.6 : 1 }]}
          hitSlop={10}
          onPress={() => router.push('/(tabs)/discover/people')}
        >
          <Feather name="edit-2" size={16} color={Colors.brand.orange} />
          <Text style={styles.composeBtnLabel}>New Message</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonRow}>
              <View style={styles.skeletonAvatar} />
              <View style={styles.skeletonLines}>
                <View style={[styles.skeletonLine, { width: '55%' }]} />
                <View style={[styles.skeletonLine, { width: '80%', opacity: 0.5 }]} />
              </View>
            </View>
          ))}
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
              subtitle="Visit someone's profile to start a conversation"
            />
          }
          renderItem={({ item }) => {
            const isUnread = (item.unreadCount ?? 0) > 0;
            const preview = getLastMessagePreview(item);
            return (
              <Pressable
                style={({ pressed }) => [
                  styles.threadCard,
                  isUnread && styles.threadCardUnread,
                  { opacity: pressed ? 0.92 : 1 },
                ]}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/inbox/[id]',
                    params: { id: item.participant.username, name: item.participant.name },
                  })
                }
              >
                <View style={styles.avatarWrap}>
                  <Avatar uri={item.participant.avatar} name={item.participant.name} size={50} />
                  {isUnread && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.threadInfo}>
                  <View style={styles.threadTopRow}>
                    <Text style={[styles.participantName, isUnread && styles.participantNameBold]}>
                      {item.participant.name}
                    </Text>
                  </View>
                  {!!preview && (
                    <Text
                      style={[styles.lastMessage, isUnread && styles.lastMessageUnread]}
                      numberOfLines={1}
                    >
                      {timeAgo(item.updatedAt) ? `${timeAgo(item.updatedAt)} · ${preview}` : preview}
                    </Text>
                  )}
                </View>
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
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.primary,
    fontFamily: 'Inter_700Bold',
  },
  unreadCountBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.brand.orange,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadCountText: {
    fontSize: 11,
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  composeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.brand.light,
  },
  composeBtnLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.brand.orange,
    fontFamily: 'Inter_600SemiBold',
  },
  loadingWrap: { padding: 16, gap: 0 },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  skeletonAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.bg.tertiary,
  },
  skeletonLines: {
    flex: 1,
    gap: 8,
  },
  skeletonLine: {
    height: 13,
    borderRadius: 6,
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
  listContent: { paddingTop: 4, paddingBottom: 8 },
  threadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  threadCardUnread: {
    backgroundColor: Colors.bg.secondary,
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
  threadInfo: { flex: 1, gap: 3 },
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
    fontSize: 11,
    color: Colors.text.tertiary,
    fontFamily: 'Inter_400Regular',
  },
  lastMessage: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontFamily: 'Inter_400Regular',
  },
  lastMessageUnread: {
    color: Colors.text.primary,
    fontFamily: 'Inter_500Medium',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border.default,
    marginLeft: 78,
  },
});
