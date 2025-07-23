import { supabase } from '@/lib/supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { 
  Message, 
  Conversation, 
  CreateConversationRequest, 
  SendMessageRequest,
  TypingIndicator,
  OnlineStatus,
  FileAttachment
} from '@/types/messaging';

// ============================================================================
// SERVICE DE MESSAGERIE UNIFIÉ OPTIMISÉ
// ============================================================================
// Inspiré par Brian Chesky (Airbnb) - Design Thinking
// et Guillermo Rauch (Vercel) - Performance & Real-time

export interface MessagingCallbacks {
  onNewMessage?: (message: Message) => void;
  onMessageRead?: (messageId: string, readAt: string) => void;
  onTyping?: (userId: string, isTyping: boolean) => void;
  onUserOnline?: (userId: string, status: OnlineStatus) => void;
  onConversationUpdate?: (conversation: Conversation) => void;
  onConnectionStatus?: (status: 'connected' | 'disconnected' | 'reconnecting') => void;
  onError?: (error: Error) => void;
  onFileUploadProgress?: (fileId: string, progress: number) => void;
}

export interface MessagingStats {
  totalMessages: number;
  unreadCount: number;
  activeConversations: number;
  responseTime: number;
  uptime: number;
}

class MessagingService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private callbacks: MessagingCallbacks = {};
  private currentUserId: string | null = null;
  private currentUserType: 'client' | 'expert' | 'admin' | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private stats: MessagingStats = {
    totalMessages: 0,
    unreadCount: 0,
    activeConversations: 0,
    responseTime: 0,
    uptime: 0
  };

  // ========================================
  // INITIALISATION ET CONNEXION (Guillermo Rauch)
  // ========================================

  async initialize(userId: string, userType: 'client' | 'expert' | 'admin'): Promise<void> {
    // Éviter les initialisations multiples
    if (this.isConnected && this.currentUserId === userId) {
      console.log('⚠️ Service déjà connecté pour cet utilisateur');
      return;
    }

    // Nettoyer les connexions existantes
    if (this.isConnected) {
      await this.disconnect();
    }

    this.currentUserId = userId;
    this.currentUserType = userType;
    
    try {
      // Vérifier la session Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Session Supabase invalide');
      }

      // Configurer les subscriptions Realtime optimisées
      await this.setupOptimizedRealtimeSubscriptions();
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.callbacks.onConnectionStatus?.('connected');
      
      console.log('✅ Service de messagerie unifié initialisé');
    } catch (error) {
      console.error('❌ Erreur initialisation messagerie:', error);
      this.callbacks.onError?.(error as Error);
      await this.handleReconnection();
      throw error;
    }
  }

  private async setupOptimizedRealtimeSubscriptions(): Promise<void> {
    // Channel optimisé pour les messages (Addy Osmani - Performance)
    const messagesChannel = supabase
      .channel('messaging-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=in.(${await this.getUserConversationIds()})`
        },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          const newMessage = payload.new as Message;
          if (newMessage.sender_id !== this.currentUserId) {
            this.callbacks.onNewMessage?.(newMessage);
            this.updateStats();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=in.(${await this.getUserConversationIds()})`
        },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          const updatedMessage = payload.new as Message;
          if (updatedMessage.is_read && updatedMessage.sender_id !== this.currentUserId) {
            this.callbacks.onMessageRead?.(updatedMessage.id, new Date().toISOString());
          }
        }
      );

    // Channel pour les conversations
    const conversationsChannel = supabase
      .channel('messaging-conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `participant_ids=cs.{${this.currentUserId}}`
        },
        (payload: RealtimePostgresChangesPayload<Conversation>) => {
          const conversation = payload.new as Conversation;
          this.callbacks.onConversationUpdate?.(conversation);
        }
      );

    // Channel pour les indicateurs de frappe
    const typingChannel = supabase
      .channel('messaging-typing')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=in.(${await this.getUserConversationIds()})`
        },
        (payload: RealtimePostgresChangesPayload<TypingIndicator>) => {
          const typing = payload.new as TypingIndicator;
          if (typing.user_id !== this.currentUserId) {
            this.callbacks.onTyping?.(typing.user_id, true);
            // Auto-clear typing indicator after 3 seconds
            setTimeout(() => {
              this.callbacks.onTyping?.(typing.user_id, false);
            }, 3000);
          }
        }
      );

    // Subscribe aux channels
    await messagesChannel.subscribe();
    await conversationsChannel.subscribe();
    await typingChannel.subscribe();

    this.channels.set('messages', messagesChannel);
    this.channels.set('conversations', conversationsChannel);
    this.channels.set('typing', typingChannel);
  }

  // ========================================
  // GESTION DES CONVERSATIONS (Brian Chesky)
  // ========================================

  async getConversations(): Promise<Conversation[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages:messages(
            id,
            content,
            sender_id,
            sender_type,
            created_at,
            is_read
          )
        `)
        .contains('participant_ids', [this.currentUserId])
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Assurer que la conversation admin existe (Brian Chesky - 11-star experience)
      const conversations = data || [];
      const hasAdminConversation = conversations.some(conv => 
        conv.type === 'admin_support'
      );

      if (!hasAdminConversation && this.currentUserType !== 'admin') {
        const adminConversation = await this.createAdminConversation();
        conversations.unshift(adminConversation);
      }

      this.stats.activeConversations = conversations.length;
      return conversations;
    } catch (error) {
      console.error('❌ Erreur récupération conversations:', error);
      throw error;
    }
  }

  async createConversation(request: CreateConversationRequest): Promise<Conversation> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          type: request.conversation_type,
          participant_ids: [request.participant1_id, request.participant2_id],
          title: request.title,
          description: request.description,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Erreur création conversation:', error);
      throw error;
    }
  }

  private async createAdminConversation(): Promise<Conversation> {
    // Trouver un admin disponible
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('type', 'admin')
      .limit(1);

    const adminId = admins?.[0]?.id;
    if (!adminId) {
      throw new Error('Aucun administrateur disponible');
    }

    return this.createConversation({
      participant1_id: this.currentUserId!,
      participant1_type: this.currentUserType!,
      participant2_id: adminId,
      participant2_type: 'admin',
      conversation_type: 'support', // Utiliser 'support' au lieu de 'admin_support'
      title: 'Support Administratif',
      description: 'Conversation avec le support administratif'
    });
  }

  // ========================================
  // GESTION DES MESSAGES (Evan You)
  // ========================================

  async getMessages(conversationId: string, limit = 50, offset = 0): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      this.stats.totalMessages = (data || []).length;
      return (data || []).reverse(); // Inverser pour avoir l'ordre chronologique
    } catch (error) {
      console.error('❌ Erreur récupération messages:', error);
      throw error;
    }
  }

  async sendMessage(request: SendMessageRequest): Promise<Message> {
    try {
      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: request.conversation_id,
          sender_id: this.currentUserId,
          sender_type: this.currentUserType,
          sender_name: request.sender_name,
          content: request.content,
          message_type: request.message_type || 'text',
          metadata: request.metadata || {}
        })
        .select()
        .single();

      if (error) throw error;

      // Mettre à jour last_message_at de la conversation
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', request.conversation_id);

      this.stats.responseTime = Date.now() - startTime;
      return data;
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      throw error;
    }
  }

  // ========================================
  // GESTION DES FICHIERS (Sarah Drasner)
  // ========================================

  async uploadFile(file: File, conversationId: string): Promise<FileAttachment> {
    try {
      const fileId = `${Date.now()}-${file.name}`;
      const filePath = `messaging/${conversationId}/${fileId}`;

      // Upload sans progression (Supabase ne supporte pas onUploadProgress)
      const { error } = await supabase.storage
        .from('files')
        .upload(filePath, file);

      if (error) throw error;

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(filePath);

      return {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
        uploaded_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erreur upload fichier:', error);
      throw error;
    }
  }

  // ========================================
  // GESTION DES STATUTS ET LECTURE
  // ========================================

  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      await supabase
        .from('messages')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', messageId);
    } catch (error) {
      console.error('❌ Erreur marquage message lu:', error);
      throw error;
    }
  }

  async markConversationAsRead(conversationId: string): Promise<void> {
    try {
      await supabase
        .from('messages')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('conversation_id', conversationId)
        .neq('sender_id', this.currentUserId);
    } catch (error) {
      console.error('❌ Erreur marquage conversation lue:', error);
      throw error;
    }
  }

  async sendTypingIndicator(conversationId: string, isTyping: boolean): Promise<void> {
    try {
      if (isTyping) {
        await supabase
          .from('typing_indicators')
          .insert({
            conversation_id: conversationId,
            user_id: this.currentUserId,
            user_type: this.currentUserType,
            is_typing: true
          });
      } else {
        await supabase
          .from('typing_indicators')
          .delete()
          .eq('conversation_id', conversationId)
          .eq('user_id', this.currentUserId);
      }
    } catch (error) {
      console.error('❌ Erreur indicateur frappe:', error);
    }
  }

  // ========================================
  // GESTION DE LA RECONNEXION (Guillermo Rauch)
  // ========================================

  private async handleReconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.callbacks.onError?.(new Error('Impossible de se reconnecter'));
      return;
    }

    this.reconnectAttempts++;
    this.callbacks.onConnectionStatus?.('reconnecting');

    setTimeout(async () => {
      try {
        await this.initialize(this.currentUserId!, this.currentUserType!);
      } catch (error) {
        await this.handleReconnection();
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  // ========================================
  // UTILITAIRES ET STATISTIQUES
  // ========================================

  private async getUserConversationIds(): Promise<string> {
    const conversations = await this.getConversations();
    return conversations.map(conv => conv.id).join(',');
  }

  private updateStats(): void {
    this.stats.uptime = Date.now();
  }

  getStats(): MessagingStats {
    return { ...this.stats };
  }

  setCallbacks(callbacks: MessagingCallbacks): void {
    this.callbacks = callbacks;
  }

  async disconnect(): Promise<void> {
    try {
      for (const [_name, channel] of this.channels) {
        await supabase.removeChannel(channel);
      }
      this.channels.clear();
      this.isConnected = false;
      this.callbacks.onConnectionStatus?.('disconnected');
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error);
    }
  }

  isServiceConnected(): boolean {
    return this.isConnected;
  }

  getCurrentUser(): { id: string; type: 'client' | 'expert' | 'admin' } | null {
    if (!this.currentUserId || !this.currentUserType) return null;
    return { id: this.currentUserId, type: this.currentUserType };
  }
}

// Instance singleton (Addy Osmani - Performance)
export const messagingService = new MessagingService(); 