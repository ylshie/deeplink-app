import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MessageCircle, CalendarClock, CircleUserRound } from 'lucide-react-native';
import { useTheme } from '../theme';

const tabConfig = [
  { key: 'Conversations', label: '对话', icon: MessageCircle },
  { key: 'Tasks', label: '任务', icon: CalendarClock },
  { key: 'Profile', label: '我的', icon: CircleUserRound },
];

export default function CustomTabBar({ state, navigation }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
      <View style={[styles.pill, { backgroundColor: colors.tabPillBg, borderColor: colors.tabPillBorder }]}>
        {tabConfig.map((tab, index) => {
          const isFocused = state.index === index;
          const IconComponent = tab.icon;

          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isFocused && { backgroundColor: colors.tabActive }]}
              onPress={() => { if (!isFocused) navigation.navigate(tab.key); }}
              activeOpacity={0.7}
            >
              <IconComponent
                size={18}
                color={isFocused ? '#FFFFFF' : colors.tabInactive}
              />
              <Text
                style={[
                  styles.label,
                  { color: isFocused ? '#FFFFFF' : colors.tabInactive, fontWeight: isFocused ? '600' : '500' },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  pill: {
    flexDirection: 'row', height: 62, borderRadius: 32, padding: 4, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 4,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 26, gap: 4 },
  label: { fontSize: 10, letterSpacing: 0.5 },
});
