import { BlurView } from 'expo-blur';
import { Redirect, Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadCount } from '@/lib/useUnreadCount';

function InboxTabIcon({ color }: { color: string }) {
  const unreadCount = useUnreadCount();

  return (
    <View style={{ width: 26, height: 26, justifyContent: 'center', alignItems: 'center' }}>
      <Feather name="inbox" size={22} color={color} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  if (!isLoading && !isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenListeners={{
        tabPress: () => { Haptics.selectionAsync(); },
      }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.brand.orange,
        tabBarInactiveTintColor: Colors.text.tertiary,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : '#fff',
          borderTopWidth: 1,
          borderTopColor: Colors.border.default,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#fff' }]} />
          ),
        tabBarLabelStyle: { fontFamily: 'Inter_500Medium', fontSize: 10 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Products',
          tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="launcher"
        options={{
          title: 'Launcher',
          tabBarIcon: ({ color }) => <Feather name="zap" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color }) => <InboxTabIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.brand.orange,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: { fontSize: 8, color: '#fff', fontFamily: 'Inter_700Bold', fontWeight: '700' },
});
