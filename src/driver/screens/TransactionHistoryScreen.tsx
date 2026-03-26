import React from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { Header, LoadingScreen } from '@/core/components';
import { TransactionItem } from '../components/TransactionItem';
import { useTransactions } from '@/core/queries/useTransactions';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

export function TransactionHistoryScreen({ navigation }: any) {
  const { data: transactions, isLoading } = useTransactions(200);

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <Header
        title="Transaction History"
        onBack={() => navigation.goBack()}
      />
      <FlatList
        data={transactions || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionItem transaction={item} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No transactions yet</Text>
        }
        contentContainerStyle={styles.content}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  empty: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
    padding: spacing.xl,
  },
});
