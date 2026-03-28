import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import zhCN from './zh-CN';
import zhTW from './zh-TW';
import en from './en';
import { getSettings, updateSettings } from '../api/settings';

const STORAGE_KEY = '@deeplink_language';

const translations = { 'zh-CN': zhCN, 'zh-TW': zhTW, en };

const I18nContext = createContext({
  t: (key) => key,
  lang: 'zh-CN',
  setLang: () => {},
});

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState('zh-CN');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Try server settings first
        const serverSettings = await getSettings();
        if (serverSettings?.language) {
          setLangState(serverSettings.language);
          setLoaded(true);
          return;
        }
      } catch { /* */ }
      // Fallback to local
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved && translations[saved]) setLangState(saved);
      } catch { /* */ }
      setLoaded(true);
    })();
  }, []);

  const setLang = (newLang) => {
    setLangState(newLang);
    AsyncStorage.setItem(STORAGE_KEY, newLang);
    updateSettings({ language: newLang }).catch(() => {});
  };

  const t = useMemo(() => {
    const strings = translations[lang] || zhCN;
    return (key, params) => {
      let str = strings[key] || zhCN[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          str = str.replace(`{${k}}`, v);
        });
      }
      return str;
    };
  }, [lang]);

  const value = useMemo(() => ({ t, lang, setLang }), [t, lang]);

  if (!loaded) return null;

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
