import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import {
  ChevronLeft,
  Settings,
  MessageCircle,
  Play,
} from 'lucide-react-native';
import { colors } from '../theme';
import { getTeamChat } from '../api';
import { getIcon } from '../components/IconMap';

export default function TeamDetailScreen({ navigation, route }) {
  const { id, name, agentCount, icon, iconBg } = route?.params || {};
  const [agents, setAgents] = useState([]);
  const [messageCount, setMessageCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getTeamChat(id);
        setAgents(data.agents || []);
        setMessageCount(data.messages?.length || 0);
      } catch (e) {
        console.error('Failed to fetch team data:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const TeamIcon = getIcon(icon);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Nav */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>团队详情</Text>
        <TouchableOpacity>
          <Settings size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Team Header */}
          <View style={styles.headerSection}>
            <View style={[styles.teamAvatar, { backgroundColor: iconBg || colors.primary }]}>
              <TeamIcon size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.teamName}>{name}</Text>
            <Text style={styles.teamMeta}>
              {agents.length} 位 Agent · {messageCount} 条消息
            </Text>

            {/* Enter Chat Button */}
            <TouchableOpacity
              style={styles.enterChatBtn}
              onPress={() =>
                navigation.navigate('TeamChat', {
                  id,
                  name,
                  agentCount: agents.length,
                })
              }
            >
              <MessageCircle size={18} color="#FFFFFF" />
              <Text style={styles.enterChatText}>进入讨论</Text>
            </TouchableOpacity>
          </View>

          {/* Agent Members */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>成员 Agent</Text>
          </View>

          <View style={styles.agentList}>
            {agents.map((agent) => {
              const AgentIcon = getIcon(agent.icon);
              return (
                <View key={agent.id} style={styles.agentCard}>
                  <View
                    style={[
                      styles.agentAvatar,
                      { backgroundColor: agent.color },
                    ]}
                  >
                    <AgentIcon size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.agentInfo}>
                    <Text style={styles.agentName}>{agent.name}</Text>
                    <Text style={styles.agentRole} numberOfLines={1}>
                      {getRoleDescription(agent.id)}
                    </Text>
                  </View>
                  <View style={styles.aiBadge}>
                    <Text style={styles.aiBadgeText}>AI</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Quick Actions */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>快捷操作</Text>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() =>
                navigation.navigate('TeamChat', {
                  id,
                  name,
                  agentCount: agents.length,
                })
              }
            >
              <Play size={20} color={colors.primary} />
              <Text style={styles.actionTitle}>发起分析</Text>
              <Text style={styles.actionDesc}>向所有 Agent 提问并获得共识</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

/**
 * Brief role description for each agent, shown in the member list.
 */
function getRoleDescription(agentId) {
  const roles = {
    'agent-fundamental': '基本面分析 · TVL、机构资金',
    'agent-technical': '技术面分析 · K线、RSI、MACD',
    'agent-sentiment': '情绪面分析 · 恐慌指数、资金费率',
    'agent-macro': '宏观分析 · 利率、CPI、政策',
    'risk-officer': '风控把关 · 仓位、杠杆、止损',
    'quant-strategy': '量化信号 · 概率模型、综合评分',
    'arb-hunter': '套利监控 · 跨所价差、资金费率',
    'onchain-analyst': '链上分析 · 鲸鱼、TVL、gas',
    'risk-monitor': '风控监控 · 交易前检查',
    'backtest-engine': '回测引擎 · 夏普比率、回撤',
    'factor-analyst': '因子分析 · 因子贡献、权重',
    'exec-optimizer': '执行优化 · 滑点、订单策略',
    'risk-assessor': '风险评估 · VaR、压力测试',
  };
  return roles[agentId] || 'AI 分析师';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 44,
  },
  navTitle: { fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },

  // ── Header ──
  headerSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 12,
  },
  teamAvatar: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamName: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  teamMeta: { fontSize: 14, color: colors.textSecondary, marginTop: -4 },
  enterChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    marginTop: 4,
  },
  enterChatText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },

  // ── Section ──
  sectionHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },

  // ── Agent List ──
  agentList: { paddingHorizontal: 20, gap: 10 },
  agentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 12,
  },
  agentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentInfo: { flex: 1, gap: 2 },
  agentName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  agentRole: { fontSize: 12, color: colors.textSecondary },
  aiBadge: {
    backgroundColor: colors.primary + '18',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  aiBadgeText: { fontSize: 11, fontWeight: '600', color: colors.primary },

  // ── Quick Actions ──
  quickActions: { paddingHorizontal: 20, gap: 10 },
  actionCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 6,
  },
  actionTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginTop: 4 },
  actionDesc: { fontSize: 13, color: colors.textSecondary },
});
