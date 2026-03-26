import { create } from 'zustand';
import type { Booking, ChargingSession } from '../types/booking';
import type { Connector, Station } from '../types/station';

interface BookingStore {
  selectedStation: Station | null;
  selectedConnector: Connector | null;
  activeBooking: Booking | null;
  activeSession: ChargingSession | null;
  setSelectedStation: (station: Station | null) => void;
  setSelectedConnector: (connector: Connector | null) => void;
  setActiveBooking: (booking: Booking | null) => void;
  setActiveSession: (session: ChargingSession | null) => void;
  reset: () => void;
}

export const useBookingStore = create<BookingStore>((set) => ({
  selectedStation: null,
  selectedConnector: null,
  activeBooking: null,
  activeSession: null,
  setSelectedStation: (selectedStation) => set({ selectedStation }),
  setSelectedConnector: (selectedConnector) => set({ selectedConnector }),
  setActiveBooking: (activeBooking) => set({ activeBooking }),
  setActiveSession: (activeSession) => set({ activeSession }),
  reset: () => set({
    selectedStation: null,
    selectedConnector: null,
    activeBooking: null,
    activeSession: null,
  }),
}));
