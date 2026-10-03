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
    <View style={[styles.badge, { backgroundColor: bg, paddingVertical: small ? 3 : 5, paddingHorizontal: small ? 8 : 10 }]}>
      <View style={[styles.dot, { backgroundColor: fg }]} />
      {showLabel && (
        <Text style={[styles.text, { color: fg, fontSize: small ? 10 : 11.5 }]}>
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
    gap: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
