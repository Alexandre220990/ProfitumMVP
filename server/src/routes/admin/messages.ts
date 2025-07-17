import express from 'express';
import { supabaseAdmin } from '../../config/supabase';

const router = express.Router();

// Envoyer un message à l'admin
router.post('/', async (req, res) => {
  try {
    const { content, sender_id, sender_type, conversation_id } = req.body;

    if (!content || !sender_id || !sender_type) {
      return res.status(400).json({
        success: false,
        message: 'Contenu, sender_id et sender_type requis'
      });
    }

    // Insérer le message dans la base de données
    const { data: message, error } = await supabaseAdmin
      .from('admin_messages')
      .insert({
        content,
        sender_id,
        sender_type,
        conversation_id: conversation_id || 'admin-support',
        timestamp: new Date().toISOString(),
        is_read: false
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur insertion message admin:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi du message'
      });
    }

    res.json({
      success: true,
      data: {
        message
      }
    });

  } catch (error) {
    console.error('❌ Erreur route messages admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Récupérer les messages d'une conversation admin
router.get('/conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    const { data: messages, error } = await supabaseAdmin
      .from('admin_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('❌ Erreur récupération messages admin:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des messages'
      });
    }

    res.json({
      success: true,
      data: {
        messages: messages || []
      }
    });

  } catch (error) {
    console.error('❌ Erreur route messages admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Marquer un message comme lu
router.put('/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;

    const { error } = await supabaseAdmin
      .from('admin_messages')
      .update({ is_read: true })
      .eq('id', messageId);

    if (error) {
      console.error('❌ Erreur marquage message lu:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du marquage du message'
      });
    }

    res.json({
      success: true,
      message: 'Message marqué comme lu'
    });

  } catch (error) {
    console.error('❌ Erreur route messages admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default router; 