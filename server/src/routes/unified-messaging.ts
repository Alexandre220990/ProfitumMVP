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
      .or(`participant_ids.cs.{${authUser.database_id || authUser.id}}`);

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
  console.error('🚨🚨🚨 ========================================');
  console.error('🚨 POST /conversations - DÉBUT');
  console.error('🚨🚨🚨 ========================================');
  console.error('📋 Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const authUser = req.user as AuthUser;
    
    console.error('👤 Auth User:', JSON.stringify({
      id: authUser.id,
      database_id: authUser.database_id,
      auth_user_id: authUser.auth_user_id,
      type: authUser.type,
      email: authUser.email
    }, null, 2));
    
    // Support pour les deux formats : {participant_id, participant_type} OU {participant_ids, type}
    let finalParticipantIds: string[];
    let conversationType: string;
    let conversationTitle: string | undefined;
    
    if (req.body.participant_id && req.body.participant_type) {
      // Format simplifié depuis le frontend
      const currentUserId = authUser.database_id || authUser.auth_user_id || authUser.id;
      finalParticipantIds = [currentUserId, req.body.participant_id];
      conversationType = authUser.type === 'admin' ? 'admin_support' : 'expert_client';
      
      // Récupérer le nom du contact pour le titre
      let contactName = 'Utilisateur';
      if (req.body.participant_type === 'client') {
        const { data: client } = await supabaseAdmin
          .from('Client')
          .select('first_name, last_name, company_name')
          .eq('id', req.body.participant_id)
          .single();
        contactName = client?.company_name || `${client?.first_name || ''} ${client?.last_name || ''}`.trim() || 'Client';
      } else if (req.body.participant_type === 'expert') {
        const { data: expert } = await supabaseAdmin
          .from('Expert')
          .select('first_name, last_name, company_name')
          .eq('id', req.body.participant_id)
          .single();
        contactName = `${expert?.first_name || ''} ${expert?.last_name || ''}`.trim() || expert?.company_name || 'Expert';
      } else if (req.body.participant_type === 'apporteur') {
        const { data: apporteur } = await supabaseAdmin
          .from('ApporteurAffaires')
          .select('first_name, last_name, company_name')
          .eq('id', req.body.participant_id)
          .single();
        contactName = `${apporteur?.first_name || ''} ${apporteur?.last_name || ''}`.trim() || apporteur?.company_name || 'Apporteur';
      }
      
      conversationTitle = `Conversation avec ${contactName}`;
    } else {
      // Format complet legacy
      const { 
        type, 
        participant_ids, 
        title, 
        description, 
        assignment_id,
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

      const currentUserId = authUser.database_id || authUser.auth_user_id || authUser.id;
      // Vérifier que l'utilisateur fait partie des participants
      if (!participant_ids.includes(currentUserId)) {
        return res.status(403).json({
          success: false,
          message: 'Vous devez faire partie des participants'
        });
      }
      
      finalParticipantIds = participant_ids;
      conversationType = type;
      conversationTitle = title;
    }

    const currentUserId = authUser.database_id || authUser.auth_user_id || authUser.id;
    
    console.error('🆔 Current User ID:', currentUserId);
    console.error('📝 Conversation Type:', conversationType);
    console.error('👥 Final Participant IDs:', finalParticipantIds);
    
    const insertData: any = {
      type: conversationType,
      participant_ids: finalParticipantIds,
      title: conversationTitle,
      status: 'active',
      created_by: currentUserId
    };
    
    // Ajouter les champs optionnels si présents (format legacy)
    if (req.body.description) insertData.description = req.body.description;
    if (req.body.assignment_id) insertData.assignment_id = req.body.assignment_id;
    if (req.body.dossier_id) insertData.dossier_id = req.body.dossier_id;
    if (req.body.client_id) insertData.client_id = req.body.client_id;
    if (req.body.expert_id) insertData.expert_id = req.body.expert_id;
    if (req.body.produit_id) insertData.produit_id = req.body.produit_id;
    if (req.body.access_level) insertData.access_level = req.body.access_level;
    if (req.body.priority) insertData.priority = req.body.priority;
    if (req.body.category) insertData.category = req.body.category;
    if (req.body.tags) insertData.tags = req.body.tags;
    
    console.error('💾 Insert Data COMPLET:', JSON.stringify(insertData, null, 2));
    
    // 🧪 TEST: Vérifier que supabaseAdmin fonctionne avec un SELECT simple
    console.error('🧪 Test SELECT sur conversations...');
    const { data: testData, error: testError } = await supabaseAdmin
      .from('conversations')
      .select('id, title')
      .limit(1);
    console.error('📊 Test SELECT result:', { 
      hasData: !!testData, 
      count: testData?.length,
      error: testError 
    });
    
    console.error('⏳ Appel Supabase INSERT...');
    
    // 🧪 TEST DIRECT SQL: Contourner l'API REST Supabase
    console.error('🧪 Test INSERT via SQL direct (RPC)...');
    
    try {
      // Utiliser une fonction SQL pour insérer directement
      const { data: sqlResult, error: sqlError } = await supabaseAdmin.rpc('create_conversation_direct', {
        p_type: insertData.type,
        p_participant_ids: insertData.participant_ids,
        p_title: insertData.title,
        p_status: 'active',
        p_created_by: insertData.created_by
      });
      
      console.error('📊 SQL RPC result:', {
        hasData: !!sqlResult,
        data: sqlResult,
        error: sqlError
      });
    } catch (rpcError) {
      console.error('⚠️ RPC non disponible (normal), on continue avec INSERT standard');
    }
    
    // ========================================
    // STRATÉGIE ROBUSTE : INSERT + SELECT SÉPARÉ
    // ========================================
    console.error('🧪 Test INSERT avec SELECT séparé pour contourner RLS...');
    
    const cleanInsertData: any = {
      type: insertData.type,
      participant_ids: insertData.participant_ids,
      title: insertData.title,
      status: insertData.status || 'active',
      created_by: insertData.created_by
    };
    
    // Ajouter colonnes optionnelles SAUF tags
    if (insertData.access_level) cleanInsertData.access_level = insertData.access_level;
    if (insertData.priority) cleanInsertData.priority = insertData.priority;
    if (insertData.category) cleanInsertData.category = insertData.category;
    if (insertData.dossier_id) cleanInsertData.dossier_id = insertData.dossier_id;
    if (insertData.client_id) cleanInsertData.client_id = insertData.client_id;
    if (insertData.expert_id) cleanInsertData.expert_id = insertData.expert_id;
    if (insertData.apporteur_id) cleanInsertData.apporteur_id = insertData.apporteur_id;
    
    console.error('📋 Clean Insert Data:', JSON.stringify(cleanInsertData, null, 2));
    
    // ÉTAPE 1 : INSERT SANS .select() pour éviter le problème RLS
    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from('conversations')
      .insert(cleanInsertData)
      .select('id')  // Retourner uniquement l'ID pour minimiser risques RLS
      .single();

    console.error('📦 INSERT Response:', JSON.stringify({
      hasData: !!insertedData,
      data: insertedData,
      hasError: !!insertError,
      error: insertError
    }, null, 2));

    if (insertError) {
      console.error('❌❌❌ ERREUR INSERT SUPABASE:', JSON.stringify(insertError, null, 2));
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la conversation',
        error: insertError.message
      });
    }
    
    if (!insertedData || !insertedData.id) {
      console.error('⚠️⚠️⚠️ INSERT RETOURNÉ NULL !');
      console.error('🔍 Possible : RLS bloque .select(), contrainte UNIQUE, ou trigger');
      
      // FALLBACK : Chercher la conversation dans la DB directement
      console.error('🔄 Tentative de récupération via SELECT direct...');
      const { data: foundConv, error: selectError } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .eq('created_by', cleanInsertData.created_by)
        .eq('type', cleanInsertData.type)
        .contains('participant_ids', cleanInsertData.participant_ids)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (selectError || !foundConv) {
        console.error('❌ SELECT fallback échoué:', selectError);
        return res.status(500).json({
          success: false,
          message: 'Conversation créée mais impossible à récupérer (RLS ou erreur DB)'
        });
      }
      
      console.error('✅ Conversation récupérée via SELECT fallback:', foundConv.id);
      return res.status(201).json({
        success: true,
        data: foundConv
      });
    }

    // ÉTAPE 2 : SELECT complet séparé avec l'ID
    console.error('📥 Récupération conversation complète avec ID:', insertedData.id);
    const { data: fullConversation, error: selectError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', insertedData.id)
      .single();
    
    console.error('📦 SELECT complet Response:', JSON.stringify({
      hasData: !!fullConversation,
      data: fullConversation,
      hasError: !!selectError,
      error: selectError
    }, null, 2));

    if (selectError || !fullConversation) {
      console.error('❌ SELECT complet échoué:', selectError);
      // Retourner au moins l'ID si on l'a
      return res.status(201).json({
        success: true,
        data: {
          id: insertedData.id,
          ...cleanInsertData
        }
      });
    }

    console.error('✅✅✅ CONVERSATION CRÉÉE AVEC SUCCÈS:', fullConversation.id);
    return res.status(201).json({
      success: true,
      data: fullConversation
    });

  } catch (error) {
    console.error('💥💥💥 EXCEPTION CATCH:', error);
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('💥 Error message:', error instanceof Error ? error.message : JSON.stringify(error));
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
    const userId = authUser.database_id || authUser.auth_user_id || authUser.id;
    
    console.error('🔍 GET Messages - Début vérification:', { 
      conversationId,
      userId,
      authUser: {
        database_id: authUser.database_id,
        id: authUser.id,
        type: authUser.type
      }
    });
    
    // ✅ FIX : .single() retourne un ARRAY, pas un objet !
    const { data: conversationArray, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    console.error('📦 Supabase SELECT result:', {
      hasData: !!conversationArray,
      isArray: Array.isArray(conversationArray),
      error: convError
    });

    if (convError || !conversationArray) {
      console.error('❌ Conversation non trouvée:', { conversationId, error: convError });
      return res.status(404).json({
        success: false,
        message: 'Conversation non trouvée'
      });
    }

    // ✅ FIX CRITIQUE : Accéder à l'index [0] car .single() retourne un array
    const conversation = Array.isArray(conversationArray) ? conversationArray[0] : conversationArray;
    
    console.error('🔍 Conversation (après extraction):', {
      id: conversation?.id,
      participant_ids: conversation?.participant_ids,
      is_array: Array.isArray(conversation?.participant_ids)
    });

    if (!conversation) {
      console.error('❌ Conversation vide après extraction');
      return res.status(404).json({
        success: false,
        message: 'Conversation non trouvée'
      });
    }
    
    // ✅ EXTRACTION participant_ids
    const participantIds = Array.isArray(conversation.participant_ids) 
      ? conversation.participant_ids 
      : [];
    
    console.error('✅ participantIds final:', participantIds);
    
    if (participantIds.length === 0) {
      console.error('🚨 Conversation sans participants !');
      return res.status(500).json({
        success: false,
        message: 'Conversation corrompue (aucun participant)'
      });
    }
    
    if (!participantIds.includes(userId)) {
      console.error('❌ Utilisateur non autorisé:', { userId, participantIds });
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }
    
    console.error('✅ Autorisé, chargement messages...');

    // Récupérer les messages
    // ✅ FIX : Retirer la jointure message_files qui cause une erreur de relation
    const { data: messages, error, count } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);
    
    console.error('📨 Messages récupérés:', {
      count: messages?.length || 0,
      hasError: !!error,
      error
    });

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
    const userId = authUser.database_id || authUser.auth_user_id || authUser.id;
    
    console.error('🔍 POST Message - Début:', { conversationId, userId });
    
    const { data: conversationArray, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    console.error('📦 Conversation SELECT (POST):', {
      hasData: !!conversationArray,
      isArray: Array.isArray(conversationArray),
      error: convError
    });

    if (convError || !conversationArray) {
      console.error('❌ Conversation non trouvée (POST):', { conversationId, error: convError });
      return res.status(404).json({
        success: false,
        message: 'Conversation non trouvée'
      });
    }

    // ✅ FIX CRITIQUE : .single() retourne un array, accéder à [0]
    const conversation = Array.isArray(conversationArray) ? conversationArray[0] : conversationArray;
    
    console.error('🔍 Conversation (POST après extraction):', {
      id: conversation?.id,
      participant_ids: conversation?.participant_ids
    });

    if (!conversation) {
      console.error('❌ Conversation vide après extraction (POST)');
      return res.status(404).json({
        success: false,
        message: 'Conversation non trouvée'
      });
    }
    
    const participantIds = Array.isArray(conversation.participant_ids) 
      ? conversation.participant_ids 
      : [];
    
    console.error('✅ participantIds final (POST):', participantIds);
    
    if (participantIds.length === 0) {
      console.error('🚨 Conversation sans participants (POST)');
      return res.status(500).json({
        success: false,
        message: 'Conversation corrompue'
      });
    }
    
    if (!participantIds.includes(userId)) {
      console.error('❌ Non autorisé (POST):', { userId, participantIds });
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }
    
    console.error('✅ Autorisé pour POST message');

    // Créer le message
    const senderId = userId;
    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
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
    if (!conversation.participant_ids.includes(authUser.database_id || authUser.id)) {
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
    // ET FILTRER uniquement les conversations avec au moins 1 message
    const adminId = authUser.database_id || authUser.auth_user_id || authUser.id;
    
    const enrichedConversations = await Promise.all(
      (conversations || []).map(async (conv) => {
        // Récupérer le dernier message
        const { data: lastMessages } = await supabaseAdmin
          .from('messages')
          .select('content, created_at, is_read, sender_id')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        const lastMessage = lastMessages && lastMessages.length > 0 ? lastMessages[0] : null;

        // Compter les messages non lus
        const { count: unreadCount } = await supabaseAdmin
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('is_read', false)
          .neq('sender_id', adminId);

        // Enrichir avec les informations de l'autre participant
        let otherParticipant: any = null;
        const otherParticipantId = conv.participant_ids?.find((id: string) => id !== adminId);
        
        if (otherParticipantId) {
          // Essayer de trouver dans Client
          if (conv.client_id) {
            const { data: client } = await supabaseAdmin
              .from('Client')
              .select('id, first_name, last_name, company_name, email')
              .eq('id', conv.client_id)
              .single();
            
            if (client) {
              otherParticipant = {
                id: client.id,
                name: client.company_name || `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email,
                type: 'client',
                email: client.email
              };
            }
          }
          
          // Essayer Expert
          if (!otherParticipant && conv.expert_id) {
            const { data: expert } = await supabaseAdmin
              .from('Expert')
              .select('id, first_name, last_name, company_name, email')
              .eq('id', conv.expert_id)
              .single();
            
            if (expert) {
              otherParticipant = {
                id: expert.id,
                name: `${expert.first_name || ''} ${expert.last_name || ''}`.trim() || expert.company_name || expert.email,
                type: 'expert',
                email: expert.email
              };
            }
          }
          
          // Fallback: chercher dans toutes les tables si pas trouvé
          if (!otherParticipant) {
            const [clientRes, expertRes, apporteurRes] = await Promise.all([
              supabaseAdmin.from('Client').select('id, first_name, last_name, company_name, email').eq('id', otherParticipantId).single(),
              supabaseAdmin.from('Expert').select('id, first_name, last_name, company_name, email').eq('id', otherParticipantId).single(),
              supabaseAdmin.from('ApporteurAffaires').select('id, first_name, last_name, company_name, email').eq('id', otherParticipantId).single()
            ]);
            
            if (clientRes.data) {
              otherParticipant = {
                id: clientRes.data.id,
                name: clientRes.data.company_name || `${clientRes.data.first_name || ''} ${clientRes.data.last_name || ''}`.trim() || clientRes.data.email,
                type: 'client',
                email: clientRes.data.email
              };
            } else if (expertRes.data) {
              otherParticipant = {
                id: expertRes.data.id,
                name: `${expertRes.data.first_name || ''} ${expertRes.data.last_name || ''}`.trim() || expertRes.data.company_name || expertRes.data.email,
                type: 'expert',
                email: expertRes.data.email
              };
            } else if (apporteurRes.data) {
              otherParticipant = {
                id: apporteurRes.data.id,
                name: `${apporteurRes.data.first_name || ''} ${apporteurRes.data.last_name || ''}`.trim() || apporteurRes.data.company_name || apporteurRes.data.email,
                type: 'apporteur',
                email: apporteurRes.data.email
              };
            }
          }
        }

        return {
          ...conv,
          last_message: lastMessage || null,
          unread_count: unreadCount || 0,
          has_messages: lastMessage !== null,
          otherParticipant
        };
      })
    );

    // Filtrer uniquement les conversations avec au moins 1 message
    const conversationsWithMessages = enrichedConversations.filter(conv => conv.has_messages);

    return res.json({
      success: true,
      data: conversationsWithMessages
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
        supabaseAdmin.from('Client').select('id, first_name, last_name, email, company_name, is_active, created_at').eq('is_active', true).order('company_name'),
        supabaseAdmin.from('Expert').select('id, first_name, last_name, email, company_name, is_active, created_at').eq('is_active', true).order('last_name'),
        supabaseAdmin.from('ApporteurAffaires').select('id, first_name, last_name, email, company_name, is_active, created_at').eq('is_active', true).order('last_name'),
        supabaseAdmin.from('Admin').select('id, first_name, last_name, email, created_at').order('last_name')
      ]);

      clients = (clientsRes.data || []).map(c => ({ 
        ...c, 
        type: 'client', 
        full_name: c.company_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email 
      }));
      experts = (expertsRes.data || []).map(e => ({ 
        ...e, 
        type: 'expert', 
        full_name: `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.company_name || e.email 
      }));
      apporteurs = (apporteursRes.data || []).map(a => ({ 
        ...a, 
        type: 'apporteur', 
        full_name: `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.company_name || a.email 
      }));
      admins = (adminsRes.data || []).map(a => ({ 
        ...a, 
        type: 'admin', 
        full_name: `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.email 
      }));

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
        .select('expert_id, Expert:Expert(id, first_name, last_name, email, company_name, is_active)')
        .eq('clientId', userId)
        .not('expert_id', 'is', null);

      const expertIds = new Set<string>();
      (assignments || []).forEach((a: any) => {
        if (a.Expert && a.Expert.is_active !== false) {
          experts.push({ 
            ...a.Expert, 
            type: 'expert', 
            full_name: `${a.Expert.first_name || ''} ${a.Expert.last_name || ''}`.trim() || a.Expert.company_name || a.Expert.email 
          });
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
          apporteurs = [{ 
            ...apporteur, 
            type: 'apporteur', 
            full_name: `${apporteur.first_name || ''} ${apporteur.last_name || ''}`.trim() || apporteur.company_name || apporteur.email 
          }];
        }
      }

      // Admin support
      const { data: adminList } = await supabaseAdmin
        .from('Admin')
        .select('id, first_name, last_name, email')
        .limit(1);

      admins = (adminList || []).map(a => ({ 
        ...a, 
        type: 'admin', 
        full_name: `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.email 
      }));

    } else if (userType === 'expert') {
      // Expert voit: ses clients + leurs apporteurs + admin

      // Clients assignés
      const { data: assignments } = await supabaseAdmin
        .from('ClientProduitEligible')
        .select('clientId, Client:clientId(id, first_name, last_name, email, company_name, is_active, apporteur_id)')
        .eq('expert_id', userId)
        .not('clientId', 'is', null);

      const clientIds = new Set<string>();
      const apporteurIds = new Set<string>();

      (assignments || []).forEach((a: any) => {
        if (a.Client && a.Client.is_active !== false && !clientIds.has(a.Client.id)) {
          clients.push({ 
            ...a.Client, 
            type: 'client', 
            full_name: a.Client.company_name || `${a.Client.first_name || ''} ${a.Client.last_name || ''}`.trim() || a.Client.email 
          });
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

        apporteurs = (apporteursList || []).map(a => ({ 
          ...a, 
          type: 'apporteur', 
          full_name: `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.company_name || a.email 
        }));
      }

      // Admin
      const { data: adminList } = await supabaseAdmin
        .from('Admin')
        .select('id, first_name, last_name, email')
        .limit(1);

      admins = (adminList || []).map(a => ({ 
        ...a, 
        type: 'admin', 
        full_name: `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.email 
      }));

    } else if (userType === 'apporteur') {
      // Apporteur voit: ses clients + admin

      // Clients de l'apporteur
      const { data: clientsList } = await supabaseAdmin
        .from('Client')
        .select('id, first_name, last_name, email, company_name, is_active')
        .eq('apporteur_id', userId)
        .eq('is_active', true);

      clients = (clientsList || []).map(c => ({ 
        ...c, 
        type: 'client', 
        full_name: c.company_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email 
      }));

      // Admin
      const { data: adminList } = await supabaseAdmin
        .from('Admin')
        .select('id, first_name, last_name, email')
        .limit(1);

      admins = (adminList || []).map(a => ({ 
        ...a, 
        type: 'admin', 
        full_name: `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.email 
      }));
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
    const adminId = authUser.database_id || authUser.auth_user_id || authUser.id;
    const allParticipants = [adminId, ...participant_ids];

    // Créer la conversation
    const { data: conversation, error } = await supabaseAdmin
      .from('conversations')
      .insert({
        type: 'admin_support',
        participant_ids: allParticipants,
        title: title || 'Support Administratif',
        description: description || 'Conversation de support avec l\'administrateur',
        status: 'active',
        created_by: adminId
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

// ========================================
// NOUVELLES ROUTES POUR REFACTOR SÉCURISÉ
// ========================================
// Ajoutées le 24/10/2025 pour éliminer accès directs Supabase frontend
// Toutes les requêtes passent maintenant par l'API backend

// GET /api/unified-messaging/conversations/check - Vérifier si conversation existe
router.get('/conversations/check', async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    const { participant1, participant2, type } = req.query;

    if (!participant1 || !participant2) {
      return res.status(400).json({
        success: false,
        message: 'participant1 et participant2 requis'
      });
    }

    console.log(`🔍 Vérification conversation existante: ${participant1} ↔ ${participant2} (type: ${type})`);

    // Chercher conversation existante
    let query = supabaseAdmin
      .from('conversations')
      .select('*')
      .contains('participant_ids', [participant1, participant2]);

    if (type) {
      query = query.eq('type', String(type));
    }

    const { data, error } = await query.maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Erreur vérification conversation:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification'
      });
    }

    return res.json({
      success: true,
      data: data || null
    });

  } catch (error) {
    console.error('❌ Erreur route check conversation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/unified-messaging/conversations/admin-support - Créer/récupérer conversation admin support
router.post('/conversations/admin-support', async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    const userId = authUser.database_id || authUser.id;
    const userType = authUser.type;

    console.log(`🛠️ Conversation admin support pour ${userType}:`, userId);

    // Vérifier si conversation admin existe déjà
    const { data: existing } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .contains('participant_ids', [userId])
      .eq('type', 'admin_support')
      .maybeSingle();

    if (existing) {
      console.log('✅ Conversation admin support existante trouvée');
      return res.json({
        success: true,
        data: existing
      });
    }

    // Récupérer premier admin disponible
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('Admin')
      .select('id, email')
      .limit(1)
      .single();

    if (adminError || !adminData) {
      console.error('❌ Aucun admin trouvé');
      return res.status(404).json({
        success: false,
        message: 'Aucun administrateur disponible'
      });
    }

    // Créer nouvelle conversation admin support
    const conversationData: any = {
      type: 'admin_support',
      participant_ids: [userId, adminData.id],
      title: `Support Administratif - ${authUser.email}`,
      description: 'Conversation de support avec l\'équipe administrative',
      status: 'active',
      priority: 'medium',
      category: 'support',
      created_by: userId
    };

    // Ajouter colonnes métier selon type utilisateur
    if (userType === 'client') conversationData.client_id = userId;
    if (userType === 'expert') conversationData.expert_id = userId;
    if (userType === 'apporteur') conversationData.apporteur_id = userId;

    const { data: newConv, error: createError } = await supabaseAdmin
      .from('conversations')
      .insert(conversationData)
      .select()
      .single();

    if (createError) {
      console.error('❌ Erreur création conversation admin:', createError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la conversation'
      });
    }

    console.log('✅ Conversation admin support créée:', newConv.id);

    // Envoyer message de bienvenue automatique
    try {
      await supabaseAdmin
        .from('messages')
        .insert({
          conversation_id: newConv.id,
          sender_id: adminData.id,
          sender_type: 'admin',
          sender_name: 'Support Profitum',
          content: 'Bonjour ! Je suis l\'équipe de support administratif. Comment puis-je vous aider aujourd\'hui ?',
          message_type: 'text',
          is_read: false
        });
    } catch (msgError) {
      console.warn('⚠️ Erreur envoi message bienvenue:', msgError);
    }

    return res.status(201).json({
      success: true,
      data: newConv
    });

  } catch (error) {
    console.error('❌ Erreur route admin-support:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// PUT /api/unified-messaging/messages/:id/read - Marquer message comme lu
router.put('/messages/:id/read', async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    const { id } = req.params;
    const userId = authUser.database_id || authUser.id;

    console.log(`📖 Marquage message ${id} comme lu par ${userId}`);

    // Mettre à jour le message
    const { data, error } = await supabaseAdmin
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur marquage message lu:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du marquage'
      });
    }

    return res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('❌ Erreur route mark message read:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// PUT /api/unified-messaging/conversations/:id/read - Marquer tous messages conversation comme lus
router.put('/conversations/:id/read', async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    const { id } = req.params;
    const userId = authUser.database_id || authUser.id;

    console.log(`📖 Marquage conversation ${id} comme lue par ${userId}`);

    // Vérifier que l'utilisateur est participant
    const { data: conv } = await supabaseAdmin
      .from('conversations')
      .select('participant_ids')
      .eq('id', id)
      .single();

    if (!conv || !conv.participant_ids.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    // Marquer tous les messages de cette conversation comme lus (sauf ceux de l'utilisateur)
    const { data, error } = await supabaseAdmin
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('conversation_id', id)
      .neq('sender_id', userId)
      .select();

    if (error) {
      console.error('❌ Erreur marquage conversation lue:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du marquage'
      });
    }

    console.log(`✅ ${data?.length || 0} messages marqués comme lus`);

    return res.json({
      success: true,
      data: {
        messages_marked: data?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ Erreur route mark conversation read:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/unified-messaging/conversations/ids - Liste IDs conversations user (pour filtres Realtime)
router.get('/conversations/ids', async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    const userId = authUser.database_id || authUser.id;

    console.log(`🔢 Récupération IDs conversations pour ${userId}`);

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .contains('participant_ids', [userId]);

    if (error) {
      console.error('❌ Erreur récupération IDs conversations:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération'
      });
    }

    const ids = (data || []).map(conv => conv.id);
    console.log(`✅ ${ids.length} conversation IDs récupérés`);

    return res.json({
      success: true,
      data: {
        ids,
        count: ids.length
      }
    });

  } catch (error) {
    console.error('❌ Erreur route conversation ids:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/unified-messaging/user-info/:id - Récupérer infos utilisateur
router.get('/user-info/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    console.log(`👤 Récupération infos utilisateur ${id} (type: ${type})`);

    let userData = null;

    // Chercher dans la table appropriée selon le type
    if (type === 'client' || !type) {
      const { data } = await supabaseAdmin
        .from('Client')
        .select('id, first_name, last_name, email, company_name, is_active')
        .eq('id', id)
        .single();
      
      if (data) {
        userData = {
          id: data.id,
          name: data.company_name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.email,
          full_name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
          email: data.email,
          company_name: data.company_name,
          type: 'client',
          is_active: data.is_active
        };
      }
    }

    if (!userData && (type === 'expert' || !type)) {
      const { data } = await supabaseAdmin
        .from('Expert')
        .select('id, first_name, last_name, email, company_name, is_active')
        .eq('id', id)
        .single();
      
      if (data) {
        userData = {
          id: data.id,
          name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.company_name || data.email,
          full_name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
          email: data.email,
          company_name: data.company_name,
          type: 'expert',
          is_active: data.is_active
        };
      }
    }

    if (!userData && (type === 'apporteur' || !type)) {
      const { data } = await supabaseAdmin
        .from('ApporteurAffaires')
        .select('id, first_name, last_name, email, company_name, is_active')
        .eq('id', id)
        .single();
      
      if (data) {
        userData = {
          id: data.id,
          name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.company_name || data.email,
          full_name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
          email: data.email,
          company_name: data.company_name,
          type: 'apporteur',
          is_active: data.is_active
        };
      }
    }

    if (!userData && (type === 'admin' || !type)) {
      const { data } = await supabaseAdmin
        .from('Admin')
        .select('id, email')
        .eq('id', id)
        .single();
      
      if (data) {
        userData = {
          id: data.id,
          name: data.email.split('@')[0],
          full_name: data.email.split('@')[0],
          email: data.email,
          type: 'admin',
          is_active: true
        };
      }
    }

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    return res.json({
      success: true,
      data: userData
    });

  } catch (error) {
    console.error('❌ Erreur route user-info:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/unified-messaging/typing - Envoyer indicateur de frappe
router.post('/typing', async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    const userId = authUser.database_id || authUser.id;
    const { conversation_id, is_typing } = req.body;

    if (!conversation_id) {
      return res.status(400).json({
        success: false,
        message: 'conversation_id requis'
      });
    }

    console.log(`⌨️ Indicateur frappe: ${userId} ${is_typing ? 'tape' : 'arrête'} dans ${conversation_id}`);

    if (is_typing) {
      // Créer/mettre à jour indicateur
      const { error } = await supabaseAdmin
        .from('typing_indicators')
        .upsert({
          conversation_id,
          user_id: userId,
          user_type: authUser.type,
          is_typing: true,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Erreur création indicateur:', error);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la mise à jour'
        });
      }
    } else {
      // Supprimer indicateur
      const { error } = await supabaseAdmin
        .from('typing_indicators')
        .delete()
        .eq('conversation_id', conversation_id)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Erreur suppression indicateur:', error);
      }
    }

    return res.json({
      success: true
    });

  } catch (error) {
    console.error('❌ Erreur route typing:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/unified-messaging/conversations/:id/report - Signaler conversation
router.post('/conversations/:id/report', async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    const userId = authUser.database_id || authUser.id;
    const { id } = req.params;
    const { reason, description } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'reason requis'
      });
    }

    console.log(`🚨 Signalement conversation ${id} par ${userId}: ${reason}`);

    const { data, error } = await supabaseAdmin
      .from('conversation_reports')
      .insert({
        conversation_id: id,
        reporter_id: userId,
        reporter_type: authUser.type,
        reason,
        description: description || '',
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur signalement:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du signalement'
      });
    }

    return res.status(201).json({
      success: true,
      data
    });

  } catch (error) {
    console.error('❌ Erreur route report:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/unified-messaging/conversations/:id/unread-count - Compteur messages non lus
router.get('/conversations/:id/unread-count', async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    const userId = authUser.database_id || authUser.id;
    const { id } = req.params;

    console.log(`🔢 Comptage messages non lus conversation ${id} pour ${userId}`);

    const { count, error } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', id)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('❌ Erreur comptage:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du comptage'
      });
    }

    return res.json({
      success: true,
      data: {
        unread_count: count || 0
      }
    });

  } catch (error) {
    console.error('❌ Erreur route unread-count:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/unified-messaging/expert-conversations/:clientId - Conversations experts validés
router.get('/expert-conversations/:clientId', async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    const { clientId } = req.params;

    console.log(`👨‍💼 Récupération conversations experts pour client ${clientId}`);

    // Récupérer assignations experts validées
    const { data: assignments, error: assignError } = await supabaseAdmin
      .from('expertassignment')
      .select(`
        *,
        Expert:Expert!expertassignment_expert_id_fkey(id, first_name, last_name, email, company_name),
        ClientProduitEligible:ClientProduitEligible!expertassignment_client_produit_id_fkey(id, produitId)
      `)
      .eq('client_id', clientId)
      .eq('status', 'validated');

    if (assignError) {
      console.error('❌ Erreur récupération assignations:', assignError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération'
      });
    }

    // Pour chaque assignation, vérifier si conversation existe
    const conversations = [];
    for (const assignment of assignments || []) {
      const { data: conv } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .contains('participant_ids', [clientId, assignment.expert_id])
        .eq('type', 'expert_client')
        .maybeSingle();

      if (conv) {
        conversations.push(conv);
      }
    }

    return res.json({
      success: true,
      data: {
        conversations,
        assignments_count: assignments?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ Erreur route expert-conversations:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/unified-messaging/upload - Upload fichier messagerie
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    const userId = authUser.database_id || authUser.id;
    const { conversation_id } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    if (!conversation_id) {
      return res.status(400).json({
        success: false,
        message: 'conversation_id requis'
      });
    }

    console.log(`📎 Upload fichier ${file.originalname} pour conversation ${conversation_id}`);

    // Vérifier que l'utilisateur est participant de la conversation
    const { data: conv } = await supabaseAdmin
      .from('conversations')
      .select('participant_ids')
      .eq('id', conversation_id)
      .single();

    if (!conv || !conv.participant_ids.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    // Upload vers Supabase Storage bucket 'messaging-files'
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = `${conversation_id}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('messaging-files')
      .upload(filePath, file.buffer || fs.readFileSync(file.path), {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Erreur upload Supabase Storage:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'upload'
      });
    }

    // Récupérer URL publique
    const { data: urlData } = supabaseAdmin.storage
      .from('messaging-files')
      .getPublicUrl(filePath);

    // Nettoyer fichier temporaire local
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    const attachment = {
      id: uploadData.path,
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
      url: urlData.publicUrl,
      uploaded_at: new Date().toISOString()
    };

    console.log('✅ Fichier uploadé:', attachment.name);

    return res.json({
      success: true,
      data: attachment
    });

  } catch (error) {
    console.error('❌ Erreur route upload:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/unified-messaging/conversations/:id/unread - Alias pour unread-count
router.get('/conversations/:id/unread', async (req, res) => {
  try {
    const authUser = req.user as AuthUser;
    const userId = authUser.database_id || authUser.id;
    const { id } = req.params;

    // Même logique que unread-count
    const { count, error } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', id)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du comptage'
      });
    }

    return res.json({
      success: true,
      data: {
        unread_count: count || 0
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default router; 