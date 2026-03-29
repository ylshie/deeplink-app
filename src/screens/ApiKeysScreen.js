import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { ChevronLeft, Eye, EyeOff, Trash2, Plus, Check, Wallet, BarChart3 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme';
import { API_BASE_URL } from '../api/config';
import { getAccounts, createAccount, deleteAccount } from '../api/accounts';

const SESSION_KEY = '@deeplink_session';
const STORAGE_KEY = '@deeplink_binance_credentials';

function showAlert(title, msg) {
  if (Platform.OS === 'web') window.alert(msg ? `${title}: ${msg}` : title);
  else Alert.alert(title, msg);
}

export default function ApiKeysScreen({ navigation }) {
  const { colors } = useTheme();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingType, setAddingType] = useState(null); // null | 'real' | 'simulated'
  const [validating, setValidating] = useState(false);

  // Real account form
  const [newKey, setNewKey] = useState('');
  const [newSecret, setNewSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  // Simulated account form
  const [simName, setSimName] = useState('');
  const [simBalance, setSimBalance] = useState('10000');

  const loadAccounts = useCallback(async () => {
    try {
      let accts = await getAccounts();

      // Migrate: if server has no accounts but local has old Binance credential, push it up
      if ((!accts || accts.length === 0)) {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const cred = JSON.parse(stored);
          if (cred.connected && cred.token) {
            try {
              await createAccount({
                type: 'real',
                name: `Binance (${cred.displayKey || '****'})`,
                token: cred.token,
              });
              // Re-fetch after migration
              accts = await getAccounts();
            } catch { /* */ }
          }
        }
      }

      setAccounts(accts || []);
    } catch {
      // Server unreachable — show local credential as fallback
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const cred = JSON.parse(stored);
          if (cred.connected && cred.token) {
            setAccounts([{
              id: 'legacy-binance',
              type: 'real',
              name: `Binance (${cred.displayKey || '****'})`,
              hasToken: true,
            }]);
          }
        }
      } catch { /* */ }
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  // ── Real account: validate and connect ──
  const handleConnectReal = async () => {
    if (!newKey.trim() || !newSecret.trim()) {
      showAlert('提示', '请填写 API Key 和 Secret Key');
      return;
    }
    setValidating(true);
    try {
      // Validate on server
      const res = await fetch(`${API_BASE_URL}/credentials/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: newKey.trim(), apiSecret: newSecret.trim() }),
      });
      const result = await res.json();
      if (!result.valid) {
        showAlert('验证失败', result.error || '无法连接到 Binance');
        return;
      }

      const displayKey = newKey.trim().slice(0, 4) + '····' + newKey.trim().slice(-4);

      // Save locally
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        displayKey, token: result.token, connected: true, savedAt: new Date().toISOString(),
      }));

      // Create account on server (also sets binanceToken + portfolio credential)
      await createAccount({ type: 'real', name: `Binance (${displayKey})`, token: result.token });

      setAddingType(null);
      setNewKey('');
      setNewSecret('');
      loadAccounts();
      showAlert('连接成功', 'Binance 账户已连接');
    } catch (err) {
      showAlert('错误', err.message);
    } finally {
      setValidating(false);
    }
  };

  // ── Simulated account ──
  const handleCreateSimulated = async () => {
    const name = simName.trim() || '模拟账户';
    const balance = parseFloat(simBalance) || 10000;
    if (balance <= 0) {
      showAlert('提示', '请输入有效的初始金额');
      return;
    }
    setValidating(true);
    try {
      await createAccount({ type: 'simulated', name, initialBalance: balance });
      setAddingType(null);
      setSimName('');
      setSimBalance('10000');
      loadAccounts();
      showAlert('创建成功', `模拟账户「${name}」已创建，初始余额 $${balance.toLocaleString()}`);
    } catch (err) {
      showAlert('错误', err.message);
    } finally {
      setValidating(false);
    }
  };

  // ── Delete account ──
  const handleDeleteAccount = (acct) => {
    const doDelete = async () => {
      try {
        // Always clear local credential + server binanceToken
        await AsyncStorage.removeItem(STORAGE_KEY);
        const sess = await AsyncStorage.getItem(SESSION_KEY);
        if (sess) {
          const { token: sessToken } = JSON.parse(sess);
          if (acct.type === 'real') {
            await fetch(`${API_BASE_URL}/user/binance/disconnect`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-session-token': sessToken },
            }).catch(() => {});
          }
        }
        // Delete account record on server
        if (acct.id !== 'legacy-binance') {
          await deleteAccount(acct.id);
        }
      } catch (e) {
        showAlert('错误', e.message || '删除失败');
      }
      loadAccounts();
    };
    if (Platform.OS === 'web') {
      if (!window.confirm(`确认删除「${acct.name}」？`)) return;
      doDelete();
    } else {
      Alert.alert('确认删除', `将删除「${acct.name}」`, [
        { text: '取消', style: 'cancel' },
        { text: '删除', style: 'destructive', onPress: doDelete },
      ]);
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
        <Text style={[styles.navTitle, { color: colors.textPrimary }]}>账户管理</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account list */}
        {accounts.map((acct) => (
          <View key={acct.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardLeft}>
                <Text style={styles.exchangeIcon}>{acct.type === 'real' ? '🔶' : '📊'}</Text>
                <View>
                  <Text style={[styles.exchangeName, { color: colors.textPrimary }]}>{acct.name}</Text>
                  <Text style={[styles.keyPreview, { color: colors.textSecondary }]}>
                    {acct.type === 'real' ? '真实账户' : `模拟 · 初始 $${(acct.initialBalance || 0).toLocaleString()}`}
                  </Text>
                </View>
              </View>
              <View style={[styles.typeBadge, { backgroundColor: acct.type === 'real' ? '#E8F8EE' : '#FFF8E1' }]}>
                {acct.type === 'real' ? <Check size={12} color="#34C759" /> : <BarChart3 size={12} color="#FF9500" />}
                <Text style={[styles.typeText, { color: acct.type === 'real' ? '#34C759' : '#FF9500' }]}>
                  {acct.type === 'real' ? '真实' : '模拟'}
                </Text>
              </View>
            </View>

            {/* Simulated account balance */}
            {acct.type === 'simulated' && acct.balance && (
              <View style={[styles.balanceRow, { borderTopColor: colors.divider }]}>
                <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>USDT 余额</Text>
                <Text style={[styles.balanceValue, { color: colors.textPrimary }]}>${(acct.balance.usdt || 0).toFixed(2)}</Text>
                {(acct.balance.assets || []).length > 0 && (
                  <>
                    <Text style={[styles.balanceLabel, { color: colors.textSecondary, marginLeft: 16 }]}>持仓</Text>
                    <Text style={[styles.balanceValue, { color: colors.textPrimary }]}>{acct.balance.assets.length} 种</Text>
                  </>
                )}
              </View>
            )}

            <View style={[styles.cardActions, { borderTopColor: colors.divider }]}>
              <TouchableOpacity style={styles.cardAction} onPress={() => handleDeleteAccount(acct)}>
                <Trash2 size={16} color="#F54A45" />
                <Text style={[styles.actionText, { color: '#F54A45' }]}>删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Add buttons */}
        {!addingType && (
          <View style={styles.addButtons}>
            <TouchableOpacity style={[styles.addBtn, { borderColor: colors.cardBorder }]} onPress={() => setAddingType('real')}>
              <Wallet size={18} color={colors.primary} />
              <Text style={[styles.addBtnText, { color: colors.primary }]}>连接 Binance</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.addBtn, { borderColor: '#FFD60A' }]} onPress={() => setAddingType('simulated')}>
              <BarChart3 size={18} color="#FF9500" />
              <Text style={[styles.addBtnText, { color: '#FF9500' }]}>新增模拟账户</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Real account form */}
        {addingType === 'real' && (
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
                onPress={() => { setAddingType(null); setNewKey(''); setNewSecret(''); }}
              >
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, validating && { opacity: 0.6 }]}
                onPress={handleConnectReal}
                disabled={validating}
              >
                {validating ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveText}>验证并连接</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Simulated account form */}
        {addingType === 'simulated' && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.formHeader}>
              <Text style={styles.formIcon}>📊</Text>
              <Text style={[styles.formTitle, { color: colors.textPrimary }]}>新增模拟账户</Text>
            </View>

            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: '#646A73' }]}>账户名称</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.cardBorder, color: colors.textPrimary }]}
                placeholder="例如：测试策略"
                placeholderTextColor={colors.textMuted}
                value={simName}
                onChangeText={setSimName}
              />
            </View>

            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: '#646A73' }]}>初始 USDT 金额</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.cardBorder, color: colors.textPrimary }]}
                placeholder="10000"
                placeholderTextColor={colors.textMuted}
                value={simBalance}
                onChangeText={setSimBalance}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => { setAddingType(null); setSimName(''); setSimBalance('10000'); }}
              >
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: '#FF9500' }, validating && { opacity: 0.6 }]}
                onPress={handleCreateSimulated}
                disabled={validating}
              >
                {validating ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveText}>创建</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Security hint */}
        <View style={[styles.hintBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.hintTitle, { color: colors.textPrimary }]}>说明</Text>
          <Text style={[styles.hintText, { color: colors.textSecondary }]}>
            {'• 真实账户：密钥经 AES-256-GCM 加密，服务器不存储原始密钥\n• 模拟账户：使用真实市场价格，虚拟余额交易，不产生真实订单\n• 创建任务时可选择使用哪个账户'}
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
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 12, fontWeight: '500' },
  balanceRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1 },
  balanceLabel: { fontSize: 12, marginRight: 6 },
  balanceValue: { fontSize: 14, fontWeight: '600' },
  cardActions: { flexDirection: 'row', borderTopWidth: 1 },
  cardAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  actionText: { fontSize: 13, fontWeight: '500' },

  addButtons: { gap: 12 },
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
