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
  TrendingUp,
  RotateCcw,
} from 'lucide-react-native';
import { useTheme } from '../theme';
import { getTaskRuns } from '../api';
import { API_BASE_URL } from '../api/config';

const tabs = ['历史', '交易', '配置'];

const tradeIconMap = {
  'trending-up': TrendingUp,
  'rotate-ccw': RotateCcw,
};

export default function TaskDetailScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { id, name } = route?.params || {};
  const displayName = name || 'BTC 15min Debate';
  const [activeTab, setActiveTab] = useState('历史');
  const [runs, setRuns] = useState([]);
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const [error, setError] = useState(null);
  const autoRunRef = React.useRef(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [runsData, sigRes] = await Promise.all([
          getTaskRuns(id),
          fetch(`${API_BASE_URL}/trading/signals/${id}`).then(r => r.ok ? r.json() : []).catch(() => []),
        ]);
        setRuns(runsData);
        setSignals(sigRes);
      } catch (e) {
        console.error('Failed to fetch task data:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    // Cleanup auto-run on unmount
    return () => {
      if (autoRunRef.current) clearInterval(autoRunRef.current);
    };
  }, [id]);

  const runOnce = async () => {
    const taskTeamMap = { 'task-1': 'team-btc', 'task-2': 'team-eth-arb', 'task-3': 'team-quant' };
    const teamId = taskTeamMap[id] || 'team-btc';

    const res = await fetch(`${API_BASE_URL}/trading/ai-execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, autoExecute: true, quoteAmount: 500 }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Server ${res.status}: ${text.slice(0, 100)}`);
    }

    const result = await res.json();
    if (result.debate) {
      const newSignal = {
        id: result.debate.id || `sig-${Date.now()}`,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        action: result.debate.action,
        confidence: result.debate.confidence,
        summary: result.debate.summary,
        trade: result.trade?.message || result.debate.trade,
        tradePrice: result.debate.tradePrice,
      };
      setSignals(prev => [newSignal, ...prev]);
      setActiveTab('交易');
    }
    return result;
  };

  // Single test run
  const handleTestRun = async () => {
    setExecuting(true);
    setError(null);
    try {
      await runOnce();
    } catch (e) {
      console.error('Test run failed:', e);
      setError(e.message);
    } finally {
      setExecuting(false);
    }
  };

  // Toggle auto-run (periodic execution like MyAlice scalper)
  const handleToggleAutoRun = () => {
    if (autoRunning) {
      // Stop
      if (autoRunRef.current) clearInterval(autoRunRef.current);
      autoRunRef.current = null;
      setAutoRunning(false);
    } else {
      // Start: run immediately, then every 15 minutes
      setAutoRunning(true);
      setError(null);
      handleTestRun(); // first run immediately

      const INTERVAL = 15 * 60 * 1000; // 15 min
      autoRunRef.current = setInterval(async () => {
        setExecuting(true);
        try {
          await runOnce();
        } catch (e) {
          console.error('Auto run failed:', e);
          setError(e.message);
        } finally {
          setExecuting(false);
        }
      }, INTERVAL);
    }
  };

  const getBadgeStyle = (action) => {
    if (['BUY', 'EXECUTE', 'DEPLOY'].includes(action)) return { bg: '#E8F8EE', text: '#34C759' };
    if (['SELL'].includes(action)) return { bg: '#FEECEB', text: '#F54A45' };
    return { bg: colors.divider, text: colors.textSecondary };
  };

  const renderHistoryTab = () => (
    <>
      <Text style={[styles.dayHeader, { color: colors.textSecondary }]}>Today</Text>
      {runs.map((run) => {
        const TradeIcon = run.tradeIcon ? tradeIconMap[run.tradeIcon] : null;
        return (
          <View key={run.id} style={[styles.runCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.runTop}>
              <View style={styles.runLeft}>
                <Text style={[styles.runTime, { color: colors.textPrimary }]}>{run.time}</Text>
                <View style={[styles.runBadge, { backgroundColor: run.resultBg || run.resultColor + '20' }]}>
                  <Text style={[styles.runBadgeText, { color: run.resultColor }]}>{run.result}</Text>
                </View>
              </View>
              <Text style={[styles.runDuration, { color: colors.textMuted }]}>{run.duration}</Text>
            </View>
            <Text style={[styles.runDesc, { color: colors.textSecondary }]}>{run.desc}</Text>
            {run.trade && (
              <View style={styles.runTradeRow}>
                {TradeIcon && <TradeIcon size={14} color={run.tradeColor || '#34C759'} />}
                <Text style={[styles.runTradeText, { color: run.tradeColor || '#34C759' }]}>{run.trade}</Text>
              </View>
            )}
          </View>
        );
      })}
      {runs.length === 0 && <Text style={[styles.emptyText, { color: colors.textMuted }]}>暂无运行记录</Text>}
    </>
  );

  const renderTradingTab = () => (
    <>
      {signals.map((sig) => {
        const badge = getBadgeStyle(sig.action);
        const hasExecution = sig.trade && !sig.trade.startsWith('暂无');
        return (
          <View key={sig.id} style={[styles.signalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.signalHeader}>
              <View style={styles.signalLeft}>
                <Text style={[styles.signalTime, { color: colors.textPrimary }]}>{sig.time}</Text>
                <View style={[styles.signalBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.signalBadgeText, { color: badge.text }]}>{sig.action}</Text>
                </View>
              </View>
              <Text style={[styles.signalConf, { color: badge.text }]}>{sig.confidence}%</Text>
            </View>
            <Text style={[styles.signalSummary, { color: colors.textSecondary }]}>{sig.summary}</Text>
            {hasExecution && (
              <View style={[styles.signalFooter, { borderTopColor: colors.divider }]}>
                <Text style={[styles.signalTrade, { color: badge.text }]}>{sig.trade}</Text>
                {sig.tradePrice && <Text style={[styles.signalTokens, { color: colors.textMuted }]}>{sig.tradePrice}</Text>}
              </View>
            )}
          </View>
        );
      })}
      {signals.length === 0 && (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>暂无交易信号，点击下方「测试运行」生成</Text>
      )}
    </>
  );

  const renderConfigTab = () => (
    <View style={[styles.configCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <ConfigRow label="交易对" value="BTC/USDT" colors={colors} />
      <ConfigRow label="时间框架" value="15分钟" colors={colors} />
      <ConfigRow label="单笔金额" value="500 USDT" colors={colors} />
      <ConfigRow label="止盈" value="3%" colors={colors} />
      <ConfigRow label="止损" value="2%" colors={colors} />
      <ConfigRow label="自动执行" value="开启" colors={colors} />
      <ConfigRow label="最大持仓" value="1" colors={colors} last />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Nav Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.navCenter}>
          <Text style={[styles.navTitle, { color: colors.textPrimary }]} numberOfLines={1}>{displayName}</Text>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>运行中 · 15m</Text>
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
          {activeTab === '历史' && renderHistoryTab()}
          {activeTab === '交易' && renderTradingTab()}
          {activeTab === '配置' && renderConfigTab()}
        </ScrollView>
      )}

      {/* Error banner */}
      {error && (
        <View style={[styles.errorBanner, { backgroundColor: '#FEECEB' }]}>
          <Text style={styles.errorText} numberOfLines={2}>错误: {error}</Text>
        </View>
      )}

      {/* Auto-run status */}
      {autoRunning && (
        <View style={[styles.autoRunBanner, { backgroundColor: colors.primary + '12' }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.autoRunText, { color: colors.primary }]}>
            自动运行中 · 每 15 分钟执行一次 · {signals.length} 条信号
          </Text>
        </View>
      )}

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        {!autoRunning ? (
          <>
            <TouchableOpacity
              style={[styles.testRunBtn, executing && { opacity: 0.6 }]}
              onPress={handleTestRun}
              disabled={executing}
              activeOpacity={0.8}
            >
              {executing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
              )}
              <Text style={styles.testRunText}>{executing ? '分析中...' : '测试运行'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.autoBtn, { borderColor: colors.primary }]}
              onPress={handleToggleAutoRun}
              activeOpacity={0.8}
            >
              <Play size={16} color={colors.primary} fill={colors.primary} />
              <Text style={[styles.autoBtnText, { color: colors.primary }]}>自动</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.stopBtn]}
            onPress={handleToggleAutoRun}
            activeOpacity={0.8}
          >
            <Pause size={18} color="#FFFFFF" />
            <Text style={styles.testRunText}>停止自动运行</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function ConfigRow({ label, value, colors, last }) {
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
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 12 },

  tabRow: { flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1, height: 40 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabItemActive: { borderBottomWidth: 2 },
  tabText: { fontSize: 14, fontWeight: '500' },

  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  contentList: { padding: 20, gap: 12 },
  emptyText: { textAlign: 'center', fontSize: 14, paddingTop: 40 },

  dayHeader: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  runCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 10 },
  runTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  runLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  runTime: { fontSize: 14, fontWeight: '600' },
  runBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  runBadgeText: { fontSize: 12, fontWeight: '600' },
  runDuration: { fontSize: 12 },
  runDesc: { fontSize: 13, lineHeight: 18 },
  runTradeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  runTradeText: { fontSize: 12, fontWeight: '500' },

  signalCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  signalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingBottom: 0 },
  signalLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  signalTime: { fontSize: 15, fontWeight: '600' },
  signalBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  signalBadgeText: { fontSize: 13, fontWeight: '700' },
  signalConf: { fontSize: 14, fontWeight: '600' },
  signalSummary: { fontSize: 13, lineHeight: 20, paddingHorizontal: 16, paddingVertical: 12 },
  signalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1 },
  signalTrade: { fontSize: 12, fontWeight: '500' },
  signalTokens: { fontSize: 11 },

  configCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },

  bottomBar: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  testRunBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 14, gap: 8, backgroundColor: '#4E6EF2' },
  testRunText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  autoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 48, borderRadius: 14, borderWidth: 1.5, gap: 6, paddingHorizontal: 18,
  },
  autoBtnText: { fontSize: 14, fontWeight: '600' },
  stopBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 48, borderRadius: 14, gap: 8, backgroundColor: '#F54A45',
  },
  errorBanner: { paddingHorizontal: 20, paddingVertical: 8 },
  errorText: { fontSize: 12, color: '#F54A45' },
  autoRunBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 8,
  },
  autoRunText: { fontSize: 12, fontWeight: '500' },
});
