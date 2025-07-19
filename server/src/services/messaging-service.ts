import { supabase } from '../lib/supabase';
import { 
  Message, 
  Conversation, 
  ConversationParticipant,
  CreateConversationRequest,
  SendMessageRequest,
  GetConversationsRequest,
  GetMessagesRequest,
  MessageNotification
} from '../types/messaging';

// ============================================================================
// SERVICE DE MESSAGERIE
// ============================================================================

export class MessagingService {
  
  // ===== GESTION DES CONVERSATIONS =====

  /**
   * Créer une nouvelle conversation
   */
  async createConversation(request: CreateConversationRequest): Promise<string> {
    try {
      // Vérifier si une conversation existe déjà
      const existingConversation = await this.findExistingConversation(
        request.participant1_id,
        request.participant1_type,
        request.participant2_id,
        request.participant2_type
      );

      if (existingConversation) {
        return existingConversation.id;
      }

      // Créer la nouvelle conversation
      const { data: conversation, error } = await supabase
        .from('Conversation')
        .insert({
          participant1_id: request.participant1_id,
          participant1_type: request.participant1_type,
          participant2_id: request.participant2_id,
          participant2_type: request.participant2_type,
          conversation_type: request.conversation_type,
          title: request.title,
          unread_count: 0,
          is_archived: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ Erreur création conversation:', error);
        throw new Error('Impossible de créer la conversation');
      }

      // Créer les participants
      await this.addConversationParticipants(conversation.id, [
        {
          user_id: request.participant1_id,
          user_type: request.participant1_type
        },
        {
          user_id: request.participant2_id,
          user_type: request.participant2_type
        }
      ]);

      return conversation.id;
    } catch (error) {
      console.error('❌ Erreur création conversation:', error);
      throw error;
    }
  }

  /**
   * Trouver une conversation existante
   */
  private async findExistingConversation(
    participant1_id: string,
    participant1_type: string,
    participant2_id: string,
    participant2_type: string
  ): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from('Conversation')
      .select('*')
      .or(`and(participant1_id.eq.${participant1_id},participant1_type.eq.${participant1_type},participant2_id.eq.${participant2_id},participant2_type.eq.${participant2_type}),and(participant1_id.eq.${participant2_id},participant1_type.eq.${participant2_type},participant2_id.eq.${participant1_id},participant2_type.eq.${participant1_type})`)
      .eq('is_archived', false)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Erreur recherche conversation:', error);
    }

    return data;
  }

  /**
   * Récupérer les conversations d'un utilisateur
   */
  async getConversations(request: GetConversationsRequest): Promise<Conversation[]> {
    try {
      const { data, error } = await supabase
        .from('Conversation')
        .select(`
          *,
          ConversationParticipant!inner(user_id, user_type)
        `)
        .eq('ConversationParticipant.user_id', request.user_id)
        .eq('ConversationParticipant.user_type', request.user_type)
        .eq('ConversationParticipant.is_active', true)
        .eq('is_archived', request.include_archived || false)
        .order('last_message_at', { ascending: false })
        .range(request.offset || 0, (request.offset || 0) + (request.limit || 50) - 1);

      if (error) {
        console.error('❌ Erreur récupération conversations:', error);
        throw new Error('Impossible de récupérer les conversations');
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erreur récupération conversations:', error);
      throw error;
    }
  }

  /**
   * Récupérer une conversation par ID
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    try {
      const { data, error } = await supabase
        .from('Conversation')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('❌ Erreur récupération conversation:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Erreur récupération conversation:', error);
      return null;
    }
  }

  /**
   * Archiver une conversation
   */
  async archiveConversation(conversationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('Conversation')
        .update({
          is_archived: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) {
        console.error('❌ Erreur archivage conversation:', error);
        throw new Error('Impossible d\'archiver la conversation');
      }

      return true;
    } catch (error) {
      console.error('❌ Erreur archivage conversation:', error);
      throw error;
    }
  }

  // ===== GESTION DES MESSAGES =====

  /**
   * Envoyer un message
   */
  async sendMessage(request: SendMessageRequest): Promise<Message> {
    try {
      // Récupérer les informations de l'expéditeur
      const senderInfo = await this.getSenderInfo(request.conversation_id);
      if (!senderInfo) {
        throw new Error('Expéditeur non trouvé');
      }

      // Créer le message
      const { data: message, error } = await supabase
        .from('Message')
        .insert({
          conversation_id: request.conversation_id,
          sender_id: senderInfo.sender_id,
          sender_type: senderInfo.sender_type,
          sender_name: senderInfo.sender_name,
          content: request.content,
          message_type: request.message_type || 'text',
          metadata: request.metadata || {},
          is_read: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur envoi message:', error);
        throw new Error('Impossible d\'envoyer le message');
      }

      // Mettre à jour la conversation
      await this.updateConversationLastMessage(request.conversation_id, message.id);

      // Créer les notifications
      await this.createMessageNotifications(message);

      return message;
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      throw error;
    }
  }

  /**
   * Récupérer les messages d'une conversation
   */
  async getMessages(request: GetMessagesRequest): Promise<Message[]> {
    try {
      let query = supabase
        .from('Message')
        .select('*')
        .eq('conversation_id', request.conversation_id)
        .order('created_at', { ascending: false });

      if (request.before_date) {
        query = query.lt('created_at', request.before_date);
      }

      const { data, error } = await query
        .range(request.offset || 0, (request.offset || 0) + (request.limit || 50) - 1);

      if (error) {
        console.error('❌ Erreur récupération messages:', error);
        throw new Error('Impossible de récupérer les messages');
      }

      return (data || []).reverse(); // Inverser pour avoir l'ordre chronologique
    } catch (error) {
      console.error('❌ Erreur récupération messages:', error);
      throw error;
    }
  }

  /**
   * Marquer les messages comme lus
   */
  async markMessagesAsRead(conversationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('Message')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('❌ Erreur marquage messages lus:', error);
        throw new Error('Impossible de marquer les messages comme lus');
      }

      // Mettre à jour le statut de lecture du participant
      await this.updateParticipantLastRead(conversationId, userId);

      return true;
    } catch (error) {
      console.error('❌ Erreur marquage messages lus:', error);
      throw error;
    }
  }

  // ===== GESTION DES PARTICIPANTS =====

  /**
   * Ajouter des participants à une conversation
   */
  private async addConversationParticipants(
    conversationId: string,
    participants: Array<{ user_id: string; user_type: string }>
  ): Promise<void> {
    const participantData = participants.map(p => ({
      conversation_id: conversationId,
      user_id: p.user_id,
      user_type: p.user_type,
      is_active: true,
      joined_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('ConversationParticipant')
      .insert(participantData);

    if (error) {
      console.error('❌ Erreur ajout participants:', error);
      throw new Error('Impossible d\'ajouter les participants');
    }
  }

  /**
   * Mettre à jour le statut de lecture d'un participant
   */
  private async updateParticipantLastRead(conversationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('ConversationParticipant')
      .update({
        last_read_at: new Date().toISOString()
      })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Erreur mise à jour statut lecture:', error);
    }
  }

  // ===== FONCTIONS UTILITAIRES =====

  /**
   * Récupérer les informations de l'expéditeur
   */
  private async getSenderInfo(conversationId: string): Promise<{ sender_id: string; sender_type: string; sender_name: string } | null> {
    // Cette fonction devrait récupérer les informations de l'utilisateur connecté
    // Pour l'instant, on retourne des valeurs par défaut
    // TODO: Implémenter avec le système d'authentification
    return {
      sender_id: 'system',
      sender_type: 'system',
      sender_name: 'Système'
    };
  }

  /**
   * Mettre à jour le dernier message d'une conversation
   */
  private async updateConversationLastMessage(conversationId: string, messageId: string): Promise<void> {
    const { error } = await supabase
      .from('Conversation')
      .update({
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (error) {
      console.error('❌ Erreur mise à jour conversation:', error);
    }
  }

  /**
   * Créer les notifications pour un message
   */
  private async createMessageNotifications(message: Message): Promise<void> {
    try {
      // Récupérer les participants de la conversation
      const { data: participants, error } = await supabase
        .from('ConversationParticipant')
        .select('user_id, user_type')
        .eq('conversation_id', message.conversation_id)
        .neq('user_id', message.sender_id)
        .eq('is_active', true);

      if (error || !participants) {
        console.error('❌ Erreur récupération participants:', error);
        return;
      }

      // Créer une notification pour chaque participant
      const notifications = participants.map(participant => ({
        user_id: participant.user_id,
        user_type: participant.user_type,
        conversation_id: message.conversation_id,
        message_id: message.id,
        title: `Nouveau message de ${message.sender_name}`,
        body: message.content.length > 100 ? message.content.substring(0, 100) + '...' : message.content,
        is_read: false,
        created_at: new Date().toISOString()
      }));

      const { error: notificationError } = await supabase
        .from('MessageNotification')
        .insert(notifications);

      if (notificationError) {
        console.error('❌ Erreur création notifications:', notificationError);
      }
    } catch (error) {
      console.error('❌ Erreur création notifications:', error);
    }
  }

  /**
   * Récupérer les notifications d'un utilisateur
   */
  async getUserNotifications(userId: string, userType: string, limit: number = 20): Promise<MessageNotification[]> {
    try {
      const { data, error } = await supabase
        .from('MessageNotification')
        .select('*')
        .eq('user_id', userId)
        .eq('user_type', userType)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Erreur récupération notifications:', error);
        throw new Error('Impossible de récupérer les notifications');
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erreur récupération notifications:', error);
      throw error;
    }
  }

  /**
   * Marquer une notification comme lue
   */
  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('MessageNotification')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('❌ Erreur marquage notification:', error);
        throw new Error('Impossible de marquer la notification comme lue');
      }

      return true;
    } catch (error) {
      console.error('❌ Erreur marquage notification:', error);
      throw error;
    }
  }
}

// Instance singleton
export const messagingService = new MessagingService(); 