import express from 'express';
import { supabaseAdmin } from '../config/supabase';
import { authenticateUser, requireUserType } from '../middleware/authenticate';
import { AuthUser } from '../types/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Interfaces TypeScript
interface Conversation {
  id: string;
  type: string;
  participant_ids: string[];
  title?: string;
  description?: string;
  status: string;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: string;
  content: string;
  message_type: string;
  attachments?: any[];
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

interface Participant {
  id: string;
  name: string;
  type: string;
  company?: string;
  avatar?: string | null;
}

const router = express.Router();

// Configuration multer pour upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/messages');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Max 5 fichiers par message
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/zip',
      'application/x-rar-compressed',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  }
});

// ========================================
// ROUTES CONVERSATIONS
// ========================================

// GET /api/messaging/conversations - Liste des conversations
router.get('/conversations', authenticateUser, async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    const { page = 1, limit = 20, type, status, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabaseAdmin
      .from('conversations')
      .select(`
        *,
        messages (
          id,
          content,
          sender_type,
          created_at,
          is_read
        )
      `)
      .or(`participant_ids.cs.{${authUser.id}}`);

    // Filtres
    if (type && type !== 'all') {
      query = query.eq('type', String(type));
    }
    
    if (status && status !== 'all') {
      query = query.eq('status', String(status));
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: conversations, error, count } = await query
      .order('last_message_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) {
      console.error('❌ Erreur récupération conversations:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des conversations'
      });
    }

    // Enrichir avec les informations des participants
    const enrichedConversations = await Promise.all(
      conversations?.map(async (conv: Conversation) => {
        const participants = await Promise.all(
          conv.participant_ids.map(async (participantId: string) => {
            if (participantId === '00000000-0000-0000-0000-000000000000') {
              return {
                id: participantId,
                name: 'Support Administratif',
                type: 'admin',
                avatar: null
              };
            }

            // Récupérer les infos utilisateur selon le type
            const { data: userData } = await supabaseAdmin
              .from(authUser.type === 'client' ? 'Client' : 'Expert')
              .select('id, name, email, company_name')
              .eq('id', participantId)
              .single();

            return {
              id: participantId,
              name: userData?.name || 'Utilisateur',
              type: authUser.type === 'client' ? 'expert' : 'client',
              company: userData?.company_name,
              avatar: null
            };
          })
        );

        const lastMessage = conv.messages?.[0];
        const unreadCount = conv.messages?.filter((m: Message) => 
          m.sender_type !== authUser.type && !m.is_read
        ).length || 0;

        return {
          ...conv,
          participants,
          lastMessage,
          unreadCount
        };
      }) || []
    );

    res.json({
      success: true,
      data: {
        conversations: enrichedConversations,
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
});

// POST /api/messaging/conversations - Créer une conversation
router.post('/conversations', authenticateUser, async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    const { type, participant_ids, title, description, assignment_id } = req.body;

    if (!type || !participant_ids || participant_ids.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Type et participants requis'
      });
    }

    // Vérifier que l'utilisateur fait partie des participants
    if (!participant_ids.includes(authUser.id)) {
      return res.status(403).json({
        success: false,
        message: 'Vous devez faire partie des participants'
      });
    }

    const { data: conversation, error } = await supabaseAdmin
      .from('conversations')
      .insert({
        type,
        participant_ids,
        title,
        description,
        assignment_id
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur création conversation:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la conversation'
      });
    }

    res.status(201).json({
      success: true,
      data: conversation
    });

  } catch (error) {
    console.error('❌ Erreur création conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ========================================
// ROUTES MESSAGES
// ========================================

// GET /api/messaging/conversations/:id/messages - Messages d'une conversation
router.get('/conversations/:id/messages', authenticateUser, async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    const { id: conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Vérifier l'accès à la conversation
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation non trouvée'
      });
    }

    // Vérifier les permissions
    if (!conversation.participant_ids.includes(authUser.id)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Récupérer les messages
    const { data: messages, error, count } = await supabaseAdmin
      .from('messages')
      .select(`
        *,
        message_files (
          id,
          filename,
          original_name,
          file_size,
          mime_type,
          description
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) {
      console.error('❌ Erreur récupération messages:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des messages'
      });
    }

    // Marquer les messages comme lus
    if (messages && messages.length > 0) {
      const unreadMessages = messages.filter(msg => 
        msg.sender_type !== authUser.type && !msg.is_read
      );

      if (unreadMessages.length > 0) {
        await supabaseAdmin
          .from('messages')
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
        conversation,
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
});

// POST /api/messaging/conversations/:id/messages - Envoyer un message
router.post('/conversations/:id/messages', authenticateUser, upload.array('files', 5), async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    const { id: conversationId } = req.params;
    const { content, message_type = 'text' } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu du message est requis'
      });
    }

    // Vérifier l'accès à la conversation
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation non trouvée'
      });
    }

    // Vérifier les permissions
    if (!conversation.participant_ids.includes(authUser.id)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Créer le message
    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: authUser.id,
        sender_type: authUser.type,
        content: content.trim(),
        message_type
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

    // Traiter les fichiers uploadés
    let fileRecords: any[] = [];
    if (files && files.length > 0) {
      fileRecords = await Promise.all(
        files.map(async (file) => {
          const { data: fileRecord, error: fileError } = await supabaseAdmin
            .from('message_files')
            .insert({
              message_id: message.id,
              filename: file.filename,
              original_name: file.originalname,
              file_path: file.path,
              file_size: file.size,
              mime_type: file.mimetype
            })
            .select()
            .single();

          if (fileError) {
            console.error('❌ Erreur sauvegarde fichier:', fileError);
          }

          return fileRecord;
        })
      );

      // Mettre à jour le message avec les fichiers
      const validFileRecords = fileRecords.filter((f: any) => f);
      if (validFileRecords.length > 0) {
        await supabaseAdmin
          .from('messages')
          .update({
            attachments: validFileRecords.map((f: any) => ({
              id: f.id,
              filename: f.filename,
              original_name: f.original_name,
              file_size: f.file_size,
              mime_type: f.mime_type
            }))
          })
          .eq('id', message.id);
      }
    }

    // Broadcast du message via WebSocket
    try {
      // SUPPRIMER : const wsService = getUnifiedWebSocket();
      
      // Envoyer le message aux participants de la conversation
      conversation.participant_ids.forEach((participantId: string) => {
        if (participantId !== authUser.id) {
          // Utiliser la méthode publique du service unifié
          // SUPPRIMER : wsService.broadcastNewMessage(conversationId, {
          // SUPPRIMER :   ...message,
          // SUPPRIMER :   attachments: files ? files.map(f => ({
          // SUPPRIMER :     id: f.filename,
          // SUPPRIMER :     filename: f.filename,
          // SUPPRIMER :     original_name: f.originalname,
          // SUPPRIMER :     file_size: f.size,
          // SUPPRIMER :     mime_type: f.mimetype
          // SUPPRIMER :   })) : []
          // SUPPRIMER : });
        }
      });
    } catch (wsError) {
      console.error('❌ Erreur WebSocket broadcasting:', wsError);
      // Ne pas faire échouer la requête si WebSocket échoue
    }

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
});

// ========================================
// ROUTES FICHIERS
// ========================================

// GET /api/messaging/files/:id/download - Télécharger un fichier
router.get('/files/:id/download', authenticateUser, async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    const { id: fileId } = req.params;

    // Récupérer les infos du fichier
    const { data: file, error } = await supabaseAdmin
      .from('message_files')
      .select(`
        *,
        messages!inner (
          conversation_id,
          conversations!inner (
            participant_ids
          )
        )
      `)
      .eq('id', fileId)
      .single();

    if (error || !file) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }

    // Vérifier les permissions
    const conversation = file.messages.conversations;
    if (!conversation.participant_ids.includes(authUser.id)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Vérifier que le fichier existe
    if (!fs.existsSync(file.file_path)) {
      return res.status(404).json({
        success: false,
        message: 'Fichier introuvable sur le serveur'
      });
    }

    // Incrémenter le compteur de téléchargements
    await supabaseAdmin
      .from('message_files')
      .update({ download_count: file.download_count + 1 })
      .eq('id', fileId);

    // Envoyer le fichier
    res.download(file.file_path, file.original_name);

  } catch (error) {
    console.error('❌ Erreur téléchargement fichier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ========================================
// ROUTES NOTIFICATIONS
// ========================================

// GET /api/messaging/notifications - Notifications de l'utilisateur
router.get('/notifications', authenticateUser, async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { data: notifications, error, count } = await supabaseAdmin
      .from('message_notifications')
      .select(`
        *,
        conversations (
          id,
          title,
          type
        ),
        messages (
          id,
          content,
          sender_type
        )
      `)
      .eq('user_id', authUser.id)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) {
      console.error('❌ Erreur récupération notifications:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des notifications'
      });
    }

    res.json({
      success: true,
      data: {
        notifications: notifications || [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0,
          totalPages: Math.ceil((count || 0) / Number(limit))
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur route notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// PUT /api/messaging/notifications/:id/read - Marquer notification comme lue
router.put('/notifications/:id/read', authenticateUser, async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    const { id: notificationId } = req.params;

    const { data: notification, error } = await supabaseAdmin
      .from('message_notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', notificationId)
      .eq('user_id', authUser.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur marquage notification:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du marquage de la notification'
      });
    }

    res.json({
      success: true,
      data: notification
    });

  } catch (error) {
    console.error('❌ Erreur route notification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ========================================
// ROUTES DE TEST WEBSOCKET
// ========================================

// GET /api/unified-messaging/ws-test - Test WebSocket
router.get('/ws-test', authenticateUser, async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    
    res.json({
      success: true,
      data: {
        message: 'WebSocket test endpoint',
        user: {
          id: authUser.id,
          type: authUser.type
        },
        websocket: {
          status: 'active',
          classic_port: 5002,
          unified_port: 5003,
          rest_node_port: 5004,
          rest_python_port: 5001
        },
        instructions: [
          '1. WebSocket classique : ws://[::1]:5002',
          '2. WebSocket unifié : ws://[::1]:5003',
          '3. API REST Node : http://[::1]:5004',
          '4. API Python : http://[::1]:5001',
          '5. Authentifiez-vous avec votre token',
          '6. Envoyez des messages pour tester le temps réel'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Erreur test WebSocket:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/unified-messaging/status - Statut de l'API
router.get('/status', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        message: 'API Unified Messaging opérationnelle',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        features: [
          'Conversations unifiées',
          'Messages temps réel',
          'Support fichiers',
          'Notifications',
          'WebSocket intégré'
        ]
      }
    });
  } catch (error) {
    console.error('❌ Erreur route status:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ========================================
// ROUTES ADMIN - GESTION UTILISATEURS
// ========================================

// GET /api/unified-messaging/admin/users - Liste des utilisateurs pour admin
router.get('/admin/users', authenticateUser, requireUserType('admin'), async (req, res) => {
  try {
    const { search, type, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let clients: any[] = [];
    let experts: any[] = [];

    // Récupérer les clients
    if (!type || type === 'client') {
      let clientQuery = supabaseAdmin
        .from('Client')
        .select('id, name, email, company_name, created_at, status')
        .order('name', { ascending: true });

      if (search) {
        clientQuery = clientQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`);
      }

      const { data: clientData, error: clientError } = await clientQuery
        .range(offset, offset + Number(limit) - 1);

      if (!clientError && clientData) {
        clients = clientData.map(client => ({
          id: client.id,
          name: client.name,
          email: client.email,
          company: client.company_name,
          type: 'client',
          status: client.status,
          created_at: client.created_at
        }));
      }
    }

    // Récupérer les experts
    if (!type || type === 'expert') {
      let expertQuery = supabaseAdmin
        .from('Expert')
        .select('id, first_name, last_name, email, company_name, specializations, status, created_at')
        .order('first_name', { ascending: true });

      if (search) {
        expertQuery = expertQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`);
      }

      const { data: expertData, error: expertError } = await expertQuery
        .range(offset, offset + Number(limit) - 1);

      if (!expertError && expertData) {
        experts = expertData.map(expert => ({
          id: expert.id,
          name: `${expert.first_name} ${expert.last_name}`,
          email: expert.email,
          company: expert.company_name,
          type: 'expert',
          specializations: expert.specializations,
          status: expert.status,
          created_at: expert.created_at
        }));
      }
    }

    // Combiner et trier les résultats
    const allUsers = [...clients, ...experts].sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      success: true,
      data: {
        users: allUsers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: allUsers.length,
          totalPages: Math.ceil(allUsers.length / Number(limit))
        },
        filters: {
          search: search || '',
          type: type || 'all'
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération utilisateurs admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs'
    });
  }
});

// POST /api/unified-messaging/admin/conversations - Créer conversation admin
router.post('/admin/conversations', authenticateUser, requireUserType('admin'), async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    const { participant_ids, title, description } = req.body;

    if (!participant_ids || participant_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Au moins un participant est requis'
      });
    }

    // Vérifier que l'admin fait partie des participants
    const allParticipants = [authUser.id, ...participant_ids];

    // Créer la conversation
    const { data: conversation, error } = await supabaseAdmin
      .from('conversations')
      .insert({
        type: 'admin_support',
        participant_ids: allParticipants,
        title: title || 'Support Administratif',
        description: description || 'Conversation de support avec l\'administrateur',
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur création conversation admin:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la conversation'
      });
    }

    // Ajouter les participants au WebSocket
    try {
      // SUPPRIMER : const wsService = getUnifiedWebSocket();
      participant_ids.forEach((participantId: string) => {
        // SUPPRIMER : wsService.addUserToConversation(participantId, conversation.id);
      });
    } catch (wsError) {
      console.error('❌ Erreur WebSocket ajout participants:', wsError);
    }

    res.status(201).json({
      success: true,
      data: conversation
    });

  } catch (error) {
    console.error('❌ Erreur création conversation admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default router; 