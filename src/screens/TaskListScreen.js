import React, { useLayoutEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import EmptyState from '../components/EmptyState';
import Fab from '../components/Fab';
import FilterChip from '../components/FilterChip';
import SearchBar from '../components/SearchBar';
import TaskItem from '../components/TaskItem';
import { SegmentedScroll } from '../components/SegmentedControl';
import { ScreenHeader } from '../components/Layout';
import useTaskFilters from '../hooks/useTaskFilters';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { PRIORITIES, SORT_OPTIONS, STATUS_FILTERS } from '../utils/constants';
import { useTheme } from '../theme/ThemeContext';
import { useTasks } from '../context/TaskContext';

const DUE_FILTERS = [
  { key: 'all', label: 'Any due date' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Next 7 days' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'noDueDate', label: 'No due date' },
];

function SortSheet({ visible, value, onSelect, onClose }) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.sheetTitle, { color: colors.text }]}>Sort tasks by</Text>
          <ScrollView style={styles.sheetList}>
            {SORT_OPTIONS.map((option) => {
              const active = option.key === value;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => {
                    onSelect(option.key);
                    onClose();
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => [
                    styles.sheetRow,
                    {
                      backgroundColor: active ? colors.primarySoft : 'transparent',
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.sheetRowText, { color: active ? colors.primary : colors.text }]}>
                    {option.label}
                  </Text>
                  {active && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function TaskListScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { tasks, isLoading, toggleTaskStatus, deleteTask } = useTasks();
  const { filters, update, reset, togglePriority, filtered, categories, counts, activeCount } = useTaskFilters(tasks);
  const { confirm, dialog } = useConfirmDialog();

  const [sortOpen, setSortOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const routeFilter = route?.params?.statusFilter;

  useLayoutEffect(() => {
    if (routeFilter) {
      update({ status: routeFilter });
      navigation.setParams({ statusFilter: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeFilter]);

  const sortLabel = useMemo(
    () => SORT_OPTIONS.find((option) => option.key === filters.sortBy)?.label || 'Sort',
    [filters.sortBy]
  );

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

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <ScreenHeader
          title="Tasks"
          subtitle={`${filtered.length} of ${counts.all} task${counts.all === 1 ? '' : 's'} shown`}
        />

        <View style={styles.searchRow}>
          <SearchBar
            value={filters.query}
            onChangeText={(query) => update({ query })}
            onClear={() => update({ query: '' })}
            placeholder="Search title, description, category…"
            style={styles.search}
          />
          <Pressable
            onPress={() => navigation.navigate('BulkUpload')}
            accessibilityRole="button"
            accessibilityLabel="Bulk upload tasks"
            style={({ pressed }) => [
              styles.sortButton,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="cloud-upload-outline" size={18} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={() => setSortOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`Sort by ${sortLabel}`}
            style={({ pressed }) => [
              styles.sortButton,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="swap-vertical" size={18} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={() => setShowFilters((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel="Toggle filters"
            style={({ pressed }) => [
              styles.sortButton,
              {
                backgroundColor: showFilters || activeCount > 0 ? colors.primary : colors.surface,
                borderColor: showFilters || activeCount > 0 ? colors.primary : colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons name="options-outline" size={18} color={showFilters || activeCount > 0 ? colors.primaryText : colors.text} />
            {activeCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.danger, borderColor: colors.surface }]}>
                <Text style={styles.badgeText}>{activeCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        <SegmentedScroll
          options={STATUS_FILTERS.map((option) => ({ ...option, label: `${option.label} (${counts[option.key]})` }))}
          value={filters.status}
          onChange={(status) => update({ status })}
        />

        {showFilters && (
          <View style={[styles.filterPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <FilterGroup label="Priority">
              {PRIORITIES.map((option) => (
                <FilterChip
                  key={option.key}
                  label={option.label}
                  active={filters.priorities.includes(option.key)}
                  onPress={() => togglePriority(option.key)}
                />
              ))}
            </FilterGroup>

            <FilterGroup label="Due date">
              {DUE_FILTERS.map((option) => (
                <FilterChip
                  key={option.key}
                  label={option.label}
                  active={filters.dueFilter === option.key}
                  onPress={() => update({ dueFilter: option.key })}
                />
              ))}
            </FilterGroup>

            <FilterGroup label="Category">
              {categories.map((category) => (
                <FilterChip
                  key={category}
                  label={category === 'all' ? 'All' : category}
                  active={filters.category === category}
                  onPress={() => update({ category })}
                />
              ))}
            </FilterGroup>

            <View style={styles.filterFooter}>
              <Text style={[styles.sortSummary, { color: colors.textMuted }]} numberOfLines={1}>
                {`Sorted by: ${sortLabel}`}
              </Text>
              {activeCount > 0 && (
                <Pressable onPress={reset} accessibilityRole="button" hitSlop={8}>
                  <Text style={[styles.clearFilters, { color: colors.primary }]}>Clear filters</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, !isLoading && filtered.length === 0 && styles.listEmpty]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {isLoading ? (
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading tasks…</Text>
        ) : filtered.length === 0 ? (
          counts.all === 0 ? (
            <EmptyState
              icon="📝"
              title="No tasks yet"
              message="Create your first task or bulk import tasks from a CSV file to get started."
              actionLabel="Add a task"
              onAction={() => navigation.navigate('TaskForm', {})}
            />
          ) : (
            <EmptyState
              icon="🔍"
              title="No matching tasks"
              message="No task matches the current search and filters. Try widening your criteria."
              actionLabel="Clear all filters"
              onAction={reset}
            />
          )
        ) : (
          filtered.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onPress={() => navigation.navigate('TaskDetail', { id: task.id })}
              onToggle={toggleTaskStatus}
              onDelete={confirmDelete}
            />
          ))
        )}
      </ScrollView>

      {!isLoading && filtered.length > 0 && (
        <View style={[styles.footerBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            {`Showing ${filtered.length} of ${counts.all} task${counts.all === 1 ? '' : 's'}`}
          </Text>
          <Text style={[styles.footerHint, { color: colors.textFaint }]}>Swipe a task for quick actions</Text>
        </View>
      )}

      <Fab onPress={() => navigation.navigate('TaskForm', {})} label="Add task" />
      <SortSheet
        visible={sortOpen}
        value={filters.sortBy}
        onSelect={(sortBy) => update({ sortBy })}
        onClose={() => setSortOpen(false)}
      />

      {dialog}
    </View>
  );
}

function FilterGroup({ label, children }) {
  const { colors } = useTheme();

  return (
    <View style={styles.filterGroup}>
      <Text style={[styles.filterLabel, { color: colors.textMuted }]}>{label}</Text>
      <View style={styles.filterChips}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 12,
    gap: 12,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  search: {
    flex: 1,
  },
  sortButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  filterPanel: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 14,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sortSummary: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  clearFilters: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  list: {
    paddingHorizontal: 18,
    paddingBottom: 120,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loadingText: {
    textAlign: 'center',
    paddingVertical: 40,
    fontSize: 14,
    fontWeight: '600',
  },
  footerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  footerHint: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 34,
    gap: 10,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 6,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  sheetList: {
    maxHeight: 420,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  sheetRowText: {
    fontSize: 14.5,
    fontWeight: '600',
  },
});
