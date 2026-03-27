import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { Avatar, LoadingScreen } from '@/core/components';
import { useAuthStore } from '@/core/stores/authStore';
import { useChargingStats } from '@/core/queries/useProfile';
import { useAuth } from '@/core/auth/useAuth';
import { formatEGP, formatKWh } from '@/core/utils/formatCurrency';
import { useTheme } from '@/core/theme';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

export function ProfileScreen({ navigation }: any) {
  const { colors, isDark, toggleTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const { signOut } = useAuth();
  const { data: stats } = useChargingStats();

  if (!user) return <LoadingScreen />;

  const menuItems = [
    { label: 'My Vehicles', icon: '🚗', screen: 'Vehicle' },
    { label: 'Favorites', icon: '⭐', screen: 'Favorites' },
    { label: 'Settings', icon: '⚙️', screen: 'Settings' },
  ];

  const statItems = [
    {
      label: 'Trips',
      value: stats?.totalSessions?.toString() || '0',
      color: colors.primary,
    },
    {
      label: 'kWh',
      value: stats ? formatKWh(stats.totalKwh) : '0',
      color: colors.primary,
    },
    {
      label: 'Saved',
      value: stats ? `${stats.co2SavedKg.toFixed(0)} kg` : '0',
      color: colors.secondary,
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
            Dark Mode
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
          Sign Out
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
