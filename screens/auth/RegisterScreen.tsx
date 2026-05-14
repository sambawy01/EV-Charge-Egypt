import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/core/components';
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
  const [focusedField, setFocusedField] = useState<string | null>(null);
  /** Inline status surface. RN's Alert.alert no-ops in react-native-web, so we
   *  render validation errors, signup failures and the "check your email"
   *  message directly in the DOM instead of into a native alert nobody sees. */
  const [status, setStatus] = useState<
    { kind: 'success' | 'error'; message: string } | null
  >(null);
  /** In-flight submit state. Local on purpose — the global auth `isLoading`
   *  flag gates the whole RootNavigator and would unmount this screen. */
  const [submitting, setSubmitting] = useState(false);
  const { signUp } = useAuth();
  const { colors } = useTheme();

  const handleRegister = async () => {
    setStatus(null);

    if (!fullName.trim()) {
      setStatus({ kind: 'error', message: 'Please enter your name.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus({ kind: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    if (password.length < 8) {
      setStatus({ kind: 'error', message: 'Password must be at least 8 characters.' });
      return;
    }

    setSubmitting(true);
    try {
      const result = await signUp(email, password, fullName.trim(), role);
      if (result.status === 'confirm_email') {
        // No session yet — the user must confirm their email before signing in.
        setStatus({
          kind: 'success',
          message: `Almost there! We sent a confirmation link to ${result.email}. Tap it to activate your account, then sign in.`,
        });
      }
      // result.status === 'active' → RootNavigator switches into the app.
    } catch (e: any) {
      setStatus({
        kind: 'error',
        message: e?.message || 'Registration failed. Please try again.',
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

  const roles: { key: UserRole; label: string; icon: string }[] = [
    { key: 'driver', label: 'Driver', icon: '\uD83D\uDE97' },
    { key: 'fleet_manager', label: 'Fleet Manager', icon: '\uD83C\uDFE2' },
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
            <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Join Egypt's EV revolution
            </Text>
          </View>

          {/* Role selector */}
          <View style={styles.roleSection}>
            <Text
              style={[
                styles.label,
                { color: colors.textSecondary, marginBottom: spacing.sm },
              ]}
            >
              I am a...
            </Text>
            <View style={styles.roleRow}>
              {roles.map((r) => {
                const isSelected = role === r.key;
                return (
                  <TouchableOpacity
                    key={r.key}
                    onPress={() => setRole(r.key)}
                    activeOpacity={0.7}
                    style={[
                      styles.roleCard,
                      {
                        backgroundColor: isSelected
                          ? colors.primaryLight
                          : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                        ...(isSelected
                          ? {
                              shadowColor: colors.primary,
                              shadowOffset: { width: 0, height: 0 },
                              shadowOpacity: 0.3,
                              shadowRadius: 14,
                              elevation: 6,
                            }
                          : {}),
                      },
                    ]}
                  >
                    <Text style={styles.roleIcon}>{r.icon}</Text>
                    <Text
                      style={[
                        styles.roleLabel,
                        {
                          color: isSelected ? colors.primary : colors.textSecondary,
                        },
                      ]}
                    >
                      {r.label}
                    </Text>
                    {isSelected && (
                      <View style={[styles.roleCheck, { backgroundColor: colors.primary }]}>
                        <Text style={styles.roleCheckMark}>{'\u2713'}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Form fields */}
          <View style={styles.form}>
            {/* Name field */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
              <View style={getInputStyle('name')}>
                <Text style={styles.inputIcon}>{'\uD83D\uDC64'}</Text>
                <TextInput
                  style={[styles.inputText, { color: colors.text }]}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Ahmed Hassan"
                  placeholderTextColor={colors.textTertiary}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

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
              <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
              <View style={getInputStyle('password')}>
                <Text style={styles.inputIcon}>{'\uD83D\uDD12'}</Text>
                <TextInput
                  style={[styles.inputText, { color: colors.text }]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="Min 8 characters"
                  placeholderTextColor={colors.textTertiary}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Inline status banner — validation errors, signup failures, or
                the "check your email" confirmation message. */}
            {status && (
              <View
                style={[
                  styles.statusBanner,
                  {
                    backgroundColor:
                      status.kind === 'success' ? '#00FF8815' : '#FF4D6A15',
                    borderColor:
                      status.kind === 'success' ? '#00FF88' : '#FF4D6A',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: status.kind === 'success' ? '#00FF88' : '#FF4D6A' },
                  ]}
                >
                  {status.message}
                </Text>
              </View>
            )}

            {/* Create account button */}
            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={submitting}
              size="lg"
              style={styles.createButton}
            />
          </View>

          {/* Bottom link */}
          <View style={styles.bottomLink}>
            <Text style={[styles.bottomText, { color: colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.bottomLinkAccent, { color: colors.primary }]}>Sign In</Text>
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
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
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
  // Role selector
  roleSection: {
    marginBottom: spacing.lg,
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  roleCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    borderWidth: 2,
    position: 'relative',
  },
  roleIcon: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  roleLabel: {
    ...typography.bodyBold,
    fontSize: 14,
  },
  roleCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCheckMark: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
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
  createButton: {
    width: '100%',
    marginTop: spacing.sm,
  },
  // Inline status banner
  statusBanner: {
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
