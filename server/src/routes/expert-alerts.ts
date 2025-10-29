import express, { Router, Request, Response } from 'express';
import { AuthUser } from '../types/auth';
import { supabase } from '../lib/supabase';
import { enhancedAuthMiddleware } from '../middleware/auth-enhanced';

const router = express.Router();

// ============================================================================
// TYPES
// ============================================================================

interface Alert {
  id?: string;
  expert_id: string;
  type: 'critique' | 'important' | 'attention';
  category: string;
  title: string;
  description: string;
  dossier_id?: string;
  rdv_id?: string;
  status: 'active' | 'read' | 'archived' | 'snoozed';
  snoozed_until?: string;
  created_at?: string;
  read_at?: string;
  archived_at?: string;
  metadata?: any;
}

// ============================================================================
// HELPER: Créer/Mettre à jour une alerte
// ============================================================================

async function upsertAlert(alert: Alert): Promise<void> {
  // Vérifier si l'alerte existe déjà (même dossier/rdv)
  const { data: existing } = await supabase
    .from('ExpertAlert')
    .select('id, status')
    .eq('expert_id', alert.expert_id)
    .eq('category', alert.category)
    .or(`dossier_id.eq.${alert.dossier_id},rdv_id.eq.${alert.rdv_id}`)
    .single();

  if (existing) {
    // Si l'alerte est archivée ou lue, ne pas recréer
    if (existing.status === 'archived') {
      return;
    }
    // Mettre à jour l'alerte existante
    await supabase
      .from('ExpertAlert')
      .update({
        title: alert.title,
        description: alert.description,
        type: alert.type,
        metadata: alert.metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);
  } else {
    // Créer nouvelle alerte
    await supabase
      .from('ExpertAlert')
      .insert({
        expert_id: alert.expert_id,
        type: alert.type,
        category: alert.category,
        title: alert.title,
        description: alert.description,
        dossier_id: alert.dossier_id,
        rdv_id: alert.rdv_id,
        status: 'active',
        metadata: alert.metadata || {},
        created_at: new Date().toISOString()
      });
  }
}

// ============================================================================
// ROUTES
// ============================================================================

// GET /api/expert/alerts - Lister les alertes actives
router.get('/', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser;
    
    if (!authUser || authUser.type !== 'expert') {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }

    const expertId = authUser.database_id || authUser.id;
    const { status = 'active' } = req.query;

    // Récupérer les alertes selon le statut
    let query = supabase
      .from('ExpertAlert')
      .select('*')
      .eq('expert_id', expertId)
      .order('created_at', { ascending: false });

    if (status === 'active') {
      query = query.eq('status', 'active');
    } else if (status === 'read') {
      query = query.eq('status', 'read');
    } else if (status === 'archived') {
      query = query.eq('status', 'archived');
    } else if (status === 'snoozed') {
      query = query.eq('status', 'snoozed');
    }

    const { data: alerts, error } = await query;

    if (error) {
      console.error('❌ Erreur récupération alertes:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur serveur' 
      });
    }

    // Filtrer les alertes snoozées dont la date est dépassée
    const now = new Date();
    const filteredAlerts = (alerts || []).filter(alert => {
      if (alert.status === 'snoozed' && alert.snoozed_until) {
        return new Date(alert.snoozed_until) > now;
      }
      return true;
    });

    return res.json({
      success: true,
      data: filteredAlerts
    });
  } catch (error) {
    console.error('❌ Erreur récupération alertes:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// PUT /api/expert/alerts/:id/read - Marquer comme lue
router.put('/:id/read', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser;
    
    if (!authUser || authUser.type !== 'expert') {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }

    const { id } = req.params;
    const expertId = authUser.database_id || authUser.id;

    const { data, error } = await supabase
      .from('ExpertAlert')
      .update({
        status: 'read',
        read_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('expert_id', expertId)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur marquage alerte lue:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur serveur' 
      });
    }

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('❌ Erreur marquage alerte lue:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// PUT /api/expert/alerts/:id/archive - Archiver
router.put('/:id/archive', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser;
    
    if (!authUser || authUser.type !== 'expert') {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }

    const { id } = req.params;
    const expertId = authUser.database_id || authUser.id;

    const { data, error } = await supabase
      .from('ExpertAlert')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('expert_id', expertId)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur archivage alerte:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur serveur' 
      });
    }

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('❌ Erreur archivage alerte:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// PUT /api/expert/alerts/:id/snooze - Reporter (snooze)
router.put('/:id/snooze', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser;
    
    if (!authUser || authUser.type !== 'expert') {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }

    const { id } = req.params;
    const { duration } = req.body; // duration en heures: 1, 3, 24, 72
    const expertId = authUser.database_id || authUser.id;

    if (!duration || ![1, 3, 24, 72].includes(duration)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Durée invalide. Valeurs acceptées: 1, 3, 24, 72 heures' 
      });
    }

    const snoozedUntil = new Date();
    snoozedUntil.setHours(snoozedUntil.getHours() + duration);

    const { data, error } = await supabase
      .from('ExpertAlert')
      .update({
        status: 'snoozed',
        snoozed_until: snoozedUntil.toISOString()
      })
      .eq('id', id)
      .eq('expert_id', expertId)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur snooze alerte:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur serveur' 
      });
    }

    return res.json({
      success: true,
      data,
      message: `Alerte reportée de ${duration}h`
    });
  } catch (error) {
    console.error('❌ Erreur snooze alerte:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// GET /api/expert/alerts/history - Historique des alertes archivées
router.get('/history', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser;
    
    if (!authUser || authUser.type !== 'expert') {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }

    const expertId = authUser.database_id || authUser.id;
    const { limit = 50, offset = 0 } = req.query;

    const { data: alerts, error } = await supabase
      .from('ExpertAlert')
      .select('*')
      .eq('expert_id', expertId)
      .in('status', ['read', 'archived'])
      .order('archived_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
      console.error('❌ Erreur récupération historique alertes:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur serveur' 
      });
    }

    return res.json({
      success: true,
      data: alerts || []
    });
  } catch (error) {
    console.error('❌ Erreur récupération historique alertes:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// POST /api/expert/alerts/mark-all-read - Marquer toutes comme lues
router.post('/mark-all-read', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser;
    
    if (!authUser || authUser.type !== 'expert') {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }

    const expertId = authUser.database_id || authUser.id;

    const { data, error } = await supabase
      .from('ExpertAlert')
      .update({
        status: 'read',
        read_at: new Date().toISOString()
      })
      .eq('expert_id', expertId)
      .eq('status', 'active')
      .select();

    if (error) {
      console.error('❌ Erreur marquage toutes alertes lues:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur serveur' 
      });
    }

    return res.json({
      success: true,
      data,
      message: `${data?.length || 0} alerte(s) marquée(s) comme lue(s)`
    });
  } catch (error) {
    console.error('❌ Erreur marquage toutes alertes lues:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// POST /api/expert/alerts/sync - Synchroniser les alertes (génération automatique)
router.post('/sync', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser;
    
    if (!authUser || authUser.type !== 'expert') {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }

    const expertId = authUser.database_id || authUser.id;

    // 1. ALERTES RDV NON CONFIRMÉS
    const { data: rdvs } = await supabase
      .from('RDV')
      .select(`
        id,
        scheduled_date,
        scheduled_time,
        status,
        confirmation_sent,
        Client:client_id (
          company_name,
          name
        )
      `)
      .eq('expert_id', expertId)
      .eq('status', 'scheduled')
      .eq('confirmation_sent', false)
      .gte('scheduled_date', new Date().toISOString().split('T')[0]);

    for (const rdv of (rdvs || [])) {
      await upsertAlert({
        expert_id: expertId,
        type: 'critique',
        category: 'rdv',
        title: 'RDV NON CONFIRMÉ',
        description: `RDV ${rdv.scheduled_date} à ${rdv.scheduled_time} - Pas de confirmation client`,
        rdv_id: rdv.id,
        status: 'active',
        metadata: { clientName: rdv.Client?.company_name || rdv.Client?.name || 'Client' }
      });
    }

    // 2. ALERTES DOSSIERS BLOQUÉS
    const { data: dossiersBloqués } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        updated_at,
        "montantFinal",
        Client:clientId (
          company_name,
          name
        )
      `)
      .eq('expert_id', expertId)
      .eq('statut', 'en_cours');

    const now = new Date();
    for (const dossier of (dossiersBloqués || [])) {
      const daysSinceUpdate = Math.floor((now.getTime() - new Date(dossier.updated_at).getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceUpdate >= 8) {
        await upsertAlert({
          expert_id: expertId,
          type: 'critique',
          category: 'dossier',
          title: 'DOSSIER BLOQUÉ',
          description: `Pas d'interaction depuis ${daysSinceUpdate} jours`,
          dossier_id: dossier.id,
          status: 'active',
          metadata: { 
            clientName: dossier.Client?.company_name || dossier.Client?.name || 'Client',
            daysSinceUpdate 
          }
        });
      }
    }

    // 3. ALERTES PROSPECTS CHAUDS SANS RDV
    const { data: prospects } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        "montantFinal",
        Client:clientId (
          id,
          company_name,
          name
        )
      `)
      .eq('expert_id', expertId)
      .eq('statut', 'eligible')
      .gte('montantFinal', 20000);

    for (const prospect of (prospects || [])) {
      // Vérifier s'il y a un RDV
      const { data: rdvExists } = await supabase
        .from('RDV')
        .select('id')
        .eq('expert_id', expertId)
        .eq('client_id', prospect.Client?.id)
        .limit(1);

      if (!rdvExists || rdvExists.length === 0) {
        await upsertAlert({
          expert_id: expertId,
          type: 'important',
          category: 'prospect',
          title: 'PROSPECT CHAUD SANS RDV',
          description: `Prospect éligible • ${prospect.montantFinal.toLocaleString()}€ potentiel`,
          dossier_id: prospect.id,
          status: 'active',
          metadata: { 
            clientName: prospect.Client?.company_name || prospect.Client?.name || 'Client',
            montant: prospect.montantFinal
          }
        });
      }
    }

    return res.json({
      success: true,
      message: 'Alertes synchronisées avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur synchronisation alertes:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

export default router;

