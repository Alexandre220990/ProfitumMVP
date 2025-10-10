import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Créer une connexion Supabase avec la clé de service
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/workflow/step-action - Exécuter une action d'étape
router.post('/step-action', async (req, res) => {
  try {
    const { stepId, action, data } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification requis'
      });
    }

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }

    console.log(`🔄 Action d'étape demandée: ${action} pour l'étape ${stepId}`);

    let success = false;
    let nextStep = stepId;

    switch (action) {
      case 'sign_charte':
        // La signature de charte est gérée par la route charte-signature
        success = true;
        nextStep = 1;
        break;

      case 'assign_expert':
        // Assigner un expert
        if (data?.expertId && data?.clientProduitEligibleId) {
          const { error: assignError } = await supabase
            .from('ClientProduitEligible')
            .update({
              expert_id: data.expertId,
              current_step: 2,
              progress: 50,
              updated_at: new Date().toISOString()
            })
            .eq('id', data.clientProduitEligibleId);

          if (!assignError) {
            // Créer l'assignation expert
            const { error: assignmentError } = await supabase
              .from('ExpertAssignment')
              .insert({
                expert_id: data.expertId,
                client_id: user.id,
                client_produit_eligible_id: data.clientProduitEligibleId,
                status: 'assigned',
                assigned_at: new Date().toISOString()
              });

            success = !assignmentError;
            nextStep = 2;
          }
        }
        break;

      case 'complete_dossier':
        // Marquer le dossier comme complété
        if (data?.clientProduitEligibleId) {
          const { error: completeError } = await supabase
            .from('ClientProduitEligible')
            .update({
              current_step: 3,
              progress: 75,
              updated_at: new Date().toISOString()
            })
            .eq('id', data.clientProduitEligibleId);

          success = !completeError;
          nextStep = 3;
        }
        break;

      case 'validate_dossier':
        // Validation administrative (réservé aux admins)
        const { data: adminData, error: adminError } = await supabase
          .from('Admin')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();

        if (adminError || !adminData) {
          return res.status(403).json({
            success: false,
            message: 'Accès réservé aux administrateurs'
          });
        }

        if (data?.clientProduitEligibleId) {
          const { error: validateError } = await supabase
            .from('ClientProduitEligible')
            .update({
              current_step: 4,
              progress: 90,
              updated_at: new Date().toISOString()
            })
            .eq('id', data.clientProduitEligibleId);

          success = !validateError;
          nextStep = 4;
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Action non reconnue'
        });
    }

    if (success) {
      console.log(`✅ Action ${action} exécutée avec succès, passage à l'étape ${nextStep}`);
      
    return res.json({
        success: true,
        message: 'Action exécutée avec succès',
        data: {
          nextStep,
          progress: Math.round((nextStep / 5) * 100)
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'exécution de l\'action'
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution de l\'action d\'étape:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default router; 