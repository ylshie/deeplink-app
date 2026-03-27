// Tasks — stored on server per user account.
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

const BUILTIN_TASKS = [
  {
    id: 'task-1',
    name: 'BTC 15min Debate',
    status: 'active',
    statusColor: '#34C759',
    group: 'BTC 多维分析群',
    schedule: 'Every 15m',
    teamId: 'team-btc',
    builtin: true,
  },
];

export async function getTasks(statusFilter) {
  const token = await getSessionToken();
  let list = BUILTIN_TASKS;

  if (token) {
    try {
      list = await fetchApi('/user/tasks', {
        headers: { 'x-session-token': token },
      });
    } catch {
      // Server not available, use builtin fallback
      list = BUILTIN_TASKS;
    }
  }

  if (statusFilter && statusFilter !== '全部') {
    const map = { '运行中': 'active', '已暂停': 'paused', '草稿': 'draft' };
    return list.filter((t) => t.status === map[statusFilter]);
  }
  return list;
}

export async function addTask(task) {
  const token = await getSessionToken();
  if (!token) return;

  await fetchApi('/user/tasks', {
    method: 'POST',
    headers: { 'x-session-token': token },
    body: JSON.stringify({ task }),
  });
}

export async function deleteTask(taskId) {
  const token = await getSessionToken();
  if (!token) return { success: false };

  return fetchApi(`/user/tasks/${taskId}`, {
    method: 'DELETE',
    headers: { 'x-session-token': token },
  });
}

export async function getTaskRuns(taskId) {
  return [];
}

export async function runTask(taskId) {
  return { success: true };
}

export async function pauseTask(taskId) {
  return { success: true };
}
