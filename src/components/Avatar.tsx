import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { useScaleIn } from '../hooks/useAnimations';

const AVATAR_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];

interface AvatarProps {
  name: string;
  imageUri?: string | null;
  size?: number;
}

export function Avatar({ name, imageUri, size = 44 }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colorIndex = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  const { animatedStyle: scaleStyle, enter } = useScaleIn(0);

  useEffect(() => {
    enter();
  }, []);

  if (imageUri) {
    return (
      <Animated.View style={scaleStyle}>
        <Image
          source={{ uri: imageUri }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: AVATAR_COLORS[colorIndex],
        },
        scaleStyle,
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    color: Colors.white,
    fontWeight: '700',
  },
});
