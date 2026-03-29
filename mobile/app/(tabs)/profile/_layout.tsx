import { Stack } from 'expo-router';
import React from 'react';
import { Colors } from '@/constants/Colors';

export default function ProfileLayout() {
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
      <Stack.Screen name="bookmarks" options={{ title: 'Saved' }} />
      <Stack.Screen name="settings/index" options={{ title: 'Settings' }} />
      <Stack.Screen name="settings/edit-profile" options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="settings/change-password" options={{ title: 'Change Password' }} />
      <Stack.Screen name="settings/submissions" options={{ title: 'My Submissions' }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="follow-list" options={{ headerShown: false }} />
    </Stack>
  );
}
