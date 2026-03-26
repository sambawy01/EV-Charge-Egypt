import React from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Header, Avatar, LoadingScreen } from '@/core/components';
import { useFleetMembers, useAssignDriver } from '@/core/queries/useFleetDrivers';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

const MOCK_MEMBERS = [
  { id: 'm1', fleet_id: 'f1', user_id: 'u2', vehicle_id: null, daily_limit: 200, weekly_limit: 1000, is_active: true, user: { full_name: 'Ahmed Mohamed', phone: '+20 100 123 4567' } },
  { id: 'm2', fleet_id: 'f1', user_id: 'u3', vehicle_id: null, daily_limit: 150, weekly_limit: 800, is_active: true, user: { full_name: 'Sara Khalil', phone: '+20 111 234 5678' } },
  { id: 'm3', fleet_id: 'f1', user_id: 'u4', vehicle_id: null, daily_limit: null, weekly_limit: null, is_active: true, user: { full_name: 'Mohamed Adel', phone: '+20 122 345 6789' } },
];

export function AssignDriverScreen({ route, navigation }: any) {
  const { vehicleId } = route.params || { vehicleId: 'v1' };
  const { data: members, isLoading } = useFleetMembers();
  const assignDriver = useAssignDriver();

  const displayMembers = (members && members.filter((m) => m.is_active).length > 0)
    ? members.filter((m) => m.is_active)
    : (MOCK_MEMBERS as any[]);

  const handleAssign = (memberId: string, name: string) => {
    Alert.alert('Assign Driver', `Assign ${name} to this vehicle?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Assign',
        onPress: async () => {
          try {
            await assignDriver.mutateAsync({ memberId, vehicleId });
            navigation.goBack();
          } catch {
            Alert.alert('Error', 'Failed to assign driver. Please try again.');
          }
        },
      },
    ]);
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <Header title="Assign Driver" onBack={() => navigation.goBack()} />
      <FlatList
        data={displayMembers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => handleAssign(item.id, item.user?.full_name || 'Driver')}
          >
            <Avatar name={item.user?.full_name || 'Driver'} size={40} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.user?.full_name}</Text>
              <Text style={styles.phone}>{item.user?.phone || 'No phone'}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<Text style={styles.empty}>No active drivers found</Text>}
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
  name: { ...(typography.bodyBold as object), color: colors.text },
  phone: { ...(typography.caption as object), color: colors.textSecondary },
  arrow: { fontSize: 22, color: colors.textTertiary },
  empty: { ...(typography.body as object), color: colors.textTertiary, textAlign: 'center', padding: spacing.xl },
});
