import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Platform,
  Alert,
} from 'react-native';
import { Check, Plus, ChevronDown } from 'lucide-react-native';
import { useTheme } from '../theme';
import { API_BASE_URL } from '../api/config';
import { getAgents } from '../api';

const PAIRS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT', 'DOGE/USDT'];

function showAlert(title, msg) {
  if (Platform.OS === 'web') window.alert(msg ? `${title}: ${msg}` : title);
  else Alert.alert(title, msg);
}

export default function CreateTeamScreen({ navigation }) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pair, setPair] = useState('BTC/USDT');
  const [showPairPicker, setShowPairPicker] = useState(false);
  const [agents, setAgents] = useState([]);
  const [selectedAgentIds, setSelectedAgentIds] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const list = await getAgents();
        setAgents(list);
      } catch { /* */ }
    })();
  }, []);

  const toggleAgent = (id) => {
    setSelectedAgentIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert('提示', '请输入团队名称');
      return;
    }
    if (selectedAgentIds.length < 2) {
      showAlert('提示', '请至少选择 2 个 Agent');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          pair: selectedPair,
          agentIds: selectedAgentIds,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server ${res.status}`);
      }
      navigation.goBack();
    } catch (e) {
      showAlert('错误', e.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.navAction}>取消</Text>
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: '#1F2329' }]}>创建分析群</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.navAction, { fontWeight: '600' }]}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        {/* 名称 */}
        <View style={styles.section}>
          <Text style={styles.label}>群名称</Text>
          <TextInput
            style={styles.input}
            placeholder="例如：ETH 套利监控组"
            placeholderTextColor="#8F959E"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* 描述 */}
        <View style={styles.section}>
          <Text style={styles.label}>描述</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="该分析群的目标和职责..."
            placeholderTextColor="#8F959E"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* 交易对 */}
        <View style={styles.section}>
          <Text style={styles.label}>目标交易对</Text>
          <TouchableOpacity style={styles.selectRow} onPress={() => setShowPairPicker(true)}>
            <Text style={styles.selectValue}>{pair}</Text>
            <ChevronDown size={18} color="#8F959E" />
          </TouchableOpacity>
        </View>

        {/* 选择 Agent */}
        <View style={styles.section}>
          <Text style={styles.label}>成员 AGENT（已选 {selectedAgentIds.length}）</Text>
          <View style={styles.optionList}>
            {agents.map((a) => {
              const selected = selectedAgentIds.includes(a.id);
              return (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.agentRow, selected && styles.agentRowSelected]}
                  onPress={() => toggleAgent(a.id)}
                >
                  <View style={[styles.agentAvatar, { backgroundColor: a.iconBg || '#5856D6' }]}>
                    <Text style={styles.agentAvatarText}>{a.name[0]}</Text>
                  </View>
                  <View style={styles.agentInfo}>
                    <Text style={styles.agentName}>{a.name}</Text>
                    <Text style={styles.agentSub} numberOfLines={1}>{a.subtitle || ''}</Text>
                  </View>
                  {selected ? (
                    <View style={styles.checkCircle}><Check size={14} color="#FFF" /></View>
                  ) : (
                    <View style={styles.uncheckCircle}><Plus size={14} color="#8F959E" /></View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Pair Picker Modal */}
      <Modal visible={showPairPicker} transparent animationType="slide">
        <TouchableOpacity style={pickerS.overlay} activeOpacity={1} onPress={() => setShowPairPicker(false)}>
          <View style={pickerS.sheet}>
            <View style={pickerS.header}>
              <Text style={pickerS.title}>选择交易对</Text>
              <TouchableOpacity onPress={() => setShowPairPicker(false)}>
                <Text style={pickerS.done}>完成</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={PAIRS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={pickerS.row} onPress={() => { setPair(item); setShowPairPicker(false); }}>
                  <Text style={[pickerS.rowText, pair === item && { color: '#4E6EF2', fontWeight: '600' }]}>{item}</Text>
                  {pair === item && <Check size={18} color="#4E6EF2" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const pickerS = StyleSheet.create({
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
  optionList: { gap: 8 },
  agentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14,
    backgroundColor: '#F5F7FA', borderWidth: 1, borderColor: '#E5E8ED',
  },
  agentRowSelected: {
    borderColor: '#4E6EF2', backgroundColor: '#4E6EF208',
  },
  agentAvatar: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  agentAvatarText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  agentInfo: { flex: 1, gap: 2 },
  agentName: { fontSize: 14, fontWeight: '600', color: '#1F2329' },
  agentSub: { fontSize: 12, color: '#8F959E' },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#4E6EF2',
    alignItems: 'center', justifyContent: 'center',
  },
  uncheckCircle: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: '#E5E8ED',
    alignItems: 'center', justifyContent: 'center',
  },
  selectRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, height: 48, borderRadius: 14,
    backgroundColor: '#F5F7FA', borderWidth: 1, borderColor: '#E5E8ED',
  },
  selectValue: { fontSize: 15, color: '#1F2329' },
});
