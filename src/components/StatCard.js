import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme/ThemeContext';

const ICON_BY_FILTER = {
  all: 'layers-outline',
  pending: 'time-outline',
  completed: 'checkmark-done-outline',
};

const COLOR_BY_FILTER = {
  all: 'primary',
  pending: 'warning',
  completed: 'success',
};

export default function StatCard({ label, value, icon, filter, onPress, hint }) {
  const { colors } = useTheme();

  const accent = useMemo(() => colors[COLOR_BY_FILTER[filter] || 'primary'], [colors, filter]);
  const softBg = useMemo(() => colors[`${COLOR_BY_FILTER[filter] || 'primary'}Soft`] || colors.primarySoft, [colors, filter]);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={`${label}: ${value}${hint ? `, ${hint}` : ''}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: softBg }]}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      {!!hint && <Text style={[styles.hint, { color: accent }]}>{hint}</Text>}
      {!!onPress && filter && (
        <View style={[styles.filterTag, { backgroundColor: softBg }]}>
          <Ionicons name={ICON_BY_FILTER[filter] || 'layers-outline'} size={11} color={accent} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 3,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  hint: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 1,
  },
  filterTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
