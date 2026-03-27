const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '';
const API_URL = 'https://api.anthropic.com/v1/messages';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
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
      nearestStation?: string;
      nearestStationDistance?: string;
      userName?: string;
    },
    conversationHistory: ClaudeMessage[] = [],
  ): Promise<string> {
    if (!ANTHROPIC_KEY) {
      return this.fallbackResponse(userMessage);
    }

    const systemPrompt = `You are WattsOn AI, the intelligent copilot for WattsOn — Egypt's premier EV charging app. You help Egyptian EV drivers with:

- Finding nearby charging stations (we have ${context.stationCount || 100}+ stations across Egypt)
- Trip planning with charging stops (Cairo to Hurghada, Alexandria, Sharm El Sheikh, etc.)
- Battery health advice and charging optimization
- Cost comparisons between charging providers
- EV knowledge (specs, maintenance, tips)
- Egypt-specific EV information (providers: Elsewedy Plug, Sha7en, IKARUS, Infinity EV, Revolta, KarmCharge)

User's vehicle: ${context.vehicleMake || 'Unknown'} ${context.vehicleModel || 'EV'} (${context.batteryKwh || 60} kWh battery, ~${context.rangeKm || 400} km range)
${context.nearestStation ? `Nearest station: ${context.nearestStation} (${context.nearestStationDistance})` : ''}
${context.userName ? `User's name: ${context.userName}` : ''}

Key facts about EV charging in Egypt:
- Average charging cost: 2.5-4.5 EGP/kWh
- Main providers: Elsewedy Plug (largest network), Sha7en, IKARUS, Infinity EV, Revolta Egypt
- Common connectors: CCS2, Type 2, CHAdeMO
- Booking is NOT available — stations are first-come, first-served
- Off-peak hours (10 PM - 6 AM) are cheaper for charging
- Egypt's hot climate (35°C+) affects battery health — recommend charging in cooler hours
- Cairo to Hurghada: ~460 km, Cairo to Alexandria: ~220 km, Cairo to Sharm: ~500 km

Be concise, friendly, and helpful. Use emoji sparingly. Give specific, actionable advice. If asked about stations, mention real Egyptian station names and providers. Keep responses under 150 words unless the user asks for details.`;

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
