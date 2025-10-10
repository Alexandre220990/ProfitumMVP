import express from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthUser } from '../types/auth';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
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
  // Nouvelles colonnes métier
  dossier_id?: string;
  client_id?: string;
  expert_id?: string;
  apporteur_id?: string;
  produit_id?: string;
  created_by?: string;
  access_level?: string;
  is_archived?: boolean;
  priority?: string;
  category?: string;
  tags?: string[];
  deleted_for_user_ids?: string[];
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

// Route spécifique pour les experts (compatibilité)
router.get('/expert/messagerie-expert', async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    
    if (authUser.type !== 'expert') {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès réservé aux experts' 
      });
    }

    // Rediriger vers le système unifié
    return res.json({
      success: true,
      message: 'Système de messagerie unifié',
      data: {
        expert_id: authUser.id,
        conversations_url: '/api/messaging/conversations',
        messages_url: '/api/messaging/conversations/:id/messages'
      }
    });
  } catch (error) {
    console.error('❌ Erreur messagerie expert:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/messaging/conversations - Liste des conversations
// GET /api/messaging/expert/conversations - Conversations spécifiques aux experts
router.get(['/conversations', '/expert/conversations'], async (req, res) => {
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
      (conversations as any[])?.filter((conv: any) => {
        // Filtrer les conversations avec UUID nul pour éviter les doublons
        return !conv.participant_ids.includes('00000000-0000-0000-0000-000000000000');
      }).map(async (conv: any) => {
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

            // Récupérer les infos utilisateur selon le type et les nouvelles colonnes métier
            let userData = null;
            
            // Utiliser les colonnes métier si disponibles
            if (conv.client_id && participantId === conv.client_id) {
              const { data } = await supabaseAdmin
                .from('Client')
                .select('id, name, email, company_name, is_active')
                .eq('id', conv.client_id)
                .single();
              userData = data;
            } else if (conv.expert_id && participantId === conv.expert_id) {
              const { data } = await supabaseAdmin
                .from('Expert')
                .select('id, name, email, company_name, is_active')
                .eq('id', conv.expert_id)
                .single();
              userData = data;
            } else if (conv.apporteur_id && participantId === conv.apporteur_id) {
              const { data } = await supabaseAdmin
                .from('ApporteurAffaires')
                .select('id, first_name, last_name, email, company_name, is_active')
                .eq('id', conv.apporteur_id)
                .single();
              if (data) {
                userData = {
                  ...data,
                  name: `${data.first_name} ${data.last_name}`
                };
              }
            } else {
              // Fallback: chercher dans toutes les tables
              const [clientRes, expertRes, apporteurRes] = await Promise.all([
                supabaseAdmin.from('Client').select('id, name, email, company_name, is_active').eq('id', participantId).maybeSingle(),
                supabaseAdmin.from('Expert').select('id, name, email, company_name, is_active').eq('id', participantId).maybeSingle(),
                supabaseAdmin.from('ApporteurAffaires').select('id, first_name, last_name, email, company_name, is_active').eq('id', participantId).maybeSingle()
              ]);
              
              userData = clientRes.data || expertRes.data || 
                (apporteurRes.data ? { ...apporteurRes.data, name: `${apporteurRes.data.first_name} ${apporteurRes.data.last_name}` } : null);
            }

            return {
              id: participantId,
              name: userData?.name || 'Utilisateur',
              type: authUser.type === 'client' ? 'expert' : 'client',
              company: userData?.company_name,
              is_active: userData?.is_active !== false,
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

    return res.json({
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
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/messaging/conversations - Créer une conversation
router.post('/conversations', async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    const { 
      type, 
      participant_ids, 
      title, 
      description, 
      assignment_id,
      // Nouvelles colonnes métier
      dossier_id,
      client_id,
      expert_id,
      produit_id,
      access_level = 'private',
      priority = 'medium',
      category = 'general',
      tags = []
    } = req.body;

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
        assignment_id,
        // Nouvelles colonnes métier
        dossier_id,
        client_id,
        expert_id,
        produit_id,
        created_by: authUser.id,
        access_level,
        priority,
        category,
        tags
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

    return res.status(201).json({
      success: true,
      data: conversation
    });

  } catch (error) {
    console.error('❌ Erreur création conversation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ========================================
// ROUTES MESSAGES
// ========================================

// GET /api/messaging/conversations/:id/messages - Messages d'une conversation
router.get('/conversations/:id/messages', async (req, res) => {
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

    return res.json({
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
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/messaging/conversations/:id/messages - Envoyer un message
router.post('/conversations/:id/messages', async (req, res) => {
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

    return res.status(201).json({
      success: true,
      data: message
    });

  } catch (error) {
    console.error('❌ Erreur envoi message:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ========================================
// ROUTES FICHIERS
// ========================================

// GET /api/messaging/files/:id/download - Télécharger un fichier
router.get('/files/:id/download', async (req, res) => {
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
    return res.download(file.file_path, file.original_name);

  } catch (error) {
    console.error('❌ Erreur téléchargement fichier:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ========================================
// ROUTES NOTIFICATIONS
// ========================================

// GET /api/messaging/notifications - Notifications de l'utilisateur
router.get('/notifications', async (req, res) => {
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

    return res.json({
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
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// PUT /api/messaging/notifications/:id/read - Marquer notification comme lue
router.put('/notifications/:id/read', async (req, res) => {
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

    return res.json({
      success: true,
      data: notification
    });

  } catch (error) {
    console.error('❌ Erreur route notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ========================================
// ROUTES DE TEST WEBSOCKET
// ========================================

// GET /api/unified-messaging/ws-test - Test WebSocket
router.get('/ws-test', async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    
    return res.json({
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
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/unified-messaging/status - Statut de l'API
router.get('/status', (req, res) => {
  try {
    return res.json({
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
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ========================================
// ROUTES ADMIN - GESTION UTILISATEURS
// ========================================

// GET /api/unified-messaging/admin/users - Liste des utilisateurs pour admin
router.get('/admin/users', async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
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

    return res.json({
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
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs'
    });
  }
});

// GET /api/unified-messaging/admin/conversations - Récupérer toutes les conversations de l'admin
router.get('/admin/conversations', async (req, res) => {
  try {
    const authUser = req.user as AuthUser;

    if (!authUser || authUser.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    // Récupérer toutes les conversations où l'admin est participant
    const { data: conversations, error } = await supabaseAdmin
      .from('conversations')
      .select(`
        id,
        type,
        participant_ids,
        title,
        description,
        status,
        priority,
        category,
        client_id,
        expert_id,
        apporteur_id,
        created_at,
        updated_at
      `)
      .contains('participant_ids', [authUser.database_id || authUser.id])
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération conversations admin:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des conversations'
      });
    }

    // Enrichir chaque conversation avec le dernier message et le compteur de non-lus
    const enrichedConversations = await Promise.all(
      (conversations || []).map(async (conv) => {
        // Récupérer le dernier message
        const { data: lastMessage } = await supabaseAdmin
          .from('messages')
          .select('content, created_at, is_read, sender_id')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Compter les messages non lus
        const { count: unreadCount } = await supabaseAdmin
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('is_read', false)
          .neq('sender_id', authUser.database_id || authUser.id);

        return {
          ...conv,
          last_message: lastMessage || null,
          unread_count: unreadCount || 0
        };
      })
    );

    return res.json({
      success: true,
      data: enrichedConversations
    });

  } catch (error) {
    console.error('❌ Erreur route GET admin/conversations:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/unified-messaging/contacts - Récupérer les contacts selon le type d'utilisateur
router.get('/contacts', async (req, res) => {
  try {
    const authUser = req.user as AuthUser;

    if (!authUser) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    const userId = authUser.database_id || authUser.id;
    const userType = authUser.type;

    console.log(`📋 Récupération contacts pour ${userType}:`, userId);

    let clients: any[] = [];
    let experts: any[] = [];
    let apporteurs: any[] = [];
    let admins: any[] = [];

    if (userType === 'admin') {
      // Admin voit tout le monde
      const [clientsRes, expertsRes, apporteursRes, adminsRes] = await Promise.all([
        supabaseAdmin.from('Client').select('id, name, email, company_name, is_active, created_at').eq('is_active', true).order('name'),
        supabaseAdmin.from('Expert').select('id, name, email, company_name, is_active, created_at').eq('is_active', true).order('name'),
        supabaseAdmin.from('ApporteurAffaires').select('id, first_name, last_name, email, company_name, is_active, created_at').eq('is_active', true).order('first_name'),
        supabaseAdmin.from('Admin').select('id, name, email, created_at').order('name')
      ]);

      clients = (clientsRes.data || []).map(c => ({ ...c, type: 'client', full_name: c.name || c.company_name }));
      experts = (expertsRes.data || []).map(e => ({ ...e, type: 'expert', full_name: e.name }));
      apporteurs = (apporteursRes.data || []).map(a => ({ ...a, type: 'apporteur', full_name: `${a.first_name} ${a.last_name}` }));
      admins = (adminsRes.data || []).map(a => ({ ...a, type: 'admin', full_name: a.name }));

    } else if (userType === 'client') {
      // Client voit: ses experts + son apporteur + admin
      
      // Récupérer le client
      const { data: client } = await supabaseAdmin
        .from('Client')
        .select('apporteur_id')
        .eq('id', userId)
        .single();

      // Experts assignés via ClientProduitEligible
      const { data: assignments } = await supabaseAdmin
        .from('ClientProduitEligible')
        .select('expert_id, Expert:Expert(id, name, email, company_name, is_active)')
        .eq('clientId', userId)
        .not('expert_id', 'is', null);

      const expertIds = new Set<string>();
      (assignments || []).forEach((a: any) => {
        if (a.Expert && a.Expert.is_active !== false) {
          experts.push({ ...a.Expert, type: 'expert', full_name: a.Expert.name });
          expertIds.add(a.Expert.id);
        }
      });

      // Apporteur
      if (client?.apporteur_id) {
        const { data: apporteur } = await supabaseAdmin
          .from('ApporteurAffaires')
          .select('id, first_name, last_name, email, company_name, is_active')
          .eq('id', client.apporteur_id)
          .eq('is_active', true)
          .single();

        if (apporteur) {
          apporteurs = [{ ...apporteur, type: 'apporteur', full_name: `${apporteur.first_name} ${apporteur.last_name}` }];
        }
      }

      // Admin support
      const { data: adminList } = await supabaseAdmin
        .from('Admin')
        .select('id, name, email')
        .limit(1);

      admins = (adminList || []).map(a => ({ ...a, type: 'admin', full_name: a.name }));

    } else if (userType === 'expert') {
      // Expert voit: ses clients + leurs apporteurs + admin

      // Clients assignés
      const { data: assignments } = await supabaseAdmin
        .from('ClientProduitEligible')
        .select('clientId, Client:Client(id, name, email, company_name, is_active, apporteur_id)')
        .eq('expert_id', userId)
        .not('clientId', 'is', null);

      const clientIds = new Set<string>();
      const apporteurIds = new Set<string>();

      (assignments || []).forEach((a: any) => {
        if (a.Client && a.Client.is_active !== false && !clientIds.has(a.Client.id)) {
          clients.push({ ...a.Client, type: 'client', full_name: a.Client.name || a.Client.company_name });
          clientIds.add(a.Client.id);
          
          // Récupérer l'apporteur de ce client
          if (a.Client.apporteur_id) {
            apporteurIds.add(a.Client.apporteur_id);
          }
        }
      });

      // Apporteurs qui ont amené ces clients
      if (apporteurIds.size > 0) {
        const { data: apporteursList } = await supabaseAdmin
          .from('ApporteurAffaires')
          .select('id, first_name, last_name, email, company_name, is_active')
          .in('id', Array.from(apporteurIds))
          .eq('is_active', true);

        apporteurs = (apporteursList || []).map(a => ({ ...a, type: 'apporteur', full_name: `${a.first_name} ${a.last_name}` }));
      }

      // Admin
      const { data: adminList } = await supabaseAdmin
        .from('Admin')
        .select('id, name, email')
        .limit(1);

      admins = (adminList || []).map(a => ({ ...a, type: 'admin', full_name: a.name }));

    } else if (userType === 'apporteur') {
      // Apporteur voit: ses clients + experts de ses clients + admin

      // Clients de l'apporteur
      const { data: clientsList } = await supabaseAdmin
        .from('Client')
        .select('id, name, email, company_name, is_active')
        .eq('apporteur_id', userId)
        .eq('is_active', true);

      clients = (clientsList || []).map(c => ({ ...c, type: 'client', full_name: c.name || c.company_name }));

      // Experts assignés aux clients de l'apporteur
      const clientIds = clients.map(c => c.id);
      if (clientIds.length > 0) {
        const { data: assignments } = await supabaseAdmin
          .from('ClientProduitEligible')
          .select('expert_id, Expert:Expert(id, name, email, company_name, is_active)')
          .in('clientId', clientIds)
          .not('expert_id', 'is', null);

        const expertIds = new Set<string>();
        (assignments || []).forEach((a: any) => {
          if (a.Expert && a.Expert.is_active !== false && !expertIds.has(a.Expert.id)) {
            experts.push({ ...a.Expert, type: 'expert', full_name: a.Expert.name });
            expertIds.add(a.Expert.id);
          }
        });
      }

      // Admin
      const { data: adminList } = await supabaseAdmin
        .from('Admin')
        .select('id, name, email')
        .limit(1);

      admins = (adminList || []).map(a => ({ ...a, type: 'admin', full_name: a.name }));
    }

    // Trier par dernière activité (créé récemment = actif)
    const sortByActivity = (a: any, b: any) => 
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();

    clients.sort(sortByActivity);
    experts.sort(sortByActivity);
    apporteurs.sort(sortByActivity);

    return res.json({
      success: true,
      data: {
        clients,
        experts,
        apporteurs,
        admins
      }
    });

  } catch (error) {
    console.error('❌ Erreur route contacts:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/unified-messaging/user-status/:userId - Vérifier si utilisateur actif
router.get('/user-status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Chercher dans les 3 tables
    const [clientRes, expertRes, apporteurRes] = await Promise.all([
      supabaseAdmin.from('Client').select('is_active, updated_at').eq('id', userId).maybeSingle(),
      supabaseAdmin.from('Expert').select('is_active, updated_at').eq('id', userId).maybeSingle(),
      supabaseAdmin.from('ApporteurAffaires').select('is_active, updated_at').eq('id', userId).maybeSingle()
    ]);

    const user = clientRes.data || expertRes.data || apporteurRes.data;

    if (!user) {
      return res.json({
        success: true,
        data: { active: false, deactivated_at: null, not_found: true }
      });
    }

    return res.json({
      success: true,
      data: {
        active: user.is_active !== false,
        deactivated_at: user.is_active === false ? user.updated_at : null
      }
    });

  } catch (error) {
    console.error('❌ Erreur user-status:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// DELETE /api/unified-messaging/conversations/:id - Soft delete conversation
router.delete('/conversations/:id', async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    const { id: conversationId } = req.params;

    // Récupérer la conversation
    const { data: conversation, error: fetchError } = await supabaseAdmin
      .from('conversations')
      .select('deleted_for_user_ids')
      .eq('id', conversationId)
      .single();

    if (fetchError || !conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation non trouvée'
      });
    }

    // Ajouter l'utilisateur à la liste des suppressions
    const deletedFor = conversation.deleted_for_user_ids || [];
    if (!deletedFor.includes(authUser.database_id || authUser.id)) {
      deletedFor.push(authUser.database_id || authUser.id);
    }

    const { error: updateError } = await supabaseAdmin
      .from('conversations')
      .update({ deleted_for_user_ids: deletedFor })
      .eq('id', conversationId);

    if (updateError) {
      throw updateError;
    }

    return res.json({
      success: true,
      message: 'Conversation supprimée'
    });

  } catch (error) {
    console.error('❌ Erreur soft delete conversation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// DELETE /api/unified-messaging/conversations/:id/hard - Hard delete (admin only)
router.delete('/conversations/:id/hard', async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    const { id: conversationId } = req.params;

    if (authUser.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les administrateurs peuvent supprimer définitivement'
      });
    }

    // Supprimer les messages d'abord (CASCADE devrait le faire mais on s'assure)
    await supabaseAdmin
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId);

    // Supprimer la conversation
    const { error } = await supabaseAdmin
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      message: 'Conversation supprimée définitivement'
    });

  } catch (error) {
    console.error('❌ Erreur hard delete conversation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET/PUT /api/unified-messaging/preferences - Préférences UI messagerie
router.get('/preferences', async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    const userId = authUser.database_id || authUser.id;

    const { data, error } = await supabaseAdmin
      .from('UserMessagingPreferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return res.json({
      success: true,
      data: data || { user_id: userId, collapsed_groups: {} }
    });

  } catch (error) {
    console.error('❌ Erreur get preferences:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.put('/preferences', async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    const userId = authUser.database_id || authUser.id;
    const { collapsed_groups } = req.body;

    const { error } = await supabaseAdmin
      .from('UserMessagingPreferences')
      .upsert({
        user_id: userId,
        collapsed_groups,
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      message: 'Préférences sauvegardées'
    });

  } catch (error) {
    console.error('❌ Erreur update preferences:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/unified-messaging/admin/conversations - Créer conversation admin
router.post('/admin/conversations', async (req, res) => {
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

    return res.status(201).json({
      success: true,
      data: conversation
    });

  } catch (error) {
    console.error('❌ Erreur création conversation admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default router; 