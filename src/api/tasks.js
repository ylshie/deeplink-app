import { USE_MOCK, mockDelay, fetchApi } from './config';

// ─── Mock Data ───────────────────────────────────────────────

const MOCK_TASKS = [
  {
    id: 'task-1',
    name: 'BTC 15min Debate',
    status: 'active',
    statusColor: '#34C759',
    group: 'BTC 多维分析群',
    schedule: 'Every 15m',
    lastTime: '14:15',
    lastResult: 'BUY (82%)',
    lastResultColor: '#34C759',
    nextRun: '14:30',
    showCheck: true,
  },
  {
    id: 'task-2',
    name: 'ETH Daily Morning Brief',
    status: 'paused',
    statusColor: '#FF9500',
    group: 'ETH分析群',
    schedule: 'Daily 09:00 (Paused)',
    lastTime: '2026-02-28 09:00',
    lastResult: 'HOLD',
    lastResultColor: '#888888',
    pausedSince: '2026-03-01',
  },
  {
    id: 'task-3',
    name: 'SOL Anomaly Detection',
    status: 'draft',
    statusColor: '#AAAAAA',
    group: 'SOL分析群',
    schedule: 'Every 5m (Draft)',
    neverRun: true,
  },
];

const MOCK_TASK_RUNS = {
  'task-1': [
    {
      id: 'run-1',
      time: '14:15',
      result: 'BUY (82%)',
      resultColor: '#34C759',
      duration: '42s',
      desc: '基本面强劲，技术面突破...',
      trade: 'Trade: +0.05 BTC @ $84,230',
      tradeColor: '#34C759',
      tradeIcon: 'trending-up',
    },
    {
      id: 'run-2',
      time: '14:00',
      result: 'HOLD (58%)',
      resultColor: '#FF9500',
      duration: '39s',
      desc: '方向不明确，建议观望...',
    },
    {
      id: 'run-3',
      time: '13:45',
      result: 'BUY (75%)',
      resultColor: '#34C759',
      duration: '45s',
      desc: '情绪面转稳，堆上资金流入...',
      trade: 'Trade: +0.03 BTC @ $83,680',
      tradeColor: '#34C759',
      tradeIcon: 'trending-up',
    },
    {
      id: 'run-4',
      time: '13:30',
      result: 'Recovered',
      resultColor: '#FF9500',
      resultBg: '#FF950020',
      duration: '44s',
      desc: 'Missed run — recovered at 13:31',
      tradeIcon: 'rotate-ccw',
    },
  ],
};

// ─── API Functions ───────────────────────────────────────────

/**
 * Fetch all tasks with optional status filter.
 * GET /tasks?status=active|paused|draft
 */
export async function getTasks(statusFilter) {
  if (USE_MOCK) {
    let list = MOCK_TASKS;
    if (statusFilter && statusFilter !== '全部') {
      const map = { '运行中': 'active', '已暂停': 'paused', '草稿': 'draft' };
      list = list.filter((t) => t.status === map[statusFilter]);
    }
    return mockDelay(list);
  }
  const query = statusFilter && statusFilter !== '全部' ? `?status=${statusFilter}` : '';
  return fetchApi(`/tasks${query}`);
}

/**
 * Fetch run history for a specific task.
 * GET /tasks/:id/runs
 */
export async function getTaskRuns(taskId) {
  if (USE_MOCK) {
    return mockDelay(MOCK_TASK_RUNS[taskId] || []);
  }
  return fetchApi(`/tasks/${taskId}/runs`);
}

/**
 * Trigger an immediate run for a task.
 * POST /tasks/:id/run
 */
export async function runTask(taskId) {
  if (USE_MOCK) return mockDelay({ success: true });
  return fetchApi(`/tasks/${taskId}/run`, { method: 'POST' });
}

/**
 * Pause a running task.
 * POST /tasks/:id/pause
 */
export async function pauseTask(taskId) {
  if (USE_MOCK) return mockDelay({ success: true });
  return fetchApi(`/tasks/${taskId}/pause`, { method: 'POST' });
}
