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
import { ChevronLeft, Eye, EyeOff, Trash2, Plus, Check } from 'lucide-react-native';
import { useTheme } from '../theme';

export default function ApiKeysScreen({ navigation }) {
  const { colors } = useTheme();
  const [keys, setKeys] = useState([
    { id: '1', exchange: 'Binance', apiKey: 'Vk9x...3fQm', secret: '••••••••', connected: true },
  ]);
  const [adding, setAdding] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newSecret, setNewSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  const handleAdd = () => {
    if (!newKey.trim() || !newSecret.trim()) {
      Alert.alert('请填写 API Key 和 Secret');
      return;
    }
    setKeys(prev => [...prev, {
      id: String(Date.now()),
      exchange: 'Binance',
      apiKey: newKey.slice(0, 4) + '...' + newKey.slice(-4),
      secret: '••••••••',
      connected: true,
    }]);
    setNewKey('');
    setNewSecret('');
    setAdding(false);
    Alert.alert('已添加', 'Binance API 密钥已保存');
  };

  const handleDelete = (id) => {
    Alert.alert('确认删除', '删除后将无法恢复', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => setKeys(prev => prev.filter(k => k.id !== id)) },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.textPrimary }]}>API 密钥管理</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Existing keys */}
        {keys.map((key) => (
          <View key={key.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardLeft}>
                <Text style={styles.exchangeIcon}>🔶</Text>
                <View>
                  <Text style={[styles.exchangeName, { color: colors.textPrimary }]}>{key.exchange}</Text>
                  <Text style={[styles.keyPreview, { color: colors.textSecondary }]}>{key.apiKey}</Text>
                </View>
              </View>
              {key.connected && (
                <View style={styles.connBadge}>
                  <Check size={12} color="#34C759" />
                  <Text style={styles.connText}>已连接</Text>
                </View>
              )}
            </View>
            <View style={[styles.cardActions, { borderTopColor: colors.divider }]}>
              <TouchableOpacity style={styles.cardAction}>
                <Eye size={16} color={colors.textSecondary} />
                <Text style={[styles.actionText, { color: colors.textSecondary }]}>查看</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cardAction} onPress={() => handleDelete(key.id)}>
                <Trash2 size={16} color="#F54A45" />
                <Text style={[styles.actionText, { color: '#F54A45' }]}>删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Add new key form */}
        {adding ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.addTitle, { color: colors.textPrimary }]}>添加 Binance API</Text>
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: '#646A73' }]}>API Key</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.cardBorder, color: colors.textPrimary }]}
                placeholder="输入 API Key"
                placeholderTextColor={colors.textMuted}
                value={newKey}
                onChangeText={setNewKey}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: '#646A73' }]}>Secret Key</Text>
              <View style={styles.secretRow}>
                <TextInput
                  style={[styles.input, { flex: 1, backgroundColor: colors.inputBg, borderColor: colors.cardBorder, color: colors.textPrimary }]}
                  placeholder="输入 Secret Key"
                  placeholderTextColor={colors.textMuted}
                  value={newSecret}
                  onChangeText={setNewSecret}
                  secureTextEntry={!showSecret}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowSecret(!showSecret)} style={styles.eyeBtn}>
                  {showSecret ? <EyeOff size={20} color={colors.textMuted} /> : <Eye size={20} color={colors.textMuted} />}
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.formButtons}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.cardBorder }]} onPress={() => setAdding(false)}>
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                <Text style={styles.saveText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={[styles.addBtn, { borderColor: colors.cardBorder }]} onPress={() => setAdding(true)}>
            <Plus size={18} color={colors.primary} />
            <Text style={[styles.addBtnText, { color: colors.primary }]}>添加 Binance API 密钥</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.hint, { color: colors.textMuted }]}>
          密钥仅用于读取市场数据和模拟交易，不会执行真实交易。
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 44 },
  navTitle: { fontSize: 17, fontWeight: '600' },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  exchangeIcon: { fontSize: 28 },
  exchangeName: { fontSize: 16, fontWeight: '600' },
  keyPreview: { fontSize: 13, marginTop: 2 },
  connBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F8EE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  connText: { fontSize: 12, fontWeight: '500', color: '#34C759' },
  cardActions: { flexDirection: 'row', borderTopWidth: 1 },
  cardAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  actionText: { fontSize: 13, fontWeight: '500' },
  addTitle: { fontSize: 16, fontWeight: '600', padding: 16, paddingBottom: 8 },
  formField: { paddingHorizontal: 16, marginBottom: 12, gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '500' },
  input: { height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 },
  secretRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { padding: 8 },
  formButtons: { flexDirection: 'row', gap: 12, padding: 16, paddingTop: 4 },
  cancelBtn: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 14, fontWeight: '500' },
  saveBtn: { flex: 1, height: 44, borderRadius: 12, backgroundColor: '#4E6EF2', alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', gap: 8 },
  addBtnText: { fontSize: 14, fontWeight: '500' },
  hint: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
