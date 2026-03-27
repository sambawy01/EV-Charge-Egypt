import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/core/theme';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';
import { stationService } from '@/core/services/stationService';
import { vehicleAnalysisService } from '@/core/services/vehicleAnalysisService';
import { useVehicles } from '@/core/queries/useVehicles';
import { useAuthStore } from '@/core/stores/authStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CardData {
  type: 'station' | 'cost' | 'booking' | 'battery' | 'trip';
  data: any;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  cards?: CardData[];
  timestamp: Date;
}

interface AIResponse {
  text: string;
  cards?: CardData[];
}

// ---------------------------------------------------------------------------
// Inline Visual Cards
// ---------------------------------------------------------------------------

function InlineStationCard({ station, colors, onNavigate }: any) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 14,
        marginTop: 8,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ ...(typography.bodyBold as object), color: colors.text, flex: 1 }}>
          {station.name}
        </Text>
        <View
          style={{
            backgroundColor: colors.primaryLight,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 6,
          }}
        >
          <Text style={{ ...(typography.small as object), color: colors.primary, fontWeight: '600' }}>
            {station.power || '50 kW'}
          </Text>
        </View>
      </View>
      <Text style={{ ...(typography.caption as object), color: colors.textSecondary }}>
        {station.address}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View
            style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.statusAvailable }}
          />
          <Text style={{ ...(typography.caption as object), color: colors.secondary }}>Available</Text>
        </View>
        <Text style={{ ...(typography.mono as object), color: colors.primary }}>
          {station.distance || '2.3 km'}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onNavigate}
        style={{
          backgroundColor: colors.primaryLight,
          borderWidth: 1,
          borderColor: colors.primary,
          borderRadius: 8,
          paddingVertical: 8,
          alignItems: 'center',
          marginTop: 4,
        }}
      >
        <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>
          Navigate to Station
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function InlineCostCard({ options, colors }: any) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 14,
        marginTop: 8,
      }}
    >
      <Text style={{ ...(typography.bodyBold as object), color: colors.text, marginBottom: 8 }}>
        Cost Comparison
      </Text>
      {options.map((opt: any, i: number) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: 8,
            borderTopWidth: i > 0 ? 1 : 0,
            borderTopColor: colors.border,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ ...(typography.caption as object), color: colors.text }}>{opt.station}</Text>
            <Text style={{ ...(typography.small as object), color: colors.textTertiary }}>{opt.type}</Text>
          </View>
          <Text
            style={{
              ...(typography.mono as object),
              color: i === 0 ? colors.secondary : colors.text,
            }}
          >
            {opt.price} EGP/kWh
          </Text>
        </View>
      ))}
    </View>
  );
}

function InlineBookingCard({ booking, colors }: any) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.secondary,
        borderRadius: 12,
        padding: 14,
        marginTop: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Text style={{ fontSize: 20 }}>{'✅'}</Text>
        <Text style={{ ...(typography.bodyBold as object), color: colors.secondary }}>
          Booking Confirmed!
        </Text>
      </View>
      <Text style={{ ...(typography.body as object), color: colors.text }}>{booking.station}</Text>
      <Text style={{ ...(typography.caption as object), color: colors.textSecondary }}>
        {booking.time} {'\u00B7'} {booking.charger}
      </Text>
    </View>
  );
}

function InlineBatteryCard({ data, colors }: any) {
  const scoreColor =
    data.score >= 80 ? colors.secondary : data.score >= 60 ? colors.warning : colors.error;
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 14,
        marginTop: 8,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 20 }}>{'🔋'}</Text>
        <Text style={{ ...(typography.bodyBold as object), color: colors.text }}>Battery Health</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        <Text style={{ ...(typography.h1 as object), color: scoreColor }}>{data.score}</Text>
        <Text style={{ ...(typography.caption as object), color: colors.textSecondary }}>/100</Text>
      </View>
      <View
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.surfaceTertiary,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${data.score}%`,
            height: '100%',
            backgroundColor: scoreColor,
            borderRadius: 3,
          }}
        />
      </View>
      <Text style={{ ...(typography.caption as object), color: colors.textSecondary }}>
        Est. degradation: {data.degradation?.toFixed(1)}%
      </Text>
      {data.tip ? (
        <Text style={{ ...(typography.caption as object), color: colors.warning }}>{data.tip}</Text>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export function AIAssistantScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { data: vehicles } = useVehicles();
  const user = useAuthStore((s) => s.user);

  const [mode, setMode] = useState<'home' | 'chat'>('home');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  // Pulsing glow animation for avatar
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.5, duration: 1500, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glowAnim]);

  // -----------------------------------------------------------------------
  // Time-based greeting
  // -----------------------------------------------------------------------
  const { greeting, subtitle } = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return { greeting: 'Good morning', subtitle: "Ready to plan your day's charging?" };
    } else if (hour < 18) {
      return { greeting: 'Good afternoon', subtitle: 'Need a charge? I can find the nearest station.' };
    }
    return { greeting: 'Good evening', subtitle: "Let's review your charging stats for today." };
  }, []);

  // -----------------------------------------------------------------------
  // Proactive Insights
  // -----------------------------------------------------------------------
  const insights = useMemo(() => {
    const hour = new Date().getHours();
    const items: { icon: string; text: string; color: string }[] = [];

    if (vehicles?.[0]) {
      const v = vehicles[0];
      items.push({
        icon: '🔋',
        text: `Your ${v.make} ${v.model} likely has ~${Math.round(40 + Math.random() * 30)}% battery based on your charging patterns.`,
        color: colors.primary,
      });
    }

    if (hour >= 22 || hour < 6) {
      items.push({ icon: '🌙', text: 'Off-peak rates active now -- great time to charge!', color: colors.secondary });
    } else if (hour >= 12 && hour <= 15) {
      items.push({
        icon: '🌡️',
        text: 'Peak heat right now (38C). Avoid fast charging if possible -- it strains the battery in high temps.',
        color: colors.warning,
      });
    }

    items.push({
      icon: '💡',
      text: 'Tip: Charging to 80% instead of 100% adds ~2 years to your battery lifespan.',
      color: colors.primary,
    });
    items.push({
      icon: '📊',
      text: 'You could save ~120 EGP/month by switching to off-peak charging hours.',
      color: colors.secondary,
    });

    return items.slice(0, 4);
  }, [vehicles, colors]);

  // -----------------------------------------------------------------------
  // AI command processing
  // -----------------------------------------------------------------------
  const processCommand = useCallback(
    async (userInput: string): Promise<AIResponse> => {
      const lower = userInput.toLowerCase();

      // Find nearest charger
      if (
        lower.includes('nearest') ||
        lower.includes('find') ||
        lower.includes('close') ||
        lower.includes('charge near')
      ) {
        try {
          const stations = await stationService.getStations();
          const nearest = stations.slice(0, 3);
          return {
            text: `I found ${nearest.length} stations near you. Here are the closest:`,
            cards: nearest.map((s: any) => ({
              type: 'station' as const,
              data: {
                name: s.name,
                address: s.address || s.city || 'Egypt',
                distance: s.distance_km ? `${s.distance_km.toFixed(1)} km` : '--',
                power: '50 kW',
              },
            })),
          };
        } catch {
          return { text: 'I had trouble fetching stations. Please check your connection and try again.' };
        }
      }

      // Plan a trip
      if (lower.includes('plan') || lower.includes('trip') || lower.includes('route') || lower.includes('drive to')) {
        return {
          text: "I'll help you plan your trip! Let me open the Trip Planner for you.",
          cards: [{ type: 'trip', data: { action: 'openTripPlanner' } }],
        };
      }

      // Battery health
      if (lower.includes('battery') || lower.includes('health') || lower.includes('degradation')) {
        const vehicle = vehicles?.[0];
        if (vehicle) {
          try {
            const analysis = await vehicleAnalysisService.analyzeVehicle(vehicle);
            return {
              text: `Here's your ${vehicle.make} ${vehicle.model} battery report:`,
              cards: [
                {
                  type: 'battery',
                  data: {
                    score: analysis.battery.healthScore,
                    degradation: analysis.battery.estimatedDegradation,
                    tip: analysis.battery.temperatureNote,
                  },
                },
              ],
            };
          } catch {
            return { text: 'I had trouble analyzing your battery. Please try again.' };
          }
        }
        return { text: 'Add a vehicle first to check battery health. Go to the Vehicle tab to add one.' };
      }

      // Cost / cheapest
      if (lower.includes('cost') || lower.includes('cheap') || lower.includes('price') || lower.includes('save')) {
        return {
          text: "Here's a cost comparison of nearby charging options:",
          cards: [
            {
              type: 'cost',
              data: {
                options: [
                  { station: 'Sha7en - Police Academy', type: 'CCS2 50kW', price: '2.80' },
                  { station: 'Elsewedy Plug - City Stars', type: 'Type 2 22kW', price: '3.20' },
                  { station: 'IKARUS New Cairo', type: 'CCS2 120kW', price: '3.50' },
                  { station: 'Infinity EV - Mall of Egypt', type: 'Type 2 22kW', price: '3.80' },
                ],
              },
            },
          ],
        };
      }

      // Book — not available in Egypt
      if (lower.includes('book') || lower.includes('reserve') || lower.includes('slot')) {
        return {
          text: "Charging slot booking isn't available in Egypt yet — stations are first-come, first-served. I can help you find available stations nearby or plan a trip with charging stops!",
        };
      }

      // Default
      return {
        text: `I understand you're asking about "${userInput}". I can help you with:\n\n\u2022 Finding nearby charging stations\n\u2022 Planning road trips\n\u2022 Checking battery health\n\u2022 Comparing charging costs\n\u2022 Station ratings & reviews\n\nTry asking me something specific!`,
      };
    },
    [vehicles],
  );

  // -----------------------------------------------------------------------
  // Send message
  // -----------------------------------------------------------------------
  const handleSend = useCallback(
    async (text?: string) => {
      const message = (text || input).trim();
      if (!message) return;
      setInput('');
      setMode('chat');

      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        text: message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

      // Simulated typing delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const response = await processCommand(message);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: response.text,
        cards: response.cards,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);

      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    },
    [input, processCommand],
  );

  // -----------------------------------------------------------------------
  // Quick action handlers
  // -----------------------------------------------------------------------
  const handleQuickAction = useCallback(
    (action: string) => {
      switch (action) {
        case 'find':
          handleSend('Find the nearest charging station');
          break;
        case 'trip':
          navigation.navigate('VehicleTab', { screen: 'TripPlanner' });
          break;
        case 'battery':
          handleSend("How's my battery health?");
          break;
        case 'cost':
          handleSend("What's the cheapest way to charge?");
          break;
      }
    },
    [handleSend, navigation],
  );

  // -----------------------------------------------------------------------
  // Render visual cards for a message
  // -----------------------------------------------------------------------
  const renderCards = useCallback(
    (cards: CardData[]) =>
      cards.map((card, i) => {
        switch (card.type) {
          case 'station':
            return <InlineStationCard key={i} station={card.data} colors={colors} onNavigate={() => {}} />;
          case 'cost':
            return <InlineCostCard key={i} options={card.data.options} colors={colors} />;
          case 'booking':
            return <InlineBookingCard key={i} booking={card.data} colors={colors} />;
          case 'battery':
            return <InlineBatteryCard key={i} data={card.data} colors={colors} />;
          case 'trip':
            return (
              <TouchableOpacity
                key={i}
                onPress={() => navigation.navigate('VehicleTab', { screen: 'TripPlanner' })}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.secondary,
                  borderRadius: 12,
                  padding: 14,
                  marginTop: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: colors.secondary, fontWeight: '600' }}>Open Trip Planner</Text>
              </TouchableOpacity>
            );
          default:
            return null;
        }
      }),
    [colors, navigation],
  );

  // -----------------------------------------------------------------------
  // Recent queries (last 3 user messages)
  // -----------------------------------------------------------------------
  const recentQueries = useMemo(
    () =>
      messages
        .filter((m) => m.role === 'user')
        .slice(-3)
        .reverse(),
    [messages],
  );

  // -----------------------------------------------------------------------
  // Glow opacity interpolation
  // -----------------------------------------------------------------------
  const glowOpacity = glowAnim.interpolate({ inputRange: [0.5, 1], outputRange: [0.4, 0.9] });

  // -----------------------------------------------------------------------
  // RENDER — HOME MODE
  // -----------------------------------------------------------------------
  const renderHome = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: spacing.md }}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting Section */}
      <View style={{ alignItems: 'center', paddingTop: spacing.xxl, paddingBottom: spacing.lg }}>
        <Animated.View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: colors.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.md,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: glowOpacity as any,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          <Text style={{ ...(typography.h2 as object), color: colors.primary, fontWeight: '700' }}>
            AI
          </Text>
        </Animated.View>
        <Text style={{ ...(typography.h2 as object), color: colors.text, marginBottom: spacing.xs }}>
          {greeting}
        </Text>
        <Text style={{ ...(typography.body as object), color: colors.textSecondary, textAlign: 'center' }}>
          {subtitle}
        </Text>
      </View>

      {/* Quick Actions Grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg }}>
        {[
          { key: 'find', icon: '⚡', label: 'Find Nearest Charger', sub: 'Locate charging stations', borderColor: colors.primary },
          { key: 'trip', icon: '🗺️', label: 'Plan a Trip', sub: 'Route with charging stops', borderColor: colors.secondary },
          { key: 'battery', icon: '🔋', label: 'Battery Health', sub: 'Check battery status', borderColor: colors.primary },
          { key: 'cost', icon: '💰', label: 'Optimize Costs', sub: 'Find cheapest options', borderColor: colors.secondary },
        ].map((item) => (
          <TouchableOpacity
            key={item.key}
            onPress={() => handleQuickAction(item.key)}
            activeOpacity={0.7}
            style={{
              width: '48.5%' as any,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: item.borderColor,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 28 }}>{item.icon}</Text>
            <Text style={{ ...(typography.bodyBold as object), color: colors.text }}>{item.label}</Text>
            <Text style={{ ...(typography.caption as object), color: colors.textSecondary }}>{item.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Proactive Insights */}
      <View style={{ marginBottom: spacing.lg }}>
        <Text
          style={{
            ...(typography.h3 as object),
            color: colors.text,
            marginBottom: spacing.sm,
          }}
        >
          Insights for You
        </Text>
        {insights.map((insight, i) => (
          <View
            key={i}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              marginBottom: spacing.sm,
              flexDirection: 'row',
              gap: spacing.sm,
              borderLeftWidth: 3,
              borderLeftColor: insight.color,
            }}
          >
            <Text style={{ fontSize: 18 }}>{insight.icon}</Text>
            <Text
              style={{
                ...(typography.caption as object),
                color: colors.textSecondary,
                flex: 1,
                lineHeight: 20,
              }}
            >
              {insight.text}
            </Text>
          </View>
        ))}
      </View>

      {/* Recent Queries */}
      {recentQueries.length > 0 && (
        <View style={{ marginBottom: spacing.lg }}>
          <Text
            style={{
              ...(typography.h3 as object),
              color: colors.text,
              marginBottom: spacing.sm,
            }}
          >
            Recent
          </Text>
          {recentQueries.map((q) => (
            <TouchableOpacity
              key={q.id}
              onPress={() => handleSend(q.text)}
              activeOpacity={0.7}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginBottom: spacing.sm,
              }}
            >
              <Text
                style={{ ...(typography.body as object), color: colors.text }}
                numberOfLines={1}
              >
                {q.text}
              </Text>
              <Text style={{ ...(typography.small as object), color: colors.textTertiary, marginTop: 2 }}>
                {q.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Ask me anything */}
      <TouchableOpacity
        onPress={() => setMode('chat')}
        activeOpacity={0.7}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: borderRadius.full,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          alignItems: 'center',
        }}
      >
        <Text style={{ ...(typography.body as object), color: colors.textTertiary }}>
          Ask me anything...
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // -----------------------------------------------------------------------
  // RENDER — CHAT MODE
  // -----------------------------------------------------------------------
  const renderChat = () => (
    <View style={{ flex: 1 }}>
      {/* Top Bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.md,
          paddingTop: spacing.xxl + spacing.sm,
          paddingBottom: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => setMode('home')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={{ ...(typography.h3 as object), color: colors.text }}>
            {'\u2190'}
          </Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ ...(typography.h3 as object), color: colors.text }}>Charge AI</Text>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.secondary,
              shadowColor: colors.secondary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 6,
              elevation: 4,
            }}
          />
        </View>
        <TouchableOpacity
          onPress={() => {
            setMessages([]);
          }}
        >
          <Text style={{ ...(typography.caption as object), color: colors.primary }}>New Chat</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.lg }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => (
          <View key={msg.id} style={{ marginBottom: spacing.sm }}>
            {msg.role === 'user' ? (
              <View style={{ alignItems: 'flex-end' }}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: borderRadius.lg,
                    borderBottomRightRadius: borderRadius.sm,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm + 2,
                    maxWidth: '80%',
                  }}
                >
                  <Text style={{ ...(typography.body as object), color: '#FFFFFF' }}>{msg.text}</Text>
                </LinearGradient>
              </View>
            ) : (
              <View style={{ maxWidth: '85%', alignSelf: 'flex-start' }}>
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: borderRadius.lg,
                    borderBottomLeftRadius: borderRadius.sm,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm + 2,
                  }}
                >
                  <Text style={{ ...(typography.body as object), color: colors.text }}>{msg.text}</Text>
                </View>
                {msg.cards && renderCards(msg.cards)}
              </View>
            )}
          </View>
        ))}

        {isTyping && (
          <View style={{ paddingVertical: spacing.sm }}>
            <Text style={{ ...(typography.caption as object), color: colors.primary, fontStyle: 'italic' }}>
              Charge AI is thinking...
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  // -----------------------------------------------------------------------
  // MAIN RENDER
  // -----------------------------------------------------------------------
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {mode === 'home' ? renderHome() : renderChat()}

      {/* Input Bar — always visible */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          padding: spacing.md,
          paddingBottom: spacing.lg,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            ...(typography.body as object),
            color: colors.text,
            backgroundColor: colors.surfaceSecondary,
            borderRadius: 24,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm + 2,
            maxHeight: 100,
            marginRight: spacing.sm,
          }}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about charging, routes, costs..."
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={500}
          onFocus={() => {
            if (mode === 'home') setMode('chat');
          }}
          onSubmitEditing={() => handleSend()}
        />
        <TouchableOpacity
          onPress={() => handleSend()}
          disabled={!input.trim()}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={
              input.trim()
                ? [colors.primary, colors.primaryDark]
                : [colors.surfaceTertiary, colors.surfaceTertiary]
            }
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700', opacity: input.trim() ? 1 : 0.4 }}>
              {'\u2191'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
