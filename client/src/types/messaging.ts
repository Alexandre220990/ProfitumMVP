// ============================================================================
// TYPES ET INTERFACES POUR LE SYSTÈME DE MESSAGERIE (FRONTEND)
// ============================================================================

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploaded_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: 'client' | 'expert' | 'admin' | 'system';
  sender_name: string;
  content: string;
  message_type: 'text' | 'file' | 'event_link' | 'audit_notification' | 'reminder';
  metadata?: {
    file_url?: string;
    file_name?: string;
    file_size?: number;
    event_id?: string;
    audit_id?: string;
    reminder_type?: string;
    attachments?: FileAttachment[];
    encrypted?: boolean;
    original_content?: string;
  };
  avatar?: string;
  is_read: boolean;
  read_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  participant1_id: string;
  participant1_type: 'client' | 'expert' | 'admin';
  participant2_id: string;
  participant2_type: 'client' | 'expert' | 'admin';
  conversation_type: 'private' | 'support' | 'system';
  type?: 'expert_client' | 'admin_support' | 'internal';
  title?: string;
  description?: string;
  avatar?: string;
  last_message_at?: string;
  last_message?: Message;
  unread_count: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  // Nouvelles propriétés pour les conversations automatiques
  otherParticipant?: {
    id: string;
    type: 'client' | 'expert' | 'admin';
    name: string;
    isOnline: boolean;
  };
  participant_ids?: string[];
  dossier_id?: string;
  auto_created?: boolean;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  user_type: 'client' | 'expert' | 'admin';
  is_active: boolean;
  last_read_at?: string;
  joined_at: string;
}

export interface TypingIndicator {
  conversation_id: string;
  user_id: string;
  user_type: 'client' | 'expert' | 'admin';
  is_typing: boolean;
}

export interface OnlineStatus {
  user_id: string;
  user_type: 'client' | 'expert' | 'admin';
  is_online: boolean;
  last_seen?: string;
}

export interface MessageNotification {
  id: string;
  user_id: string;
  user_type: 'client' | 'expert' | 'admin';
  conversation_id: string;
  message_id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

// Types pour les requêtes API
export interface CreateConversationRequest {
  participant1_id: string;
  participant1_type: 'client' | 'expert' | 'admin';
  participant2_id: string;
  participant2_type: 'client' | 'expert' | 'admin';
  conversation_type: 'private' | 'support';
  title?: string;
  description?: string;
  dossier_id?: string;
  auto_created?: boolean;
}

export interface SendMessageRequest {
  conversation_id: string;
  content: string;
  message_type?: 'text' | 'file' | 'event_link' | 'audit_notification' | 'reminder';
  metadata?: any;
  sender_name?: string;
}

export interface GetConversationsRequest {
  user_id: string;
  user_type: 'client' | 'expert' | 'admin';
  limit?: number;
  offset?: number;
  include_archived?: boolean;
}

export interface GetMessagesRequest {
  conversation_id: string;
  limit?: number;
  offset?: number;
  before_date?: string;
}

export interface MessagingState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  notifications: MessageNotification[];
  onlineUsers: Map<string, OnlineStatus>;
  typingUsers: Map<string, TypingIndicator>;
  loading: boolean;
  error: string | null;
}

export interface ConversationWithParticipant extends Conversation {
  otherParticipant: {
    id: string;
    type: 'client' | 'expert' | 'admin';
    name: string;
    isOnline: boolean;
  };
}

// ============================================================================
// TYPES POUR L'INTÉGRATION CALENDRIER
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

export interface CreateCalendarEventRequest {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  type: 'appointment' | 'deadline' | 'meeting' | 'task' | 'reminder';
  category: 'client' | 'expert' | 'admin' | 'system' | 'collaborative';
  is_online?: boolean;
  meeting_url?: string;
  phone_number?: string;
  participants?: string[];
  reminders?: Array<{ type: 'email' | 'push' | 'sms', time: number }>;
  metadata?: any;
}

// ============================================================================
// TYPES POUR LES SIGNALEMENTS
// ============================================================================

export interface ConversationReport {
  conversation_id: string;
  reason: string;
  reported_user_id: string;
  reported_user_type: 'client' | 'expert' | 'admin';
  reporter_id: string;
  reporter_type: 'client' | 'expert' | 'admin';
  description?: string;
  evidence?: string[];
  created_at: string;
}

export interface ReportConversationRequest {
  conversation_id: string;
  reason: string;
  reported_user_id: string;
  reported_user_type: 'client' | 'expert' | 'admin';
  description?: string;
  evidence?: string[];
}

// ============================================================================
// TYPES POUR LES NOTIFICATIONS PUSH
// ============================================================================

export interface PushNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  data?: any;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  created_at: string;
}

export interface PushNotificationRequest {
  user_id: string;
  title: string;
  body: string;
  data?: any;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
}

// ============================================================================
// TYPES POUR LES CONVERSATIONS AUTOMATIQUES
// ============================================================================

export interface ExpertAssignment {
  id: string;
  expert_id: string;
  client_id: string;
  dossier_id: string;
  status: 'pending' | 'validated' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface AutoConversationConfig {
  enabled: boolean;
  trigger_on_validation: boolean;
  include_admin_support: boolean;
  default_message?: string;
  auto_archive_after_days?: number;
} 