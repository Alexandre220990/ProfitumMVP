import express, { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticateUser, requireUserType } from '../middleware/authenticate';
import { AuthUser } from '../types/auth';

const router = express.Router();

// Configuration Supabase
const supabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ========================================
// ROUTES DE MESSAGERIE UNIFIÉES
// ========================================

// GET /api/messaging/conversations - Liste des conversations (assignations)
router.get('/conversations', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabaseClient
      .from('expertassignment')
      .select(`
        *,
        Expert (
          id,
          name,
          email,
          company_name,
          specializations,
          rating
        ),
        ClientProduitEligible (
          id,
          statut,
          montantFinal,
          ProduitEligible (
            id,
            nom,
            description,
            categorie
          ),
          Client (
            id,
            email,
            company_name,
            name,
            phone_number
          )
        )
      `);

    // Filtrer selon le type d'utilisateur
    if (authUser.type === 'client') {
      query = query.eq('ClientProduitEligible.Client.id', authUser.id);
    } else if (authUser.type === 'expert') {
      query = query.eq('expert_id', authUser.id);
    }

    // Filtres optionnels
    if (status && status !== 'all') {
      query = query.eq('status', String(status));
    }

    if (search) {
      if (authUser.type === 'client') {
        query = query.or(`Expert.name.ilike.%${search}%,Expert.company_name.ilike.%${search}%`);
      } else {
        query = query.or(`ClientProduitEligible.Client.name.ilike.%${search}%,ClientProduitEligible.Client.company_name.ilike.%${search}%`);
      }
    }

    // Tri et pagination
    query = query.order('assignment_date', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    const { data: assignments, error, count } = await query;

    if (error) {
      console.error('❌ Erreur récupération conversations:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération des conversations' 
      });
    }

    // Transformer les données pour correspondre au frontend
    const conversations = assignments?.map(assignment => ({
      id: assignment.id,
      assignment_id: assignment.id,
      expert: assignment.Expert,
      client: assignment.ClientProduitEligible?.Client,
      produit: assignment.ClientProduitEligible?.ProduitEligible,
      status: assignment.status,
      assignment_date: assignment.assignment_date,
      created_at: assignment.created_at,
      updated_at: assignment.updated_at,
      // Récupérer le dernier message
      lastMessage: null, // Sera chargé séparément
      unreadCount: 0 // Sera calculé séparément
    })) || [];

    // Charger le dernier message et le nombre de messages non lus pour chaque conversation
    for (const conversation of conversations) {
      const { data: lastMessage } = await supabaseClient
        .from('Message')
        .select('*')
        .eq('assignment_id', conversation.assignment_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const { count: unreadCount } = await supabaseClient
        .from('Message')
        .select('*', { count: 'exact', head: true })
        .eq('assignment_id', conversation.assignment_id)
        .eq('recipient_type', authUser.type)
        .eq('recipient_id', authUser.id)
        .eq('is_read', false);

      conversation.lastMessage = lastMessage;
      conversation.unreadCount = unreadCount || 0;
    }

    res.json({
      success: true,
      data: {
        conversations,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0,
          totalPages: Math.ceil((count || 0) / Number(limit))
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur route conversations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
}));

// GET /api/messaging/conversations/:id/messages - Messages d'une conversation
router.get('/conversations/:id/messages', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    const { id: assignmentId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Vérifier l'accès à l'assignation
    const { data: assignment, error: assignmentError } = await supabaseClient
      .from('expertassignment')
      .select(`
        *,
        Expert (id, name, email),
        ClientProduitEligible (
          Client (id, email, name)
        )
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Conversation non trouvée' 
      });
    }

    // Vérifier les permissions
    const clientId = assignment.ClientProduitEligible?.Client?.id;
    const expertId = assignment.expert_id;

    if (authUser.type === 'client' && authUser.id !== clientId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }

    if (authUser.type === 'expert' && authUser.id !== expertId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }

    // Récupérer les messages
    const { data: messages, error, count } = await supabaseClient
      .from('Message')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) {
      console.error('❌ Erreur récupération messages:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération des messages' 
      });
    }

    // Marquer les messages comme lus si l'utilisateur est le destinataire
    if (messages && messages.length > 0) {
      const unreadMessages = messages.filter(msg => 
        msg.recipient_type === authUser.type && 
        msg.recipient_id === authUser.id && 
        !msg.is_read
      );

      if (unreadMessages.length > 0) {
        await supabaseClient
          .from('Message')
          .update({ 
            is_read: true, 
            read_at: new Date().toISOString() 
          })
          .in('id', unreadMessages.map(msg => msg.id));
      }
    }

    res.json({
      success: true,
      data: {
        messages: messages?.reverse() || [], // Remettre dans l'ordre chronologique
        assignment,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0,
          totalPages: Math.ceil((count || 0) / Number(limit))
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur route messages:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
}));

// POST /api/messaging/conversations/:id/messages - Envoyer un message
router.post('/conversations/:id/messages', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    const { id: assignmentId } = req.params;
    const { content, message_type = 'text', attachments = [] } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le contenu du message est requis' 
      });
    }

    // Vérifier l'accès à l'assignation
    const { data: assignment, error: assignmentError } = await supabaseClient
      .from('expertassignment')
      .select(`
        *,
        Expert (id, name, email),
        ClientProduitEligible (
          Client (id, email, name)
        )
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Conversation non trouvée' 
      });
    }

    // Vérifier les permissions
    const clientId = assignment.ClientProduitEligible?.Client?.id;
    const expertId = assignment.expert_id;

    if (authUser.type === 'client' && authUser.id !== clientId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }

    if (authUser.type === 'expert' && authUser.id !== expertId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }

    // Déterminer le destinataire
    const recipientType = authUser.type === 'client' ? 'expert' : 'client';
    const recipientId = authUser.type === 'client' ? expertId : clientId;

    // Créer le message
    const { data: message, error } = await supabaseClient
      .from('Message')
      .insert({
        assignment_id: assignmentId,
        sender_type: authUser.type,
        sender_id: authUser.id,
        recipient_type: recipientType,
        recipient_id: recipientId,
        content: content.trim(),
        message_type,
        attachments: attachments.length > 0 ? attachments : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur création message:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de l\'envoi du message' 
      });
    }

    // Mettre à jour la date de l'assignation
    await supabaseClient
      .from('expertassignment')
      .update({ 
        updated_at: new Date().toISOString() 
      })
      .eq('id', assignmentId);

    res.status(201).json({
      success: true,
      data: message
    });

  } catch (error) {
    console.error('❌ Erreur envoi message:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
}));

// PUT /api/messaging/messages/:id/read - Marquer un message comme lu
router.put('/messages/:id/read', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    const { id: messageId } = req.params;

    // Vérifier que l'utilisateur est le destinataire du message
    const { data: message, error: messageError } = await supabaseClient
      .from('Message')
      .select('*')
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      return res.status(404).json({ 
        success: false, 
        message: 'Message non trouvé' 
      });
    }

    if (message.recipient_type !== authUser.type || message.recipient_id !== authUser.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }

    // Marquer comme lu
    const { data: updatedMessage, error } = await supabaseClient
      .from('Message')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur marquage message:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur lors du marquage du message' 
      });
    }

    res.json({
      success: true,
      data: updatedMessage
    });

  } catch (error) {
    console.error('❌ Erreur route marquage message:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
}));

// GET /api/messaging/unread-count - Nombre de messages non lus
router.get('/unread-count', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const authUser = req.user as AuthUser;

    const { count, error } = await supabaseClient
      .from('Message')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_type', authUser.type)
      .eq('recipient_id', authUser.id)
      .eq('is_read', false);

    if (error) {
      console.error('❌ Erreur comptage messages non lus:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur lors du comptage' 
      });
    }

    res.json({
      success: true,
      data: {
        unreadCount: count || 0
      }
    });

  } catch (error) {
    console.error('❌ Erreur route unread-count:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
}));

export default router; 