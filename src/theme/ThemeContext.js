import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from './colors';
import { getSettings, updateSettings } from '../api/settings';

const STORAGE_KEY = '@deeplink_theme_mode';

const ThemeContext = createContext({
  colors: lightColors,
  isDark: false,
  mode: 'system',
  setMode: () => {},
});

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState('system');
  const [loaded, setLoaded] = useState(false);

  // Load: try server settings first, fall back to local
  useEffect(() => {
    (async () => {
      try {
        const serverSettings = await getSettings();
        if (serverSettings?.theme) {
          setModeState(serverSettings.theme);
          setLoaded(true);
          return;
        }
      } catch { /* */ }

      // Fallback to local
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setModeState(saved);
        }
      } catch { /* */ }
      setLoaded(true);
    })();
  }, []);

  const setMode = (newMode) => {
    setModeState(newMode);
    // Save both locally (immediate) and to server (async)
    AsyncStorage.setItem(STORAGE_KEY, newMode);
    updateSettings({ theme: newMode }).catch(() => {});
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
