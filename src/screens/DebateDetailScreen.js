import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { ChevronLeft, Brain, TrendingUp, Activity, Shield, BarChart3 } from 'lucide-react-native';
import { useTheme } from '../theme';
import { formatTime } from '../utils/formatTime';

const agentMeta = {
  'agent-fundamental': { name: '基本面分析', icon: Brain, color: '#5856D6' },
  'agent-technical': { name: '技术面分析', icon: TrendingUp, color: '#FF3B30' },
  'agent-sentiment': { name: '情绪面分析', icon: Activity, color: '#FF9500' },
  'risk-officer': { name: '风控官', icon: Shield, color: '#007AFF' },
  'quant-strategy': { name: '量化策略', icon: BarChart3, color: '#34C759' },
  // fallback by name
  '基本面分析 Agent': { icon: Brain, color: '#5856D6' },
  '技术面分析 Agent': { icon: TrendingUp, color: '#FF3B30' },
  '情绪面分析 Agent': { icon: Activity, color: '#FF9500' },
  '风控官': { icon: Shield, color: '#007AFF' },
  '量化策略': { icon: BarChart3, color: '#34C759' },
};

function getAgentMeta(v) {
  return agentMeta[v.agentId] || agentMeta[v.agent] || { icon: Brain, color: '#5856D6' };
}

function getBadge(action) {
  if (['BUY', 'EXECUTE', 'DEPLOY'].includes(action)) return { bg: '#E8F8EE', color: '#34C759' };
  if (['SELL'].includes(action)) return { bg: '#FEECEB', color: '#F54A45' };
  return { bg: '#ECEEF4', color: '#646A73' };
}

function getVoteColor(vote) {
  if (vote === '看多') return '#34C759';
  if (vote === '看空') return '#F54A45';
  return '#646A73';
}

export default function DebateDetailScreen({ navigation, route }) {
  const { colors } = useTheme();
  const signal = route?.params?.signal || {};
  const votes = signal.votes || [];
  const badge = getBadge(signal.action);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#4E6EF2" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>分析详情</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={styles.summaryLeft}>
              <Text style={styles.summaryTime}>{formatTime(signal.timestamp)}</Text>
              <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.badgeText, { color: badge.color }]}>{signal.action}</Text>
              </View>
            </View>
            <Text style={[styles.summaryConf, { color: badge.color }]}>{signal.confidence}%</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.summaryText}>{signal.summary}</Text>
          {signal.trade && !signal.trade.includes('暂无') && (
            <>
              <View style={styles.divider} />
              <Text style={[styles.tradeText, { color: '#4E6EF2' }]}>{signal.trade}</Text>
            </>
          )}
        </View>

        {/* Agent opinions */}
        <Text style={styles.sectionTitle}>Agent 分析意见</Text>

        {votes.map((v, i) => {
          const meta = getAgentMeta(v);
          const AgentIcon = meta.icon;
          const voteColor = getVoteColor(v.vote);

          return (
            <View key={i} style={styles.opinionCard}>
              {/* Agent header */}
              <View style={styles.opinionHeader}>
                <View style={[styles.opinionAvatar, { backgroundColor: meta.color }]}>
                  <AgentIcon size={16} color="#FFF" />
                </View>
                <Text style={styles.opinionName}>{v.agent}</Text>
                <View style={styles.opinionSpacer} />
                <View style={[styles.voteBadge, { backgroundColor: voteColor + '18' }]}>
                  <Text style={[styles.voteBadgeText, { color: voteColor }]}>{v.vote}</Text>
                </View>
              </View>
              {/* Opinion text */}
              {v.opinion && (
                <Text style={styles.opinionText}>{v.opinion}</Text>
              )}
            </View>
          );
        })}

        {votes.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>无 Agent 分析记录</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, height: 44,
  },
  navTitle: { fontSize: 16, fontWeight: '600', color: '#1F2329' },
  content: { padding: 20, paddingTop: 12, gap: 16, paddingBottom: 40 },

  // Summary
  summaryCard: {
    backgroundColor: '#F5F7FA', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#E5E8ED', gap: 12,
  },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryTime: { fontSize: 15, fontWeight: '600', color: '#1F2329' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  summaryConf: { fontSize: 16, fontWeight: '700' },
  summaryText: { fontSize: 13, lineHeight: 20, color: '#646A73' },
  tradeText: { fontSize: 13, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#E5E8ED' },

  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1F2329' },

  // Opinion card
  opinionCard: {
    backgroundColor: '#F5F7FA', borderRadius: 16, borderWidth: 1, borderColor: '#E5E8ED',
    overflow: 'hidden',
  },
  opinionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  opinionAvatar: {
    width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  opinionName: { fontSize: 14, fontWeight: '600', color: '#1F2329' },
  opinionSpacer: { flex: 1 },
  voteBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  voteBadgeText: { fontSize: 12, fontWeight: '600' },
  opinionText: {
    fontSize: 13, lineHeight: 20, color: '#646A73',
    paddingHorizontal: 16, paddingBottom: 14, paddingTop: 0,
  },

  emptyText: { fontSize: 14, textAlign: 'center', paddingTop: 40 },
});
