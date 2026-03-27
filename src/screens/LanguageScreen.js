import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { ChevronLeft, Check } from 'lucide-react-native';
import { useTheme } from '../theme';

const LANGUAGES = [
  { key: 'zh-CN', label: '简体中文' },
  { key: 'zh-TW', label: '繁體中文' },
  { key: 'en', label: 'English' },
];

export default function LanguageScreen({ navigation }) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState('zh-CN');

  const handleSelect = (key) => {
    setSelected(key);
    // TODO: persist language setting + i18n switch
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.textPrimary }]}>语言</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {LANGUAGES.map((lang, i) => (
            <View key={lang.key}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: colors.divider }]} />}
              <TouchableOpacity
                style={styles.row}
                onPress={() => handleSelect(lang.key)}
              >
                <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{lang.label}</Text>
                {selected === lang.key && <Check size={20} color={colors.primary} />}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 44 },
  navTitle: { fontSize: 17, fontWeight: '600' },
  content: { padding: 20 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 52 },
  rowLabel: { fontSize: 16, fontWeight: '500' },
  divider: { height: 1, marginHorizontal: 16 },
});
