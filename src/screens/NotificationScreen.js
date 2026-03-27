import React, { useState } from 'react';
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

const SETTINGS = [
  { key: 'tradeExec', label: '交易执行通知', desc: '买入/卖出执行后推送', default: true },
  { key: 'signal', label: '分析信号通知', desc: '每次 AI 分析完成后推送', default: true },
  { key: 'risk', label: '风控预警', desc: '触发止损或异常时推送', default: true },
  { key: 'priceAlert', label: '价格提醒', desc: '到达设定价格时推送', default: false },
  { key: 'dailyReport', label: '每日报告', desc: '每日 22:00 推送交易总结', default: false },
];

export default function NotificationScreen({ navigation }) {
  const { colors } = useTheme();
  const [settings, setSettings] = useState(
    Object.fromEntries(SETTINGS.map(s => [s.key, s.default]))
  );

  const toggle = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.textPrimary }]}>通知设置</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {SETTINGS.map((s, i) => (
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
