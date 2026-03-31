import { Stack } from 'expo-router';
import React from 'react';
import { Colors } from '@/constants/Colors';

export default function DiscoverLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: Colors.text.primary,
        headerStyle: { backgroundColor: Colors.bg.primary },
        headerShadowVisible: false,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen name="ecosystem/index" options={{ headerShown: false }} />
      <Stack.Screen name="ecosystem/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="people/index" options={{ title: 'People', headerShown: true }} />
      <Stack.Screen name="people/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="submit" options={{ headerShown: false }} />
    </Stack>
  );
}
