import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { Header } from '@/core/components';
import { SettingsRow } from '../components/SettingsRow';
import { useAuthStore } from '@/core/stores/authStore';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

export function SettingsScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState(user?.preferred_lang || 'en');

  return (
    <View style={styles.container}>
      <Header title="Settings" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>General</Text>
        <SettingsRow
          icon="🌐"
          label="Language"
          value={language === 'ar' ? 'العربية' : 'English'}
          onPress={() => setLanguage((l) => (l === 'en' ? 'ar' : 'en'))}
        />
        <SettingsRow
          icon="🔔"
          label="Push Notifications"
          isSwitch
          switchValue={notifications}
          onToggle={setNotifications}
        />

        <Text style={styles.section}>About</Text>
        <SettingsRow icon="ℹ️" label="App Version" value="1.0.0" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
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
