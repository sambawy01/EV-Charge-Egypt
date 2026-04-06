import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@/core/theme';
import { useTranslation } from '@/core/i18n';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import {
  statsService,
  OverviewStats,
  GroupedCount,
  ConnectorDistribution,
  CommunityStats,
} from '@/core/services/statsService';

// ─── Overview Stat Card ─────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  color,
  colors,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
  colors: any;
}) {
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value.toLocaleString()}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

// ─── Horizontal Bar Chart ───────────────────────────────────────────
function HorizontalBarChart({
  title,
  data,
  barColor,
  colors,
}: {
  title: string;
  data: GroupedCount[];
  barColor: string;
  colors: any;
}) {
  const maxCount = data.length > 0 ? data[0].count : 1;

  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {data.map((item, index) => (
        <View key={item.name} style={styles.barRow}>
          <Text
            style={[styles.barLabel, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.max((item.count / maxCount) * 100, 2)}%`,
                  backgroundColor: barColor,
                  opacity: 1 - index * 0.03,
                },
              ]}
            />
          </View>
          <Text style={[styles.barCount, { color: colors.text }]}>
            {item.count}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Connector Distribution ─────────────────────────────────────────
function ConnectorDistributionSection({
  title,
  data,
  colors,
}: {
  title: string;
  data: ConnectorDistribution[];
  colors: any;
}) {
  const connectorColors: Record<string, string> = {
    'CCS': '#00D4FF',
    'CCS2': '#00D4FF',
    'Type 2': '#00FF88',
    'CHAdeMO': '#D946EF',
    'GB/T': '#F59E0B',
    'GBT': '#F59E0B',
  };

  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {data.map((item) => {
        const color = connectorColors[item.type] || colors.primary;
        return (
          <View key={item.type} style={styles.connectorRow}>
            <View style={styles.connectorInfo}>
              <View style={[styles.connectorDot, { backgroundColor: color }]} />
              <Text style={[styles.connectorType, { color: colors.text }]}>
                {item.type}
              </Text>
            </View>
            <View style={styles.connectorBarTrack}>
              <View
                style={[
                  styles.connectorBarFill,
                  {
                    width: `${Math.max(item.percentage, 2)}%`,
                    backgroundColor: color,
                  },
                ]}
              />
            </View>
            <Text style={[styles.connectorPct, { color: colors.textSecondary }]}>
              {item.percentage}%
            </Text>
            <Text style={[styles.connectorCount, { color: colors.text }]}>
              ({item.count})
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Community Stats Section ────────────────────────────────────────
function CommunitySection({
  title,
  stats,
  colors,
  t,
}: {
  title: string;
  stats: CommunityStats;
  colors: any;
  t: (key: any) => string;
}) {
  const items = [
    { icon: '\uD83D\uDCCB', label: t('stats_total_reports'), value: stats.totalReports },
    { icon: '\uD83D\uDCCD', label: t('stats_stations_submitted'), value: stats.totalSubmitted },
    { icon: '\u2705', label: t('stats_verified_stations'), value: stats.totalVerified },
  ];

  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.communityGrid}>
        {items.map((item) => (
          <View key={item.label} style={[styles.communityCard, { borderColor: colors.border }]}>
            <Text style={styles.communityIcon}>{item.icon}</Text>
            <Text style={[styles.communityValue, { color: colors.primary }]}>
              {item.value.toLocaleString()}
            </Text>
            <Text style={[styles.communityLabel, { color: colors.textSecondary }]}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Coverage Progress ──────────────────────────────────────────────
function CoverageProgress({
  title,
  covered,
  total,
  colors,
  t,
}: {
  title: string;
  covered: number;
  total: number;
  colors: any;
  t: (key: any) => string;
}) {
  const pct = total > 0 ? Math.round((covered / total) * 100) : 0;

  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.coverageText, { color: colors.textSecondary }]}>
        {t('stats_covering')} {covered} {t('stats_out_of')} {total} {t('stats_governorates_suffix')}
      </Text>
      <View style={[styles.progressTrack, { backgroundColor: colors.surfaceTertiary || colors.border }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${pct}%`,
              backgroundColor: colors.secondary || '#00FF88',
            },
          ]}
        />
      </View>
      <Text style={[styles.coveragePct, { color: colors.secondary || '#00FF88' }]}>
        {pct}%
      </Text>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────
export function ChargingStatsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [byProvider, setByProvider] = useState<GroupedCount[]>([]);
  const [byGovernorate, setByGovernorate] = useState<GroupedCount[]>([]);
  const [connectors, setConnectors] = useState<ConnectorDistribution[]>([]);
  const [community, setCommunity] = useState<CommunityStats | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const fetchAll = useCallback(async () => {
    const [ov, prov, gov, conn, comm] = await Promise.all([
      statsService.getOverviewStats(),
      statsService.getStationsByProvider(),
      statsService.getStationsByGovernorate(),
      statsService.getConnectorDistribution(),
      statsService.getCommunityStats(),
    ]);
    setOverview(ov);
    setByProvider(prov);
    setByGovernorate(gov);
    setConnectors(conn);
    setCommunity(comm);
    setLastUpdated(statsService.getLastUpdated());
  }, []);

  useEffect(() => {
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t('loading')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('stats_title')}
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {t('stats_subtitle')}
        </Text>
      </View>

      {/* Overview Cards */}
      {overview && (
        <View style={[styles.overviewGrid, isDesktop && styles.overviewGridDesktop]}>
          <StatCard
            icon={'\u26A1'}
            label={t('stats_total_stations')}
            value={overview.totalStations}
            color={colors.primary}
            colors={colors}
          />
          <StatCard
            icon={'\uD83D\uDD0C'}
            label={t('stats_total_connectors')}
            value={overview.totalConnectors}
            color={colors.secondary || '#00FF88'}
            colors={colors}
          />
          <StatCard
            icon={'\uD83C\uDFE2'}
            label={t('stats_providers')}
            value={overview.totalProviders}
            color={'#D946EF'}
            colors={colors}
          />
          <StatCard
            icon={'\uD83D\uDDFA\uFE0F'}
            label={t('stats_governorates')}
            value={overview.governoratesCovered}
            color={'#F59E0B'}
            colors={colors}
          />
        </View>
      )}

      {/* Two-column layout on desktop */}
      <View style={isDesktop ? styles.twoCol : undefined}>
        {/* Stations by Provider */}
        <View style={isDesktop ? styles.colHalf : undefined}>
          <HorizontalBarChart
            title={t('stats_by_provider')}
            data={byProvider}
            barColor={colors.primary}
            colors={colors}
          />
        </View>

        {/* Stations by Governorate */}
        <View style={isDesktop ? styles.colHalf : undefined}>
          <HorizontalBarChart
            title={t('stats_by_governorate')}
            data={byGovernorate}
            barColor={colors.secondary || '#00FF88'}
            colors={colors}
          />
        </View>
      </View>

      {/* Two-column layout on desktop */}
      <View style={isDesktop ? styles.twoCol : undefined}>
        {/* Connector Distribution */}
        <View style={isDesktop ? styles.colHalf : undefined}>
          <ConnectorDistributionSection
            title={t('stats_connector_types')}
            data={connectors}
            colors={colors}
          />
        </View>

        {/* Community Stats */}
        <View style={isDesktop ? styles.colHalf : undefined}>
          {community && (
            <CommunitySection
              title={t('stats_community')}
              stats={community}
              colors={colors}
              t={t}
            />
          )}
        </View>
      </View>

      {/* Coverage */}
      {overview && (
        <CoverageProgress
          title={t('stats_coverage')}
          covered={overview.governoratesCovered}
          total={27}
          colors={colors}
          t={t}
        />
      )}

      {/* Last Updated */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textTertiary }]}>
          {t('stats_last_updated')}{' '}
          {lastUpdated ? new Date(lastUpdated).toLocaleString() : '--'}
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: spacing.xxl + spacing.xl },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...(typography.body as object),
    marginTop: spacing.md,
  },

  // Header
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xxl + spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    ...(typography.h1 as object),
  },
  headerSubtitle: {
    ...(typography.body as object),
    marginTop: spacing.xs,
  },

  // Overview grid
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  overviewGridDesktop: {
    flexWrap: 'nowrap',
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...(typography.h1 as object),
    fontSize: 28,
    lineHeight: 34,
  },
  statLabel: {
    ...(typography.caption as object),
    marginTop: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },

  // Sections
  section: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  sectionTitle: {
    ...(typography.h3 as object),
    marginBottom: spacing.md,
  },

  // Two-column layout
  twoCol: {
    flexDirection: 'row',
    gap: 0,
  },
  colHalf: {
    flex: 1,
  },

  // Bar chart rows
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  barLabel: {
    ...(typography.caption as object),
    width: 100,
  },
  barTrack: {
    flex: 1,
    height: 20,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barCount: {
    ...(typography.mono as object),
    width: 36,
    textAlign: 'right',
  },

  // Connector distribution
  connectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  connectorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 90,
  },
  connectorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.xs,
  },
  connectorType: {
    ...(typography.caption as object),
  },
  connectorBarTrack: {
    flex: 1,
    height: 16,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  connectorBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  connectorPct: {
    ...(typography.mono as object),
    width: 36,
    textAlign: 'right',
  },
  connectorCount: {
    ...(typography.caption as object),
    width: 36,
    textAlign: 'right',
  },

  // Community
  communityGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  communityCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  communityIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  communityValue: {
    ...(typography.h2 as object),
  },
  communityLabel: {
    ...(typography.small as object),
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  // Coverage
  coverageText: {
    ...(typography.body as object),
    marginBottom: spacing.sm,
  },
  progressTrack: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  coveragePct: {
    ...(typography.h2 as object),
    marginTop: spacing.sm,
    textAlign: 'right',
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    ...(typography.small as object),
  },
});
