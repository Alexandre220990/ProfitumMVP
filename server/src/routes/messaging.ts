import { Router } from 'express';
import { messagingService } from '../services/messaging-service';
import { 
  CreateConversationRequest,
  SendMessageRequest,
  GetConversationsRequest,
  GetMessagesRequest
} from '../types/messaging';

const router = Router();

// ============================================================================
// ROUTES DE MESSAGERIE
// ============================================================================

/**
 * Créer une nouvelle conversation
 * POST /api/messaging/conversations
 */
router.post('/conversations', async (req, res) => {
  try {
    const request: CreateConversationRequest = req.body;
    
    // Validation des données
    if (!request.participant1_id || !request.participant2_id) {
      return res.status(400).json({
        success: false,
        error: 'Les IDs des participants sont requis'
      });
    }

    const conversationId = await messagingService.createConversation(request);
    
    return res.json({
      success: true,
      data: { conversation_id: conversationId }
    });
  } catch (error) {
    console.error('❌ Erreur création conversation:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la conversation'
    });
  }
});

/**
 * Récupérer les conversations d'un utilisateur
 * GET /api/messaging/conversations?user_id=...&user_type=...&limit=...&offset=...
 */
router.get('/conversations', async (req, res) => {
  try {
    const request: GetConversationsRequest = {
      user_id: req.query.user_id as string,
      user_type: req.query.user_type as 'client' | 'expert' | 'admin',
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      include_archived: req.query.include_archived === 'true'
    };

    // Validation des données
    if (!request.user_id || !request.user_type) {
      return res.status(400).json({
        success: false,
        error: 'user_id et user_type sont requis'
      });
    }

    const conversations = await messagingService.getConversations(request);
    
    return res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('❌ Erreur récupération conversations:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des conversations'
    });
  }
});

/**
 * Récupérer une conversation spécifique
 * GET /api/messaging/conversations/:id
 */
router.get('/conversations/:id', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const conversation = await messagingService.getConversation(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation non trouvée'
      });
    }

    return res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('❌ Erreur récupération conversation:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la conversation'
    });
  }
});

/**
 * Archiver une conversation
 * PUT /api/messaging/conversations/:id/archive
 */
router.put('/conversations/:id/archive', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.body.user_id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'user_id est requis'
      });
    }

    await messagingService.archiveConversation(conversationId, userId);
    
    return res.json({
      success: true,
      message: 'Conversation archivée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur archivage conversation:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'archivage de la conversation'
    });
  }
});

/**
 * Envoyer un message
 * POST /api/messaging/messages
 */
router.post('/messages', async (req, res) => {
  try {
    const request: SendMessageRequest = req.body;
    
    // Validation des données
    if (!request.conversation_id || !request.content) {
      return res.status(400).json({
        success: false,
        error: 'conversation_id et content sont requis'
      });
    }

    const message = await messagingService.sendMessage(request);
    
    return res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('❌ Erreur envoi message:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'envoi du message'
    });
  }
});

/**
 * Récupérer les messages d'une conversation
 * GET /api/messaging/conversations/:id/messages?limit=...&offset=...&before_date=...
 */
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const request: GetMessagesRequest = {
      conversation_id: conversationId,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      before_date: req.query.before_date as string
    };

    const messages = await messagingService.getMessages(request);
    
    return res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('❌ Erreur récupération messages:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des messages'
    });
  }
});

/**
 * Marquer les messages comme lus
 * PUT /api/messaging/conversations/:id/read
 */
router.put('/conversations/:id/read', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.body.user_id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'user_id est requis'
      });
    }

    await messagingService.markMessagesAsRead(conversationId, userId);
    
    return res.json({
      success: true,
      message: 'Messages marqués comme lus'
    });
  } catch (error) {
    console.error('❌ Erreur marquage messages lus:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du marquage des messages'
    });
  }
});

/**
 * Récupérer les notifications d'un utilisateur
 * GET /api/messaging/notifications?user_id=...&user_type=...&limit=...
 */
router.get('/notifications', async (req, res) => {
  try {
    const userId = req.query.user_id as string;
    const userType = req.query.user_type as 'client' | 'expert' | 'admin';
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    if (!userId || !userType) {
      return res.status(400).json({
        success: false,
        error: 'user_id et user_type sont requis'
      });
    }

    const notifications = await messagingService.getUserNotifications(userId, userType, limit);
    
    return res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('❌ Erreur récupération notifications:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des notifications'
    });
  }
});

/**
 * Marquer une notification comme lue
 * PUT /api/messaging/notifications/:id/read
 */
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const notificationId = req.params.id;
    await messagingService.markNotificationAsRead(notificationId);
    
    return res.json({
      success: true,
      message: 'Notification marquée comme lue'
    });
  } catch (error) {
    console.error('❌ Erreur marquage notification:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du marquage de la notification'
    });
  }
});

/**
 * Statistiques de messagerie
 * GET /api/messaging/stats
 */
router.get('/stats', async (req, res) => {
  try {
    // TODO: Implémenter les statistiques de messagerie
    const stats = {
      total_conversations: 0,
      total_messages: 0,
      active_users: 0,
      unread_messages: 0
    };
    
    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Erreur récupération statistiques:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

export default router; 