import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../theme';
import { useI18n } from '../i18n';
import { getSettings, updateSettings } from '../api/settings';

export default function NotificationScreen({ navigation }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [settings, setSettings] = useState({
    tradeExec: true,
    signal: true,
    risk: true,
    priceAlert: false,
    dailyReport: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const s = await getSettings();
        if (s?.notifications) setSettings(s.notifications);
      } catch { /* */ }
    })();
  }, []);

  const toggle = (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    updateSettings({ notifications: updated }).catch(() => {});
  };

  const ITEMS = [
    { key: 'tradeExec', label: t('notif_trade_exec'), desc: t('notif_trade_exec_desc') },
    { key: 'signal', label: t('notif_signal'), desc: t('notif_signal_desc') },
    { key: 'risk', label: t('notif_risk'), desc: t('notif_risk_desc') },
    { key: 'priceAlert', label: t('notif_price'), desc: t('notif_price_desc') },
    { key: 'dailyReport', label: t('notif_daily'), desc: t('notif_daily_desc') },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.textPrimary }]}>{t('notif_title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {ITEMS.map((s, i) => (
            <View key={s.key}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: colors.divider }]} />}
              <View style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{s.label}</Text>
                  <Text style={[styles.rowDesc, { color: colors.textSecondary }]}>{s.desc}</Text>
                </View>
                <Switch
                  value={settings[s.key]}
                  onValueChange={() => toggle(s.key)}
                  trackColor={{ false: colors.divider, true: colors.primary + '60' }}
                  thumbColor={settings[s.key] ? colors.primary : '#ccc'}
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 44 },
  navTitle: { fontSize: 17, fontWeight: '600' },
  content: { padding: 20, paddingBottom: 40 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  rowText: { flex: 1, marginRight: 12, gap: 4 },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  rowDesc: { fontSize: 12 },
  divider: { height: 1, marginHorizontal: 16 },
});
