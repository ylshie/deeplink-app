// User settings — stored on server per user account.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchApi } from './config';

const SESSION_KEY = '@deeplink_session';

async function getSessionToken() {
  try {
    const stored = await AsyncStorage.getItem(SESSION_KEY);
    if (stored) return JSON.parse(stored).token;
  } catch { /* */ }
  return null;
}

export async function getSettings() {
  const token = await getSessionToken();
  if (!token) return null;

  try {
    return await fetchApi('/user/settings', {
      headers: { 'x-session-token': token },
    });
  } catch {
    return null;
  }
}

export async function updateSettings(settings) {
  const token = await getSessionToken();
  if (!token) return;

  await fetchApi('/user/settings', {
    method: 'PUT',
    headers: { 'x-session-token': token },
    body: JSON.stringify({ settings }),
  });
}
