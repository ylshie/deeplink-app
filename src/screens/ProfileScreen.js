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
  Settings,
  User,
  Eye,
  Pencil,
  Trash2,
  Plus,
  Wallet,
  History,
  BarChart3,
} from 'lucide-react-native';
import { colors } from '../theme';
import { getProfile, getApiKeys, getPortfolio } from '../api';
import { getIcon } from '../components/IconMap';

const segments = ['API密钥', '模板交易', '设置', '关于'];

export default function ProfileScreen() {
  const [activeSegment, setActiveSegment] = useState('设置');
  const [profile, setProfile] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [p, keys, port] = await Promise.all([
          getProfile(),
          getApiKeys(),
          getPortfolio(),
        ]);
        setProfile(p);
        setApiKeys(keys);
        setPortfolio(port);
      } catch (e) {
        console.error('Failed to fetch profile:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (loading || !profile) {
    return (
      <View style={[styles.container, styles.loadingWrap]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  const stats = [
    { value: profile.stats.totalBalance, label: '模拟总额' },
    { value: String(profile.stats.positions), label: '持仓数' },
    { value: profile.stats.pnl, label: '累计盈亏', color: profile.stats.pnlColor },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Settings Icon */}
      <View style={styles.settingsRow}>
        <TouchableOpacity>
          <Settings size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarCircle}>
            <User size={36} color={colors.textMuted} />
          </View>
          <Text style={styles.nameText}>{profile.name}</Text>
          <Text style={styles.idText}>DEEPLINK号: {profile.deepLinkId}</Text>
          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editBtnText}>编辑个人资料</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {stats.map((s, i) => (
            <View key={i} style={styles.stat}>
              <Text style={[styles.statValue, s.color && { color: s.color }]}>
                {s.value}
              </Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Segment Control */}
        <View style={styles.segmentRow}>
          {segments.map((seg) => (
            <TouchableOpacity
              key={seg}
              style={[
                styles.segmentItem,
                activeSegment === seg && styles.segmentItemActive,
              ]}
              onPress={() => setActiveSegment(seg)}
            >
              <Text
                style={[
                  styles.segmentText,
                  activeSegment === seg && styles.segmentTextActive,
                ]}
              >
                {seg}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <View style={styles.cardList}>
          {/* API Key Cards */}
          {apiKeys.map((key) => {
            const KeyIcon = getIcon(key.icon);
            return (
              <View key={key.id} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardLeftSection}>
                    <View
                      style={[
                        styles.apiAvatar,
                        { backgroundColor: key.iconBg },
                      ]}
                    >
                      <KeyIcon size={22} color="#FFFFFF" />
                    </View>
                    <View style={styles.apiInfo}>
                      <View style={styles.apiTitleRow}>
                        <Text style={styles.apiName}>{key.name}</Text>
                        {key.connected && (
                          <View style={styles.connectedBadge}>
                            <Text style={styles.connectedText}>已连接</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.apiDesc}>{key.permissions}</Text>
                    </View>
                  </View>
                  {key.connected && (
                    <Text style={styles.checkMark}>✓</Text>
                  )}
                </View>
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity style={styles.cardAction}>
                    <Eye size={16} color={colors.textSecondary} />
                    <Text style={styles.cardActionText}>查看</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cardAction}>
                    <Pencil size={16} color={colors.textSecondary} />
                    <Text style={styles.cardActionText}>编辑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cardAction}>
                    <Trash2 size={16} color={colors.textSecondary} />
                    <Text style={styles.cardActionText}>删除</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {/* Portfolio Card */}
          {portfolio && (
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardLeftSection}>
                  <View
                    style={[
                      styles.apiAvatar,
                      { backgroundColor: portfolio.iconBg },
                    ]}
                  >
                    {(() => {
                      const PortIcon = getIcon(portfolio.icon);
                      return <PortIcon size={22} color="#FFFFFF" />;
                    })()}
                  </View>
                  <View style={styles.apiInfo}>
                    <Text style={styles.apiName}>{portfolio.name}</Text>
                    <Text style={styles.apiDesc}>
                      余额 {portfolio.balance} · {portfolio.positionCount} 个持仓
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.portfolioActions}>
                <TouchableOpacity style={styles.portfolioBtn}>
                  <Wallet size={14} color={colors.textSecondary} />
                  <Text style={styles.portfolioBtnText}>持仓</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.portfolioBtn}>
                  <History size={14} color={colors.textSecondary} />
                  <Text style={styles.portfolioBtnText}>历史</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.portfolioBtn}>
                  <BarChart3 size={14} color={colors.textSecondary} />
                  <Text style={styles.portfolioBtnText}>量量</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Add API Key */}
          <TouchableOpacity style={styles.addKeyBtn}>
            <Plus size={18} color={colors.textSecondary} />
            <Text style={styles.addKeyText}>添加API密钥</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    height: 32,
    justifyContent: 'center',
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 16,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  idText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: -8,
  },
  editBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  stat: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  segmentRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    height: 44,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  cardList: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  apiAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apiInfo: {
    flex: 1,
    gap: 4,
  },
  apiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  apiName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  connectedBadge: {
    backgroundColor: '#34C75920',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  connectedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#34C759',
  },
  apiDesc: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  checkMark: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  cardActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  portfolioActions: {
    flexDirection: 'row',
    gap: 16,
  },
  portfolioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.divider,
    borderRadius: 8,
  },
  portfolioBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  addKeyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 8,
  },
  addKeyText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});
