import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeContext';

export default function FilterChip({ label, active, onPress, count, icon }) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.surface,
          borderColor: active ? colors.primary : colors.border,
          opacity: pressed ? 0.8 : 1,
          shadowColor: active ? colors.primary : 'transparent',
          shadowOpacity: active ? 0.22 : 0,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: active ? 2 : 0,
        },
      ]}
    >
      {!!icon && (
        typeof icon === 'string' ? (
          <Text style={styles.icon}>{icon}</Text>
        ) : (
          icon
        )
      )}
      <Text style={[styles.label, { color: active ? colors.primaryText : colors.textMuted }]}>{label}</Text>
      {typeof count === 'number' && (
        <View style={[styles.count, { backgroundColor: active ? 'rgba(255, 255, 255, 0.25)' : colors.surfaceAlt }]}>
          <Text style={[styles.countText, { color: active ? colors.primaryText : colors.textMuted }]}>{count}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  icon: {
    fontSize: 13,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  count: {
    minWidth: 19,
    paddingHorizontal: 5,
    height: 19,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
