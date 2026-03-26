import type { IProviderAdapter, TimeSlot, ProviderBooking, ProviderSession, ProviderPrice } from './types';
import type { Station, Connector } from '../types/station';

export abstract class ProviderAdapter implements IProviderAdapter {
  abstract readonly providerId: string;
  abstract readonly providerName: string;
  abstract getStations(): Promise<Station[]>;
  abstract getAvailability(stationId: string): Promise<Connector[]>;
  abstract createBooking(stationId: string, userId: string, timeSlot: TimeSlot): Promise<ProviderBooking>;
  abstract cancelBooking(bookingId: string): Promise<void>;
  abstract startCharging(bookingId: string): Promise<ProviderSession>;
  abstract stopCharging(sessionId: string): Promise<ProviderSession>;
  abstract getPrice(stationId: string, connectorType: string): Promise<ProviderPrice>;
}
