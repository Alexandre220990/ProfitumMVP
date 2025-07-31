import express, { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';


const router = express.Router();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// ROUTES DE PRÉFÉRENCES DE NOTIFICATIONS
// ============================================================================

// GET /api/expert/notification-preferences - Récupérer les préférences de l'expert
router.get('/', async (req: Request, res: Response) => {
  try {
    const expertId = req.user?.id;
    if (!expertId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    // Récupérer les préférences existantes
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', expertId)
      .eq('user_type', 'expert')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Erreur récupération préférences:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des préférences'
      });
    }

    // Préférences par défaut si aucune n'existe
    const defaultPreferences = {
      user_id: expertId,
      user_type: 'expert',
      email_enabled: true,
      push_enabled: false,
      sms_enabled: false,
      in_app_enabled: true,
      quiet_hours_start: null,
      quiet_hours_end: null,
      timezone: 'Europe/Paris',
      language: 'fr',
      priority_filter: ['urgent', 'high', 'medium', 'low'],
      type_filter: ['expert_approved', 'expert_rejected', 'expert_account_created', 'expert_profile_updated', 'expert_status_changed'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return res.json({
      success: true,
      data: {
        preferences: preferences || defaultPreferences
      }
    });

  } catch (error) {
    console.error('❌ Erreur route préférences:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// PUT /api/expert/notification-preferences - Mettre à jour les préférences
router.put('/', async (req: Request, res: Response) => {
  try {
    const expertId = req.user?.id;
    if (!expertId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    const updates = req.body;

    // Vérifier les préférences existantes
    const { data: existingPreferences, error: checkError } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq('user_id', expertId)
      .eq('user_type', 'expert')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erreur vérification préférences:', checkError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des préférences'
      });
    }

    let result;
    if (existingPreferences) {
      // Mettre à jour les préférences existantes
      const { data: updatedPreferences, error: updateError } = await supabase
        .from('notification_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPreferences.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Erreur mise à jour préférences:', updateError);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la mise à jour des préférences'
        });
      }

      result = updatedPreferences;
    } else {
      // Créer de nouvelles préférences
      const { data: newPreferences, error: createError } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: expertId,
          user_type: 'expert',
          email_enabled: true,
          push_enabled: false,
          sms_enabled: false,
          in_app_enabled: true,
          quiet_hours_start: null,
          quiet_hours_end: null,
          timezone: 'Europe/Paris',
          language: 'fr',
          priority_filter: ['urgent', 'high', 'medium', 'low'],
          type_filter: ['expert_approved', 'expert_rejected', 'expert_account_created', 'expert_profile_updated', 'expert_status_changed'],
          ...updates,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Erreur création préférences:', createError);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la création des préférences'
        });
      }

      result = newPreferences;
    }

    return res.json({
      success: true,
      data: {
        preferences: result
      },
      message: 'Préférences mises à jour avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour préférences:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// POST /api/expert/notification-preferences/reset - Réinitialiser les préférences par défaut
router.post('/reset', async (req: Request, res: Response) => {
  try {
    const expertId = req.user?.id;
    if (!expertId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    const defaultPreferences = {
      email_enabled: true,
      push_enabled: false,
      sms_enabled: false,
      in_app_enabled: true,
      quiet_hours_start: null,
      quiet_hours_end: null,
      timezone: 'Europe/Paris',
      language: 'fr',
      priority_filter: ['urgent', 'high', 'medium', 'low'],
      type_filter: ['expert_approved', 'expert_rejected', 'expert_account_created', 'expert_profile_updated', 'expert_status_changed']
    };

    // Vérifier les préférences existantes
    const { data: existingPreferences, error: checkError } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq('user_id', expertId)
      .eq('user_type', 'expert')
      .single();

    let result;
    if (existingPreferences) {
      // Mettre à jour avec les valeurs par défaut
      const { data: updatedPreferences, error: updateError } = await supabase
        .from('notification_preferences')
        .update({
          ...defaultPreferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPreferences.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Erreur réinitialisation préférences:', updateError);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la réinitialisation des préférences'
        });
      }

      result = updatedPreferences;
    } else {
      // Créer de nouvelles préférences par défaut
      const { data: newPreferences, error: createError } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: expertId,
          user_type: 'expert',
          ...defaultPreferences,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Erreur création préférences par défaut:', createError);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la création des préférences par défaut'
        });
      }

      result = newPreferences;
    }

    return res.json({
      success: true,
      data: {
        preferences: result
      },
      message: 'Préférences réinitialisées avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur réinitialisation préférences:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// GET /api/expert/notification-preferences/test - Tester les notifications
router.get('/test', async (req: Request, res: Response) => {
  try {
    const expertId = req.user?.id;
    if (!expertId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    // Récupérer les préférences
    const { data: preferences, error: prefError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', expertId)
      .eq('user_type', 'expert')
      .single();

    if (prefError && prefError.code !== 'PGRST116') {
      console.error('❌ Erreur récupération préférences test:', prefError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des préférences'
      });
    }

    // Créer une notification de test
    const testNotification = {
      recipient_id: expertId,
      recipient_type: 'expert',
      type: 'test_notification',
      title: '🧪 Test de notification',
      message: 'Ceci est une notification de test pour vérifier vos préférences',
      data: {
        test: true,
        timestamp: new Date().toISOString()
      },
      priority: 'medium',
      channels: ['in_app'],
      sent_channels: [],
      read: false,
      created_at: new Date().toISOString()
    };

    const { data: notification, error: notifError } = await supabase
      .from('notification')
      .insert(testNotification)
      .select()
      .single();

    if (notifError) {
      console.error('❌ Erreur création notification test:', notifError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la notification de test'
      });
    }

    return res.json({
      success: true,
      data: {
        notification,
        preferences: preferences || null
      },
      message: 'Notification de test créée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur test notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

export default router; 