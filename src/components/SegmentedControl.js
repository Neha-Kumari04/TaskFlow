import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeContext';

export default function SegmentedControl({ options, value, onChange, style }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.track, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }, style]}>
      {options.map((option) => {
        const active = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.segment,
              active && {
                backgroundColor: colors.surface,
                shadowColor: colors.shadow,
                shadowOpacity: 0.12,
                shadowRadius: 5,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              },
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                { color: active ? colors.text : colors.textMuted, fontWeight: active ? '700' : '600' },
              ]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SegmentedScroll({ options, value, onChange }) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.track, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
        {options.map((option) => {
          const active = option.key === value;
          return (
            <Pressable
              key={option.key}
              onPress={() => onChange(option.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.segment,
                active && {
                  backgroundColor: colors.surface,
                  shadowColor: colors.shadow,
                  shadowOpacity: 0.12,
                  shadowRadius: 5,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                },
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: active ? colors.text : colors.textMuted, fontWeight: active ? '700' : '600' },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
  },
  scrollContent: {
    paddingRight: 8,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 11,
  },
  segmentText: {
    fontSize: 13,
    letterSpacing: -0.1,
  },
});
