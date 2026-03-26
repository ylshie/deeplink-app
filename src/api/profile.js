import { USE_MOCK, mockDelay, fetchApi } from './config';

// ─── Mock Data ───────────────────────────────────────────────

const MOCK_PROFILE = {
  id: 'user-1',
  name: 'Eric',
  deepLinkId: 'ericyi',
  avatar: null,
  stats: {
    totalBalance: '$10,000',
    positions: 2,
    pnl: '+$240',
    pnlColor: '#34C759',
  },
};

const MOCK_API_KEYS = [
  {
    id: 'key-1',
    name: 'Binance API',
    exchange: 'binance',
    connected: true,
    permissions: '市场数据读取 · 模拟交易执行',
    icon: 'wallet',
    iconBg: '#007AFF',
  },
];

const MOCK_PORTFOLIO = {
  id: 'portfolio-1',
  name: '模拟交易组合',
  balance: '$10,000',
  positionCount: 2,
  icon: 'bar-chart-3',
  iconBg: '#34C759',
};

// ─── API Functions ───────────────────────────────────────────

/**
 * Fetch current user profile.
 * GET /profile
 */
export async function getProfile() {
  if (USE_MOCK) return mockDelay(MOCK_PROFILE);
  return fetchApi('/profile');
}

/**
 * Fetch user's API keys.
 * GET /profile/api-keys
 */
export async function getApiKeys() {
  if (USE_MOCK) return mockDelay(MOCK_API_KEYS);
  return fetchApi('/profile/api-keys');
}

/**
 * Fetch user's portfolio summary.
 * GET /profile/portfolio
 */
export async function getPortfolio() {
  if (USE_MOCK) return mockDelay(MOCK_PORTFOLIO);
  return fetchApi('/profile/portfolio');
}

/**
 * Delete an API key.
 * DELETE /profile/api-keys/:id
 */
export async function deleteApiKey(keyId) {
  if (USE_MOCK) return mockDelay({ success: true });
  return fetchApi(`/profile/api-keys/${keyId}`, { method: 'DELETE' });
}
