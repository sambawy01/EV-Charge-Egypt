import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Button, Header } from '@/core/components';
import { useAuth } from '@/core/auth/useAuth';
import { useTheme } from '@/core/theme';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import type { UserRole } from '@/core/types/auth';

export function RegisterScreen({ navigation }: any) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('driver');
  const { signUp, isLoading } = useAuth();
  const { colors } = useTheme();

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      await signUp(email, password, fullName, role);
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header title="Create Account" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.form} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>I am a...</Text>
        <View style={styles.roleRow}>
          {(['driver', 'fleet_manager'] as UserRole[]).map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRole(r)}
              style={[
                styles.roleCard,
                {
                  borderColor: role === r ? colors.primary : colors.border,
                  backgroundColor: role === r ? colors.primaryLight : colors.surface,
                },
              ]}
            >
              <Text style={styles.roleIcon}>{r === 'driver' ? '\u{1F697}' : '\u{1F3E2}'}</Text>
              <Text
                style={[
                  styles.roleLabel,
                  { color: role === r ? colors.primary : colors.textSecondary },
                ]}
              >
                {r === 'driver' ? 'Driver' : 'Fleet Manager'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Ahmed Hassan"
          placeholderTextColor={colors.textTertiary}
        />
        <Text style={[styles.label, { color: colors.text }]}>Email</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="your@email.com"
          placeholderTextColor={colors.textTertiary}
        />
        <Text style={[styles.label, { color: colors.text }]}>Password</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Min 8 characters"
          placeholderTextColor={colors.textTertiary}
        />
        <Button
          title="Create Account"
          onPress={handleRegister}
          loading={isLoading}
          size="lg"
          style={{ marginTop: spacing.xl }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    flex: 1,
    padding: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  roleCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
  },
  roleIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  roleLabel: {
    ...typography.bodyBold,
  },
  label: {
    ...typography.bodyBold,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
  },
});
