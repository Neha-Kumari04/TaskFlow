import { useMemo, useState } from 'react';

import { PRIORITY_WEIGHT } from '../utils/constants';
import { isTodayTask, todayISO } from '../utils/date';

const DEFAULT_FILTERS = {
  query: '',
  status: 'all',
  priorities: [],
  category: 'all',
  dueFilter: 'all',
  sortBy: 'dueDate_asc',
};

function matchesDueFilter(task, dueFilter) {
  if (dueFilter === 'all') return true;

  const today = todayISO();

  if (dueFilter === 'overdue') {
    return task.status !== 'completed' && !!task.dueDate && task.dueDate < today;
  }
  if (dueFilter === 'today') {
    return isTodayTask(task);
  }
  if (dueFilter === 'week') {
    if (!task.dueDate) return false;
    const diff = daysUntil(task.dueDate, today);
    return diff >= 0 && diff <= 7;
  }
  if (dueFilter === 'noDueDate') {
    return !task.dueDate;
  }
  return true;
}

function daysUntil(dueISO, todayISOValue) {
  const due = new Date(`${dueISO}T00:00:00`);
  const today = new Date(`${todayISOValue}T00:00:00`);
  return Math.round((due - today) / 86400000);
}

function sortTasks(list, sortBy) {
  const sorted = [...list];

  const byTitle = (a, b) => a.title.localeCompare(b.title);
  const byDue = (a, b) => String(a.dueDate || '9999-12-31').localeCompare(String(b.dueDate || '9999-12-31'));
  const byStart = (a, b) => String(a.startDate || '9999-12-31').localeCompare(String(b.startDate || '9999-12-31'));
  const byPriority = (a, b) => (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0);

  switch (sortBy) {
    case 'dueDate_desc':
      return sorted.sort((a, b) => -byDue(a, b) || byTitle(a, b));
    case 'startDate_asc':
      return sorted.sort((a, b) => byStart(a, b) || byTitle(a, b));
    case 'startDate_desc':
      return sorted.sort((a, b) => -byStart(a, b) || byTitle(a, b));
    case 'priority_desc':
      return sorted.sort((a, b) => byPriority(a, b) || byDue(a, b));
    case 'priority_asc':
      return sorted.sort((a, b) => -byPriority(a, b) || byDue(a, b));
    case 'title_asc':
      return sorted.sort(byTitle);
    case 'createdAt_desc':
      return sorted.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    case 'dueDate_asc':
    default:
      return sorted.sort((a, b) => {
        const statusDiff = (a.status === 'completed' ? 1 : 0) - (b.status === 'completed' ? 1 : 0);
        if (statusDiff !== 0) return statusDiff;
        return byDue(a, b) || byTitle(a, b);
      });
  }
}

export function useTaskFilters(tasks) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const update = (patch) => setFilters((prev) => ({ ...prev, ...patch }));

  const reset = () => setFilters(DEFAULT_FILTERS);

  const togglePriority = (priority) =>
    setFilters((prev) => ({
      ...prev,
      priorities: prev.priorities.includes(priority)
        ? prev.priorities.filter((item) => item !== priority)
        : [...prev.priorities, priority],
    }));

  const activeCount =
    (filters.query ? 1 : 0) +
    (filters.status !== 'all' ? 1 : 0) +
    (filters.priorities.length > 0 ? 1 : 0) +
    (filters.category !== 'all' ? 1 : 0) +
    (filters.dueFilter !== 'all' ? 1 : 0);

  const filtered = useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    const matched = tasks.filter((task) => {
      if (filters.status !== 'all' && task.status !== filters.status) return false;
      if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) return false;
      if (filters.category !== 'all' && task.category !== filters.category) return false;
      if (!matchesDueFilter(task, filters.dueFilter)) return false;

      if (query) {
        const haystack = [task.title, task.description, task.category, task.priority, task.status]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });

    return sortTasks(matched, filters.sortBy);
  }, [tasks, filters]);

  const categories = useMemo(() => {
    const set = new Set(tasks.map((task) => task.category).filter(Boolean));
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [tasks]);

  const counts = useMemo(
    () => ({
      all: tasks.length,
      pending: tasks.filter((task) => task.status === 'pending').length,
      completed: tasks.filter((task) => task.status === 'completed').length,
    }),
    [tasks]
  );

  return { filters, update, reset, togglePriority, filtered, categories, counts, activeCount };
}

export default useTaskFilters;
