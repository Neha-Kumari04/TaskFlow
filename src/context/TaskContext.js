import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';

import { createId, loadTasks, sanitizeTask, saveTasks, setStorageVersion } from '../data/taskStorage';
import { todayISO } from '../utils/date';

const TaskContext = createContext(null);

const INITIAL_STATE = {
  tasks: [],
  isLoading: true,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, isLoading: true, error: null };
    case 'LOAD_SUCCESS':
      return { ...state, tasks: action.tasks, isLoading: false, error: null };
    case 'LOAD_FAILURE':
      return { ...state, tasks: [], isLoading: false, error: action.error };
    case 'CREATE':
      return { ...state, tasks: [action.task, ...state.tasks] };
    case 'UPDATE':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.id ? { ...task, ...action.changes } : task
        ),
      };
    case 'DELETE':
      return { ...state, tasks: state.tasks.filter((task) => task.id !== action.id) };
    case 'BULK_ADD':
      return { ...state, tasks: [...action.tasks, ...state.tasks] };
    case 'CLEAR':
      return { ...state, tasks: [] };
    case 'ERROR':
      return { ...state, error: action.error };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

export function TaskProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const saveTimer = useRef(null);

  useEffect(() => {
    let active = true;

    (async () => {
      dispatch({ type: 'LOAD_START' });
      try {
        const stored = await loadTasks();
        if (!active) return;
        await setStorageVersion('1');
        dispatch({ type: 'LOAD_SUCCESS', tasks: stored });
      } catch (error) {
        if (!active) return;
        dispatch({ type: 'LOAD_FAILURE', error: error?.message || 'Unable to load your tasks.' });
      }
    })();

    return () => {
      active = false;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    if (state.isLoading) return undefined;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTasks(state.tasks).catch(() => {
        dispatch({ type: 'ERROR', error: 'Changes could not be saved to local storage.' });
      });
    }, 250);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state.tasks, state.isLoading]);

  const addTask = useCallback((draft) => {
    const now = new Date().toISOString();
    const task = sanitizeTask({
      ...draft,
      id: draft.id || createId(),
      status: draft.status === 'completed' ? 'completed' : 'pending',
      completedAt: draft.status === 'completed' ? now : null,
      source: 'manual',
      createdAt: now,
      updatedAt: now,
    });
    if (!task) return null;
    dispatch({ type: 'CREATE', task });
    return task;
  }, []);

  const updateTask = useCallback((id, changes) => {
    dispatch({
      type: 'UPDATE',
      id,
      changes: {
        ...changes,
        updatedAt: new Date().toISOString(),
      },
    });
  }, []);

  const deleteTask = useCallback((id) => {
    dispatch({ type: 'DELETE', id });
  }, []);

  const toggleTaskStatus = useCallback((id) => {
    const task = state.tasks.find((item) => item.id === id);
    if (!task) return;
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    updateTask(id, {
      status: nextStatus,
      completedAt: nextStatus === 'completed' ? new Date().toISOString() : null,
    });
  }, [state.tasks, updateTask]);

  const importTasks = useCallback((incoming) => {
    const prepared = incoming.map(sanitizeTask).filter(Boolean);
    if (prepared.length > 0) {
      dispatch({ type: 'BULK_ADD', tasks: prepared });
    }
    return prepared.length;
  }, []);

  const clearAllTasks = useCallback(async () => {
    dispatch({ type: 'CLEAR' });
    await saveTasks([]);
  }, []);

  const clearError = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), []);

  const stats = useMemo(() => {
    const today = todayISO();
    let completed = 0;
    let pending = 0;
    let overdue = 0;
    let todayTasks = 0;

    state.tasks.forEach((task) => {
      if (task.status === 'completed') {
        completed += 1;
      } else {
        pending += 1;
        if (task.dueDate && task.dueDate < today) overdue += 1;
      }
      const start = task.startDate || task.dueDate;
      const end = task.dueDate || task.startDate;
      if (start && end && start <= today && today <= end) todayTasks += 1;
    });

    return {
      total: state.tasks.length,
      completed,
      pending,
      overdue,
      today: todayTasks,
      completionRate: state.tasks.length === 0 ? 0 : Math.round((completed / state.tasks.length) * 100),
    };
  }, [state.tasks]);

  const value = useMemo(
    () => ({
      ...state,
      stats,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskStatus,
      importTasks,
      clearAllTasks,
      clearError,
    }),
    [state, stats, addTask, updateTask, deleteTask, toggleTaskStatus, importTasks, clearAllTasks, clearError]
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTasks() {
  const ctx = useContext(TaskContext);
  if (!ctx) {
    throw new Error('useTasks must be used inside a TaskProvider');
  }
  return ctx;
}

export function useTaskById(id) {
  const { tasks } = useTasks();
  return useMemo(() => tasks.find((task) => task.id === id) || null, [tasks, id]);
}
