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
  };
  avatar?: string;
  is_read: boolean;
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
  unread_count: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
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