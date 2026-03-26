import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { ChevronLeft, Ellipsis, Smile, Mic, Send } from 'lucide-react-native';
import { colors } from '../theme';
import { getAgentChat, sendAgentMessage } from '../api';

export default function AgentChatScreen({ navigation, route }) {
  const { id, name } = route?.params || {};
  const displayName = name || 'Agent';
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getAgentChat(id);
        setMessages(data);
      } catch (e) {
        console.error('Failed to fetch agent messages:', e);
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
      const { userMessage, agentMessage } = await sendAgentMessage(id, text);
      // Replace temp with real messages
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        userMessage,
        agentMessage,
      ]);
    } catch (e) {
      console.error('Failed to send:', e);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = (msg) => {
    if (msg.type === 'time') {
      return (
        <View key={msg.id} style={styles.timeDivider}>
          <Text style={styles.timeText}>{msg.text}</Text>
        </View>
      );
    }
    if (msg.type === 'user') {
      return (
        <View key={msg.id} style={styles.userRow}>
          <View style={styles.userBubble}>
            <Text style={styles.userText}>{msg.text}</Text>
          </View>
        </View>
      );
    }
    // agent message (1-on-1, no avatar needed — agent name is in nav)
    return (
      <View key={msg.id} style={styles.agentRow}>
        <View style={styles.agentBubble}>
          <Text style={styles.agentText}>{msg.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Nav Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          {displayName}
        </Text>
        <TouchableOpacity>
          <Ellipsis size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Chat */}
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
              <Text style={styles.thinkingText}>思考中...</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Input */}
      <View style={styles.inputBar}>
        <TouchableOpacity>
          <Smile size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.inputField}>
          <TextInput
            style={styles.textInput}
            placeholder="输入消息..."
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
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <Send size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 44,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  chatArea: { flex: 1 },
  chatContent: { padding: 16, paddingTop: 8, gap: 12 },
  timeDivider: { alignItems: 'center' },
  timeText: {
    fontSize: 12,
    color: colors.textMuted,
    backgroundColor: colors.divider,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  thinkingText: { fontSize: 13, color: colors.textSecondary, fontStyle: 'italic' },
  agentRow: { alignItems: 'flex-start' },
  agentBubble: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 12,
    maxWidth: '85%',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  agentText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  userRow: { alignItems: 'flex-end' },
  userBubble: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    borderTopRightRadius: 4,
    padding: 12,
    maxWidth: '80%',
  },
  userText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    gap: 10,
  },
  inputField: {
    flex: 1,
    height: 36,
    backgroundColor: colors.inputBg,
    borderRadius: 18,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  textInput: { fontSize: 14, color: colors.textPrimary },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
