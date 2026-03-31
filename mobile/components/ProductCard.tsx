import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { formatCountryTag } from '@/lib/utils';
import type { Product } from '@/types';

interface Props {
  product: Product;
  onPress: () => void;
  onUpvote?: () => void;
  onBookmark?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  compact?: boolean;
  upvotePending?: boolean;
}

export function ProductCard({ product, onPress, onUpvote, onBookmark, onEdit, onDelete, compact, upvotePending }: Props) {
  const [imgError, setImgError] = useState(false);

  const handleUpvote = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUpvote?.();
  };
  const handleBookmark = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBookmark?.();
  };

  const productUrl = `https://tlmena.com/products/${product.slug ?? product.id}`;

  const handleMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const ownOptions = onEdit || onDelete ? [
      ...(onEdit ? [{ text: 'Edit', onPress: onEdit }] : []),
      ...(onDelete ? [{
        text: 'Delete', style: 'destructive' as const,
        onPress: () => Alert.alert('Delete Product', 'Are you sure?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: onDelete },
        ]),
      }] : []),
    ] : [];

    Alert.alert(product.name, undefined, [
      ...ownOptions,
      {
        text: 'Copy Link',
        onPress: async () => {
          await Clipboard.setStringAsync(productUrl);
          Alert.alert('Copied!', 'Product link copied to clipboard.');
        },
      },
      {
        text: 'Share',
        onPress: () => Share.share({ message: `${product.name} — ${product.tagline}\n${productUrl}`, url: productUrl }),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const showImage = !!product.logo && !imgError;
  const hasEmoji = !!product.logoEmoji;
  const fallbackText = hasEmoji
    ? product.logoEmoji!
    : product.name.slice(0, 2).toUpperCase();

  const voteColor = product.upvoted ? Colors.brand.orange : Colors.text.tertiary;

  const countryLabel = product.country ? formatCountryTag(product.country) : null;

  return (
    <View style={styles.cardWrapper}>
      <Pressable
        style={({ pressed }) => [styles.card, { opacity: pressed ? 0.93 : 1 }]}
        onPress={onPress}
      >
        <View style={styles.logoWrap}>
          {showImage ? (
            <Image
              source={{ uri: product.logo }}
              style={styles.logo}
              contentFit="cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <View style={[styles.logo, styles.logoFallback]}>
              <Text style={hasEmoji ? styles.logoEmoji : styles.logoInitial}>
                {fallbackText}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.meta}>
          <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
          <Text style={styles.tagline} numberOfLines={1}>{product.tagline}</Text>
          <View style={styles.tagRow}>
            {product.industry && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{product.industry}</Text>
              </View>
            )}
            {countryLabel && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{countryLabel}</Text>
              </View>
            )}
            {product.commentsCount !== undefined && product.commentsCount > 0 && (
              <View style={styles.commentChip}>
                <Feather name="message-circle" size={12} color={Colors.text.tertiary} />
                <Text style={styles.commentCount}>{product.commentsCount}</Text>
              </View>
            )}
          </View>
        </View>

        {!compact && (
          <View style={styles.actions}>
            <Pressable
              style={[styles.upvoteBtn, upvotePending && styles.upvoteBtnPending]}
              onPress={handleUpvote}
              disabled={upvotePending}
            >
              <Feather name="chevron-up" size={18} color={voteColor} />
              {product.upvotes > 0 && (
                <Text style={[styles.upvoteCount, { color: voteColor }]}>
                  {product.upvotes}
                </Text>
              )}
            </Pressable>
            {onBookmark && (
              <Pressable
                style={[styles.bookmarkBtn, product.bookmarked && styles.bookmarkBtnActive]}
                onPress={handleBookmark}
              >
                <Feather
                  name="bookmark"
                  size={16}
                  color={product.bookmarked ? Colors.brand.orange : Colors.text.tertiary}
                />
              </Pressable>
            )}
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    backgroundColor: Colors.bg.primary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.default,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  logoWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.light,
    flexShrink: 0,
  },
  logo: {
    width: 52,
    height: 52,
  },
  logoFallback: {
    backgroundColor: Colors.brand.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: { fontSize: 24 },
  logoInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.brand.orange,
    fontFamily: 'Inter_700Bold',
  },
  meta: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
    fontFamily: 'Inter_700Bold',
  },
  tagline: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontFamily: 'Inter_400Regular',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 4,
    alignItems: 'center',
  },
  tag: {
    backgroundColor: Colors.bg.tertiary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 11,
    color: Colors.text.secondary,
    fontFamily: 'Inter_500Medium',
  },
  commentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: Colors.bg.tertiary,
    borderRadius: 6,
  },
  commentCount: {
    fontSize: 11,
    color: Colors.text.tertiary,
    fontFamily: 'Inter_500Medium',
  },
  actions: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  upvoteBtn: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    minWidth: 36,
  },
  upvoteBtnPending: {
    opacity: 0.4,
  },
  upvoteCount: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  bookmarkBtn: {
    padding: 4,
  },
  bookmarkBtnActive: {},
});
