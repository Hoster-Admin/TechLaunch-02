import { Feather } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { api } from '@/lib/api';
import { adaptEntity } from '@/lib/adapters';
import type { EcosystemEntity } from '@/types';

const INVESTOR_TYPES = ['investor', 'vc', 'venture_capital'];

function EntityLogoImage({ uri, name }: { uri?: string; name: string }) {
  const [err, setErr] = useState(false);
  React.useEffect(() => { setErr(false); }, [uri]);
  if (uri && !err) {
    return (
      <Image
        source={{ uri }}
        style={[styles.logo, { overflow: 'hidden' }]}
        contentFit="contain"
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <View style={[styles.logo, styles.logoFallback]}>
      <Text style={styles.logoText}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value, onPress }: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.infoRow, onPress && { opacity: pressed ? 0.7 : 1 }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.infoIconWrap}>
        <Feather name={icon} size={15} color={Colors.brand.orange} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, onPress && styles.infoValueLink]} numberOfLines={1}>
          {value}
        </Text>
      </View>
      {onPress && <Feather name="external-link" size={13} color={Colors.text.tertiary} />}
    </Pressable>
  );
}

export default function EntityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [refreshing, setRefreshing] = useState(false);

  const { data: entity, isLoading } = useQuery<EcosystemEntity>({
    queryKey: ['entity', id],
    queryFn: async () => {
      const res = await api.get(`/entities/${id}`);
      return adaptEntity(res.data.data ?? res.data);
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.refetchQueries({ queryKey: ['entity', id] });
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <Feather name="arrow-left" size={22} color={Colors.text.primary} />
          </Pressable>
          <Text style={styles.topBarTitle} numberOfLines={1} />
        </View>
        <ActivityIndicator color={Colors.brand.orange} style={{ marginTop: 60 }} />
      </View>
    );
  }

  if (!entity) return null;

  const isInvestor = INVESTOR_TYPES.includes((entity.type ?? '').toLowerCase());
  const hasFooter = !!(entity.website || entity.applicationUrl);
  const twitterClean = entity.twitter
    ? entity.twitter.replace(/^@/, '').replace(/^https?:\/\/(www\.)?twitter\.com\//i, '').replace(/^https?:\/\/(www\.)?x\.com\//i, '')
    : undefined;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.topBarTitle} numberOfLines={1}>{entity.name}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hasFooter ? 100 : 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.brand.orange}
            colors={[Colors.brand.orange]}
          />
        }
      >
        <View style={styles.hero}>
          <EntityLogoImage uri={entity.logo} name={entity.name} />
          <Text style={styles.entityName}>{entity.name}</Text>
          {(entity.country || (entity.focus && entity.focus.length > 0)) && (
            <View style={styles.tagRow}>
              {entity.country && (
                <View style={styles.tag}>
                  <Feather name="map-pin" size={11} color={Colors.text.secondary} />
                  <Text style={styles.tagText}>{entity.country}</Text>
                </View>
              )}
              {entity.focus?.map((f) => (
                <View key={f} style={styles.tagFocus}>
                  <Text style={styles.tagFocusText}>{f}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {!!entity.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.descText}>{entity.description}</Text>
          </View>
        )}

        {(entity.foundedYear || entity.country || twitterClean || entity.contactEmail) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.infoCard}>
              {!!entity.foundedYear && (
                <InfoRow icon="calendar" label="Founded" value={String(entity.foundedYear)} />
              )}
              {!!entity.country && (
                <InfoRow icon="map-pin" label="Location" value={entity.country} />
              )}
              {!!twitterClean && (
                <InfoRow
                  icon="twitter"
                  label="Twitter / X"
                  value={`@${twitterClean}`}
                  onPress={() => {
                    Haptics.selectionAsync();
                    Linking.openURL(`https://x.com/${twitterClean}`);
                  }}
                />
              )}
              {!!entity.contactEmail && (
                <InfoRow
                  icon="mail"
                  label="Contact"
                  value={entity.contactEmail}
                  onPress={() => {
                    Haptics.selectionAsync();
                    Linking.openURL(`mailto:${entity.contactEmail}`);
                  }}
                />
              )}
            </View>
          </View>
        )}

        {isInvestor && entity.stage && entity.stage.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Investment Stage</Text>
            <View style={styles.stageRow}>
              {entity.stage.map((s) => (
                <View key={s} style={styles.stageChip}>
                  <Text style={styles.stageText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {hasFooter && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          {entity.applicationUrl && (
            <Pressable
              style={({ pressed }) => [styles.applyBtn, { opacity: pressed ? 0.85 : 1 }, entity.website && styles.applyBtnOutline]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Linking.openURL(entity.applicationUrl!);
              }}
            >
              <Feather name="send" size={15} color={entity.website ? Colors.brand.orange : '#fff'} />
              <Text style={[styles.applyBtnText, entity.website && styles.applyBtnTextOutline]}>Apply Now</Text>
            </Pressable>
          )}
          {entity.website && (
            <Pressable
              style={({ pressed }) => [styles.websiteBtn, { opacity: pressed ? 0.85 : 1 }, entity.applicationUrl && styles.websiteBtnSecondary]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Linking.openURL(entity.website!);
              }}
            >
              <Feather name="globe" size={15} color={entity.applicationUrl ? Colors.brand.orange : '#fff'} />
              <Text style={[styles.websiteBtnText, entity.applicationUrl && styles.websiteBtnTextSecondary]}>
                Visit Website
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    gap: 8,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'flex-start' },
  topBarTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  logo: { width: 80, height: 80, borderRadius: 18 },
  logoFallback: {
    backgroundColor: Colors.brand.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: { fontSize: 30, fontWeight: '700', color: Colors.brand.orange, fontFamily: 'Inter_700Bold' },
  entityName: { fontSize: 22, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bg.tertiary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: { fontSize: 12, color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },
  tagFocus: {
    backgroundColor: Colors.brand.light,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagFocusText: { fontSize: 12, color: Colors.brand.orange, fontFamily: 'Inter_500Medium' },
  section: {
    padding: 20,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold' },
  descText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  infoCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    backgroundColor: Colors.bg.primary,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.brand.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: { flex: 1, gap: 1 },
  infoLabel: { fontSize: 11, color: Colors.text.tertiary, fontFamily: 'Inter_500Medium' },
  infoValue: { fontSize: 14, color: Colors.text.primary, fontFamily: 'Inter_500Medium' },
  infoValueLink: { color: Colors.brand.orange },
  stageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stageChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.brand.orange,
    backgroundColor: Colors.brand.light,
  },
  stageText: { fontSize: 13, color: Colors.brand.orange, fontFamily: 'Inter_500Medium' },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
    backgroundColor: Colors.bg.primary,
  },
  websiteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.brand.orange,
  },
  websiteBtnSecondary: {
    backgroundColor: Colors.brand.light,
    borderWidth: 1.5,
    borderColor: Colors.brand.orange,
  },
  websiteBtnText: { fontSize: 15, fontWeight: '600', color: '#fff', fontFamily: 'Inter_600SemiBold' },
  websiteBtnTextSecondary: { color: Colors.brand.orange },
  applyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.brand.orange,
  },
  applyBtnOutline: {
    backgroundColor: Colors.brand.light,
    borderWidth: 1.5,
    borderColor: Colors.brand.orange,
  },
  applyBtnText: { fontSize: 15, fontWeight: '600', color: '#fff', fontFamily: 'Inter_600SemiBold' },
  applyBtnTextOutline: { color: Colors.brand.orange },
});
