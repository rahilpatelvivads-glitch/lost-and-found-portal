import { supabase } from "../lib/supabase";
import { MapPin, Package, Archive, HandHeart, Sparkles, AlertCircle, Bell } from "lucide-react";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationTypeInfo {
  label: string;
  icon: any;
  color: string;
  bg: string;
  border: string;
  glow: string;
  badge: string;
}

export function getNotificationTypeInfo(title: string, message: string): NotificationTypeInfo {
  const text = `${title} ${message}`.toLowerCase();
  
  if (text.includes("claim")) {
    return {
      label: "Claim Request",
      icon: HandHeart,
      color: "text-amber-500 dark:text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      glow: "shadow-amber-500/10",
      badge: "bg-amber-500/20 text-amber-600 dark:text-amber-400"
    };
  }
  if (text.includes("returned")) {
    return {
      label: "Item Returned",
      icon: Archive,
      color: "text-emerald-500 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      glow: "shadow-emerald-500/10",
      badge: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
    };
  }
  if (text.includes("match")) {
    return {
      label: "Match Found",
      icon: Sparkles,
      color: "text-purple-500 dark:text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      glow: "shadow-purple-500/10",
      badge: "bg-purple-500/20 text-purple-600 dark:text-purple-400"
    };
  }
  if (text.includes("lost")) {
    return {
      label: "Lost Item Added",
      icon: MapPin,
      color: "text-red-500 dark:text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      glow: "shadow-red-500/10",
      badge: "bg-red-500/20 text-red-600 dark:text-red-400"
    };
  }
  if (text.includes("found")) {
    return {
      label: "Found Item Added",
      icon: Package,
      color: "text-blue-500 dark:text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      glow: "shadow-blue-500/10",
      badge: "bg-blue-500/20 text-blue-600 dark:text-blue-400"
    };
  }
  
  // Default system/admin alert
  return {
    label: "Admin Alert",
    icon: AlertCircle,
    color: "text-indigo-500 dark:text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    glow: "shadow-indigo-500/10",
    badge: "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
  };
}

export const notificationService = {
  async getMyNotifications() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Fetch both user-specific and broadcast notifications
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  async markAllAsRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;
  },

  async createNotification(userId: string | null, title: string, message: string) {
    const { error } = await supabase
      .from('notifications')
      .insert([{ user_id: userId, title, message, is_read: false }]);

    if (error) throw error;
  },

  async deleteAllNotifications() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    localStorage.setItem(`notifications_cleared_at_${user.id}`, new Date().toISOString());
  },

  subscribeToMyNotifications(callback: (payload: any) => void) {
    return supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return null;

      // Use a unique channel name per subscription to avoid conflicts
      const subscriptionId = Math.random().toString(36).substring(7);
      const channel = supabase
        .channel(`notifications-combined-${user.id}-${subscriptionId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications'
          },
          (payload) => {
            // Only trigger if it's for this user OR a broadcast
            const targetUserId = (payload.new as any)?.user_id || (payload.old as any)?.user_id;
            if (!targetUserId || targetUserId === user.id) {
              console.log("Notification event received:", payload.eventType, payload.new || payload.old);
              callback(payload);
            }
          }
        )
        .subscribe();
      
      return channel;
    });
  }
};
