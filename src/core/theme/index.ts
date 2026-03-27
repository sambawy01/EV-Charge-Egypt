import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, ThemeColors } from './colors';

export { spacing, borderRadius } from './spacing';
export { typography } from './typography';
export { darkColors, lightColors } from './colors';
export { colors } from './colors';

type ThemeMode = 'dark' | 'light';

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const THEME_STORAGE_KEY = 'ev_charge_theme_mode';

const ThemeContext = createContext<ThemeContextValue>({
  colors: darkColors,
  isDark: true,
  mode: 'dark',
  toggleTheme: () => {},
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') {
        setModeState(stored);
      }
    });
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
  };

  const toggleTheme = () => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  };

  const value: ThemeContextValue = {
    colors: mode === 'dark' ? darkColors : lightColors,
    isDark: mode === 'dark',
    mode,
    toggleTheme,
    setMode,
  };

  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme() {
  return useContext(ThemeContext);
}
