import React, { useEffect } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Linking } from 'react-native';
import { Badge } from '@/core/components';
import { adService, Ad } from '@/core/services/adService';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

interface Props {
  ad: Ad;
}

export function AmenityAd({ ad }: Props) {
  useEffect(() => {
    adService.trackImpression(ad.id).catch(() => {});
  }, [ad.id]);

  const handlePress = () => {
    adService.trackClick(ad.id).catch(() => {});
    if (ad.action_url) Linking.openURL(ad.action_url).catch(() => {});
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      disabled={!ad.action_url}
      activeOpacity={0.85}
    >
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.title}>{ad.title}</Text>
          {ad.description && <Text style={styles.desc}>{ad.description}</Text>}
          <Text style={styles.advertiser}>{ad.advertiser_name}</Text>
        </View>
        <Badge label="Promoted" backgroundColor={colors.surfaceSecondary} color={colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1, marginRight: spacing.sm },
  title: { ...(typography.bodyBold as object), color: colors.text, fontSize: 14 },
  desc: { ...(typography.caption as object), color: colors.textSecondary, marginTop: 2 },
  advertiser: { ...(typography.small as object), color: colors.textTertiary, marginTop: 2 },
});
