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
  Ellipsis,
  Play,
  Pause,
  FlaskConical,
  TrendingUp,
  RotateCcw,
} from 'lucide-react-native';
import { useTheme } from '../theme';
import { getTaskRuns } from '../api';

const tabs = ['运行', '交易', '配置', '统计'];

const tradeIconMap = {
  'trending-up': TrendingUp,
  'rotate-ccw': RotateCcw,
};

export default function TaskDetailScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { id, name } = route?.params || {};
  const displayName = name || 'BTC 15min Debate';
  const [activeTab, setActiveTab] = useState('运行');
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRuns() {
      try {
        const data = await getTaskRuns(id);
        setRuns(data);
      } catch (e) {
        console.error('Failed to fetch task runs:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchRuns();
  }, [id]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Nav Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {displayName}
        </Text>
        <View style={styles.navRight}>
          <TouchableOpacity>
            <Pencil size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ellipsis size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Row */}
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
          Active · Every 15m · Next: 14:30
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.runNowBtn, { backgroundColor: colors.primary }]}>
          <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
          <Text style={styles.runNowText}>立即运行</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.outlineBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Pause size={14} color={colors.textPrimary} />
          <Text style={[styles.outlineBtnText, { color: colors.textPrimary }]}>暂停</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.outlineBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <FlaskConical size={14} color={colors.textPrimary} />
          <Text style={[styles.outlineBtnText, { color: colors.textPrimary }]}>测试</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Row */}
      <View style={[styles.tabRow, { borderBottomColor: colors.divider }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabItem,
              activeTab === tab && [styles.tabItemActive, { borderBottomColor: colors.primary }],
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.textSecondary },
                activeTab === tab && { color: colors.primary, fontWeight: '600' },
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Run List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.runList}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.dayHeader, { color: colors.textSecondary }]}>Today</Text>
          {runs.map((run) => {
            const TradeIcon = run.tradeIcon
              ? tradeIconMap[run.tradeIcon]
              : null;
            return (
              <View key={run.id} style={[styles.runCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={styles.runTop}>
                  <View style={styles.runLeft}>
                    <Text style={[styles.runTime, { color: colors.textPrimary }]}>{run.time}</Text>
                    <View
                      style={[
                        styles.runBadge,
                        {
                          backgroundColor:
                            run.resultBg || run.resultColor + '20',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.runBadgeText,
                          { color: run.resultColor },
                        ]}
                      >
                        {run.result}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.runDuration, { color: colors.textMuted }]}>{run.duration}</Text>
                </View>
                <Text style={[styles.runDesc, { color: colors.textSecondary }]}>{run.desc}</Text>
                {run.trade && (
                  <View style={styles.runTradeRow}>
                    {TradeIcon && (
                      <TradeIcon
                        size={14}
                        color={run.tradeColor || '#34C759'}
                      />
                    )}
                    <Text
                      style={[
                        styles.runTradeText,
                        { color: run.tradeColor || '#34C759' },
                      ]}
                    >
                      {run.trade}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
          <Text style={[styles.dayHeader, { color: colors.textSecondary }]}>Yesterday (12 runs) ▾</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 44,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  navRight: {
    flexDirection: 'row',
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 4,
    paddingBottom: 12,
    gap: 10,
  },
  runNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  runNowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    height: 44,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  runList: {
    padding: 20,
    paddingTop: 12,
    gap: 10,
  },
  dayHeader: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  runCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  runTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  runLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  runTime: {
    fontSize: 14,
    fontWeight: '600',
  },
  runBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  runBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  runDuration: {
    fontSize: 12,
  },
  runDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  runTradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  runTradeText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
