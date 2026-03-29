import { Stack } from 'expo-router';
import React from 'react';
import { Colors } from '@/constants/Colors';

export default function LauncherLayout() {
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
      <Stack.Screen name="compose" options={{ title: 'New Post', presentation: 'modal' }} />
    </Stack>
  );
}
