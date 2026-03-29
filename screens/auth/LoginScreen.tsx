import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
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
  const { signIn, isLoading } = useAuth();
  const { colors } = useTheme();

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address first.');
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      Alert.alert('Password Reset', 'Check your email for a password reset link.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not send reset email.');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      await signIn(email, password);
    } catch (e: any) {
      Alert.alert('Login Failed', e.message);
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
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={[styles.forgotLink, { color: colors.primary }]}>
                    Forgot password?
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
            </View>

            {/* Sign in button */}
            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
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
