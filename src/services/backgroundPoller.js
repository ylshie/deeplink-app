/**
 * Background poller for auto-trader signals.
 * Runs globally (not tied to any screen) and sends local notifications
 * when new analysis or trade signals arrive.
 */
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendLocalNotification } from './notifications';
import { API_BASE_URL } from '../api/config';

const POLL_INTERVAL = 30000; // 30 seconds
const LAST_SEEN_KEY = '@deeplink_last_signal_ts';

let timer = null;
let lastSeenTimestamp = 0;
let notifSettings = null;

/**
 * Load notification settings from server.
 */
async function loadNotifSettings() {
  try {
    const sess = await AsyncStorage.getItem('@deeplink_session');
    if (!sess) return;
    const { token } = JSON.parse(sess);
    const res = await fetch(`${API_BASE_URL}/user/settings`, {
      headers: { 'x-session-token': token },
    });
    if (res.ok) {
      const data = await res.json();
      notifSettings = data?.notifications || {};
    }
  } catch { /* */ }
}

/**
 * Check for new signals and send notifications.
 */
async function poll() {
  // Only notify when app is in background or inactive
  // (foreground shows data directly in UI)
  try {
    const res = await fetch(`${API_BASE_URL}/trading/auto/status`);
    if (!res.ok) return;
    const tasks = await res.json();

    for (const task of tasks) {
      if (task.status !== 'running') continue;
      const latest = task.lastSignal;
      if (!latest || !latest.timestamp) continue;

      // Skip if we've already seen this signal
      if (latest.timestamp <= lastSeenTimestamp) continue;

      lastSeenTimestamp = latest.timestamp;
      await AsyncStorage.setItem(LAST_SEEN_KEY, String(lastSeenTimestamp));

      // Determine notification type and check settings
      const isTradeExec = latest.entryPrice && latest.entryPrice > 0;
      const action = latest.action || 'HOLD';

      if (isTradeExec && notifSettings?.tradeExec !== false) {
        // Trade executed notification
        const side = ['BUY', 'EXECUTE'].includes(action) ? '买入' : '卖出';
        sendLocalNotification(
          `${side} ${latest.pair || 'BTC/USDT'}`,
          latest.trade || `${action} @ $${latest.entryPrice}`,
        );
      } else if (!isTradeExec && notifSettings?.signal !== false) {
        // Analysis signal notification
        sendLocalNotification(
          `${action} ${latest.confidence || 0}% — ${latest.pair || 'BTC/USDT'}`,
          latest.summary || '新的分析信号',
        );
      }
    }
  } catch { /* network error, skip */ }
}

/**
 * Start the background poller.
 * Call this after login.
 */
export function startBackgroundPoller() {
  if (timer) return; // already running

  // Load last seen timestamp
  AsyncStorage.getItem(LAST_SEEN_KEY).then((val) => {
    if (val) lastSeenTimestamp = parseInt(val) || 0;
  });

  // Load notification settings
  loadNotifSettings();

  // Poll immediately, then every 30s
  poll();
  timer = setInterval(poll, POLL_INTERVAL);
}

/**
 * Stop the background poller.
 * Call this on logout.
 */
export function stopBackgroundPoller() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  lastSeenTimestamp = 0;
}
