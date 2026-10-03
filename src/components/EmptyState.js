import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeContext';

export default function EmptyState({ icon = '🗂️', title, message, actionLabel, onAction }) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft, borderColor: colors.border }]}>
        {typeof icon === 'string' ? (
          <Text style={styles.icon}>{icon}</Text>
        ) : (
          icon
        )}
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {Boolean(message) && <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>}
      {Boolean(actionLabel) && (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.action,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          <Text style={[styles.actionText, { color: colors.primaryText }]}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 10,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  action: {
    marginTop: 12,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  actionText: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
