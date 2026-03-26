import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Header, LoadingScreen } from '@/core/components';
import { BalanceCard } from '../components/BalanceCard';
import { TransactionItem } from '../components/TransactionItem';
import { useWallet } from '@/core/queries/useWallet';
import { useTransactions } from '@/core/queries/useTransactions';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

export function WalletScreen({ navigation }: any) {
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { data: transactions } = useTransactions(10);

  if (walletLoading) return <LoadingScreen message="Loading wallet..." />;

  return (
    <View style={styles.container}>
      <Header title="Wallet" />
      <FlatList
        data={transactions || []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <BalanceCard
              balance={wallet?.balance || 0}
              currency={wallet?.currency || 'EGP'}
              onTopUp={() => navigation.navigate('TopUp')}
            />
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <Text
                style={styles.seeAll}
                onPress={() => navigation.navigate('TransactionHistory')}
              >
                See All
              </Text>
            </View>
          </View>
        }
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.bodyBold, color: colors.text },
  seeAll: { ...typography.caption, color: colors.primary },
  empty: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
