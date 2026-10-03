import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '../theme/ThemeContext';

export function FormField({ label, value, onChangeText, error, required, multiline, placeholder, keyboardType, autoCapitalize, style, maxLength, editable = true }) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={[styles.field, style]}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.textMuted }]}>
          {label}
          {required && <Text style={{ color: colors.danger }}> *</Text>}
        </Text>
        {!!maxLength && (
          <Text style={[styles.counter, { color: colors.textFaint }]}>
            {String(value || '').length}/{maxLength}
          </Text>
        )}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        editable={editable}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={label}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            backgroundColor: editable ? colors.surface : colors.surfaceAlt,
            borderColor,
            color: colors.text,
            textAlignVertical: multiline ? 'top' : 'center',
          },
        ]}
      />
      {!!error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
}

export function DateField({ label, value, error, onPress, onClear, required, disabled }) {
  const { colors } = useTheme();

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textMuted }]}>
        {label}
        {required && <Text style={{ color: colors.danger }}> *</Text>}
      </Text>
      <View style={styles.dateRow}>
        <Pressable
          onPress={disabled ? undefined : onPress}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${value || 'not set'}`}
          style={({ pressed }) => [
            styles.dateButton,
            {
              backgroundColor: disabled ? colors.surfaceAlt : colors.surface,
              borderColor: error ? colors.danger : colors.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={styles.dateIcon}>📅</Text>
          <Text style={[styles.dateText, { color: value ? colors.text : colors.textFaint }]}>
            {value || 'Select date'}
          </Text>
        </Pressable>
        {!!value && !disabled && (
          <Pressable onPress={onClear} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Clear ${label}`}>
            <Text style={[styles.clear, { color: colors.textFaint }]}>✕</Text>
          </Pressable>
        )}
      </View>
      {!!error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
}

export function OptionPicker({ label, options, value, onChange, error, columns = 3, required }) {
  const { colors } = useTheme();

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textMuted }]}>
        {label}
        {required && <Text style={{ color: colors.danger }}> *</Text>}
      </Text>
      <View style={styles.optionGrid}>
        {options.map((option) => {
          const active = option.key === value;
          const accent = colors[option.colorKey] || colors.primary;
          return (
            <Pressable
              key={option.key}
              onPress={() => onChange(option.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.option,
                {
                  flexBasis: `${100 / columns}%`,
                  backgroundColor: active ? accent : colors.surface,
                  borderColor: active ? accent : colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: active ? colors.primaryText : colors.textMuted },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {!!error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 7,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  counter: {
    fontSize: 11,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 48,
  },
  multiline: {
    minHeight: 108,
    paddingTop: 12,
  },
  error: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  dateIcon: {
    fontSize: 15,
  },
  dateText: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  clear: {
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
