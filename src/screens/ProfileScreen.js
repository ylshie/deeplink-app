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
  Settings,
  User,
  Key,
  Bell,
  Languages,
  LogOut,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react-native';
import { useTheme } from '../theme';
import { API_BASE_URL } from '../api/config';

export default function ProfileScreen({ navigation }) {
  const { colors, isDark, mode, setMode } = useTheme();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/trading/portfolio`);
        if (res.ok) {
          setPortfolio(await res.json());
        }
      } catch (e) {
        // Fallback mock
        setPortfolio({
          balance: 10000,
          totalPnl: 0,
          totalPnlPct: 0,
          positionCount: 0,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingWrap, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  const pnlColor = (portfolio?.totalPnl || 0) >= 0 ? '#34C759' : '#F54A45';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>我的</Text>
          <TouchableOpacity>
            <Settings size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <TouchableOpacity style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>E</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>Eric</Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>eric@deeplink.ai</Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Portfolio Card */}
        <View style={[styles.portfolioCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.portfolioLabel, { color: colors.textSecondary }]}>模拟交易账户</Text>
          <Text style={[styles.portfolioBalance, { color: colors.textPrimary }]}>
            ${(portfolio?.balance || 10000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <View style={styles.portfolioStats}>
            <View style={styles.portfolioStat}>
              <Text style={[styles.statValue, { color: pnlColor }]}>
                {(portfolio?.totalPnl || 0) >= 0 ? '+' : ''}${Math.abs(portfolio?.totalPnl || 0).toFixed(2)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>总盈亏</Text>
            </View>
            <View style={styles.portfolioStat}>
              <Text style={[styles.statValue, { color: pnlColor }]}>
                {(portfolio?.totalPnlPct || 0) >= 0 ? '+' : ''}{(portfolio?.totalPnlPct || 0).toFixed(2)}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>收益率</Text>
            </View>
            <View style={styles.portfolioStat}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {portfolio?.positionCount || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>持仓数</Text>
            </View>
          </View>
        </View>

        {/* Menu Section */}
        <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <MenuItem icon={Key} label="API 密钥管理" colors={colors} onPress={() => navigation.navigate('ApiKeys')} />
          <View style={[styles.menuDivider, { backgroundColor: colors.divider }]} />
          <MenuItem icon={Bell} label="通知设置" colors={colors} onPress={() => navigation.navigate('Notifications')} />
          <View style={[styles.menuDivider, { backgroundColor: colors.divider }]} />
          <MenuItem icon={Languages} label="语言" value="中文" colors={colors} onPress={() => navigation.navigate('Language')} />
          <View style={[styles.menuDivider, { backgroundColor: colors.divider }]} />

          {/* Theme Switcher inline */}
          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              {isDark ? <Moon size={20} color={colors.primary} /> : <Sun size={20} color={colors.primary} />}
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>外观模式</Text>
            </View>
            <View style={styles.themeToggle}>
              {[
                { key: 'system', Icon: Monitor },
                { key: 'light', Icon: Sun },
                { key: 'dark', Icon: Moon },
              ].map(({ key, Icon }) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.themeBtn,
                    { backgroundColor: mode === key ? colors.primary + '18' : 'transparent' },
                  ]}
                  onPress={() => setMode(key)}
                >
                  <Icon size={16} color={mode === key ? colors.primary : colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.menuDivider, { backgroundColor: colors.divider }]} />
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <LogOut size={20} color="#F54A45" />
              <Text style={[styles.menuLabel, { color: '#F54A45' }]}>退出登录</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function MenuItem({ icon: Icon, label, value, colors, onPress }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Icon size={20} color={colors.primary} />
        <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{label}</Text>
      </View>
      <View style={styles.menuRight}>
        {value && <Text style={[styles.menuValue, { color: colors.textSecondary }]}>{value}</Text>}
        <ChevronRight size={18} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingWrap: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 20 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 50,
  },
  headerTitle: { fontSize: 28, fontWeight: '700' },

  // Profile card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#4E6EF2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 18, fontWeight: '600' },
  profileEmail: { fontSize: 14 },

  // Portfolio card
  portfolioCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
  },
  portfolioLabel: { fontSize: 12, fontWeight: '500', letterSpacing: 1 },
  portfolioBalance: { fontSize: 32, fontWeight: '700' },
  portfolioStats: { flexDirection: 'row', gap: 20 },
  portfolioStat: { gap: 4 },
  statValue: { fontSize: 16, fontWeight: '600' },
  statLabel: { fontSize: 12 },

  // Menu section
  menuSection: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuLabel: { fontSize: 15, fontWeight: '500' },
  menuValue: { fontSize: 14 },
  menuDivider: { height: 1, marginHorizontal: 18 },

  // Theme toggle
  themeToggle: { flexDirection: 'row', gap: 4 },
  themeBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
