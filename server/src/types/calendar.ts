// ============================================================================
// TYPES POUR LE SYSTÈME DE CALENDRIER
// ============================================================================

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  type: 'appointment' | 'deadline' | 'meeting' | 'task' | 'reminder';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  category: 'client' | 'expert' | 'admin' | 'system' | 'collaborative';
  dossier_id?: string;
  dossier_name?: string;
  client_id?: string;
  expert_id?: string;
  location?: string;
  is_online?: boolean;
  meeting_url?: string;
  phone_number?: string;
  color: string;
  is_recurring?: boolean;
  recurrence_rule?: string;
  participants?: string[];
  reminders?: Array<{ type: 'email' | 'push' | 'sms', time: number }>;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface CalendarEventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  user_type: 'client' | 'expert' | 'admin';
  status: 'pending' | 'accepted' | 'declined' | 'tentative';
  created_at: string;
  updated_at: string;
}

export interface CalendarEventReminder {
  id: string;
  event_id: string;
  type: 'email' | 'push' | 'sms';
  time_minutes: number;
  sent: boolean;
  sent_at?: string;
  created_at: string;
}

export interface DossierStep {
  id: string;
  dossier_id: string;
  dossier_name: string;
  step_name: string;
  step_type: 'validation' | 'documentation' | 'expertise' | 'approval' | 'payment';
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  estimated_duration?: number;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface CalendarPreferences {
  id: string;
  user_id: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  default_reminders: Array<{
    type: 'email' | 'push' | 'sms';
    time_minutes: number;
  }>;
  working_hours: {
    start: string;
    end: string;
    days: number[];
  };
  created_at: string;
  updated_at: string;
}

export interface CalendarEventTemplate {
  id: string;
  name: string;
  type: 'appointment' | 'deadline' | 'meeting' | 'task' | 'reminder';
  title: string;
  message: string;
  variables: string[];
  category: 'business' | 'personal' | 'client' | 'system';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
}

export interface CalendarActivityLog {
  id: string;
  user_id: string;
  user_type: 'client' | 'expert' | 'admin';
  action: string;
  resource_type: 'event' | 'step' | 'integration' | 'template';
  resource_id: string;
  details: any;
  created_at: string;
}

export interface CalendarStats {
  eventsToday: number;
  meetingsThisWeek: number;
  overdueDeadlines: number;
  documentsToValidate: number;
}

export interface CalendarFilters {
  start_date?: string;
  end_date?: string;
  type?: string;
  category?: string;
  client_id?: string;
  expert_id?: string;
  dossier_id?: string;
  status?: string;
  priority?: string;
} 