import { Platform } from 'react-native';

// Backend server URL
// Android emulator uses 10.0.2.2 to reach host localhost
// iOS simulator and web use localhost directly
const LOCALHOST =
  Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL = `http://${LOCALHOST}:3000/api`;

/**
 * Generic fetch wrapper for API calls.
 */
export async function fetchApi(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${url} ${body}`);
  }
  return res.json();
}
