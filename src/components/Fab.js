import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useTheme } from '../theme/ThemeContext';

export default function Fab({ onPress, label = 'Add task', bottom = 24, style }) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.fab,
        {
          backgroundColor: colors.primary,
          bottom,
          transform: [{ scale: pressed ? 0.95 : 1 }],
          shadowColor: colors.primary,
          opacity: pressed ? 0.92 : 1,
        },
        style,
      ]}
    >
      <Ionicons name="add" size={23} color={colors.primaryText} />
      {!!label && <Text style={[styles.label, { color: colors.primaryText }]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 14,
    height: 52,
    borderRadius: 26,
    shadowOpacity: 0.38,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
