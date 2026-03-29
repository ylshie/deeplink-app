import React, { useState, useEffect, useRef } from 'react';
import { StatusBar, ActivityIndicator, View, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import { ThemeProvider, useTheme } from './src/theme';
import { I18nProvider } from './src/i18n';
import { API_BASE_URL } from './src/api/config';
import { registerForPushNotifications } from './src/services/notifications';
import { startBackgroundPoller, stopBackgroundPoller } from './src/services/backgroundPoller';

const SESSION_KEY = '@deeplink_session';

const navigationRef = React.createRef();

function AppInner() {
  const { colors, isDark } = useTheme();
  const [session, setSession] = useState(null);   // { token, email }
  const [checking, setChecking] = useState(true);
  const notifResponseListener = useRef();

  // Listen for notification taps → navigate to the right screen (native only)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Handle tap when app was killed (launched by notification)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification?.request?.content?.data;
        if (data?.screen) {
          setTimeout(() => {
            navigationRef.current?.navigate(data.screen, data.params || {});
          }, 500);
        }
      }
    });

    // Handle tap when app is running (foreground/background)
    notifResponseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification?.request?.content?.data;
      if (data?.screen) {
        navigationRef.current?.navigate(data.screen, data.params || {});
      }
    });

    return () => {
      if (notifResponseListener.current) {
        Notifications.removeNotificationSubscription(notifResponseListener.current);
      }
    };
  }, []);

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
            startBackgroundPoller();
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
    registerForPushNotifications().catch(() => {});
    startBackgroundPoller();
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
    stopBackgroundPoller();
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
    <NavigationContainer ref={navigationRef}>
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
        <I18nProvider>
          <AppInner />
        </I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
