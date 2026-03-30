import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { api, getApiError } from '@/lib/api';
import { adaptDirectMessage, adaptUser } from '@/lib/adapters';
import { timeAgo } from '@/lib/utils';
import type { DirectMessage, User } from '@/types';

const TAB_BAR_HEIGHT = 49;

export default function ConversationScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const flatRef = useRef<FlatList>(null);
  const [messageText, setMessageText] = useState('');

  const { data: participant } = useQuery<User>({
    queryKey: ['user-profile-mini', id],
    queryFn: async () => {
      const res = await api.get(`/users/${id}`);
      const raw = res.data?.data ?? res.data;
      return adaptUser(raw);
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: messages, isLoading } = useQuery<DirectMessage[]>({
    queryKey: ['conversation', id],
    queryFn: async () => {
      const res = await api.get(`/messages/${id}`);
      const raw =
        Array.isArray(res.data?.data) ? res.data.data :
        Array.isArray(res.data?.messages) ? res.data.messages :
        Array.isArray(res.data) ? res.data :
        [];
      return raw.map(adaptDirectMessage);
    },
    refetchInterval: 10000,
  });

  const sendMutation = useMutation({
    mutationFn: () => api.post(`/messages/${id}`, { body: messageText.trim() }),
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['conversation', id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (e) => Alert.alert('Could not send message', getApiError(e)),
  });

  useEffect(() => {
    if (messages?.length) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const goBack = () => router.push('/(tabs)/inbox');

  const displayName = participant?.name ?? name ?? id;
  const displayHandle = participant?.username ?? id;
  const avatarUri = participant?.avatar;

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.topBar}>
          <Pressable onPress={goBack} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={Colors.text.primary} />
          </Pressable>
        </View>
        <ActivityIndicator color={Colors.brand.orange} style={{ marginTop: 60 }} />
      </View>
    );
  }

  const msgList = messages ?? [];
  const lastSentIndex = [...msgList].map((m, i) => ({ m, i }))
    .filter(({ m }) => m.senderHandle === user?.username)
    .pop()?.i ?? -1;

  const bottomPad = Platform.OS === 'web'
    ? TAB_BAR_HEIGHT + 8
    : insets.bottom + TAB_BAR_HEIGHT + 8;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: topPad }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={topPad}
    >
      <View style={styles.topBar}>
        <Pressable onPress={goBack} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </Pressable>
        <Pressable
          style={styles.participantHeader}
          onPress={() => router.push({ pathname: '/(tabs)/discover/people/[id]', params: { id } })}
        >
          <Avatar uri={avatarUri} name={displayName} size={34} />
          <View style={{ gap: 1 }}>
            <Text style={styles.participantName}>{displayName}</Text>
            <Text style={styles.participantHandle}>@{displayHandle}</Text>
          </View>
        </Pressable>
      </View>

      <FlatList
        ref={flatRef}
        data={msgList}
        keyExtractor={(m) => m.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.messageList, { paddingBottom: 16 }]}
        renderItem={({ item: message, index }) => {
          const isMe = message.senderHandle === user?.username;
          const isLastSent = isMe && index === lastSentIndex;
          return (
            <View style={[styles.messageBubbleWrap, isMe && styles.messageBubbleWrapMe]}>
              {!isMe && (
                <Avatar
                  uri={message.senderAvatar ?? avatarUri}
                  name={message.senderName || displayName}
                  size={28}
                />
              )}
              <View style={styles.bubbleColumn}>
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                  <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{message.body}</Text>
                  <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>{timeAgo(message.createdAt)}</Text>
                </View>
                {isMe && isLastSent && (
                  <View style={styles.tickRow}>
                    {message.read ? (
                      <Text style={[styles.tick, styles.tickRead]}>✓✓</Text>
                    ) : message.delivered ? (
                      <Text style={styles.tick}>✓✓</Text>
                    ) : (
                      <Text style={styles.tick}>✓</Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyMessages}>
            <Feather name="message-square" size={32} color={Colors.text.tertiary} />
            <Text style={styles.emptyText}>Send a message to start the conversation</Text>
          </View>
        }
      />

      <View style={[styles.inputBar, { paddingBottom: bottomPad }]}>
        <Pressable style={styles.mediaBtn} onPress={() => Alert.alert('Media', 'Media upload coming soon')}>
          <Feather name="image" size={22} color={Colors.text.secondary} />
        </Pressable>
        <TextInput
          style={styles.input}
          placeholder="Message..."
          placeholderTextColor={Colors.text.tertiary}
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={1000}
        />
        <Pressable
          style={[styles.sendBtn, !messageText.trim() && { opacity: 0.4 }]}
          onPress={() => { if (messageText.trim()) sendMutation.mutate(); }}
          disabled={!messageText.trim() || sendMutation.isPending}
        >
          <Feather name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.secondary },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.bg.primary, borderBottomWidth: 1, borderBottomColor: Colors.border.default },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  participantHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  participantName: { fontSize: 15, fontWeight: '600', color: Colors.text.primary, fontFamily: 'Inter_600SemiBold' },
  participantHandle: { fontSize: 12, color: Colors.text.tertiary, fontFamily: 'Inter_400Regular' },
  messageList: { padding: 16, gap: 12 },
  messageBubbleWrap: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  messageBubbleWrapMe: { flexDirection: 'row-reverse' },
  bubbleColumn: { flexDirection: 'column', alignItems: 'flex-end', maxWidth: '75%' },
  bubble: { borderRadius: 18, padding: 12, gap: 4 },
  bubbleMe: { backgroundColor: Colors.brand.orange, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: Colors.bg.primary, borderBottomLeftRadius: 4, borderWidth: 1.5, borderColor: Colors.border.default },
  bubbleText: { fontSize: 15, color: Colors.text.primary, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  bubbleTextMe: { color: '#fff' },
  bubbleTime: { fontSize: 11, color: Colors.text.tertiary, fontFamily: 'Inter_400Regular' },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.7)' },
  tickRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 2, paddingRight: 2 },
  tick: { fontSize: 11, color: Colors.text.tertiary, fontFamily: 'Inter_500Medium' },
  tickRead: { color: Colors.brand.orange },
  emptyMessages: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.text.tertiary, textAlign: 'center', fontFamily: 'Inter_400Regular' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingTop: 10, paddingHorizontal: 12, backgroundColor: Colors.bg.primary, borderTopWidth: 1, borderTopColor: Colors.border.default },
  mediaBtn: { width: 36, height: 40, justifyContent: 'center', alignItems: 'center' },
  input: { flex: 1, minHeight: 40, maxHeight: 100, backgroundColor: Colors.bg.secondary, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: Colors.text.primary, fontFamily: 'Inter_400Regular', borderWidth: 1.5, borderColor: Colors.border.default },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.brand.orange, justifyContent: 'center', alignItems: 'center' },
});
