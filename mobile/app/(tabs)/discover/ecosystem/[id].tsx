import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
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

export default function EntityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const { data: entity, isLoading } = useQuery<EcosystemEntity>({
    queryKey: ['entity', id],
    queryFn: async () => {
      const res = await api.get(`/entities/${id}`);
      return adaptEntity(res.data.data ?? res.data);
    },
  });

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

  if (!entity) return null;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: entity.website ? 90 : 24 }}
      >
        <View style={styles.hero}>
          <EntityLogoImage uri={entity.logo} name={entity.name} />
          <Text style={styles.entityName}>{entity.name}</Text>
          {!!entity.description && (
            <Text style={styles.entityDesc}>{entity.description}</Text>
          )}
          {(entity.country || (entity.focus && entity.focus.length > 0)) && (
            <View style={styles.tagRow}>
              {entity.country && (
                <View style={styles.tag}>
                  <Feather name="map-pin" size={11} color={Colors.text.secondary} />
                  <Text style={styles.tagText}>{entity.country}</Text>
                </View>
              )}
              {entity.focus?.slice(0, 3).map((f) => (
                <View key={f} style={styles.tag}>
                  <Text style={styles.tagText}>{f}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {entity.stage && entity.stage.length > 0 && (
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

      {entity.website && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            style={({ pressed }) => [styles.websiteBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => Linking.openURL(entity.website!)}
          >
            <Feather name="globe" size={16} color="#fff" />
            <Text style={styles.websiteBtnText}>Visit Website</Text>
          </Pressable>
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
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    gap: 8,
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
  entityDesc: { fontSize: 14, color: Colors.text.secondary, textAlign: 'center', lineHeight: 20, fontFamily: 'Inter_400Regular' },
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
  section: { padding: 20, gap: 12, borderBottomWidth: 1, borderBottomColor: Colors.border.default },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold' },
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
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
    backgroundColor: Colors.bg.primary,
  },
  websiteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: Colors.brand.orange,
  },
  websiteBtnText: { fontSize: 16, fontWeight: '600', color: '#fff', fontFamily: 'Inter_600SemiBold' },
});
