import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Colors } from '@/constants/Colors';
import type { Post } from '@/types';
import { timeAgo } from '@/lib/utils';

interface Props {
  post: Post;
  onPress: () => void;
  onLike?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  isOwn?: boolean;
}

export function PostCard({ post, onPress, onLike, onEdit, onDelete, onReport, isOwn }: Props) {
  const [imageError, setImageError] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onLike?.();
  };

  const postUrl = `https://tlmena.com/launcher/${post.id}`;

  const handleMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const ownOptions = isOwn ? [
      ...(onEdit ? [{ text: 'Edit', onPress: onEdit }] : []),
      ...(onDelete ? [{
        text: 'Delete',
        style: 'destructive' as const,
        onPress: () => setDeleteConfirmVisible(true),
      }] : []),
    ] : [
      { text: 'Report', style: 'destructive' as const, onPress: onReport },
    ];

    Alert.alert('Post Options', undefined, [
      ...ownOptions,
      {
        text: 'Copy Link',
        onPress: async () => {
          await Clipboard.setStringAsync(postUrl);
          Alert.alert('Copied!', 'Post link copied to clipboard.');
        },
      },
      {
        text: 'Share',
        onPress: () => Share.share({
          message: `${post.body?.slice(0, 80) ?? 'Check this out'}\n${postUrl}`,
          url: postUrl,
        }),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };
  const tag = post.postType;

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.card, { opacity: pressed ? 0.95 : 1 }]}
        onPress={onPress}
      >
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            {post.user.avatar ? (
              <Image source={{ uri: post.user.avatar }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{post.user.name.charAt(0)}</Text>
              </View>
            )}
          </View>
          <View style={styles.authorMeta}>
            <Text style={styles.authorName} numberOfLines={1}>{post.user.name}</Text>
            <Text style={styles.authorSub} numberOfLines={1}>
              {post.user.username ? `@${post.user.username} · ` : ''}{timeAgo(post.createdAt)}
            </Text>
          </View>
          {tag && (
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{tag.toUpperCase()}</Text>
            </View>
          )}
          <Pressable style={styles.menuBtn} onPress={handleMenu} hitSlop={8}>
            <Feather name="more-horizontal" size={18} color={Colors.text.tertiary} />
          </Pressable>
        </View>

        {post.title ? (
          <Text style={styles.title} numberOfLines={2}>{post.title}</Text>
        ) : null}

        <View style={styles.bodyWrap}>
          <Markdown style={markdownStyles}>
            {post.body ?? ''}
          </Markdown>
        </View>

        {post.image && !imageError ? (
          <Image
            source={{ uri: post.image }}
            style={styles.image}
            contentFit="cover"
            onError={() => setImageError(true)}
          />
        ) : null}

        <View style={styles.actions}>
          <Pressable style={styles.actionBtn} onPress={handleLike}>
            <Text style={styles.likeEmoji}>🎉</Text>
            <Text style={[styles.actionCount, post.liked && styles.likedCount]}>
              {post.likesCount}
            </Text>
          </Pressable>
          <View style={styles.actionBtn}>
            <Feather name="message-circle" size={15} color={Colors.text.tertiary} />
            <Text style={styles.actionCount}>{post.commentsCount ?? 0}</Text>
          </View>
        </View>
      </Pressable>

      <ConfirmModal
        visible={deleteConfirmVisible}
        title="Delete post"
        message="Are you sure? This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          setDeleteConfirmVisible(false);
          onDelete?.();
        }}
        onCancel={() => setDeleteConfirmVisible(false)}
      />
    </>
  );
}

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 21,
    fontFamily: 'Inter_400Regular',
  },
  strong: {
    fontWeight: '700',
    color: Colors.text.primary,
    fontFamily: 'Inter_700Bold',
  },
  em: {
    fontStyle: 'italic',
    color: Colors.text.secondary,
  },
  link: {
    color: Colors.brand.orange,
    textDecorationLine: 'underline',
  },
  bullet_list: { marginVertical: 2 },
  ordered_list: { marginVertical: 2 },
  list_item: { flexDirection: 'row', marginVertical: 2 },
  paragraph: { marginVertical: 2 },
  code_inline: {
    backgroundColor: Colors.bg.secondary,
    borderRadius: 4,
    paddingHorizontal: 4,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.text.primary,
  },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg.primary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: 14,
    gap: 10,
  },
  header: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  avatarWrap: { width: 42, height: 42, borderRadius: 21, overflow: 'hidden', flexShrink: 0 },
  avatar: { width: 42, height: 42 },
  avatarFallback: { backgroundColor: Colors.brand.light, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 16, fontWeight: '700', color: Colors.brand.orange, fontFamily: 'Inter_700Bold' },
  authorMeta: { flex: 1, gap: 2, minWidth: 0 },
  authorName: { fontSize: 14, fontWeight: '600', color: Colors.text.primary, fontFamily: 'Inter_600SemiBold' },
  authorSub: { fontSize: 12, color: Colors.text.tertiary, fontFamily: 'Inter_400Regular' },
  tagBadge: {
    backgroundColor: Colors.bg.tertiary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text.secondary,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  menuBtn: { padding: 4, flexShrink: 0 },
  title: { fontSize: 15, fontWeight: '600', color: Colors.brand.orange, fontFamily: 'Inter_600SemiBold' },
  bodyWrap: { overflow: 'hidden', maxHeight: 120 },
  image: { width: '100%', height: 180, borderRadius: 10 },
  actions: {
    flexDirection: 'row',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: 10,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  likeEmoji: { fontSize: 14 },
  actionCount: { fontSize: 13, fontWeight: '500', color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },
  likedCount: { color: Colors.brand.orange },
});
