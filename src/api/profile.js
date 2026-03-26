// Profile data — local mock until backend supports these endpoints.

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

export async function getProfile() {
  return MOCK_PROFILE;
}

export async function getApiKeys() {
  return MOCK_API_KEYS;
}

export async function getPortfolio() {
  return MOCK_PORTFOLIO;
}

export async function deleteApiKey(keyId) {
  return { success: true };
}
