import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { Avatar, LoadingScreen } from '@/core/components';
import { useAuthStore } from '@/core/stores/authStore';
import { useChargingStats } from '@/core/queries/useProfile';
import { useAuth } from '@/core/auth/useAuth';
import { formatEGP, formatKWh } from '@/core/utils/formatCurrency';
import { useTheme } from '@/core/theme';
import { useTranslation } from '@/core/i18n';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import { badgeService, type BadgeProgress } from '@/core/services/badgeService';

export function ProfileScreen({ navigation }: any) {
  const { colors, isDark, toggleTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const { signOut } = useAuth();
  const { data: stats } = useChargingStats();
  const { t, lang, setLanguage, isRTL } = useTranslation();

  const [badgeProgress, setBadgeProgress] = useState<BadgeProgress[]>([]);

  useEffect(() => {
    if (user?.id) {
      badgeService.getBadgeProgress(user.id).then(setBadgeProgress).catch(() => {});
    }
  }, [user?.id]);

  const toggleLang = async () => {
    const next = lang === 'en' ? 'ar' : 'en';
    await setLanguage(next);
  };

  if (!user) return <LoadingScreen />;

  const earnedCount = badgeProgress.filter((bp) => !!bp.badge.unlockedAt).length;

  const menuItems = [
    { label: t('my_vehicles'), icon: '🚗', screen: 'Vehicle' },
    { label: t('home_charger_my_chargers'), icon: '🏠', screen: 'MyHomeChargers' },
    { label: t('cost_calculator'), icon: '🧮', screen: 'CostCalculator' },
    { label: t('charging_statistics'), icon: '📊', screen: 'ChargingStats' },
    { label: t('favorites'), icon: '⭐', screen: 'Favorites' },
    { label: t('settings'), icon: '⚙️', screen: 'Settings' },
  ];

  const statItems = [
    {
      label: t('trips'),
      value: stats?.totalSessions?.toString() || '0',
      color: colors.primary,
    },
    {
      label: t('kwh'),
      value: stats ? formatKWh(stats.totalKwh) : '0',
      color: colors.primary,
    },
    {
      label: t('saved'),
      value: stats ? `${stats.co2SavedKg.toFixed(0)} kg` : '0',
      color: colors.secondary,
    },
    {
      label: t('badges_label' as any) || 'Badges',
      value: `${earnedCount}/10`,
      color: colors.warning,
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Profile Header */}
      <View style={styles.profileSection}>
        <View
          style={[
            styles.avatarWrap,
            {
              borderColor: colors.primary,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 15,
              elevation: 10,
            },
          ]}
        >
          <Avatar name={user.full_name} uri={user.avatar_url} size={80} />
        </View>
        <Text style={[styles.name, { color: colors.text }]}>
          {user.full_name}
        </Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>
          {user.email || (user.role === 'driver' ? 'EV Driver' : 'Fleet Manager')}
        </Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {statItems.map((stat) => (
          <View
            key={stat.label}
            style={[
              styles.statCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.statValue, { color: stat.color }]}>
              {stat.value}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Badges Section */}
      <View style={styles.badgesSection}>
        <Text style={[styles.badgesSectionTitle, { color: colors.text }]}>
          {t('badges_title' as any) || 'Badges'}
        </Text>
        <View style={styles.badgesGrid}>
          {badgeProgress.map((bp) => {
            const isUnlocked = !!bp.badge.unlockedAt;
            const badgeName = t(bp.badge.nameKey as any) || bp.badge.name;
            return (
              <View
                key={bp.badge.id}
                style={[
                  styles.badgeCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isUnlocked ? colors.primary : colors.border,
                    ...(isUnlocked
                      ? {
                          shadowColor: colors.primary,
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.35,
                          shadowRadius: 10,
                          elevation: 6,
                        }
                      : {}),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeIcon,
                    { opacity: isUnlocked ? 1 : 0.3 },
                  ]}
                >
                  {bp.badge.icon}
                </Text>
                <Text
                  style={[
                    styles.badgeName,
                    {
                      color: isUnlocked ? colors.text : colors.textTertiary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {badgeName}
                </Text>
                {isUnlocked ? (
                  <Text style={[styles.badgeDate, { color: colors.primary }]}>
                    {new Date(bp.badge.unlockedAt!).toLocaleDateString()}
                  </Text>
                ) : (
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBarBg,
                        { backgroundColor: colors.surfaceTertiary },
                      ]}
                    >
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            backgroundColor: colors.primary,
                            width: `${bp.percentage}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.progressText,
                        { color: colors.textTertiary },
                      ]}
                    >
                      {bp.current}/{bp.target}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menu}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={[
              styles.menuItem,
              {
                backgroundColor: colors.surface,
                borderBottomColor: colors.border,
              },
            ]}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={[styles.menuLabel, { color: colors.text }]}>
              {item.label}
            </Text>
            <Text style={[styles.menuArrow, { color: colors.textTertiary }]}>
              ›
            </Text>
          </TouchableOpacity>
        ))}

        {/* Dark Mode Toggle */}
        <View
          style={[
            styles.menuItem,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Text style={styles.menuIcon}>🌙</Text>
          <Text style={[styles.menuLabel, { color: colors.text }]}>
            {t('dark_mode')}
          </Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{
              false: colors.surfaceTertiary,
              true: colors.primaryGlow,
            }}
            thumbColor={isDark ? colors.primary : colors.textTertiary}
          />
        </View>

        {/* Language Toggle */}
        <View
          style={[
            styles.menuItem,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Text style={styles.menuIcon}>{'\uD83C\uDF10'}</Text>
          <Text style={[styles.menuLabel, { color: colors.text }]}>
            {lang === 'ar' ? '\u0627\u0644\u0639\u0631\u0628\u064A\u0629' : 'English'}
          </Text>
          <TouchableOpacity
            onPress={toggleLang}
            style={{
              backgroundColor: colors.primaryLight,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.primary,
            }}
          >
            <Text style={{ ...typography.small, color: colors.primary, fontWeight: '600' }}>
              {lang === 'en' ? '\u0627\u0644\u0639\u0631\u0628\u064A\u0629' : 'English'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* App info */}
      <View style={{ marginTop: 24, alignItems: 'center', paddingBottom: 32 }}>
        <Text style={{ ...(typography.caption as object), color: colors.textTertiary }}>{t('app_name')} {t('version')}</Text>
        <Text style={{ ...(typography.small as object), color: colors.textTertiary, marginTop: 4 }}>{t('app_tagline')}</Text>
      </View>

      {/* Sign Out */}
      <TouchableOpacity
        style={[
          styles.logoutBtn,
          {
            borderColor: colors.error,
          },
        ]}
        onPress={signOut}
        activeOpacity={0.7}
      >
        <Text style={[styles.logoutText, { color: colors.error }]}>
          {t('sign_out')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: spacing.xxl },
  profileSection: {
    alignItems: 'center',
    paddingTop: spacing.xxl + spacing.lg,
    paddingBottom: spacing.xl,
  },
  avatarWrap: {
    borderWidth: 2,
    borderRadius: 48,
    padding: 3,
  },
  name: {
    ...(typography.h2 as object),
    marginTop: spacing.md,
  },
  email: {
    ...(typography.caption as object),
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  statValue: {
    ...(typography.mono as object),
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  statLabel: {
    ...(typography.small as object),
    marginTop: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  badgesSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  badgesSectionTitle: {
    ...(typography.h3 as object),
    marginBottom: spacing.md,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badgeCard: {
    width: '31%' as any,
    minWidth: 95,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  badgeName: {
    ...(typography.small as object),
    fontWeight: '600' as const,
    textAlign: 'center' as const,
    marginBottom: spacing.xs,
  },
  badgeDate: {
    ...(typography.small as object),
    fontSize: 9,
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center' as const,
    paddingHorizontal: spacing.xs,
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden' as const,
    marginBottom: 2,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    ...(typography.small as object),
    fontSize: 9,
  },
  menu: {
    paddingHorizontal: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  menuIcon: { fontSize: 22, marginRight: spacing.md },
  menuLabel: { flex: 1, ...(typography.body as object) },
  menuArrow: { fontSize: 24, fontWeight: '300' },
  logoutBtn: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.md,
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
  },
  logoutText: { ...(typography.bodyBold as object) },
});
