import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  ChevronLeft,
  Ellipsis,
  Smile,
  Mic,
  Plus,
} from 'lucide-react-native';
import { useTheme } from '../theme';
import { getTeamChat, sendTeamMessage } from '../api';
import { getIcon } from '../components/IconMap';

export default function TeamChatScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { id, name, agentCount } = route?.params || {};
  const displayName = name || '分析群';
  const [inputText, setInputText] = useState('');
  const [agents, setAgents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getTeamChat(id);
        setAgents(data.agents || []);
        setMessages(data.messages || []);
      } catch (e) {
        console.error('Failed to fetch team chat:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;
    const text = inputText;
    setInputText('');
    setSending(true);

    // Optimistically add user message
    const tempUserMsg = { id: `tmp-${Date.now()}`, type: 'user', text };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const result = await sendTeamMessage(id, text);

      // Remove temp message, add real user msg + all agent responses + debate
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
        const newMsgs = [
          result.userMessage,
          ...result.agentMessages,
        ];
        if (result.debate) {
          newMsgs.push(result.debate);
        }
        return [...filtered, ...newMsgs];
      });

      // Update agents list if the backend returned new agent info
      if (result.agentMessages?.length) {
        // agents are already loaded from getTeamChat
      }
    } catch (e) {
      console.error('Failed to send team message:', e);
    } finally {
      setSending(false);
    }
  };

  const getAgent = (agentId) =>
    agents.find((a) => a.id === agentId) || {
      name: 'Agent',
      icon: 'brain',
      color: '#5856D6',
    };

  const renderMessage = (msg) => {
    switch (msg.type) {
      case 'time':
        return (
          <View key={msg.id} style={styles.timeDivider}>
            <Text style={[styles.timeText, { color: colors.textMuted, backgroundColor: colors.divider }]}>{msg.text}</Text>
          </View>
        );

      case 'agent': {
        const agent = getAgent(msg.agentId);
        const AgentIcon = getIcon(agent.icon);
        return (
          <View key={msg.id} style={styles.agentMsg}>
            <View
              style={[styles.agentAvatar, { backgroundColor: agent.color }]}
            >
              <AgentIcon size={16} color="#FFFFFF" />
            </View>
            <View style={styles.agentContent}>
              <View style={styles.agentNameRow}>
                <Text style={[styles.agentName, { color: colors.textPrimary }]}>{agent.name}</Text>
                <View style={[styles.aiBadge, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.aiBadgeText, { color: colors.primary }]}>AI</Text>
                </View>
              </View>
              <View style={[styles.agentBubble, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Text style={[styles.agentText, { color: colors.textPrimary }]}>{msg.text}</Text>
              </View>
            </View>
          </View>
        );
      }

      case 'user':
        return (
          <View key={msg.id} style={styles.userRow}>
            <View style={[styles.userBubble, { backgroundColor: colors.primary }]}>
              <Text style={styles.userText}>{msg.text}</Text>
            </View>
          </View>
        );

      case 'debate':
        return (
          <View key={msg.id} style={[styles.debateCard, { backgroundColor: colors.card }]}>
            {/* Header: action badge + pair name */}
            <View style={styles.debateHeader}>
              <View style={styles.actionBadge}>
                <Text style={styles.actionBadgeText}>{msg.action}</Text>
              </View>
              <Text style={[styles.debateTitle, { color: colors.textPrimary }]}>{msg.title}</Text>
            </View>

            {/* Confidence bar */}
            <View style={styles.confidenceRow}>
              <Text style={[styles.confLabel, { color: colors.textSecondary }]}>Confidence:</Text>
              <View style={[styles.confBarBg, { backgroundColor: colors.divider }]}>
                <View
                  style={[
                    styles.confBarFill,
                    { width: `${msg.confidence}%` },
                  ]}
                />
              </View>
              <Text style={styles.confValue}>{msg.confidence}%</Text>
            </View>

            {/* Summary */}
            <Text style={styles.debateSummary}>{msg.summary}</Text>

            {/* Votes */}
            <View style={styles.voteRow}>
              <Text style={styles.bullish}>{msg.bullish} Bullish</Text>
              <Text style={styles.bearish}>{msg.bearish} Bearish</Text>
            </View>

            {/* Trade execution */}
            <View style={styles.tradeBox}>
              <Text style={styles.tradeLine}>{msg.trade}</Text>
              {msg.tradePrice && (
                <Text style={[styles.tradePrice, { color: colors.textSecondary }]}>{msg.tradePrice}</Text>
              )}
            </View>

            {/* Expand report */}
            {msg.hasReport && (
              <TouchableOpacity style={styles.reportBtn}>
                <Text style={[styles.reportBtnText, { color: colors.primary }]}>展开完整报告 ▾</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Nav Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navCenter}
          onPress={() =>
            navigation.navigate('TeamDetail', {
              id,
              name: displayName,
              agentCount: agentCount || agents.length,
              icon: route?.params?.icon,
              iconBg: route?.params?.iconBg,
            })
          }
          activeOpacity={0.6}
        >
          <Text style={[styles.navTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={[styles.navSubtitle, { color: colors.textSecondary }]}>
            {agentCount || agents.length} Agents ›
          </Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Ellipsis size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Chat Area */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: false })
          }
        >
          {messages.map(renderMessage)}
          {sending && (
            <View style={styles.thinkingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.thinkingText, { color: colors.textSecondary }]}>分析师讨论中...</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Input Bar */}
      <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.cardBorder }]}>
        <TouchableOpacity>
          <Smile size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={[styles.inputField, { backgroundColor: colors.inputBg }]}>
          <TextInput
            style={[styles.textInput, { color: colors.textPrimary }]}
            placeholder="发消息或按住说话..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
        </View>
        <TouchableOpacity>
          <Mic size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.plusBtn, { backgroundColor: colors.primary }]} onPress={handleSend}>
          <Plus size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Nav ──
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 44,
  },
  navCenter: { alignItems: 'center', gap: 2 },
  navTitle: { fontSize: 16, fontWeight: '600' },
  navSubtitle: { fontSize: 12 },

  // ── Loading ──
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Chat ──
  chatArea: { flex: 1 },
  chatContent: { padding: 16, paddingTop: 8, gap: 16 },

  // ── Time divider ──
  timeDivider: { alignItems: 'center' },
  timeText: {
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },

  // ── Agent message ──
  agentMsg: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  agentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  agentContent: { flex: 1, gap: 4 },
  agentNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  agentName: { fontSize: 13, fontWeight: '600' },
  aiBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  aiBadgeText: { fontSize: 10, fontWeight: '600' },
  agentBubble: {
    borderRadius: 12,
    borderTopLeftRadius: 0,
    padding: 12,
    borderWidth: 1,
  },
  agentText: { fontSize: 14, lineHeight: 22 },

  // ── User message ──
  userRow: { alignItems: 'flex-end' },
  userBubble: {
    borderRadius: 12,
    borderTopRightRadius: 0,
    padding: 12,
    maxWidth: '80%',
  },
  userText: { fontSize: 14, color: '#FFFFFF', lineHeight: 22 },

  // ── Debate card ──
  debateCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#34C759',
    gap: 12,
  },
  debateHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionBadgeText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  debateTitle: { fontSize: 16, fontWeight: '700' },

  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confLabel: { fontSize: 13 },
  confBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  confBarFill: { height: 8, backgroundColor: '#34C759', borderRadius: 4 },
  confValue: { fontSize: 13, fontWeight: '700', color: '#34C759' },

  debateSummary: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 20,
  },
  voteRow: { flexDirection: 'row', gap: 16 },
  bullish: { fontSize: 13, fontWeight: '600', color: '#34C759' },
  bearish: { fontSize: 13, fontWeight: '600', color: '#FF3B30' },

  tradeBox: {
    backgroundColor: '#F8FFF8',
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  tradeLine: { fontSize: 13, fontWeight: '600', color: '#34C759' },
  tradePrice: { fontSize: 12 },

  reportBtn: { alignItems: 'center', paddingTop: 4 },
  reportBtnText: { fontSize: 13, fontWeight: '500' },

  // ── Thinking indicator ──
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  thinkingText: { fontSize: 13, fontStyle: 'italic' },

  // ── Input bar ──
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    gap: 10,
  },
  inputField: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  textInput: { fontSize: 14 },
  plusBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
