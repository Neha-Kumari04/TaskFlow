import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useTheme } from '../theme/ThemeContext';
import { CATEGORY_PALETTE } from '../theme/palette';

export default function StatusBadge({ status, size = 'medium' }) {
  const { colors } = useTheme();
  const completed = status === 'completed';
  const fg = completed ? colors.success : colors.info;
  const bg = completed ? colors.successSoft : colors.infoSoft;
  const small = size === 'small';

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: 'transparent', paddingVertical: small ? 3.5 : 5, paddingHorizontal: small ? 8 : 11 }]}>
      <Ionicons name={completed ? 'checkmark-circle' : 'time'} size={small ? 11 : 13} color={fg} />
      <Text style={[styles.text, { color: fg, fontSize: small ? 10.5 : 12 }]}>
        {completed ? 'Completed' : 'Pending'}
      </Text>
    </View>
  );
}

export function CategoryPill({ category, size = 'medium' }) {
  const { colors, isDark } = useTheme();
  const small = size === 'small';
  const key = category || 'Other';
  const palette = CATEGORY_PALETTE[key] || CATEGORY_PALETTE.Other;
  const fg = isDark ? palette.darkFg : palette.fg;
  const bg = isDark ? palette.darkBg : palette.bg;
  const icon = palette.icon || 'pricetag-outline';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderColor: isDark ? 'transparent' : 'rgba(0,0,0,0.04)',
          paddingVertical: small ? 3.5 : 5,
          paddingHorizontal: small ? 8 : 11,
        },
      ]}
    >
      <Ionicons name={icon} size={small ? 10.5 : 12} color={fg} />
      <Text style={[styles.text, { color: fg, fontSize: small ? 10.5 : 12 }]} numberOfLines={1}>
        {category || 'General'}
      </Text>
    </View>
  );
}

export function OverdueBadge({ days }) {
  const { colors } = useTheme();
  const label = days === 1 ? '1d overdue' : `${days}d overdue`;

  return (
    <View style={[styles.badge, { backgroundColor: colors.dangerSoft, paddingVertical: 3.5, paddingHorizontal: 8 }]}>
      <Ionicons name="alert-circle" size={11} color={colors.danger} />
      <Text style={[styles.text, { color: colors.danger, fontSize: 10.5 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});

