// ============================================================================
// TYPES ET INTERFACES POUR LE SYSTÈME DE MESSAGERIE
// ============================================================================

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
  };
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
  title?: string;
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

export interface SocketMessage {
  type: 'message' | 'typing' | 'read' | 'online' | 'offline' | 'notification';
  data: any;
  timestamp: string;
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

// Types pour les événements Socket.IO
export interface ClientToServerEvents {
  'authenticate': (data: { userId: string; userType: 'client' | 'expert' | 'admin' }) => void;
  'join-conversation': (conversationId: string) => void;
  'leave-conversation': (conversationId: string) => void;
  'send-message': (data: { conversationId: string; content: string; messageType?: string; metadata?: any }) => void;
  'typing-start': (conversationId: string) => void;
  'typing-stop': (conversationId: string) => void;
  'mark-read': (conversationId: string) => void;
  'online-status': (isOnline: boolean) => void;
}

export interface ServerToClientEvents {
  'message-received': (message: Message) => void;
  'typing-indicator': (data: TypingIndicator) => void;
  'message-read': (data: { conversationId: string; userId: string; timestamp: string }) => void;
  'user-online': (data: OnlineStatus) => void;
  'user-offline': (data: OnlineStatus) => void;
  'notification': (notification: MessageNotification) => void;
  'conversation-updated': (conversation: Conversation) => void;
}

// Types pour les requêtes API
export interface CreateConversationRequest {
  participant1_id: string;
  participant1_type: 'client' | 'expert' | 'admin';
  participant2_id: string;
  participant2_type: 'client' | 'expert' | 'admin';
  conversation_type: 'private' | 'support';
  title?: string;
}

export interface SendMessageRequest {
  conversation_id: string;
  content: string;
  message_type?: 'text' | 'file' | 'event_link' | 'audit_notification' | 'reminder';
  metadata?: any;
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