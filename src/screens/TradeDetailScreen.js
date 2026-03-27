import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { ChevronLeft, Share2, Brain, TrendingUp, Activity, Shield, BarChart3 } from 'lucide-react-native';
import { useTheme } from '../theme';
import { formatDateTime } from '../utils/formatTime';

const agentIcons = {
  '基本面分析': { icon: Brain, color: '#5856D6' },
  '技术面分析': { icon: TrendingUp, color: '#FF3B30' },
  '情绪面分析': { icon: Activity, color: '#FF9500' },
  '风控官': { icon: Shield, color: '#007AFF' },
  '量化策略': { icon: BarChart3, color: '#34C759' },
};

export default function TradeDetailScreen({ navigation, route }) {
  const { colors } = useTheme();
  const trade = route?.params?.trade || {};
  const votes = trade.votes || [];
  const badge = getBadge(trade.action);
  const isBuy = ['BUY', 'EXECUTE', 'DEPLOY'].includes(trade.action);
  const price = trade.entryPrice || 0;
  const qty = trade.quantity || 0;
  const amount = trade.quoteAmount || 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#4E6EF2" />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: '#1F2329' }]}>交易详情</Text>
        <TouchableOpacity>
          <Share2 size={22} color="#646A73" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewTop}>
            <View style={styles.overviewLeft}>
              <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.badgeText, { color: badge.color }]}>{trade.action || 'BUY'}</Text>
              </View>
              <View style={styles.overviewMid}>
                <Text style={styles.overviewPair}>{trade.pair || 'BTC/USDT'}</Text>
                <Text style={styles.overviewTime}>{formatDateTime(trade.timestamp)} · 实盘交易</Text>
              </View>
            </View>
            <View style={styles.confBadge}>
              <Text style={styles.confValue}>{trade.confidence || 0}%</Text>
              <Text style={styles.confLabel}>置信度</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.pnlRow}>
            <View style={styles.pnlItem}>
              <Text style={[styles.pnlValue, { color: badge.color }]}>${amount.toFixed(2)}</Text>
              <Text style={styles.pnlLabel}>交易额</Text>
            </View>
            <View style={styles.pnlItem}>
              <Text style={styles.pnlValueDark}>{qty > 0 ? qty.toFixed(8) : '—'}</Text>
              <Text style={styles.pnlLabel}>数量</Text>
            </View>
            <View style={styles.pnlItem}>
              <Text style={styles.pnlValueDark}>${price > 0 ? price.toLocaleString() : '—'}</Text>
              <Text style={styles.pnlLabel}>成交价</Text>
            </View>
          </View>
        </View>

        {/* 订单信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>订单信息</Text>
          <View style={styles.infoCard}>
            <InfoRow label="交易方向" value={isBuy ? '买入' : '卖出'} />
            <InfoRow label="交易对" value={trade.pair || 'BTC/USDT'} />
            <InfoRow label="成交价格" value={price > 0 ? `$${price.toLocaleString()}` : '—'} />
            <InfoRow label="成交数量" value={qty > 0 ? `${qty.toFixed(8)}` : '—'} />
            <InfoRow label="交易金额" value={`${amount} USDT`} />
            <InfoRow label="置信度" value={`${trade.confidence || 0}%`} last />
          </View>
        </View>

        {/* Agent 投票明细 */}
        {votes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Agent 投票明细</Text>
            <View style={styles.infoCard}>
              {votes.map((v, i) => {
                const agentInfo = agentIcons[v.agent] || { icon: Brain, color: '#5856D6' };
                const AgentIcon = agentInfo.icon;
                const voteColor = v.vote === '看多' ? '#34C759' : v.vote === '看空' ? '#F54A45' : '#646A73';
                return (
                  <View key={v.agent + i}>
                    <View style={styles.voteRow}>
                      <View style={[styles.voteAvatar, { backgroundColor: agentInfo.color }]}>
                        <AgentIcon size={14} color="#FFF" />
                      </View>
                      <Text style={styles.voteName}>{v.agent}</Text>
                      <View style={styles.voteSpacer} />
                      <Text style={[styles.voteResult, { color: voteColor }]}>{v.vote}</Text>
                    </View>
                    {i < votes.length - 1 && <View style={styles.divider} />}
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function getBadge(action) {
  if (['BUY', 'EXECUTE'].includes(action)) return { bg: '#E8F8EE', color: '#34C759' };
  if (['SELL'].includes(action)) return { bg: '#FEECEB', color: '#F54A45' };
  return { bg: '#ECEEF4', color: '#646A73' };
}

function InfoRow({ label, value, last }) {
  return (
    <>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
      {!last && <View style={styles.divider} />}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, height: 44, gap: 12,
  },
  navTitle: { fontSize: 16, fontWeight: '600', flex: 1, textAlign: 'center' },
  content: { padding: 20, paddingTop: 16, gap: 20, paddingBottom: 40 },

  // Overview
  overviewCard: {
    backgroundColor: '#F5F7FA', borderRadius: 20, padding: 20, gap: 16,
    borderWidth: 1, borderColor: '#E5E8ED',
  },
  overviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  overviewLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  badgeText: { fontSize: 13, fontWeight: '700' },
  overviewMid: { gap: 2 },
  overviewPair: { fontSize: 16, fontWeight: '600', color: '#1F2329' },
  overviewTime: { fontSize: 12, color: '#8F959E' },
  confBadge: { alignItems: 'center', gap: 2 },
  confValue: { fontSize: 20, fontWeight: '700', color: '#34C759' },
  confLabel: { fontSize: 11, color: '#8F959E' },
  pnlRow: { flexDirection: 'row', justifyContent: 'space-around' },
  pnlItem: { alignItems: 'center', gap: 4 },
  pnlValue: { fontSize: 16, fontWeight: '600' },
  pnlValueDark: { fontSize: 16, fontWeight: '600', color: '#1F2329' },
  pnlLabel: { fontSize: 11, color: '#8F959E' },

  // Sections
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1F2329' },
  infoCard: {
    backgroundColor: '#F5F7FA', borderRadius: 16, borderWidth: 1, borderColor: '#E5E8ED',
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  infoLabel: { fontSize: 14, color: '#646A73' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1F2329' },
  divider: { height: 1, backgroundColor: '#E5E8ED' },

  // Votes
  voteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  voteAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  voteName: { fontSize: 14, fontWeight: '500', color: '#1F2329' },
  voteSpacer: { flex: 1 },
  voteResult: { fontSize: 14, fontWeight: '600' },
});
