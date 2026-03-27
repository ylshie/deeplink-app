import React, { useState, useEffect } from 'react';
import { StatusBar, ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import { ThemeProvider, useTheme } from './src/theme';
import { API_BASE_URL } from './src/api/config';

const SESSION_KEY = '@deeplink_session';

function AppInner() {
  const { colors, isDark } = useTheme();
  const [session, setSession] = useState(null);   // { token, email }
  const [checking, setChecking] = useState(true);

  // Check saved session on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(SESSION_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Validate with server
          const res = await fetch(`${API_BASE_URL}/auth/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: parsed.token }),
          });
          const data = await res.json();
          if (data.valid) {
            setSession(parsed);
            // Server restores binance token from user data automatically on auth/check
          } else {
            await AsyncStorage.removeItem(SESSION_KEY);
          }
        }
      } catch { /* */ }
      setChecking(false);
    })();
  }, []);

  const handleLogin = async ({ token, email }) => {
    const sess = { token, email };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sess));
    setSession(sess);
  };

  const handleLogout = async () => {
    if (session?.token) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: session.token }),
        });
      } catch { /* */ }
    }
    await AsyncStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  if (checking) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <LoginScreen onLogin={handleLogin} />
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
        <AppNavigator session={session} onLogout={handleLogout} />
      </SafeAreaView>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
