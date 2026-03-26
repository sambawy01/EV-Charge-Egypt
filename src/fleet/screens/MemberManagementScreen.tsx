import React from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Header, Avatar, Badge, Button, LoadingScreen } from '@/core/components';
import { useFleetMembers } from '@/core/queries/useFleetDrivers';
import { formatEGP } from '@/core/utils/formatCurrency';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

const MOCK_MEMBERS = [
  { id: 'm1', fleet_id: 'f1', user_id: 'u2', vehicle_id: 'v1', daily_limit: 200, weekly_limit: 1000, is_active: true, user: { full_name: 'Ahmed Mohamed', phone: '+20 100 123 4567' }, vehicle: { make: 'BYD', model: 'Atto 3' } },
  { id: 'm2', fleet_id: 'f1', user_id: 'u3', vehicle_id: 'v2', daily_limit: 150, weekly_limit: 800, is_active: true, user: { full_name: 'Sara Khalil', phone: '+20 111 234 5678' }, vehicle: { make: 'MG', model: 'ZS EV' } },
  { id: 'm3', fleet_id: 'f1', user_id: 'u4', vehicle_id: null, daily_limit: null, weekly_limit: null, is_active: true, user: { full_name: 'Mohamed Adel', phone: '+20 122 345 6789' }, vehicle: null },
  { id: 'm4', fleet_id: 'f1', user_id: 'u5', vehicle_id: null, daily_limit: 100, weekly_limit: 500, is_active: false, user: { full_name: 'Layla Hassan', phone: '+20 100 987 6543' }, vehicle: null },
];

export function MemberManagementScreen({ navigation }: any) {
  const { data: members, isLoading } = useFleetMembers();
  const displayMembers = (members && members.length > 0) ? members : (MOCK_MEMBERS as any[]);

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <Header title="Team Members" onBack={() => navigation.goBack()} />
      <FlatList
        data={displayMembers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('DriverDetail', { memberId: item.id })}
          >
            <Avatar name={item.user?.full_name || 'Driver'} size={44} />
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{item.user?.full_name}</Text>
                <Badge
                  label={item.is_active ? 'Active' : 'Inactive'}
                  backgroundColor={item.is_active ? colors.primaryLight : colors.surfaceSecondary}
                  color={item.is_active ? colors.primaryDark : colors.textSecondary}
                />
              </View>
              <Text style={styles.phone}>{item.user?.phone || 'No phone'}</Text>
              <Text style={styles.vehicle}>
                {item.vehicle ? `${(item.vehicle as any).make} ${(item.vehicle as any).model}` : 'No vehicle assigned'}
                {item.daily_limit ? ` · Limit: ${formatEGP(item.daily_limit)}/day` : ''}
              </Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.content}
        ListFooterComponent={
          <View style={styles.addButton}>
            <Button title="Invite Member" onPress={() => Alert.alert('Coming Soon', 'Member invitation via phone number or email.')} variant="outline" />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  info: { flex: 1, marginLeft: spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { ...(typography.bodyBold as object), color: colors.text, flex: 1 },
  phone: { ...(typography.caption as object), color: colors.textSecondary, marginTop: 2 },
  vehicle: { ...(typography.small as object), color: colors.textSecondary, marginTop: 2 },
  arrow: { fontSize: 22, color: colors.textTertiary, marginLeft: spacing.sm },
  addButton: { marginTop: spacing.lg },
});
