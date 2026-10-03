const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function toISODate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function parseISODate(value) {
  if (!value || typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (Number.isNaN(date.getTime())) return null;
  if (date.getMonth() !== Number(m) - 1 || date.getDate() !== Number(d)) return null;
  return date;
}

export function isValidISODate(value) {
  return parseISODate(value) !== null;
}

export function normalizeDateInput(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();

  if (isValidISODate(trimmed)) return toISODate(parseISODate(trimmed));

  const alt = /^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/.exec(trimmed);
  if (alt) {
    const [, a, b, y] = alt;
    const day = Number(a);
    const month = Number(b);
    const iso = `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return isValidISODate(iso) ? iso : null;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return toISODate(parsed);

  return null;
}

export function formatDate(value) {
  const date = typeof value === 'string' ? parseISODate(value) : value;
  if (!date) return '—';
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateShort(value) {
  const date = typeof value === 'string' ? parseISODate(value) : value;
  if (!date) return '—';
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]}`;
}

export function addDays(iso, amount) {
  const date = parseISODate(iso);
  if (!date) return null;
  date.setDate(date.getDate() + amount);
  return toISODate(date);
}

export function daysBetween(aISO, bISO) {
  const a = parseISODate(aISO);
  const b = parseISODate(bISO);
  if (!a || !b) return null;
  const ms = b.setHours(0, 0, 0, 0) - a.setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

export function isOverdue(task) {
  if (!task || task.status === 'completed') return false;
  if (!task.dueDate) return false;
  return task.dueDate < todayISO();
}

export function isTodayTask(task) {
  if (!task) return false;
  const today = todayISO();
  const start = task.startDate || task.dueDate;
  const end = task.dueDate || task.startDate;
  if (!start || !end) return false;
  return start <= today && today <= end;
}

export function getDateRangeLabel(startDate, dueDate) {
  if (!startDate && !dueDate) return 'No schedule';
  if (startDate && dueDate) {
    return startDate === dueDate ? formatDate(startDate) : `${formatDate(startDate)} → ${formatDate(dueDate)}`;
  }
  return startDate ? `${formatDate(startDate)} → —` : `— → ${formatDate(dueDate)}`;
}
