import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeContext';
import { priorityColors } from '../theme/palette';
import { PRIORITY_LABEL } from '../utils/constants';

export default function PriorityBadge({ priority, size = 'medium', showLabel = true }) {
  const { colors } = useTheme();
  const map = priorityColors[priority] || priorityColors.medium;
  const fg = colors[map.fg];
  const bg = colors[map.bg];
  const small = size === 'small';

  return (
    <View style={[styles.badge, { backgroundColor: bg, paddingVertical: small ? 3.5 : 5, paddingHorizontal: small ? 8 : 10 }]}>
      <Text style={[styles.icon, { color: fg, fontSize: small ? 10 : 12 }]}>{map.icon || '•'}</Text>
      {showLabel && (
        <Text style={[styles.text, { color: fg, fontSize: small ? 10.5 : 12 }]}>
          {PRIORITY_LABEL[priority] || 'Medium'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  icon: {
    fontWeight: '900',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});

