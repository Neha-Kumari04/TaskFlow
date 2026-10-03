import React, { useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import Button from '../components/Button';
import FilterChip from '../components/FilterChip';
import { Card } from '../components/Layout';
import { DateField, FormField, OptionPicker } from '../components/Form';
import { CATEGORIES, PRIORITIES, STATUSES } from '../utils/constants';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { parseISODate, todayISO, toISODate } from '../utils/date';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../theme/ThemeContext';

const PRIORITY_OPTIONS = PRIORITIES.map((item) => ({
  key: item.key,
  label: item.label,
  colorKey: item.key === 'high' ? 'danger' : item.key === 'medium' ? 'warning' : 'success',
}));

const STATUS_OPTIONS = STATUSES.map((item) => ({
  key: item.key,
  label: item.label,
  colorKey: item.key === 'completed' ? 'success' : 'info',
}));

function validate({ title, startDate, dueDate, category }) {
  const errors = {};

  if (!title.trim()) {
    errors.title = 'Title is required';
  } else if (title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters';
  }

  if (!category.trim()) {
    errors.category = 'Category is required';
  }

  if (startDate && dueDate && dueDate < startDate) {
    errors.dueDate = 'Due date cannot be earlier than the start date';
  }

  return errors;
}

export default function TaskFormScreen({ navigation, route }) {
  const { colors } = useTheme();
  const scheme = useColorScheme();
  const isIOS = Platform.OS === 'ios';
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const { confirm, dialog } = useConfirmDialog();

  const editingId = route?.params?.id;
  const existing = useMemo(() => (editingId ? tasks.find((task) => task.id === editingId) : null), [editingId, tasks]);
  const isEditing = !!existing;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [priority, setPriority] = useState(existing?.priority ?? 'medium');
  const [category, setCategory] = useState(existing?.category ?? '');
  const [startDate, setStartDate] = useState(existing?.startDate ?? '');
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? '');
  const [status, setStatus] = useState(existing?.status ?? 'pending');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const [picker, setPicker] = useState(null);
  const scrollRef = useRef(null);
  const scrolledToPicker = useRef(false);

  const categorySuggestions = useMemo(() => {
    const fromTasks = Array.from(new Set(tasks.map((task) => task.category).filter(Boolean)));
    return Array.from(new Set([...fromTasks, ...CATEGORIES]));
  }, [tasks]);

  const openPicker = (field) => {
    const current = field === 'startDate' ? startDate : dueDate;
    const base = parseISODate(current) || parseISODate(todayISO());
    scrolledToPicker.current = false;
    setPicker({ field, value: base });
  };

  // The inline picker sits near the bottom of the form, so bring it into view.
  const scrollToPicker = (y) => {
    if (scrolledToPicker.current) return;
    scrolledToPicker.current = true;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
  };

  const onPickerChange = (event, selected) => {
    const field = picker?.field;
    if (event?.type === 'dismissed') {
      if (Platform.OS === 'android') setPicker(null);
      return;
    }
    if (!selected || !field) {
      setPicker(null);
      return;
    }

    const iso = toISODate(selected);
    if (field === 'startDate') {
      setStartDate(iso);
      if (dueDate && dueDate < iso) {
        setDueDate(iso);
        setErrors((prev) => ({ ...prev, dueDate: undefined }));
      }
    } else {
      setDueDate(iso);
      if (startDate && iso < startDate) {
        setErrors((prev) => ({ ...prev, dueDate: 'Due date cannot be earlier than the start date' }));
      } else {
        setErrors((prev) => ({ ...prev, dueDate: undefined }));
      }
    }

    if (Platform.OS === 'android') setPicker(null);
  };

  const handleSave = () => {
    setTouched(true);
    const payload = { title, description, priority, category, startDate, dueDate, status };
    const validationErrors = validate(payload);

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setSaving(true);
    const clean = {
      title: title.trim(),
      description: description.trim(),
      priority,
      category: category.trim(),
      startDate,
      dueDate,
      status,
    };

    if (isEditing) {
      updateTask(existing.id, clean);
      setTimeout(() => navigation.goBack(), 250);
    } else {
      const created = addTask(clean);
      setTimeout(() => {
        if (created) {
          navigation.replace('TaskDetail', { id: created.id, justCreated: true });
        } else {
          navigation.goBack();
        }
      }, 250);
    }
  };

  const handleDelete = () => {
    confirm({
      title: 'Delete task',
      message: `Are you sure you want to delete "${existing.title}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      destructive: true,
      onConfirm: () => {
        deleteTask(existing.id);
        navigation.goBack();
      },
    });
  };

  const showError = (key) => (touched ? errors[key] : undefined);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isEditing && !!existing && (
          <Card style={styles.metaCard}>
            <View style={[styles.metaDot, { backgroundColor: existing.source === 'csv' ? colors.info : colors.success }]} />
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              {`${existing.source === 'csv' ? `Imported from CSV (row id ${existing.csvId ?? '—'})` : 'Created manually'} · Updated ${new Date(existing.updatedAt).toLocaleDateString()}`}
            </Text>
          </Card>
        )}

        <Card style={styles.card}>
          <FormField
            label="Title"
            required
            value={title}
            onChangeText={(value) => {
              setTitle(value);
              if (touched) setErrors((prev) => ({ ...prev, title: validate({ title: value, startDate, dueDate, category }).title }));
            }}
            placeholder="What needs to be done?"
            maxLength={120}
            error={showError('title')}
            autoCapitalize="sentences"
          />

          <FormField
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Add more context (optional)"
            multiline
            maxLength={500}
          />
        </Card>

        <Card style={styles.card}>
          <OptionPicker
            label="Priority"
            options={PRIORITY_OPTIONS}
            value={priority}
            onChange={setPriority}
            required
          />

          <OptionPicker
            label="Status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={setStatus}
            columns={2}
            required
          />
        </Card>

        <Card style={styles.card}>
          <FormField
            label="Category"
            required
            value={category}
            onChangeText={(value) => {
              setCategory(value);
              if (touched) setErrors((prev) => ({ ...prev, category: validate({ title, startDate, dueDate, category: value }).category }));
            }}
            placeholder="e.g. Work, Personal"
            error={showError('category')}
            autoCapitalize="words"
          />

          <View style={styles.suggestions}>
            {categorySuggestions.slice(0, 8).map((item) => (
              <FilterChip
                key={item}
                label={item}
                active={category === item}
                onPress={() => {
                  setCategory(item);
                  if (touched) setErrors((prev) => ({ ...prev, category: undefined }));
                }}
              />
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <DateField
            label="Start date"
            value={startDate}
            onPress={() => openPicker('startDate')}
            onClear={() => setStartDate('')}
          />

          <DateField
            label="Due date"
            required
            value={dueDate}
            onPress={() => openPicker('dueDate')}
            onClear={() => setDueDate('')}
            error={showError('dueDate')}
          />

          <View style={styles.quickDates}>
            <Text style={[styles.quickLabel, { color: colors.textMuted }]}>Quick set due date</Text>
            <View style={styles.suggestions}>
              <FilterChip label="Today" onPress={() => setDueDate(todayISO())} active={dueDate === todayISO()} />
              <FilterChip
                label="Tomorrow"
                onPress={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  setDueDate(toISODate(d));
                }}
                active={false}
              />
              <FilterChip
                label="In 3 days"
                onPress={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 3);
                  setDueDate(toISODate(d));
                }}
                active={false}
              />
              <FilterChip
                label="In 1 week"
                onPress={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 7);
                  setDueDate(toISODate(d));
                }}
                active={false}
              />
            </View>
          </View>

          {!!startDate && !!dueDate && dueDate >= startDate && (
            <View style={[styles.hint, { backgroundColor: colors.successSoft }]}>
              <Ionicons name="checkmark-circle" size={15} color={colors.success} />
              <Text style={[styles.hintText, { color: colors.success }]}>
                Valid schedule: due date is on or after the start date
              </Text>
            </View>
          )}
        </Card>

        {/* iOS renders the date picker inline, so it has to live inside the
            ScrollView - as a sibling it collapses to zero height and stays
            off screen. Android uses the native dialog and is rendered below. */}
        {isIOS && !!picker && (
          <View onLayout={(e) => scrollToPicker(e.nativeEvent.layout.y)}>
            <Card style={styles.card}>
              <View style={styles.pickerHeader}>
                <Text style={[styles.pickerTitle, { color: colors.text }]}>
                  {picker.field === 'startDate' ? 'Select start date' : 'Select due date'}
                </Text>
                <Ionicons name="calendar" size={16} color={colors.textMuted} />
              </View>
              <DateTimePicker
                value={picker.value}
                mode="date"
                display="inline"
                themeVariant={scheme === 'dark' ? 'dark' : 'light'}
                minimumDate={picker.field === 'dueDate' ? parseISODate(startDate) || undefined : undefined}
                onChange={onPickerChange}
                style={styles.picker}
              />
              <Button title="Done" onPress={() => setPicker(null)} variant="ghost" size="small" />
            </Card>
          </View>
        )}

        <View style={styles.actions}>
          <Button
            title={isEditing ? 'Update task' : 'Save task'}
            onPress={handleSave}
            loading={saving}
            size="large"
            icon={isEditing ? '✓' : '＋'}
          />
          {isEditing && (
            <Button title="Delete task" onPress={handleDelete} variant="danger" icon="🗑" />
          )}
          <Button title="Cancel" onPress={() => navigation.goBack()} variant="ghost" />
        </View>
      </ScrollView>

      {!isIOS && !!picker && (
        <DateTimePicker
          value={picker.value}
          mode="date"
          display="default"
          minimumDate={picker.field === 'dueDate' ? parseISODate(startDate) || undefined : undefined}
          onChange={onPickerChange}
        />
      )}
      {dialog}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
    gap: 14,
  },
  card: {
    gap: 16,
  },
  metaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  metaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 17,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickDates: {
    gap: 8,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  picker: {
    alignSelf: 'stretch',
    minHeight: 300,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 11,
    borderRadius: 12,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 17,
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
});
