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

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const offset = (page - 1) * pageSize;
    const limit = offset + pageSize - 1;

    // Récupérer les assignations de l'expert (pagination)
    const { data: assignments, error, count } = await supabase
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
      `, { count: 'exact' })
      .eq('expert_id', authUser.id)
      .order('assignment_date', { ascending: false })
      .range(offset, limit);

    if (error) {
      console.error('Erreur lors de la récupération des assignations:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    res.json({
      success: true,
      data: assignments,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 1
      }
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
      .from('Notification')
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
      .from('Notification')
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

// Route pour les analytics expert
router.get('/analytics', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { timeRange = '30d', expertId } = req.query;
    
    if (!expertId) {
      return res.status(400).json({ error: 'expertId requis' });
    }

    // Calculer la date de début
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const startDateISO = startDate.toISOString();
    const endDateISO = now.toISOString();

    // Récupérer les données analytics
    const [
      totalAssignments,
      completedAssignments,
      pendingAssignments,
      totalRevenue,
      monthlyRevenue,
      avgCompletionTime,
      topProducts,
      clientDistribution
    ] = await Promise.all([
      // Total des assignations
      supabase
        .from('expertassignment')
        .select('*', { count: 'exact', head: true })
        .eq('expert_id', expertId)
        .gte('created_at', startDateISO)
        .lte('created_at', endDateISO),

      // Assignations terminées
      supabase
        .from('expertassignment')
        .select('*', { count: 'exact', head: true })
        .eq('expert_id', expertId)
        .eq('status', 'terminé')
        .gte('created_at', startDateISO)
        .lte('created_at', endDateISO),

      // Assignations en cours
      supabase
        .from('expertassignment')
        .select('*', { count: 'exact', head: true })
        .eq('expert_id', expertId)
        .eq('status', 'en_cours')
        .gte('created_at', startDateISO)
        .lte('created_at', endDateISO),

      // Revenus totaux
      supabase
        .from('expertassignment')
        .select('compensation_amount')
        .eq('expert_id', expertId)
        .eq('status', 'terminé')
        .gte('created_at', startDateISO)
        .lte('created_at', endDateISO),

      // Revenus du mois
      supabase
        .from('expertassignment')
        .select('compensation_amount')
        .eq('expert_id', expertId)
        .eq('status', 'terminé')
        .gte('created_at', new Date(now.getFullYear(), now.getMonth(), 1).toISOString())
        .lte('created_at', endDateISO),

      // Temps moyen de completion
      supabase
        .from('expertassignment')
        .select('created_at, completed_at')
        .eq('expert_id', expertId)
        .eq('status', 'terminé')
        .gte('created_at', startDateISO)
        .lte('created_at', endDateISO),

      // Produits les plus performants
      supabase
        .from('expertassignment')
        .select(`
          ClientProduitEligible (
            ProduitEligible (
              nom
            )
          ),
          compensation_amount,
          status
        `)
        .eq('expert_id', expertId)
        .gte('created_at', startDateISO)
        .lte('created_at', endDateISO),

      // Répartition des clients
      supabase
        .from('expertassignment')
        .select(`
          ClientProduitEligible (
            Client (
              type_entreprise
            )
          )
        `)
        .eq('expert_id', expertId)
        .gte('created_at', startDateISO)
        .lte('created_at', endDateISO)
    ]);

    // Calculer les métriques
    const totalAssignmentsCount = totalAssignments.count || 0;
    const completedAssignmentsCount = completedAssignments.count || 0;
    const pendingAssignmentsCount = pendingAssignments.count || 0;
    
    const totalRevenueAmount = totalRevenue.data?.reduce((sum, item) => sum + (item.compensation_amount || 0), 0) || 0;
    const monthlyRevenueAmount = monthlyRevenue.data?.reduce((sum, item) => sum + (item.compensation_amount || 0), 0) || 0;
    
    const conversionRateValue = totalAssignmentsCount > 0 ? (completedAssignmentsCount / totalAssignmentsCount) * 100 : 0;
    
    // Calculer le temps moyen de completion
    let avgCompletionTimeValue = 0;
    if (avgCompletionTime.data && avgCompletionTime.data.length > 0) {
      const totalDays = avgCompletionTime.data.reduce((sum, item) => {
        if (item.created_at && item.completed_at) {
          const start = new Date(item.created_at);
          const end = new Date(item.completed_at);
          return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        }
        return sum;
      }, 0);
      avgCompletionTimeValue = totalDays / avgCompletionTime.data.length;
    }

    // Analyser les produits les plus performants
    const productStats = new Map<string, { count: number; revenue: number; completed: number }>();
    
    if (topProducts.data) {
      topProducts.data.forEach((assignment: any) => {
        const productName = assignment.ClientProduitEligible?.ProduitEligible?.nom || 'Inconnu';
        const revenue = assignment.compensation_amount || 0;
        const isCompleted = assignment.status === 'terminé';
        
        const current = productStats.get(productName) || { count: 0, revenue: 0, completed: 0 };
        productStats.set(productName, {
          count: current.count + 1,
          revenue: current.revenue + revenue,
          completed: current.completed + (isCompleted ? 1 : 0)
        });
      });
    }

    const topProductsData = Array.from(productStats.entries()).map(([name, stats]) => ({
      name,
      count: stats.count,
      revenue: stats.revenue,
      conversionRate: stats.count > 0 ? (stats.completed / stats.count) * 100 : 0,
      avgRevenue: stats.count > 0 ? stats.revenue / stats.count : 0
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Analyser la répartition des clients
    const clientTypeStats = new Map<string, number>();
    
    if (clientDistribution.data) {
      clientDistribution.data.forEach((assignment: any) => {
        const clientType = assignment.ClientProduitEligible?.Client?.type_entreprise || 'Inconnu';
        clientTypeStats.set(clientType, (clientTypeStats.get(clientType) || 0) + 1);
      });
    }

    const totalClients = Array.from(clientTypeStats.values()).reduce((sum, count) => sum + count, 0);
    const clientDistributionData = Array.from(clientTypeStats.entries()).map(([type, count]) => ({
      clientType: type,
      count,
      percentage: totalClients > 0 ? (count / totalClients) * 100 : 0
    }));

    // Créer les métriques
    const metrics = [
      {
        id: 'total-assignments',
        name: 'Total Assignations',
        value: totalAssignmentsCount,
        change: 12.5, // Simulé
        changeType: 'increase',
        format: 'number',
        icon: 'target',
        color: 'bg-blue-100 text-blue-600',
        trend: 'up'
      },
      {
        id: 'completed-assignments',
        name: 'Assignations Terminées',
        value: completedAssignmentsCount,
        change: 8.3,
        changeType: 'increase',
        format: 'number',
        icon: 'check-circle',
        color: 'bg-green-100 text-green-600',
        trend: 'up'
      },
      {
        id: 'monthly-revenue',
        name: 'Revenus du Mois',
        value: monthlyRevenueAmount,
        change: 15.2,
        changeType: 'increase',
        format: 'currency',
        icon: 'dollar-sign',
        color: 'bg-purple-100 text-purple-600',
        trend: 'up'
      },
      {
        id: 'conversion-rate',
        name: 'Taux de Conversion',
        value: conversionRateValue,
        change: 2.1,
        changeType: 'increase',
        format: 'percentage',
        icon: 'trending-up',
        color: 'bg-orange-100 text-orange-600',
        trend: 'up'
      },
      {
        id: 'avg-completion-time',
        name: 'Temps Moyen',
        value: avgCompletionTimeValue,
        change: -5.8,
        changeType: 'decrease',
        format: 'duration',
        icon: 'clock',
        color: 'bg-indigo-100 text-indigo-600',
        trend: 'down'
      },
      {
        id: 'client-satisfaction',
        name: 'Satisfaction Client',
        value: 4.2, // Simulé
        change: 0.3,
        changeType: 'increase',
        format: 'number',
        icon: 'award',
        color: 'bg-pink-100 text-pink-600',
        trend: 'up'
      }
    ];

    // Données de performance par mois (simulées pour l'instant)
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
    const performanceByMonth = months.map((month, index) => ({
      month,
      assignments: Math.floor(Math.random() * 20) + 10,
      revenue: Math.floor(Math.random() * 5000) + 2000,
      completionRate: Math.random() * 30 + 70,
      avgCompletionTime: Math.random() * 10 + 5
    }));

    // Analyse temporelle (simulée)
    const timeAnalysis = {
      averageResponseTime: 2.5,
      averageProcessingTime: 8.3,
      peakHours: ['9h-11h', '14h-16h'],
      preferredDays: ['Mardi', 'Jeudi', 'Vendredi']
    };

    res.json({
      metrics,
      performanceByMonth,
      topProducts: topProductsData,
      clientDistribution: clientDistributionData,
      timeAnalysis
    });

  } catch (error) {
    console.error('Erreur analytics expert:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des analytics' });
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

// Route pour obtenir les ClientProduitEligible de l'expert
router.get('/client-produits-eligibles', authenticateUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    
    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Récupérer les ClientProduitEligible assignés à l'expert
    const { data: clientProduits, error } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        Client (
          id,
          name,
          email,
          company_name,
          phone_number,
          city,
          siren
        ),
        ProduitEligible (
          id,
          nom,
          description,
          category
        ),
        Expert (
          id,
          name,
          company_name,
          email
        )
      `)
      .eq('expert_id', authUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des ClientProduitEligible:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    res.json({
      success: true,
      data: clientProduits
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des ClientProduitEligible:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router; 