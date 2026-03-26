import React, { useEffect, useState } from 'react';
import { Modal, View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '@/core/config/supabase';
import { useAuthStore } from '@/core/stores/authStore';
import { colors } from '@/core/theme/colors';
import { spacing, borderRadius } from '@/core/theme/spacing';
import { typography } from '@/core/theme/typography';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'charging_complete', title: 'Charging Complete', body: 'Your BYD Atto 3 has reached 80%. Please move your car.', read: false, created_at: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: 'n2', type: 'booking_reminder', title: 'Booking in 10 Minutes', body: 'Your slot at IKARUS Maadi starts at 6:00 PM. Station is ready.', read: false, created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'n3', type: 'promotion', title: 'Off-Peak Hours Active', body: 'Electricity rates are 40% lower until 7 AM. Great time to charge!', read: true, created_at: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: 'n4', type: 'system', title: 'New Station Added', body: 'Elsewedy Plug opened 2 new CCS connectors in Maadi. 100kW each.', read: true, created_at: new Date(Date.now() - 3 * 24 * 3600000).toISOString() },
];

const TYPE_ICONS: Record<string, string> = {
  booking_reminder: '🔔',
  charging_complete: '⚡',
  promotion: '🎁',
  system: 'ℹ️',
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationsModal({ visible, onClose }: Props) {
  const userId = useAuthStore((s) => s.user?.id);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    if (!userId) {
      setNotifications(MOCK_NOTIFICATIONS);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      setNotifications(data && data.length > 0 ? data : MOCK_NOTIFICATIONS);
      setLoading(false);
    })();
  }, [visible, userId]);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.item, !item.read && styles.unread]}
                onPress={() => markAsRead(item.id)}
              >
                <Text style={styles.icon}>{TYPE_ICONS[item.type] || '📌'}</Text>
                <View style={styles.content}>
                  <Text style={[styles.itemTitle, !item.read && styles.bold]}>{item.title}</Text>
                  {item.body && <Text style={styles.body}>{item.body}</Text>}
                  <Text style={styles.time}>{formatRelativeTime(item.created_at)}</Text>
                </View>
                {!item.read && <View style={styles.dot} />}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>{loading ? 'Loading...' : 'No notifications yet'}</Text>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...(typography.h3 as object), color: colors.text },
  badge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { ...(typography.small as object), color: colors.white, fontWeight: '700' },
  close: { fontSize: 20, color: colors.textSecondary, padding: 4 },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  unread: { backgroundColor: colors.primaryLight + '30' },
  icon: { fontSize: 20, marginRight: spacing.md, marginTop: 2 },
  content: { flex: 1 },
  itemTitle: { ...(typography.body as object), color: colors.text, fontSize: 14 },
  bold: { fontWeight: '700' },
  body: { ...(typography.caption as object), color: colors.textSecondary, marginTop: 2 },
  time: { ...(typography.small as object), color: colors.textTertiary, marginTop: 4 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
    marginLeft: spacing.sm,
  },
  empty: {
    ...(typography.body as object),
    color: colors.textTertiary,
    textAlign: 'center',
    padding: spacing.xl,
  },
});
