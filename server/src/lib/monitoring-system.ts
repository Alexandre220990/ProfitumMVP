import supabase from '../config/supabase';

export interface MonitoringEvent {
  id: string;
  event_type: string;
  user_id?: string;
  client_id?: string;
  expert_id?: string;
  data: any;
  severity: 'info' | 'warning' | 'error' | 'critical';
  created_at: Date;
}

export class MonitoringSystem {
  private static instance: MonitoringSystem;

  private constructor() {}

  static getInstance(): MonitoringSystem {
    if (!MonitoringSystem.instance) {
      MonitoringSystem.instance = new MonitoringSystem();
    }
    return MonitoringSystem.instance;
  }

  async logEvent(event: Omit<MonitoringEvent, 'id' | 'created_at'>): Promise<void> {
    try {
      await supabase
        .from('audit_logs')
        .insert({
          event_type: event.event_type,
          user_id: event.user_id,
          client_id: event.client_id,
          expert_id: event.expert_id,
          data: event.data,
          severity: event.severity,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Erreur logging monitoring event:', error);
    }
  }

  async getEvents(filters?: {
    event_type?: string;
    user_id?: string;
    severity?: string;
    limit?: number;
    offset?: number;
  }): Promise<MonitoringEvent[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.event_type) {
        query = query.eq('event_type', filters.event_type);
      }
      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erreur récupération events monitoring:', error);
      return [];
    }
  }
}

export const monitoringSystem = MonitoringSystem.getInstance(); 