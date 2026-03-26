import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Button } from '@/core/components';
import { useCreateReview } from '@/core/queries/useReviews';
import { colors } from '@/core/theme/colors';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

interface Props {
  visible: boolean;
  stationId: string;
  stationName: string;
  onClose: () => void;
}

export function ReviewModal({ visible, stationId, stationName, onClose }: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const createReview = useCreateReview();

  const handleSubmit = async () => {
    if (rating === 0) return;
    await createReview.mutateAsync({ stationId, rating, comment: comment || undefined });
    setRating(0);
    setComment('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Rate {stationName}</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Text style={[styles.star, star <= rating && styles.starActive]}>
                  {star <= rating ? '★' : '☆'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder="Share your experience (optional)"
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
          />
          <View style={styles.actions}>
            <Button
              title="Submit Review"
              onPress={handleSubmit}
              loading={createReview.isPending}
              disabled={rating === 0}
            />
            <Button title="Cancel" onPress={onClose} variant="ghost" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
  },
  title: { ...(typography.h3 as object), color: colors.text, textAlign: 'center' },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: spacing.lg,
    gap: spacing.md,
  },
  star: { fontSize: 36, color: colors.border },
  starActive: { color: colors.warning },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...(typography.body as object),
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: { marginTop: spacing.lg, gap: spacing.sm },
});
