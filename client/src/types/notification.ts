// Types pour les notifications expert

export interface ExpertNotification {
  id: string;
  type: 'assignment' | 'message' | 'reminder' | 'payment' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: {
    assignmentId?: string;
    clientId?: string;
    amount?: number;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  byType: {
    assignment: number;
    message: number;
    reminder: number;
    payment: number;
    system: number;
  };
  byPriority: {
    urgent: number;
    high: number;
    normal: number;
    low: number;
  };
}

export interface NotificationFilter {
  type?: string;
  priority?: string;
  read?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  searchTerm?: string;
}

export interface NotificationAction {
  id: string;
  action: 'mark_read' | 'mark_unread' | 'delete' | 'archive';
} 