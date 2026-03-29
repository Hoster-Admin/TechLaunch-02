import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { Colors } from '@/constants/Colors';
import { api } from '@/lib/api';
import { adaptUser } from '@/lib/adapters';
import type { User } from '@/types';

export default function FollowListScreen() {
  const { userId, type } = useLocalSearchParams<{ userId: string; type: 'followers' | 'following' }>();
  const insets = useSafeAreaInsets();

  const title = type === 'followers' ? 'Followers' : 'Following';

  const { data: users = [], isLoading, isError } = useQuery<User[]>({
    queryKey: ['followList', userId, type],
    queryFn: async () => {
      const res = await api.get(`/users/${userId}/${type}`);
      const raw = res.data?.data ?? res.data ?? [];
      const list: unknown[] = Array.isArray(raw) ? raw : [];
      return (list as Record<string, unknown>[]).map(adaptUser);
    },
    enabled: !!userId && !!type,
  });

  function handlePersonPress(user: User) {
    router.push({
      pathname: '/(tabs)/discover/people/[id]',
      params: { id: user.username || user.id },
    });
  }

  function renderUser({ item }: { item: User }) {
    return (
      <Pressable
        style={({ pressed }) => [styles.row, { opacity: pressed ? 0.75 : 1 }]}
        onPress={() => handlePersonPress(item)}
      >
        <Avatar uri={item.avatar} name={item.name} size={44} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          {item.username ? (
            <Text style={styles.username} numberOfLines={1}>@{item.username}</Text>
          ) : null}
          {item.role ? (
            <Text style={styles.role} numberOfLines={1}>{item.role}</Text>
          ) : null}
        </View>
        <Feather name="chevron-right" size={16} color={Colors.text.tertiary} />
      </Pressable>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerRight} />
      </View>

      {isLoading ? (
        <ActivityIndicator
          color={Colors.brand.orange}
          style={{ marginTop: 60 }}
        />
      ) : isError ? (
        <View style={styles.emptyState}>
          <Feather name="alert-circle" size={40} color={Colors.text.tertiary} />
          <Text style={styles.emptyTitle}>Could not load {title.toLowerCase()}</Text>
          <Text style={styles.emptySubtitle}>Please try again later.</Text>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather
            name={type === 'followers' ? 'users' : 'user-plus'}
            size={48}
            color={Colors.text.tertiary}
          />
          <Text style={styles.emptyTitle}>
            {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {type === 'followers'
              ? "When someone follows this account, they'll appear here."
              : "When this account follows someone, they'll appear here."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u.id}
          renderItem={renderUser}
          contentContainerStyle={{ paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  headerRight: {
    width: 30,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.bg.primary,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  name: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.primary,
  },
  username: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.secondary,
    marginTop: 1,
  },
  role: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border.default,
    marginLeft: 72,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
