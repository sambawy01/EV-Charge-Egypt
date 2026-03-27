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
import { LinearGradient } from 'expo-linear-gradient';
import { ChatMessage as ChatMessageComponent } from '../components/ChatMessage';
import { SuggestedQuestions } from '../components/SuggestedQuestions';
import { useAIChat } from '@/core/queries/useAIChat';
import { useAIStore } from '@/core/stores/aiStore';
import { useTheme } from '@/core/theme';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

export function AIAssistantScreen({ navigation }: any) {
  const { colors } = useTheme();
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
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Custom AI Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.aiIconWrap,
              {
                backgroundColor: colors.primaryLight,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 12,
                elevation: 8,
              },
            ]}
          >
            <Text style={[styles.aiIconText, { color: colors.primary }]}>
              AI
            </Text>
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Charge AI
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => useAIStore.getState().clearConversation()}
        >
          <Text style={[styles.clearBtn, { color: colors.primary }]}>
            Clear
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={styles.messagePadding}>
            {item.role === 'user' ? (
              <View style={styles.userBubbleWrap}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.userBubble}
                >
                  <Text style={styles.userBubbleText}>{item.content}</Text>
                </LinearGradient>
              </View>
            ) : (
              <View
                style={[
                  styles.aiBubble,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.aiBubbleText, { color: colors.text }]}>
                  {item.content}
                </Text>
              </View>
            )}
          </View>
        )}
        ListHeaderComponent={
          messages.length === 0 ? (
            <View style={styles.welcome}>
              <View
                style={[
                  styles.welcomeIconWrap,
                  {
                    backgroundColor: colors.primaryLight,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.5,
                    shadowRadius: 20,
                    elevation: 10,
                  },
                ]}
              >
                <Text style={[styles.welcomeIcon, { color: colors.primary }]}>
                  AI
                </Text>
              </View>
              <Text style={[styles.welcomeTitle, { color: colors.primary }]}>
                Hi! I'm Charge AI
              </Text>
              <Text
                style={[
                  styles.welcomeText,
                  { color: colors.textSecondary },
                ]}
              >
                Ask me anything about EV charging in Egypt.
              </Text>
              <SuggestedQuestions onSelect={handleSend} />
            </View>
          ) : undefined
        }
        ListFooterComponent={
          isTyping ? (
            <View style={styles.typing}>
              <Text
                style={[
                  styles.typingText,
                  { color: colors.primary },
                ]}
              >
                Charge AI is thinking...
              </Text>
            </View>
          ) : undefined
        }
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {/* Input Bar */}
      <View
        style={[
          styles.inputBar,
          { backgroundColor: colors.surface },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              backgroundColor: colors.surfaceSecondary,
            },
          ]}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about charging, routes, costs..."
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={500}
          onSubmitEditing={() => handleSend()}
        />
        <TouchableOpacity
          onPress={() => handleSend()}
          disabled={!input.trim() || chatMutation.isPending}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={
              input.trim()
                ? [colors.primary, colors.primaryDark]
                : [colors.surfaceTertiary, colors.surfaceTertiary]
            }
            style={styles.sendBtn}
          >
            <Text
              style={[
                styles.sendText,
                { opacity: input.trim() ? 1 : 0.4 },
              ]}
            >
              ^
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xxl + spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  aiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  aiIconText: {
    ...(typography.mono as object),
    fontSize: 13,
    fontWeight: '700',
  },
  headerTitle: { ...(typography.h3 as object) },
  clearBtn: { ...(typography.caption as object) },
  messages: { paddingBottom: spacing.md },
  messagePadding: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  userBubbleWrap: { alignItems: 'flex-end' },
  userBubble: {
    borderRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    maxWidth: '80%',
  },
  userBubbleText: {
    ...(typography.body as object),
    color: '#FFFFFF',
  },
  aiBubble: {
    borderRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    maxWidth: '85%',
    alignSelf: 'flex-start',
  },
  aiBubbleText: { ...(typography.body as object) },
  welcome: { alignItems: 'center', padding: spacing.xl, paddingTop: spacing.xxl },
  welcomeIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  welcomeIcon: {
    ...(typography.h2 as object),
    fontWeight: '700',
  },
  welcomeTitle: {
    ...(typography.h2 as object),
  },
  welcomeText: {
    ...(typography.body as object),
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  typing: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  typingText: {
    ...(typography.caption as object),
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  input: {
    flex: 1,
    ...(typography.body as object),
    borderRadius: 24,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    maxHeight: 100,
    marginRight: spacing.sm,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    transform: [{ rotate: '0deg' }],
  },
});
