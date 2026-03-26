import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  Search,
  Plus,
  Play,
  Pause,
  Pencil,
  Check,
} from 'lucide-react-native';
import { useTheme } from '../theme';
import { getTasks } from '../api';
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>任务</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity>
            <Search size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn}>
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
          {tasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate('TaskDetail', {
                  id: task.id,
                  name: task.name,
                })
              }
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.cardLeft}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: autoStatus[task.id] === 'running' ? '#34C759' : task.statusColor },
                    ]}
                  />
                  <Text style={[styles.cardName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {task.name}
                  </Text>
                </View>
                <View style={styles.cardActions}>
                  {autoStatus[task.id] === 'running' ? (
                    <TouchableOpacity
                      style={[styles.runBtn, { backgroundColor: '#FF9500' }]}
                      onPress={(e) => { e.stopPropagation(); handleToggleRun(task.id); }}
                    >
                      <Pause size={12} color="#FFFFFF" />
                      <Text style={styles.runBtnText}>暂停</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.runBtn, { backgroundColor: colors.primary }]}
                      onPress={(e) => { e.stopPropagation(); handleToggleRun(task.id); }}
                    >
                      <Play size={12} color="#FFFFFF" fill="#FFFFFF" />
                      <Text style={styles.runBtnText}>运行</Text>
                    </TouchableOpacity>
                  )}
                  {task.status === 'draft' && (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.divider }]}>
                      <Pencil size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Card Info */}
              <View style={styles.cardInfo}>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  {task.group} · {task.schedule}
                </Text>
                {!task.neverRun && (
                  <>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        Last: {task.lastTime} →{' '}
                      </Text>
                      <Text
                        style={[
                          styles.infoResult,
                          { color: task.lastResultColor },
                        ]}
                      >
                        {task.lastResult}
                      </Text>
                      {task.showCheck && (
                        <Check
                          size={14}
                          color="#34C759"
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </View>
                    {task.nextRun && (
                      <Text style={[styles.infoText, { color: colors.textSecondary }]}>Next: {task.nextRun}</Text>
                    )}
                    {task.pausedSince && (
                      <Text style={[styles.infoText, { color: '#FF9500' }]}>
                        Paused since: {task.pausedSince}
                      </Text>
                    )}
                  </>
                )}
                {task.neverRun && (
                  <Text style={[styles.infoText, { color: colors.textSecondary, fontStyle: 'italic' }]}>
                    Never run
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
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
    padding: 20,
    borderWidth: 1,
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
  runBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cardInfo: {
    gap: 6,
  },
  infoText: {
    fontSize: 13,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoResult: {
    fontSize: 13,
    fontWeight: '600',
  },
});
