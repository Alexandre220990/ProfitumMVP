import express, { Router, Request, Response } from 'express';
import { authenticateUser } from '../middleware/authenticate';
import { AuthUser } from '../types/auth';
import { supabase } from '../lib/supabase';
import { ReminderService } from '../services/reminderService';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();
const reminderService = new ReminderService();

/**
 * GET /api/reminders - Récupérer les relances de l'utilisateur connecté
 */
router.get('/', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthUser;
  const { status, priority, type } = req.query;

  try {
    let query = supabase
      .from('Reminder')
      .select(`
        *,
        Client (id, email, company_name, first_name, last_name),
        Expert (id, email, name),
        ClientProduitEligible (
          id,
          ProduitEligible (nom, description)
        )
      `);

    // Filtrer selon le type d'utilisateur
    if (authUser.type === 'client') {
      query = query.eq('client_id', authUser.id);
    } else if (authUser.type === 'expert') {
      query = query.eq('expert_id', authUser.id);
    }
    // Admin voit toutes les relances

    // Filtres optionnels
    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (type) {
      query = query.eq('type', type);
    }

    const { data: reminders, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération relances:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    res.json({
      success: true,
      data: reminders || []
    });
  } catch (error) {
    console.error('❌ Erreur route relances:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

/**
 * GET /api/reminders/:id - Récupérer une relance spécifique
 */
router.get('/:id', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthUser;
  const { id } = req.params;

  try {
    const { data: reminder, error } = await supabase
      .from('Reminder')
      .select(`
        *,
        Client (id, email, company_name, first_name, last_name),
        Expert (id, email, name),
        ClientProduitEligible (
          id,
          ProduitEligible (nom, description)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !reminder) {
      return res.status(404).json({ success: false, message: 'Relance non trouvée' });
    }

    // Vérifier les permissions
    if (authUser.type === 'client' && reminder.client_id !== authUser.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }
    if (authUser.type === 'expert' && reminder.expert_id !== authUser.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    res.json({
      success: true,
      data: reminder
    });
  } catch (error) {
    console.error('❌ Erreur récupération relance:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

/**
 * PUT /api/reminders/:id/handle - Marquer une relance comme traitée
 */
router.put('/:id/handle', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthUser;
  const { id } = req.params;
  const { notes } = req.body;

  try {
    // Vérifier que la relance existe et que l'utilisateur a les permissions
    const { data: reminder, error: fetchError } = await supabase
      .from('Reminder')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !reminder) {
      return res.status(404).json({ success: false, message: 'Relance non trouvée' });
    }

    // Vérifier les permissions
    if (authUser.type === 'client' && reminder.client_id !== authUser.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }
    if (authUser.type === 'expert' && reminder.expert_id !== authUser.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Marquer comme traitée
    const { data: updatedReminder, error: updateError } = await supabase
      .from('Reminder')
      .update({
        status: 'handled',
        handled_at: new Date().toISOString(),
        notes: notes || reminder.notes
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur mise à jour relance:', updateError);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    res.json({
      success: true,
      data: updatedReminder,
      message: 'Relance marquée comme traitée'
    });
  } catch (error) {
    console.error('❌ Erreur traitement relance:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

/**
 * POST /api/reminders/check - Déclencher manuellement la vérification des relances (admin uniquement)
 */
router.post('/check', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthUser;

  // Vérifier que l'utilisateur est admin
  if (authUser.type !== 'admin') {
    return res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs' });
  }

  try {
    // Déclencher la vérification des relances
    await reminderService.checkAndCreateReminders();

    res.json({
      success: true,
      message: 'Vérification des relances déclenchée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur vérification relances:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

/**
 * GET /api/reminders/stats - Statistiques des relances (admin uniquement)
 */
router.get('/stats/overview', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthUser;

  // Vérifier que l'utilisateur est admin
  if (authUser.type !== 'admin') {
    return res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs' });
  }

  try {
    // Statistiques par statut
    const { data: statusStats, error: statusError } = await supabase
      .from('Reminder')
      .select('status')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // 30 derniers jours

    if (statusError) {
      throw statusError;
    }

    // Statistiques par type
    const { data: typeStats, error: typeError } = await supabase
      .from('Reminder')
      .select('type')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (typeError) {
      throw typeError;
    }

    // Statistiques par priorité
    const { data: priorityStats, error: priorityError } = await supabase
      .from('Reminder')
      .select('priority')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (priorityError) {
      throw priorityError;
    }

    // Compter les occurrences
    const countByStatus = statusStats?.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const countByType = typeStats?.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const countByPriority = priorityStats?.reduce((acc, item) => {
      acc[item.priority] = (acc[item.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Relances en retard
    const { data: overdueReminders, error: overdueError } = await supabase
      .from('Reminder')
      .select('id')
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString());

    if (overdueError) {
      throw overdueError;
    }

    res.json({
      success: true,
      data: {
        totalLast30Days: statusStats?.length || 0,
        byStatus: countByStatus,
        byType: countByType,
        byPriority: countByPriority,
        overdue: overdueReminders?.length || 0,
        pending: countByStatus.pending || 0,
        handled: countByStatus.handled || 0
      }
    });
  } catch (error) {
    console.error('❌ Erreur statistiques relances:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

/**
 * PUT /api/reminders/config - Mettre à jour la configuration des relances (admin uniquement)
 */
router.put('/config', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthUser;

  // Vérifier que l'utilisateur est admin
  if (authUser.type !== 'admin') {
    return res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs' });
  }

  const { dossierIncompletDays, documentManquantDays, slaExpertDays, slaClientDays } = req.body;

  try {
    // Mettre à jour la configuration
    reminderService.updateConfig({
      dossierIncompletDays,
      documentManquantDays,
      slaExpertDays,
      slaClientDays
    });

    res.json({
      success: true,
      message: 'Configuration des relances mise à jour'
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour configuration:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

export default router; 