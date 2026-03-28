import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { Minus, Plus, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../theme';
import { addTask } from '../api';

const TEAMS = [
  { id: 'team-btc', name: 'BTC 多维分析团队' },
  { id: 'team-eth-arb', name: 'ETH 套利监控组' },
  { id: 'team-quant', name: '量化策略研究群' },
];

const PAIRS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT', 'DOGE/USDT'];
const FREQS = ['每 5 分钟', '每 15 分钟', '每 30 分钟', '每 1 小时', '每 4 小时', '每日'];
const MODES = ['多数投票', '加权投票', '一票否决'];

function showAlert(title, msg) {
  if (Platform.OS === 'web') window.alert(msg ? `${title}: ${msg}` : title);
  else Alert.alert(title, msg);
}

export default function CreateTaskScreen({ navigation }) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('team-btc');
  const [pair, setPair] = useState('BTC/USDT');
  const [frequency, setFrequency] = useState('每 15 分钟');
  const [rounds, setRounds] = useState(3);
  const [selectedMode, setSelectedMode] = useState('多数投票');
  const [autoExecute, setAutoExecute] = useState(true);
  const [stopLoss, setStopLoss] = useState(true);
  const [stopLossPct, setStopLossPct] = useState('5');

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert('提示', '请输入任务名称');
      return;
    }
    try {
      await addTask({
        id: `task-${Date.now()}`,
        name: name.trim(),
        status: 'draft',
        statusColor: '#AAAAAA',
        group: TEAMS.find(t => t.id === selectedTeam)?.name || '',
        schedule: frequency,
        teamId: selectedTeam,
        pair,
        rounds,
        mode: selectedMode,
        autoExecute,
        stopLoss,
        stopLossPct,
      });
      navigation.goBack();
    } catch (e) {
      showAlert('错误', e.message || '创建失败');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.navAction}>取消</Text>
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: '#1F2329' }]}>创建任务</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.navAction, { fontWeight: '600' }]}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        {/* 任务名称 */}
        <View style={styles.section}>
          <Text style={styles.label}>任务名称</Text>
          <TextInput
            style={styles.input}
            placeholder="BTC 15分钟 Debate"
            placeholderTextColor="#8F959E"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* 关联团队 */}
        <View style={styles.section}>
          <Text style={styles.label}>关联团队</Text>
          <TouchableOpacity style={styles.selectRow}>
            <Text style={styles.selectValue}>{TEAMS.find(t => t.id === selectedTeam)?.name}</Text>
            <ChevronRight size={18} color="#8F959E" />
          </TouchableOpacity>
        </View>

        {/* 交易对 */}
        <View style={styles.section}>
          <Text style={styles.label}>交易对</Text>
          <View style={styles.chipWrap}>
            {PAIRS.map((p) => (
              <TouchableOpacity key={p} style={[styles.selChip, pair === p && styles.selChipActive]} onPress={() => setPair(p)}>
                <Text style={[styles.selChipText, pair === p && styles.selChipTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 执行频率 */}
        <View style={styles.section}>
          <Text style={styles.label}>执行频率</Text>
          <View style={styles.chipWrap}>
            {FREQS.map((f) => (
              <TouchableOpacity key={f} style={[styles.selChip, frequency === f && styles.selChipActive]} onPress={() => setFrequency(f)}>
                <Text style={[styles.selChipText, frequency === f && styles.selChipTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 辩论轮数 */}
        <View style={styles.section}>
          <Text style={styles.label}>辩论轮数</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => setRounds(Math.max(1, rounds - 1))}
            >
              <Minus size={18} color="#1F2329" />
            </TouchableOpacity>
            <View style={styles.counterValue}>
              <Text style={styles.counterText}>{rounds} 轮</Text>
            </View>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => setRounds(Math.min(10, rounds + 1))}
            >
              <Plus size={18} color="#1F2329" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 决策模式 */}
        <View style={styles.section}>
          <Text style={styles.label}>决策模式</Text>
          <View style={styles.chipRow}>
            {MODES.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.chip, selectedMode === m && styles.chipActive]}
                onPress={() => setSelectedMode(m)}
              >
                <Text style={[styles.chipText, selectedMode === m && styles.chipTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 自动执行交易 */}
        <View style={styles.switchRow}>
          <View style={styles.switchLeft}>
            <Text style={styles.switchLabel}>自动执行交易</Text>
            <Text style={styles.switchDesc}>达成共识后自动下单</Text>
          </View>
          <Switch
            value={autoExecute}
            onValueChange={setAutoExecute}
            trackColor={{ false: '#E5E8ED', true: '#4E6EF260' }}
            thumbColor={autoExecute ? '#4E6EF2' : '#ccc'}
          />
        </View>

        <View style={styles.divider} />

        {/* 止损保护 */}
        <View style={styles.switchRow}>
          <View style={styles.switchLeft}>
            <Text style={styles.switchLabel}>止损保护</Text>
            <Text style={styles.switchDesc}>亏损超过比例自动平仓</Text>
          </View>
          <Switch
            value={stopLoss}
            onValueChange={setStopLoss}
            trackColor={{ false: '#E5E8ED', true: '#4E6EF260' }}
            thumbColor={stopLoss ? '#4E6EF2' : '#ccc'}
          />
        </View>

        {stopLoss && (
          <View style={styles.inlineRow}>
            <Text style={styles.inlineLabel}>止损比例</Text>
            <View style={styles.inlineRight}>
              <TextInput
                style={styles.inlineInput}
                value={stopLossPct}
                onChangeText={setStopLossPct}
                keyboardType="numeric"
              />
              <Text style={styles.inlineUnit}>%</Text>
            </View>
          </View>
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
  navTitle: { fontSize: 17, fontWeight: '600' },
  navAction: { fontSize: 16, color: '#4E6EF2' },
  form: { padding: 20, paddingTop: 16, gap: 24, paddingBottom: 40 },
  section: { gap: 8 },
  label: { fontSize: 12, fontWeight: '500', color: '#646A73', letterSpacing: 1 },
  input: {
    height: 48, borderRadius: 14, backgroundColor: '#F5F7FA',
    borderWidth: 1, borderColor: '#E5E8ED', paddingHorizontal: 16,
    fontSize: 15, color: '#1F2329',
  },
  selectRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, height: 48, borderRadius: 14,
    backgroundColor: '#F5F7FA', borderWidth: 1, borderColor: '#E5E8ED',
  },
  selectValue: { fontSize: 15, color: '#1F2329' },

  // Counter
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterBtn: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#F5F7FA',
    borderWidth: 1, borderColor: '#E5E8ED', alignItems: 'center', justifyContent: 'center',
  },
  counterValue: {
    flex: 1, height: 44, borderRadius: 14, backgroundColor: '#F5F7FA',
    borderWidth: 1, borderColor: '#E5E8ED', alignItems: 'center', justifyContent: 'center',
  },
  counterText: { fontSize: 16, fontWeight: '600', color: '#1F2329' },

  // Chips
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#F5F7FA', borderWidth: 1, borderColor: '#E5E8ED',
  },
  selChipActive: { backgroundColor: '#4E6EF2', borderColor: '#4E6EF2' },
  selChipText: { fontSize: 13, fontWeight: '500', color: '#646A73' },
  selChipTextActive: { color: '#FFFFFF' },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#F5F7FA', borderWidth: 1, borderColor: '#E5E8ED',
  },
  chipActive: { backgroundColor: '#4E6EF2', borderColor: '#4E6EF2' },
  chipText: { fontSize: 13, fontWeight: '500', color: '#646A73' },
  chipTextActive: { color: '#FFFFFF' },

  // Switch
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14,
  },
  switchLeft: { flex: 1, gap: 2 },
  switchLabel: { fontSize: 15, fontWeight: '500', color: '#1F2329' },
  switchDesc: { fontSize: 12, color: '#8F959E' },
  divider: { height: 1, backgroundColor: '#E5E8ED' },

  // Inline row
  inlineRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 4,
  },
  inlineLabel: { fontSize: 14, color: '#646A73' },
  inlineRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inlineInput: {
    width: 50, height: 36, borderRadius: 8, backgroundColor: '#F5F7FA',
    borderWidth: 1, borderColor: '#E5E8ED', textAlign: 'center',
    fontSize: 14, fontWeight: '600', color: '#1F2329',
  },
  inlineUnit: { fontSize: 14, color: '#646A73' },
});
