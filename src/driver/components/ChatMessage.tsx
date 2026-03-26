import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/core/theme/colors';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

interface Props {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function ChatMessage({ role, content, timestamp }: Props) {
  const isUser = role === 'user';
  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>AI</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.assistantText]}>
          {content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  userContainer: { justifyContent: 'flex-end' },
  assistantContainer: { justifyContent: 'flex-start' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  bubble: { maxWidth: '75%', padding: spacing.md, borderRadius: borderRadius.lg },
  userBubble: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  assistantBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: { ...(typography.body as object), lineHeight: 22 },
  userText: { color: colors.white },
  assistantText: { color: colors.text },
});
