import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ChevronLeft, Eye, EyeOff, Trash2, Plus, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme';
import { API_BASE_URL } from '../api/config';

const STORAGE_KEY = '@deeplink_binance_credentials';
const SESSION_KEY = '@deeplink_session';

export default function ApiKeysScreen({ navigation }) {
  const { colors } = useTheme();
  const [savedKey, setSavedKey] = useState(null); // { displayKey, token, connected }
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [validating, setValidating] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newSecret, setNewSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  // Load saved credential on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setSavedKey(JSON.parse(stored));
        }
      } catch { /* */ }
      setLoading(false);
    })();
  }, []);

  const handleValidateAndSave = async () => {
    if (!newKey.trim() || !newSecret.trim()) {
      Alert.alert('提示', '请填写 API Key 和 Secret Key');
      return;
    }

    setValidating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/credentials/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: newKey.trim(), apiSecret: newSecret.trim() }),
      });

      const result = await res.json();

      if (!result.valid) {
        Alert.alert('验证失败', result.error || '无法连接到 Binance，请检查密钥是否正确');
        return;
      }

      // Save encrypted token + display info locally
      const credential = {
        displayKey: newKey.trim().slice(0, 4) + '····' + newKey.trim().slice(-4),
        token: result.token,
        connected: true,
        balances: result.balances,
        savedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(credential));

      // Also save to server (per-user, so other devices can see)
      try {
        const sess = await AsyncStorage.getItem(SESSION_KEY);
        if (sess) {
          const { token: sessToken } = JSON.parse(sess);
          await fetch(`${API_BASE_URL}/user/binance/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-session-token': sessToken },
            body: JSON.stringify({ token: result.token }),
          });
        }
      } catch { /* */ }

      setSavedKey(credential);
      setAdding(false);
      setNewKey('');
      setNewSecret('');

      const assetCount = Object.keys(result.balances || {}).length;
      Alert.alert('连接成功', `Binance 账户已连接，检测到 ${assetCount} 种资产`);
    } catch (err) {
      Alert.alert('错误', err.message || '网络连接失败');
    } finally {
      setValidating(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('确认断开', '将删除本地保存的加密密钥，不影响 Binance 账户', [
      { text: '取消', style: 'cancel' },
      {
        text: '断开',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(STORAGE_KEY);
          setSavedKey(null);
        },
      },
    ]);
  };

  const handleCheckBalance = async () => {
    if (!savedKey?.token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/credentials/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: savedKey.token }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const lines = [`USDT: ${data.usdt?.toFixed(2) || 0}`];
      (data.assets || []).forEach(a => {
        lines.push(`${a.asset}: ${a.quantity.toFixed(6)} ($${a.value.toFixed(2)})`);
      });
      lines.push(`\n总估值: $${data.totalValue?.toFixed(2) || 0}`);
      Alert.alert('账户余额', lines.join('\n'));
    } catch (err) {
      Alert.alert('错误', err.message);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

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
        {/* Saved key card */}
        {savedKey && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardLeft}>
                <Text style={styles.exchangeIcon}>🔶</Text>
                <View>
                  <Text style={[styles.exchangeName, { color: colors.textPrimary }]}>Binance</Text>
                  <Text style={[styles.keyPreview, { color: colors.textSecondary }]}>{savedKey.displayKey}</Text>
                </View>
              </View>
              <View style={styles.connBadge}>
                <Check size={12} color="#34C759" />
                <Text style={styles.connText}>已连接</Text>
              </View>
            </View>
            <View style={[styles.cardActions, { borderTopColor: colors.divider }]}>
              <TouchableOpacity style={styles.cardAction} onPress={handleCheckBalance}>
                <Eye size={16} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.primary }]}>查看余额</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cardAction} onPress={handleDelete}>
                <Trash2 size={16} color="#F54A45" />
                <Text style={[styles.actionText, { color: '#F54A45' }]}>断开连接</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Add form */}
        {!savedKey && !adding && (
          <TouchableOpacity style={[styles.addBtn, { borderColor: colors.cardBorder }]} onPress={() => setAdding(true)}>
            <Plus size={18} color={colors.primary} />
            <Text style={[styles.addBtnText, { color: colors.primary }]}>连接 Binance 账户</Text>
          </TouchableOpacity>
        )}

        {adding && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.formHeader}>
              <Text style={styles.formIcon}>🔶</Text>
              <Text style={[styles.formTitle, { color: colors.textPrimary }]}>连接 Binance</Text>
            </View>

            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: '#646A73' }]}>API Key</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.cardBorder, color: colors.textPrimary }]}
                placeholder="输入 Binance API Key"
                placeholderTextColor={colors.textMuted}
                value={newKey}
                onChangeText={setNewKey}
                autoCapitalize="none"
                autoCorrect={false}
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
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowSecret(!showSecret)} style={styles.eyeBtn}>
                  {showSecret ? <EyeOff size={20} color={colors.textMuted} /> : <Eye size={20} color={colors.textMuted} />}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => { setAdding(false); setNewKey(''); setNewSecret(''); }}
              >
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, validating && { opacity: 0.6 }]}
                onPress={handleValidateAndSave}
                disabled={validating}
              >
                {validating ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveText}>验证并连接</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Security hint */}
        <View style={[styles.hintBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.hintTitle, { color: colors.textPrimary }]}>安全说明</Text>
          <Text style={[styles.hintText, { color: colors.textSecondary }]}>
            {'• 密钥在发送到服务器验证后会被 AES-256-GCM 加密\n• 服务器不存储原始密钥，仅在需要时解密使用\n• 加密后的 token 保存在你的设备本地\n• 建议在 Binance 设置为「只读 + 现货交易」权限'}
          </Text>
        </View>
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
  cardAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  actionText: { fontSize: 13, fontWeight: '500' },

  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', gap: 8 },
  addBtnText: { fontSize: 15, fontWeight: '500' },

  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingBottom: 8 },
  formIcon: { fontSize: 24 },
  formTitle: { fontSize: 17, fontWeight: '600' },
  formField: { paddingHorizontal: 16, marginBottom: 12, gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '500', letterSpacing: 0.5 },
  input: { height: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 },
  secretRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { padding: 10 },
  formButtons: { flexDirection: 'row', gap: 12, padding: 16, paddingTop: 4 },
  cancelBtn: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 14, fontWeight: '500' },
  saveBtn: { flex: 1, height: 46, borderRadius: 12, backgroundColor: '#4E6EF2', alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 14, fontWeight: '600', color: '#FFF' },

  hintBox: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  hintTitle: { fontSize: 14, fontWeight: '600' },
  hintText: { fontSize: 12, lineHeight: 20 },
});
