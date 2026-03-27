import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/core/theme';
import { typography } from '@/core/theme/typography';
import {
  stationReportService,
  StationStatus,
  StationLiveStatus,
} from '@/core/services/stationReportService';
import { useAuthStore } from '@/core/stores/authStore';

interface Props {
  stationId: string;
  stationName: string;
  liveStatus?: StationLiveStatus | null;
  compact?: boolean; // for inline use in station cards
}

export function StationReportButton({
  stationId,
  stationName,
  liveStatus,
  compact = false,
}: Props) {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [spots, setSpots] = useState('');
  const [comment, setComment] = useState('');

  const statusOptions: {
    status: StationStatus;
    label: string;
    icon: string;
    color: string;
  }[] = [
    { status: 'available', label: 'Available', icon: '\u2705', color: colors.statusAvailable },
    { status: 'partially_available', label: 'Partially Available', icon: '\uD83D\uDFE1', color: colors.statusPartial },
    { status: 'busy', label: 'All Busy', icon: '\uD83D\uDD34', color: colors.statusOccupied },
    { status: 'out_of_service', label: 'Out of Service', icon: '\u26A0\uFE0F', color: colors.error },
  ];

  const handleReport = async (status: StationStatus) => {
    setSubmitting(true);
    const success = await stationReportService.submitReport({
      stationId,
      userId: user?.id,
      status,
      availableSpots: spots ? parseInt(spots, 10) : undefined,
      comment: comment || undefined,
    });
    setSubmitting(false);

    if (success) {
      setSubmitted(true);
      setShowForm(false);
      setSpots('');
      setComment('');
      Alert.alert('Thanks!', 'Your report helps other EV drivers.');
    } else {
      Alert.alert('Error', 'Could not submit report. Try again.');
    }
  };

  // Compact version -- just a small "Report" button
  if (compact) {
    return (
      <TouchableOpacity
        onPress={() => setShowForm(!showForm)}
        style={{
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: colors.primary,
          backgroundColor: colors.primaryLight,
        }}
      >
        <Text style={{ fontSize: 10, fontWeight: '600', color: colors.primary }}>
          {submitted ? '\u2713 Reported' : 'Report'}
        </Text>
      </TouchableOpacity>
    );
  }

  // Live status display color
  const statusColor = liveStatus
    ? liveStatus.status === 'available'
      ? colors.statusAvailable
      : liveStatus.status === 'partially_available'
        ? colors.statusPartial
        : liveStatus.status === 'busy'
          ? colors.statusOccupied
          : colors.error
    : colors.textTertiary;

  const confidenceLabel =
    liveStatus?.confidence === 'high'
      ? 'Recent'
      : liveStatus?.confidence === 'medium'
        ? 'A while ago'
        : 'Old report';

  return (
    <View style={{ gap: 12 }}>
      {/* Current community status */}
      {liveStatus && (
        <View
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 14,
            gap: 8,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: statusColor,
                }}
              />
              <Text style={{ ...typography.bodyBold, color: colors.text }}>
                {liveStatus.status === 'available'
                  ? 'Available'
                  : liveStatus.status === 'partially_available'
                    ? 'Partially Available'
                    : liveStatus.status === 'busy'
                      ? 'All Busy'
                      : 'Out of Service'}
              </Text>
            </View>
            <View
              style={{
                backgroundColor:
                  liveStatus.confidence === 'high'
                    ? colors.secondary + '20'
                    : colors.textTertiary + '20',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  color:
                    liveStatus.confidence === 'high'
                      ? colors.secondary
                      : colors.textTertiary,
                }}
              >
                {confidenceLabel}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {liveStatus.availableSpots != null && (
              <Text style={{ ...typography.mono, color: colors.primary, fontSize: 13 }}>
                {liveStatus.availableSpots}/{liveStatus.totalSpots || '?'} spots free
              </Text>
            )}
            <Text style={{ ...typography.small, color: colors.textTertiary }}>
              {liveStatus.reportCount} report
              {liveStatus.reportCount !== 1 ? 's' : ''} today {'\u00B7'}{' '}
              {liveStatus.timeAgo}
            </Text>
          </View>
        </View>
      )}

      {/* Report button or form */}
      {submitted ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: colors.secondary + '15',
            padding: 12,
            borderRadius: 10,
          }}
        >
          <Text style={{ ...typography.caption, color: colors.secondary }}>
            Thanks for reporting!
          </Text>
        </View>
      ) : !showForm ? (
        <TouchableOpacity
          onPress={() => setShowForm(true)}
          style={{
            backgroundColor: colors.surfaceSecondary,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Text style={{ ...typography.bodyBold, color: colors.primary }}>
            Report Station Status
          </Text>
        </TouchableOpacity>
      ) : (
        <View
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 14,
            padding: 16,
            gap: 14,
          }}
        >
          <Text style={{ ...typography.bodyBold, color: colors.text }}>
            What's the current status?
          </Text>

          {/* Status buttons */}
          <View style={{ gap: 8 }}>
            {statusOptions.map((opt) => (
              <TouchableOpacity
                key={opt.status}
                onPress={() => handleReport(opt.status)}
                disabled={submitting}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: colors.surfaceSecondary,
                  borderWidth: 1,
                  borderColor: opt.color + '40',
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <Text style={{ fontSize: 20 }}>{opt.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...typography.body, color: colors.text }}>
                    {opt.label}
                  </Text>
                </View>
                {submitting ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={{ fontSize: 14, color: colors.textTertiary }}>
                    {'\u2192'}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Available spots */}
          <View>
            <Text
              style={{
                ...typography.caption,
                color: colors.textSecondary,
                marginBottom: 6,
              }}
            >
              Available spots (optional)
            </Text>
            <TextInput
              value={spots}
              onChangeText={setSpots}
              keyboardType="number-pad"
              placeholder="e.g. 3"
              placeholderTextColor={colors.textTertiary}
              style={{
                backgroundColor: colors.surfaceSecondary,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 10,
                color: colors.text,
                ...typography.body,
              }}
            />
          </View>

          {/* Comment */}
          <View>
            <Text
              style={{
                ...typography.caption,
                color: colors.textSecondary,
                marginBottom: 6,
              }}
            >
              Comment (optional)
            </Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="e.g. Charger #2 is broken"
              placeholderTextColor={colors.textTertiary}
              style={{
                backgroundColor: colors.surfaceSecondary,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 10,
                color: colors.text,
                ...typography.body,
              }}
            />
          </View>

          {/* Cancel */}
          <TouchableOpacity
            onPress={() => setShowForm(false)}
            style={{ alignItems: 'center', paddingVertical: 8 }}
          >
            <Text style={{ ...typography.caption, color: colors.textTertiary }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
