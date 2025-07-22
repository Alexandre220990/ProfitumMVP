import { supabase } from '@/lib/supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { 
  Message, 
  Conversation, 
  CreateConversationRequest, 
  SendMessageRequest,
  TypingIndicator,
  OnlineStatus 
} from '@/types/messaging';

// ============================================================================
// SERVICE SUPABASE REALTIME POUR LA MESSAGERIE
// ============================================================================

export interface MessagingCallbacks {
  onNewMessage?: (message: Message) => void;
  onMessageRead?: (messageId: string, readAt: string) => void;
  onTyping?: (userId: string, isTyping: boolean) => void;
  onUserOnline?: (userId: string, status: OnlineStatus) => void;
  onConversationUpdate?: (conversation: Conversation) => void;
  onError?: (error: Error) => void;
}

export class SupabaseMessagingService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private callbacks: MessagingCallbacks = {};
  private currentUserId: string | null = null;
  private currentUserType: 'client' | 'expert' | 'admin' | null = null;
  private isConnected = false;

  // ========================================
  // INITIALISATION ET CONNEXION
  // ========================================

  async initialize(userId: string, userType: 'client' | 'expert' | 'admin'): Promise<void> {
    this.currentUserId = userId;
    this.currentUserType = userType;
    
    try {
      // Vérifier la session Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Session Supabase invalide');
      }

      // Configurer les subscriptions Realtime
      await this.setupRealtimeSubscriptions();
      
      this.isConnected = true;
      console.log('✅ Service Supabase Messaging initialisé');
    } catch (error) {
      console.error('❌ Erreur initialisation Supabase Messaging:', error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  private async setupRealtimeSubscriptions(): Promise<void> {
    // Subscription pour les nouveaux messages
    const messagesChannel = supabase
      .channel('messages')
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

    // Subscription pour les mises à jour de conversations
    const conversationsChannel = supabase
      .channel('conversations')
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

    // Subscription pour les indicateurs de frappe
    const typingChannel = supabase
      .channel('typing')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=in.(${await this.getUserConversationIds()})`
        },
        (payload: RealtimePostgresChangesPayload<TypingIndicator>) => {
          const typingIndicator = payload.new as TypingIndicator;
          if (typingIndicator.user_id !== this.currentUserId) {
            this.callbacks.onTyping?.(typingIndicator.user_id, typingIndicator.is_typing);
          }
        }
      );

    // S'abonner aux channels
    await messagesChannel.subscribe();
    await conversationsChannel.subscribe();
    await typingChannel.subscribe();

    // Stocker les références
    this.channels.set('messages', messagesChannel);
    this.channels.set('conversations', conversationsChannel);
    this.channels.set('typing', typingChannel);
  }

  private async getUserConversationIds(): Promise<string> {
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .contains('participant_ids', [this.currentUserId]);

    return conversations?.map(c => c.id).join(',') || '';
  }

  // ========================================
  // GESTION DES CONVERSATIONS
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
            created_at
          )
        `)
        .contains('participant_ids', [this.currentUserId])
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // S'assurer que la conversation admin est en premier
      const conversations = data || [];
      const adminConversation = conversations.find(conv => 
        conv.type === 'admin_support' || 
        conv.participant_ids.includes('00000000-0000-0000-0000-000000000000')
      );

      if (adminConversation) {
        const filteredConversations = conversations.filter(conv => conv.id !== adminConversation.id);
        return [adminConversation, ...filteredConversations];
      }

      return conversations;
    } catch (error) {
      console.error('❌ Erreur récupération conversations:', error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  async createConversation(request: CreateConversationRequest): Promise<Conversation> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          type: request.conversation_type === 'support' ? 'admin_support' : 'expert_client',
          participant_ids: [request.participant1_id, request.participant2_id],
          title: request.title || 'Nouvelle conversation'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Erreur création conversation:', error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  async getOrCreateAdminConversation(): Promise<Conversation> {
    try {
      // Chercher une conversation admin existante
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('type', 'admin_support')
        .contains('participant_ids', [this.currentUserId])
        .single();

      if (existingConversation) {
        return existingConversation;
      }

      // Créer une nouvelle conversation admin
      return await this.createConversation({
        participant1_id: this.currentUserId!,
        participant1_type: this.currentUserType!,
        participant2_id: '00000000-0000-0000-0000-000000000000', // Admin ID
        participant2_type: 'admin',
        conversation_type: 'support',
        title: 'Support Administratif'
      });
    } catch (error) {
      console.error('❌ Erreur conversation admin:', error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  // ========================================
  // GESTION DES MESSAGES
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
      return (data || []).reverse(); // Inverser pour avoir l'ordre chronologique
    } catch (error) {
      console.error('❌ Erreur récupération messages:', error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  async sendMessage(request: SendMessageRequest): Promise<Message> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: request.conversation_id,
          sender_id: this.currentUserId,
          sender_type: this.currentUserType,
          content: request.content,
          message_type: request.message_type || 'text'
        })
        .select()
        .single();

      if (error) throw error;

      // Mettre à jour la conversation avec le dernier message
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', request.conversation_id);

      return data;
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('❌ Erreur marquage message lu:', error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  async markConversationAsRead(conversationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('conversation_id', conversationId)
        .neq('sender_id', this.currentUserId)
        .eq('is_read', false);

      if (error) throw error;
    } catch (error) {
      console.error('❌ Erreur marquage conversation lue:', error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  // ========================================
  // INDICATEURS DE FRAPPE
  // ========================================

  async sendTypingIndicator(conversationId: string, isTyping: boolean): Promise<void> {
    try {
      if (isTyping) {
        // Insérer ou mettre à jour l'indicateur de frappe
        const { error } = await supabase
          .from('typing_indicators')
          .upsert({
            conversation_id: conversationId,
            user_id: this.currentUserId,
            user_type: this.currentUserType,
            is_typing: true,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      } else {
        // Supprimer l'indicateur de frappe
        const { error } = await supabase
          .from('typing_indicators')
          .delete()
          .eq('conversation_id', conversationId)
          .eq('user_id', this.currentUserId);

        if (error) throw error;
      }
    } catch (error) {
      console.error('❌ Erreur indicateur de frappe:', error);
      // Ne pas propager l'erreur pour les indicateurs de frappe
    }
  }

  // ========================================
  // GESTION DES CALLBACKS
  // ========================================

  setCallbacks(callbacks: MessagingCallbacks): void {
    this.callbacks = callbacks;
  }

  // ========================================
  // NETTOYAGE ET DÉCONNEXION
  // ========================================

  async disconnect(): Promise<void> {
    try {
      // Se désabonner de tous les channels
      for (const [name, channel] of this.channels) {
        await supabase.removeChannel(channel);
        console.log(`🔌 Channel ${name} désabonné`);
      }

      this.channels.clear();
      this.isConnected = false;
      this.currentUserId = null;
      this.currentUserType = null;

      console.log('🔌 Service Supabase Messaging déconnecté');
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error);
    }
  }

  // ========================================
  // UTILITAIRES
  // ========================================

  isServiceConnected(): boolean {
    return this.isConnected;
  }

  getCurrentUser(): { id: string; type: 'client' | 'expert' | 'admin' } | null {
    if (!this.currentUserId || !this.currentUserType) return null;
    return { id: this.currentUserId, type: this.currentUserType };
  }
}

// Instance singleton
export const supabaseMessagingService = new SupabaseMessagingService(); 