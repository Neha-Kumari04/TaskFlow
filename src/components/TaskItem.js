import React, { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable, { SwipeDirection } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useTheme } from '../theme/ThemeContext';
import { priorityColors } from '../theme/palette';
import { daysBetween, formatDateShort, isOverdue, todayISO } from '../utils/date';
import PriorityBadge from './PriorityBadge';
import StatusBadge, { CategoryPill, OverdueBadge } from './Badges';

function CheckCircle({ checked, onPress, disabled }) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      hitSlop={12}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={checked ? 'Mark as pending' : 'Mark as completed'}
      style={({ pressed }) => [styles.checkbox, { opacity: pressed && !disabled ? 0.75 : 1 }]}
    >
      <View
        style={[
          styles.checkboxInner,
          {
            borderColor: checked ? colors.success : colors.border,
            backgroundColor: checked ? colors.success : colors.surfaceAlt,
          },
        ]}
      >
        {checked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
      </View>
    </Pressable>
  );
}

function SwipeAction({ label, icon, color, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.swipeAction, { backgroundColor: color, opacity: pressed ? 0.85 : 1 }]}
    >
      <Ionicons name={icon} size={20} color="#FFFFFF" />
      <Text style={styles.swipeLabel}>{label}</Text>
    </Pressable>
  );
}

function TaskCard({ task, onPress, onToggle, overdue }) {
  const { colors, isDark } = useTheme();
  const completed = task.status === 'completed';
  const priorityMap = priorityColors[task.priority] || priorityColors.medium;
  const accentColor = colors[priorityMap.fg] || colors.primary;

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
          borderLeftColor: overdue ? colors.danger : accentColor,
          borderLeftWidth: 4.5,
          shadowColor: colors.shadow,
          shadowOpacity: isDark ? 0.3 : 0.04,
          opacity: pressed ? 0.92 : completed ? 0.75 : 1,
          transform: [{ scale: pressed ? 0.995 : 1 }],
        },
      ]}
    >
      <CheckCircle checked={completed} onPress={onToggle} disabled={false} />

      <View style={styles.cardBody}>
        <Text
          numberOfLines={2}
          style={[
            styles.title,
            {
              color: completed ? colors.textFaint : colors.text,
              textDecorationLine: completed ? 'line-through' : 'none',
            },
          ]}
        >
          {task.title || 'Untitled task'}
        </Text>

        <View style={styles.metaRow}>
          <CategoryPill category={task.category} size="small" />
          <PriorityBadge priority={task.priority} size="small" />
          <StatusBadge status={task.status} size="small" />
          {overdue > 0 ? <OverdueBadge days={overdue} /> : null}
        </View>

        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={12} color={colors.textFaint} />
          <Text style={[styles.dateText, { color: colors.textFaint }]}>
            {`${formatDateShort(task.startDate)} → ${formatDateShort(task.dueDate)}`}
          </Text>
          {!completed && Boolean(task.dueDate) && overdue === 0 && task.dueDate === todayISO() ? (
            <View style={[styles.duePill, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.dueHint, { color: colors.primary }]}>Due today</Text>
            </View>
          ) : null}
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
          label={task.status === 'completed' ? 'Reopen' : 'Done'}
          icon={task.status === 'completed' ? 'arrow-undo' : 'checkmark-done'}
          color={task.status === 'completed' ? colors.info : colors.success}
          onPress={handleToggle}
        />
        <SwipeAction label="Delete" icon="trash-outline" color={colors.danger} onPress={handleDelete} />
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
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 11,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardBody: {
    flex: 1,
    gap: 8,
  },
  title: {
    fontSize: 15.5,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
  },
  duePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  dueHint: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  checkbox: {
    paddingTop: 1,
  },
  checkboxInner: {
    width: 23,
    height: 23,
    borderRadius: 7,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    marginBottom: 11,
    gap: 6,
    paddingLeft: 6,
  },
  swipeAction: {
    width: 76,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  swipeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
