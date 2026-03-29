import { Feather } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import React, { useLayoutEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { api, getApiError } from '@/lib/api';
import { useNotificationPrefs } from '@/contexts/NotificationContext';

interface SettingsItem {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { logout } = useAuth();
  const [deletingAccount, setDeletingAccount] = useState(false);
  const { prefs, loading: prefsLoading, setNotificationsEnabled, setSoundEnabled } = useNotificationPrefs();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ paddingRight: 8 }}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </Pressable>
      ),
    });
  }, [navigation]);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data — products, posts, comments, and follows. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: async () => {
            setDeletingAccount(true);
            try {
              await api.delete('/users/me');
            } catch (e) {
              const msg = getApiError(e);
              const is404 = msg.toLowerCase().includes('404') || msg.toLowerCase().includes('not found');
              if (!is404) {
                setDeletingAccount(false);
                Alert.alert('Error', 'Could not delete your account right now. Please try again or contact support.');
                return;
              }
            }
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  };

  const sections: SettingsSection[] = [
    {
      title: 'Account',
      items: [
        { icon: 'user' as const, label: 'Edit Profile', onPress: () => router.push('/(tabs)/profile/settings/edit-profile') },
        { icon: 'lock' as const, label: 'Change Password', onPress: () => router.push('/(tabs)/profile/settings/change-password') },
      ],
    },
    {
      title: 'Content',
      items: [
        { icon: 'box' as const, label: 'My Submissions', onPress: () => router.push('/(tabs)/profile/settings/submissions') },
        { icon: 'bookmark' as const, label: 'Saved', onPress: () => router.push('/(tabs)/profile/bookmarks') },
      ],
    },
    {
      title: 'Danger Zone',
      items: [
        { icon: 'log-out' as const, label: 'Sign Out', onPress: logout, destructive: true },
        { icon: 'trash-2' as const, label: 'Delete My Account', onPress: handleDeleteAccount, destructive: true },
      ],
    },
  ];

  if (deletingAccount) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.status.error} />
        <Text style={styles.loadingText}>Deleting your account…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 100 : insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {sections.slice(0, 2).map((section, si) => (
        <View key={si} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionItems}>
            {section.items.map((item, ii) => (
              <Pressable
                key={ii}
                style={({ pressed }) => [
                  styles.item,
                  ii < section.items.length - 1 && styles.itemBorder,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={item.onPress}
              >
                <View style={[styles.iconWrap, item.destructive && styles.iconWrapDestructive]}>
                  <Feather
                    name={item.icon}
                    size={18}
                    color={item.destructive ? Colors.status.error : Colors.brand.orange}
                  />
                </View>
                <Text style={[styles.itemLabel, item.destructive && styles.itemLabelDestructive]}>
                  {item.label}
                </Text>
                {!item.destructive && (
                  <Feather name="chevron-right" size={16} color={Colors.text.tertiary} />
                )}
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.sectionItems}>
          <View style={[styles.item, styles.itemBorder]}>
            <View style={styles.iconWrap}>
              <Feather name="bell" size={18} color={Colors.brand.orange} />
            </View>
            <Text style={styles.itemLabel}>Notifications</Text>
            <Switch
              value={prefsLoading ? false : prefs.notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              disabled={prefsLoading}
              trackColor={{ false: Colors.border.default, true: Colors.brand.orange }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.item}>
            <View style={[styles.iconWrap, !prefs.notificationsEnabled && styles.iconWrapDisabled]}>
              <Feather
                name="volume-2"
                size={18}
                color={prefs.notificationsEnabled ? Colors.brand.orange : Colors.text.tertiary}
              />
            </View>
            <Text style={[styles.itemLabel, !prefs.notificationsEnabled && styles.itemLabelDisabled]}>
              Sound (Messages)
            </Text>
            <Switch
              value={prefsLoading ? false : prefs.soundEnabled}
              onValueChange={setSoundEnabled}
              disabled={prefsLoading || !prefs.notificationsEnabled}
              trackColor={{ false: Colors.border.default, true: Colors.brand.orange }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </View>

      {sections.slice(2).map((section, si) => (
        <View key={`danger-${si}`} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionItems}>
            {section.items.map((item, ii) => (
              <Pressable
                key={ii}
                style={({ pressed }) => [
                  styles.item,
                  ii < section.items.length - 1 && styles.itemBorder,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={item.onPress}
              >
                <View style={[styles.iconWrap, item.destructive && styles.iconWrapDestructive]}>
                  <Feather
                    name={item.icon}
                    size={18}
                    color={item.destructive ? Colors.status.error : Colors.brand.orange}
                  />
                </View>
                <Text style={[styles.itemLabel, item.destructive && styles.itemLabelDestructive]}>
                  {item.label}
                </Text>
                {!item.destructive && (
                  <Feather name="chevron-right" size={16} color={Colors.text.tertiary} />
                )}
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.version}>
        <Text style={styles.versionText}>Tech Launch MENA</Text>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.secondary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg.secondary, gap: 16 },
  loadingText: { fontSize: 15, color: Colors.text.secondary, fontFamily: 'Inter_400Regular' },
  section: { marginTop: 20, marginHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: Colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, fontFamily: 'Inter_600SemiBold' },
  sectionItems: { backgroundColor: Colors.bg.primary, borderRadius: 14, overflow: 'hidden', borderWidth: 1.5, borderColor: Colors.border.default },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 16 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border.light },
  iconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.brand.light, justifyContent: 'center', alignItems: 'center' },
  iconWrapDestructive: { backgroundColor: '#FEF2F2' },
  iconWrapDisabled: { backgroundColor: Colors.bg.secondary },
  itemLabel: { flex: 1, fontSize: 15, color: Colors.text.primary, fontFamily: 'Inter_500Medium' },
  itemLabelDestructive: { color: Colors.status.error },
  itemLabelDisabled: { color: Colors.text.tertiary },
  version: { alignItems: 'center', marginTop: 40, gap: 4 },
  versionText: { fontSize: 12, color: Colors.text.tertiary, fontFamily: 'Inter_400Regular' },
});
