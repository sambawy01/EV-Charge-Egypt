import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LoadingScreen } from '@/core/components';
import { BalanceCard } from '../components/BalanceCard';
import { TransactionItem } from '../components/TransactionItem';
import { useWallet } from '@/core/queries/useWallet';
import { useTransactions } from '@/core/queries/useTransactions';
import { useTheme } from '@/core/theme';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

export function WalletScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { data: transactions } = useTransactions(10);

  if (walletLoading) return <LoadingScreen message="Loading wallet..." />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[`${colors.primary}14`, 'transparent']}
        style={styles.topGradient}
      />
      <FlatList
        data={transactions || []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <Text style={[styles.screenTitle, { color: colors.text }]}>
              Wallet
            </Text>
            <BalanceCard
              balance={wallet?.balance || 0}
              currency={wallet?.currency || 'EGP'}
              onTopUp={() => navigation.navigate('TopUp')}
            />
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Recent Transactions
                </Text>
                <Text
                  style={[styles.seeAll, { color: colors.primary }]}
                  onPress={() => navigation.navigate('TransactionHistory')}
                >
                  See All
                </Text>
              </View>
              <LinearGradient
                colors={[colors.primary, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sectionLine}
              />
            </View>
          </View>
        }
        renderItem={({ item }) => <TransactionItem transaction={item} />}
        ListEmptyComponent={
          <Text
            style={[
              styles.empty,
              { color: colors.textTertiary },
            ]}
          >
            No transactions yet
          </Text>
        }
        contentContainerStyle={styles.content}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  screenTitle: {
    ...(typography.h1 as object),
    paddingTop: spacing.xxl + spacing.md,
    paddingBottom: spacing.lg,
  },
  content: { padding: spacing.md },
  sectionHeader: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...(typography.h3 as object),
  },
  sectionLine: {
    height: 1,
    borderRadius: 1,
  },
  seeAll: { ...(typography.caption as object) },
  empty: {
    ...(typography.body as object),
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
