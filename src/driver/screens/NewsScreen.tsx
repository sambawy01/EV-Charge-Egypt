import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/core/theme';
import { typography } from '@/core/theme/typography';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { newsService, NewsArticle } from '@/core/services/newsService';
import { useVehicles } from '@/core/queries/useVehicles';

type CategoryFilter = 'trending' | 'egypt' | 'global' | 'tech' | 'market' | 'review';

const CATEGORIES: { key: CategoryFilter; label: string; emoji: string }[] = [
  { key: 'trending', label: 'Trending', emoji: '\u{1F525}' },
  { key: 'egypt', label: 'Egypt', emoji: '\u{1F1EA}\u{1F1EC}' },
  { key: 'global', label: 'Global', emoji: '\u{1F30D}' },
  { key: 'tech', label: 'Tech', emoji: '\u{1F52C}' },
  { key: 'market', label: 'Market', emoji: '\u{1F4CA}' },
  { key: 'review', label: 'Reviews', emoji: '\u2B50' },
];

const CATEGORY_DOT_COLORS: Record<NewsArticle['category'], string> = {
  egypt: '#00FF88',
  global: '#00D4FF',
  tech: '#D946EF',
  market: '#FFB020',
  review: '#8B5CF6',
};

function formatTimeAgo(isoString: string): string {
  const now = new Date();
  const published = new Date(isoString);
  const diffMs = now.getTime() - published.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffHours < 48) return 'Yesterday';
  return `${Math.floor(diffHours / 24)}d ago`;
}

function TrendingBadge() {
  return (
    <View style={[styles.badge, { backgroundColor: 'rgba(217, 70, 239, 0.15)' }]}>
      <Text style={[styles.badgeText, { color: '#D946EF' }]}>{'\u{1F525}'} Trending</Text>
    </View>
  );
}

function AiPickBadge() {
  return (
    <View style={[styles.badge, { backgroundColor: 'rgba(0, 212, 255, 0.15)' }]}>
      <Text style={[styles.badgeText, { color: '#00D4FF' }]}>{'\u{1F916}'} AI Pick</Text>
    </View>
  );
}

function FeaturedCard({
  article,
  colors,
  onPress,
}: {
  article: NewsArticle;
  colors: any;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.featuredWrapper}>
      <LinearGradient
        colors={['rgba(0, 212, 255, 0.25)', 'rgba(217, 70, 239, 0.25)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.featuredGradientBorder}
      >
        <LinearGradient
          colors={[colors.surface, colors.surfaceTertiary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.featuredInner}
        >
          <Text style={styles.featuredEmoji}>{article.imageEmoji}</Text>

          <Text
            style={[typography.h3, { color: colors.text, marginTop: spacing.sm }]}
            numberOfLines={2}
          >
            {article.title}
          </Text>

          <Text
            style={[
              typography.body,
              { color: colors.textSecondary, marginTop: spacing.xs },
            ]}
            numberOfLines={3}
          >
            {article.summary}
          </Text>

          <View style={styles.featuredMeta}>
            <Text style={[typography.caption, { color: colors.textTertiary }]}>
              {article.source}
            </Text>
            <View style={styles.metaDot} />
            <Text style={[typography.caption, { color: colors.textTertiary }]}>
              {article.readTimeMin} min read
            </Text>
            <View style={{ flex: 1 }} />
            <View style={styles.badgeRow}>
              {article.trending && <TrendingBadge />}
              {article.aiPick && <AiPickBadge />}
            </View>
          </View>
        </LinearGradient>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function ArticleRow({
  article,
  colors,
  onPress,
  isLast,
}: {
  article: NewsArticle;
  colors: any;
  onPress: () => void;
  isLast: boolean;
}) {
  const dotColor = CATEGORY_DOT_COLORS[article.category];

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        styles.articleRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      {/* Emoji thumbnail */}
      <View style={[styles.emojiThumb, { backgroundColor: colors.surfaceSecondary }]}>
        <Text style={{ fontSize: 22 }}>{article.imageEmoji}</Text>
      </View>

      {/* Content */}
      <View style={styles.articleContent}>
        <Text
          style={[typography.bodyBold, { color: colors.text }]}
          numberOfLines={2}
        >
          {article.title}
        </Text>
        <Text
          style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}
          numberOfLines={2}
        >
          {article.summary}
        </Text>
        <View style={styles.articleMeta}>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            {article.source}
          </Text>
          <View style={styles.metaDot} />
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            {formatTimeAgo(article.publishedAt)}
          </Text>
          {article.trending && (
            <Text style={{ fontSize: 12, marginLeft: 6 }}>{'\u{1F525}'}</Text>
          )}
          {article.aiPick && (
            <View style={[styles.badge, styles.badgeSmall, { backgroundColor: 'rgba(0, 212, 255, 0.15)', marginLeft: 6 }]}>
              <Text style={[styles.badgeText, styles.badgeTextSmall, { color: '#00D4FF' }]}>
                {'\u{1F916}'} AI Pick
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Category dot */}
      <View style={[styles.categoryDot, { backgroundColor: dotColor }]} />
    </TouchableOpacity>
  );
}

export function NewsScreen() {
  const { colors } = useTheme();
  const { data: vehicles } = useVehicles();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('trending');

  const userVehicleMake = vehicles?.[0]?.make;

  const allArticles = useMemo(
    () => newsService.getDailyFeed(userVehicleMake),
    [userVehicleMake],
  );

  const filteredArticles = useMemo(() => {
    if (activeCategory === 'trending') {
      return allArticles.filter((a) => a.trending);
    }
    return allArticles.filter((a) => a.category === activeCategory);
  }, [allArticles, activeCategory]);

  const featuredArticle = filteredArticles[0] || null;
  const remainingArticles = filteredArticles.slice(1);

  const handleArticlePress = useCallback((article: NewsArticle) => {
    Alert.alert(
      article.title,
      `${article.summary}\n\nSource: ${article.source}\nRead time: ${article.readTimeMin} min\nCategory: ${article.category}`,
      [{ text: 'Close', style: 'cancel' }],
    );
  }, []);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[typography.h2, { color: colors.text }]}>
          {'\u{1F4F0}'} EV News
        </Text>
        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
          AI-curated daily
        </Text>
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={styles.chipScroll}
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          return isActive ? (
            <LinearGradient
              key={cat.key}
              colors={['#00D4FF', '#D946EF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.chipGradientBorder}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveCategory(cat.key)}
                style={[styles.chipInner, { backgroundColor: colors.surface }]}
              >
                <Text style={styles.chipEmoji}>{cat.emoji}</Text>
                <Text style={[typography.caption, { color: colors.text, fontWeight: '600' }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          ) : (
            <TouchableOpacity
              key={cat.key}
              activeOpacity={0.7}
              onPress={() => setActiveCategory(cat.key)}
              style={[styles.chipInactive, { backgroundColor: colors.surfaceSecondary }]}
            >
              <Text style={styles.chipEmoji}>{cat.emoji}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Featured article */}
      {featuredArticle && (
        <FeaturedCard
          article={featuredArticle}
          colors={colors}
          onPress={() => handleArticlePress(featuredArticle)}
        />
      )}

      {/* Remaining articles */}
      {remainingArticles.length > 0 && (
        <View style={[styles.listCard, { backgroundColor: colors.surface }]}>
          {remainingArticles.map((article, idx) => (
            <ArticleRow
              key={article.id}
              article={article}
              colors={colors}
              onPress={() => handleArticlePress(article)}
              isLast={idx === remainingArticles.length - 1}
            />
          ))}
        </View>
      )}

      {/* Empty state */}
      {filteredArticles.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 40 }}>{'\u{1F4ED}'}</Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
            No articles in this category today
          </Text>
          <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 4 }]}>
            Check back tomorrow for fresh content
          </Text>
        </View>
      )}

      {/* Footer */}
      <Text
        style={[
          typography.caption,
          {
            color: colors.textTertiary,
            textAlign: 'center',
            marginTop: spacing.lg,
            marginBottom: spacing.xxl,
          },
        ]}
      >
        Last updated: {todayFormatted}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },

  // Category chips
  chipScroll: {
    marginBottom: spacing.lg,
  },
  chipRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  chipGradientBorder: {
    borderRadius: borderRadius.full,
    padding: 1.5,
  },
  chipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    gap: 6,
  },
  chipInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    gap: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipEmoji: {
    fontSize: 14,
  },

  // Featured card
  featuredWrapper: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  featuredGradientBorder: {
    borderRadius: borderRadius.xl,
    padding: 1.5,
  },
  featuredInner: {
    borderRadius: borderRadius.xl - 1,
    padding: spacing.lg,
  },
  featuredEmoji: {
    fontSize: 48,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },

  // Article list
  listCard: {
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  articleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm + 4,
  },
  emojiThumb: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleContent: {
    flex: 1,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 4,
  },

  // Meta
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#5A6482',
    marginHorizontal: 6,
  },

  // Badges
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeTextSmall: {
    fontSize: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
});
