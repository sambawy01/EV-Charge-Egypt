import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/core/components';
import { useAuth } from '@/core/auth/useAuth';
import { useTheme } from '@/core/theme';
import { supabase } from '@/core/config/supabase';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [forgotBusy, setForgotBusy] = useState(false);
  /** In-flight state for the Sign In button. Local on purpose — the global
   *  auth `isLoading` flag gates the whole RootNavigator and would unmount
   *  this screen mid-request. */
  const [submitting, setSubmitting] = useState(false);
  /** Inline status surface shared by the login and forgot-password flows.
   *  RN's Alert.alert no-ops in react-native-web, so we render feedback in
   *  the DOM directly instead of into a native alert nobody sees. */
  const [status, setStatus] = useState<
    { kind: 'success' | 'error'; message: string } | null
  >(null);
  const { signIn } = useAuth();
  const { colors } = useTheme();

  const handleForgotPassword = async () => {
    console.log('[forgot-password] tapped');
    if (forgotBusy) return; // prevent double-fire
    setStatus(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setStatus({
        kind: 'error',
        message: 'Type your email above first, then tap "Forgot password?" again.',
      });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus({
        kind: 'error',
        message: 'That doesn’t look like a valid email address.',
      });
      return;
    }
    setForgotBusy(true);
    try {
      // redirectTo must be on the project's "Redirect URLs" allowlist in
      // Supabase Auth → URL Configuration. Match wildcards: /** is required.
      const redirectTo =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? `${window.location.origin}/?recovery=1`
          : 'wattsonev://reset-password';
      console.log('[forgot-password] sending reset for', trimmed, '→', redirectTo);
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo,
      });
      if (error) {
        console.error('[forgot-password] supabase error:', error);
        throw error;
      }
      console.log('[forgot-password] success');
      setStatus({
        kind: 'success',
        message: `Sent. Check ${trimmed} for a reset link (valid 1 hour). Look in spam if you don’t see it.`,
      });
    } catch (err: any) {
      console.error('[forgot-password] caught:', err);
      setStatus({
        kind: 'error',
        message: err?.message || 'Could not send reset email. Try again in a minute.',
      });
    } finally {
      setForgotBusy(false);
    }
  };

  const handleLogin = async () => {
    setStatus(null);
    if (!email || !password) {
      setStatus({ kind: 'error', message: 'Please fill in your email and password.' });
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email, password);
      // Success → RootNavigator switches into the app automatically.
    } catch (e: any) {
      setStatus({
        kind: 'error',
        message: e?.message || 'Login failed. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getInputStyle = (field: string) => [
    styles.input,
    {
      backgroundColor: colors.surface,
      borderColor: focusedField === field ? colors.primary : colors.border,
      color: colors.text,
      ...(focusedField === field
        ? {
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 4,
          }
        : {}),
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
          {/* Back arrow */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={[styles.backArrow, { color: colors.text }]}>{'\u2190'}</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sign in to continue charging
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email field */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
              <View style={getInputStyle('email')}>
                <Text style={styles.inputIcon}>{'\u2709'}</Text>
                <TextInput
                  style={[styles.inputText, { color: colors.text }]}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="your@email.com"
                  placeholderTextColor={colors.textTertiary}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Password field */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
                <TouchableOpacity
                  onPress={handleForgotPassword}
                  disabled={forgotBusy}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text
                    style={[
                      styles.forgotLink,
                      { color: forgotBusy ? colors.textTertiary : colors.primary },
                    ]}
                  >
                    {forgotBusy ? 'Sending\u2026' : 'Forgot password?'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={getInputStyle('password')}>
                <Text style={styles.inputIcon}>{'\uD83D\uDD12'}</Text>
                <TextInput
                  style={[styles.inputText, { color: colors.text }]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="Enter password"
                  placeholderTextColor={colors.textTertiary}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              {status && (
                <View
                  style={[
                    styles.statusBanner,
                    {
                      backgroundColor:
                        status.kind === 'success'
                          ? '#00FF8815'
                          : '#FF4D6A15',
                      borderColor:
                        status.kind === 'success' ? '#00FF88' : '#FF4D6A',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          status.kind === 'success' ? '#00FF88' : '#FF4D6A',
                      },
                    ]}
                  >
                    {status.message}
                  </Text>
                </View>
              )}
            </View>

            {/* Sign in button */}
            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={submitting}
              size="lg"
              style={styles.signInButton}
            />
          </View>

          {/* Bottom link */}
          <View style={styles.bottomLink}>
            <Text style={[styles.bottomText, { color: colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.bottomLinkAccent, { color: colors.primary }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    paddingBottom: spacing.xl,
  },
  // Back button
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -spacing.sm,
  },
  backArrow: {
    fontSize: 28,
    lineHeight: 32,
  },
  // Header
  header: {
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.8,
  },
  subtitle: {
    ...typography.body,
    fontSize: 16,
    marginTop: spacing.sm,
  },
  // Form
  form: {
    gap: spacing.lg,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  label: {
    ...typography.caption,
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotLink: {
    ...typography.caption,
    fontSize: 13,
  },
  statusBanner: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusText: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
  },
  // Input
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 18,
    gap: spacing.sm,
  },
  inputIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  inputText: {
    flex: 1,
    ...typography.body,
    fontSize: 16,
    padding: 0,
    margin: 0,
  },
  // Button
  signInButton: {
    width: '100%',
    marginTop: spacing.sm,
  },
  // Bottom
  bottomLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto' as any,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  bottomText: {
    ...typography.body,
  },
  bottomLinkAccent: {
    ...typography.bodyBold,
  },
});
