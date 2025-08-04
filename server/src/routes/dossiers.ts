import express, { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { enhancedAuthMiddleware } from '../middleware/auth-enhanced';

const router = express.Router();

// GET /api/dossiers/client/:clientId - Récupérer tous les dossiers d'un client
router.get('/client/:clientId', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    // Vérifier que l'utilisateur accède à ses propres dossiers
    if (user.id !== clientId && user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Récupérer tous les dossiers du client avec les informations de produit
    const { data: dossiers, error } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        clientId,
        statut,
        created_at,
        ProduitEligible(
          id,
          nom,
          description
        )
      `)
      .eq('clientId', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération dossiers:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des dossiers'
      });
    }

    // Enrichir avec le nombre de documents par dossier
    const enrichedDossiers = await Promise.all(
      (dossiers || []).map(async (dossier) => {
        // Compter les documents pour ce dossier
        const { count: documentsCount } = await supabase
          .from('DocumentFile')
          .select('*', { count: 'exact', head: true })
          .eq('metadata->dossier_id', dossier.id);

        return {
          id: dossier.id,
          product_name: dossier.ProduitEligible?.[0]?.nom || 'Produit inconnu',
          product_description: dossier.ProduitEligible?.[0]?.description || '',
          status: dossier.statut,
          created_at: dossier.created_at,
          documents_count: documentsCount || 0
        };
      })
    );

    return res.json({
      success: true,
      data: {
        dossiers: enrichedDossiers,
        count: enrichedDossiers.length
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération dossiers client:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/dossiers/:dossierId - Récupérer un dossier spécifique
router.get('/:dossierId', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { dossierId } = req.params;
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    // Récupérer le dossier
    const { data: dossier, error } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        ProduitEligible(
          id,
          nom,
          description
        )
      `)
      .eq('id', dossierId)
      .single();

    if (error || !dossier) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    // Vérifier les permissions
    if (dossier.clientId !== user.id && user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Récupérer les documents associés
    const { data: documents } = await supabase
      .from('DocumentFile')
      .select('*')
      .eq('metadata->dossier_id', dossierId)
      .order('created_at', { ascending: false });

    const enrichedDossier = {
      ...dossier,
      product_name: dossier.ProduitEligible?.[0]?.nom,
      product_description: dossier.ProduitEligible?.[0]?.description,
      documents: documents || [],
      documents_count: documents?.length || 0
    };

    return res.json({
      success: true,
      data: enrichedDossier
    });

  } catch (error) {
    console.error('❌ Erreur récupération dossier:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default router; 