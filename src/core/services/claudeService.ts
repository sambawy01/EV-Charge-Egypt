const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '';
const API_URL = 'https://api.anthropic.com/v1/messages';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StationContext {
  name: string;
  distance: string;
  power: string;
  connectors: string;
  status: string;
  provider: string;
  city: string;
  address: string;
  id: string;
  latitude: number;
  longitude: number;
}

export const claudeService = {
  async chat(
    userMessage: string,
    context: {
      vehicleMake?: string;
      vehicleModel?: string;
      batteryKwh?: number;
      rangeKm?: number;
      stationCount?: number;
      userName?: string;
      stations?: StationContext[];
      batteryInfo?: string;
    },
    conversationHistory: ClaudeMessage[] = [],
  ): Promise<string> {
    if (!ANTHROPIC_KEY) {
      return this.fallbackResponse(userMessage);
    }

    const stationList = context.stations?.slice(0, 15).map((s, i) =>
      `${i + 1}. ${s.name} (${s.distance}) — ${s.connectors || 'Type 2'} ${s.power} — ${s.status} — ${s.city}`
    ).join('\n') || 'No station data available';

    const systemPrompt = `You are WattsOn AI, the intelligent copilot for WattsOn — Egypt's smart EV charging app.

## Your Personality
- Friendly, knowledgeable, concise
- You speak like a tech-savvy friend who knows EVs inside out
- Use Egyptian context when relevant (weather, routes, providers)
- Keep responses under 120 words unless asked for detail

## User's Vehicle
${context.vehicleMake ? `${context.vehicleMake} ${context.vehicleModel} — ${context.batteryKwh} kWh battery, ~${context.rangeKm || Math.round((context.batteryKwh || 60) * 6.5)} km range` : 'No vehicle registered yet'}
${context.batteryInfo || ''}

## Nearby Charging Stations (real-time data)
${stationList}

## Egypt EV Knowledge
- Providers: Elsewedy Plug (largest, 30+ stations), Sha7en (10+ stations), IKARUS (5 stations), Infinity EV (20+ stations), Revolta/KarmCharge
- Charging cost: 2.5-4.5 EGP/kWh, off-peak (10PM-6AM) is cheapest
- Common connectors: CCS2 (fast), Type 2 (AC), CHAdeMO (rare)
- No advance booking — all first-come first-served
- Climate: hot summers (35-45°C) affect battery — charge in evening when possible
- Key routes: Cairo→Hurghada (460km), Cairo→Alex (220km), Cairo→Sharm (500km), Cairo→Sokhna (130km)

## Rules
1. ALWAYS reference actual station names and distances from the data above when recommending stations
2. Never make up station names — only use ones from the list
3. When recommending stations, always mention the station name, distance, and power. Be specific, not generic.
4. If recommending a station, add at the end: ACTION:station:StationName
5. If suggesting a trip, add: ACTION:trip:DestinationCity
6. If the user wants to navigate somewhere or take an action, include an ACTION line at the end of your response in the format: ACTION:navigate:stationName or ACTION:trip:destination or ACTION:map:filterType
7. Be specific about power levels, connector types, and distances
8. ${context.userName ? `Address the user as ${context.userName} occasionally` : ''}`;

    try {
      const messages = [
        ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: userMessage },
      ];

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          system: systemPrompt,
          messages,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn('[claudeService] API error:', response.status, errText);
        return this.fallbackResponse(userMessage);
      }

      const data = await response.json();
      return data.content?.[0]?.text || this.fallbackResponse(userMessage);
    } catch (err) {
      console.warn('[claudeService] Fetch failed:', err);
      return this.fallbackResponse(userMessage);
    }
  },

  fallbackResponse(input: string): string {
    const lower = input.toLowerCase();
    if (lower.includes('nearest') || lower.includes('find') || lower.includes('station'))
      return "I can help you find nearby stations! Check the Map tab to see all 100+ stations across Egypt with real-time availability.";
    if (lower.includes('trip') || lower.includes('plan') || lower.includes('route'))
      return "Use the Trip Planner in the Vehicle tab to plan your route with optimized charging stops!";
    if (lower.includes('battery') || lower.includes('health'))
      return "Check your Vehicle tab for detailed AI battery health analysis including degradation estimates and optimization tips.";
    if (lower.includes('cost') || lower.includes('cheap') || lower.includes('price'))
      return "Charging costs in Egypt range from 2.5-4.5 EGP/kWh. Off-peak hours (after 10 PM) are typically cheaper.";
    return "I'm your WattsOn AI copilot! I can help with finding stations, planning trips, battery health, and charging costs. What would you like to know?";
  },
};
