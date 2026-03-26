import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '@/core/theme/colors';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

const QUESTIONS = [
  "Where's the cheapest fast charger near me?",
  'Plan my trip to El Gouna with charging stops',
  "What's the difference between CCS and Type 2?",
  'Show my monthly charging cost report',
  "How's my battery health?",
  'Which provider has the best prices?',
];

interface Props {
  onSelect: (question: string) => void;
}

export function SuggestedQuestions({ onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {QUESTIONS.map((q) => (
        <TouchableOpacity key={q} style={styles.chip} onPress={() => onSelect(q)}>
          <Text style={styles.text} numberOfLines={2}>
            {q}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    maxWidth: 200,
  },
  text: { ...(typography.caption as object), color: colors.primaryDark },
});
