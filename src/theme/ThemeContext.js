import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from './colors';

const STORAGE_KEY = '@deeplink_theme_mode';

/**
 * Theme mode:
 *   'system' — follow OS setting
 *   'light'  — force light
 *   'dark'   — force dark
 */
const ThemeContext = createContext({
  colors: lightColors,
  isDark: false,
  mode: 'system',        // 'system' | 'light' | 'dark'
  setMode: () => {},
});

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [mode, setModeState] = useState('system');
  const [loaded, setLoaded] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setModeState(saved);
      }
      setLoaded(true);
    });
  }, []);

  // Persist when mode changes
  const setMode = (newMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(STORAGE_KEY, newMode);
  };

  const isDark = useMemo(() => {
    if (mode === 'system') return systemScheme === 'dark';
    return mode === 'dark';
  }, [mode, systemScheme]);

  const colors = isDark ? darkColors : lightColors;

  const value = useMemo(
    () => ({ colors, isDark, mode, setMode }),
    [colors, isDark, mode],
  );

  // Don't render children until saved pref is loaded (avoids flash)
  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
