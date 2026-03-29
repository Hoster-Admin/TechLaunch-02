import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';

interface Props {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon = 'inbox', title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Feather name={icon} size={32} color={Colors.text.tertiary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 12 },
  iconWrap: { width: 68, height: 68, borderRadius: 34, backgroundColor: Colors.bg.tertiary, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '600', color: Colors.text.primary, textAlign: 'center', fontFamily: 'Inter_600SemiBold' },
  subtitle: { fontSize: 14, color: Colors.text.secondary, textAlign: 'center', lineHeight: 20, fontFamily: 'Inter_400Regular' },
});
