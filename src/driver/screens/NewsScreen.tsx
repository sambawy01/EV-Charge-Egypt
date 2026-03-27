import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/core/theme';
import { typography } from '@/core/theme/typography';
import { spacing } from '@/core/theme/spacing';
import { newsService, NewsArticle } from '@/core/services/newsService';
import { useVehicles } from '@/core/queries/useVehicles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type CategoryFilter = 'all' | 'egypt' | 'global' | 'tech' | 'market' | 'review';

const CATEGORIES: { key: CategoryFilter; label: string }[] = [
  { key: 'all', label: 'ALL' },
  { key: 'egypt', label: 'EGYPT' },
  { key: 'global', label: 'GLOBAL' },
  { key: 'tech', label: 'TECH' },
  { key: 'market', label: 'MARKET' },
  { key: 'review', label: 'REVIEWS' },
];

const CATEGORY_COLORS: Record<string, string> = {
  egypt: '#00FF88',
  global: '#00D4FF',
  tech: '#D946EF',
  market: '#FFB020',
  review: '#8B5CF6',
};

const CATEGORY_LABELS: Record<string, string> = {
  egypt: '\u{1F1EA}\u{1F1EC} EGYPT',
  global: '\u{1F30D} GLOBAL',
  tech: '\u{1F52C} TECH',
  market: '\u{1F4CA} MARKET',
  review: '\u2B50 REVIEW',
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

// -- Video Play Button Overlay --
function VideoOverlay() {
  return (
    <View style={styles.videoOverlay}>
      <View style={styles.playButton}>
        <Text style={styles.playIcon}>{'\u25B6'}</Text>
      </View>
    </View>
  );
}

// -- Section Header --
function SectionHeader({ title }: { title: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text
        style={[
          typography.caption,
          {
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 4,
            fontWeight: '700',
          },
        ]}
      >
        {title}
      </Text>
      <LinearGradient
        colors={['#00D4FF', '#D946EF', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.sectionLine}
      />
    </View>
  );
}

// -- Category Pill --
function CategoryPill({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] || '#00D4FF';
  const label = CATEGORY_LABELS[category] || category.toUpperCase();
  return (
    <View style={[styles.categoryPill, { backgroundColor: `${color}22` }]}>
      <Text style={[styles.categoryPillText, { color }]}>{label}</Text>
    </View>
  );
}

// -- Hero Article --
function HeroArticle({
  article,
  onPress,
}: {
  article: NewsArticle;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.heroContainer}>
      <Image
        source={{ uri: article.image }}
        style={styles.heroImage}
        resizeMode="cover"
      />
      {article.videoUrl && <VideoOverlay />}
      <LinearGradient
        colors={['transparent', 'rgba(10,14,26,0.7)', '#0A0E1A']}
        style={styles.heroGradient}
      />
      <View style={styles.heroContent}>
        <CategoryPill category={article.category} />
        <Text
          style={[
            typography.h2,
            {
              color: '#FFFFFF',
              marginTop: 10,
              textShadowColor: 'rgba(0,0,0,0.8)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 8,
            },
          ]}
          numberOfLines={3}
        >
          {article.title}
        </Text>
        <Text
          style={[
            typography.body,
            { color: 'rgba(255,255,255,0.8)', marginTop: 8 },
          ]}
          numberOfLines={2}
        >
          {article.summary}
        </Text>
        <View style={styles.heroMeta}>
          <Text style={[typography.caption, { color: 'rgba(255,255,255,0.6)' }]}>
            {article.source}
          </Text>
          <View style={styles.metaDot} />
          <Text style={[typography.caption, { color: 'rgba(255,255,255,0.6)' }]}>
            {article.readTimeMin} min read
          </Text>
          {article.trending && (
            <View style={styles.trendingBadge}>
              <Text style={styles.trendingBadgeText}>
                {'\u{1F525}'} TRENDING
              </Text>
            </View>
          )}
        </View>
      </View>
      <LinearGradient
        colors={['#00D4FF', '#D946EF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.heroBorderBottom}
      />
    </TouchableOpacity>
  );
}

// -- Trending Card --
function TrendingCard({
  article,
  onPress,
}: {
  article: NewsArticle;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const catColor = CATEGORY_COLORS[article.category] || '#00D4FF';

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <LinearGradient
        colors={['#00D4FF44', '#8B5CF644']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.trendingCardBorder}
      >
        <View style={[styles.trendingCardInner, { backgroundColor: colors.surface }]}>
          <View style={styles.trendingImageWrap}>
            <Image
              source={{ uri: article.image }}
              style={styles.trendingImage}
              resizeMode="cover"
            />
            {article.videoUrl && <VideoOverlay />}
          </View>
          <View style={styles.trendingContent}>
            <View style={styles.trendingCatRow}>
              <View style={[styles.catDot, { backgroundColor: catColor }]} />
              <Text
                style={[
                  typography.small,
                  {
                    color: catColor,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    marginLeft: 6,
                  },
                ]}
              >
                {article.category}
              </Text>
            </View>
            <Text
              style={[
                typography.bodyBold,
                { color: colors.text, marginTop: 6 },
              ]}
              numberOfLines={2}
            >
              {article.title}
            </Text>
            <View style={styles.trendingMeta}>
              <Text style={[typography.caption, { color: colors.textTertiary }]}>
                {article.source}
              </Text>
              <View style={styles.metaDot} />
              <Text style={[typography.caption, { color: colors.textTertiary }]}>
                {formatTimeAgo(article.publishedAt)}
              </Text>
            </View>
            {article.aiPick && (
              <View style={styles.aiPickPill}>
                <Text style={styles.aiPickText}>{'\u{1F916}'} AI PICK</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// -- Editorial Card A (image left, text right) --
function EditorialCardA({
  article,
  onPress,
}: {
  article: NewsArticle;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.editorialA,
        {
          backgroundColor: colors.surface,
          borderColor: colors.surfaceTertiary,
        },
      ]}
    >
      <Image
        source={{ uri: article.image }}
        style={styles.editorialAImage}
        resizeMode="cover"
      />
      <View style={styles.editorialAContent}>
        <CategoryPill category={article.category} />
        <Text
          style={[
            typography.bodyBold,
            { color: colors.text, marginTop: 8 },
          ]}
          numberOfLines={2}
        >
          {article.title}
        </Text>
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: 4 },
          ]}
          numberOfLines={2}
        >
          {article.summary}
        </Text>
        <View style={styles.editorialMeta}>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            {article.source}
          </Text>
          <View style={styles.metaDot} />
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            {article.readTimeMin} min
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// -- Editorial Card B (full width, overlay) --
function EditorialCardB({
  article,
  onPress,
}: {
  article: NewsArticle;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.editorialB}>
      <Image
        source={{ uri: article.image }}
        style={styles.editorialBImage}
        resizeMode="cover"
      />
      {article.videoUrl && <VideoOverlay />}
      <View style={styles.editorialBPillWrap}>
        <CategoryPill category={article.category} />
      </View>
      <LinearGradient
        colors={['transparent', 'rgba(10,14,26,0.85)']}
        style={styles.editorialBGradient}
      />
      <View style={styles.editorialBOverlay}>
        <Text
          style={[
            typography.bodyBold,
            {
              color: '#FFFFFF',
              textShadowColor: 'rgba(0,0,0,0.6)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 4,
            },
          ]}
          numberOfLines={2}
        >
          {article.title}
        </Text>
        <Text
          style={[
            typography.caption,
            { color: 'rgba(255,255,255,0.6)', marginTop: 4 },
          ]}
        >
          {article.source}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// -- Tech Grid Card --
function TechCard({
  article,
  onPress,
}: {
  article: NewsArticle;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.techCard,
        { backgroundColor: colors.surface, borderColor: colors.surfaceTertiary },
      ]}
    >
      <Image
        source={{ uri: article.image }}
        style={styles.techCardImage}
        resizeMode="cover"
      />
      <View style={styles.techCardContent}>
        <Text
          style={[typography.bodyBold, { color: colors.text }]}
          numberOfLines={2}
        >
          {article.title}
        </Text>
        <Text
          style={[
            typography.caption,
            { color: colors.textTertiary, marginTop: 4 },
          ]}
        >
          {article.source}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ===== MAIN SCREEN =====
export function NewsScreen() {
  const { colors } = useTheme();
  const { data: vehicles } = useVehicles();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');

  const userVehicleMake = vehicles?.[0]?.make;

  const allArticles = useMemo(
    () => newsService.getDailyFeed(userVehicleMake),
    [userVehicleMake],
  );

  const filteredArticles = useMemo(() => {
    if (activeCategory === 'all') return allArticles;
    return allArticles.filter((a) => a.category === activeCategory);
  }, [allArticles, activeCategory]);

  // Derive sections
  const heroArticle = filteredArticles[0] || null;
  const trendingArticles = allArticles.filter((a) => a.trending);
  const editorsPicks = filteredArticles.filter((a) => a.aiPick || !a.trending).slice(0, 4);
  const techArticles = allArticles.filter((a) => a.category === 'tech').slice(0, 4);

  const handleArticlePress = useCallback((article: NewsArticle) => {
    Alert.alert(
      article.title,
      `${article.summary}\n\nSource: ${article.source}\nRead time: ${article.readTimeMin} min\nCategory: ${article.category}`,
      [{ text: 'Close', style: 'cancel' }],
    );
  }, []);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ===== Magazine Header ===== */}
      <View style={styles.magazineHeader}>
        <Text style={styles.magazineTitle}>CHARGE</Text>
        <Text
          style={[
            typography.caption,
            {
              color: colors.textTertiary,
              textTransform: 'uppercase',
              letterSpacing: 6,
              marginTop: 2,
            },
          ]}
        >
          MAGAZINE
        </Text>
        <Text
          style={[
            typography.mono,
            { color: colors.textTertiary, marginTop: 8 },
          ]}
        >
          {todayFormatted}
        </Text>
        <LinearGradient
          colors={['#00D4FF', '#D946EF', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerLine}
        />
      </View>

      {/* ===== Hero Article ===== */}
      {heroArticle && (
        <HeroArticle
          article={heroArticle}
          onPress={() => handleArticlePress(heroArticle)}
        />
      )}

      {/* ===== Category Tabs ===== */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryTabs}
        style={styles.categoryTabsScroll}
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              activeOpacity={0.7}
              onPress={() => setActiveCategory(cat.key)}
              style={styles.categoryTab}
            >
              <Text
                style={[
                  typography.caption,
                  {
                    color: isActive ? '#00D4FF' : colors.textTertiary,
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    fontWeight: isActive ? '700' : '400',
                  },
                ]}
              >
                {cat.label}
              </Text>
              {isActive && (
                <LinearGradient
                  colors={['#00D4FF', '#D946EF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.tabUnderline}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ===== Trending Now ===== */}
      {trendingArticles.length > 0 && (
        <>
          <SectionHeader title="TRENDING NOW" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingRow}
            snapToInterval={292}
            decelerationRate="fast"
          >
            {trendingArticles.map((article) => (
              <TrendingCard
                key={article.id}
                article={article}
                onPress={() => handleArticlePress(article)}
              />
            ))}
          </ScrollView>
        </>
      )}

      {/* ===== Editor's Picks ===== */}
      {editorsPicks.length > 0 && (
        <>
          <SectionHeader title="EDITOR'S PICKS" />
          <View style={styles.editorialSection}>
            {editorsPicks.map((article, idx) =>
              idx % 2 === 0 ? (
                <EditorialCardA
                  key={article.id}
                  article={article}
                  onPress={() => handleArticlePress(article)}
                />
              ) : (
                <EditorialCardB
                  key={article.id}
                  article={article}
                  onPress={() => handleArticlePress(article)}
                />
              ),
            )}
          </View>
        </>
      )}

      {/* ===== Tech & Innovation ===== */}
      {techArticles.length > 0 && (
        <>
          <SectionHeader title="TECH & INNOVATION" />
          <View style={styles.techGrid}>
            {techArticles.map((article) => (
              <TechCard
                key={article.id}
                article={article}
                onPress={() => handleArticlePress(article)}
              />
            ))}
          </View>
        </>
      )}

      {/* ===== Community Footer ===== */}
      <View style={styles.communitySection}>
        <LinearGradient
          colors={['#00D4FF22', '#D946EF22']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.communityBorder}
        >
          <View
            style={[
              styles.communityInner,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            <Text
              style={[
                typography.caption,
                {
                  color: colors.textTertiary,
                  textTransform: 'uppercase',
                  letterSpacing: 4,
                  fontWeight: '700',
                },
              ]}
            >
              FROM THE COMMUNITY
            </Text>
            <Text
              style={[
                typography.body,
                { color: colors.textSecondary, marginTop: 12, textAlign: 'center' },
              ]}
            >
              Got an EV story? Share with our community
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.shareButton}
            >
              <Text style={styles.shareButtonText}>Share Story</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Bottom spacing */}
      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

// ===== STYLES =====
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 60,
    paddingBottom: 40,
  },

  // Magazine Header
  magazineHeader: {
    paddingHorizontal: 20,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  magazineTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 40,
    fontWeight: '700',
    color: '#00D4FF',
    letterSpacing: 8,
  },
  headerLine: {
    height: 1,
    width: '100%',
    marginTop: 16,
  },

  // Hero
  heroContainer: {
    width: '100%',
    height: 350,
    marginBottom: 24,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 24,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  heroBorderBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  trendingBadge: {
    backgroundColor: 'rgba(217, 70, 239, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    marginLeft: 10,
  },
  trendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D946EF',
  },

  // Category Tabs
  categoryTabsScroll: {
    marginBottom: 28,
  },
  categoryTabs: {
    paddingHorizontal: 20,
    gap: 24,
  },
  categoryTab: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  tabUnderline: {
    height: 2,
    width: '100%',
    marginTop: 6,
    borderRadius: 1,
  },

  // Section Header
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionLine: {
    height: 1,
    width: '100%',
    marginTop: 10,
  },

  // Category Pill
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Meta dot
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 8,
  },

  // Video overlay
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  playIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    marginLeft: 4,
  },

  // Trending Cards
  trendingRow: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 4,
  },
  trendingCardBorder: {
    width: 280,
    borderRadius: 16,
    padding: 1,
  },
  trendingCardInner: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  trendingImageWrap: {
    width: '100%',
    height: 180,
    overflow: 'hidden',
  },
  trendingImage: {
    width: '100%',
    height: '100%',
  },
  trendingContent: {
    padding: 14,
  },
  trendingCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  trendingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  aiPickPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    marginTop: 8,
  },
  aiPickText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00D4FF',
  },

  // Editorial Cards
  editorialSection: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 8,
  },

  // Card A: image left
  editorialA: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  editorialAImage: {
    width: 140,
    height: '100%',
    minHeight: 140,
  },
  editorialAContent: {
    flex: 1,
    padding: 14,
  },
  editorialMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  // Card B: full width overlay
  editorialB: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 200,
  },
  editorialBImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  editorialBPillWrap: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 5,
  },
  editorialBGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  editorialBOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },

  // Tech Grid
  techGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 8,
  },
  techCard: {
    width: (SCREEN_WIDTH - 40 - 12) / 2,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  techCardImage: {
    width: '100%',
    height: 120,
  },
  techCardContent: {
    padding: 12,
  },

  // Community
  communitySection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  communityBorder: {
    borderRadius: 16,
    padding: 1,
  },
  communityInner: {
    borderRadius: 15,
    padding: 28,
    alignItems: 'center',
  },
  shareButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#00D4FF',
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00D4FF',
    letterSpacing: 1,
  },
});
