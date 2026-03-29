import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
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
import { api, getApiError } from '@/lib/api';
import { notifyComment, notifyReply, notifyUpvote } from '@/lib/notify';
import { adaptComment, adaptProduct } from '@/lib/adapters';
import { timeAgo } from '@/lib/utils';
import type { Comment, Product } from '@/types';

const TAB_BAR_HEIGHT = 49;

interface ProductDetailData {
  product: Product;
  comments: Comment[];
}

interface ReplyingTo { id: string; username: string }

export default function ProductDetailScreen() {
  const { id, scrollToComment } = useLocalSearchParams<{ id: string; scrollToComment?: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const flatListRef = useRef<FlatList>(null);

  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ReplyingTo | null>(null);
  const [screenshotIndex, setScreenshotIndex] = useState(0);
  const [showUnsaveModal, setShowUnsaveModal] = useState(false);
  const [deleteCommentModal, setDeleteCommentModal] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(false);
    setTimeout(() => setToastVisible(true), 30);
  };

  const { data, isLoading } = useQuery<ProductDetailData>({
    queryKey: ['product', id],
    queryFn: async () => {
      const [productRes, commentsRes] = await Promise.all([
        api.get(`/products/${id}`),
        api.get(`/products/${id}/comments`).catch(() => ({ data: { data: [] } })),
      ]);
      const product = adaptProduct(productRes.data.data);
      const comments = Array.isArray(commentsRes.data.data)
        ? commentsRes.data.data.map(adaptComment)
        : [];
      return { product, comments };
    },
  });

  const upvoteMutation = useMutation({
    mutationFn: () => api.post(`/products/${id}/upvote`),
    onMutate: async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await queryClient.cancelQueries({ queryKey: ['product', id] });
      const prev = queryClient.getQueryData<ProductDetailData>(['product', id]);
      queryClient.setQueryData<ProductDetailData>(['product', id], (old) => {
        if (!old) return old;
        const p = old.product;
        return {
          ...old,
          product: {
            ...p,
            upvoted: !p.upvoted,
            upvotes: p.upvoted ? Math.max(0, p.upvotes - 1) : p.upvotes + 1,
          },
        };
      });
      return { prev };
    },
    onSuccess: (_data, _vars, ctx) => {
      const product = queryClient.getQueryData<ProductDetailData>(['product', id])?.product ?? ctx?.prev?.product;
      const targetUsername = product?.maker?.username;
      const voterName = user?.username ?? user?.name ?? '';
      if (targetUsername && targetUsername !== voterName) {
        notifyUpvote({ targetUsername, voterName, productName: product?.name ?? '', productId: id });
      }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['product', id], ctx.prev);
      Alert.alert('Could not upvote', getApiError(_err));
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => api.post(`/products/${id}/bookmark`),
    onMutate: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
    onError: (e) => Alert.alert('Could not bookmark', getApiError(e)),
  });

  const commentMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, string> = { body: commentText };
      if (replyingTo) payload.parent_comment_id = replyingTo.id;
      return api.post(`/products/${id}/comments`, payload);
    },
    onSuccess: () => {
      const product = data?.product;
      const commenterName = user?.username ?? user?.name ?? '';
      if (replyingTo && replyingTo.username && replyingTo.username !== commenterName) {
        notifyReply({ targetUsername: replyingTo.username, commenterName, postId: id });
      } else if (product?.maker?.username && product.maker.username !== commenterName) {
        notifyComment({ targetUsername: product.maker.username, commenterName, postTitle: product.name, postId: id });
      }
      setCommentText('');
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      showToast('Comment posted');
    },
    onError: (e) => Alert.alert('Could not post comment', getApiError(e)),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => api.delete(`/products/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      showToast('Comment deleted');
    },
  });

  useEffect(() => {
    if (!scrollToComment || !data?.comments?.length) return;
    const idx = data.comments.findIndex(c => c.id === scrollToComment);
    if (idx < 0) return;
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.3 });
    }, 600);
    return () => clearTimeout(timer);
  }, [scrollToComment, data?.comments]);

  const showCommentMenu = (comment: Comment) => {
    const isOwn = comment.user.username === user?.username;
    if (isOwn) {
      setDeleteCommentModal(comment.id);
    } else {
      Alert.alert('Report Comment', 'Report this comment as inappropriate?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', style: 'destructive', onPress: () => api.post(`/products/${id}/comments/${comment.id}/report`).catch(() => {}) },
      ]);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.topBar}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={Colors.text.primary} />
          </Pressable>
        </View>
        <ActivityIndicator color={Colors.brand.orange} style={{ marginTop: 60 }} />
      </View>
    );
  }

  const product = data?.product;
  const comments = data?.comments ?? [];

  if (!product) return null;

  const screenshots = product.screenshots ?? [];

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </Pressable>
        <View style={styles.topBarActions}>
          <Pressable
            style={styles.actionBtn}
            onPress={() => {
              const url = product.website ?? `https://tlmena.com/products/${product.id}`;
              Share.share({ title: product.name, message: `${product.name} — ${product.tagline}\n${url}` });
            }}
          >
            <Feather name="share" size={18} color={Colors.text.primary} />
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.saveBtn, product.bookmarked && styles.actionBtnActive]}
            onPress={() => product.bookmarked ? setShowUnsaveModal(true) : bookmarkMutation.mutate()}
          >
            <Feather name="bookmark" size={18} color={product.bookmarked ? Colors.brand.orange : Colors.text.primary} />
            <Text style={[styles.saveBtnLabel, product.bookmarked && styles.saveBtnLabelActive]}>
              {product.bookmarked ? 'Saved' : 'Save'}
            </Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={comments}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onScrollToIndexFailed={() => {}}
        ListHeaderComponent={
          <View style={styles.productHeader}>
            {product.coverImage && (
              <Image source={{ uri: product.coverImage }} style={styles.coverImage} contentFit="cover" />
            )}

            <View style={styles.productInfo}>
              <View style={styles.productMeta}>
                <View style={styles.logoWrap}>
                  {product.logo ? (
                    <Image source={{ uri: product.logo }} style={styles.logo} contentFit="contain" />
                  ) : (
                    <View style={[styles.logo, styles.logoFallback]}>
                      <Text style={styles.logoFallbackText}>{product.name.charAt(0)}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.nameMeta}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productTagline}>{product.tagline}</Text>
                  <View style={styles.tagRow}>
                    {product.industry && <View style={styles.tag}><Text style={styles.tagText}>{product.industry}</Text></View>}
                    {product.country && <View style={styles.tag}><Text style={styles.tagText}>{product.country}</Text></View>}
                  </View>
                </View>
              </View>

              <View style={styles.voteRow}>
                <View style={styles.voteBtnWrap}>
                  <Pressable
                    style={[styles.voteBtn, product.upvoted && styles.voteBtnActive, upvoteMutation.isPending && { opacity: 0.5 }]}
                    onPress={() => upvoteMutation.mutate()}
                    disabled={upvoteMutation.isPending}
                  >
                    <Text style={styles.voteEmoji}>🎉</Text>
                    <Text style={[styles.voteCount, product.upvoted && styles.voteCountActive]}>{product.upvotes}</Text>
                  </Pressable>
                  {!product.upvoted && (
                    <Text style={styles.voteHint}>Tap to upvote</Text>
                  )}
                  {product.upvoted && (
                    <Text style={styles.voteHintActive}>Tap again to remove</Text>
                  )}
                </View>
                {product.website && (
                  <Pressable
                    style={styles.websiteBtn}
                    onPress={() => product.website && Linking.openURL(product.website)}
                  >
                    <Feather name="external-link" size={16} color={Colors.brand.orange} />
                    <Text style={styles.websiteText}>Visit</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {product.description && (
              <View style={styles.descSection}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.description}>{product.description}</Text>
              </View>
            )}

            {product.reasons && product.reasons.length > 0 && (
              <View style={styles.reasonsSection}>
                <Text style={styles.sectionTitle}>
                  Top {product.reasons.length} reasons to use {product.name}
                </Text>
                {product.reasons.map((reason, i) => (
                  <View key={i} style={styles.reasonRow}>
                    <View style={styles.reasonBadge}>
                      <Text style={styles.reasonBadgeText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.reasonText}>{reason}</Text>
                  </View>
                ))}
              </View>
            )}

            {screenshots.length > 0 && (
              <View style={styles.screenshotsSection}>
                <Text style={styles.sectionTitle}>Screenshots</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.screenshotRow}>
                    {screenshots.map((s, i) => (
                      <Pressable key={i} onPress={() => setScreenshotIndex(i)}>
                        <Image
                          source={{ uri: s }}
                          style={[styles.screenshot, i === screenshotIndex && styles.screenshotActive]}
                          contentFit="cover"
                        />
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {product.maker && (
              <View style={styles.makerSection}>
                <Text style={styles.sectionTitle}>Maker</Text>
                <Pressable
                  style={styles.makerRow}
                  onPress={() => router.push({
                    pathname: '/(tabs)/discover/people/[id]',
                    params: { id: product.maker!.username || product.maker!.id },
                  })}
                >
                  <Avatar uri={product.maker.avatar} name={product.maker.name} size={44} />
                  <View style={{ gap: 2, flex: 1 }}>
                    <Text style={styles.makerName}>{product.maker.name}</Text>
                    {product.maker.role && <Text style={styles.makerRole}>{product.maker.role}</Text>}
                  </View>
                  <Feather name="chevron-right" size={16} color={Colors.text.tertiary} />
                </Pressable>
                {product.maker.username !== user?.username && (
                  <Pressable
                    style={styles.messageBtn}
                    onPress={() => router.push({
                      pathname: '/(tabs)/inbox/[id]',
                      params: { id: product.maker!.username },
                    })}
                  >
                    <Feather name="message-circle" size={16} color="#fff" />
                    <Text style={styles.messageBtnText}>Message {product.maker.name.split(' ')[0]}</Text>
                  </Pressable>
                )}
              </View>
            )}

            <View style={styles.commentHeader}>
              <Feather name="message-circle" size={16} color={Colors.text.secondary} />
              <Text style={styles.sectionTitle}>Comments ({comments.length})</Text>
            </View>
          </View>
        }
        renderItem={({ item: comment }) => (
          <View>
            <View style={styles.commentItem}>
              <Avatar uri={comment.user.avatar} name={comment.user.name} size={36} />
              <View style={styles.commentContent}>
                <View style={styles.commentMeta}>
                  <Text style={styles.commentUser}>{comment.user.name}</Text>
                  <Text style={styles.commentTime}>{timeAgo(comment.createdAt)}</Text>
                  <Pressable onPress={() => showCommentMenu(comment)} hitSlop={8} style={styles.commentMenuBtn}>
                    <Feather name="more-horizontal" size={14} color={Colors.text.tertiary} />
                  </Pressable>
                </View>
                <Text style={styles.commentBody}>{comment.body}</Text>
                <Pressable
                  style={styles.replyBtn}
                  onPress={() => setReplyingTo({ id: comment.id, username: comment.user.username })}
                >
                  <Feather name="corner-down-right" size={12} color={Colors.text.tertiary} />
                  <Text style={styles.replyBtnText}>Reply</Text>
                </Pressable>
              </View>
            </View>
            {comment.replies?.map((reply: Comment) => (
              <View key={reply.id} style={styles.replyItem}>
                <View style={styles.replyLine} />
                <Avatar uri={reply.user.avatar} name={reply.user.name} size={28} />
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
        ListEmptyComponent={
          <Text style={styles.noComments}>Be the first to comment</Text>
        }
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
            style={styles.commentInput}
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
        visible={showUnsaveModal}
        title="Remove from Saved"
        message="Are you sure you want to unsave this product?"
        confirmLabel="Remove"
        destructive
        onConfirm={() => { setShowUnsaveModal(false); bookmarkMutation.mutate(); }}
        onCancel={() => setShowUnsaveModal(false)}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.secondary },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.bg.primary, borderBottomWidth: 1, borderBottomColor: Colors.border.default },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  topBarActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.bg.secondary, justifyContent: 'center', alignItems: 'center' },
  actionBtnActive: { backgroundColor: Colors.brand.light },
  saveBtn: { width: 'auto', flexDirection: 'row', gap: 5, paddingHorizontal: 12 },
  saveBtnLabel: { fontSize: 13, fontWeight: '600', color: Colors.text.primary, fontFamily: 'Inter_600SemiBold' },
  saveBtnLabelActive: { color: Colors.brand.orange },
  voteBtnWrap: { alignItems: 'center', gap: 4 },
  voteHint: { fontSize: 10, color: Colors.text.tertiary, fontFamily: 'Inter_400Regular' },
  voteHintActive: { fontSize: 10, color: Colors.brand.orange, fontFamily: 'Inter_400Regular' },
  listContent: { paddingBottom: 120 },
  productHeader: { backgroundColor: Colors.bg.primary, marginBottom: 12 },
  coverImage: { width: '100%', height: 200 },
  productInfo: { padding: 16, gap: 12 },
  productMeta: { flexDirection: 'row', gap: 12 },
  logoWrap: { width: 60, height: 60, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border.light, flexShrink: 0 },
  logo: { width: 60, height: 60 },
  logoFallback: { backgroundColor: Colors.brand.light, justifyContent: 'center', alignItems: 'center' },
  logoFallbackText: { fontSize: 22, fontWeight: '700', color: Colors.brand.orange, fontFamily: 'Inter_700Bold' },
  nameMeta: { flex: 1, gap: 4 },
  productName: { fontSize: 20, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold' },
  productTagline: { fontSize: 14, color: Colors.text.secondary, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: Colors.bg.tertiary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11, color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },
  voteRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  voteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border.default },
  voteBtnActive: { borderColor: Colors.brand.orange, backgroundColor: Colors.brand.light },
  voteEmoji: { fontSize: 18 },
  voteCount: { fontSize: 15, fontWeight: '600', color: Colors.text.secondary, fontFamily: 'Inter_600SemiBold' },
  voteCountActive: { color: Colors.brand.orange },
  websiteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, backgroundColor: Colors.brand.light, borderWidth: 1.5, borderColor: Colors.brand.orange },
  websiteText: { fontSize: 14, color: Colors.brand.orange, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  descSection: { padding: 16, gap: 8, borderTopWidth: 1, borderTopColor: Colors.border.light },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold' },
  description: { fontSize: 14, color: Colors.text.secondary, lineHeight: 22, fontFamily: 'Inter_400Regular' },
  screenshotsSection: { padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: Colors.border.light },
  screenshotRow: { flexDirection: 'row', gap: 8 },
  screenshot: { width: 140, height: 240, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  screenshotActive: { borderColor: Colors.brand.orange },
  reasonsSection: { padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: Colors.border.light },
  reasonRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
  reasonBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.brand.light, justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 1 },
  reasonBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.brand.orange, fontFamily: 'Inter_700Bold' },
  reasonText: { flex: 1, fontSize: 14, color: Colors.text.secondary, lineHeight: 20, fontFamily: 'Inter_400Regular' },
  makerSection: { padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: Colors.border.light },
  makerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: Colors.bg.secondary, borderRadius: 12 },
  makerName: { fontSize: 15, fontWeight: '600', color: Colors.text.primary, fontFamily: 'Inter_600SemiBold' },
  makerRole: { fontSize: 13, color: Colors.text.secondary, fontFamily: 'Inter_400Regular' },
  messageBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.brand.orange, borderRadius: 12, paddingVertical: 12 },
  messageBtnText: { fontSize: 15, fontWeight: '600', color: '#fff', fontFamily: 'Inter_600SemiBold' },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, borderTopWidth: 1, borderTopColor: Colors.border.light },
  commentItem: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  replyItem: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingLeft: 52, marginTop: 10 },
  replyLine: { position: 'absolute', left: 36, top: 0, bottom: 0, width: 1.5, backgroundColor: '#E5E7EB' },
  commentContent: { flex: 1, gap: 4 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentUser: { fontSize: 14, fontWeight: '600', color: Colors.text.primary, fontFamily: 'Inter_600SemiBold' },
  commentTime: { fontSize: 12, color: Colors.text.tertiary, fontFamily: 'Inter_400Regular', flex: 1 },
  commentMenuBtn: { padding: 2 },
  commentBody: { fontSize: 14, color: Colors.text.secondary, lineHeight: 20, fontFamily: 'Inter_400Regular' },
  replyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  replyBtnText: { fontSize: 12, color: Colors.text.tertiary, fontFamily: 'Inter_400Regular' },
  noComments: { textAlign: 'center', color: Colors.text.tertiary, fontSize: 14, fontFamily: 'Inter_400Regular', paddingVertical: 20, paddingHorizontal: 16 },
  inputArea: { backgroundColor: Colors.bg.primary, borderTopWidth: 1, borderTopColor: Colors.border.default },
  replyBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  replyBannerText: { flex: 1, fontSize: 13, color: Colors.brand.orange, fontFamily: 'Inter_400Regular' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, paddingHorizontal: 16 },
  commentInput: { flex: 1, minHeight: 40, maxHeight: 100, backgroundColor: Colors.bg.secondary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: Colors.text.primary, fontFamily: 'Inter_400Regular', borderWidth: 1.5, borderColor: Colors.border.default },
  sendBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.brand.orange, justifyContent: 'center', alignItems: 'center' },
});
