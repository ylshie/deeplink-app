import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Search, SquarePen } from 'lucide-react-native';
import { useTheme } from '../theme';
import { getAgents, getTeams, deleteAgent, deleteTeam } from '../api';
import { getIcon } from '../components/IconMap';

const filters = ['Agent', 'Teams'];

export default function ConversationsScreen({ navigation }) {
  const { colors } = useTheme();
  const [activeFilter, setActiveFilter] = useState('Agent');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (filter) => {
    setLoading(true);
    try {
      const data = filter === 'Teams' ? await getTeams() : await getAgents();
      setItems(data);
    } catch (e) {
      console.error('Failed to fetch conversations:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeFilter);
  }, [activeFilter, fetchData]);

  const handleFilterPress = (f) => {
    if (f !== activeFilter) setActiveFilter(f);
  };

  const handleDelete = (item) => {
    if (item.builtin) return;
    const isTeam = activeFilter === 'Teams';
    const label = isTeam ? '分析群' : 'Agent';
    Alert.alert(`删除${label}`, `确认删除「${item.name}」？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除', style: 'destructive',
        onPress: async () => {
          try {
            if (isTeam) await deleteTeam(item.id);
            else await deleteAgent(item.id);
            fetchData(activeFilter);
          } catch { /* ignore */ }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const IconComponent = getIcon(item.icon);
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => {
          const isTeam = activeFilter === 'Teams';
          navigation.navigate(isTeam ? 'TeamChat' : 'AgentChat', {
            id: item.id,
            name: item.name,
            agentCount: item.agentCount,
            icon: item.icon,
            iconBg: item.iconBg,
          });
        }}
        onLongPress={() => handleDelete(item)}
        activeOpacity={0.6}
      >
        <View style={[styles.avatar, { backgroundColor: item.iconBg }]}>
          <IconComponent size={22} color="#FFFFFF" />
        </View>
        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <View style={styles.rowTitleWrap}>
              <Text style={[styles.rowName, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.name}
              </Text>
              {item.tag && (
                <View
                  style={[
                    styles.tag,
                    { backgroundColor: item.tagColor + '20' },
                  ]}
                >
                  <Text style={[styles.tagText, { color: item.tagColor }]}>
                    {item.tag}
                  </Text>
                </View>
              )}
            </View>
            {item.time ? (
              <Text style={[styles.time, { color: colors.textSecondary }]}>{item.time}</Text>
            ) : null}
          </View>
          <View style={styles.rowBottom}>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.subtitle}
            </Text>
            {item.badge > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}
          </View>
          {activeFilter === 'Teams' && item.agentCount > 0 && (
            <Text style={[styles.agentCountText, { color: colors.primary }]}>
              {item.agentCount} Agents
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSeparator = () => <View style={[styles.separator, { backgroundColor: colors.divider }]} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>对话</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity>
            <Search size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity>
            <SquarePen size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, { backgroundColor: colors.chipBg, borderColor: colors.chipBorder }, activeFilter === f && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => handleFilterPress(f)}
          >
            <Text
              style={[
                styles.chipText,
                { color: colors.textPrimary },
                activeFilter === f && { color: '#FFFFFF' },
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Conversation List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={renderSeparator}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 44,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    gap: 4,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  rowName: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
    marginLeft: 8,
  },
  rowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
    flex: 1,
  },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  agentCountText: {
    fontSize: 12,
    marginTop: 2,
  },
  separator: {
    height: 1,
    marginLeft: 82,
    marginRight: 20,
  },
});
