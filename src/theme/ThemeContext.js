import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { darkColors, lightColors } from './palette';

const THEME_KEY = '@taskflow/theme_mode';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState('light');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(THEME_KEY)
      .then((stored) => {
        if (!active) return;
        if (stored === 'light' || stored === 'dark') {
          setMode(stored);
        } else {
          setMode(systemScheme === 'dark' ? 'dark' : 'light');
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const persistMode = useCallback(async (nextMode) => {
    setMode(nextMode);
    try {
      await AsyncStorage.setItem(THEME_KEY, nextMode);
    } catch {
    }
  }, []);

  const toggleTheme = useCallback(() => {
    persistMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, persistMode]);

  const value = useMemo(() => {
    const colors = mode === 'dark' ? darkColors : lightColors;
    return {
      mode,
      colors,
      isDark: mode === 'dark',
      isReady,
      setMode: persistMode,
      toggleTheme,
    };
  }, [mode, isReady, persistMode, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside a ThemeProvider');
  }
  return ctx;
}
