import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { Check, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../theme';
import { API_BASE_URL } from '../api/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PLUGINS = [
  { id: 'coingecko', name: 'CoinGecko', icon: '🪙' },
  { id: 'binance', name: 'Binance', icon: '🔶' },
  { id: 'polymarket', name: 'Polymarket', icon: '📊' },
];

const MODELS = ['GPT-4o', 'GPT-4o Mini', 'Claude Sonnet 4.5'];

function showAlert(title, msg) {
  if (Platform.OS === 'web') window.alert(msg ? `${title}: ${msg}` : title);
  else Alert.alert(title, msg);
}

export default function CreateAgentScreen({ navigation }) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedPlugins, setSelectedPlugins] = useState(['binance']);
  const [selectedModel, setSelectedModel] = useState('GPT-4o');

  const togglePlugin = (id) => {
    setSelectedPlugins((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert('提示', '请输入 Agent 名称');
      return;
    }
    try {
      const sess = await AsyncStorage.getItem('@deeplink_session');
      const sessToken = sess ? JSON.parse(sess).token : null;
      // For now just go back — server create agent API can be added later
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
        <Text style={[styles.navTitle, { color: '#1F2329' }]}>创建 Agent</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.navAction, { fontWeight: '600' }]}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        {/* 名称 */}
        <View style={styles.section}>
          <Text style={styles.label}>名称</Text>
          <TextInput
            style={styles.input}
            placeholder="基本面分析 Agent"
            placeholderTextColor="#8F959E"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* 系统提示词 */}
        <View style={styles.section}>
          <Text style={styles.label}>系统提示词</Text>
          <TextInput
            style={styles.textArea}
            placeholder="你是一位专业的加密货币基本面分析师。你的任务是分析项目的代币经济学、团队背景、路线图、TVL 和链上指标..."
            placeholderTextColor="#8F959E"
            value={prompt}
            onChangeText={setPrompt}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* 插件绑定 */}
        <View style={styles.section}>
          <Text style={styles.label}>插件绑定</Text>
          <View style={styles.optionList}>
            {PLUGINS.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.optionRow}
                onPress={() => togglePlugin(p.id)}
              >
                <View style={styles.optionLeft}>
                  <Text style={styles.optionIcon}>{p.icon}</Text>
                  <Text style={styles.optionText}>{p.name}</Text>
                </View>
                {selectedPlugins.includes(p.id) && <Check size={18} color="#4E6EF2" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 模型 */}
        <View style={styles.section}>
          <Text style={styles.label}>模型</Text>
          <TouchableOpacity style={styles.selectRow}>
            <Text style={styles.selectValue}>{selectedModel}</Text>
            <ChevronRight size={18} color="#8F959E" />
          </TouchableOpacity>
        </View>
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
  textArea: {
    height: 140, borderRadius: 14, backgroundColor: '#F5F7FA',
    borderWidth: 1, borderColor: '#E5E8ED', padding: 16,
    fontSize: 14, color: '#1F2329', lineHeight: 22,
  },
  optionList: { gap: 8 },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, height: 48, borderRadius: 14,
    backgroundColor: '#F5F7FA', borderWidth: 1, borderColor: '#E5E8ED',
  },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionIcon: { fontSize: 18 },
  optionText: { fontSize: 15, fontWeight: '500', color: '#1F2329' },
  selectRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, height: 48, borderRadius: 14,
    backgroundColor: '#F5F7FA', borderWidth: 1, borderColor: '#E5E8ED',
  },
  selectValue: { fontSize: 15, color: '#1F2329' },
});
