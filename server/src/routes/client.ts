import express, { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { AuthUser } from '../types/auth';
import { enhancedAuthMiddleware, AuthenticatedRequest } from '../middleware/auth-enhanced';
import { NotificationService } from '../services/NotificationService';

const router = express.Router();

// ============================================================================
// ROUTES CLIENT - AUTHENTIFICATION UNIFIÉE
// ============================================================================

// PUT /api/client/produits-eligibles/:id/assign-expert - Attribuer un expert à un produit éligible
router.put('/produits-eligibles/:id/assign-expert', enhancedAuthMiddleware, async (req, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }
    
    const { id } = req.params;
    const { expert_id } = req.body;

    // Vérifier que l'utilisateur est un client
    if (user.type !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux clients'
      });
    }

    // Vérifier que le produit éligible appartient au client
    const { data: produitData, error: produitError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .eq('id', id)
      .eq('clientId', user.database_id)
      .single();

    if (produitError || !produitData) {
      return res.status(404).json({
        success: false,
        message: 'Produit éligible non trouvé'
      });
    }

    // Vérifier que l'expert existe et est actif
    const { data: expertData, error: expertError } = await supabase
      .from('Expert')
      .select('id, name, specializations')
      .eq('id', expert_id)
      .eq('status', 'active')
      .single();

    if (expertError || !expertData) {
      return res.status(404).json({
        success: false,
        message: 'Expert non trouvé ou inactif'
      });
    }

    // Mettre à jour le produit éligible avec l'expert assigné
    const { data: updatedProduit, error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update({ 
        expert_id: expert_id,
        statut: 'en_cours',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      throw updateError;
    }

    // Envoyer une notification à l'expert
    try {
      await NotificationService.sendPreselectionNotification(
        expert_id,
        user.user_metadata.company_name || 'Client',
        produitData.ProduitEligible?.nom || 'Produit',
        produitData.montant_final
      );
    } catch (notificationError) {
      console.error('Erreur lors de l\'envoi de la notification:', notificationError);
      // Ne pas faire échouer la requête si la notification échoue
    }

    return res.json({
      success: true,
      data: updatedProduit,
      message: 'Expert assigné avec succès'
    });

  } catch (error) {
    console.error('Error assigning expert:', error);
    return res.status(500).json({
      success: false,
      message: 'Error assigning expert'
    });
  }
});

// PUT /api/client/produits-eligibles/:id/workflow - Mettre à jour le workflow
router.put('/produits-eligibles/:id/workflow', async (req, res) => {
  try {
    const { id } = req.params;
    const { current_step, progress, metadata } = req.body;
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

    // Vérifier que l'utilisateur est un client
    const { data: clientData, error: clientError } = await supabase
      .from('Client')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (clientError || !clientData) {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux clients'
      });
    }

    // Vérifier que le produit appartient au client
    const { data: clientProduit, error: fetchError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .eq('id', id)
      .eq('clientId', clientData.id)
      .single();

    if (fetchError || !clientProduit) {
      return res.status(404).json({ 
        success: false, 
        message: 'Produit éligible non trouvé' 
      });
    }

    // Mettre à jour le workflow
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (current_step !== undefined) {
      updateData.current_step = current_step;
    }

    if (progress !== undefined) {
      updateData.progress = progress;
    }

    if (metadata !== undefined) {
      updateData.metadata = metadata;
    }

    const { data: updatedProduit, error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update(updateData)
      .eq('id', id)
      .eq('clientId', clientData.id)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur lors de la mise à jour du workflow:', updateError);
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la mise à jour du workflow' 
      });
    }

    // Log de l'activité
    console.log(`Workflow mis à jour pour le produit ${id}: étape ${current_step}, progression ${progress}%`);

    return res.json({ 
      success: true, 
      message: 'Workflow mis à jour avec succès',
      data: updatedProduit
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du workflow:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour obtenir les assignations d'un client
router.get('/:clientId/assignments', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { clientId } = req.params;
    
    // Vérifier que l'utilisateur a accès à ce client
    if (authUser.type !== 'admin' && authUser.id !== clientId) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const offset = (page - 1) * pageSize;
    const limit = offset + pageSize - 1;

    // Récupérer les assignations du client (pagination)
    const { data: assignments, error, count } = await supabase
      .from('ExpertAssignment')
      .select(`
        *,
        Expert (
          id,
          name,
          company_name,
          rating,
          specializations
        ),
        ProduitEligible (
          id,
          nom,
          description
        )
      `, { count: 'exact' })
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .range(offset, limit);

    if (error) {
      console.error('Erreur lors de la récupération des assignations:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    return res.json({
      success: true,
      data: {
        assignments: assignments || []
      },
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 1
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des assignations:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router; 