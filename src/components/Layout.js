import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeContext';

export function ScreenHeader({ title, subtitle, right, style }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerText}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {!!subtitle && <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

export function SectionHeader({ title, actionLabel, onAction, style }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.sectionHeader, style]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {!!actionLabel && (
        <Text onPress={onAction} style={[styles.sectionAction, { color: colors.primary }]}>
          {actionLabel}
        </Text>
      )}
    </View>
  );
}

export function Card({ children, style, padded = true }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        padded && styles.cardPadded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function InlineLoader({ label = 'Working…' }) {
  const { colors } = useTheme();

  return (
    <View style={styles.inlineLoader}>
      <ActivityIndicator size="small" color={colors.primary} />
      <Text style={[styles.inlineLoaderText, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
  },
  cardPadded: {
    padding: 16,
  },
  inlineLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
  },
  inlineLoaderText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
