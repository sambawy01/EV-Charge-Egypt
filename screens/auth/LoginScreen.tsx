import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Button, Header } from '@/core/components';
import { useAuth } from '@/core/auth/useAuth';
import { useTheme } from '@/core/theme';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, isLoading } = useAuth();
  const { colors } = useTheme();

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

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header title="Sign In" onBack={() => navigation.goBack()} />
      <View style={styles.form}>
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
          placeholder="Enter password"
          placeholderTextColor={colors.textTertiary}
        />
        <Button
          title="Sign In"
          onPress={handleLogin}
          loading={isLoading}
          size="lg"
          style={{ marginTop: spacing.lg }}
        />
      </View>
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
