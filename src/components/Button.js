import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeContext';

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  fullWidth = true,
}) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const palette = {
    primary: { bg: colors.primary, fg: colors.primaryText, border: 'transparent' },
    secondary: { bg: colors.surfaceAlt, fg: colors.text, border: colors.border },
    danger: { bg: colors.danger, fg: '#FFFFFF', border: 'transparent' },
    outline: { bg: 'transparent', fg: colors.primary, border: colors.primary },
    ghost: { bg: 'transparent', fg: colors.textMuted, border: 'transparent' },
  }[variant];

  const sizing = {
    small: { paddingVertical: 8, paddingHorizontal: 14, fontSize: 13, radius: 10 },
    medium: { paddingVertical: 13, paddingHorizontal: 20, fontSize: 15, radius: 12 },
    large: { paddingVertical: 16, paddingHorizontal: 24, fontSize: 16, radius: 14 },
  }[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderRadius: sizing.radius,
          paddingVertical: sizing.paddingVertical,
          paddingHorizontal: sizing.paddingHorizontal,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : (
        <View style={styles.content}>
          {!!icon && <Text style={[styles.icon, { color: palette.fg }]}>{icon}</Text>}
          <Text style={[styles.text, { color: palette.fg, fontSize: sizing.fontSize }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontWeight: '700',
  },
  icon: {
    fontSize: 15,
  },
});
