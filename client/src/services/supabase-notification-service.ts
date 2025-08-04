import { supabase } from '@/lib/supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface NotificationRealtimeCallbacks {
  onInsert?: (notification: any) => void;
  onUpdate?: (notification: any) => void;
  onDelete?: (notificationId: string) => void;
  onError?: (error: Error) => void;
}

export class SupabaseNotificationService {
  private channel: RealtimeChannel | null = null;
  private callbacks: NotificationRealtimeCallbacks = {};

  async subscribe(userId: string, callbacks: NotificationRealtimeCallbacks) {
    this.callbacks = callbacks;
    try {
      this.channel = supabase
        .channel('realtime-notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notification',
            filter: `user_id=eq.${userId}`
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            if (payload.eventType === 'INSERT') {
              this.callbacks.onInsert?.(payload.new);
            } else if (payload.eventType === 'UPDATE') {
              this.callbacks.onUpdate?.(payload.new);
            } else if (payload.eventType === 'DELETE') {
              this.callbacks.onDelete?.(payload.old.id);
            }
          }
        );
      await this.channel.subscribe();
    } catch (error) {
      this.callbacks.onError?.(error as Error);
    }
  }

  async unsubscribe() {
    if (this.channel) {
      await supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.callbacks = {};
  }
}

export const supabaseNotificationService = new SupabaseNotificationService(); 