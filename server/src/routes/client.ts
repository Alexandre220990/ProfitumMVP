import express, { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { AuthUser } from '../types/auth';
import { enhancedAuthMiddleware, AuthenticatedRequest } from '../middleware/auth-enhanced';
import { NotificationService } from '../services/NotificationService';

const router = express.Router();

// ============================================================================
// ROUTES CLIENT - AUTHENTIFICATION UNIFIÉE
// ============================================================================

// Route de test d'authentification supprimée - l'authentification est gérée par le middleware enhancedAuthMiddleware

// GET /api/client/produits-eligibles - Récupérer les produits éligibles du client connecté
router.get('/produits-eligibles', enhancedAuthMiddleware, async (req, res) => {
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

    console.log('🔍 Récupération des produits éligibles pour client:', {
      userId: user.id,
      databaseId: user.database_id,
      email: user.email
    });

    // Récupérer les produits éligibles du client
    const { data: produits, error } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        ProduitEligible (
          id,
          nom,
          description,
          category,
          montant_min,
          montant_max,
          taux_min,
          taux_max,
          duree_min,
          duree_max
        )
      `)
      .eq('clientId', user.database_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération produits éligibles:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des produits éligibles'
      });
    }

    console.log('✅ Produits éligibles récupérés:', produits?.length || 0);

    // Mettre à jour last_activity_at pour le client
    await supabase
      .from('Client')
      .update({ 
        last_activity_at: new Date().toISOString()
      })
      .eq('id', user.database_id);

    return res.json({
      success: true,
      data: produits || [],
      pagination: {
        total: produits?.length || 0,
        page: 1,
        limit: 100
      }
    });

  } catch (error) {
    console.error('❌ Erreur route produits-eligibles:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/client/produits-eligibles/:id - Récupérer un produit éligible spécifique
router.get('/produits-eligibles/:id', enhancedAuthMiddleware, async (req, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id } = req.params;
    
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

    console.log('🔍 Récupération du produit éligible:', {
      produitId: id,
      userId: user.id,
      databaseId: user.database_id
    });

    // Récupérer le produit éligible spécifique
    const { data: produit, error } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        ProduitEligible (
          id,
          nom,
          description,
          category,
          montant_min,
          montant_max,
          taux_min,
          taux_max,
          duree_min,
          duree_max
        ),
        Expert (
          id,
          name,
          email,
          company_name,
          specializations
        )
      `)
      .eq('id', id)
      .eq('clientId', user.database_id)
      .single();

    if (error) {
      console.error('❌ Erreur récupération produit éligible:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du produit éligible'
      });
    }

    if (!produit) {
      return res.status(404).json({
        success: false,
        message: 'Produit éligible non trouvé'
      });
    }

    console.log('✅ Produit éligible récupéré:', produit.id);

    // Mettre à jour last_activity_at pour le client
    await supabase
      .from('Client')
      .update({ 
        last_activity_at: new Date().toISOString()
      })
      .eq('id', user.database_id);

    return res.json({
      success: true,
      data: produit
    });

  } catch (error) {
    console.error('❌ Erreur route produit-eligible:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// PUT /api/client/produits-eligibles/:id - Mettre à jour un produit éligible
router.put('/produits-eligibles/:id', enhancedAuthMiddleware, async (req, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }
    
    const { id } = req.params;
    const { statut, notes, current_step, progress } = req.body;

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

    // Préparer les données de mise à jour
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (statut !== undefined) {
      updateData.statut = statut;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (current_step !== undefined) {
      updateData.current_step = current_step;
    }

    if (progress !== undefined) {
      updateData.progress = progress;
    }

    // Mettre à jour le produit éligible
    const { data: updatedProduit, error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      throw updateError;
    }

    return res.json({
      success: true,
      message: 'Produit éligible mis à jour avec succès',
      data: updatedProduit
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour produit éligible:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour'
    });
  }
});

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
        'prospect_id_placeholder',
        'apporteur_id_placeholder'
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