import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

interface Props {
  uri?: string;
  name: string;
  size?: number;
}

export function Avatar({ uri, name, size = 40 }: Props) {
  const [error, setError] = useState(false);
  const radius = size / 2;

  useEffect(() => {
    setError(false);
  }, [uri]);

  if (uri && !error) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radius }}
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
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <Feather name="user" size={size * 0.52} color="#9CA3AF" />
    </View>
  );
}
