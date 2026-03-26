import { create } from 'zustand';
import type { Fleet, FleetMember, Vehicle } from '../types/fleet';

interface FleetStore {
  fleet: Fleet | null;
  creditBalance: number;
  vehicles: Vehicle[];
  members: FleetMember[];
  setFleet: (fleet: Fleet) => void;
  setCreditBalance: (balance: number) => void;
  setVehicles: (vehicles: Vehicle[]) => void;
  setMembers: (members: FleetMember[]) => void;
  reset: () => void;
}

export const useFleetStore = create<FleetStore>((set) => ({
  fleet: null,
  creditBalance: 0,
  vehicles: [],
  members: [],
  setFleet: (fleet) => set({ fleet, creditBalance: fleet.credit_balance }),
  setCreditBalance: (creditBalance) => set({ creditBalance }),
  setVehicles: (vehicles) => set({ vehicles }),
  setMembers: (members) => set({ members }),
  reset: () => set({ fleet: null, creditBalance: 0, vehicles: [], members: [] }),
}));
