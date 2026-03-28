import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useTheme } from '@/core/theme';
import { typography } from '@/core/theme/typography';
import { visitTracker } from '@/core/services/visitTracker';

interface StationRatingProps {
  stationId: string;
  stationName: string;
  currentRating?: number;
  reviewCount?: number;
  isNearby?: boolean;
}

export function StationRating({ stationId, stationName, currentRating = 0, reviewCount = 0, isNearby = false }: StationRatingProps) {
  const { colors } = useTheme();
  const [userRating, setUserRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [hasRecentVisit, setHasRecentVisit] = useState(false);

  // Check if user visited this station within 48h
  useEffect(() => {
    visitTracker.hasRecentVisit(stationId).then(setHasRecentVisit);
  }, [stationId]);

  const canRate = isNearby || hasRecentVisit;

  const handleSubmit = () => {
    if (userRating === 0) {
      Alert.alert('Rating Required', 'Please tap a star to rate this station');
      return;
    }
    // Save locally (in a real app, this would go to Supabase)
    setSubmitted(true);
    setShowForm(false);
    Alert.alert('Thanks!', 'Your feedback helps the EV community.');
  };

  const stars = [1, 2, 3, 4, 5];

  // Quick rating tags
  const tags = ['Fast charging', 'Clean facility', 'Easy to find', 'Good parking', 'Reliable', 'Poor condition', 'Often busy', 'Broken charger'];

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  // Reliability score based on ratings
  const reliabilityScore = currentRating > 0 ? Math.round(currentRating * 20) : null;
  const reliabilityColor = reliabilityScore && reliabilityScore >= 80 ? colors.secondary :
                           reliabilityScore && reliabilityScore >= 60 ? colors.warning :
                           reliabilityScore ? colors.error : colors.textTertiary;

  return (
    <View style={{ gap: 12 }}>
      {/* Current rating display */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Stars display */}
          <View style={{ flexDirection: 'row', gap: 2 }}>
            {stars.map(s => (
              <Text key={s} style={{ fontSize: 16, color: s <= Math.round(currentRating) ? '#FFB020' : colors.textTertiary }}>
                {'\u2605'}
              </Text>
            ))}
          </View>
          <Text style={{ ...typography.mono, color: colors.text, fontSize: 14 }}>
            {currentRating > 0 ? currentRating.toFixed(1) : '\u2014'}
          </Text>
          <Text style={{ ...typography.caption, color: colors.textSecondary }}>
            ({reviewCount} reviews)
          </Text>
        </View>

        {/* Reliability score */}
        {reliabilityScore && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 4,
            backgroundColor: reliabilityColor + '20',
            paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
          }}>
            <Text style={{ ...typography.mono, fontSize: 12, color: reliabilityColor }}>
              {reliabilityScore}% reliable
            </Text>
          </View>
        )}
      </View>

      {/* Rate button or submitted state */}
      {submitted ? (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 6,
          backgroundColor: colors.secondary + '15',
          padding: 10, borderRadius: 10,
        }}>
          <Text style={{ ...typography.caption, color: colors.secondary }}>
            You rated this station {userRating}/5
          </Text>
        </View>
      ) : !showForm ? (
        canRate ? (
          <TouchableOpacity
            onPress={() => setShowForm(true)}
            style={{
              backgroundColor: colors.surfaceSecondary,
              borderWidth: 1, borderColor: colors.border,
              borderRadius: 10, paddingVertical: 10, alignItems: 'center',
            }}
          >
            <Text style={{ ...typography.caption, color: colors.primary }}>
              {isNearby ? '⭐ Rate & Review This Station' : '⭐ Rate Your Recent Visit (48h window)'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{
            backgroundColor: colors.surfaceSecondary,
            borderWidth: 1, borderColor: colors.border,
            borderRadius: 10, paddingVertical: 10, alignItems: 'center',
            flexDirection: 'row', justifyContent: 'center', gap: 6,
          }}>
            <Text style={{ fontSize: 12 }}>📍</Text>
            <Text style={{ ...typography.caption, color: colors.textTertiary }}>Visit this station to leave a review</Text>
          </View>
        )
      ) : (
        <View style={{
          backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
          borderRadius: 14, padding: 16, gap: 14,
        }}>
          {/* Star rating */}
          <View>
            <Text style={{ ...typography.bodyBold, color: colors.text, marginBottom: 8 }}>Your Rating</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {stars.map(s => (
                <TouchableOpacity key={s} onPress={() => setUserRating(s)}>
                  <Text style={{ fontSize: 32, color: s <= userRating ? '#FFB020' : colors.textTertiary }}>
                    {'\u2605'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quick tags */}
          <View>
            <Text style={{ ...typography.bodyBold, color: colors.text, marginBottom: 8 }}>Quick Tags</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {tags.map(tag => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  style={{
                    paddingHorizontal: 10, paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor: selectedTags.includes(tag) ? colors.primaryLight : colors.surfaceSecondary,
                    borderWidth: 1,
                    borderColor: selectedTags.includes(tag) ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{
                    ...typography.small, fontSize: 12,
                    color: selectedTags.includes(tag) ? colors.primary : colors.textSecondary,
                  }}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Comment */}
          <View>
            <Text style={{ ...typography.bodyBold, color: colors.text, marginBottom: 8 }}>Comment (optional)</Text>
            <TextInput
              value={feedback}
              onChangeText={setFeedback}
              placeholder="Share your experience..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: colors.surfaceSecondary,
                borderWidth: 1, borderColor: colors.border,
                borderRadius: 10, padding: 12,
                color: colors.text, ...typography.caption,
                minHeight: 70, textAlignVertical: 'top',
              }}
            />
          </View>

          {/* Submit */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              onPress={() => setShowForm(false)}
              style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: colors.border }}
            >
              <Text style={{ ...typography.button, color: colors.textSecondary }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              style={{
                flex: 2, paddingVertical: 12, alignItems: 'center',
                borderRadius: 10, backgroundColor: colors.primary,
              }}
            >
              <Text style={{ ...typography.button, color: colors.black }}>Submit Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
