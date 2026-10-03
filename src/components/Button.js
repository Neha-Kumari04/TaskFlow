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
    primary: { bg: colors.primary, fg: colors.primaryText, border: 'transparent', shadow: colors.primary },
    secondary: { bg: colors.surfaceAlt, fg: colors.text, border: colors.border, shadow: 'transparent' },
    danger: { bg: colors.danger, fg: '#FFFFFF', border: 'transparent', shadow: colors.danger },
    outline: { bg: 'transparent', fg: colors.primary, border: colors.primary, shadow: 'transparent' },
    ghost: { bg: 'transparent', fg: colors.textMuted, border: 'transparent', shadow: 'transparent' },
  }[variant];

  const sizing = {
    small: { paddingVertical: 9, paddingHorizontal: 14, fontSize: 13, radius: 11 },
    medium: { paddingVertical: 13, paddingHorizontal: 20, fontSize: 15, radius: 13 },
    large: { paddingVertical: 15, paddingHorizontal: 24, fontSize: 16, radius: 15 },
  }[size];

  const hasElevation = !isDisabled && (variant === 'primary' || variant === 'danger');

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
          opacity: isDisabled ? 0.5 : pressed ? 0.88 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }],
          shadowColor: palette.shadow,
          shadowOpacity: hasElevation ? 0.28 : 0,
          shadowRadius: hasElevation ? 8 : 0,
          shadowOffset: { width: 0, height: 3 },
          elevation: hasElevation ? 3 : 0,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : (
        <View style={styles.content}>
          {!!icon && (
            typeof icon === 'string' ? (
              <Text style={[styles.icon, { color: palette.fg }]}>{icon}</Text>
            ) : (
              icon
            )
          )}
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
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  icon: {
    fontSize: 15,
  },
});
