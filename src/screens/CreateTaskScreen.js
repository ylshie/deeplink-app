import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  FlatList,
  Platform,
  Alert,
} from 'react-native';
import { Minus, Plus, ChevronDown, Check } from 'lucide-react-native';
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
  const [showPairPicker, setShowPairPicker] = useState(false);
  const [showFreqPicker, setShowFreqPicker] = useState(false);
  const [showTeamPicker, setShowTeamPicker] = useState(false);
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
          <TouchableOpacity style={styles.selectRow} onPress={() => setShowTeamPicker(true)}>
            <Text style={styles.selectValue}>{TEAMS.find(t => t.id === selectedTeam)?.name}</Text>
            <ChevronDown size={18} color="#8F959E" />
          </TouchableOpacity>
        </View>

        {/* 交易对 */}
        <View style={styles.section}>
          <Text style={styles.label}>交易对</Text>
          <TouchableOpacity style={styles.selectRow} onPress={() => setShowPairPicker(true)}>
            <Text style={styles.selectValue}>{pair}</Text>
            <ChevronDown size={18} color="#8F959E" />
          </TouchableOpacity>
        </View>

        {/* 执行频率 */}
        <View style={styles.section}>
          <Text style={styles.label}>执行频率</Text>
          <TouchableOpacity style={styles.selectRow} onPress={() => setShowFreqPicker(true)}>
            <Text style={styles.selectValue}>{frequency}</Text>
            <ChevronDown size={18} color="#8F959E" />
          </TouchableOpacity>
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

      {/* Picker Modals */}
      <PickerModal
        visible={showTeamPicker}
        title="选择团队"
        options={TEAMS.map(t => ({ key: t.id, label: t.name }))}
        selected={selectedTeam}
        onSelect={(key) => { setSelectedTeam(key); setShowTeamPicker(false); }}
        onClose={() => setShowTeamPicker(false)}
      />
      <PickerModal
        visible={showPairPicker}
        title="选择交易对"
        options={PAIRS.map(p => ({ key: p, label: p }))}
        selected={pair}
        onSelect={(key) => { setPair(key); setShowPairPicker(false); }}
        onClose={() => setShowPairPicker(false)}
      />
      <PickerModal
        visible={showFreqPicker}
        title="选择执行频率"
        options={FREQS.map(f => ({ key: f, label: f }))}
        selected={frequency}
        onSelect={(key) => { setFrequency(key); setShowFreqPicker(false); }}
        onClose={() => setShowFreqPicker(false)}
      />
    </View>
  );
}

function PickerModal({ visible, title, options, selected, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={pickerStyles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={pickerStyles.sheet}>
          <View style={pickerStyles.header}>
            <Text style={pickerStyles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={pickerStyles.done}>完成</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
              <TouchableOpacity style={pickerStyles.row} onPress={() => onSelect(item.key)}>
                <Text style={[pickerStyles.rowText, selected === item.key && { color: '#4E6EF2', fontWeight: '600' }]}>
                  {item.label}
                </Text>
                {selected === item.key && <Check size={18} color="#4E6EF2" />}
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '50%', paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E8ED' },
  title: { fontSize: 16, fontWeight: '600', color: '#1F2329' },
  done: { fontSize: 16, fontWeight: '600', color: '#4E6EF2' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F5F7FA' },
  rowText: { fontSize: 16, color: '#1F2329' },
});

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
