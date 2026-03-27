import React, { useMemo } from 'react';
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
import { aiContextService } from '@/core/services/aiContextService';
import { useVehicles } from '@/core/queries/useVehicles';

export function WalletScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { data: transactions } = useTransactions(10);
  const { data: vehicles } = useVehicles();

  const walletInsight = useMemo(() => {
    if (!vehicles?.length) return null;
    const ctx = aiContextService.buildContext(vehicles[0], null);
    return aiContextService.getWalletInsights(ctx);
  }, [vehicles]);

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
            {walletInsight && (
              <View style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 14,
                marginTop: 16,
                gap: 8,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 14 }}>{'\uD83E\uDD16'}</Text>
                  <Text style={{ fontFamily: 'SpaceGrotesk-SemiBold', fontSize: 13, color: colors.primary }}>AI Insight</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 20 }}>
                    {walletInsight.monthlyTrend === 'up' ? '\uD83D\uDCC8' : walletInsight.monthlyTrend === 'down' ? '\uD83D\uDCC9' : '\u27A1\uFE0F'}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...typography.caption, color: colors.text }}>
                      Spending {walletInsight.monthlyTrend} {walletInsight.trendPercent}%
                    </Text>
                    <Text style={{ ...typography.small, color: colors.textSecondary }}>{walletInsight.trendReason}</Text>
                  </View>
                </View>
                <Text style={{ ...typography.caption, color: colors.secondary }}>
                  {'\uD83D\uDCA1'} {walletInsight.costOptimizationTip}
                </Text>
                <Text style={{ ...typography.small, color: colors.textTertiary }}>
                  Potential savings: ~{walletInsight.potentialMonthlySavings} EGP/month
                </Text>
              </View>
            )}
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
