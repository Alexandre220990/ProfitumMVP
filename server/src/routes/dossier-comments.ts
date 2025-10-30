import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { enhancedAuthMiddleware } from '../middleware/auth-enhanced';
import { AuthUser } from '../types/auth';

const router = Router();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// TYPES
// ============================================================================

interface DossierComment {
  id: string;
  dossier_id: string;
  comment_type: 'system' | 'manual';
  category: 'alert' | 'rdv_event' | 'document' | 'status_change' | 'expert_action' | 'apporteur_action';
  event_type: string;
  content: string;
  metadata?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  created_by?: string;
  created_by_type?: 'expert' | 'admin' | 'apporteur' | 'system';
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  visible_to_expert: boolean;
  visible_to_apporteur: boolean;
  visible_to_admin: boolean;
}

// ============================================================================
// ROUTE 1: GET /api/dossier/:dossierId/comments
// Récupérer tous les commentaires d'un dossier
// ============================================================================

router.get('/:dossierId/comments', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser;
    const { dossierId } = req.params;
    const { category, limit = '50', offset = '0' } = req.query;

    if (!authUser) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    // Vérifier l'accès au dossier
    const { data: dossier, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select('id, "clientId", expert_id')
      .eq('id', dossierId)
      .single();

    if (dossierError || !dossier) {
      return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
    }

    // Vérifier les permissions
    const hasAccess = 
      authUser.type === 'admin' ||
      (authUser.type === 'expert' && dossier.expert_id === authUser.database_id) ||
      (authUser.type === 'apporteur'); // TODO: vérifier l'apporteur assigné

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Construire la requête
    let query = supabase
      .from('DossierComment')
      .select(`
        id,
        dossier_id,
        comment_type,
        category,
        event_type,
        content,
        metadata,
        priority,
        created_by,
        created_by_type,
        created_at,
        updated_at,
        visible_to_expert,
        visible_to_apporteur,
        visible_to_admin
      `)
      .eq('dossier_id', dossierId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // Filtrer par catégorie si spécifié
    if (category) {
      query = query.eq('category', category);
    }

    // Filtrer selon visibilité
    if (authUser.type === 'expert') {
      query = query.eq('visible_to_expert', true);
    } else if (authUser.type === 'apporteur') {
      query = query.eq('visible_to_apporteur', true);
    }

    // Pagination
    query = query.range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    const { data: comments, error: commentsError } = await query;

    if (commentsError) {
      console.error('❌ Erreur récupération commentaires:', commentsError);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    // Enrichir avec les informations des créateurs
    const enrichedComments = await Promise.all(
      (comments || []).map(async (comment: any) => {
        if (comment.created_by && comment.created_by_type !== 'system') {
          // Récupérer les infos du créateur
          let creatorTable = '';
          if (comment.created_by_type === 'expert') creatorTable = 'Expert';
          else if (comment.created_by_type === 'apporteur') creatorTable = 'ApporteurAffaires';
          else if (comment.created_by_type === 'admin') creatorTable = 'User';

          if (creatorTable) {
            const { data: creator } = await supabase
              .from(creatorTable)
              .select('id, name, email, company_name')
              .eq('id', comment.created_by)
              .single();

            return {
              ...comment,
              creator: creator ? {
                id: creator.id,
                name: creator.name || creator.company_name,
                email: creator.email,
                type: comment.created_by_type
              } : null
            };
          }
        }

        return comment;
      })
    );

    return res.json({
      success: true,
      data: enrichedComments,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: comments?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération commentaires:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================================
// ROUTE 2: POST /api/dossier/:dossierId/comments
// Créer un commentaire manuel
// ============================================================================

router.post('/:dossierId/comments', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser;
    const { dossierId } = req.params;
    const { content, category, event_type, metadata, visible_to_expert, visible_to_apporteur } = req.body;

    if (!authUser) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    if (!content || !category || !event_type) {
      return res.status(400).json({ 
        success: false, 
        message: 'Paramètres manquants: content, category, event_type requis' 
      });
    }

    // Vérifier l'accès au dossier
    const { data: dossier, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select('id, "clientId", expert_id')
      .eq('id', dossierId)
      .single();

    if (dossierError || !dossier) {
      return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
    }

    // Vérifier les permissions d'écriture
    const canWrite = 
      authUser.type === 'admin' ||
      (authUser.type === 'expert' && dossier.expert_id === authUser.database_id) ||
      (authUser.type === 'apporteur'); // TODO: vérifier l'apporteur assigné

    if (!canWrite) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Créer le commentaire
    const { data: comment, error: commentError } = await supabase
      .from('DossierComment')
      .insert({
        dossier_id: dossierId,
        comment_type: 'manual',
        category,
        event_type,
        content,
        metadata: metadata || {},
        created_by: authUser.database_id,
        created_by_type: authUser.type,
        visible_to_expert: visible_to_expert !== undefined ? visible_to_expert : true,
        visible_to_apporteur: visible_to_apporteur !== undefined ? visible_to_apporteur : true,
        visible_to_admin: true
      })
      .select()
      .single();

    if (commentError) {
      console.error('❌ Erreur création commentaire:', commentError);
      return res.status(500).json({ success: false, message: 'Erreur lors de la création' });
    }

    // Mettre à jour updated_at du dossier
    await supabase
      .from('ClientProduitEligible')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', dossierId);

    return res.status(201).json({
      success: true,
      data: comment,
      message: 'Commentaire créé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur création commentaire:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================================
// ROUTE 3: PATCH /api/dossier/:dossierId/comments/:commentId
// Modifier un commentaire manuel
// ============================================================================

router.patch('/:dossierId/comments/:commentId', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser;
    const { dossierId, commentId } = req.params;
    const { content } = req.body;

    if (!authUser) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    // Récupérer le commentaire
    const { data: comment, error: commentError } = await supabase
      .from('DossierComment')
      .select('*')
      .eq('id', commentId)
      .eq('dossier_id', dossierId)
      .single();

    if (commentError || !comment) {
      return res.status(404).json({ success: false, message: 'Commentaire non trouvé' });
    }

    // Vérifier que c'est un commentaire manuel
    if (comment.comment_type !== 'manual') {
      return res.status(400).json({ 
        success: false, 
        message: 'Les commentaires système ne peuvent pas être modifiés' 
      });
    }

    // Vérifier que l'utilisateur est le créateur ou admin
    const canEdit = 
      authUser.type === 'admin' ||
      comment.created_by === authUser.database_id;

    if (!canEdit) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Mettre à jour le commentaire
    const { data: updatedComment, error: updateError } = await supabase
      .from('DossierComment')
      .update({
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur mise à jour commentaire:', updateError);
      return res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour' });
    }

    return res.json({
      success: true,
      data: updatedComment,
      message: 'Commentaire mis à jour avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour commentaire:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================================
// ROUTE 4: DELETE /api/dossier/:dossierId/comments/:commentId
// Supprimer un commentaire manuel (soft delete)
// ============================================================================

router.delete('/:dossierId/comments/:commentId', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser;
    const { dossierId, commentId } = req.params;

    if (!authUser) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    // Récupérer le commentaire
    const { data: comment, error: commentError } = await supabase
      .from('DossierComment')
      .select('*')
      .eq('id', commentId)
      .eq('dossier_id', dossierId)
      .single();

    if (commentError || !comment) {
      return res.status(404).json({ success: false, message: 'Commentaire non trouvé' });
    }

    // Vérifier que c'est un commentaire manuel
    if (comment.comment_type !== 'manual') {
      return res.status(400).json({ 
        success: false, 
        message: 'Les commentaires système ne peuvent pas être supprimés' 
      });
    }

    // Vérifier que l'utilisateur est le créateur ou admin
    const canDelete = 
      authUser.type === 'admin' ||
      comment.created_by === authUser.database_id;

    if (!canDelete) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from('DossierComment')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', commentId);

    if (deleteError) {
      console.error('❌ Erreur suppression commentaire:', deleteError);
      return res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
    }

    return res.json({
      success: true,
      message: 'Commentaire supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suppression commentaire:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================================
// ROUTE 5: GET /api/dossier/:dossierId/comments/stats
// Obtenir les statistiques des commentaires
// ============================================================================

router.get('/:dossierId/comments/stats', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser;
    const { dossierId } = req.params;

    if (!authUser) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    // Vérifier l'accès au dossier
    const { data: dossier, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select('id')
      .eq('id', dossierId)
      .single();

    if (dossierError || !dossier) {
      return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
    }

    // Récupérer les stats depuis la vue
    const { data: stats, error: statsError } = await supabase
      .from('DossierCommentStats')
      .select('*')
      .eq('dossier_id', dossierId)
      .single();

    if (statsError && statsError.code !== 'PGRST116') { // Ignorer si aucun résultat
      console.error('❌ Erreur récupération stats:', statsError);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    return res.json({
      success: true,
      data: stats || {
        dossier_id: dossierId,
        total_comments: 0,
        system_comments: 0,
        manual_comments: 0,
        alerts_count: 0,
        rdv_events_count: 0,
        document_events_count: 0,
        critical_alerts: 0,
        high_alerts: 0,
        last_comment_at: null
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération stats:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================================
// ROUTE 6: POST /api/dossier/check-inactivity-alerts
// Vérifier et créer des alertes d'inactivité (admin only)
// ============================================================================

router.post('/check-inactivity-alerts', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser;

    if (!authUser || authUser.type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux admins' });
    }

    // Appeler la fonction SQL
    const { error } = await supabase.rpc('check_inactivity_alerts');

    if (error) {
      console.error('❌ Erreur vérification inactivité:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    return res.json({
      success: true,
      message: 'Vérification des alertes d\'inactivité effectuée'
    });

  } catch (error) {
    console.error('❌ Erreur vérification inactivité:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;

