import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '@/core/components';
import { useTheme } from '@/core/theme';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

export function WelcomeScreen({ navigation }: any) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.hero}>
        <Text style={[styles.title, { color: colors.primary }]}>EV Charge Egypt</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Find, book & charge across all Egyptian EV providers. One app for everything.
        </Text>
      </View>
      <View style={styles.actions}>
        <Button
          title="Get Started"
          onPress={() => navigation.navigate('Register')}
          size="lg"
        />
        <Button
          title="I already have an account"
          onPress={() => navigation.navigate('Login')}
          variant="ghost"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.xl,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
    fontSize: 32,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.md,
    maxWidth: 300,
  },
  actions: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
});
