import AsyncStorage from '@react-native-async-storage/async-storage';

import { PRIORITY_WEIGHT, PRIORITY_LABEL, STATUS_LABEL } from '../utils/constants';

const TASKS_KEY = '@taskflow/tasks';
const TASKS_VERSION_KEY = '@taskflow/tasks_version';
const CURRENT_VERSION = '1';

function isPriority(value) {
  return value === 'high' || value === 'medium' || value === 'low';
}

function normalizeStatus(value, fallbackDueDate) {
  const v = String(value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (v === 'completed' || v === 'complete' || v === 'done' || v === 'closed' || v === 'finished') {
    return 'completed';
  }
  if (v === 'pending' || v === 'open' || v === 'todo' || v === 'in_progress' || v === 'inprogress') {
    return 'pending';
  }
  if (fallbackDueDate) return fallbackDueDate < new Date().toISOString().slice(0, 10) ? 'completed' : 'pending';
  return 'pending';
}

export function sanitizeTask(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const priority = String(raw.priority ?? '').trim().toLowerCase();
  const title = String(raw.title ?? '').trim();

  return {
    id: raw.id ? String(raw.id) : createId(),
    title,
    description: String(raw.description ?? '').trim(),
    category: String(raw.category ?? '').trim() || 'Other',
    priority: isPriority(priority) ? priority : 'medium',
    startDate: raw.startDate || '',
    dueDate: raw.dueDate || '',
    status: raw.status === 'completed' ? 'completed' : 'pending',
    completedAt: raw.status === 'completed' ? raw.completedAt || raw.updatedAt || new Date().toISOString() : null,
    csvId: raw.csvId === undefined || raw.csvId === null || raw.csvId === '' ? null : String(raw.csvId),
    source: raw.source === 'csv' ? 'csv' : 'manual',
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
  };
}

export function normalizeStatusForImport(value, dueDate) {
  return normalizeStatus(value, dueDate);
}

let idCounter = 0;
export function createId() {
  idCounter += 1;
  const random = Math.random().toString(36).slice(2, 10);
  return `t_${Date.now().toString(36)}_${idCounter.toString(36)}_${random}`;
}

export async function loadTasks() {
  try {
    const raw = await AsyncStorage.getItem(TASKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(sanitizeTask).filter(Boolean);
  } catch {
    return [];
  }
}

export async function saveTasks(tasks) {
  await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export async function getStorageVersion() {
  try {
    return await AsyncStorage.getItem(TASKS_VERSION_KEY);
  } catch {
    return null;
  }
}

export async function setStorageVersion(version) {
  try {
    await AsyncStorage.setItem(TASKS_VERSION_KEY, version);
  } catch {
  }
}

export { PRIORITY_LABEL, PRIORITY_WEIGHT, STATUS_LABEL };
