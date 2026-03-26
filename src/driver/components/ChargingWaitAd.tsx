import React, { useEffect } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Linking } from 'react-native';
import { Card } from '@/core/components';
import { adService, Ad } from '@/core/services/adService';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

interface Props {
  ad: Ad;
}

export function ChargingWaitAd({ ad }: Props) {
  useEffect(() => {
    adService.trackImpression(ad.id).catch(() => {});
  }, [ad.id]);

  const handlePress = () => {
    adService.trackClick(ad.id).catch(() => {});
    if (ad.action_url) Linking.openURL(ad.action_url).catch(() => {});
  };

  return (
    <TouchableOpacity onPress={handlePress} disabled={!ad.action_url} activeOpacity={0.85}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.nearby}>Nearby</Text>
          <Text style={styles.sponsored}>Sponsored</Text>
        </View>
        <Text style={styles.title}>{ad.title}</Text>
        {ad.description && <Text style={styles.desc}>{ad.description}</Text>}
        <Text style={styles.advertiser}>{ad.advertiser_name}</Text>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginVertical: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.accent },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  nearby: { ...(typography.small as object), color: colors.accent, fontWeight: '600' },
  sponsored: { ...(typography.small as object), color: colors.textTertiary },
  title: { ...(typography.bodyBold as object), color: colors.text, fontSize: 14 },
  desc: { ...(typography.caption as object), color: colors.textSecondary, marginTop: 4 },
  advertiser: { ...(typography.small as object), color: colors.textTertiary, marginTop: spacing.xs },
});
