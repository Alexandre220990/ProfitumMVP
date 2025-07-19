// Types pour l'agenda expert

export interface AgendaEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number;
  type: 'meeting' | 'call' | 'deadline' | 'task';
  status: 'scheduled' | 'completed' | 'cancelled';
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  location?: string;
  notes?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
}

export interface AgendaFilter {
  type?: string;
  status?: string;
  priority?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  clientId?: string;
  searchTerm?: string;
}

export interface AgendaStats {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

export interface AgendaAction {
  id: string;
  type: 'complete' | 'cancel' | 'reschedule';
  newDate?: string;
  newTime?: string;
  reason?: string;
  notes?: string;
} 