import express, { Router, Request, Response } from 'express';
import { authenticateUser } from '../middleware/authenticate';
import { AuthUser } from '../types/auth';
import { supabase } from '../lib/supabase';

const router = express.Router();

// Route pour obtenir le profil expert
router.get('/profile', authenticateUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    
    // Vérifier que l'utilisateur est expert
    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Récupérer le profil expert
    const { data: expert, error } = await supabase
      .from('Expert')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération du profil expert:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    res.json({
      success: true,
      data: expert
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil expert:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour mettre à jour le profil expert
router.put('/profile', authenticateUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { nom, prenom, telephone, specialite } = req.body;
    
    // Vérifier que l'utilisateur est expert
    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Mettre à jour le profil expert
    const { data: expert, error } = await supabase
      .from('Expert')
      .update({
        nom,
        prenom,
        telephone,
        specialite,
        updatedAt: new Date().toISOString()
      })
      .eq('id', authUser.id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour du profil expert:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    res.json({
      success: true,
      data: expert
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil expert:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour obtenir les assignations de l'expert
router.get('/assignments', authenticateUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    
    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Récupérer les assignations de l'expert
    const { data: assignments, error } = await supabase
      .from('expertassignment')
      .select(`
        *,
        Client (
          id,
          name,
          username,
          email,
          company_name
        ),
        ProduitEligible (
          id,
          nom,
          description
        )
      `)
      .eq('expert_id', authUser.id)
      .order('assignment_date', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des assignations:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des assignations:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour accepter une assignation
router.post('/assignments/:assignmentId/accept', authenticateUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { assignmentId } = req.params;
    
    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Mettre à jour le statut de l'assignation
    const { data: assignment, error } = await supabase
      .from('expertassignment')
      .update({
        status: 'accepted',
        accepted_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', assignmentId)
      .eq('expert_id', authUser.id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de l\'acceptation de l\'assignation:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Erreur lors de l\'acceptation de l\'assignation:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour rejeter une assignation
router.post('/assignments/:assignmentId/reject', authenticateUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { assignmentId } = req.params;
    const { reason } = req.body;
    
    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Mettre à jour le statut de l'assignation
    const { data: assignment, error } = await supabase
      .from('expertassignment')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        rejected_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', assignmentId)
      .eq('expert_id', authUser.id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors du rejet de l\'assignation:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Erreur lors du rejet de l\'assignation:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour mettre à jour la progression d'une assignation
router.put('/assignments/:assignmentId/progress', authenticateUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { assignmentId } = req.params;
    const { progress, notes } = req.body;
    
    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Mettre à jour la progression
    const { data: assignment, error } = await supabase
      .from('expertassignment')
      .update({
        progress: progress,
        notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', assignmentId)
      .eq('expert_id', authUser.id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour de la progression:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la progression:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour terminer une assignation
router.post('/assignments/:assignmentId/complete', authenticateUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { assignmentId } = req.params;
    const { documents } = req.body;
    
    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Terminer l'assignation
    const { data: assignment, error } = await supabase
      .from('expertassignment')
      .update({
        status: 'completed',
        progress: 100,
        completed_date: new Date().toISOString(),
        documents: documents || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', assignmentId)
      .eq('expert_id', authUser.id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la finalisation de l\'assignation:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Erreur lors de la finalisation de l\'assignation:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour obtenir les notifications de l'expert
router.get('/notifications', authenticateUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    
    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Récupérer les notifications de l'expert
    const { data: notifications, error } = await supabase
      .from('notification_final')
      .select('*')
      .eq('user_id', authUser.id)
      .eq('user_type', 'expert')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour marquer une notification comme lue
router.put('/notifications/:notificationId/read', authenticateUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { notificationId } = req.params;
    
    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Marquer comme lue
    const { data: notification, error } = await supabase
      .from('notification_final')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('user_id', authUser.id)
      .eq('user_type', 'expert')
      .select()
      .single();

    if (error) {
      console.error('Erreur lors du marquage de la notification:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Erreur lors du marquage de la notification:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour obtenir les analytics de l'expert
router.get('/analytics', authenticateUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    
    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Calculer les analytics
    const { data: assignments, error: assignmentsError } = await supabase
      .from('expertassignment')
      .select('*')
      .eq('expert_id', authUser.id);

    if (assignmentsError) {
      console.error('Erreur lors de la récupération des assignations pour analytics:', assignmentsError);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    // Calculer les métriques
    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(a => a.status === 'completed').length;
    const pendingAssignments = assignments.filter(a => a.status === 'pending').length;
    const totalEarnings = assignments
      .filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + (Number(a.compensation_amount) || 0), 0);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyEarnings = assignments
      .filter(a => {
        const completedDate = new Date(a.completed_date || '');
        return a.status === 'completed' && 
               completedDate.getMonth() === currentMonth && 
               completedDate.getFullYear() === currentYear;
      })
      .reduce((sum, a) => sum + (Number(a.compensation_amount) || 0), 0);

    const analytics = {
      totalAssignments,
      completedAssignments,
      pendingAssignments,
      totalEarnings,
      monthlyEarnings,
      clientSatisfaction: 4.8, // À calculer avec les vraies données
      performanceScore: 95, // À calculer avec les vraies données
      averageCompletionTime: 5.2, // En jours, à calculer avec les vraies données
      topProducts: [
        { name: 'TICPE', count: 12, revenue: 2400 },
        { name: 'URSSAF', count: 8, revenue: 1600 },
        { name: 'DFS', count: 5, revenue: 1000 }
      ],
              recentActivity: assignments
          .slice(0, 10)
          .map(a => ({
            type: 'assignment',
            description: `Dossier ${a.client_produit_eligible_id} ${a.status}`,
            timestamp: a.updated_at
          }))
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des analytics:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour obtenir les audits de l'expert
router.get('/audits', authenticateUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    
    // Vérifier que l'utilisateur est expert
    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Récupérer les audits de l'expert
    const { data: audits, error } = await supabase
      .from('Audit')
      .select(`
        *,
        Client (id, nom, prenom, email)
      `)
      .eq('expertId', authUser.id)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des audits:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    res.json({
      success: true,
      data: audits
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des audits:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router; 