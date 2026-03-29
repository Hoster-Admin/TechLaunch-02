import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { api } from '@/lib/api';
import { registerPushToken as registerTokenWithServer, unregisterPushToken as unregisterTokenFromServer } from '@/lib/notify';

const PREFS_KEY = 'notification_prefs';

interface NotificationPrefs {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  notificationsEnabled: false,
  soundEnabled: true,
};

interface NotificationContextValue {
  prefs: NotificationPrefs;
  loading: boolean;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setSoundEnabled: (enabled: boolean) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

async function loadPrefs(): Promise<NotificationPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch (err) {
    console.warn('[Notifications] Failed to load prefs from storage:', err);
  }
  return DEFAULT_PREFS;
}

async function savePrefs(prefs: NotificationPrefs): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.warn('[Notifications] Failed to save prefs to storage:', err);
  }
}

function applyHandler(notificationsEnabled: boolean, soundEnabled: boolean) {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data = notification.request.content.data ?? {};
      const isInboxMessage = data.screen === 'inbox' || data.type === 'message';
      return {
        shouldShowAlert: notificationsEnabled,
        shouldShowBanner: notificationsEnabled,
        shouldShowList: notificationsEnabled,
        shouldPlaySound: notificationsEnabled && soundEnabled && isInboxMessage,
        shouldSetBadge: false,
      };
    },
  });
}

async function ensurePermissionGranted(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status: requested } = await Notifications.requestPermissionsAsync();
    return requested === 'granted';
  } catch (err) {
    console.warn('[Notifications] Permission request failed:', err);
    return false;
  }
}

async function registerPushToken(username?: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    await api.patch('/users/me', { pushToken: tokenData.data });
    if (username) {
      await registerTokenWithServer(username, tokenData.data);
    }
  } catch (err) {
    console.warn('[Notifications] Failed to register push token:', err);
  }
}

async function unregisterPushToken(username?: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await api.patch('/users/me', { pushToken: null });
    if (username) {
      await unregisterTokenFromServer(username);
    }
  } catch (err) {
    console.warn('[Notifications] Failed to unregister push token:', err);
  }
}

export function NotificationProvider({
  children,
  isAuthenticated,
  username,
}: {
  children: React.ReactNode;
  isAuthenticated: boolean;
  username?: string;
}) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const permissionRequestedRef = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setLoading(false);
      return;
    }
    (async () => {
      const stored = await loadPrefs();

      let osGranted = false;
      try {
        const { status } = await Notifications.getPermissionsAsync();
        osGranted = status === 'granted';
      } catch (err) {
        console.warn('[Notifications] Failed to query OS permission status:', err);
      }

      const synced: NotificationPrefs = {
        ...stored,
        notificationsEnabled: stored.notificationsEnabled && osGranted,
      };

      setPrefs(synced);
      setLoading(false);

      applyHandler(synced.notificationsEnabled, synced.soundEnabled);

      if (synced.notificationsEnabled !== stored.notificationsEnabled) {
        await savePrefs(synced);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || permissionRequestedRef.current || Platform.OS === 'web') return;
    permissionRequestedRef.current = true;

    (async () => {
      const hasStoredPrefs = await AsyncStorage.getItem(PREFS_KEY).catch(() => null);
      if (hasStoredPrefs !== null) {
        return;
      }
      await ensurePermissionGranted();
    })();
  }, [isAuthenticated]);

  const setNotificationsEnabled = useCallback(async (enabled: boolean) => {
    if (enabled) {
      const granted = await ensurePermissionGranted();
      if (!granted) {
        return;
      }
      const next: NotificationPrefs = { ...prefs, notificationsEnabled: true };
      setPrefs(next);
      await savePrefs(next);
      applyHandler(next.notificationsEnabled, next.soundEnabled);
      await registerPushToken(username);
    } else {
      const next: NotificationPrefs = { ...prefs, notificationsEnabled: false };
      setPrefs(next);
      await savePrefs(next);
      applyHandler(false, next.soundEnabled);
      await unregisterPushToken(username);
    }
  }, [prefs, username]);

  const setSoundEnabled = useCallback(async (enabled: boolean) => {
    const next: NotificationPrefs = { ...prefs, soundEnabled: enabled };
    setPrefs(next);
    await savePrefs(next);
    applyHandler(next.notificationsEnabled, next.soundEnabled);
  }, [prefs]);

  return (
    <NotificationContext.Provider value={{ prefs, loading, setNotificationsEnabled, setSoundEnabled }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationPrefs(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotificationPrefs must be used inside NotificationProvider');
  return ctx;
}
