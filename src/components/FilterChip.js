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
        },
      ]}
    >
      {!!icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={[styles.label, { color: active ? colors.primaryText : colors.textMuted }]}>{label}</Text>
      {typeof count === 'number' && (
        <View style={[styles.count, { backgroundColor: active ? colors.primaryText : colors.surfaceAlt }]}>
          <Text style={[styles.countText, { color: active ? colors.primary : colors.textMuted }]}>{count}</Text>
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
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  icon: {
    fontSize: 13,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  count: {
    minWidth: 20,
    paddingHorizontal: 6,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
