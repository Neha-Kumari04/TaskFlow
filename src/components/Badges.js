import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeContext';

export default function StatusBadge({ status, size = 'medium' }) {
  const { colors } = useTheme();
  const completed = status === 'completed';
  const fg = completed ? colors.success : colors.info;
  const bg = completed ? colors.successSoft : colors.infoSoft;
  const small = size === 'small';

  return (
    <View style={[styles.badge, { backgroundColor: bg, paddingVertical: small ? 3 : 5, paddingHorizontal: small ? 8 : 10 }]}>
      <Text style={[styles.icon, { color: fg, fontSize: small ? 10 : 11 }]}>{completed ? '✓' : '◷'}</Text>
      <Text style={[styles.text, { color: fg, fontSize: small ? 10 : 11.5 }]}>
        {completed ? 'Completed' : 'Pending'}
      </Text>
    </View>
  );
}

export function CategoryPill({ category, size = 'medium' }) {
  const { colors } = useTheme();
  const small = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.surfaceAlt,
          borderColor: colors.border,
          paddingVertical: small ? 3 : 5,
          paddingHorizontal: small ? 8 : 10,
        },
      ]}
    >
      <Text style={[styles.text, { color: colors.textMuted, fontSize: small ? 10 : 11.5 }]} numberOfLines={1}>
        {category || 'Uncategorised'}
      </Text>
    </View>
  );
}

export function OverdueBadge({ days }) {
  const { colors } = useTheme();
  const label = days === 1 ? '1 day overdue' : `${days} days overdue`;

  return (
    <View style={[styles.badge, { backgroundColor: colors.dangerSoft, paddingVertical: 3, paddingHorizontal: 8 }]}>
      <Text style={[styles.text, { color: colors.danger, fontSize: 10 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: {
    fontWeight: '700',
  },
  icon: {
    fontWeight: '900',
  },
});
