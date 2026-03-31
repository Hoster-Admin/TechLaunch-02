import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

interface Props {
  uri?: string;
  name: string;
  size?: number;
  color?: string;
}

const PALETTE = [
  '#E15033', '#2563EB', '#16A34A', '#D97706', '#7C3AED',
  '#DB2777', '#0891B2', '#059669', '#9333EA', '#DC2626',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function pickColor(name: string, override?: string): string {
  if (override) return override;
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function Avatar({ uri, name, size = 40, color }: Props) {
  const [error, setError] = useState(false);
  const radius = size / 2;
  const initials = getInitials(name);
  const bg = pickColor(name, color);
  const fontSize = size < 32 ? size * 0.38 : size < 50 ? size * 0.36 : size * 0.33;

  useEffect(() => {
    setError(false);
  }, [uri]);

  if (uri && !error) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden' }}
        contentFit="cover"
        onError={() => setError(true)}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: bg,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <Text style={{ fontSize, fontWeight: '700', color: '#fff', letterSpacing: 0.5 }}>
        {initials}
      </Text>
    </View>
  );
}
