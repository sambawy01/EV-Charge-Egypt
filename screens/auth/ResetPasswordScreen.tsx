import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/core/components';
import { useTheme } from '@/core/theme';
import { supabase } from '@/core/config/supabase';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import { isValidPassword } from '@/core/utils/validators';
import { useAuthStore } from '@/core/stores/authStore';

/**
 * ResetPasswordScreen
 *
 * Reached automatically after the user clicks the password-reset email link.
 * Supabase JS (with detectSessionInUrl enabled on web) parses the recovery
 * tokens from the URL hash and fires a PASSWORD_RECOVERY auth event, which
 * AuthProvider intercepts to route the user here. At this point we have a
 * valid Supabase session in the "recovery" state, so calling updateUser
 * with a new password persists it without re-authenticating.
 *
 * If the user opens this screen without a recovery session (e.g. direct URL
 * paste), the updateUser call fails with 401 and we surface that error.
 */
export function ResetPasswordScreen({ navigation }: any) {
  const { colors } = useTheme();
  const setPasswordRecovery = useAuthStore((s) => s.setPasswordRecovery);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!isValidPassword(password)) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Mismatch', 'Both passwords must match.');
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      // Clean the `?recovery=1` query param out of the URL on web so a refresh
      // doesn't re-trigger the reset flow.
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('recovery');
        url.hash = '';
        window.history.replaceState({}, '', url.toString());
      }
      Alert.alert(
        'Password Updated',
        'Your password has been changed. You are now signed in.',
        [{ text: 'OK' }],
      );
      // Clear the recovery flag: the user has a normal session now and the
      // RootNavigator should route them to the driver/fleet stack.
      setPasswordRecovery(false);
    } catch (e: any) {
      Alert.alert(
        'Could Not Update Password',
        e.message ||
          'The reset link may have expired. Request a new one from the login screen.',
      );
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = (field: string) => [
    styles.input,
    {
      backgroundColor: colors.surface,
      borderColor: focusedField === field ? colors.primary : colors.border,
      color: colors.text,
    },
  ];

  return (
    <LinearGradient
      colors={[colors.background, colors.surfaceSecondary, colors.background]}
      locations={[0, 0.5, 1]}
      style={styles.root}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <Text style={[styles.bolt, { color: colors.primary }]}>{'⚡'}</Text>
            <Text style={[styles.title, { color: colors.text }]}>Set new password</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Choose a password you have not used elsewhere. At least 8 characters.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>New password</Text>
            <TextInput
              style={inputStyle('password')}
              value={password}
              onChangeText={setPassword}
              placeholder="Min 8 characters"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              returnKeyType="next"
            />

            <Text style={[styles.label, { color: colors.textSecondary, marginTop: spacing.md }]}>
              Confirm password
            </Text>
            <TextInput
              style={inputStyle('confirm')}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Type it again"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              onFocus={() => setFocusedField('confirm')}
              onBlur={() => setFocusedField(null)}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            <Button
              title="Update password"
              onPress={handleSubmit}
              size="lg"
              loading={busy}
              style={{ marginTop: spacing.lg }}
            />

            <Button
              title="Back to sign in"
              onPress={() => navigation.navigate('Login')}
              variant="ghost"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 100,
    paddingBottom: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  bolt: {
    fontSize: 56,
    lineHeight: 64,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    fontSize: 30,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    fontSize: 14,
    marginTop: spacing.sm,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
  },
  form: {
    gap: 4,
  },
  label: {
    ...typography.caption,
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
  },
});
