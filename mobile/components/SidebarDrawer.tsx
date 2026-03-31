import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useRef, useEffect } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';

const DRAWER_WIDTH = Math.min(Dimensions.get('window').width * 0.85, 340);

interface NavItem {
  icon?: React.ComponentProps<typeof Feather>['name'];
  emoji?: string;
  label: string;
  onPress: () => void;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function SidebarDrawer({ visible, onClose }: Props) {
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  function navigate(path: Parameters<typeof router.replace>[0]) {
    onClose();
    setTimeout(() => router.replace(path), 240);
  }

  function navigatePush(path: Parameters<typeof router.push>[0]) {
    onClose();
    setTimeout(() => router.push(path), 240);
  }

  function navigateEcosystem(type: string) {
    onClose();
    setTimeout(
      () => router.replace({ pathname: '/(tabs)/discover/ecosystem', params: { type } }),
      240,
    );
  }

  const communityNav: NavItem[] = [
    { icon: 'home',   label: 'Products',   onPress: () => navigate('/(tabs)/home') },
    { icon: 'users',  label: 'People',     onPress: () => navigate('/(tabs)/discover/people') },
    { icon: 'zap',    label: 'Launcher',   onPress: () => navigate('/(tabs)/launcher') },
    { icon: 'layers', label: 'Ecosystem',  onPress: () => navigateEcosystem('company') },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateX: slideAnim }],
              paddingTop: Platform.OS === 'web' ? 16 : insets.top + 8,
              paddingBottom: Platform.OS === 'web' ? 20 : insets.bottom + 20,
            },
          ]}
        >
          <View style={styles.drawerHeader}>
            <Image
              source={require('../assets/images/tlmena-logo.png')}
              style={styles.logoBadge}
              contentFit="cover"
            />
            <Text style={styles.drawerTitle}>Tech Launch</Text>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Feather name="x" size={22} color={Colors.text.secondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>Community</Text>

            {communityNav.map((item) => (
              <Pressable
                key={item.label}
                style={({ pressed }) => [styles.navItem, { opacity: pressed ? 0.7 : 1 }]}
                onPress={item.onPress}
              >
                {item.emoji ? (
                  <Text style={styles.navEmoji}>{item.emoji}</Text>
                ) : (
                  <Feather name={item.icon!} size={16} color={Colors.text.secondary} />
                )}
                <Text style={styles.navLabel}>{item.label}</Text>
              </Pressable>
            ))}

            <View style={styles.divider} />

            <Pressable
              style={({ pressed }) => [styles.menuLink, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => navigatePush('/(tabs)/profile/settings')}
            >
              <Feather name="settings" size={18} color={Colors.text.secondary} />
              <Text style={styles.menuLinkText}>Settings</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.menuLink, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => { onClose(); setTimeout(() => logout(), 240); }}
            >
              <Feather name="log-out" size={18} color="#E53935" />
              <Text style={[styles.menuLinkText, { color: '#E53935' }]}>Sign Out</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  drawer: {
    width: DRAWER_WIDTH,
    backgroundColor: Colors.bg.primary,
    shadowColor: '#000',
    shadowOffset: { width: -3, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 20,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  drawerTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
    fontFamily: 'Inter_700Bold',
  },
  closeBtn: { padding: 4 },
  scrollArea: { flex: 1 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.tertiary,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  navEmoji: {
    fontSize: 16,
    width: 16,
    textAlign: 'center',
  },
  navLabel: {
    fontSize: 15,
    color: Colors.text.primary,
    fontFamily: 'Inter_500Medium',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.default,
    marginVertical: 12,
    marginHorizontal: 16,
  },
  menuLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  menuLinkText: {
    fontSize: 15,
    color: Colors.text.secondary,
    fontFamily: 'Inter_500Medium',
  },
});
