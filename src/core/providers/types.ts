import type { Station, Connector } from '../types/station';

export interface TimeSlot {
  start: string;
  end: string;
}

export interface ProviderBooking {
  id: string;
  providerRef: string;
  status: string;
  stationId: string;
  connectorId: string;
}

export interface ProviderSession {
  id: string;
  providerRef: string;
  kwhDelivered: number;
  costProvider: number;
}

export interface ProviderPrice {
  pricePerKwh: number;
  currency: string;
  connectorType: string;
}

export interface IProviderAdapter {
  readonly providerId: string;
  readonly providerName: string;
  getStations(): Promise<Station[]>;
  getAvailability(stationId: string): Promise<Connector[]>;
  createBooking(stationId: string, userId: string, timeSlot: TimeSlot): Promise<ProviderBooking>;
  cancelBooking(bookingId: string): Promise<void>;
  startCharging(bookingId: string): Promise<ProviderSession>;
  stopCharging(sessionId: string): Promise<ProviderSession>;
  getPrice(stationId: string, connectorType: string): Promise<ProviderPrice>;
}
