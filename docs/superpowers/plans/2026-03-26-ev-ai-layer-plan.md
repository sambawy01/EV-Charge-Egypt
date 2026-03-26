# AI Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the AI intelligence layer powered by Claude API via Supabase Edge Functions, including chat assistant, route planner, cost optimizer, predictive availability, and battery health scoring.
**Architecture:** All AI features are proxied through Supabase Edge Functions that call the Claude API. The client sends structured requests; Edge Functions add context (user profile, vehicle data, charging history) and forward to Claude. Responses are cached and logged to ai_interactions for audit. Mock fallbacks allow the app to function without API keys.
**Tech Stack:** Claude API (Anthropic), Supabase Edge Functions (Deno), React Query, Zustand, React Native

---

## File Structure

```
src/
├── core/
│   ├── services/
│   │   └── aiService.ts
│   ├── queries/
│   │   ├── useAIChat.ts
│   │   ├── useRoutePlanner.ts
│   │   ├── useCostOptimizer.ts
│   │   └── usePrediction.ts
│   └── stores/
│       └── aiStore.ts
├── driver/
│   ├── screens/
│   │   ├── AIAssistantScreen.tsx
│   │   ├── RouteResultScreen.tsx
│   │   └── CostReportScreen.tsx
│   └── components/
│       ├── ChatMessage.tsx
│       ├── SuggestedQuestions.tsx
│       ├── RouteMap.tsx
│       └── CostChart.tsx
├── supabase/
│   └── functions/
│       ├── ai-chat/
│       │   └── index.ts
│       ├── ai-route-planner/
│       │   └── index.ts
│       ├── ai-cost-optimizer/
│       │   └── index.ts
│       ├── ai-predict-availability/
│       │   └── index.ts
│       └── ai-battery-health/
│           └── index.ts
└── __tests__/
    ├── aiService.test.ts
    ├── aiStore.test.ts
    └── ChatMessage.test.tsx
```

---

## Task 1: AI Service

- [ ] **Step 1: Write test**
  - File: `__tests__/aiService.test.ts`
  ```typescript
  import { aiService } from '@/core/services/aiService';

  jest.mock('@/core/config/supabase', () => ({
    supabase: {
      functions: {
        invoke: jest.fn().mockResolvedValue({ data: { message: 'The cheapest charger near Maadi is IKARUS at 0.04 EGP/kWh.' }, error: null }),
      },
    },
  }));

  jest.mock('@/core/config/featureFlags', () => ({
    featureFlags: { MOCK_PROVIDERS: false },
  }));

  describe('aiService', () => {
    it('sends chat message and gets response', async () => {
      const response = await aiService.chat('Where is the cheapest charger near Maadi?', 'u1');
      expect(response).toHaveProperty('message');
      expect(response.message).toContain('Maadi');
    });
    it('has route planning method', () => expect(aiService.planRoute).toBeDefined());
    it('has cost optimizer method', () => expect(aiService.optimizeCosts).toBeDefined());
    it('has availability prediction method', () => expect(aiService.predictAvailability).toBeDefined());
    it('has battery health method', () => expect(aiService.analyzeBatteryHealth).toBeDefined());
  });
  ```

- [ ] **Step 2: Verify fails**
  ```bash
  npx jest __tests__/aiService.test.ts
  ```

- [ ] **Step 3: Implement**
  - File: `src/core/services/aiService.ts`
  ```typescript
  import { supabase } from '../config/supabase';
  import { featureFlags } from '../config/featureFlags';

  export interface ChatMessage { role: 'user' | 'assistant'; content: string; timestamp: string; }
  export interface RouteStop { stationId: string; stationName: string; address: string; latitude: number; longitude: number; estimatedArrival: string; chargeTimeMin: number; estimatedKwh: number; estimatedCost: number; }
  export interface RoutePlan { stops: RouteStop[]; totalDistanceKm: number; totalTimeMin: number; totalChargeCost: number; summary: string; }
  export interface CostReport { totalSpent: number; period: string; byProvider: { provider: string; amount: number; percentage: number }[]; savings: { description: string; amountSavable: number }[]; tips: string[]; monthOverMonthChange: number; }
  export interface AvailabilityPrediction { stationId: string; currentStatus: string; prediction: string; confidence: number; bestTimeToVisit: string; averageWaitMin: number; }
  export interface BatteryHealth { score: number; fastChargeRatio: number; avgDepthOfDischarge: number; recommendations: string[]; degradationEstimate: string; }

  const MOCK_RESPONSES = {
    chat: { message: 'I found several chargers near you. IKARUS Maadi has the best price at 0.04 EGP/kWh with a CCS connector at 60kW. Shall I book it for you?' },
    route: { stops: [{ stationId: 'elsewedy-1', stationName: 'Elsewedy Plug 6th October', address: 'Mall of Arabia', latitude: 29.9727, longitude: 30.9432, estimatedArrival: '2:30 PM', chargeTimeMin: 25, estimatedKwh: 20, estimatedCost: 1.0 }], totalDistanceKm: 450, totalTimeMin: 330, totalChargeCost: 3.5, summary: 'Your trip to El Gouna requires 2 charging stops. Total charging cost: 3.50 EGP.' },
    cost: { totalSpent: 450, period: 'March 2026', byProvider: [{ provider: 'Elsewedy Plug', amount: 180, percentage: 40 }, { provider: 'IKARUS', amount: 135, percentage: 30 }, { provider: 'Sha7en', amount: 135, percentage: 30 }], savings: [{ description: 'Switch 3 sessions to IKARUS (15% cheaper)', amountSavable: 45 }, { description: 'Charge during off-peak hours (9pm-7am)', amountSavable: 30 }], tips: ['Your most expensive charges were on Friday afternoons at Elsewedy Plug.', 'Off-peak charging could save you 75 EGP/month.'], monthOverMonthChange: -5.2 },
    prediction: { stationId: '', currentStatus: 'available', prediction: 'Usually free at this time. Gets busy around 5 PM.', confidence: 0.85, bestTimeToVisit: '10:00 AM - 2:00 PM', averageWaitMin: 3 },
    battery: { score: 87, fastChargeRatio: 0.35, avgDepthOfDischarge: 0.6, recommendations: ['Reduce fast charging sessions to under 30% of total charges.', 'Avoid charging above 90% regularly.', 'Your charging pattern is generally healthy.'], degradationEstimate: 'Estimated 3% degradation per year at current usage.' },
  };

  export const aiService = {
    async chat(message: string, userId: string, conversationHistory?: ChatMessage[]): Promise<{ message: string }> {
      if (featureFlags.MOCK_PROVIDERS) return MOCK_RESPONSES.chat;

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { message, userId, history: conversationHistory?.slice(-10) },
      });
      if (error) throw error;
      return data;
    },

    async planRoute(input: { origin: { lat: number; lng: number }; destination: string; currentBatteryPct: number; vehicleId: string; userId: string }): Promise<RoutePlan> {
      if (featureFlags.MOCK_PROVIDERS) return MOCK_RESPONSES.route;

      const { data, error } = await supabase.functions.invoke('ai-route-planner', { body: input });
      if (error) throw error;
      return data;
    },

    async optimizeCosts(userId: string, period: string): Promise<CostReport> {
      if (featureFlags.MOCK_PROVIDERS) return MOCK_RESPONSES.cost;

      const { data, error } = await supabase.functions.invoke('ai-cost-optimizer', { body: { userId, period } });
      if (error) throw error;
      return data;
    },

    async predictAvailability(stationId: string): Promise<AvailabilityPrediction> {
      if (featureFlags.MOCK_PROVIDERS) return { ...MOCK_RESPONSES.prediction, stationId };

      const { data, error } = await supabase.functions.invoke('ai-predict-availability', { body: { stationId } });
      if (error) throw error;
      return data;
    },

    async analyzeBatteryHealth(userId: string, vehicleId: string): Promise<BatteryHealth> {
      if (featureFlags.MOCK_PROVIDERS) return MOCK_RESPONSES.battery;

      const { data, error } = await supabase.functions.invoke('ai-battery-health', { body: { userId, vehicleId } });
      if (error) throw error;
      return data;
    },
  };
  ```

- [ ] **Step 4: Verify passes**
  ```bash
  npx jest __tests__/aiService.test.ts
  ```

- [ ] **Step 5: Commit**
  ```
  feat: add AI service with chat, route planner, cost optimizer, predictions, and battery health
  ```

---

## Task 2: AI Store

- [ ] **Step 1: Write test**
  - File: `__tests__/aiStore.test.ts`
  ```typescript
  import { useAIStore } from '@/core/stores/aiStore';

  describe('aiStore', () => {
    beforeEach(() => useAIStore.getState().reset());

    it('adds message to conversation', () => {
      useAIStore.getState().addMessage({ role: 'user', content: 'Hello', timestamp: new Date().toISOString() });
      expect(useAIStore.getState().messages).toHaveLength(1);
    });
    it('clears conversation', () => {
      useAIStore.getState().addMessage({ role: 'user', content: 'Hello', timestamp: new Date().toISOString() });
      useAIStore.getState().clearConversation();
      expect(useAIStore.getState().messages).toHaveLength(0);
    });
  });
  ```

- [ ] **Step 2: Implement**
  - File: `src/core/stores/aiStore.ts`
  ```typescript
  import { create } from 'zustand';
  import type { ChatMessage, RoutePlan, CostReport } from '../services/aiService';

  interface AIStore {
    messages: ChatMessage[];
    isTyping: boolean;
    lastRoute: RoutePlan | null;
    lastCostReport: CostReport | null;
    addMessage: (msg: ChatMessage) => void;
    setTyping: (typing: boolean) => void;
    setLastRoute: (route: RoutePlan | null) => void;
    setLastCostReport: (report: CostReport | null) => void;
    clearConversation: () => void;
    reset: () => void;
  }

  export const useAIStore = create<AIStore>((set) => ({
    messages: [],
    isTyping: false,
    lastRoute: null,
    lastCostReport: null,
    addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
    setTyping: (isTyping) => set({ isTyping }),
    setLastRoute: (lastRoute) => set({ lastRoute }),
    setLastCostReport: (lastCostReport) => set({ lastCostReport }),
    clearConversation: () => set({ messages: [] }),
    reset: () => set({ messages: [], isTyping: false, lastRoute: null, lastCostReport: null }),
  }));
  ```

- [ ] **Step 3: Verify passes**
  ```bash
  npx jest __tests__/aiStore.test.ts
  ```

- [ ] **Step 4: Commit**
  ```
  feat: add AI Zustand store for conversation history and cached results
  ```

---

## Task 3: AI Chat Edge Function

- [ ] **Step 1: Implement**
  - File: `supabase/functions/ai-chat/index.ts`
  ```typescript
  import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
  import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

  serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
      const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
      if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured');

      const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      const { message, userId, history } = await req.json();

      // Fetch user context
      const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', userId).single();
      const { data: vehicles } = await supabase.from('vehicles').select('*').eq('user_id', userId);
      const { data: recentSessions } = await supabase.from('charging_sessions').select('*, connector:connectors(*, station:stations(*))').eq('user_id', userId).order('created_at', { ascending: false }).limit(5);

      const systemPrompt = `You are Charge AI, the intelligent assistant for EV Charge Egypt - Egypt's unified EV charging platform.

You help drivers with:
- Finding charging stations (5 providers: IKARUS, Sha7en, Elsewedy Plug, Kilowatt EV, New Energy)
- Comparing prices across providers
- Trip planning with charging stops
- Troubleshooting charging issues
- Battery care tips
- Cost optimization

User context:
- Name: ${profile?.full_name || 'Driver'}
- Vehicles: ${vehicles?.map((v: any) => `${v.make} ${v.model} (${v.battery_capacity_kwh}kWh)`).join(', ') || 'None registered'}
- Recent charges: ${recentSessions?.length || 0} sessions
- Location: Egypt (Cairo area)
- Currency: EGP

Be concise, helpful, and Egypt-specific. Use EGP for all prices. Reference real Egyptian areas and landmarks.`;

      const messages = [
        ...(history || []).map((h: any) => ({ role: h.role, content: h.content })),
        { role: 'user', content: message },
      ];

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1024, system: systemPrompt, messages }),
      });

      const aiResponse = await response.json();
      const aiMessage = aiResponse.content?.[0]?.text || 'Sorry, I could not process that.';

      // Log interaction
      await supabase.from('ai_interactions').insert({ user_id: userId, type: 'chat', input: message, output: aiMessage, model_used: 'claude-sonnet-4-20250514' });

      return new Response(JSON.stringify({ message: aiMessage }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  });
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add ai-chat Edge Function with Claude API and user context injection
  ```

---

## Task 4: AI Route Planner Edge Function

- [ ] **Step 1: Implement**
  - File: `supabase/functions/ai-route-planner/index.ts`
  ```typescript
  import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
  import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

  serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
      const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
      const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

      const { origin, destination, currentBatteryPct, vehicleId, userId } = await req.json();

      const { data: vehicle } = await supabase.from('vehicles').select('*').eq('id', vehicleId).single();
      const { data: stations } = await supabase.from('stations').select('*, connectors(*)').eq('is_active', true);

      const prompt = `Plan an EV road trip in Egypt.

Origin: ${origin.lat}, ${origin.lng}
Destination: ${destination}
Vehicle: ${vehicle?.make} ${vehicle?.model}, ${vehicle?.battery_capacity_kwh}kWh battery
Current Battery: ${currentBatteryPct}%
Available charging stations: ${JSON.stringify(stations?.map((s: any) => ({ id: s.id, name: s.name, lat: s.latitude, lng: s.longitude, area: s.area, connectors: s.connectors?.map((c: any) => ({ type: c.type, kw: c.power_kw, price: c.price_per_kwh })) })))}

Return a JSON object with this structure:
{ "stops": [{ "stationId": "...", "stationName": "...", "address": "...", "latitude": number, "longitude": number, "estimatedArrival": "HH:MM", "chargeTimeMin": number, "estimatedKwh": number, "estimatedCost": number }], "totalDistanceKm": number, "totalTimeMin": number, "totalChargeCost": number, "summary": "..." }

Consider: realistic range at highway speeds (~150Wh/km with AC), arrive at each stop with >15% battery, prefer fast chargers, minimize total cost.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2048, messages: [{ role: 'user', content: prompt }] }),
      });

      const aiResponse = await response.json();
      const text = aiResponse.content?.[0]?.text || '{}';

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const routePlan = jsonMatch ? JSON.parse(jsonMatch[0]) : { stops: [], totalDistanceKm: 0, totalTimeMin: 0, totalChargeCost: 0, summary: 'Could not plan route.' };

      await supabase.from('ai_interactions').insert({ user_id: userId, type: 'route_plan', input: JSON.stringify({ origin, destination, currentBatteryPct }), output: JSON.stringify(routePlan), model_used: 'claude-sonnet-4-20250514' });

      return new Response(JSON.stringify(routePlan), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  });
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add ai-route-planner Edge Function with station-aware trip planning
  ```

---

## Task 5: AI Cost Optimizer Edge Function

- [ ] **Step 1: Implement**
  - File: `supabase/functions/ai-cost-optimizer/index.ts`
  ```typescript
  import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
  import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

  serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
      const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
      const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

      const { userId, period } = await req.json();

      // Fetch user's charging sessions for the period
      const { data: sessions } = await supabase
        .from('charging_sessions')
        .select('*, connector:connectors(*, station:stations(*, provider:providers(*)))')
        .eq('user_id', userId)
        .not('end_time', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);

      const prompt = `Analyze this EV driver's charging costs and provide optimization tips.

Charging sessions (${period}):
${JSON.stringify(sessions?.map((s: any) => ({
  date: s.start_time,
  station: s.connector?.station?.name,
  provider: s.connector?.station?.provider?.name,
  kwh: s.kwh_delivered,
  providerCost: s.cost_provider,
  serviceFee: s.cost_service_fee,
  total: s.cost_total,
  connectorType: s.connector?.type,
  powerKw: s.connector?.power_kw,
})))}

Return JSON: { "totalSpent": number, "period": "${period}", "byProvider": [{"provider":"...","amount":number,"percentage":number}], "savings": [{"description":"...","amountSavable":number}], "tips": ["..."], "monthOverMonthChange": number }

Use EGP currency. Be specific about Egyptian providers and locations.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2048, messages: [{ role: 'user', content: prompt }] }),
      });

      const aiResponse = await response.json();
      const text = aiResponse.content?.[0]?.text || '{}';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const report = jsonMatch ? JSON.parse(jsonMatch[0]) : { totalSpent: 0, period, byProvider: [], savings: [], tips: [], monthOverMonthChange: 0 };

      await supabase.from('ai_interactions').insert({ user_id: userId, type: 'cost_optimizer', input: period, output: JSON.stringify(report), model_used: 'claude-sonnet-4-20250514' });

      return new Response(JSON.stringify(report), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  });
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add ai-cost-optimizer Edge Function with spending analysis
  ```

---

## Task 6: AI Predict Availability & Battery Health Edge Functions

- [ ] **Step 1: Implement predict availability**
  - File: `supabase/functions/ai-predict-availability/index.ts`
  ```typescript
  import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
  import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

  serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
      const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      const { stationId } = await req.json();

      const now = new Date();
      const hourOfDay = now.getHours();
      const dayOfWeek = now.getDay();

      // Get historical analytics
      const { data: analytics } = await supabase
        .from('station_analytics')
        .select('*')
        .eq('station_id', stationId)
        .eq('hour_of_day', hourOfDay)
        .eq('day_of_week', dayOfWeek)
        .single();

      // Get current connector statuses
      const { data: connectors } = await supabase.from('connectors').select('status').eq('station_id', stationId);
      const available = connectors?.filter((c: any) => c.status === 'available').length || 0;
      const total = connectors?.length || 1;

      const occupancyPct = analytics?.avg_occupancy_pct || (1 - available / total) * 100;
      let prediction = 'No data available yet.';
      let confidence = 0.5;

      if (analytics && analytics.sample_count > 10) {
        confidence = Math.min(0.95, 0.5 + analytics.sample_count * 0.01);
        if (occupancyPct < 30) prediction = 'Usually free at this time.';
        else if (occupancyPct < 60) prediction = 'Moderately busy. Short wait possible.';
        else if (occupancyPct < 80) prediction = 'Gets busy around now. Consider booking ahead.';
        else prediction = 'Usually very busy at this time. Try off-peak hours.';
      }

      const result = {
        stationId,
        currentStatus: available > 0 ? 'available' : 'occupied',
        prediction,
        confidence,
        bestTimeToVisit: occupancyPct > 50 ? '6:00 AM - 9:00 AM or 9:00 PM - 11:00 PM' : 'Good time to visit now',
        averageWaitMin: analytics?.avg_wait_min || 0,
      };

      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  });
  ```

- [ ] **Step 2: Implement battery health**
  - File: `supabase/functions/ai-battery-health/index.ts`
  ```typescript
  import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
  import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

  serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
      const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
      const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

      const { userId, vehicleId } = await req.json();

      const { data: vehicle } = await supabase.from('vehicles').select('*').eq('id', vehicleId).single();
      const { data: sessions } = await supabase
        .from('charging_sessions')
        .select('*, connector:connectors(*)')
        .eq('user_id', userId)
        .not('end_time', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      const fastCharges = sessions?.filter((s: any) => s.connector?.power_kw >= 50).length || 0;
      const totalCharges = sessions?.length || 1;
      const fastChargeRatio = fastCharges / totalCharges;

      const prompt = `Analyze this EV battery health based on charging patterns.

Vehicle: ${vehicle?.make} ${vehicle?.model}, ${vehicle?.battery_capacity_kwh}kWh
Total sessions: ${totalCharges}
Fast charge ratio: ${(fastChargeRatio * 100).toFixed(0)}%
Sessions data: ${JSON.stringify(sessions?.slice(0, 20).map((s: any) => ({ kwh: s.kwh_delivered, powerKw: s.connector?.power_kw, date: s.start_time })))}

Return JSON: { "score": number (0-100), "fastChargeRatio": number, "avgDepthOfDischarge": number, "recommendations": ["..."], "degradationEstimate": "..." }`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1024, messages: [{ role: 'user', content: prompt }] }),
      });

      const aiResponse = await response.json();
      const text = aiResponse.content?.[0]?.text || '{}';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const health = jsonMatch ? JSON.parse(jsonMatch[0]) : { score: 85, fastChargeRatio, avgDepthOfDischarge: 0.6, recommendations: ['Insufficient data for analysis.'], degradationEstimate: 'N/A' };

      await supabase.from('ai_interactions').insert({ user_id: userId, type: 'battery_health', input: vehicleId, output: JSON.stringify(health), model_used: 'claude-sonnet-4-20250514' });

      return new Response(JSON.stringify(health), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  });
  ```

- [ ] **Step 3: Commit**
  ```
  feat: add ai-predict-availability and ai-battery-health Edge Functions
  ```

---

## Task 7: React Query Hooks for AI

- [ ] **Step 1: Implement useAIChat**
  - File: `src/core/queries/useAIChat.ts`
  ```typescript
  import { useMutation } from '@tanstack/react-query';
  import { aiService, ChatMessage } from '../services/aiService';
  import { useAIStore } from '../stores/aiStore';
  import { useAuthStore } from '../stores/authStore';

  export function useAIChat() {
    const userId = useAuthStore((s) => s.user?.id);
    const { messages, addMessage, setTyping } = useAIStore();

    return useMutation({
      mutationFn: async (userMessage: string) => {
        const userMsg: ChatMessage = { role: 'user', content: userMessage, timestamp: new Date().toISOString() };
        addMessage(userMsg);
        setTyping(true);
        const response = await aiService.chat(userMessage, userId!, messages);
        const assistantMsg: ChatMessage = { role: 'assistant', content: response.message, timestamp: new Date().toISOString() };
        addMessage(assistantMsg);
        setTyping(false);
        return assistantMsg;
      },
      onError: () => setTyping(false),
    });
  }
  ```

- [ ] **Step 2: Implement useRoutePlanner**
  - File: `src/core/queries/useRoutePlanner.ts`
  ```typescript
  import { useMutation } from '@tanstack/react-query';
  import { aiService } from '../services/aiService';
  import { useAIStore } from '../stores/aiStore';
  import { useAuthStore } from '../stores/authStore';

  export function useRoutePlanner() {
    const userId = useAuthStore((s) => s.user?.id);
    const setLastRoute = useAIStore((s) => s.setLastRoute);

    return useMutation({
      mutationFn: async (input: { destination: string; currentBatteryPct: number; vehicleId: string; origin: { lat: number; lng: number } }) => {
        const route = await aiService.planRoute({ ...input, userId: userId! });
        setLastRoute(route);
        return route;
      },
    });
  }
  ```

- [ ] **Step 3: Implement useCostOptimizer**
  - File: `src/core/queries/useCostOptimizer.ts`
  ```typescript
  import { useQuery } from '@tanstack/react-query';
  import { aiService } from '../services/aiService';
  import { useAuthStore } from '../stores/authStore';

  export function useCostReport(period: string) {
    const userId = useAuthStore((s) => s.user?.id);

    return useQuery({
      queryKey: ['costReport', userId, period],
      queryFn: () => aiService.optimizeCosts(userId!, period),
      enabled: !!userId,
      staleTime: 1000 * 60 * 60, // 1 hour
    });
  }
  ```

- [ ] **Step 4: Implement usePrediction**
  - File: `src/core/queries/usePrediction.ts`
  ```typescript
  import { useQuery } from '@tanstack/react-query';
  import { aiService } from '../services/aiService';

  export function useAvailabilityPrediction(stationId: string | null) {
    return useQuery({
      queryKey: ['prediction', stationId],
      queryFn: () => aiService.predictAvailability(stationId!),
      enabled: !!stationId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  }
  ```

- [ ] **Step 5: Commit**
  ```
  feat: add React Query hooks for AI chat, route planner, cost optimizer, and predictions
  ```

---

## Task 8: Chat Message Component

- [ ] **Step 1: Write test**
  - File: `__tests__/ChatMessage.test.tsx`
  ```typescript
  import React from 'react';
  import { render } from '@testing-library/react-native';
  import { ChatMessage } from '@/driver/components/ChatMessage';

  describe('ChatMessage', () => {
    it('renders user message', () => {
      const { getByText } = render(<ChatMessage role="user" content="Hello" timestamp="" />);
      expect(getByText('Hello')).toBeTruthy();
    });
    it('renders assistant message', () => {
      const { getByText } = render(<ChatMessage role="assistant" content="How can I help?" timestamp="" />);
      expect(getByText('How can I help?')).toBeTruthy();
    });
  });
  ```

- [ ] **Step 2: Implement**
  - File: `src/driver/components/ChatMessage.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, StyleSheet } from 'react-native';
  import { colors } from '@/core/theme/colors';
  import { spacing, borderRadius } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  interface Props { role: 'user' | 'assistant'; content: string; timestamp: string; }

  export function ChatMessage({ role, content, timestamp }: Props) {
    const isUser = role === 'user';
    return (
      <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
        {!isUser && <View style={styles.avatar}><Text style={styles.avatarText}>AI</Text></View>}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.text, isUser ? styles.userText : styles.assistantText]}>{content}</Text>
        </View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flexDirection: 'row', marginVertical: spacing.xs, paddingHorizontal: spacing.md },
    userContainer: { justifyContent: 'flex-end' },
    assistantContainer: { justifyContent: 'flex-start' },
    avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
    avatarText: { color: colors.white, fontSize: 12, fontWeight: '700' },
    bubble: { maxWidth: '75%', padding: spacing.md, borderRadius: borderRadius.lg },
    userBubble: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
    assistantBubble: { backgroundColor: colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
    text: { ...typography.body, lineHeight: 22 },
    userText: { color: colors.white },
    assistantText: { color: colors.text },
  });
  ```

- [ ] **Step 3: Implement SuggestedQuestions**
  - File: `src/driver/components/SuggestedQuestions.tsx`
  ```typescript
  import React from 'react';
  import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
  import { colors } from '@/core/theme/colors';
  import { spacing, borderRadius } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  const QUESTIONS = [
    "Where's the cheapest fast charger near me?",
    'Plan my trip to El Gouna with charging stops',
    "What's the difference between CCS and Type 2?",
    'Show my monthly charging cost report',
    "How's my battery health?",
    'Which provider has the best prices?',
  ];

  interface Props { onSelect: (question: string) => void; }

  export function SuggestedQuestions({ onSelect }: Props) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
        {QUESTIONS.map((q) => (
          <TouchableOpacity key={q} style={styles.chip} onPress={() => onSelect(q)}>
            <Text style={styles.text} numberOfLines={2}>{q}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
    chip: { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, maxWidth: 200 },
    text: { ...typography.caption, color: colors.primaryDark },
  });
  ```

- [ ] **Step 4: Commit**
  ```
  feat: add ChatMessage and SuggestedQuestions components
  ```

---

## Task 9: AI Assistant Screen

- [ ] **Step 1: Implement**
  - File: `src/driver/screens/AIAssistantScreen.tsx`
  ```typescript
  import React, { useState, useRef } from 'react';
  import { View, FlatList, TextInput, TouchableOpacity, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
  import { Header } from '@/core/components';
  import { ChatMessage as ChatMessageComponent } from '../components/ChatMessage';
  import { SuggestedQuestions } from '../components/SuggestedQuestions';
  import { useAIChat } from '@/core/queries/useAIChat';
  import { useAIStore } from '@/core/stores/aiStore';
  import { colors } from '@/core/theme/colors';
  import { spacing, borderRadius } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function AIAssistantScreen({ navigation }: any) {
    const [input, setInput] = useState('');
    const { messages, isTyping } = useAIStore();
    const chatMutation = useAIChat();
    const flatListRef = useRef<FlatList>(null);

    const handleSend = async (text?: string) => {
      const message = text || input.trim();
      if (!message) return;
      setInput('');
      await chatMutation.mutateAsync(message);
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    };

    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Header title="Charge AI" rightAction={
          <TouchableOpacity onPress={() => useAIStore.getState().clearConversation()}>
            <Text style={styles.clearBtn}>Clear</Text>
          </TouchableOpacity>
        } />
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => <ChatMessageComponent role={item.role} content={item.content} timestamp={item.timestamp} />}
          ListHeaderComponent={messages.length === 0 ? (
            <View style={styles.welcome}>
              <Text style={styles.welcomeTitle}>Hi! I'm Charge AI</Text>
              <Text style={styles.welcomeText}>Ask me anything about EV charging in Egypt.</Text>
              <SuggestedQuestions onSelect={handleSend} />
            </View>
          ) : undefined}
          ListFooterComponent={isTyping ? (
            <View style={styles.typing}><Text style={styles.typingText}>Charge AI is thinking...</Text></View>
          ) : undefined}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />
        <View style={styles.inputBar}>
          <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Ask about charging, routes, costs..." placeholderTextColor={colors.textTertiary} multiline maxLength={500} onSubmitEditing={() => handleSend()} />
          <TouchableOpacity style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} onPress={() => handleSend()} disabled={!input.trim() || chatMutation.isPending}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    messages: { paddingBottom: spacing.md },
    welcome: { alignItems: 'center', padding: spacing.xl },
    welcomeTitle: { ...typography.h2, color: colors.primaryDark },
    welcomeText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginVertical: spacing.md },
    typing: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    typingText: { ...typography.caption, color: colors.accent, fontStyle: 'italic' },
    inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
    input: { flex: 1, ...typography.body, color: colors.text, backgroundColor: colors.surfaceSecondary, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, maxHeight: 100, marginRight: spacing.sm },
    sendBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.lg },
    sendBtnDisabled: { opacity: 0.5 },
    sendText: { color: colors.white, fontWeight: '600' },
    clearBtn: { ...typography.caption, color: colors.primary },
  });
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add AIAssistantScreen with chat interface and suggested questions
  ```

---

## Task 10: Route Result Screen

- [ ] **Step 1: Implement**
  - File: `src/driver/screens/RouteResultScreen.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, ScrollView, StyleSheet } from 'react-native';
  import { Header, Card, Button } from '@/core/components';
  import { useAIStore } from '@/core/stores/aiStore';
  import { formatEGP, formatKWh } from '@/core/utils/formatCurrency';
  import { colors } from '@/core/theme/colors';
  import { spacing, borderRadius } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function RouteResultScreen({ navigation }: any) {
    const route = useAIStore((s) => s.lastRoute);

    if (!route) return <View style={styles.container}><Header title="Route" onBack={() => navigation.goBack()} /><Text style={styles.empty}>No route planned yet.</Text></View>;

    return (
      <View style={styles.container}>
        <Header title="Trip Plan" onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.content}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summary}>{route.summary}</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}><Text style={styles.statValue}>{route.totalDistanceKm} km</Text><Text style={styles.statLabel}>Distance</Text></View>
              <View style={styles.stat}><Text style={styles.statValue}>{Math.round(route.totalTimeMin / 60)}h {route.totalTimeMin % 60}m</Text><Text style={styles.statLabel}>Total Time</Text></View>
              <View style={styles.stat}><Text style={styles.statValue}>{formatEGP(route.totalChargeCost)}</Text><Text style={styles.statLabel}>Charge Cost</Text></View>
            </View>
          </Card>

          <Text style={styles.sectionTitle}>Charging Stops</Text>
          {route.stops.map((stop, i) => (
            <Card key={i} style={styles.stopCard}>
              <View style={styles.stopHeader}>
                <View style={styles.stopNumber}><Text style={styles.stopNumberText}>{i + 1}</Text></View>
                <View style={styles.stopInfo}>
                  <Text style={styles.stopName}>{stop.stationName}</Text>
                  <Text style={styles.stopAddress}>{stop.address}</Text>
                </View>
              </View>
              <View style={styles.stopDetails}>
                <Text style={styles.detail}>Arrive: {stop.estimatedArrival}</Text>
                <Text style={styles.detail}>Charge: {stop.chargeTimeMin} min · {formatKWh(stop.estimatedKwh)}</Text>
                <Text style={styles.detail}>Cost: {formatEGP(stop.estimatedCost)}</Text>
              </View>
              <Button title="Book This Stop" onPress={() => navigation.navigate('Booking', { stationId: stop.stationId })} variant="outline" size="sm" />
            </Card>
          ))}
        </ScrollView>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: spacing.xxl },
    empty: { ...typography.body, color: colors.textTertiary, textAlign: 'center', padding: spacing.xl },
    summaryCard: { backgroundColor: colors.primaryLight, marginBottom: spacing.lg },
    summary: { ...typography.body, color: colors.primaryDark, marginBottom: spacing.md },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
    stat: { alignItems: 'center' },
    statValue: { ...typography.bodyBold, color: colors.primaryDark },
    statLabel: { ...typography.small, color: colors.accent },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    stopCard: { marginBottom: spacing.md },
    stopHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    stopNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
    stopNumberText: { color: colors.white, fontWeight: '700', fontSize: 14 },
    stopInfo: { flex: 1 },
    stopName: { ...typography.bodyBold, color: colors.text },
    stopAddress: { ...typography.caption, color: colors.textSecondary },
    stopDetails: { marginBottom: spacing.sm },
    detail: { ...typography.caption, color: colors.textSecondary, marginBottom: 2 },
  });
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add RouteResultScreen showing trip plan with charging stops
  ```

---

## Task 11: Cost Report Screen

- [ ] **Step 1: Implement**
  - File: `src/driver/screens/CostReportScreen.tsx`
  ```typescript
  import React from 'react';
  import { View, Text, ScrollView, StyleSheet } from 'react-native';
  import { Header, Card, LoadingScreen } from '@/core/components';
  import { useCostReport } from '@/core/queries/useCostOptimizer';
  import { formatEGP } from '@/core/utils/formatCurrency';
  import { colors } from '@/core/theme/colors';
  import { spacing, borderRadius } from '@/core/theme/spacing';
  import { typography } from '@/core/theme/typography';

  export function CostReportScreen({ navigation }: any) {
    const { data: report, isLoading } = useCostReport('March 2026');

    if (isLoading) return <LoadingScreen message="Analyzing your costs..." />;
    if (!report) return <View style={styles.container}><Header title="Cost Report" onBack={() => navigation.goBack()} /><Text style={styles.empty}>No data available yet.</Text></View>;

    return (
      <View style={styles.container}>
        <Header title="Cost Report" onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.content}>
          <Card style={styles.totalCard}>
            <Text style={styles.periodLabel}>{report.period}</Text>
            <Text style={styles.totalAmount}>{formatEGP(report.totalSpent)}</Text>
            <Text style={[styles.change, report.monthOverMonthChange < 0 ? styles.changeDown : styles.changeUp]}>
              {report.monthOverMonthChange > 0 ? '+' : ''}{report.monthOverMonthChange.toFixed(1)}% vs last month
            </Text>
          </Card>

          <Text style={styles.sectionTitle}>By Provider</Text>
          {report.byProvider.map((p) => (
            <View key={p.provider} style={styles.providerRow}>
              <View style={styles.providerInfo}><Text style={styles.providerName}>{p.provider}</Text><Text style={styles.providerPct}>{p.percentage}%</Text></View>
              <View style={styles.barBg}><View style={[styles.bar, { width: `${p.percentage}%` }]} /></View>
              <Text style={styles.providerAmount}>{formatEGP(p.amount)}</Text>
            </View>
          ))}

          <Text style={styles.sectionTitle}>Savings Opportunities</Text>
          {report.savings.map((s, i) => (
            <Card key={i} style={styles.savingCard}>
              <Text style={styles.savingDesc}>{s.description}</Text>
              <Text style={styles.savingAmount}>Save {formatEGP(s.amountSavable)}/month</Text>
            </Card>
          ))}

          <Text style={styles.sectionTitle}>Tips</Text>
          {report.tips.map((tip, i) => (
            <Text key={i} style={styles.tip}>• {tip}</Text>
          ))}
        </ScrollView>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: spacing.xxl },
    empty: { ...typography.body, color: colors.textTertiary, textAlign: 'center', padding: spacing.xl },
    totalCard: { alignItems: 'center', backgroundColor: colors.primaryDark, marginBottom: spacing.lg },
    periodLabel: { ...typography.caption, color: colors.primaryLight },
    totalAmount: { ...typography.h1, color: colors.white, fontSize: 36, marginVertical: spacing.sm },
    change: { ...typography.bodyBold, fontSize: 14 },
    changeDown: { color: colors.success },
    changeUp: { color: colors.error },
    sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md },
    providerRow: { marginBottom: spacing.md },
    providerInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    providerName: { ...typography.bodyBold, color: colors.text, fontSize: 14 },
    providerPct: { ...typography.caption, color: colors.textSecondary },
    barBg: { height: 8, backgroundColor: colors.primaryLight, borderRadius: borderRadius.full },
    bar: { height: '100%', backgroundColor: colors.primary, borderRadius: borderRadius.full },
    providerAmount: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    savingCard: { marginBottom: spacing.sm, backgroundColor: colors.primaryLight },
    savingDesc: { ...typography.body, color: colors.text, fontSize: 14 },
    savingAmount: { ...typography.bodyBold, color: colors.primary, marginTop: 4 },
    tip: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm, fontSize: 14, lineHeight: 20 },
  });
  ```

- [ ] **Step 2: Commit**
  ```
  feat: add CostReportScreen with spending analysis, provider breakdown, and savings tips
  ```

---

## Task 12: Integration Test

- [ ] **Step 1: Run all tests**
  ```bash
  npx jest --verbose
  ```

- [ ] **Step 2: Verify TypeScript**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 3: Commit**
  ```
  chore: verify AI layer feature — all tests pass
  ```

---

**Total: 12 tasks, ~35 steps**
