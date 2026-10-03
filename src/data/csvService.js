import Papa from 'papaparse';

import { isValidISODate, normalizeDateInput } from '../utils/date';
import { createId, normalizeStatusForImport } from './taskStorage';

export const CSV_COLUMNS = [
  { key: 'id', aliases: ['id', 'taskid', 'task_id', 'serial', 'sr', 'no', 'sno'] },
  { key: 'title', aliases: ['title', 'task', 'tasktitle', 'name', 'task_name'] },
  { key: 'description', aliases: ['description', 'details', 'desc', 'task_description'] },
  { key: 'category', aliases: ['category', 'type', 'tag', 'group'] },
  { key: 'priority', aliases: ['priority', 'prio', 'urgency'] },
  { key: 'startDate', aliases: ['startdate', 'start', 'start_date', 'startdate_'] },
  { key: 'dueDate', aliases: ['duedate', 'due', 'due_date', 'deadline', 'end_date', 'enddate'] },
  { key: 'status', aliases: ['status', 'state', 'completion', 'done'] },
];

const HEADER_LOOKUP = (() => {
  const map = new Map();
  CSV_COLUMNS.forEach((col) => {
    col.aliases.forEach((alias) => map.set(alias, col.key));
  });
  return map;
})();

function normalizeHeader(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s\-.]+/g, '_')
    .replace(/_+$/, '');
}

function buildColumnMap(headerFields) {
  const map = {};
  headerFields.forEach((field, index) => {
    const key = HEADER_LOOKUP.get(normalizeHeader(field));
    if (key && map[key] === undefined) {
      map[key] = index;
    }
  });
  return map;
}

function looksLikeHeaderRow(fields) {
  if (!Array.isArray(fields) || fields.length === 0) return false;
  const cells = fields.map((f) => normalizeHeader(f));
  const matched = cells.filter((cell) => HEADER_LOOKUP.has(cell)).length;
  if (matched >= 3) return true;
  const first = cells[0];
  const looksNumericId = /^\d+$/.test(String(fields[0] ?? '').trim());
  const hasPriorityWord = cells.some((c) => ['high', 'medium', 'low'].includes(c));
  return matched >= 2 && !looksNumericId && !hasPriorityWord;
}

function detectDelimiter(sample) {
  const firstLine = String(sample ?? '').split(/\r?\n/).find((line) => line.trim().length > 0) ?? '';
  const candidates = [',', ';', '\t', '|'];
  let best = ',';
  let bestCount = 0;
  candidates.forEach((candidate) => {
    const count = firstLine.split(candidate).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = candidate;
    }
  });
  return bestCount > 0 ? best : ',';
}

export function parseCsvText(text) {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return { ok: false, error: 'The selected file is empty.' };
  }

  const delimiter = detectDelimiter(text);
  const result = Papa.parse(text, {
    delimiter,
    skipEmptyLines: 'greedy',
  });

  if (!result || !Array.isArray(result.data) || result.data.length === 0) {
    return { ok: false, error: 'No rows could be read from this file.' };
  }

  const rawRows = result.data;
  let dataRows = rawRows;
  let headerMap;
  let hasHeader = false;

  if (looksLikeHeaderRow(rawRows[0])) {
    hasHeader = true;
    headerMap = buildColumnMap(rawRows[0]);
    dataRows = rawRows.slice(1);
  } else {
    headerMap = { id: 0, title: 1, description: 2, category: 3, priority: 4, startDate: 5, dueDate: 6, status: 7 };
  }

  const mappedKeys = Object.keys(headerMap);
  if (mappedKeys.length < 2 || headerMap.title === undefined) {
    return {
      ok: false,
      error:
        'This CSV does not look like a TaskFlow export. Expected columns: ' +
        CSV_COLUMNS.map((c) => c.key).join(', ') +
        '.',
    };
  }

  const width = Math.max(...Object.values(headerMap).map((i) => i + 1));
  const normalizedRows = dataRows
    .filter((row) => Array.isArray(row) && row.some((cell) => String(cell ?? '').trim() !== ''))
    .map((row) => {
      const copy = new Array(width).fill('');
      row.forEach((cell, i) => {
        copy[i] = cell;
      });
      return copy;
    });

  return {
    ok: true,
    delimiter,
    hasHeader,
    columnMap: headerMap,
    rows: normalizedRows,
    startRowNumber: hasHeader ? 2 : 1,
    mappedKeys,
  };
}

export function validateRow(row, columnMap) {
  const get = (key) => {
    const index = columnMap[key];
    return index === undefined ? '' : String(row[index] ?? '').trim();
  };

  const rawTitle = get('title');
  const rawPriority = get('priority').toLowerCase();
  const rawStatus = get('status');
  const rawStart = get('startDate');
  const rawDue = get('dueDate');

  const errors = [];

  if (!rawTitle) {
    errors.push({ field: 'title', message: 'Title is required' });
  } else if (rawTitle.length > 120) {
    errors.push({ field: 'title', message: 'Title must be 120 characters or fewer' });
  }

  let priority = 'medium';
  if (rawPriority) {
    if (['high', 'medium', 'low'].includes(rawPriority)) {
      priority = rawPriority;
    } else {
      errors.push({ field: 'priority', message: `Priority "${get('priority')}" must be Low, Medium or High` });
    }
  }

  let startDate = '';
  if (rawStart) {
    const normalized = normalizeDateInput(rawStart);
    if (!normalized || !isValidISODate(normalized)) {
      errors.push({ field: 'startDate', message: `Start date "${get('startDate')}" is not a valid date` });
    } else {
      startDate = normalized;
    }
  }

  let dueDate = '';
  if (rawDue) {
    const normalized = normalizeDateInput(rawDue);
    if (!normalized || !isValidISODate(normalized)) {
      errors.push({ field: 'dueDate', message: `Due date "${get('dueDate')}" is not a valid date` });
    } else {
      dueDate = normalized;
    }
  }

  if (startDate && dueDate && dueDate < startDate) {
    errors.push({ field: 'dueDate', message: 'Due date cannot be earlier than the start date' });
  }

  let status = 'pending';
  if (rawStatus) {
    status = normalizeStatusForImport(rawStatus, dueDate);
    const recognised = [
      'pending',
      'completed',
      'complete',
      'done',
      'closed',
      'finished',
      'open',
      'todo',
      'in_progress',
      'inprogress',
    ];
    if (!recognised.includes(rawStatus.toLowerCase().replace(/[\s-]+/g, '_'))) {
      errors.push({ field: 'status', message: `Status "${get('status')}" is not recognised` });
    }
  }

  const csvId = get('id');
  const category = get('category');

  return {
    errors,
    task: {
      id: createId(),
      title: rawTitle,
      description: get('description'),
      category: category || 'Other',
      priority,
      startDate,
      dueDate,
      status,
      completedAt: status === 'completed' ? new Date().toISOString() : null,
      csvId: csvId || null,
      source: 'csv',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

function fingerprint(task) {
  return [task.title.toLowerCase(), task.startDate, task.dueDate, task.category.toLowerCase()].join('|');
}

export function analyzeCsv(text, existingTasks = []) {
  const parsed = parseCsvText(text);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const { rows, columnMap, startRowNumber, delimiter, hasHeader } = parsed;

  const seenIds = new Set();
  const seenFingerprints = new Set();
  existingTasks.forEach((task) => {
    if (task.id) seenIds.add(String(task.id));
    if (task.csvId) seenIds.add(`csv:${task.csvId}`);
    seenFingerprints.add(fingerprint(task));
  });

  const valid = [];
  const invalid = [];
  const duplicates = [];

  rows.forEach((row, index) => {
    const rowNumber = startRowNumber + index;
    const { errors, task } = validateRow(row, columnMap);

    if (errors.length > 0) {
      invalid.push({ rowNumber, errors, preview: task.title || '(no title)' });
      return;
    }

    const idKey = task.csvId ? `csv:${task.csvId}` : `id:${task.id}`;
    const print = fingerprint(task);

    if (seenIds.has(idKey) || (task.csvId && seenIds.has(String(task.csvId)))) {
      duplicates.push({ rowNumber, reason: 'Duplicate id', preview: task.title });
      return;
    }

    if (seenFingerprints.has(print)) {
      duplicates.push({ rowNumber, reason: 'Duplicate title, start date and due date', preview: task.title });
      return;
    }

    seenIds.add(idKey);
    seenFingerprints.add(print);
    valid.push({ rowNumber, task });
  });

  return {
    ok: true,
    delimiter,
    hasHeader,
    columnCount: Math.max(...Object.values(columnMap).map((i) => i + 1)),
    totalRows: rows.length,
    valid,
    invalid,
    duplicates,
  };
}

function escapeCsvValue(value) {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function tasksToCsv(tasks) {
  const headers = ['id', 'title', 'description', 'category', 'priority', 'start_date', 'due_date', 'status'];
  const lines = [headers.join(',')];

  tasks.forEach((task, index) => {
    const row = [
      task.csvId || index + 1,
      task.title,
      task.description,
      task.category,
      task.priority,
      task.startDate,
      task.dueDate,
      task.status,
    ];
    lines.push(row.map(escapeCsvValue).join(','));
  });

  return `${lines.join('\n')}\n`;
}
