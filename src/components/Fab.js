import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
          shadowColor: colors.shadow,
          opacity: pressed ? 0.9 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.icon, { color: colors.primaryText }]}>＋</Text>
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
    gap: 8,
    paddingHorizontal: 20,
    height: 56,
    borderRadius: 28,
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  icon: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 26,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
  },
});
