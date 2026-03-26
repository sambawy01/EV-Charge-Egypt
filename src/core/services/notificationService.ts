import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  async requestPermission(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  async getPushToken(): Promise<string | null> {
    try {
      const { data } = await Notifications.getExpoPushTokenAsync();
      return data;
    } catch {
      return null;
    }
  },

  async scheduleBookingReminder(
    bookingId: string,
    stationName: string,
    scheduledStart: string,
  ) {
    const triggerDate = new Date(
      new Date(scheduledStart).getTime() - 10 * 60000,
    );
    if (triggerDate <= new Date()) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Charging Reminder',
        body: `Your charger at ${stationName} is ready in 10 minutes!`,
        data: { bookingId, type: 'booking_reminder' },
      },
      trigger: {
        date: triggerDate,
        type: Notifications.SchedulableTriggerInputTypes.DATE,
      },
    });
  },

  async sendChargingComplete(stationName: string, kwhDelivered: number) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Charging Complete',
        body: `${kwhDelivered.toFixed(1)} kWh delivered at ${stationName}. Please move your car.`,
        data: { type: 'charging_complete' },
      },
      trigger: null,
    });
  },
};
