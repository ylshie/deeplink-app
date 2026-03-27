// Tasks — local state with one built-in task.
// User-created tasks stored in memory (lost on app restart for now).

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@deeplink_tasks';

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

let userTasks = null; // lazy loaded

async function loadUserTasks() {
  if (userTasks !== null) return;
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    userTasks = stored ? JSON.parse(stored) : [];
  } catch {
    userTasks = [];
  }
}

async function saveUserTasks() {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userTasks));
}

export async function getTasks(statusFilter) {
  await loadUserTasks();
  let list = [...BUILTIN_TASKS, ...userTasks];
  if (statusFilter && statusFilter !== '全部') {
    const map = { '运行中': 'active', '已暂停': 'paused', '草稿': 'draft' };
    list = list.filter((t) => t.status === map[statusFilter]);
  }
  return list;
}

export async function addTask(task) {
  await loadUserTasks();
  userTasks.push({ ...task, builtin: false });
  await saveUserTasks();
}

export async function deleteTask(taskId) {
  await loadUserTasks();
  const task = [...BUILTIN_TASKS, ...userTasks].find(t => t.id === taskId);
  if (task?.builtin) return { success: false, error: '内置任务不可删除' };
  userTasks = userTasks.filter(t => t.id !== taskId);
  await saveUserTasks();
  return { success: true };
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
