import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Card, ScreenHeader, SectionHeader } from '../components/Layout';
import EmptyState from '../components/EmptyState';
import Fab from '../components/Fab';
import LoadingState from '../components/LoadingState';
import StatCard from '../components/StatCard';
import TaskItem from '../components/TaskItem';
import { useTheme } from '../theme/ThemeContext';
import { useTasks } from '../context/TaskContext';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { PRIORITY_WEIGHT } from '../utils/constants';
import { daysBetween, formatDate, isTodayTask, todayISO } from '../utils/date';

function ProgressBar({ rate, colors }) {
  return (
    <View style={styles.progressWrap}>
      <View style={[styles.progressTrack, { backgroundColor: colors.surfaceAlt }]}>
        <LinearGradient
          colors={[colors.primary, colors.success]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${Math.max(rate, rate > 0 ? 4 : 0)}%` }]}
        />
      </View>
      <Text style={[styles.progressLabel, { color: colors.textMuted }]}>{rate}% complete</Text>
    </View>
  );
}

function QuickAction({ icon, label, description, onPress, color }) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.quickAction,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.88 : 1 },
      ]}
    >
      <View style={[styles.quickIcon, { backgroundColor: colors[color] || colors.primarySoft }]}>
        <Ionicons name={icon} size={20} color={colors[color === 'primarySoft' ? 'primary' : color] || colors.primary} />
      </View>
      <View style={styles.quickText}>
        <Text style={[styles.quickLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.quickDescription, { color: colors.textMuted }]} numberOfLines={2}>
          {description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
    </Pressable>
  );
}

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const { tasks, stats, isLoading, toggleTaskStatus, deleteTask } = useTasks();
  const { confirm, dialog } = useConfirmDialog();

  const confirmDelete = (id) => {
    const task = tasks.find((item) => item.id === id);
    confirm({
      title: 'Delete task',
      message: `Are you sure you want to delete "${task?.title ?? 'this task'}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      destructive: true,
      onConfirm: () => deleteTask(id),
    });
  };

  const todaysTasks = useMemo(() => {
    return tasks
      .filter(isTodayTask)
      .sort((a, b) => {
        const statusDiff = (a.status === 'completed' ? 1 : 0) - (b.status === 'completed' ? 1 : 0);
        if (statusDiff !== 0) return statusDiff;
        const priorityDiff = (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0);
        if (priorityDiff !== 0) return priorityDiff;
        return String(a.dueDate).localeCompare(String(b.dueDate));
      })
      .slice(0, 5);
  }, [tasks]);

  const upcoming = useMemo(() => {
    const today = todayISO();
    return tasks
      .filter((task) => task.status === 'pending' && task.dueDate && task.dueDate > today)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 4);
  }, [tasks]);

  const goToTasks = (filter) => navigation.navigate('Tasks', { statusFilter: filter });

  if (isLoading) {
    return <LoadingState label="Preparing your dashboard…" />;
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader
          title="Dashboard"
          subtitle={`${formatDate(todayISO())} · You have ${stats.pending} pending task${stats.pending === 1 ? '' : 's'}`}
          right={
            <Pressable
              onPress={() => navigation.navigate('Settings')}
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              style={({ pressed }) => [
                styles.iconButton,
                { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Ionicons name="settings-outline" size={19} color={colors.text} />
            </Pressable>
          }
        />

        <Card style={styles.heroCard} padded={false}>
          <LinearGradient
            colors={colors.mode === 'dark' ? ['#1E2742', '#242B4D'] : ['#4F46E5', '#7C6CF5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <Text style={styles.heroEyebrow}>Overall progress</Text>
            <Text style={styles.heroValue}>
              {stats.completed}
              <Text style={styles.heroTotal}>{` / ${stats.total}`}</Text>
            </Text>
            <Text style={styles.heroLabel}>tasks completed</Text>
            <ProgressBar rate={stats.completionRate} colors={colors} />
            {stats.overdue > 0 && (
              <View style={styles.heroAlert}>
                <Ionicons name="alert-circle" size={14} color="#FFFFFF" />
                <Text style={styles.heroAlertText}>
                  {`${stats.overdue} overdue task${stats.overdue === 1 ? '' : 's'} need attention`}
                </Text>
              </View>
            )}
          </LinearGradient>
        </Card>

        <View style={styles.statGrid}>
          <StatCard
            label="Total"
            value={stats.total}
            icon="albums-outline"
            filter="all"
            onPress={() => goToTasks('all')}
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            icon="time-outline"
            filter="pending"
            onPress={() => goToTasks('pending')}
          />
        </View>

        <View style={styles.statGrid}>
          <StatCard
            label="Completed"
            value={stats.completed}
            icon="checkmark-done-outline"
            filter="completed"
            onPress={() => goToTasks('completed')}
          />
          <StatCard
            label="Today's"
            value={stats.today}
            icon="sunny-outline"
            filter="today"
            onPress={() => navigation.navigate('Tasks', { dueFilter: 'today' })}
            hint={stats.overdue > 0 ? `${stats.overdue} overdue` : undefined}
          />
        </View>

        <SectionHeader
          title="Today's tasks"
          actionLabel={todaysTasks.length > 0 ? 'See all' : undefined}
          onAction={() => goToTasks('all')}
          style={styles.sectionHeaderSpacing}
        />

        {todaysTasks.length === 0 ? (
          <Card style={styles.emptyCard}>
            <EmptyState
              icon="🌤"
              title="Nothing scheduled today"
              message="Add a task or import your CSV to see it here. Tasks appear on the day they are due."
              actionLabel="Add a task"
              onAction={() => navigation.navigate('TaskForm', {})}
            />
          </Card>
        ) : (
          todaysTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onPress={() => navigation.navigate('TaskDetail', { id: task.id })}
              onToggle={toggleTaskStatus}
              onDelete={confirmDelete}
            />
          ))
        )}

        {upcoming.length > 0 && (
          <>
            <SectionHeader title="Coming up next" style={styles.sectionHeaderSpacing} />
            <Card padded={false} style={styles.upcomingCard}>
              {upcoming.map((task, index) => {
                const days = daysBetween(todayISO(), task.dueDate);
                return (
                  <Pressable
                    key={task.id}
                    onPress={() => navigation.navigate('TaskDetail', { id: task.id })}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.upcomingRow,
                      {
                        borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
                        borderTopColor: colors.border,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <View style={[styles.upcomingDot, { backgroundColor: colors.primary }]} />
                    <View style={styles.upcomingBody}>
                      <Text style={[styles.upcomingTitle, { color: colors.text }]} numberOfLines={1}>
                        {task.title}
                      </Text>
                      <Text style={[styles.upcomingMeta, { color: colors.textMuted }]} numberOfLines={1}>
                        {`${task.category} · ${formatDate(task.dueDate)}`}
                      </Text>
                    </View>
                    <Text style={[styles.upcomingDays, { color: colors.primary }]}>
                      {days === 1 ? 'Tomorrow' : `${days}d`}
                    </Text>
                  </Pressable>
                );
              })}
            </Card>
          </>
        )}

        <SectionHeader title="Quick actions" style={styles.sectionHeaderSpacing} />
        <View style={styles.quickActions}>
          <QuickAction
            icon="cloud-upload-outline"
            label="Bulk upload"
            description="Import tasks from a CSV file"
            onPress={() => navigation.navigate('BulkUpload')}
            color="info"
          />
          <QuickAction
            icon="create-outline"
            label="Add task"
            description="Create a single task manually"
            onPress={() => navigation.navigate('TaskForm', {})}
            color="primary"
          />
          <QuickAction
            icon="download-outline"
            label="Export CSV"
            description="Save all tasks as a CSV file"
            onPress={() => navigation.navigate('Settings')}
            color="success"
          />
        </View>
      </ScrollView>

      <Fab onPress={() => navigation.navigate('TaskForm', {})} />
      {dialog}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 120,
    gap: 14,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    overflow: 'hidden',
  },
  heroGradient: {
    padding: 20,
    gap: 2,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroValue: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 6,
  },
  heroTotal: {
    fontSize: 20,
    fontWeight: '700',
    opacity: 0.75,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13.5,
    fontWeight: '600',
    marginBottom: 14,
  },
  heroAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    backgroundColor: 'rgba(0,0,0,0.22)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  heroAlertText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  progressWrap: {
    gap: 6,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  statGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  sectionHeaderSpacing: {
    marginTop: 6,
  },
  emptyCard: {
    paddingVertical: 8,
  },
  upcomingCard: {
    overflow: 'hidden',
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  upcomingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  upcomingBody: {
    flex: 1,
    gap: 2,
  },
  upcomingTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  upcomingMeta: {
    fontSize: 12,
  },
  upcomingDays: {
    fontSize: 12,
    fontWeight: '800',
  },
  quickActions: {
    gap: 10,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickText: {
    flex: 1,
    gap: 2,
  },
  quickLabel: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  quickDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
});
