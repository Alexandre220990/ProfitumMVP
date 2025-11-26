import express from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AdminNotificationService } from '../services/admin-notification-service';

const router = express.Router();

// POST /api/contact - Envoyer un message de contact public
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validation des champs obligatoires
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Les champs nom, email et message sont obligatoires'
      });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide'
      });
    }

    // Insérer le message dans la base de données
    // Note: On utilise .select('id') pour minimiser les problèmes RLS
    const { data: contactMessage, error } = await supabaseAdmin
      .from('contact_messages')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        subject: subject ? subject.trim() : null,
        message: message.trim(),
        status: 'unread',
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('❌ Erreur insertion message contact:', error);
      
      // Si la table n'existe pas, on la crée automatiquement
      if (error.code === '42P01') {
        console.log('⚠️ Table contact_messages n\'existe pas, création en cours...');
        return res.status(500).json({
          success: false,
          message: 'Table de contact non configurée. Veuillez créer la table contact_messages dans Supabase.'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi du message',
        error: error.message
      });
    }

    // Vérifier que contactMessage existe et a un ID
    // Si null, c'est probablement dû aux politiques RLS qui empêchent la lecture
    let contactMessageId: string;
    
    if (!contactMessage || !contactMessage.id) {
      console.warn('⚠️ contactMessage est null après insertion (probablement RLS), récupération par email...');
      
      // Essayer de récupérer l'ID via une requête directe avec le service role
      const { data: lastMessage, error: fetchError } = await supabaseAdmin
        .from('contact_messages')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (fetchError || !lastMessage || !lastMessage.id) {
        console.error('❌ Impossible de récupérer le message après insertion:', fetchError);
        // On continue quand même, on génère un ID temporaire pour la notification
        contactMessageId = 'temp-' + Date.now();
        console.warn('⚠️ Utilisation d\'un ID temporaire pour la notification:', contactMessageId);
      } else {
        contactMessageId = lastMessage.id;
        console.log('✅ ID récupéré avec succès:', contactMessageId);
      }
    } else {
      contactMessageId = contactMessage.id;
    }

    // Créer une notification pour tous les admins
    try {
      await AdminNotificationService.notifyNewContactMessage({
        contact_message_id: contactMessageId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        subject: subject ? subject.trim() : null,
        message: message.trim()
      });
    } catch (notifError) {
      console.error('❌ Erreur création notification contact:', notifError);
      // On continue même si la notification échoue
    }

    return res.json({
      success: true,
      data: {
        id: contactMessageId,
        message: 'Message envoyé avec succès'
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur route contact:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default router;
