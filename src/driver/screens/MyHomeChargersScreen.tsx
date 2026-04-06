import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTheme } from '@/core/theme';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import { useTranslation } from '@/core/i18n';
import { useAuthStore } from '@/core/stores/authStore';
import { homeChargerService, HomeCharger } from '@/core/services/homeChargerService';

export function MyHomeChargersScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const [chargers, setChargers] = useState<HomeCharger[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchChargers = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const data = await homeChargerService.getMyChargers(user.id);
    setChargers(data);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchChargers();
  }, [fetchChargers]);

  // Refresh when returning from add/edit
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchChargers();
    });
    return unsubscribe;
  }, [navigation, fetchChargers]);

  const handleToggleActive = useCallback(
    async (charger: HomeCharger) => {
      setTogglingId(charger.id);
      const newState = !charger.is_active;
      const ok = await homeChargerService.toggleActive(charger.id, newState);
      if (ok) {
        setChargers((prev) =>
          prev.map((c) => (c.id === charger.id ? { ...c, is_active: newState } : c))
        );
      } else {
        Alert.alert(t('error'), t('home_charger_toggle_error'));
      }
      setTogglingId(null);
    },
    [t]
  );

  const handleDelete = useCallback(
    (charger: HomeCharger) => {
      Alert.alert(
        t('home_charger_delete_title'),
        t('home_charger_delete_confirm'),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('confirm'),
            style: 'destructive',
            onPress: async () => {
              const ok = await homeChargerService.deleteCharger(charger.id);
              if (ok) {
                setChargers((prev) => prev.filter((c) => c.id !== charger.id));
              } else {
                Alert.alert(t('error'), t('home_charger_delete_error'));
              }
            },
          },
        ]
      );
    },
    [t]
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ fontSize: 22, color: colors.text }}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('home_charger_my_chargers')}</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={() => navigation.navigate('ListHomeCharger')}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.addBtnText}>{'\u002B'} {t('home_charger_add')}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : chargers.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>{'\uD83C\uDFE0'}</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('home_charger_empty_title')}</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {t('home_charger_empty_subtitle')}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('ListHomeCharger')}
            style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.addBtnText}>{t('home_charger_list_your_charger')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        chargers.map((charger) => (
          <View
            key={charger.id}
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: charger.is_active ? colors.primary + '30' : colors.border,
                opacity: charger.is_active ? 1 : 0.6,
              },
            ]}
          >
            {/* Card header */}
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardName, { color: colors.text }]}>{charger.display_name}</Text>
                <Text style={[styles.cardAddress, { color: colors.textSecondary }]} numberOfLines={1}>
                  {charger.address}
                </Text>
              </View>
              {togglingId === charger.id ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Switch
                  value={charger.is_active}
                  onValueChange={() => handleToggleActive(charger)}
                  trackColor={{ false: colors.surfaceTertiary, true: colors.primaryGlow }}
                  thumbColor={charger.is_active ? colors.primary : colors.textTertiary}
                />
              )}
            </View>

            {/* Info row */}
            <View style={styles.infoRow}>
              <View style={[styles.infoBadge, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                <Text style={[styles.infoBadgeText, { color: colors.primary }]}>{charger.connector_type}</Text>
              </View>
              <View style={[styles.infoBadge, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                <Text style={[styles.infoBadgeText, { color: colors.primary }]}>{charger.power_kw} kW</Text>
              </View>
              <View
                style={[
                  styles.infoBadge,
                  {
                    backgroundColor: charger.is_free ? colors.secondary + '15' : colors.warning + '15',
                    borderColor: charger.is_free ? colors.secondary : colors.warning,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.infoBadgeText,
                    { color: charger.is_free ? colors.secondary : colors.warning },
                  ]}
                >
                  {charger.is_free ? t('home_charger_free') : `${charger.price_per_kwh} ${t('calc_egp_per_kwh')}`}
                </Text>
              </View>
            </View>

            {charger.availability_schedule && (
              <Text style={[styles.scheduleText, { color: colors.textTertiary }]}>
                {'\uD83D\uDD52'} {charger.availability_schedule}
              </Text>
            )}

            {/* Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={() => handleDelete(charger)}
                style={[styles.actionBtn, { borderColor: colors.error }]}
              >
                <Text style={{ fontSize: 12, color: colors.error, fontWeight: '600' }}>{t('home_charger_delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 60 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 20 : 56,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: 8,
  },
  backBtn: { padding: 8 },
  title: { ...(typography.h2 as object), flex: 0 },
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  addBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
  loadingWrap: { paddingTop: 80, alignItems: 'center' },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: { ...(typography.h3 as object), marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { ...(typography.body as object), textAlign: 'center', marginBottom: 24 },
  emptyBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
  },
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardName: { ...(typography.bodyBold as object), fontSize: 15 },
  cardAddress: { ...(typography.caption as object), marginTop: 2 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  infoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoBadgeText: { fontSize: 11, fontWeight: '600' },
  scheduleText: { fontSize: 12, marginBottom: 8 },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
});
