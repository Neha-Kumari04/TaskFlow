import React, { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable, { SwipeDirection } from 'react-native-gesture-handler/ReanimatedSwipeable';

import { useTheme } from '../theme/ThemeContext';
import { daysBetween, formatDateShort, isOverdue, todayISO } from '../utils/date';
import PriorityBadge from './PriorityBadge';
import StatusBadge, { CategoryPill, OverdueBadge } from './Badges';

function CheckCircle({ checked, onPress, disabled }) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      hitSlop={10}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={checked ? 'Mark as pending' : 'Mark as completed'}
      style={({ pressed }) => [styles.checkbox, { opacity: pressed && !disabled ? 0.7 : 1 }]}
    >
      <View
        style={[
          styles.checkboxInner,
          {
            borderColor: checked ? colors.success : colors.border,
            backgroundColor: checked ? colors.success : 'transparent',
          },
        ]}
      >
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
    </Pressable>
  );
}

function SwipeAction({ label, icon, color, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.swipeAction, { backgroundColor: color, opacity: pressed ? 0.8 : 1 }]}
    >
      <Text style={styles.swipeIcon}>{icon}</Text>
      <Text style={styles.swipeLabel}>{label}</Text>
    </Pressable>
  );
}

function TaskCard({ task, onPress, onToggle, onDelete, overdue }) {
  const { colors } = useTheme();
  const completed = task.status === 'completed';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${task.title}, ${task.priority} priority, ${task.category}, ${completed ? 'completed' : 'pending'}`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: overdue ? colors.danger : colors.border,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.995 : 1 }],
        },
      ]}
    >
      <CheckCircle checked={completed} onPress={onToggle} disabled={false} />

      <View style={styles.cardBody}>
        <Text
          numberOfLines={2}
          style={[styles.title, { color: completed ? colors.textFaint : colors.text, textDecorationLine: completed ? 'line-through' : 'none' }]}
        >
          {task.title || 'Untitled task'}
        </Text>

        <View style={styles.metaRow}>
          <CategoryPill category={task.category} size="small" />
          <PriorityBadge priority={task.priority} size="small" />
          <StatusBadge status={task.status} size="small" />
          {overdue && <OverdueBadge days={overdue} />}
        </View>

        <View style={styles.dateRow}>
          <Text style={[styles.dateText, { color: colors.textFaint }]}>
            {`${formatDateShort(task.startDate)} → ${formatDateShort(task.dueDate)}`}
          </Text>
          {!completed && !!task.dueDate && !overdue && task.dueDate === todayISO() && (
            <Text style={[styles.dueHint, { color: colors.primary }]}>Due today</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function TaskItem({ task, onPress, onToggle, onDelete }) {
  const { colors } = useTheme();
  const swipeableRef = useRef(null);

  const overdueDays = isOverdue(task) ? daysBetween(task.dueDate, todayISO()) : 0;

  const close = useCallback(() => {
    swipeableRef.current?.close();
  }, []);

  const handleToggle = useCallback(() => {
    onToggle(task.id);
    close();
  }, [onToggle, task.id, close]);

  const handleDelete = useCallback(() => {
    close();
    onDelete(task.id);
  }, [close, onDelete, task.id]);

  const renderRightActions = useCallback(
    () => (
      <View style={styles.actionsRow}>
        <SwipeAction
          label={task.status === 'completed' ? 'Reopen' : 'Complete'}
          icon={task.status === 'completed' ? '↺' : '✓'}
          color={task.status === 'completed' ? colors.info : colors.success}
          onPress={handleToggle}
        />
        <SwipeAction label="Delete" icon="🗑" color={colors.danger} onPress={handleDelete} />
      </View>
    ),
    [colors, handleDelete, handleToggle, task.status]
  );

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      enableTrackpadTwoFingerGesture
      renderRightActions={renderRightActions}
      onSwipeableWillOpen={(direction) => {
        if (direction === SwipeDirection.RIGHT) close();
      }}
    >
      <TaskCard
        task={task}
        onPress={onPress}
        onToggle={handleToggle}
        onDelete={handleDelete}
        overdue={overdueDays}
      />
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  cardBody: {
    flex: 1,
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  dueHint: {
    fontSize: 11,
    fontWeight: '800',
  },
  checkbox: {
    paddingTop: 2,
  },
  checkboxInner: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 15,
  },
  actionsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  swipeAction: {
    width: 78,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  swipeIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  swipeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
