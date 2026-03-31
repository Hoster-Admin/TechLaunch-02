import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Toast } from '@/components/Toast';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { notifyComment, notifyReply } from '@/lib/notify';
import { api, getApiError } from '@/lib/api';
import { adaptComment, adaptPost } from '@/lib/adapters';
import { timeAgo } from '@/lib/utils';
import type { Comment, Post } from '@/types';

const TAB_BAR_HEIGHT = 49;

interface PostDetailData { post: Post; comments: Comment[] }
interface ReplyingTo { id: string; username: string }

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ReplyingTo | null>(null);
  const [deletePostModal, setDeletePostModal] = useState(false);
  const [deleteCommentModal, setDeleteCommentModal] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(false);
    setTimeout(() => setToastVisible(true), 30);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.refetchQueries({ queryKey: ['launcherPost', id] });
    setRefreshing(false);
  };

  const { data, isLoading } = useQuery<PostDetailData>({
    queryKey: ['launcherPost', id],
    queryFn: async () => {
      const [postRes, commentsRes] = await Promise.all([
        api.get(`/launcher/${id}`),
        api.get(`/launcher/${id}/comments`).catch(() => ({ data: { data: [] } })),
      ]);
      const post = adaptPost(postRes.data.data);
      const comments = Array.isArray(commentsRes.data.data)
        ? commentsRes.data.data.map(adaptComment)
        : [];
      return { post, comments };
    },
  });

  const likeMutation = useMutation({
    mutationFn: () => api.post(`/launcher/${id}/like`),
    onMutate: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['launcherPost', id] }),
    onError: (e) => Alert.alert('Could not like', getApiError(e)),
  });

  const commentMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, string> = { body: commentText };
      if (replyingTo) payload.parent_comment_id = replyingTo.id;
      return api.post(`/launcher/${id}/comments`, payload);
    },
    onSuccess: () => {
      const post = data?.post;
      const targetUsername = post?.user.username;
      const commenterName = user?.username ?? user?.name ?? '';
      if (replyingTo && replyingTo.username && replyingTo.username !== commenterName) {
        notifyReply({ targetUsername: replyingTo.username, commenterName, postId: id });
      } else if (targetUsername && targetUsername !== commenterName) {
        notifyComment({ targetUsername, commenterName, postTitle: post?.title, postId: id });
      }
      setCommentText('');
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['launcherPost', id] });
      showToast('Comment posted');
    },
    onError: (e) => Alert.alert('Could not post comment', getApiError(e)),
  });

  const commentLikeMutation = useMutation({
    mutationFn: (commentId: string) => api.post(`/launcher/comments/${commentId}/like`),
    onMutate: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['launcherPost', id] }),
    onError: (e) => Alert.alert('Could not like comment', getApiError(e)),
  });

  const deletePostMutation = useMutation({
    mutationFn: () => api.delete(`/launcher/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['launcher'] });
      queryClient.invalidateQueries({ queryKey: ['launcher-posts'] });
      showToast('Post deleted');
      setTimeout(() => router.back(), 900);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => api.delete(`/launcher/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['launcherPost', id] });
      showToast('Comment deleted');
    },
  });

  const showPostMenu = (post: Post) => {
    const isOwn = post.user.username === user?.username;
    if (isOwn) {
      Alert.alert('Post Options', undefined, [
        {
          text: 'Edit',
          onPress: () => router.push({
            pathname: '/(tabs)/launcher/compose',
            params: { editId: id, editTitle: post.title ?? '', editBody: post.body },
          }),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setDeletePostModal(true),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else {
      Alert.alert('Report Post', 'Report this post as inappropriate?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', style: 'destructive', onPress: () => api.post(`/launcher/${id}/report`).catch(() => {}) },
      ]);
    }
  };

  const showCommentMenu = (comment: Comment) => {
    const isOwn = comment.user.username === user?.username;
    if (isOwn) {
      setDeleteCommentModal(comment.id);
    } else {
      Alert.alert('Report Comment', 'Report this comment as inappropriate?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', style: 'destructive', onPress: () => api.post(`/launcher/${id}/comments/${comment.id}/report`).catch(() => {}) },
      ]);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={Colors.text.primary} />
          </Pressable>
        </View>
        <ActivityIndicator color={Colors.brand.orange} style={{ marginTop: 60 }} />
      </View>
    );
  }

  const post = data?.post;
  const comments = data?.comments ?? [];
  if (!post) return null;
  const isOwnPost = post.user.username === user?.username;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.topBarTitle}>Post</Text>
        <Pressable style={styles.menuBtn} onPress={() => showPostMenu(post)} hitSlop={8}>
          <Feather name="more-horizontal" size={20} color={Colors.text.secondary} />
        </Pressable>
      </View>

      <FlatList
        data={comments}
        keyExtractor={(c) => c.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.brand.orange}
            colors={[Colors.brand.orange]}
          />
        }
        ListHeaderComponent={
          <View style={styles.postCard}>
            <Pressable
              style={styles.postHeader}
              onPress={() => post.user.username && router.push({ pathname: '/(tabs)/discover/people/[id]', params: { id: post.user.username } })}
            >
              <Avatar uri={post.user.avatar} name={post.user.name} size={40} />
              <View style={{ gap: 1, flex: 1 }}>
                <Text style={styles.posterName}>{post.user.name}</Text>
                <Text style={styles.postTime}>{timeAgo(post.createdAt)}</Text>
              </View>
            </Pressable>
            {post.title && <Text style={styles.postTitle}>{post.title}</Text>}
            <Markdown style={postMarkdownStyles}>{post.body ?? ''}</Markdown>
            {post.image && (
              <Image
                source={{ uri: post.image }}
                style={{ width: '100%', height: 220, borderRadius: 12 }}
                contentFit="cover"
              />
            )}
            <View style={styles.likeRow}>
              <Pressable
                style={[styles.likeBtn, post.liked && styles.likeBtnActive]}
                onPress={() => likeMutation.mutate()}
              >
                <Feather name="heart" size={16} color={post.liked ? '#EF4444' : Colors.text.secondary} />
                <Text style={[styles.likeCount, post.liked && styles.likeCountActive]}>{post.likesCount}</Text>
              </Pressable>
              <View style={styles.commentCountWrap}>
                <Feather name="message-circle" size={16} color={Colors.text.tertiary} />
                <Text style={styles.commentCountText}>{comments.length}</Text>
              </View>
            </View>
            <View style={styles.commentSectionHeader}>
              <Feather name="message-circle" size={14} color={Colors.text.secondary} />
              <Text style={styles.commentSectionTitle}>Comments ({comments.length})</Text>
            </View>
          </View>
        }
        renderItem={({ item: comment }) => (
          <View>
            <View style={styles.commentItem}>
              <Pressable onPress={() => comment.user.username && router.push({ pathname: '/(tabs)/discover/people/[id]', params: { id: comment.user.username } })}>
                <Avatar uri={comment.user.avatar} name={comment.user.name} size={34} />
              </Pressable>
              <View style={styles.commentContent}>
                <View style={styles.commentMeta}>
                  <Text style={styles.commentUser}>{comment.user.name}</Text>
                  <Text style={styles.commentTime}>{timeAgo(comment.createdAt)}</Text>
                  <Pressable onPress={() => showCommentMenu(comment)} hitSlop={8} style={styles.commentMenuBtn}>
                    <Feather name="more-horizontal" size={14} color={Colors.text.tertiary} />
                  </Pressable>
                </View>
                <Text style={styles.commentBody}>{comment.body}</Text>
                <View style={styles.commentActions}>
                  {comment.likesCount !== undefined && (
                    <Pressable
                      style={styles.commentLikeBtn}
                      onPress={() => commentLikeMutation.mutate(comment.id)}
                    >
                      <Feather name="heart" size={12} color={comment.liked ? '#EF4444' : Colors.text.tertiary} />
                      {(comment.likesCount ?? 0) > 0 && (
                        <Text style={[styles.commentLikeCount, comment.liked && { color: '#EF4444' }]}>
                          {comment.likesCount}
                        </Text>
                      )}
                    </Pressable>
                  )}
                  <Pressable
                    style={styles.replyBtn}
                    onPress={() => setReplyingTo({ id: comment.id, username: comment.user.username })}
                  >
                    <Feather name="corner-down-right" size={12} color={Colors.text.tertiary} />
                    <Text style={styles.replyBtnText}>Reply</Text>
                  </Pressable>
                </View>
              </View>
            </View>
            {comment.replies?.map((reply) => (
              <View key={reply.id} style={styles.replyItem}>
                <View style={styles.replyLine} />
                <Avatar uri={reply.user.avatar} name={reply.user.name} size={26} />
                <View style={styles.commentContent}>
                  <View style={styles.commentMeta}>
                    <Text style={styles.commentUser}>{reply.user.name}</Text>
                    <Text style={styles.commentTime}>{timeAgo(reply.createdAt)}</Text>
                    <Pressable onPress={() => showCommentMenu(reply)} hitSlop={8} style={styles.commentMenuBtn}>
                      <Feather name="more-horizontal" size={14} color={Colors.text.tertiary} />
                    </Pressable>
                  </View>
                  <Text style={styles.commentBody}>{reply.body}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.noComments}>No comments yet — start the conversation</Text>}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      />

      <View style={[styles.inputArea, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + TAB_BAR_HEIGHT + 8 }]}>
        {replyingTo && (
          <View style={styles.replyBanner}>
            <Feather name="corner-down-right" size={14} color={Colors.brand.orange} />
            <Text style={styles.replyBannerText}>Replying to @{replyingTo.username}</Text>
            <Pressable onPress={() => setReplyingTo(null)} hitSlop={8}>
              <Feather name="x" size={16} color={Colors.text.secondary} />
            </Pressable>
          </View>
        )}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : 'Write a comment...'}
            placeholderTextColor={Colors.text.tertiary}
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <Pressable
            style={[styles.sendBtn, !commentText.trim() && { opacity: 0.4 }]}
            onPress={() => { if (commentText.trim()) commentMutation.mutate(); }}
            disabled={!commentText.trim() || commentMutation.isPending}
          >
            <Feather name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>

      <Toast message={toastMessage} visible={toastVisible} type="success" />

      <ConfirmModal
        visible={deletePostModal}
        title="Delete post"
        message="Are you sure? This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => { setDeletePostModal(false); deletePostMutation.mutate(); }}
        onCancel={() => setDeletePostModal(false)}
      />
      <ConfirmModal
        visible={deleteCommentModal !== null}
        title="Delete comment"
        message="Are you sure you want to delete this comment?"
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteCommentModal) deleteCommentMutation.mutate(deleteCommentModal);
          setDeleteCommentModal(null);
        }}
        onCancel={() => setDeleteCommentModal(null)}
      />
    </View>
  );
}

const postMarkdownStyles = StyleSheet.create({
  body: { fontSize: 15, color: Colors.text.secondary, lineHeight: 22, fontFamily: 'Inter_400Regular' },
  strong: { fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold' },
  em: { fontStyle: 'italic', color: Colors.text.secondary },
  link: { color: Colors.brand.orange, textDecorationLine: 'underline' },
  bullet_list: { marginVertical: 2 },
  ordered_list: { marginVertical: 2 },
  list_item: { flexDirection: 'row', marginVertical: 2 },
  paragraph: { marginVertical: 2 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.secondary },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.bg.primary, borderBottomWidth: 1, borderBottomColor: Colors.border.default },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  topBarTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.text.primary, fontFamily: 'Inter_600SemiBold' },
  menuBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  postCard: { backgroundColor: Colors.bg.primary, padding: 16, gap: 12, borderBottomWidth: 8, borderBottomColor: Colors.bg.secondary },
  postHeader: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  posterName: { fontSize: 15, fontWeight: '600', color: Colors.text.primary, fontFamily: 'Inter_600SemiBold' },
  postTime: { fontSize: 12, color: Colors.text.tertiary, fontFamily: 'Inter_400Regular' },
  postTitle: { fontSize: 17, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold' },
  postBody: { fontSize: 15, color: Colors.text.secondary, lineHeight: 22, fontFamily: 'Inter_400Regular' },
  likeRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border.light },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  likeBtnActive: {},
  likeCount: { fontSize: 14, color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },
  likeCountActive: { color: '#EF4444' },
  commentCountWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  commentCountText: { fontSize: 14, color: Colors.text.tertiary, fontFamily: 'Inter_500Medium' },
  commentSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  commentSectionTitle: { fontSize: 15, fontWeight: '600', color: Colors.text.secondary, fontFamily: 'Inter_600SemiBold' },
  commentItem: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  replyItem: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingLeft: 50, marginTop: 10 },
  replyLine: { position: 'absolute', left: 34, top: 0, bottom: 0, width: 1.5, backgroundColor: '#E5E7EB' },
  commentContent: { flex: 1, gap: 4 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentUser: { fontSize: 14, fontWeight: '600', color: Colors.text.primary, fontFamily: 'Inter_600SemiBold' },
  commentTime: { fontSize: 12, color: Colors.text.tertiary, fontFamily: 'Inter_400Regular', flex: 1 },
  commentMenuBtn: { padding: 2 },
  commentBody: { fontSize: 14, color: Colors.text.secondary, lineHeight: 20, fontFamily: 'Inter_400Regular' },
  commentActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  commentLikeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 2 },
  commentLikeCount: { fontSize: 12, color: Colors.text.tertiary, fontFamily: 'Inter_400Regular' },
  replyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  replyBtnText: { fontSize: 12, color: Colors.text.tertiary, fontFamily: 'Inter_400Regular' },
  noComments: { textAlign: 'center', color: Colors.text.tertiary, fontSize: 14, fontFamily: 'Inter_400Regular', paddingVertical: 20, paddingHorizontal: 16 },
  inputArea: { backgroundColor: Colors.bg.primary, borderTopWidth: 1, borderTopColor: Colors.border.default },
  replyBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  replyBannerText: { flex: 1, fontSize: 13, color: Colors.brand.orange, fontFamily: 'Inter_400Regular' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, paddingHorizontal: 16 },
  input: { flex: 1, minHeight: 40, maxHeight: 100, backgroundColor: Colors.bg.secondary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: Colors.text.primary, fontFamily: 'Inter_400Regular', borderWidth: 1.5, borderColor: Colors.border.default },
  sendBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.brand.orange, justifyContent: 'center', alignItems: 'center' },
});
