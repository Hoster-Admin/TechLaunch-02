import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useUnreadCount } from '@/lib/useUnreadCount';

interface Props {
  onMenuPress: () => void;
  onSearchChange?: (text: string) => void;
}

export function AppHeader({ onMenuPress, onSearchChange }: Props) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 0 : insets.top;
  const unreadCount = useUnreadCount();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const widthAnim = useRef(new Animated.Value(0)).current;

  function openSearch() {
    setSearchOpen(true);
    Animated.timing(widthAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: false,
    }).start(() => inputRef.current?.focus());
  }

  function closeSearch() {
    setSearchText('');
    onSearchChange?.('');
    Animated.timing(widthAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start(() => setSearchOpen(false));
  }

  function handleSearchChange(text: string) {
    setSearchText(text);
    onSearchChange?.(text);
  }

  const animatedWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '65%'],
  });

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.inner}>
        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <Feather name="bar-chart-2" size={16} color="#fff" />
          </View>
        </View>

        <View style={styles.actions}>
          {onSearchChange && (
            <Animated.View
              style={[
                styles.searchWrap,
                searchOpen ? { width: animatedWidth, opacity: 1 } : { width: 0, opacity: 0 },
              ]}
            >
              {searchOpen && (
                <View style={styles.searchBar}>
                  <TextInput
                    ref={inputRef}
                    style={styles.searchInput}
                    placeholder="Search..."
                    placeholderTextColor={Colors.text.tertiary}
                    value={searchText}
                    onChangeText={handleSearchChange}
                    returnKeyType="search"
                    autoCorrect={false}
                  />
                  {!!searchText && (
                    <Pressable onPress={() => { setSearchText(''); onSearchChange?.(''); }} hitSlop={8}>
                      <Feather name="x" size={14} color={Colors.text.tertiary} />
                    </Pressable>
                  )}
                </View>
              )}
            </Animated.View>
          )}

          {onSearchChange && (
            <Pressable
              style={styles.iconBtn}
              onPress={searchOpen ? closeSearch : openSearch}
              hitSlop={8}
            >
              <Feather
                name={searchOpen ? 'x' : 'search'}
                size={20}
                color={searchOpen ? Colors.brand.orange : Colors.text.primary}
              />
            </Pressable>
          )}

          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push('/(tabs)/profile/notifications')}
            hitSlop={8}
          >
            <Feather name="bell" size={22} color={Colors.text.primary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Animated.Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Animated.Text>
              </View>
            )}
          </Pressable>

          <Pressable onPress={onMenuPress} hitSlop={8}>
            <Feather name="menu" size={24} color={Colors.text.primary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bg.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  logoRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchWrap: {
    overflow: 'hidden',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.secondary,
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    height: 34,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    fontFamily: 'Inter_400Regular',
    paddingVertical: 0,
  },
  iconBtn: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -7,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    fontSize: 8,
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
});
