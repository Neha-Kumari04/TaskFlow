import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useTheme } from '../theme/ThemeContext';

const ICON_BY_FILTER = {
  all: 'layers-outline',
  pending: 'time-outline',
  completed: 'checkmark-done-outline',
  today: 'sunny-outline',
};

const COLOR_BY_FILTER = {
  all: 'primary',
  pending: 'warning',
  completed: 'success',
  today: 'info',
};

export default function StatCard({ label, value, icon, filter, onPress, hint }) {
  const { colors, isDark } = useTheme();

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
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderTopColor: accent,
          borderTopWidth: 2.5,
          shadowColor: colors.shadow,
          shadowOpacity: isDark ? 0.25 : 0.04,
          opacity: pressed && onPress ? 0.88 : 1,
          transform: [{ scale: pressed && onPress ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: softBg }]}>
          <Ionicons name={icon} size={19} color={accent} />
        </View>
        {Boolean(onPress) && (
          <View style={[styles.filterTag, { backgroundColor: colors.surfaceAlt }]}>
            <Ionicons name="arrow-forward" size={11} color={colors.textFaint} />
          </View>
        )}
      </View>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      {Boolean(hint) ? <Text style={[styles.hint, { color: accent }]}>{hint}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
    gap: 2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  hint: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 2,
  },
  filterTag: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
