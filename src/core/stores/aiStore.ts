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
  reset: () =>
    set({ messages: [], isTyping: false, lastRoute: null, lastCostReport: null }),
}));
