/**
 * Routes pour la timeline des clients
 * Fusionne tous les événements des dossiers du client + événements client
 */

import express, { Request, Response } from 'express';
import { enhancedAuthMiddleware, AuthenticatedRequest } from '../middleware/auth-enhanced';
import { ClientTimelineService } from '../services/client-timeline-service';
import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/clients/:id/timeline
 * Récupérer la timeline complète d'un client (tous les dossiers + événements client)
 */
router.get('/:id/timeline', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: client_id } = req.params;
    const { limit, offset, type, actor_type } = req.query;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    // Vérifier les permissions
    let hasPermission = false;

    if (user.type === 'admin') {
      hasPermission = true;
    } else if (user.type === 'client') {
      hasPermission = client_id === user.database_id;
    } else if (user.type === 'expert') {
      // Expert : accès si au moins un dossier lui est assigné
      const { data: dossiers } = await supabase
        .from('ClientProduitEligible')
        .select('id')
        .eq('clientId', client_id)
        .eq('expert_id', user.database_id)
        .limit(1);
      hasPermission = (dossiers?.length || 0) > 0;
    } else if (user.type === 'apporteur') {
      // Apporteur : accès si le client lui appartient
      const { data: client } = await supabase
        .from('Client')
        .select('apporteur_id')
        .eq('id', client_id)
        .single();
      hasPermission = client?.apporteur_id === user.database_id;
    }

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce client'
      });
    }

    // Récupérer la timeline
    const result = await ClientTimelineService.getTimeline(client_id, {
      limit: limit ? parseInt(limit as string) : 100,
      offset: offset ? parseInt(offset as string) : 0,
      type: type as string,
      actor_type: actor_type as string
    });

    if (result.success) {
      return res.json({
        success: true,
        data: {
          events: result.events,
          total: result.total,
          limit: limit ? parseInt(limit as string) : 100,
          offset: offset ? parseInt(offset as string) : 0
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la timeline'
      });
    }

  } catch (error: any) {
    console.error('❌ Erreur GET timeline client:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      details: error.message
    });
  }
});

/**
 * POST /api/clients/:id/timeline/comment
 * Ajouter un commentaire sur un client (admin/expert/apporteur)
 */
router.post('/:id/timeline/comment', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: client_id } = req.params;
    const { content } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu du commentaire est requis'
      });
    }

    // Vérifier les permissions
    let hasPermission = false;

    if (user.type === 'admin') {
      hasPermission = true;
    } else if (user.type === 'expert') {
      const { data: dossiers } = await supabase
        .from('ClientProduitEligible')
        .select('id')
        .eq('clientId', client_id)
        .eq('expert_id', user.database_id)
        .limit(1);
      hasPermission = (dossiers?.length || 0) > 0;
    } else if (user.type === 'apporteur') {
      const { data: client } = await supabase
        .from('Client')
        .select('apporteur_id')
        .eq('id', client_id)
        .single();
      hasPermission = client?.apporteur_id === user.database_id;
    }

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce client'
      });
    }

    // Récupérer le nom de l'utilisateur
    let actorName = user.email;
    if (user.type === 'admin') {
      const { data: adminData } = await supabaseAdmin
        .from('Admin')
        .select('name')
        .eq('id', user.database_id)
        .single();
      actorName = adminData?.name || user.email;
    } else if (user.type === 'expert') {
      const { data: expertData } = await supabaseAdmin
        .from('Expert')
        .select('name, first_name, last_name')
        .eq('id', user.database_id)
        .single();
      actorName = expertData?.name || `${expertData?.first_name || ''} ${expertData?.last_name || ''}`.trim() || user.email;
    } else if (user.type === 'apporteur') {
      const { data: apporteurData } = await supabaseAdmin
        .from('ApporteurAffaires')
        .select('first_name, last_name, company_name')
        .eq('id', user.database_id)
        .single();
      actorName = `${apporteurData?.first_name || ''} ${apporteurData?.last_name || ''}`.trim() || apporteurData?.company_name || user.email;
    }

    // Créer un événement dans client_timeline (la table sera créée automatiquement ou on utilisera une approche alternative)
    const timelineResult = await ClientTimelineService.addEvent({
      client_id,
      type: 'comment',
      actor_type: user.type as any,
      actor_id: user.database_id,
      actor_name: actorName,
      title: `Commentaire ${user.type === 'admin' ? 'Admin' : user.type === 'expert' ? 'Expert' : 'Apporteur'}`,
      description: content.trim(),
      icon: '💬',
      color: user.type === 'admin' ? 'red' : user.type === 'expert' ? 'purple' : 'green'
    });

    return res.json({
      success: true,
      data: { event_id: timelineResult.event_id },
      message: 'Commentaire ajouté avec succès'
    });

  } catch (error: any) {
    console.error('❌ Erreur POST commentaire client:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      details: error.message
    });
  }
});

/**
 * PUT /api/clients/:id/timeline/comment/:commentId
 * Modifier un commentaire sur un client (seulement si l'utilisateur est l'auteur)
 */
router.put('/:id/timeline/comment/:commentId', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: client_id, commentId } = req.params;
    const { content } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu du commentaire est requis'
      });
    }

    // Récupérer le commentaire pour vérifier que l'utilisateur est l'auteur
    const { data: event, error: eventError } = await supabaseAdmin
      .from('client_timeline')
      .select('*')
      .eq('id', commentId)
      .eq('client_id', client_id)
      .eq('type', 'comment')
      .single();

    if (eventError || !event) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé'
      });
    }

    // Vérifier que l'utilisateur est l'auteur
    if (event.actor_id !== user.database_id) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez modifier que vos propres commentaires'
      });
    }

    // Mettre à jour le commentaire
    const { data: updatedEvent, error: updateError } = await supabaseAdmin
      .from('client_timeline')
      .update({
        description: content.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur mise à jour commentaire:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du commentaire'
      });
    }

    return res.json({
      success: true,
      data: { event: updatedEvent },
      message: 'Commentaire modifié avec succès'
    });

  } catch (error: any) {
    console.error('❌ Erreur PUT commentaire client:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      details: error.message
    });
  }
});

/**
 * DELETE /api/clients/:id/timeline/comment/:commentId
 * Supprimer un commentaire sur un client (seulement si l'utilisateur est l'auteur)
 */
router.delete('/:id/timeline/comment/:commentId', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: client_id, commentId } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    // Récupérer le commentaire pour vérifier que l'utilisateur est l'auteur
    const { data: event, error: eventError } = await supabaseAdmin
      .from('client_timeline')
      .select('*')
      .eq('id', commentId)
      .eq('client_id', client_id)
      .eq('type', 'comment')
      .single();

    if (eventError || !event) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé'
      });
    }

    // Vérifier que l'utilisateur est l'auteur
    if (event.actor_id !== user.database_id) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez supprimer que vos propres commentaires'
      });
    }

    // Supprimer le commentaire
    const { error: deleteError } = await supabaseAdmin
      .from('client_timeline')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('❌ Erreur suppression commentaire:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du commentaire'
      });
    }

    return res.json({
      success: true,
      message: 'Commentaire supprimé avec succès'
    });

  } catch (error: any) {
    console.error('❌ Erreur DELETE commentaire client:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      details: error.message
    });
  }
});

export default router;

