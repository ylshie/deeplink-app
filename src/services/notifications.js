/**
 * Push notification service.
 * Registers for push tokens and handles incoming notifications.
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../api/config';

const PUSH_TOKEN_KEY = '@deeplink_push_token';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and save token to server.
 */
export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('[notifications] Must use physical device');
    return null;
  }

  // Check existing permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[notifications] Permission not granted');
    return null;
  }

  // Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'DeepLink',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  // Get push token
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

    // Send token to server
    try {
      const sess = await AsyncStorage.getItem('@deeplink_session');
      if (sess) {
        const { token: sessToken } = JSON.parse(sess);
        await fetch(`${API_BASE_URL}/user/push-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-session-token': sessToken },
          body: JSON.stringify({ pushToken: token }),
        });
      }
    } catch { /* server may not have this endpoint yet */ }

    return token;
  } catch (err) {
    console.log('[notifications] Token error:', err.message);
    return null;
  }
}

/**
 * Schedule a local notification (for testing).
 */
export async function sendLocalNotification(title, body) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null, // immediate
  });
}

/**
 * Add notification response listener.
 */
export function addNotificationListener(callback) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
