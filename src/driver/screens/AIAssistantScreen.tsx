import React, { useState, useRef } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Header } from '@/core/components';
import { ChatMessage as ChatMessageComponent } from '../components/ChatMessage';
import { SuggestedQuestions } from '../components/SuggestedQuestions';
import { useAIChat } from '@/core/queries/useAIChat';
import { useAIStore } from '@/core/stores/aiStore';
import { colors } from '@/core/theme/colors';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

export function AIAssistantScreen({ navigation }: any) {
  const [input, setInput] = useState('');
  const { messages, isTyping } = useAIStore();
  const chatMutation = useAIChat();
  const flatListRef = useRef<FlatList>(null);

  const handleSend = async (text?: string) => {
    const message = text || input.trim();
    if (!message) return;
    setInput('');
    await chatMutation.mutateAsync(message);
    setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title="Charge AI"
        rightAction={
          <TouchableOpacity onPress={() => useAIStore.getState().clearConversation()}>
            <Text style={styles.clearBtn}>Clear</Text>
          </TouchableOpacity>
        }
      />
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <ChatMessageComponent
            role={item.role}
            content={item.content}
            timestamp={item.timestamp}
          />
        )}
        ListHeaderComponent={
          messages.length === 0 ? (
            <View style={styles.welcome}>
              <Text style={styles.welcomeTitle}>Hi! I'm Charge AI</Text>
              <Text style={styles.welcomeText}>
                Ask me anything about EV charging in Egypt.
              </Text>
              <SuggestedQuestions onSelect={handleSend} />
            </View>
          ) : undefined
        }
        ListFooterComponent={
          isTyping ? (
            <View style={styles.typing}>
              <Text style={styles.typingText}>Charge AI is thinking...</Text>
            </View>
          ) : undefined
        }
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about charging, routes, costs..."
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={500}
          onSubmitEditing={() => handleSend()}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={() => handleSend()}
          disabled={!input.trim() || chatMutation.isPending}
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  messages: { paddingBottom: spacing.md },
  welcome: { alignItems: 'center', padding: spacing.xl },
  welcomeTitle: { ...(typography.h2 as object), color: colors.primaryDark },
  welcomeText: {
    ...(typography.body as object),
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  typing: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  typingText: { ...(typography.caption as object), color: colors.accent, fontStyle: 'italic' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    ...(typography.body as object),
    color: colors.text,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    marginRight: spacing.sm,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendText: { color: colors.white, fontWeight: '600' },
  clearBtn: { ...(typography.caption as object), color: colors.primary },
});
