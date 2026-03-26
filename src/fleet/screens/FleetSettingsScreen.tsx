import React from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { Header } from '@/core/components';
import { SettingsRow } from '@/driver/components/SettingsRow';
import { useFleetStore } from '@/core/stores/fleetStore';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

const MOCK_FLEET = {
  company_name: 'Al-Nour Transport Co.',
  plan: 'business' as const,
  credit_balance: 45000,
  auto_topup_threshold: 5000,
};

export function FleetSettingsScreen({ navigation }: any) {
  const fleet = useFleetStore((s) => s.fleet) || MOCK_FLEET;

  return (
    <View style={styles.container}>
      <Header title="Fleet Settings" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>Credits</Text>
        <SettingsRow icon="💰" label="Top Up Credits" onPress={() => navigation.navigate('CreditTopUp')} />
        <SettingsRow
          icon="🔄"
          label="Auto Top-Up"
          value={fleet.auto_topup_threshold ? 'On' : 'Off'}
          onPress={() => {}}
        />

        <Text style={styles.section}>Team</Text>
        <SettingsRow
          icon="👥"
          label="Manage Members"
          onPress={() => navigation.navigate('MemberManagement')}
        />

        <Text style={styles.section}>Subscription</Text>
        <SettingsRow
          icon="📋"
          label="Billing & Plan"
          value={(fleet.plan || 'starter').toUpperCase()}
          onPress={() => navigation.navigate('Billing')}
        />

        <Text style={styles.section}>Company</Text>
        <SettingsRow icon="🏢" label="Company Name" value={fleet.company_name} />
        <SettingsRow icon="📧" label="Contact Support" onPress={() => {}} />
        <SettingsRow icon="📖" label="Fleet API Docs" onPress={() => {}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  section: {
    ...(typography.bodyBold as object),
    color: colors.textSecondary,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 1,
  },
});
