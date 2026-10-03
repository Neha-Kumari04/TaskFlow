import React, { useLayoutEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge, { CategoryPill, OverdueBadge } from '../components/Badges';
import { Card } from '../components/Layout';
import { useTaskById, useTasks } from '../context/TaskContext';
import { useTheme } from '../theme/ThemeContext';
import { daysBetween, formatDate, isOverdue, todayISO } from '../utils/date';
import { useConfirmDialog } from '../hooks/useConfirmDialog';

function DetailRow({ icon, label, value, valueColor, children }) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.rowLabel}>
        <View style={[styles.detailIconWrap, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name={icon} size={15} color={colors.textMuted} />
        </View>
        <Text style={[styles.rowLabelText, { color: colors.textMuted }]}>{label}</Text>
      </View>
      {children || <Text style={[styles.rowValue, { color: valueColor || colors.text }]}>{value}</Text>}
    </View>
  );
}

function ProgressSteps({ startDate, dueDate, status }) {
  const { colors } = useTheme();
  const today = todayISO();

  const steps = useMemo(() => {
    const list = [];
    if (startDate) list.push({ label: 'Start date', date: startDate, done: today >= startDate });
    if (dueDate) {
      list.push({ label: 'Due date', date: dueDate, done: status === 'completed' || today > dueDate });
    }
    if (status === 'completed') {
      list.push({ label: 'Completed', date: today, done: true });
    }
    return list;
  }, [startDate, dueDate, status, today]);

  if (steps.length === 0) return null;

  return (
    <View style={styles.timeline}>
      {steps.map((step, index) => (
        <View key={`${step.label}-${index}`} style={styles.timelineRow}>
          <View style={styles.timelineRail}>
            <View
              style={[
                styles.timelineDot,
                {
                  backgroundColor: step.done ? colors.success : colors.surfaceAlt,
                  borderColor: step.done ? colors.success : colors.border,
                },
              ]}
            >
              {step.done && <Ionicons name="checkmark" size={9} color="#FFFFFF" />}
            </View>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.timelineLine,
                  { backgroundColor: step.done ? colors.successSoft : colors.border },
                ]}
              />
            )}
          </View>
          <View style={styles.timelineBody}>
            <Text style={[styles.timelineLabel, { color: colors.text }]}>{step.label}</Text>
            <Text style={[styles.timelineDate, { color: colors.textMuted }]}>{formatDate(step.date)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export default function TaskDetailScreen({ navigation, route }) {
  const { colors } = useTheme();
  const task = useTaskById(route?.params?.id);
  const { toggleTaskStatus, deleteTask } = useTasks();
  const justCreated = route?.params?.justCreated;

  useLayoutEffect(() => {
    navigation.setOptions({ title: task ? 'Task details' : 'Task' });
  }, [navigation, task]);

  const { confirm, dialog } = useConfirmDialog();

  const confirmDelete = () => {
    confirm({
      title: 'Delete task',
      message: `Are you sure you want to delete "${task.title}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      destructive: true,
      onConfirm: () => {
        deleteTask(task.id);
        navigation.goBack();
      },
    });
  };

  if (!task) {
    return (
      <View style={styles.root}>
        <EmptyState
          icon="🕳"
          title="Task not found"
          message="This task may have been deleted or imported data changed."
          actionLabel="Go back"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  const completed = task.status === 'completed';
  const overdue = isOverdue(task);
  const overdueDays = overdue ? daysBetween(task.dueDate, todayISO()) : 0;
  const totalDays = task.startDate && task.dueDate ? daysBetween(task.startDate, task.dueDate) : null;
  const daysLeft = task.dueDate && !completed ? daysBetween(todayISO(), task.dueDate) : null;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {Boolean(justCreated) && (
        <View style={[styles.successBanner, { backgroundColor: colors.successSoft, borderColor: colors.success }]}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={[styles.successText, { color: colors.success }]}>Task created successfully</Text>
        </View>
      )}

      <Card style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.badges}>
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            {overdue && overdueDays > 0 ? <OverdueBadge days={overdueDays} /> : null}
          </View>
          <Pressable
            onPress={() => navigation.navigate('TaskForm', { id: task.id })}
            accessibilityRole="button"
            accessibilityLabel="Edit task"
            style={({ pressed }) => [
              styles.editButton,
              { backgroundColor: colors.surfaceAlt, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="create-outline" size={15} color={colors.text} />
            <Text style={[styles.editText, { color: colors.text }]}>Edit</Text>
          </Pressable>
        </View>

        <Text style={[styles.title, { color: colors.text, textDecorationLine: completed ? 'line-through' : 'none' }]}>
          {task.title}
        </Text>

        <View style={styles.categoryRow}>
          <CategoryPill category={task.category} />
          {task.source === 'csv' && <CategoryPill category={`CSV #${task.csvId ?? '—'}`} />}
        </View>

        {!task.description ? (
          <Text style={[styles.noDescription, { color: colors.textFaint }]}>No description provided.</Text>
        ) : (
          <Text style={[styles.description, { color: colors.textMuted }]}>{task.description}</Text>
        )}
      </Card>

      <View style={styles.quickStats}>
        <Card style={styles.quickStat}>
          <View style={styles.quickStatHeader}>
            <Text style={[styles.quickStatLabel, { color: colors.textMuted }]}>
              {completed ? 'STATUS' : 'TIME REMAINING'}
            </Text>
            <Ionicons
              name={completed ? 'checkmark-circle' : 'time-outline'}
              size={15}
              color={completed ? colors.success : colors.primary}
            />
          </View>
          <Text style={[styles.quickStatValue, { color: completed ? colors.success : colors.text }]}>
            {completed ? 'Completed' : daysLeft === null ? '—' : daysLeft < 0 ? `${Math.abs(daysLeft)}d late` : `${daysLeft}d left`}
          </Text>
        </Card>
        <Card style={styles.quickStat}>
          <View style={styles.quickStatHeader}>
            <Text style={[styles.quickStatLabel, { color: colors.textMuted }]}>DURATION</Text>
            <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
          </View>
          <Text style={[styles.quickStatValue, { color: colors.text }]}>
            {totalDays === null ? '—' : `${totalDays + 1} day${totalDays === 0 ? '' : 's'}`}
          </Text>
        </Card>
      </View>

      <Card style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="calendar" size={17} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Schedule</Text>
        </View>
        <DetailRow icon="play-circle-outline" label="Start date" value={formatDate(task.startDate)} />
        <DetailRow icon="flag-outline" label="Due date" value={formatDate(task.dueDate)} valueColor={overdue ? colors.danger : undefined} />
        {Boolean(task.completedAt) && (
          <DetailRow
            icon="checkmark-done-outline"
            label="Completed on"
            value={new Date(task.completedAt).toLocaleDateString()}
          />
        )}
        <DetailRow icon="time-outline" label="Created on" value={new Date(task.createdAt).toLocaleDateString()} />
        <ProgressSteps startDate={task.startDate} dueDate={task.dueDate} status={task.status} />
      </Card>

      <Card style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="information-circle" size={17} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
        </View>
        <DetailRow icon="pricetag-outline" label="Category" value={task.category || '—'} />
        <DetailRow icon="flag-outline" label="Priority" value={task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} />
        <DetailRow icon="ellipse-outline" label="Status" value={completed ? 'Completed' : 'Pending'} />
        <DetailRow
          icon="cloud-download-outline"
          label="Source"
          value={task.source === 'csv' ? 'Bulk CSV import' : 'Manual entry'}
        />
      </Card>

      <View style={styles.actions}>
        <Button
          title={completed ? 'Mark as pending' : 'Mark as completed'}
          icon={<Ionicons name={completed ? 'arrow-undo-outline' : 'checkmark-circle-outline'} size={18} color="#FFFFFF" />}
          variant={completed ? 'secondary' : 'primary'}
          size="large"
          onPress={() => toggleTaskStatus(task.id)}
        />
        <Button
          title="Edit task"
          icon={<Ionicons name="create-outline" size={17} color={colors.text} />}
          variant="secondary"
          onPress={() => navigation.navigate('TaskForm', { id: task.id })}
        />
        <Button
          title="Delete task"
          icon={<Ionicons name="trash-outline" size={17} color="#FFFFFF" />}
          variant="danger"
          onPress={confirmDelete}
        />
      </View>
      {dialog}
    </ScrollView>
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
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  successText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  heroCard: {
    gap: 12,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  editText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  description: {
    fontSize: 14.5,
    lineHeight: 22,
  },
  noDescription: {
    fontSize: 13.5,
    fontStyle: 'italic',
  },
  quickStats: {
    flexDirection: 'row',
    gap: 12,
  },
  quickStat: {
    flex: 1,
    gap: 4,
  },
  quickStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickStatValue: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  quickStatLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  card: {
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flex: 1,
  },
  detailIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  rowValue: {
    fontSize: 13.5,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  timeline: {
    marginTop: 8,
    paddingTop: 4,
    gap: 0,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineRail: {
    alignItems: 'center',
    width: 16,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 28,
    marginVertical: 2,
    borderRadius: 1,
  },
  timelineBody: {
    flex: 1,
    paddingBottom: 14,
  },
  timelineLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  timelineDate: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
});
