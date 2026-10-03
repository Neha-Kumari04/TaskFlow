import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useTheme } from '../theme/ThemeContext';

export function FormField({
  label,
  value,
  onChangeText,
  error,
  required,
  multiline,
  placeholder,
  keyboardType,
  autoCapitalize,
  style,
  maxLength,
  editable = true,
}) {
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
            backgroundColor: !editable ? colors.surfaceAlt : focused ? colors.surface : colors.surface,
            borderColor,
            borderWidth: focused ? 1.5 : 1,
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
          <View style={[styles.dateIconWrap, { backgroundColor: value ? colors.primarySoft : colors.surfaceAlt }]}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={value ? colors.primary : colors.textMuted}
            />
          </View>
          <Text style={[styles.dateText, { color: value ? colors.text : colors.textFaint }]}>
            {value || 'Select date'}
          </Text>
        </Pressable>
        {!!value && !disabled && (
          <Pressable
            onPress={onClear}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Clear ${label}`}
            style={styles.clearBtn}
          >
            <Ionicons name="close-circle" size={20} color={colors.textFaint} />
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
                  flexBasis: `${100 / columns - 2}%`,
                  backgroundColor: active ? accent : colors.surfaceAlt,
                  borderColor: active ? accent : colors.border,
                  opacity: pressed ? 0.85 : 1,
                  shadowColor: active ? accent : 'transparent',
                  shadowOpacity: active ? 0.25 : 0,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: active ? 2 : 0,
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
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  counter: {
    fontSize: 11,
    fontWeight: '600',
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 15,
    minHeight: 50,
  },
  multiline: {
    minHeight: 110,
    paddingTop: 14,
  },
  error: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
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
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  dateIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  clearBtn: {
    padding: 4,
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
    paddingHorizontal: 8,
    borderRadius: 13,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
});
