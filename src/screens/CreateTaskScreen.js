import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '../theme';
import { addTask } from '../api';

const PLUGINS = [
  { id: 'coingecko', name: 'CoinGecko', icon: '🪙' },
  { id: 'binance', name: 'Binance', icon: '🔶' },
  { id: 'polymarket', name: 'Polymarket', icon: '📊' },
];

const MODELS = ['Claude Sonnet 4.5', 'GPT-4o', 'GPT-4o Mini'];

const TEAMS = [
  { id: 'team-btc', name: 'BTC 多维分析群' },
  { id: 'team-eth-arb', name: 'ETH 套利监控组' },
  { id: 'team-quant', name: '量化策略研究群' },
];

export default function CreateTaskScreen({ navigation }) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedPlugins, setSelectedPlugins] = useState(['binance']);
  const [selectedModel, setSelectedModel] = useState('GPT-4o');
  const [selectedTeam, setSelectedTeam] = useState('team-btc');
  const [pair, setPair] = useState('BTC/USDT');
  const [intervalMin, setIntervalMin] = useState('15');
  const [amount, setAmount] = useState('10');

  const togglePlugin = (id) => {
    setSelectedPlugins((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('提示', '请输入任务名称');
      return;
    }
    try {
      await addTask({
        id: `task-${Date.now()}`,
        name: name.trim(),
        status: 'draft',
        statusColor: '#AAAAAA',
        group: TEAMS.find(t => t.id === selectedTeam)?.name || '',
        schedule: `Every ${intervalMin}m`,
        teamId: selectedTeam,
        pair,
        intervalMin,
        quoteAmount: amount,
        prompt,
        plugins: selectedPlugins,
        model: selectedModel,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('错误', e.message || '创建失败');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.navAction, { color: colors.primary }]}>取消</Text>
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.textPrimary }]}>创建任务</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.navAction, { color: colors.primary, fontWeight: '600' }]}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        {/* Name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: '#646A73' }]}>名称</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.textPrimary }]}
            placeholder="例如：BTC 15分钟 Debate"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Team */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: '#646A73' }]}>关联分析群</Text>
          <View style={styles.optionList}>
            {TEAMS.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.optionRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                onPress={() => setSelectedTeam(t.id)}
              >
                <Text style={[styles.optionText, { color: colors.textPrimary }]}>{t.name}</Text>
                {selectedTeam === t.id && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Trading Pair + Interval + Amount */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: '#646A73' }]}>交易配置</Text>
          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <Text style={[styles.fieldLabel, { color: '#646A73' }]}>交易对</Text>
              <TextInput
                style={[styles.inputSmall, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.textPrimary }]}
                value={pair}
                onChangeText={setPair}
              />
            </View>
            <View style={styles.fieldHalf}>
              <Text style={[styles.fieldLabel, { color: '#646A73' }]}>间隔 (分钟)</Text>
              <TextInput
                style={[styles.inputSmall, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.textPrimary }]}
                value={intervalMin}
                onChangeText={setIntervalMin}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={{ marginTop: 10 }}>
            <Text style={[styles.fieldLabel, { color: '#646A73' }]}>单笔金额 (USDT)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.textPrimary }]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* System Prompt */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: '#646A73' }]}>系统提示词</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.textPrimary }]}
            placeholder="你是一位专业的加密货币分析师..."
            placeholderTextColor={colors.textMuted}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Plugins */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: '#646A73' }]}>插件绑定</Text>
          <View style={styles.optionList}>
            {PLUGINS.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.optionRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                onPress={() => togglePlugin(p.id)}
              >
                <View style={styles.optionLeft}>
                  <Text style={styles.optionIcon}>{p.icon}</Text>
                  <Text style={[styles.optionText, { color: colors.textPrimary }]}>{p.name}</Text>
                </View>
                {selectedPlugins.includes(p.id) && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Model */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: '#646A73' }]}>模型</Text>
          <View style={styles.optionList}>
            {MODELS.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.optionRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                onPress={() => setSelectedModel(m)}
              >
                <Text style={[styles.optionText, { color: colors.textPrimary }]}>{m}</Text>
                {selectedModel === m && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 44 },
  navTitle: { fontSize: 17, fontWeight: '600' },
  navAction: { fontSize: 16 },
  form: { padding: 20, paddingTop: 16, gap: 24, paddingBottom: 40 },
  section: { gap: 8 },
  label: { fontSize: 12, fontWeight: '500', letterSpacing: 1 },
  input: { height: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, fontSize: 15 },
  inputSmall: { height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 },
  textArea: { height: 140, borderRadius: 14, borderWidth: 1, padding: 16, fontSize: 14, lineHeight: 22 },
  fieldRow: { flexDirection: 'row', gap: 12 },
  fieldHalf: { flex: 1, gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '400' },
  optionList: { gap: 8 },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, height: 48, borderRadius: 14, borderWidth: 1,
  },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionIcon: { fontSize: 18 },
  optionText: { fontSize: 15, fontWeight: '500' },
});
