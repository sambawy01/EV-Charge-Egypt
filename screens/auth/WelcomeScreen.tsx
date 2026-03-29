import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/core/components';
import { useTheme } from '@/core/theme';
import { useAuthStore } from '@/core/stores/authStore';
import { useTranslation } from '@/core/i18n';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

export function WelcomeScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { setUser } = useAuthStore();
  const { t, isRTL } = useTranslation();

  const handleDemoMode = () => {
    setUser({
      id: 'demo-user',
      role: 'driver',
      full_name: 'Demo Driver',
      phone: null,
      avatar_url: null,
      preferred_lang: 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any);
  };
  const glowAnim = useRef(new Animated.Value(0.6)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Pulsing glow on the lightning bolt
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.6,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={[colors.background, colors.surfaceSecondary, colors.background]}
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      {/* Background decorative orbs */}
      <View
        style={[
          styles.orb,
          styles.orbTopRight,
          { backgroundColor: colors.primaryGlow },
        ]}
      />
      <View
        style={[
          styles.orb,
          styles.orbBottomLeft,
          { backgroundColor: colors.secondaryGlow },
        ]}
      />
      <View
        style={[
          styles.orb,
          styles.orbCenter,
          { backgroundColor: colors.primaryGlow },
        ]}
      />

      {/* Hero content */}
      <Animated.View
        style={[
          styles.hero,
          { opacity: fadeIn, transform: [{ translateY: slideUp }] },
        ]}
      >
        {/* Glowing lightning bolt icon */}
        <Animated.View style={[styles.iconContainer, { opacity: glowAnim }]}>
          <Text
            style={[
              styles.boltIcon,
              {
                color: colors.primary,
                textShadowColor: colors.primaryGlow,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 30,
              },
            ]}
          >
            {'\u26A1'}
          </Text>
        </Animated.View>

        {/* App name */}
        <Text style={[styles.title, { color: colors.primary }]}>{t('welcome_title')}</Text>
        <Text style={[styles.country, { color: colors.secondary }]}>Egypt</Text>

        {/* Gradient separator */}
        <LinearGradient
          colors={['transparent', colors.primaryGlow, 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.separator}
        />

        {/* Tagline */}
        <Text style={[styles.tagline, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'center' }]}>
          {t('welcome_subtitle')}
        </Text>

        {/* Gradient separator */}
        <LinearGradient
          colors={['transparent', colors.primaryGlow, 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.separator}
        />

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.primary }]}>100+</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t('stations_in_egypt')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.primary }]}>12</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t('verified')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.primary }]}>24/7</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t('available')}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Bottom actions */}
      <Animated.View style={[styles.actions, { opacity: fadeIn }]}>
        <Button
          title={t('get_started')}
          onPress={() => navigation.navigate('Register')}
          size="lg"
          style={styles.primaryButton}
        />
        <Button
          title={t('already_have_account')}
          onPress={() => navigation.navigate('Login')}
          variant="ghost"
        />
        <TouchableOpacity onPress={handleDemoMode} style={{ marginTop: 8, alignItems: 'center' }}>
          <Text style={{ ...typography.caption, color: colors.primary, textDecorationLine: 'underline' }}>
            {t('explore_demo')}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 80,
    paddingBottom: spacing.xl,
  },
  // Background orbs
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orbTopRight: {
    width: 260,
    height: 260,
    top: -60,
    right: -80,
    opacity: 0.35,
  },
  orbBottomLeft: {
    width: 200,
    height: 200,
    bottom: 120,
    left: -70,
    opacity: 0.25,
  },
  orbCenter: {
    width: 140,
    height: 140,
    top: '40%' as any,
    left: '50%' as any,
    marginLeft: -70,
    opacity: 0.12,
  },
  // Hero
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  boltIcon: {
    fontSize: 80,
    lineHeight: 96,
  },
  title: {
    ...typography.h1,
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: -1,
    textAlign: 'center',
  },
  country: {
    ...typography.h2,
    fontSize: 26,
    marginTop: spacing.xs,
    letterSpacing: 4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  separator: {
    width: 180,
    height: 1,
    marginVertical: spacing.lg,
  },
  tagline: {
    ...typography.body,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 320,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  stat: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  statValue: {
    ...typography.mono,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.caption,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    opacity: 0.4,
  },
  // Actions
  actions: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  primaryButton: {
    width: '100%',
  },
});
