import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

async function getToken() {
  const sess = await AsyncStorage.getItem('@deeplink_session');
  if (!sess) return null;
  return JSON.parse(sess).token;
}

export async function getAccounts() {
  const token = await getToken();
  if (!token) return [];
  const res = await fetch(`${API_BASE_URL}/user/accounts`, {
    headers: { 'x-session-token': token },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function createAccount(data) {
  const token = await getToken();
  if (!token) throw new Error('未登录');
  const res = await fetch(`${API_BASE_URL}/user/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-session-token': token },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok || result.error) throw new Error(result.error || `Server ${res.status}`);
  return result;
}

export async function deleteAccount(accountId) {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}/user/accounts/${accountId}`, {
    method: 'DELETE',
    headers: { 'x-session-token': token },
  });
  return res.json();
}
