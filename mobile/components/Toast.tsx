import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { Colors } from '@/constants/Colors';

interface Props {
  message: string;
  type?: 'success' | 'error';
  visible: boolean;
}

export function Toast({ message, type = 'success', visible }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;

  useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      translateY.setValue(-12);
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
        ]),
        Animated.delay(1700),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, message]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        type === 'error' && styles.containerError,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <Feather
        name={type === 'success' ? 'check-circle' : 'alert-circle'}
        size={16}
        color="#fff"
      />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 72,
    left: 20,
    right: 20,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  containerError: { backgroundColor: Colors.status.error },
  message: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Inter_500Medium',
  },
});
