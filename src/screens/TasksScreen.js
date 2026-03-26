import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
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
import { colors } from '../theme';
import { getTasks } from '../api';

const filters = ['全部', '运行中', '已暂停', '草稿'];

export default function TasksScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState('全部');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (filter) => {
    setLoading(true);
    try {
      const data = await getTasks(filter);
      setTasks(data);
    } catch (e) {
      console.error('Failed to fetch tasks:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeFilter);
  }, [activeFilter, fetchData]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>任务</Text>
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
            style={[styles.chip, activeFilter === f && styles.chipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text
              style={[
                styles.chipText,
                activeFilter === f && styles.chipTextActive,
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
              style={styles.card}
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
                      { backgroundColor: task.statusColor },
                    ]}
                  />
                  <Text style={styles.cardName} numberOfLines={1}>
                    {task.name}
                  </Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.runBtn}>
                    <Play size={12} color="#FFFFFF" fill="#FFFFFF" />
                    <Text style={styles.runBtnText}>运行</Text>
                  </TouchableOpacity>
                  {task.status === 'active' && (
                    <TouchableOpacity style={styles.actionBtn}>
                      <Pause size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                  {task.status === 'draft' && (
                    <TouchableOpacity style={styles.actionBtn}>
                      <Pencil size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Card Info */}
              <View style={styles.cardInfo}>
                <Text style={styles.infoText}>
                  {task.group} · {task.schedule}
                </Text>
                {!task.neverRun && (
                  <>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoText}>
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
                      <Text style={styles.infoText}>Next: {task.nextRun}</Text>
                    )}
                    {task.pausedSince && (
                      <Text style={[styles.infoText, { color: '#FF9500' }]}>
                        Paused since: {task.pausedSince}
                      </Text>
                    )}
                  </>
                )}
                {task.neverRun && (
                  <Text style={[styles.infoText, { fontStyle: 'italic' }]}>
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
    backgroundColor: colors.background,
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
    color: colors.textPrimary,
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
    backgroundColor: colors.chipBg,
    borderWidth: 1,
    borderColor: colors.chipBorder,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: '#FFFFFF',
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
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
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
    color: colors.textPrimary,
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
    backgroundColor: colors.primary,
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
    backgroundColor: colors.divider,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cardInfo: {
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
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
