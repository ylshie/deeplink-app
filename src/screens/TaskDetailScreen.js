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
} from 'lucide-react-native';
import { useTheme } from '../theme';
import { API_BASE_URL } from '../api/config';

const tabs = ['历史', '交易', '配置'];

export default function TaskDetailScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { id, name } = route?.params || {};
  const displayName = name || 'BTC 15min Debate';
  const [activeTab, setActiveTab] = useState('历史');
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('stopped');
  const [error, setError] = useState(null);
  const pollRef = React.useRef(null);

  const taskTeamMap = { 'task-1': 'team-btc', 'task-2': 'team-eth-arb', 'task-3': 'team-quant' };
  const teamId = taskTeamMap[id] || 'team-btc';

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/trading/auto/status/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'running') {
            setStatus('running');
            startPolling();
          }
          if (data.signals) setSignals(data.signals);
        }
      } catch (e) { /* */ }
      setLoading(false);
    })();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [id]);

  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/trading/auto/status/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.signals) setSignals(data.signals);
        if (data.status !== 'running') {
          setStatus(data.status);
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch { /* */ }
    }, 10000);
  };

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

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
    } catch (e) { setError(e.message); }
  };

  const handlePause = async () => {
    setError(null);
    try {
      await fetch(`${API_BASE_URL}/trading/auto/stop`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: id }),
      });
      setStatus('stopped');
      stopPolling();
    } catch (e) { setError(e.message); }
  };

  // ── Badge colors matching design ──
  const getBadge = (action) => {
    if (['BUY', 'EXECUTE', 'DEPLOY'].includes(action))
      return { bg: '#E8F8EE', color: '#34C759' };
    if (['SELL'].includes(action))
      return { bg: '#FEECEB', color: '#F54A45' };
    return { bg: '#ECEEF4', color: '#646A73' }; // HOLD
  };

  // Is this signal an actual trade execution?
  const isTradeExecution = (sig) =>
    sig.trade &&
    (sig.trade.includes('买入') || sig.trade.includes('卖出') ||
     sig.trade.includes('BUY') || sig.trade.includes('SELL'));

  // ── Signal Card (matches design exactly) ──
  const SignalCard = ({ sig, showFooter }) => {
    const badge = getBadge(sig.action);
    const hasFooter = showFooter && isTradeExecution(sig);

    return (
      <View style={[styles.signalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {/* Header: time + badge + confidence */}
        <View style={styles.signalHead}>
          <View style={styles.signalLeft}>
            <Text style={[styles.signalTime, { color: colors.textPrimary }]}>{sig.time}</Text>
            <View style={[styles.signalBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.signalBadgeText, { color: badge.color }]}>{sig.action}</Text>
            </View>
          </View>
          <Text style={[styles.signalConf, { color: badge.color }]}>{sig.confidence}%</Text>
        </View>

        {/* Body: summary */}
        <View style={styles.signalBody}>
          <Text style={[styles.signalSummary, { color: '#646A73' }]}>{sig.summary}</Text>
        </View>

        {/* Footer: trade execution (only when applicable) */}
        {hasFooter && (
          <View style={[styles.signalFooter, { borderTopColor: colors.cardBorder }]}>
            <Text style={[styles.signalTrade, { color: badge.color }]}>{sig.trade}</Text>
            {sig.tradePrice && (
              <Text style={[styles.signalTokens, { color: '#8F959E' }]}>{sig.tradePrice}</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  // ── Tab content ──

  const renderHistory = () => (
    <>
      {signals.map((sig) => (
        <SignalCard key={sig.id} sig={sig} showFooter={true} />
      ))}
      {signals.length === 0 && (
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            {status === 'stopped' ? '点击下方「测试运行」开始 AI 分析' : '等待第一次分析结果...'}
          </Text>
        </View>
      )}
    </>
  );

  const renderTrades = () => {
    const executed = signals.filter(isTradeExecution);
    return (
      <>
        {executed.map((sig) => (
          <SignalCard key={sig.id + '-t'} sig={sig} showFooter={true} />
        ))}
        {executed.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {status === 'stopped' ? '尚未执行任何交易' : '等待交易信号 (confidence ≥ 70%)...'}
            </Text>
          </View>
        )}
      </>
    );
  };

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

  const statusColor = status === 'running' ? '#34C759' : colors.textMuted;
  const statusText = status === 'running' ? '运行中 · 15m' : '已暂停';
  const executedCount = signals.filter(isTradeExecution).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Nav */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.navCenter}>
          <Text style={[styles.navTitle, { color: colors.textPrimary }]} numberOfLines={1}>{displayName}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusLbl, { color: colors.textSecondary }]}>{statusText}</Text>
          </View>
        </View>
        <TouchableOpacity><Pencil size={20} color={colors.textSecondary} /></TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { borderBottomColor: colors.cardBorder }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && [styles.tabActive, { borderBottomColor: colors.primary }]]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: '#646A73' }, activeTab === tab && { color: colors.primary, fontWeight: '600' }]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingWrap}><ActivityIndicator size="small" color={colors.primary} /></View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === '历史' && renderHistory()}
          {activeTab === '交易' && renderTrades()}
          {activeTab === '配置' && renderConfig()}
        </ScrollView>
      )}

      {/* Error */}
      {error && (
        <View style={styles.errorBar}><Text style={styles.errorText}>错误: {error}</Text></View>
      )}

      {/* Running banner */}
      {status === 'running' && (
        <View style={[styles.runBanner, { backgroundColor: colors.primary + '12' }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.runBannerText, { color: colors.primary }]}>
            自动运行中 · {signals.length} 次分析 · {executedCount} 笔交易
          </Text>
        </View>
      )}

      {/* Bottom */}
      <View style={styles.bottomBar}>
        {status !== 'running' ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleStart} activeOpacity={0.8}>
            <Play size={18} color="#FFF" fill="#FFF" />
            <Text style={styles.btnWhite}>测试运行</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.pauseBtn} onPress={handlePause} activeOpacity={0.8}>
            <Pause size={18} color="#FFF" />
            <Text style={styles.btnWhite}>暂停</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function CfgRow({ label, value, colors, last }) {
  return (
    <View style={[cfgS.row, !last && { borderBottomWidth: 1, borderBottomColor: colors.divider }]}>
      <Text style={[cfgS.label, { color: '#646A73' }]}>{label}</Text>
      <Text style={[cfgS.value, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

const cfgS = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16 },
  label: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: '500' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Nav
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 44 },
  navCenter: { flex: 1, alignItems: 'center', marginHorizontal: 16 },
  navTitle: { fontSize: 16, fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLbl: { fontSize: 12 },

  // Tabs
  tabRow: { flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1, height: 40 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabActive: { borderBottomWidth: 2 },
  tabText: { fontSize: 14, fontWeight: '500' },

  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingTop: 16, gap: 12 },
  emptyWrap: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },

  // Signal card — matches design: rounded 16, bg #F5F7FA, border #E5E8ED
  signalCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },

  // Header row: [time + badge] ... [confidence%]
  signalHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 0,
  },
  signalLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  signalTime: { fontSize: 15, fontWeight: '600' },
  signalBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  signalBadgeText: { fontSize: 12, fontWeight: '700' },
  signalConf: { fontSize: 14, fontWeight: '600' },

  // Body: summary text
  signalBody: { paddingHorizontal: 16, paddingTop: 0, paddingBottom: 14 },
  signalSummary: { fontSize: 13, lineHeight: 20, marginTop: 10 },

  // Footer: trade execution + tokens, top border
  signalFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1,
  },
  signalTrade: { fontSize: 12, fontWeight: '500' },
  signalTokens: { fontSize: 11 },

  configCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },

  // Banners
  errorBar: { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#FEECEB' },
  errorText: { fontSize: 12, color: '#F54A45' },
  runBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 8 },
  runBannerText: { fontSize: 12, fontWeight: '500' },

  // Bottom actions
  bottomBar: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  primaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 48, borderRadius: 14, gap: 8, backgroundColor: '#4E6EF2',
  },
  pauseBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 48, borderRadius: 14, gap: 8, backgroundColor: '#FF9500',
  },
  btnWhite: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});
