import express, { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { enhancedAuthMiddleware, AuthenticatedRequest } from '../middleware/auth-enhanced';

const router = express.Router();

/**
 * ============================================================================
 * ROUTES DE RÉACTIVATION CLIENT
 * ============================================================================
 */

/**
 * POST /api/client/reactivate
 * Réactive un client inactif (inactive → client)
 */
router.post('/reactivate', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }
    
    // Vérifier que l'utilisateur est un client
    if (user.type !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux clients'
      });
    }

    console.log('🔄 Tentative de réactivation client:', {
      clientId: user.database_id,
      email: user.email
    });

    // Récupérer les données actuelles du client
    const { data: clientData, error: fetchError } = await supabase
      .from('Client')
      .select('id, email, status, last_activity_at, created_at')
      .eq('id', user.database_id)
      .single();

    if (fetchError) {
      console.error('❌ Erreur récupération client:', fetchError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des données client'
      });
    }

    if (!clientData) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    // Vérifier que le client est bien inactif
    if (clientData.status !== 'inactive') {
      return res.status(400).json({
        success: false,
        message: `Impossible de réactiver un client avec le statut: ${clientData.status}`,
        currentStatus: clientData.status
      });
    }

    // Vérifier si le client a déjà eu des simulations (critère de réactivation)
    const { count: simulationCount } = await supabase
      .from('simulations')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', user.database_id)
      .eq('status', 'completed');

    if (simulationCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de réactiver un client qui n\'a jamais effectué de simulation',
        suggestion: 'Effectuez d\'abord une simulation pour devenir client'
      });
    }

    // Réactiver le client (inactive → client)
    const { data: updatedClient, error: updateError } = await supabase
      .from('Client')
      .update({ 
        status: 'client',
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.database_id)
      .select('id, email, status, last_activity_at')
      .single();

    if (updateError) {
      console.error('❌ Erreur réactivation client:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la réactivation du client'
      });
    }

    console.log('✅ Client réactivé avec succès:', {
      clientId: updatedClient.id,
      email: updatedClient.email,
      newStatus: updatedClient.status
    });

    return res.json({
      success: true,
      message: 'Client réactivé avec succès',
      data: {
        clientId: updatedClient.id,
        email: updatedClient.email,
        status: updatedClient.status,
        lastActivityAt: updatedClient.last_activity_at
      }
    });

  } catch (error) {
    console.error('❌ Erreur route réactivation client:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la réactivation'
    });
  }
});

/**
 * GET /api/client/reactivation-status
 * Vérifie si un client peut être réactivé
 */
router.get('/reactivation-status', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user || user.type !== 'client') {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié ou non client'
      });
    }

    // Récupérer les données du client
    const { data: clientData, error: fetchError } = await supabase
      .from('Client')
      .select('id, email, status, last_activity_at, created_at')
      .eq('id', user.database_id)
      .single();

    if (fetchError || !clientData) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    // Vérifier si le client a des simulations
    const { count: simulationCount } = await supabase
      .from('simulations')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', user.database_id)
      .eq('status', 'completed');

    const canReactivate = clientData.status === 'inactive' && (simulationCount ?? 0) > 0;
    
    // Calculer les jours d'inactivité
    const daysSinceActivity = clientData.last_activity_at 
      ? Math.floor((new Date().getTime() - new Date(clientData.last_activity_at).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return res.json({
      success: true,
      data: {
        clientId: clientData.id,
        email: clientData.email,
        status: clientData.status,
        canReactivate,
        daysSinceActivity,
        hasSimulations: (simulationCount ?? 0) > 0,
        simulationCount: simulationCount ?? 0,
        lastActivityAt: clientData.last_activity_at
      }
    });

  } catch (error) {
    console.error('❌ Erreur route statut réactivation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default router;
