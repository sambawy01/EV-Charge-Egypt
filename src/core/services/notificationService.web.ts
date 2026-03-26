export const notificationService = {
  async requestPermission(): Promise<boolean> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const result = await Notification.requestPermission();
      return result === 'granted';
    }
    return false;
  },

  async getPushToken(): Promise<string | null> {
    return null;
  },

  async scheduleBookingReminder(
    _bookingId: string,
    _stationName: string,
    _scheduledStart: string,
  ): Promise<void> {
    // Web: browser notification if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('EV Charge Egypt', { body: `Your booking at ${_stationName} is starting soon.` });
    }
  },

  async sendChargingComplete(_stationName: string, _kwhDelivered: number): Promise<void> {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Charging Complete', {
        body: `Charged ${_kwhDelivered.toFixed(1)} kWh at ${_stationName}. Please move your car.`,
      });
    }
  },
};
