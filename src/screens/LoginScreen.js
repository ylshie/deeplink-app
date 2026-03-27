import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../theme';
import { API_BASE_URL } from '../api/config';

export default function LoginScreen({ onLogin }) {
  const { colors } = useTheme();
  const [step, setStep] = useState('email'); // 'email' | 'code'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('请输入有效的邮箱地址');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || '发送失败');
        return;
      }
      setStep('code');
      startCountdown();
    } catch (e) {
      setError('网络连接失败');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length < 6) {
      setError('请输入 6 位验证码');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      const data = await res.json();
      if (!data.valid) {
        setError(data.error || '验证失败');
        return;
      }
      // Success — pass token + email back
      onLogin({ token: data.token, email: data.email });
    } catch (e) {
      setError('网络连接失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>D</Text>
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>DeepLink</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>多 Agent 加密货币分析平台</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email input */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: '#646A73' }]}>邮箱</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.textPrimary }]}
              placeholder="输入邮箱地址"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={step === 'email'}
            />
          </View>

          {/* Code input (shown after email sent) */}
          {step === 'code' && (
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: '#646A73' }]}>验证码</Text>
              <View style={styles.codeRow}>
                <TextInput
                  style={[styles.input, { flex: 1, backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.textPrimary, letterSpacing: 8, textAlign: 'center', fontSize: 22, fontWeight: '700' }]}
                  placeholder="000000"
                  placeholderTextColor={colors.textMuted}
                  value={code}
                  onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
              </View>
              <TouchableOpacity
                onPress={countdown > 0 ? undefined : handleSendCode}
                disabled={countdown > 0}
              >
                <Text style={[styles.resendText, { color: countdown > 0 ? colors.textMuted : colors.primary }]}>
                  {countdown > 0 ? `${countdown}s 后重新发送` : '重新发送验证码'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Error */}
          {error && <Text style={styles.error}>{error}</Text>}

          {/* Button */}
          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={step === 'email' ? handleSendCode : handleVerify}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>
                {step === 'email' ? '获取验证码' : '登录'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Back to email */}
          {step === 'code' && (
            <TouchableOpacity onPress={() => { setStep('email'); setCode(''); setError(null); }}>
              <Text style={[styles.backText, { color: colors.textSecondary }]}>使用其他邮箱</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  logoWrap: { alignItems: 'center', marginBottom: 48 },
  logo: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#4E6EF2', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: { fontSize: 32, fontWeight: '800', color: '#FFF' },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 8 },
  form: { gap: 20 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 12, fontWeight: '500', letterSpacing: 1 },
  input: { height: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  codeRow: { flexDirection: 'row' },
  resendText: { fontSize: 13, textAlign: 'right', marginTop: 4 },
  error: { fontSize: 13, color: '#F54A45', textAlign: 'center' },
  button: {
    height: 52, borderRadius: 14, backgroundColor: '#4E6EF2',
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  backText: { fontSize: 13, textAlign: 'center', marginTop: 4 },
});
