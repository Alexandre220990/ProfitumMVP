/**
 * Routes pour la timeline des dossiers
 */

import express, { Request, Response } from 'express';
import { enhancedAuthMiddleware, AuthenticatedRequest } from '../middleware/auth-enhanced';
import { DossierTimelineService } from '../services/dossier-timeline-service';
import { supabase } from '../lib/supabase';

const router = express.Router();

/**
 * GET /api/dossiers/:id/timeline
 * Récupérer la timeline d'un dossier (avec permissions)
 */
router.get('/:id/timeline', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: dossier_id } = req.params;
    const { limit, offset, type, actor_type } = req.query;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    console.log('📅 Récupération timeline:', {
      dossier_id,
      user_type: user.type,
      user_id: user.database_id
    });

    // Vérifier les permissions selon le type d'utilisateur
    let hasPermission = false;

    if (user.type === 'admin') {
      // Admin : accès à tous les dossiers
      hasPermission = true;
    } else if (user.type === 'client') {
      // Client : accès uniquement à ses dossiers
      const { data: dossier } = await supabase
        .from('ClientProduitEligible')
        .select('clientId')
        .eq('id', dossier_id)
        .single();

      hasPermission = dossier?.clientId === user.database_id;
    } else if (user.type === 'expert') {
      // Expert : accès aux dossiers qui lui sont assignés
      const { data: dossier } = await supabase
        .from('ClientProduitEligible')
        .select('expert_id')
        .eq('id', dossier_id)
        .single();

      hasPermission = dossier?.expert_id === user.database_id;
    } else if (user.type === 'apporteur') {
      // Apporteur : accès aux dossiers de ses clients
      const { data: dossier } = await supabase
        .from('ClientProduitEligible')
        .select(`
          clientId,
          Client!inner(apporteur_id)
        `)
        .eq('id', dossier_id)
        .single();

      const clientInfo = Array.isArray(dossier?.Client) ? dossier.Client[0] : dossier?.Client;
      hasPermission = clientInfo?.apporteur_id === user.database_id;
    }

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce dossier'
      });
    }

    // Récupérer la timeline
    const result = await DossierTimelineService.getTimeline(dossier_id, {
      limit: limit ? parseInt(limit as string) : 50,
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
          limit: limit ? parseInt(limit as string) : 50,
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
    console.error('❌ Erreur GET timeline:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      details: error.message
    });
  }
});

/**
 * POST /api/dossiers/:id/timeline/comment
 * Ajouter un commentaire simple à la timeline (admin/expert/apporteur)
 */
router.post('/:id/timeline/comment', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: dossier_id } = req.params;
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

    // Vérifier les permissions selon le type d'utilisateur
    let hasPermission = false;

    if (user.type === 'admin') {
      hasPermission = true;
    } else if (user.type === 'expert') {
      const { data: dossier } = await supabase
        .from('ClientProduitEligible')
        .select('expert_id')
        .eq('id', dossier_id)
        .single();
      hasPermission = dossier?.expert_id === user.database_id;
    } else if (user.type === 'apporteur') {
      const { data: dossier } = await supabase
        .from('ClientProduitEligible')
        .select(`
          clientId,
          Client!inner(apporteur_id)
        `)
        .eq('id', dossier_id)
        .single();
      const clientInfo = Array.isArray(dossier?.Client) ? dossier.Client[0] : dossier?.Client;
      hasPermission = clientInfo?.apporteur_id === user.database_id;
    }

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce dossier'
      });
    }

    // Récupérer le nom de l'utilisateur
    let actorName = user.email;
    if (user.type === 'admin') {
      const { data: adminData } = await supabase
        .from('Admin')
        .select('name')
        .eq('id', user.database_id)
        .single();
      actorName = adminData?.name || user.email;
    } else if (user.type === 'expert') {
      const { data: expertData } = await supabase
        .from('Expert')
        .select('name, first_name, last_name')
        .eq('id', user.database_id)
        .single();
      actorName = expertData?.name || `${expertData?.first_name || ''} ${expertData?.last_name || ''}`.trim() || user.email;
    } else if (user.type === 'apporteur') {
      const { data: apporteurData } = await supabase
        .from('ApporteurAffaires')
        .select('first_name, last_name, company_name')
        .eq('id', user.database_id)
        .single();
      actorName = `${apporteurData?.first_name || ''} ${apporteurData?.last_name || ''}`.trim() || apporteurData?.company_name || user.email;
    }

    // Créer le commentaire dans DossierComment
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: comment, error: commentError } = await supabaseAdmin
      .from('DossierComment')
      .insert({
        dossier_id,
        comment_type: 'manual',
        category: user.type === 'admin' ? 'admin_action' : user.type === 'expert' ? 'expert_action' : 'apporteur_action',
        event_type: 'comment',
        content: `Commentaire ${user.type === 'admin' ? 'Admin' : user.type === 'expert' ? 'Expert' : 'Apporteur'} : ${content.trim()}`,
        created_by: user.database_id,
        created_by_type: user.type,
        visible_to_expert: true,
        visible_to_apporteur: true,
        visible_to_admin: true
      })
      .select()
      .single();

    if (commentError) {
      console.error('❌ Erreur création commentaire:', commentError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du commentaire'
      });
    }

    // Ajouter aussi dans la timeline pour cohérence
    const timelineResult = await DossierTimelineService.addEvent({
      dossier_id,
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
      data: { 
        comment_id: comment.id,
        event_id: timelineResult.event_id 
      },
      message: 'Commentaire ajouté avec succès'
    });

  } catch (error: any) {
    console.error('❌ Erreur POST commentaire timeline:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      details: error.message
    });
  }
});

/**
 * POST /api/dossiers/:id/timeline
 * Ajouter un événement manuel à la timeline (admin/expert uniquement)
 */
router.post('/:id/timeline', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: dossier_id } = req.params;
    const { type, title, description, metadata, icon, color } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    // Seuls admin et expert peuvent ajouter des événements manuels
    if (!['admin', 'expert', 'apporteur'].includes(user.type)) {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs, experts et apporteurs'
      });
    }

    // Vérifier permissions
    let hasPermission = false;

    if (user.type === 'admin') {
      hasPermission = true;
    } else if (user.type === 'expert') {
      const { data: dossier } = await supabase
        .from('ClientProduitEligible')
        .select('expert_id')
        .eq('id', dossier_id)
        .single();

      hasPermission = dossier?.expert_id === user.database_id;
    }

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce dossier'
      });
    }

    // Récupérer le nom de l'utilisateur
    let actorName = user.email;

    if (user.type === 'admin') {
      const { data: adminData } = await supabase
        .from('Admin')
        .select('name')
        .eq('id', user.database_id)
        .single();
      actorName = adminData?.name || user.email;
    } else if (user.type === 'expert') {
      const { data: expertData } = await supabase
        .from('Expert')
        .select('name')
        .eq('id', user.database_id)
        .single();
      actorName = expertData?.name || user.email;
    }

    // Ajouter l'événement
    const result = await DossierTimelineService.addEvent({
      dossier_id,
      type: type || 'comment',
      actor_type: user.type as any,
      actor_id: user.database_id,
      actor_name: actorName,
      title,
      description,
      metadata,
      icon,
      color
    });

    if (result.success) {
      return res.json({
        success: true,
        data: { event_id: result.event_id },
        message: 'Événement ajouté à la timeline'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'ajout de l\'événement'
      });
    }

  } catch (error: any) {
    console.error('❌ Erreur POST timeline:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      details: error.message
    });
  }
});

/**
 * DELETE /api/dossiers/:id/timeline/:event_id
 * Supprimer un événement de la timeline (admin uniquement)
 */
router.delete('/:id/timeline/:event_id', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id: dossier_id, event_id } = req.params;

    if (!user || user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    // Vérifier que l'événement existe et appartient au dossier
    const { data: event } = await supabase
      .from('dossier_timeline')
      .select('id, dossier_id')
      .eq('id', event_id)
      .eq('dossier_id', dossier_id)
      .single();

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    // Supprimer l'événement
    const result = await DossierTimelineService.deleteEvent(event_id);

    if (result.success) {
      return res.json({
        success: true,
        message: 'Événement supprimé'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression'
      });
    }

  } catch (error: any) {
    console.error('❌ Erreur DELETE timeline:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      details: error.message
    });
  }
});

export default router;

