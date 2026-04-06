import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { useTheme } from '../theme';
import { useTranslation } from '../i18n';
import { spacing, borderRadius } from '../theme/spacing';
import { typography } from '../theme/typography';
import type { Badge } from '../services/badgeService';

interface BadgeUnlockModalProps {
  badge: Badge | null;
  visible: boolean;
  onDismiss: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function BadgeUnlockModal({ badge, visible, onDismiss }: BadgeUnlockModalProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && badge) {
      // Reset
      scaleAnim.setValue(0);
      glowAnim.setValue(0);
      fadeAnim.setValue(0);

      // Overlay fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Badge scale up with spring
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 6,
        useNativeDriver: true,
      }).start();

      // Glow pulse loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible, badge]);

  if (!badge) return null;

  const badgeName = t(badge.nameKey as any) || badge.name;
  const badgeDesc = t(badge.descriptionKey as any) || '';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <View style={styles.centeredContent}>
          {/* Card */}
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.primary,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Glow ring behind icon */}
            <Animated.View
              style={[
                styles.glowRing,
                {
                  backgroundColor: colors.primaryGlow,
                  opacity: glowAnim,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 30,
                },
              ]}
            />

            {/* Badge icon */}
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{badge.icon}</Text>
            </View>

            {/* Title */}
            <Text style={[styles.unlockLabel, { color: colors.primary }]}>
              {t('badge_unlocked' as any) || 'Badge Unlocked!'}
            </Text>

            {/* Badge name */}
            <Text style={[styles.badgeName, { color: colors.text }]}>
              {badgeName}
            </Text>

            {/* Description */}
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {badgeDesc}
            </Text>

            {/* Dismiss button */}
            <TouchableOpacity
              style={[styles.dismissBtn, { backgroundColor: colors.primary }]}
              onPress={onDismiss}
              activeOpacity={0.8}
            >
              <Text style={[styles.dismissText, { color: colors.background }]}>
                {t('badge_awesome' as any) || 'Awesome!'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredContent: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 340,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    overflow: 'visible',
  },
  glowRing: {
    position: 'absolute',
    top: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  icon: {
    fontSize: 56,
  },
  unlockLabel: {
    ...(typography.sectionLabel as object),
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  badgeName: {
    ...(typography.h2 as object),
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...(typography.caption as object),
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  dismissBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
    minWidth: 160,
    alignItems: 'center',
  },
  dismissText: {
    ...(typography.button as object),
  },
});
