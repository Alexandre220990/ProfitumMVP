import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// ============================================================================
// ROUTES PARAMÈTRES APPORTEUR
// ============================================================================

/**
 * GET /api/apporteur/profile
 * Récupérer le profil complet de l'apporteur connecté
 */
router.get('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    
    if (!user || user.type !== 'apporteur') {
      res.status(403).json({
        success: false,
        message: 'Accès réservé aux apporteurs d\'affaires'
      });
      return;
    }

    console.log(`📋 Récupération profil apporteur ${user.database_id}`);

    const { data: apporteur, error } = await supabase
      .from('ApporteurAffaires')
      .select(`
        id,
        auth_user_id,
        first_name,
        last_name,
        email,
        phone,
        company_name,
        company_type,
        siren,
        address,
        city,
        postal_code,
        commission_rate,
        status,
        is_active,
        approved_at,
        created_at,
        updated_at,
        notification_preferences,
        bio,
        specializations,
        website
      `)
      .eq('id', user.database_id)
      .single();

    if (error) {
      console.error('❌ Erreur récupération profil:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du profil'
      });
      return;
    }

    if (!apporteur) {
      res.status(404).json({
        success: false,
        message: 'Profil non trouvé'
      });
      return;
    }

    console.log('✅ Profil récupéré avec succès');

    res.json({
      success: true,
      data: apporteur
    });

  } catch (error) {
    console.error('❌ Erreur route profile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * PUT /api/apporteur/profile
 * Mettre à jour le profil de l'apporteur connecté
 */
router.put('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    
    if (!user || user.type !== 'apporteur') {
      res.status(403).json({
        success: false,
        message: 'Accès réservé aux apporteurs d\'affaires'
      });
      return;
    }

    const {
      first_name,
      last_name,
      phone,
      company_name,
      company_type,
      address,
      city,
      postal_code,
      bio,
      website
    } = req.body;

    console.log(`📝 Mise à jour profil apporteur ${user.database_id}`);

    // Construire l'objet de mise à jour (seulement les champs fournis)
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (phone !== undefined) updateData.phone = phone;
    if (company_name !== undefined) updateData.company_name = company_name;
    if (company_type !== undefined) updateData.company_type = company_type;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (postal_code !== undefined) updateData.postal_code = postal_code;
    if (bio !== undefined) updateData.bio = bio;
    if (website !== undefined) updateData.website = website;

    const { data: updatedApporteur, error } = await supabase
      .from('ApporteurAffaires')
      .update(updateData)
      .eq('id', user.database_id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur mise à jour profil:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du profil'
      });
      return;
    }

    console.log('✅ Profil mis à jour avec succès');

    res.json({
      success: true,
      data: updatedApporteur,
      message: 'Profil mis à jour avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur route update profile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * PUT /api/apporteur/notifications
 * Mettre à jour les préférences de notification
 */
router.put('/notifications', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    
    if (!user || user.type !== 'apporteur') {
      res.status(403).json({
        success: false,
        message: 'Accès réservé aux apporteurs d\'affaires'
      });
      return;
    }

    const notificationPreferences = req.body;

    console.log(`🔔 Mise à jour notifications apporteur ${user.database_id}`);

    const { data: updatedApporteur, error } = await supabase
      .from('ApporteurAffaires')
      .update({
        notification_preferences: notificationPreferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.database_id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur mise à jour notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour des notifications'
      });
      return;
    }

    console.log('✅ Notifications mises à jour avec succès');

    res.json({
      success: true,
      data: updatedApporteur.notification_preferences,
      message: 'Préférences de notification mises à jour avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur route notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * POST /api/apporteur/deactivate
 * Désactiver le compte de l'apporteur
 */
router.post('/deactivate', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    
    if (!user || user.type !== 'apporteur') {
      res.status(403).json({
        success: false,
        message: 'Accès réservé aux apporteurs d\'affaires'
      });
      return;
    }

    const { confirmation } = req.body;

    // Vérifier la confirmation
    if (confirmation !== 'DESACTIVER') {
      res.status(400).json({
        success: false,
        message: 'Confirmation invalide'
      });
      return;
    }

    console.log(`⚠️ Désactivation compte apporteur ${user.database_id}`);

    // Désactiver le compte (is_active = false, status = 'inactive')
    const { error } = await supabase
      .from('ApporteurAffaires')
      .update({
        is_active: false,
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.database_id);

    if (error) {
      console.error('❌ Erreur désactivation compte:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la désactivation du compte'
      });
      return;
    }

    console.log('✅ Compte désactivé avec succès');

    res.json({
      success: true,
      message: 'Compte désactivé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur route deactivate:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default router;

