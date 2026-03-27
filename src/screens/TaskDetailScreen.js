import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
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
  const [config, setConfig] = useState({
    pair: 'BTC/USDT',
    timeframe: '15分钟',
    quoteAmount: '500',
    intervalMin: '15',
    confidenceThreshold: '70',
    maxPositions: '1',
  });
  const [configEditing, setConfigEditing] = useState(false);
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
        body: JSON.stringify({
          taskId: id,
          teamId,
          autoExecute: true,
          quoteAmount: parseInt(config.quoteAmount) || 500,
          intervalMs: (parseInt(config.intervalMin) || 15) * 60 * 1000,
        }),
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      setStatus('running');
      setConfigEditing(false);
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

  // ── Badge + trade colors matching design exactly ──
  const getBadge = (action) => {
    if (['BUY', 'EXECUTE', 'DEPLOY'].includes(action))
      return { bg: '#E8F8EE', color: '#34C759', tradeColor: '#4E6EF2' };  // badge green, trade blue
    if (['SELL'].includes(action))
      return { bg: '#FEECEB', color: '#F54A45', tradeColor: '#F54A45' };  // badge red, trade red
    return { bg: '#ECEEF4', color: '#646A73', tradeColor: '#646A73' };    // HOLD grey
  };

  // Is this signal an actual trade execution?
  const isTradeExecution = (sig) =>
    sig.trade &&
    (sig.trade.includes('买入') || sig.trade.includes('卖出') ||
     sig.trade.includes('BUY') || sig.trade.includes('SELL'));

  // ── Signal Card (matches DEEPLINK.pen design: H1Wjz/HK2sg/rWJTQ) ──
  const SignalCard = ({ sig, showFooter }) => {
    const badge = getBadge(sig.action);
    const hasFooter = showFooter && isTradeExecution(sig);

    return (
      <View style={[styles.signalCard, { backgroundColor: '#F5F7FA', borderColor: '#E5E8ED' }]}>
        {/* Header: [time + badge] ... [confidence%] — padding [14,16] */}
        <View style={styles.signalHead}>
          <View style={styles.signalLeft}>
            <Text style={[styles.signalTime, { color: '#1F2329' }]}>{sig.time}</Text>
            <View style={[styles.signalBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.signalBadgeText, { color: badge.color }]}>{sig.action}</Text>
            </View>
          </View>
          <Text style={[styles.signalConf, { color: badge.color }]}>{sig.confidence}%</Text>
        </View>

        {/* Body: summary — padding [0,16,14,16], color #646A73, fontSize 13, lineHeight 1.5 */}
        <View style={styles.signalBody}>
          <Text style={styles.signalSummary}>{sig.summary}</Text>
        </View>

        {/* Footer: trade execution + tokens — border top #E5E8ED, padding [10,16] */}
        {hasFooter && (
          <View style={styles.signalFooter}>
            <Text style={[styles.signalTrade, { color: badge.tradeColor }]}>{sig.trade}</Text>
            {sig.tradePrice && (
              <Text style={styles.signalTokens}>{sig.tradePrice}</Text>
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
    // Calculate stats
    const totalPnl = executed.reduce((s, t) => s + (t.pnl || 0), 0);
    const wins = executed.filter(t => (t.pnl || 0) > 0).length;
    const winRate = executed.length > 0 ? ((wins / executed.length) * 100).toFixed(1) : '0.0';
    const pnlColor = totalPnl >= 0 ? '#34C759' : '#F54A45';

    return (
      <>
        {/* Summary stats card */}
        {executed.length > 0 && (
          <View style={styles.tradesSummary}>
            <View style={styles.tradesStat}>
              <Text style={[styles.tradesStatVal, { color: pnlColor }]}>
                {totalPnl >= 0 ? '+' : ''}${Math.abs(totalPnl).toFixed(2)}
              </Text>
              <Text style={styles.tradesStatLabel}>总盈亏</Text>
            </View>
            <View style={styles.tradesStat}>
              <Text style={styles.tradesStatValDark}>{winRate}%</Text>
              <Text style={styles.tradesStatLabel}>胜率</Text>
            </View>
            <View style={styles.tradesStat}>
              <Text style={styles.tradesStatValDark}>{executed.length}</Text>
              <Text style={styles.tradesStatLabel}>总交易</Text>
            </View>
          </View>
        )}

        {/* Trade rows */}
        {executed.map((sig) => {
          const badge = getBadge(sig.action);
          const sigPnl = sig.pnl || 0;
          const sigPnlPct = sig.pnlPct || 0;
          const sigPnlColor = sigPnl >= 0 ? '#34C759' : '#F54A45';
          return (
            <TouchableOpacity
              key={sig.id + '-t'}
              style={styles.tradeRow}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('TradeDetail', { trade: sig })}
            >
              <View style={[styles.tradeRowBadge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.tradeRowBadgeText, { color: badge.color }]}>{sig.action}</Text>
              </View>
              <View style={styles.tradeRowMid}>
                <Text style={styles.tradeRowPair}>{sig.pair || 'BTC/USDT'}</Text>
                <Text style={styles.tradeRowTime}>{sig.time} · 置信度 {sig.confidence}%</Text>
              </View>
              <View style={styles.tradeRowRight}>
                <Text style={[styles.tradeRowPnl, { color: sigPnlColor }]}>
                  {sigPnl >= 0 ? '+' : ''}${Math.abs(sigPnl).toFixed(2)}
                </Text>
                <Text style={[styles.tradeRowPct, { color: sigPnlColor }]}>
                  {sigPnlPct >= 0 ? '+' : ''}{sigPnlPct.toFixed(2)}%
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

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

  const updateConfig = (key, val) => setConfig(prev => ({ ...prev, [key]: val }));

  const renderConfig = () => (
    <View style={{ gap: 12 }}>
      <View style={[styles.configCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <CfgField label="交易对" value={config.pair} editing={configEditing} onChange={v => updateConfig('pair', v)} colors={colors} />
        <CfgField label="时间框架" value={config.timeframe} editing={configEditing} onChange={v => updateConfig('timeframe', v)} colors={colors} />
        <CfgField label="单笔金额 (USDT)" value={config.quoteAmount} editing={configEditing} onChange={v => updateConfig('quoteAmount', v)} colors={colors} keyboard="numeric" />
        <CfgField label="执行间隔 (分钟)" value={config.intervalMin} editing={configEditing} onChange={v => updateConfig('intervalMin', v)} colors={colors} keyboard="numeric" />
        <CfgField label="执行阈值 (confidence%)" value={config.confidenceThreshold} editing={configEditing} onChange={v => updateConfig('confidenceThreshold', v)} colors={colors} keyboard="numeric" />
        <CfgField label="最大持仓" value={config.maxPositions} editing={configEditing} onChange={v => updateConfig('maxPositions', v)} colors={colors} keyboard="numeric" last />
      </View>
      {status !== 'running' && (
        <TouchableOpacity
          style={[styles.editConfigBtn, { backgroundColor: configEditing ? colors.primary : colors.card, borderColor: colors.cardBorder }]}
          onPress={() => setConfigEditing(!configEditing)}
          activeOpacity={0.8}
        >
          <Pencil size={16} color={configEditing ? '#FFF' : colors.primary} />
          <Text style={[styles.editConfigText, { color: configEditing ? '#FFF' : colors.primary }]}>
            {configEditing ? '保存配置' : '编辑配置'}
          </Text>
        </TouchableOpacity>
      )}
      {status === 'running' && (
        <Text style={[styles.configHint, { color: colors.textMuted }]}>暂停后可修改配置</Text>
      )}
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

function CfgField({ label, value, editing, onChange, colors, keyboard, last }) {
  return (
    <View style={[cfgS.row, !last && { borderBottomWidth: 1, borderBottomColor: colors.divider }]}>
      <Text style={[cfgS.label, { color: '#646A73' }]}>{label}</Text>
      {editing ? (
        <TextInput
          style={[cfgS.input, { color: colors.textPrimary, borderColor: colors.primary + '40', backgroundColor: colors.primary + '08' }]}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboard || 'default'}
          returnKeyType="done"
        />
      ) : (
        <Text style={[cfgS.value, { color: colors.textPrimary }]}>{value}</Text>
      )}
    </View>
  );
}

const cfgS = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, minHeight: 48 },
  label: { fontSize: 14, flex: 1 },
  value: { fontSize: 14, fontWeight: '500' },
  input: { fontSize: 14, fontWeight: '500', textAlign: 'right', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, minWidth: 100 },
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

  // Signal card — exact match to DEEPLINK.pen design (H1Wjz node)
  signalCard: {
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    // bg + border colors set inline: #F5F7FA + #E5E8ED
  },
  // Header: [time + badge] ... [confidence%]
  signalHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  signalLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  signalTime: { fontSize: 15, fontWeight: '600' },
  signalBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  signalBadgeText: { fontSize: 12, fontWeight: '700' },
  signalConf: { fontSize: 14, fontWeight: '600' },
  // Body: summary
  signalBody: { paddingHorizontal: 16, paddingBottom: 14 },
  signalSummary: { fontSize: 13, lineHeight: 20, color: '#646A73' },
  // Footer: trade line + tokens
  signalFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#E5E8ED',
  },
  signalTrade: { fontSize: 12, fontWeight: '500' },
  signalTokens: { fontSize: 11, color: '#8F959E' },

  // Trades tab
  tradesSummary: {
    flexDirection: 'row', backgroundColor: '#F5F7FA', borderRadius: 16,
    borderWidth: 1, borderColor: '#E5E8ED', paddingVertical: 16,
  },
  tradesStat: { flex: 1, alignItems: 'center', gap: 4 },
  tradesStatVal: { fontSize: 18, fontWeight: '700' },
  tradesStatValDark: { fontSize: 18, fontWeight: '700', color: '#1F2329' },
  tradesStatLabel: { fontSize: 11, color: '#8F959E' },
  tradeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F5F7FA', borderRadius: 16, padding: 14, paddingHorizontal: 16,
    borderWidth: 1, borderColor: '#E5E8ED',
  },
  tradeRowBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tradeRowBadgeText: { fontSize: 11, fontWeight: '700' },
  tradeRowMid: { flex: 1, gap: 2 },
  tradeRowPair: { fontSize: 14, fontWeight: '600', color: '#1F2329' },
  tradeRowTime: { fontSize: 12, color: '#8F959E' },
  tradeRowRight: { alignItems: 'flex-end', gap: 2 },
  tradeRowPnl: { fontSize: 14, fontWeight: '600' },
  tradeRowPct: { fontSize: 12 },

  configCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  editConfigBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 44, borderRadius: 12, borderWidth: 1, gap: 8,
  },
  editConfigText: { fontSize: 14, fontWeight: '600' },
  configHint: { fontSize: 13, textAlign: 'center', paddingTop: 4 },

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
