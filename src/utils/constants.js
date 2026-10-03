export const PRIORITIES = [
  { key: 'high', label: 'High' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
];

export const STATUSES = [
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
];

export const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
];

export const CATEGORIES = [
  'Work',
  'Development',
  'Planning',
  'Meetings',
  'Personal',
  'Health',
  'Finance',
  'Learning',
  'Other',
];

export const SORT_OPTIONS = [
  { key: 'dueDate_asc', label: 'Due date (earliest)' },
  { key: 'dueDate_desc', label: 'Due date (latest)' },
  { key: 'startDate_asc', label: 'Start date (earliest)' },
  { key: 'startDate_desc', label: 'Start date (latest)' },
  { key: 'priority_desc', label: 'Priority (high first)' },
  { key: 'priority_asc', label: 'Priority (low first)' },
  { key: 'title_asc', label: 'Title (A-Z)' },
  { key: 'createdAt_desc', label: 'Recently created' },
];

export const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1 };

export const PRIORITY_LABEL = PRIORITIES.reduce((acc, item) => {
  acc[item.key] = item.label;
  return acc;
}, {});

export const STATUS_LABEL = STATUSES.reduce((acc, item) => {
  acc[item.key] = item.label;
  return acc;
}, {});
