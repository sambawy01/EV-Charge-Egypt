import React, { useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Linking } from 'react-native';
import { adService, Ad } from '@/core/services/adService';
import { colors } from '@/core/theme/colors';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

interface Props {
  ad: Ad;
}

export function PostChargeAd({ ad }: Props) {
  useEffect(() => {
    adService.trackImpression(ad.id).catch(() => {});
  }, [ad.id]);

  const handlePress = () => {
    adService.trackClick(ad.id).catch(() => {});
    if (ad.action_url) Linking.openURL(ad.action_url).catch(() => {});
  };

  return (
    <TouchableOpacity
      style={styles.banner}
      onPress={handlePress}
      disabled={!ad.action_url}
      activeOpacity={0.85}
    >
      <Text style={styles.title}>{ad.title}</Text>
      {ad.description && <Text style={styles.desc}>{ad.description}</Text>}
      <Text style={styles.sponsored}>Ad · {ad.advertiser_name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { ...(typography.bodyBold as object), color: colors.text, fontSize: 14 },
  desc: { ...(typography.caption as object), color: colors.textSecondary, marginTop: 2 },
  sponsored: { ...(typography.small as object), color: colors.textTertiary, marginTop: spacing.xs },
});
