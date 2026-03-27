import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import {
  Search,
  Plus,
  Play,
  Pause,
  Pencil,
  Check,
  Trash2,
} from 'lucide-react-native';
import { useTheme } from '../theme';
import { getTasks, deleteTask } from '../api';
import { API_BASE_URL } from '../api/config';

const filters = ['全部', '运行中', '已暂停', '草稿'];

export default function TasksScreen({ navigation }) {
  const { colors } = useTheme();
  const [activeFilter, setActiveFilter] = useState('全部');
  const [tasks, setTasks] = useState([]);
  const [autoStatus, setAutoStatus] = useState({}); // taskId → 'running' | 'stopped'
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (filter) => {
    setLoading(true);
    try {
      const [data, statusRes] = await Promise.all([
        getTasks(filter),
        fetch(`${API_BASE_URL}/trading/auto/status`).then(r => r.ok ? r.json() : []).catch(() => []),
      ]);
      setTasks(data);
      const statusMap = {};
      statusRes.forEach(s => { statusMap[s.id] = s.status; });
      setAutoStatus(statusMap);
    } catch (e) {
      console.error('Failed to fetch tasks:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeFilter);
  }, [activeFilter, fetchData]);

  // Re-fetch when screen comes back into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData(activeFilter);
    });
    return unsubscribe;
  }, [navigation, activeFilter, fetchData]);

  const taskTeamMap = { 'task-1': 'team-btc', 'task-2': 'team-eth-arb', 'task-3': 'team-quant' };

  const handleToggleRun = async (taskId) => {
    const isRunning = autoStatus[taskId] === 'running';
    try {
      if (isRunning) {
        await fetch(`${API_BASE_URL}/trading/auto/stop`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId }),
        });
        setAutoStatus(prev => ({ ...prev, [taskId]: 'stopped' }));
      } else {
        await fetch(`${API_BASE_URL}/trading/auto/start`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, teamId: taskTeamMap[taskId] || 'team-btc', autoExecute: true, quoteAmount: 500 }),
        });
        setAutoStatus(prev => ({ ...prev, [taskId]: 'running' }));
      }
    } catch (e) {
      console.error('Toggle run failed:', e);
    }
  };

  const handleDeleteTask = async (task) => {
    if (task.builtin) return;
    if (Platform.OS === 'web') {
      if (!window.confirm(`确认删除「${task.name}」？`)) return;
      await deleteTask(task.id);
      fetchData(activeFilter);
    } else {
      Alert.alert('删除任务', `确认删除「${task.name}」？`, [
        { text: '取消', style: 'cancel' },
        {
          text: '删除', style: 'destructive',
          onPress: async () => {
            await deleteTask(task.id);
            fetchData(activeFilter);
          },
        },
      ]);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>任务</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity>
            <Search size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CreateTask')}>
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, { backgroundColor: colors.chipBg, borderColor: colors.chipBorder }, activeFilter === f && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setActiveFilter(f)}
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

      {/* Task Cards */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.cardList}
          showsVerticalScrollIndicator={false}
        >
          {tasks.map((task) => {
            const isRunning = autoStatus[task.id] === 'running';
            const canDelete = !task.builtin && !isRunning;
            return (
              <View
                key={task.id}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              >
                {/* Tappable card body → navigate to detail */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.cardBody}
                  onPress={() => navigation.navigate('TaskDetail', { id: task.id, name: task.name })}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardLeft}>
                      <View style={[styles.statusDot, { backgroundColor: isRunning ? '#34C759' : task.statusColor }]} />
                      <Text style={[styles.cardName, { color: colors.textPrimary }]} numberOfLines={1}>{task.name}</Text>
                    </View>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>{task.group} · {task.schedule}</Text>
                  </View>
                </TouchableOpacity>

                {/* Action buttons row — NOT inside the card touchable */}
                <View style={[styles.cardActionRow, { borderTopColor: colors.divider }]}>
                  {isRunning ? (
                    <TouchableOpacity style={styles.cardActionItem} onPress={() => handleToggleRun(task.id)}>
                      <Pause size={14} color="#FF9500" />
                      <Text style={[styles.cardActionLabel, { color: '#FF9500' }]}>暂停</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.cardActionItem} onPress={() => handleToggleRun(task.id)}>
                      <Play size={14} color={colors.primary} fill={colors.primary} />
                      <Text style={[styles.cardActionLabel, { color: colors.primary }]}>运行</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.cardActionItem} onPress={() => navigation.navigate('TaskDetail', { id: task.id, name: task.name })}>
                    <Pencil size={14} color={colors.textSecondary} />
                    <Text style={[styles.cardActionLabel, { color: colors.textSecondary }]}>编辑</Text>
                  </TouchableOpacity>
                  {canDelete && (
                    <TouchableOpacity style={styles.cardActionItem} onPress={() => handleDeleteTask(task)}>
                      <Trash2 size={14} color="#F54A45" />
                      <Text style={[styles.cardActionLabel, { color: '#F54A45' }]}>删除</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
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
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
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
  scrollView: {
    flex: 1,
  },
  cardList: {
    padding: 20,
    paddingTop: 8,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardBody: {
    padding: 20,
    paddingBottom: 14,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  runBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  cardInfo: {
    gap: 6,
  },
  infoText: {
    fontSize: 13,
  },
  cardActionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    marginTop: 4,
    paddingTop: 10,
  },
  cardActionItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  cardActionLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
});
