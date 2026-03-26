import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  ChevronLeft,
  Pencil,
  Play,
  Pause,
  Square,
} from 'lucide-react-native';
import { useTheme } from '../theme';
import { API_BASE_URL } from '../api/config';

const tabs = ['历史', '交易', '配置'];

export default function TaskDetailScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { id, name } = route?.params || {};
  const displayName = name || 'BTC 15min Debate';
  const [activeTab, setActiveTab] = useState('历史');
  const [debates, setDebates] = useState([]);   // 历史: AI debate results
  const [trades, setTrades] = useState([]);     // 交易: actual executions
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('stopped'); // stopped | running | paused
  const [error, setError] = useState(null);
  const pollRef = React.useRef(null);

  const taskTeamMap = { 'task-1': 'team-btc', 'task-2': 'team-eth-arb', 'task-3': 'team-quant' };
  const teamId = taskTeamMap[id] || 'team-btc';

  // Fetch initial state
  useEffect(() => {
    (async () => {
      try {
        const autoStatus = await fetch(`${API_BASE_URL}/trading/auto/status/${id}`)
          .then(r => r.ok ? r.json() : null).catch(() => null);

        if (autoStatus?.status === 'running') {
          setStatus('running');
          if (autoStatus.signals) splitSignals(autoStatus.signals);
          startPolling();
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [id]);

  // Split server signals into debates (all) and trades (only executed)
  const splitSignals = (signals) => {
    setDebates(signals);
    setTrades(signals.filter(s => s.trade && !s.trade.includes('暂无') && !s.trade.includes('观察')));
  };

  // Poll server every 10s for new data
  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/trading/auto/status/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.signals) splitSignals(data.signals);
        if (data.status && data.status !== 'running') {
          setStatus(data.status);
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch { /* ignore */ }
    }, 10000);
  };

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  // ── Actions ──

  const handleStart = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/trading/auto/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: id, teamId, autoExecute: true, quoteAmount: 500 }),
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      setStatus('running');
      startPolling();
    } catch (e) {
      setError(e.message);
    }
  };

  const handlePause = async () => {
    setError(null);
    try {
      await fetch(`${API_BASE_URL}/trading/auto/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: id }),
      });
      setStatus('paused');
      stopPolling();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleStop = async () => {
    setError(null);
    try {
      await fetch(`${API_BASE_URL}/trading/auto/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: id }),
      });
      setStatus('stopped');
      stopPolling();
    } catch (e) {
      setError(e.message);
    }
  };

  // ── Badge style ──
  const getBadge = (action) => {
    if (['BUY', 'EXECUTE', 'DEPLOY'].includes(action)) return { bg: '#E8F8EE', color: '#34C759' };
    if (['SELL'].includes(action)) return { bg: '#FEECEB', color: '#F54A45' };
    return { bg: colors.divider, color: colors.textSecondary };
  };

  // ── Render tabs ──

  const renderHistory = () => (
    <>
      {debates.length > 0 && <Text style={[styles.dayHeader, { color: colors.textSecondary }]}>分析记录</Text>}
      {debates.map((d) => {
        const badge = getBadge(d.action);
        return (
          <View key={d.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.cardHead}>
              <View style={styles.cardLeft}>
                <Text style={[styles.cardTime, { color: colors.textPrimary }]}>{d.time}</Text>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.color }]}>{d.action}</Text>
                </View>
              </View>
              <Text style={[styles.cardConf, { color: badge.color }]}>{d.confidence}%</Text>
            </View>
            <Text style={[styles.cardSummary, { color: colors.textSecondary }]}>{d.summary}</Text>
          </View>
        );
      })}
      {debates.length === 0 && (
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            {status === 'stopped' ? '点击下方「测试运行」开始 AI 分析' : '等待第一次分析结果...'}
          </Text>
        </View>
      )}
    </>
  );

  const renderTrades = () => (
    <>
      {trades.length > 0 && <Text style={[styles.dayHeader, { color: colors.textSecondary }]}>交易记录</Text>}
      {trades.map((t) => {
        const badge = getBadge(t.action);
        return (
          <View key={t.id + '-trade'} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.cardHead}>
              <View style={styles.cardLeft}>
                <Text style={[styles.cardTime, { color: colors.textPrimary }]}>{t.time}</Text>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.color }]}>{t.action}</Text>
                </View>
              </View>
              <Text style={[styles.cardConf, { color: badge.color }]}>{t.confidence}%</Text>
            </View>
            <Text style={[styles.tradeLine, { color: badge.color }]}>{t.trade}</Text>
            {t.tradePrice && <Text style={[styles.tradePrice, { color: colors.textMuted }]}>{t.tradePrice}</Text>}
          </View>
        );
      })}
      {trades.length === 0 && (
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            {status === 'stopped' ? '尚未执行任何交易' : '等待交易信号 (confidence ≥ 70%)...'}
          </Text>
        </View>
      )}
    </>
  );

  const renderConfig = () => (
    <View style={[styles.configCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <CfgRow label="交易对" value="BTC/USDT" colors={colors} />
      <CfgRow label="时间框架" value="15分钟" colors={colors} />
      <CfgRow label="单笔金额" value="500 USDT" colors={colors} />
      <CfgRow label="执行间隔" value="15 分钟" colors={colors} />
      <CfgRow label="自动执行阈值" value="confidence ≥ 70%" colors={colors} />
      <CfgRow label="最大持仓" value="1" colors={colors} last />
    </View>
  );

  // ── Status display ──
  const statusColor = status === 'running' ? '#34C759' : status === 'paused' ? '#FF9500' : colors.textMuted;
  const statusText = status === 'running' ? '运行中 · 15m' : status === 'paused' ? '已暂停' : '未运行';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Nav Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.navCenter}>
          <Text style={[styles.navTitle, { color: colors.textPrimary }]} numberOfLines={1}>{displayName}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>{statusText}</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Pencil size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { borderBottomColor: colors.divider }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && [styles.tabItemActive, { borderBottomColor: colors.primary }]]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === tab && { color: colors.primary, fontWeight: '600' }]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentList} showsVerticalScrollIndicator={false}>
          {activeTab === '历史' && renderHistory()}
          {activeTab === '交易' && renderTrades()}
          {activeTab === '配置' && renderConfig()}
        </ScrollView>
      )}

      {/* Error */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText} numberOfLines={2}>错误: {error}</Text>
        </View>
      )}

      {/* Running status banner */}
      {status === 'running' && (
        <View style={[styles.runBanner, { backgroundColor: colors.primary + '12' }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.runBannerText, { color: colors.primary }]}>
            自动运行中 · {debates.length} 次分析 · {trades.length} 笔交易
          </Text>
        </View>
      )}

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        {status === 'stopped' && (
          <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.8}>
            <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.btnTextWhite}>测试运行</Text>
          </TouchableOpacity>
        )}
        {status === 'running' && (
          <>
            <TouchableOpacity style={[styles.pauseBtn, { backgroundColor: '#FF9500' }]} onPress={handlePause} activeOpacity={0.8}>
              <Pause size={18} color="#FFFFFF" />
              <Text style={styles.btnTextWhite}>暂停</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stopBtn} onPress={handleStop} activeOpacity={0.8}>
              <Square size={16} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.btnTextWhite}>停止</Text>
            </TouchableOpacity>
          </>
        )}
        {status === 'paused' && (
          <>
            <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.8}>
              <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.btnTextWhite}>继续运行</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stopBtn} onPress={handleStop} activeOpacity={0.8}>
              <Square size={16} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.btnTextWhite}>停止</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

function CfgRow({ label, value, colors, last }) {
  return (
    <View style={[cfgStyles.row, !last && { borderBottomWidth: 1, borderBottomColor: colors.divider }]}>
      <Text style={[cfgStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[cfgStyles.value, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

const cfgStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16 },
  label: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: '500' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 44 },
  navCenter: { flex: 1, alignItems: 'center', marginHorizontal: 16 },
  navTitle: { fontSize: 16, fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 12 },

  tabRow: { flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1, height: 40 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabItemActive: { borderBottomWidth: 2 },
  tabText: { fontSize: 14, fontWeight: '500' },

  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  contentList: { padding: 20, gap: 12 },

  dayHeader: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  emptyWrap: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },

  // Shared card
  card: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 10 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTime: { fontSize: 15, fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 13, fontWeight: '700' },
  cardConf: { fontSize: 14, fontWeight: '600' },
  cardSummary: { fontSize: 13, lineHeight: 20 },
  tradeLine: { fontSize: 13, fontWeight: '500' },
  tradePrice: { fontSize: 12 },

  configCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },

  // Banners
  errorBanner: { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#FEECEB' },
  errorText: { fontSize: 12, color: '#F54A45' },
  runBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 8 },
  runBannerText: { fontSize: 12, fontWeight: '500' },

  // Bottom actions
  bottomBar: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  startBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 48, borderRadius: 14, gap: 8, backgroundColor: '#4E6EF2',
  },
  pauseBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 48, borderRadius: 14, gap: 8,
  },
  stopBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 48, borderRadius: 14, gap: 8, backgroundColor: '#F54A45',
  },
  btnTextWhite: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});
