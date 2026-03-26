import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Header, Avatar, Card, LoadingScreen } from '@/core/components';
import { StatCard } from '../components/StatCard';
import { useAuthStore } from '@/core/stores/authStore';
import { useChargingStats } from '@/core/queries/useProfile';
import { useAuth } from '@/core/auth/useAuth';
import { formatEGP, formatKWh } from '@/core/utils/formatCurrency';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

export function ProfileScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const { signOut } = useAuth();
  const { data: stats } = useChargingStats();

  if (!user) return <LoadingScreen />;

  const menuItems = [
    { label: 'My Vehicles', icon: '🚗', screen: 'Vehicle' },
    { label: 'Favorites', icon: '⭐', screen: 'Favorites' },
    { label: 'Settings', icon: '⚙️', screen: 'Settings' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header title="Profile" />
      <View style={styles.profileSection}>
        <Avatar name={user.full_name} uri={user.avatar_url} size={72} />
        <Text style={styles.name}>{user.full_name}</Text>
        <Text style={styles.role}>
          {user.role === 'driver' ? 'EV Driver' : 'Fleet Manager'}
        </Text>
      </View>

      {stats && (
        <View style={styles.statsGrid}>
          <StatCard icon="⚡" value={stats.totalSessions.toString()} label="Sessions" />
          <StatCard icon="🔋" value={formatKWh(stats.totalKwh)} label="Charged" />
          <StatCard
            icon="💰"
            value={formatEGP(stats.totalSpent)}
            label="Spent"
            color={colors.accent}
          />
          <StatCard
            icon="🌿"
            value={`${stats.co2SavedKg.toFixed(0)} kg`}
            label="CO2 Saved"
            color={colors.success}
          />
        </View>
      )}

      <View style={styles.menu}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },
  profileSection: { alignItems: 'center', paddingVertical: spacing.xl },
  name: { ...(typography.h2 as object), color: colors.text, marginTop: spacing.md },
  role: { ...(typography.caption as object), color: colors.textSecondary },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  menu: { marginTop: spacing.xl, paddingHorizontal: spacing.md },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIcon: { fontSize: 22, marginRight: spacing.md },
  menuLabel: { flex: 1, ...(typography.body as object), color: colors.text },
  menuArrow: { fontSize: 22, color: colors.textTertiary },
  logoutBtn: { marginTop: spacing.xl, alignItems: 'center', padding: spacing.md },
  logoutText: { ...(typography.bodyBold as object), color: colors.error },
});
