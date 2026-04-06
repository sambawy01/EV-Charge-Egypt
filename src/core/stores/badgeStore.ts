import { create } from 'zustand';
import type { Badge } from '../services/badgeService';

interface BadgeStore {
  /** Queue of badges waiting to show the unlock modal */
  pendingBadges: Badge[];
  /** Currently displayed badge in the modal (or null) */
  currentBadge: Badge | null;

  /** Push newly unlocked badges into the queue */
  enqueueBadges: (badges: Badge[]) => void;
  /** Show the next badge from the queue */
  showNext: () => void;
  /** Dismiss the current badge modal */
  dismiss: () => void;
}

export const useBadgeStore = create<BadgeStore>((set, get) => ({
  pendingBadges: [],
  currentBadge: null,

  enqueueBadges: (badges) => {
    if (badges.length === 0) return;
    const { currentBadge, pendingBadges } = get();
    if (!currentBadge) {
      // Show the first one immediately, queue the rest
      set({
        currentBadge: badges[0],
        pendingBadges: [...pendingBadges, ...badges.slice(1)],
      });
    } else {
      set({ pendingBadges: [...pendingBadges, ...badges] });
    }
  },

  showNext: () => {
    const { pendingBadges } = get();
    if (pendingBadges.length > 0) {
      set({
        currentBadge: pendingBadges[0],
        pendingBadges: pendingBadges.slice(1),
      });
    } else {
      set({ currentBadge: null });
    }
  },

  dismiss: () => {
    const { pendingBadges } = get();
    if (pendingBadges.length > 0) {
      // Show next badge after a short delay
      setTimeout(() => get().showNext(), 400);
      set({ currentBadge: null });
    } else {
      set({ currentBadge: null });
    }
  },
}));
