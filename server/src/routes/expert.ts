import express, { Router, Request, Response } from 'express';
import { AuthUser } from '../types/auth';
import { supabase } from '../lib/supabase';
import { normalizeDossierStatus } from '../utils/dossierStatus';

const router = express.Router();

const DOSSIER_REVIEW_NORMALIZED_STATUSES = new Set<string>([
  'pending_upload',
  'pending_admin_validation',
  'admin_validated',
  'expert_assigned',
  'expert_pending_validation',
  'documents_requested',
  'complementary_documents_upload_pending',
  'complementary_documents_sent',
  'complementary_documents_validated',
  'validation_pending',
  'audit_in_progress'
]);

const DOSSIER_REVIEW_RAW_STATUSES = new Set<string>([
  'documents_completes',
  'audit_en_cours'
]);

const resolveDossierReviewable = (statut: string | null): boolean => {
  if (!statut) return false;
  if (DOSSIER_REVIEW_RAW_STATUSES.has(statut)) {
    return true;
  }
  const normalized = normalizeDossierStatus(statut);
  return DOSSIER_REVIEW_NORMALIZED_STATUSES.has(normalized);
};

const getDocumentValidationStatus = (doc: any): string => {
  if (!doc) return 'pending';
  return doc.validation_status || doc.status || 'pending';
};

// Route pour obtenir le profil expert
router.get('/profile', async (req: Request, res: Response) => {
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

    // Mapper client_fee_percentage vers compensation pour compatibilité frontend
    const expertWithCompensation = expert ? {
      ...expert,
      compensation: expert.client_fee_percentage !== null && expert.client_fee_percentage !== undefined
        ? expert.client_fee_percentage * 100 // Convertir décimal en pourcentage
        : null
    } : null;

    return res.json({
      success: true,
      data: expertWithCompensation
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil expert:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour mettre à jour le profil expert
router.put('/profile', async (req: Request, res: Response) => {
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

    return res.json({
      success: true,
      data: expert
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil expert:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour obtenir les assignations de l'expert
router.get('/assignments', async (req: Request, res: Response) => {
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

    return res.json({
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
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour accepter une assignation
router.post('/assignments/:assignmentId/accept', async (req: Request, res: Response) => {
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

    return res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Erreur lors de l\'acceptation de l\'assignation:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour rejeter une assignation
router.post('/assignments/:assignmentId/reject', async (req: Request, res: Response) => {
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

    return res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Erreur lors du rejet de l\'assignation:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour mettre à jour la progression d'une assignation
router.put('/assignments/:assignmentId/progress', async (req: Request, res: Response) => {
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

    return res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la progression:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour terminer une assignation
router.post('/assignments/:assignmentId/complete', async (req: Request, res: Response) => {
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

    return res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Erreur lors de la finalisation de l\'assignation:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour les analytics expert
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    
    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Récupérer les statistiques de l'expert avec gestion d'erreur
    let totalAssignments = 0;
    let completedAudits = 0;
    let pendingAudits = 0;

    try {
      const { data: assignments } = await supabase
        .from('ExpertAssignment')
        .select('*')
        .eq('expert_id', authUser.id);

      totalAssignments = assignments?.length || 0;
    } catch (assignmentError) {
      console.log('Erreur récupération assignments, utilisation de valeurs par défaut:', assignmentError);
    }

    try {
      const { data: audits } = await supabase
        .from('Audit')
        .select('*')
        .eq('expert_id', authUser.id);

      completedAudits = audits?.filter(audit => audit.status === 'terminé').length || 0;
      pendingAudits = audits?.filter(audit => audit.status === 'en_cours').length || 0;
    } catch (auditError) {
      console.log('Erreur récupération audits, utilisation de valeurs par défaut:', auditError);
    }

    const analytics = {
      totalAssignments,
      completedAudits,
      pendingAudits,
      completionRate: totalAssignments > 0 ? (completedAudits / totalAssignments) * 100 : 0,
      averageResponseTime: 24, // heures
      clientSatisfaction: 4.8,
      revenueThisMonth: 15000,
      revenueLastMonth: 12000
    };

    return res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des analytics expert:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour obtenir les métriques business de l'expert
router.get('/business', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    
    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Récupérer les métriques business
    const { data: assignments } = await supabase
      .from('ExpertAssignment')
      .select('*')
      .eq('expert_id', authUser.id);

    const businessMetrics = {
      totalClients: assignments?.length || 0,
      activeProjects: assignments?.filter(assignment => assignment.status === 'active').length || 0,
      completedProjects: assignments?.filter(assignment => assignment.status === 'completed').length || 0,
      averageProjectValue: 5000,
      monthlyRevenue: 15000,
      yearlyRevenue: 180000,
      clientRetentionRate: 85
    };

    return res.json({
      success: true,
      data: businessMetrics
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des métriques business:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour obtenir l'historique des revenus RÉELS
router.get('/revenue-history', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    
    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    const expertId = authUser.database_id || authUser.id;

    // Récupérer la date de création et le taux de commission de l'expert
    const { data: expertData } = await supabase
      .from('Expert')
      .select('created_at, compensation:client_fee_percentage')
      .eq('id', expertId)
      .single();

    const expertCreatedAt = expertData?.created_at ? new Date(expertData.created_at) : new Date();
    const expertCommissionRate = expertData?.compensation || 10; // Par défaut 10% si non défini

    // Récupérer tous les CPE terminés de l'expert (refund_completed)
    // Inclut les dossiers où expert_id = expertId OU expert_pending_id = expertId
    const { data: cpeData, error } = await supabase
      .from('ClientProduitEligible')
      .select('"montantFinal", updated_at, statut, "date_remboursement"')
      .or(`expert_id.eq.${expertId},expert_pending_id.eq.${expertId}`)
      .eq('statut', 'refund_completed')
      .order('updated_at', { ascending: true });

    if (error) {
      console.error('❌ Erreur récupération revenus:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    // Générer tous les mois depuis la création du compte jusqu'à maintenant
    const months: { key: string; name: string; revenue: number; assignments: number }[] = [];
    const now = new Date();
    let currentDate = new Date(expertCreatedAt.getFullYear(), expertCreatedAt.getMonth(), 1);

    while (currentDate <= now) {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const monthName = currentDate.toLocaleDateString('fr-FR', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      months.push({
        key: monthKey,
        name: monthName.charAt(0).toUpperCase() + monthName.slice(1), // Capitaliser
        revenue: 0,
        assignments: 0
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Remplir avec les données réelles
    (cpeData || []).forEach((cpe: any) => {
      const date = new Date(cpe.updated_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthIndex = months.findIndex(m => m.key === monthKey);
      if (monthIndex !== -1) {
        const commission = (cpe.montantFinal || 0) * (expertCommissionRate / 100); // Commission personnalisée expert
        months[monthIndex].revenue += commission;
        months[monthIndex].assignments += 1;
      }
    });

    // Retourner les données formatées (du plus ancien au plus récent)
    const revenueData = months.map(m => ({
      month: m.name,
      revenue: Math.round(m.revenue * 100) / 100,
      assignments: m.assignments
    }));

    return res.json({
      success: true,
      data: revenueData
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique des revenus:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour obtenir la performance des produits RÉELLE
router.get('/product-performance', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    
    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    const expertId = authUser.database_id || authUser.id;

    // Récupérer le taux de commission de l'expert
    const { data: expertData } = await supabase
      .from('Expert')
      .select('compensation:client_fee_percentage')
      .eq('id', expertId)
      .single();

    const expertCommissionRate = expertData?.compensation || 10; // Par défaut 10% si non défini

    // Récupérer tous les CPE de l'expert (tous statuts)
    // Inclut les dossiers où expert_id = expertId OU expert_pending_id = expertId
    const { data: cpeData, error } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        "montantFinal",
        statut,
        metadata,
        ProduitEligible:produitId (
          nom,
          categorie
        )
      `)
      .or(`expert_id.eq.${expertId},expert_pending_id.eq.${expertId}`);

    if (error) {
      console.error('❌ Erreur récupération produits:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    // Grouper par produit
    const productStats: Record<string, {
      assignments: number;
      revenue: number;
      completed: number;
      totalRating: number;
      ratingCount: number;
    }> = {};

    (cpeData || []).forEach((cpe: any) => {
      const productName = cpe.ProduitEligible?.nom || 'Produit inconnu';
      
      if (!productStats[productName]) {
        productStats[productName] = {
          assignments: 0,
          revenue: 0,
          completed: 0,
          totalRating: 0,
          ratingCount: 0
        };
      }

      productStats[productName].assignments += 1;

      if (cpe.statut === 'refund_completed') {
        productStats[productName].completed += 1;
        const commission = (cpe.montantFinal || 0) * (expertCommissionRate / 100);
        productStats[productName].revenue += commission;
      }

      // Rating depuis metadata si disponible
      if (cpe.metadata?.rating) {
        productStats[productName].totalRating += cpe.metadata.rating;
        productStats[productName].ratingCount += 1;
      }
    });

    // Formater les données
    const productPerformance = Object.entries(productStats).map(([product, stats]) => ({
      product,
      assignments: stats.assignments,
      revenue: Math.round(stats.revenue * 100) / 100,
      successRate: stats.assignments > 0 
        ? Math.round((stats.completed / stats.assignments) * 100 * 10) / 10
        : 0,
      averageRating: stats.ratingCount > 0
        ? Math.round((stats.totalRating / stats.ratingCount) * 10) / 10
        : 0
    }));

    // Trier par revenus décroissants
    productPerformance.sort((a, b) => b.revenue - a.revenue);

    return res.json({
      success: true,
      data: productPerformance
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la performance des produits:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour obtenir la performance des clients RÉELLE
router.get('/client-performance', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    
    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    const expertId = authUser.database_id || authUser.id;

    // Récupérer le taux de commission de l'expert
    const { data: expertData } = await supabase
      .from('Expert')
      .select('compensation:client_fee_percentage')
      .eq('id', expertId)
      .single();

    const expertCommissionRate = expertData?.compensation || 10; // Par défaut 10% si non défini

    // Récupérer tous les CPE de l'expert avec infos client
    // Inclut les dossiers où expert_id = expertId OU expert_pending_id = expertId
    const { data: cpeData, error } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        "clientId",
        "montantFinal",
        statut,
        updated_at,
        metadata,
        Client:clientId (
          id,
          company_name,
          name,
          first_name,
          last_name
        )
      `)
      .or(`expert_id.eq.${expertId},expert_pending_id.eq.${expertId}`);

    if (error) {
      console.error('❌ Erreur récupération clients:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    // Grouper par client
    const clientStats: Record<string, {
      clientId: string;
      clientName: string;
      totalAssignments: number;
      totalRevenue: number;
      lastAssignment: string;
      totalRating: number;
      ratingCount: number;
    }> = {};

    (cpeData || []).forEach((cpe: any) => {
      const clientId = cpe.clientId;
      const clientName = cpe.Client?.company_name || 
                        `${cpe.Client?.first_name || ''} ${cpe.Client?.last_name || ''}`.trim() ||
                        cpe.Client?.name ||
                        'Client inconnu';
      
      if (!clientStats[clientId]) {
        clientStats[clientId] = {
          clientId,
          clientName,
          totalAssignments: 0,
          totalRevenue: 0,
          lastAssignment: cpe.updated_at,
          totalRating: 0,
          ratingCount: 0
        };
      }

      clientStats[clientId].totalAssignments += 1;

      if (cpe.statut === 'refund_completed') {
        const commission = (cpe.montantFinal || 0) * (expertCommissionRate / 100);
        clientStats[clientId].totalRevenue += commission;
      }

      // Mettre à jour la dernière mission
      if (new Date(cpe.updated_at) > new Date(clientStats[clientId].lastAssignment)) {
        clientStats[clientId].lastAssignment = cpe.updated_at;
      }

      // Rating depuis metadata si disponible
      if (cpe.metadata?.rating) {
        clientStats[clientId].totalRating += cpe.metadata.rating;
        clientStats[clientId].ratingCount += 1;
      }
    });

    // Formater les données
    const clientPerformance = Object.values(clientStats).map(stats => ({
      clientId: stats.clientId,
      clientName: stats.clientName,
      totalAssignments: stats.totalAssignments,
      totalRevenue: Math.round(stats.totalRevenue * 100) / 100,
      averageRating: stats.ratingCount > 0
        ? Math.round((stats.totalRating / stats.ratingCount) * 10) / 10
        : 0,
      lastAssignment: stats.lastAssignment
    }));

    // Trier par revenus décroissants
    clientPerformance.sort((a, b) => b.totalRevenue - a.totalRevenue);

    return res.json({
      success: true,
      data: clientPerformance
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la performance des clients:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour obtenir l'agenda de l'expert
router.get('/agenda', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    
    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Récupérer les événements de l'agenda
    const { data: events } = await supabase
      .from('ExpertAgenda')
      .select('*')
      .eq('expert_id', authUser.id)
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true });

    const agenda = events || [];

    return res.json({
      success: true,
      data: agenda
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'agenda:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour la messagerie expert (redirection vers le système unifié)
router.get('/messagerie-expert', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    
    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Rediriger vers le système de messagerie unifié
    // L'expert peut accéder à toutes ses conversations via /api/messaging/conversations
    return res.json({
      success: true,
      message: 'Utilisez /api/messaging/conversations pour accéder à la messagerie',
      redirect: '/api/messaging/conversations',
      data: {
        expert_id: authUser.id,
        type: 'expert'
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la messagerie:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour obtenir les données business de l'expert
router.get('/business', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    
    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Récupérer les données business de l'expert
    const { data: businessData, error } = await supabase
      .from('Expert')
      .select(`
        id,
        name,
        company_name,
        specializations,
        experience,
        rating,
        compensation:client_fee_percentage,
        total_revenue,
        total_clients,
        active_assignments
      `)
      .eq('id', authUser.id)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération des données business:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    return res.json({
      success: true,
      data: businessData
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données business:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================================
// ROUTE : HISTORIQUE DES REVENUS
// ============================================================================

// GET /api/expert/revenue-history - Historique des revenus par mois
router.get('/revenue-history', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const expertId = authUser.database_id || authUser.id;
    
    const { data: cpeData, error } = await supabase
      .from('ClientProduitEligible')
      .select(`
        "montantFinal",
        created_at
      `)
      .eq('expert_id', expertId)
      .eq('statut', 'termine')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération revenus:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    // Grouper par mois
    const revenueByMonth: { [key: string]: { revenue: number; assignments: number } } = {};
    
    (cpeData || []).forEach((cpe: any) => {
      const date = new Date(cpe.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      
      if (!revenueByMonth[monthKey]) {
        revenueByMonth[monthKey] = { revenue: 0, assignments: 0 };
      }
      
      const commission = (cpe.montantFinal || 0) * 0.10; // 10% commission
      revenueByMonth[monthKey].revenue += commission;
      revenueByMonth[monthKey].assignments += 1;
    });

    // Convertir en array et formater
    const revenueData = Object.entries(revenueByMonth).map(([monthKey, data]) => {
      const [year, month] = monthKey.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('fr-FR', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      return {
        month: monthName,
        revenue: data.revenue,
        assignments: data.assignments
      };
    }).sort((a, b) => {
      // Tri par date décroissante
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateB.getTime() - dateA.getTime();
    });

    return res.json({
      success: true,
      data: revenueData
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique des revenus:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================================
// ROUTE : PERFORMANCE PAR PRODUIT
// ============================================================================

// GET /api/expert/product-performance - Statistiques par produit
router.get('/product-performance', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const expertId = authUser.database_id || authUser.id;
    
    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Récupérer les CPE et grouper par produit
    const { data: cpeData, error } = await supabase
      .from('ClientProduitEligible')
      .select(`
        "montantFinal",
        statut,
        ProduitEligible:produitId (
          nom
        )
      `)
      .eq('expert_id', expertId);

    if (error) {
      console.error('Erreur récupération performance produits:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    // Grouper par produit
    const productStats: { [key: string]: { 
      assignments: number; 
      revenue: number; 
      completed: number;
    } } = {};

    (cpeData || []).forEach((cpe: any) => {
      const productName = cpe.ProduitEligible?.nom || 'Produit inconnu';
      
      if (!productStats[productName]) {
        productStats[productName] = {
          assignments: 0,
          revenue: 0,
          completed: 0
        };
      }
      
      productStats[productName].assignments++;
      
      if (cpe.statut === 'termine') {
        productStats[productName].completed++;
        const commission = (cpe.montantFinal || 0) * 0.10;
        productStats[productName].revenue += commission;
      }
    });

    // Formater en array
    const productPerformance = Object.entries(productStats).map(([productName, stats]) => ({
      product: productName,
      assignments: stats.assignments,
      revenue: stats.revenue,
      successRate: stats.assignments > 0 ? (stats.completed / stats.assignments) * 100 : 0,
      averageRating: 0 // TODO: Implémenter avec système de notation
    }));

    return res.json({
      success: true,
      data: productPerformance
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des performances par produit:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour obtenir les performances par client
router.get('/client-performance', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const expertId = authUser.database_id || authUser.id;
    
    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Récupérer les CPE et grouper par client
    const { data: cpeData, error } = await supabase
      .from('ClientProduitEligible')
      .select(`
        "montantFinal",
        statut,
        updated_at,
        Client:clientId (
          id,
          name,
          company_name,
          email
        )
      `)
      .eq('expert_id', expertId);

    if (error) {
      console.error('Erreur récupération performance clients:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    // Grouper par client
    const clientStats: { [key: string]: {
      clientId: string;
      clientName: string;
      totalAssignments: number;
      totalRevenue: number;
      lastAssignment: string;
    } } = {};

    (cpeData || []).forEach((cpe: any) => {
      const client = Array.isArray(cpe.Client) ? cpe.Client[0] : cpe.Client;
      const clientId = client?.id;
      const clientName = client?.company_name || client?.name || 'Client';
      
      if (clientId) {
        if (!clientStats[clientId]) {
          clientStats[clientId] = {
            clientId,
            clientName,
            totalAssignments: 0,
            totalRevenue: 0,
            lastAssignment: cpe.updated_at
          };
        }
        
        clientStats[clientId].totalAssignments++;
        
        if (cpe.statut === 'termine') {
          const commission = (cpe.montantFinal || 0) * 0.10;
          clientStats[clientId].totalRevenue += commission;
        }
        
        // Garder la date la plus récente
        if (new Date(cpe.updated_at) > new Date(clientStats[clientId].lastAssignment)) {
          clientStats[clientId].lastAssignment = cpe.updated_at;
        }
      }
    });

    // Formater en array
    const clientPerformance = Object.values(clientStats).map(stats => ({
      ...stats,
      averageRating: 0 // TODO: Implémenter avec système de notation
    }));

    return res.json({
      success: true,
      data: clientPerformance
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des performances par client:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour obtenir l'agenda de l'expert
router.get('/agenda', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    
    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Récupérer les événements agenda de l'expert
    const { data: agendaData, error } = await supabase
      .from('ExpertAssignment')
      .select(`
        id,
        status,
        deadline,
        created_at,
        Client (name, company_name),
        Audit (type, description)
      `)
      .eq('expert_id', authUser.id)
      .order('deadline', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération de l\'agenda:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    return res.json({
      success: true,
      data: agendaData || []
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'agenda:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour obtenir les audits de l'expert
router.get('/audits', async (req: Request, res: Response) => {
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
      .eq('expert_id', authUser.id)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des audits:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    return res.json({
      success: true,
      data: audits
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des audits:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour obtenir les ClientProduitEligible de l'expert
router.get('/client-produits-eligibles', async (req: Request, res: Response) => {
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
          categorie
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

    return res.json({
      success: true,
      data: clientProduits
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des ClientProduitEligible:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================================
// ROUTES GESTION DOSSIERS CPE (Page Synthèse)
// ============================================================================

// GET /api/expert/dossier/:id - Détails complets d'un dossier CPE
router.get('/dossier/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { id } = req.params;
    const expertId = authUser.database_id || authUser.id;
    
    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Récupérer le CPE avec toutes les relations enrichies
    const { data: cpe, error } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        Client:clientId (
          id,
          name,
          first_name,
          last_name,
          company_name,
          email,
          phone_number,
          siren,
          "chiffreAffaires",
          "revenuAnnuel",
          "secteurActivite",
          "nombreEmployes",
          "ancienneteEntreprise",
          "typeProjet",
          address,
          city,
          postal_code,
          website,
          decision_maker_position,
          qualification_score,
          interest_level,
          budget_range,
          timeline,
          source,
          statut,
          is_active,
          "dateCreation",
          "derniereConnexion",
          first_simulation_at,
          first_login,
          expert_contacted_at,
          converted_at,
          last_activity_at,
          notes,
          admin_notes,
          last_admin_contact,
          "simulationId",
          apporteur_id
        ),
        ProduitEligible:produitId (
          id,
          nom,
          description,
          categorie,
          montant_min,
          montant_max,
          taux_min,
          taux_max,
          duree_min,
          duree_max
        )
      `)
      .eq('id', id)
      .eq('expert_id', expertId)
      .single();

    if (error || !cpe) {
      console.error('Erreur récupération CPE:', error);
      return res.status(404).json({ 
        success: false, 
        message: 'Dossier non trouvé ou accès non autorisé' 
      });
    }

    // Récupérer le taux de commission de l'expert
    const { data: expertData } = await supabase
      .from('Expert')
      .select('compensation:client_fee_percentage')
      .eq('id', expertId)
      .single();

    const expertCommissionRate = expertData?.compensation || 10; // Par défaut 10% si non défini

    // Normaliser les relations Supabase (peuvent être des tableaux)
    const normalizedClient = Array.isArray(cpe.Client) ? cpe.Client[0] : cpe.Client;
    const normalizedProduit = Array.isArray(cpe.ProduitEligible) ? cpe.ProduitEligible[0] : cpe.ProduitEligible;

    // Enrichir avec informations de l'apporteur si présent
    let apporteurData = null;
    if (normalizedClient?.apporteur_id) {
      const { data: apporteur } = await supabase
        .from('ApporteurAffaires')
        .select('id, company_name, name, email, phone_number, commission_rate')
        .eq('id', normalizedClient.apporteur_id)
        .single();
      
      apporteurData = apporteur;
    }

    // Récupérer les autres produits de la même simulation
    let autresProduitsSimulation: any[] = [];
    if (normalizedClient?.simulationId) {
      const { data: autresProduits } = await supabase
        .from('ClientProduitEligible')
        .select(`
          id,
          "montantFinal",
          "tauxFinal",
          statut,
          ProduitEligible:produitId (
            nom,
            categorie
          )
        `)
        .eq('"simulationId"', normalizedClient.simulationId)
        .neq('id', id);
      
      autresProduitsSimulation = autresProduits || [];
    }

    // Calculer le potentiel total de la simulation
    const montantTotalSimulation = [cpe, ...autresProduitsSimulation]
      .reduce((sum, p) => sum + (p.montantFinal || 0), 0);
    
    const commissionExpert = montantTotalSimulation * (expertCommissionRate / 100); // Commission personnalisée expert

    // TODO: Récupérer les documents liés au dossier
    // const { data: documents } = await supabase
    //   .from('GEDDocument')
    //   .select('*')
    //   .eq('dossier_id', id);

    return res.json({
      success: true,
      data: {
        ...cpe,
        Client: normalizedClient,
        ProduitEligible: normalizedProduit,
        apporteur: apporteurData,
        autresProduitsSimulation,
        potentielTotal: {
          montantTotal: montantTotalSimulation,
          commissionExpert,
          nombreProduits: 1 + autresProduitsSimulation.length
        },
        documents: [] // À implémenter avec GED
      }
    });
  } catch (error) {
    console.error('Erreur récupération dossier CPE:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/expert/dossier/:id/notes - Sauvegarder les notes expert
router.put('/dossier/:id/notes', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { id } = req.params;
    const { expert_notes } = req.body;
    
    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Mettre à jour les notes (utiliser la colonne notes existante)
    const { data, error } = await supabase
      .from('ClientProduitEligible')
      .update({ 
        notes: expert_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('expert_id', authUser.id)
      .select()
      .single();

    if (error) {
      console.error('Erreur sauvegarde notes:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erreur sauvegarde notes:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/expert/dossier/:id/validate-eligibility - Valider ou refuser les documents (validation finale expert)
router.post('/dossier/:id/validate-eligibility', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { id } = req.params;
    const { validated, notes } = req.body;
    
    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    console.log('📝 Expert - Validation documents:', {
      dossier_id: id,
      expert_id: authUser.database_id,
      validated,
      notes
    });

    // Récupérer le dossier pour vérifier qu'il existe et appartient à l'expert
    const { data: currentCPE, error: fetchError } = await supabase
      .from('ClientProduitEligible')
      .select('*, Client(company_name, email)')
      .eq('id', id)
      .eq('expert_id', authUser.database_id)
      .single();

    if (fetchError || !currentCPE) {
      console.error('❌ Dossier non trouvé ou non assigné à cet expert:', fetchError);
      return res.status(404).json({ 
        success: false, 
        message: 'Dossier non trouvé ou non autorisé' 
      });
    }

    // ✅ NOUVEAUX CHAMPS : Utiliser les colonnes dédiées
    const isValidated = validated === true;
    const newStatut = isValidated ? 'documents_completes' : 'expert_rejected';

    // Mettre à jour le dossier avec les nouveaux champs
    const { data, error } = await supabase
      .from('ClientProduitEligible')
      .update({ 
        // ✅ Nouveau système - Validation expert
        expert_validation_status: isValidated ? 'validated' : 'rejected',
        expert_validated_at: isValidated ? new Date().toISOString() : null,
        notes: notes,
        
        // Statut global
        statut: newStatut,
        current_step: isValidated ? 4 : 3, // Si validé → Étape 4 (Audit), sinon reste à 3
        progress: isValidated ? 50 : 30,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('expert_id', authUser.database_id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur validation documents par expert:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    console.log(`✅ Expert - Documents ${isValidated ? 'validés' : 'rejetés'} pour le dossier ${id}`, {
      expert_validation_status: isValidated ? 'validated' : 'rejected',
      statut: newStatut
    });

    // 📅 TIMELINE : Ajouter événement validation expert
    try {
      const { DossierTimelineService } = await import('../services/dossier-timeline-service');
      
      const expertName = authUser.email || 'Expert';
      const clientName = (currentCPE as any).Client?.company_name || 'Client';
      
      if (isValidated) {
        await DossierTimelineService.addEvent({
          dossier_id: id,
          type: 'expert_action',
          actor_type: 'expert',
          actor_name: expertName,
          title: '✅ Documents validés par l\'expert',
          description: `L'expert a validé tous les documents du dossier. Le dossier passe en phase d'audit technique.`,
          metadata: {
            expert_id: authUser.database_id,
            validated_at: new Date().toISOString(),
            notes
          },
          icon: '✅',
          color: 'green'
        });
      } else {
        await DossierTimelineService.addEvent({
          dossier_id: id,
          type: 'expert_action',
          actor_type: 'expert',
          actor_name: expertName,
          title: '❌ Dossier refusé par l\'expert',
          description: `L'expert a refusé le dossier. Raison : ${notes || 'Non précisée'}`,
          metadata: {
            expert_id: authUser.database_id,
            rejected_at: new Date().toISOString(),
            reason: notes
          },
          icon: '❌',
          color: 'red'
        });
      }

      console.log('✅ Événement timeline ajouté (validation expert)');
    } catch (timelineError) {
      console.error('⚠️ Erreur timeline (non bloquant):', timelineError);
    }

    // 📧 NOTIFICATION AU CLIENT
    try {
      const { data: clientAuthUser } = await supabase
        .from('Client')
        .select('auth_user_id')
        .eq('id', (currentCPE as any).clientId)
        .single();

      if (clientAuthUser?.auth_user_id) {
        await supabase
          .from('notification')
          .insert({
            user_id: clientAuthUser.auth_user_id,
            user_type: 'client',
            title: isValidated 
              ? `✅ Documents validés - ${(currentCPE as any).Client?.company_name || 'Votre dossier'}` 
              : `❌ Dossier refusé`,
            message: isValidated
              ? `Votre expert a validé tous les documents. Votre dossier passe maintenant en phase d'audit technique.`
              : `Votre expert a refusé le dossier. Raison : ${notes || 'Non précisée'}`,
            notification_type: isValidated ? 'documents_validated' : 'dossier_rejected',
            priority: 'high',
            is_read: false,
            action_url: `/client/dossier/${id}`,
            action_data: {
              dossier_id: id,
              expert_decision: isValidated ? 'validated' : 'rejected',
              timestamp: new Date().toISOString()
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        console.log('📧 Notification client envoyée (validation expert)');
      }
    } catch (notifError) {
      console.error('⚠️ Erreur notification (non bloquant):', notifError);
    }

    return res.json({
      success: true,
      data,
      message: validated ? 'Documents validés avec succès' : 'Dossier refusé'
    });
  } catch (error) {
    console.error('❌ Erreur validation documents par expert:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/expert/dossier/:id/request-documents - Demander des documents au client
router.post('/dossier/:id/request-documents', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { id } = req.params;
    const { notes } = req.body;
    
    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Récupérer le CPE pour avoir l'ID client
    const { data: cpe, error: cpeError } = await supabase
      .from('ClientProduitEligible')
      .select('clientId, Client:clientId(email, name)')
      .eq('id', id)
      .eq('expert_id', authUser.id)
      .single();

    if (cpeError || !cpe) {
      return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
    }

    // TODO: Envoyer email/notification au client avec la demande de documents

    // Sauvegarder les notes
    await supabase
      .from('ClientProduitEligible')
      .update({ 
        notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    return res.json({
      success: true,
      message: 'Demande de documents envoyée au client'
    });
  } catch (error) {
    console.error('Erreur demande documents:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/expert/dossier/:id/send-report - Envoyer le rapport final au client
router.post('/dossier/:id/send-report', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { id } = req.params;
    const { recommendation, notes } = req.body;
    
    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Récupérer metadata actuel
    const { data: currentCPE } = await supabase
      .from('ClientProduitEligible')
      .select('metadata')
      .eq('id', id)
      .eq('expert_id', authUser.id)
      .single();

    // Fusionner metadata avec recommendation
    const updatedMetadata = {
      ...(currentCPE?.metadata || {}),
      recommendation: recommendation,
      finalized_at: new Date().toISOString()
    };

    // Mettre à jour le CPE
    const { data, error } = await supabase
      .from('ClientProduitEligible')
      .update({ 
        statut: 'termine',
        notes: notes,
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('expert_id', authUser.id)
      .select()
      .single();

    if (error) {
      console.error('Erreur envoi rapport:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    // TODO: Envoyer email au client avec le rapport
    // TODO: Générer PDF du rapport

    return res.json({
      success: true,
      data,
      message: 'Rapport envoyé au client'
    });
  } catch (error) {
    console.error('Erreur envoi rapport:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================================
// ROUTE : SYNTHÈSE CLIENT
// ============================================================================

// GET /api/expert/client/:id - Détails complets d'un client
router.get('/client/:id/documents', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { id } = req.params;

    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    const expertId = authUser.database_id || authUser.id;

    const { data: dossiers, error: dossiersError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        "clientId",
        produitId,
        statut,
        metadata,
        "montantFinal",
        current_step,
        progress,
        updated_at,
        ProduitEligible:produitId (
          id,
          nom,
          categorie
        ),
        Client:clientId (
          id,
          company_name,
          name
        )
      `)
      .eq('"clientId"', id)
      .eq('expert_id', expertId)
      .order('created_at', { ascending: false });

    if (dossiersError) {
      console.error('Erreur récupération dossiers client/documents:', dossiersError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des dossiers'
      });
    }

    if (!dossiers || dossiers.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    const dossierIds = dossiers.map(d => d.id);

    const documentsByDossier = new Map<string, any[]>();

    if (dossierIds.length > 0) {
      const { data: documents, error: documentsError } = await supabase
        .from('ClientProcessDocument')
        .select(`
          id,
          client_id,
          client_produit_id,
          produit_id,
          document_type,
          filename,
          file_size,
          mime_type,
          validation_status,
          status,
          workflow_step,
          rejection_reason,
          metadata,
          created_at,
          updated_at,
          validated_at,
          validated_by
        `)
        .in('client_produit_id', dossierIds)
        .order('created_at', { ascending: false });

      if (documentsError) {
        console.error('Erreur récupération documents client:', documentsError);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la récupération des documents'
        });
      }

      (documents || []).forEach(doc => {
        if (!doc.client_produit_id) return;
        const existing = documentsByDossier.get(doc.client_produit_id) || [];
        existing.push(doc);
        documentsByDossier.set(doc.client_produit_id, existing);
      });
    }

    const payload = (dossiers || []).map(rawDossier => {
      const produit = Array.isArray(rawDossier.ProduitEligible)
        ? rawDossier.ProduitEligible[0]
        : rawDossier.ProduitEligible;
      const clientInfo = Array.isArray(rawDossier.Client)
        ? rawDossier.Client[0]
        : rawDossier.Client;
      const docs = documentsByDossier.get(rawDossier.id) || [];

      const mappedDocuments = docs.map(doc => {
        const validationStatus = getDocumentValidationStatus(doc);
        return {
          id: doc.id,
          dossierId: doc.client_produit_id,
          clientId: doc.client_id,
          produitId: doc.produit_id,
          filename: doc.filename,
          documentType: doc.document_type,
          size: doc.file_size,
          mimeType: doc.mime_type,
          uploadedAt: doc.created_at,
          updatedAt: doc.updated_at,
          validationStatus,
          status: doc.status || validationStatus,
          rejectionReason: doc.rejection_reason,
          workflowStep: doc.workflow_step,
          uploadedBy: doc.metadata?.uploaded_by_label || doc.metadata?.uploaded_by || doc.metadata?.source || 'Client',
          history: doc.metadata?.history || [],
          actions: {
            view: `/api/expert/document/${doc.id}/view`,
            validate: `/api/expert/document/${doc.id}/validate`,
            reject: `/api/expert/document/${doc.id}/reject`
          },
          canValidate: validationStatus !== 'validated',
          canReject: validationStatus !== 'rejected'
        };
      });

      const summary = {
        total: mappedDocuments.length,
        validated: mappedDocuments.filter(doc => doc.validationStatus === 'validated').length,
        pending: mappedDocuments.filter(doc => doc.validationStatus === 'pending').length,
        rejected: mappedDocuments.filter(doc => doc.validationStatus === 'rejected').length
      };

      const canReview = resolveDossierReviewable(rawDossier.statut);
      const canAccept = canReview && summary.total > 0 && summary.pending === 0;

      return {
        dossierId: rawDossier.id,
        clientId: rawDossier.clientId,
        produitId: rawDossier.produitId,
        productName: produit?.nom || 'Produit',
        productCategory: produit?.categorie || 'Produit',
        clientName: clientInfo?.company_name || clientInfo?.name || null,
        statut: rawDossier.statut,
        normalizedStatut: normalizeDossierStatus(rawDossier.statut),
        updatedAt: rawDossier.updated_at,
        metrics: summary,
        documents: mappedDocuments,
        actions: {
          canAccept,
          canReject: canReview,
          canUpload: true,
          acceptEndpoint: `/api/expert/dossier/${rawDossier.id}/validate-eligibility`,
          rejectEndpoint: `/api/expert/dossier/${rawDossier.id}/validate-eligibility`,
          requestDocumentsEndpoint: `/api/expert/dossier/${rawDossier.id}/request-documents`,
          uploadEndpoint: '/api/documents/upload',
          bulkDownloadUrl: `/api/expert/dossier/${rawDossier.id}/download-complete`,
          dossierUrl: `/expert/dossier/${rawDossier.id}`
        }
      };
    });

    return res.json({
      success: true,
      data: payload
    });
  } catch (error) {
    console.error('Erreur récupération documents client:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.get('/client/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { id } = req.params;
    const expertId = authUser.database_id || authUser.id;
    
    if (authUser.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Récupérer le client avec toutes ses informations
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select(`
        id,
        name,
        first_name,
        last_name,
        company_name,
        email,
        phone_number,
        siren,
        "chiffreAffaires",
        "revenuAnnuel",
        "secteurActivite",
        "nombreEmployes",
        "ancienneteEntreprise",
        "typeProjet",
        address,
        city,
        postal_code,
        website,
        decision_maker_position,
        qualification_score,
        interest_level,
        budget_range,
        timeline,
        source,
        statut,
        is_active,
        "dateCreation",
        "derniereConnexion",
        first_simulation_at,
        first_login,
        expert_contacted_at,
        converted_at,
        last_activity_at,
        notes,
        admin_notes,
        last_admin_contact,
        "simulationId",
        apporteur_id
      `)
      .eq('id', id)
      .single();

    if (clientError || !client) {
      console.error('Erreur récupération client:', clientError);
      return res.status(404).json({ 
        success: false, 
        message: 'Client non trouvé' 
      });
    }

    // Récupérer tous les dossiers du client pour cet expert
    const { data: dossiers, error: dossiersError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        "produitId",
        statut,
        metadata,
        "montantFinal",
        "tauxFinal",
        priorite,
        current_step,
        progress,
        created_at,
        updated_at,
        ProduitEligible:produitId (
          id,
          nom,
          description,
          categorie
        )
      `)
      .eq('"clientId"', id)
      .eq('expert_id', expertId)
      .order('created_at', { ascending: false });

    if (dossiersError) {
      console.error('Erreur récupération dossiers:', dossiersError);
    }

    // Normaliser les dossiers
    const normalizedDossiers = (dossiers || []).map((d: any) => ({
      ...d,
      ProduitEligible: Array.isArray(d.ProduitEligible) ? d.ProduitEligible[0] : d.ProduitEligible
    }));

    // Récupérer l'apporteur si présent
    let apporteurData = null;
    if (client.apporteur_id) {
      const { data: apporteur } = await supabase
        .from('ApporteurAffaires')
        .select('id, company_name, name, email, phone_number, commission_rate')
        .eq('id', client.apporteur_id)
        .single();
      
      apporteurData = apporteur;
    }

    // Calculer les statistiques du client
    const stats = {
      totalDossiers: normalizedDossiers.length,
      dossiersEligibles: normalizedDossiers.filter(d => d.statut === 'eligible').length,
      dossiersEnCours: normalizedDossiers.filter(d => d.statut === 'en_cours').length,
      dossiersTermines: normalizedDossiers.filter(d => d.statut === 'termine').length,
      montantTotal: normalizedDossiers.reduce((sum, d) => sum + (d.montantFinal || 0), 0),
      montantTermine: normalizedDossiers
        .filter(d => d.statut === 'termine')
        .reduce((sum, d) => sum + (d.montantFinal || 0), 0),
      commissionPotentielle: normalizedDossiers.reduce((sum, d) => sum + (d.montantFinal || 0), 0) * 0.1
    };

    return res.json({
      success: true,
      data: {
        client,
        apporteur: apporteurData,
        dossiers: normalizedDossiers,
        stats
      }
    });

  } catch (error) {
    console.error('Erreur récupération client:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/expert/contact-admin - Envoyer un message à l'admin (expert refusé/en attente)
router.post('/contact-admin', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUser;
    if (!user || user.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux experts' });
    }

    const { message, subject } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le message est requis'
      });
    }

    // Récupérer les informations de l'expert
    const { data: expert, error: expertError } = await supabase
      .from('Expert')
      .select('id, email, first_name, last_name, company_name, cabinet_id, approval_status, created_at')
      .eq('id', user.database_id)
      .single();

    if (expertError || !expert) {
      return res.status(404).json({
        success: false,
        message: 'Expert non trouvé'
      });
    }

    // Récupérer les informations du cabinet si applicable
    let cabinetInfo = null;
    if (expert.cabinet_id) {
      const { data: cabinet } = await supabase
        .from('Cabinet')
        .select('id, name, siret')
        .eq('id', expert.cabinet_id)
        .single();
      cabinetInfo = cabinet;
    }

    // Récupérer tous les admins pour leur envoyer une notification
    const { data: admins, error: adminsError } = await supabase
      .from('Admin')
      .select('auth_user_id, email, first_name, last_name');

    if (adminsError || !admins || admins.length === 0) {
      console.error('⚠️ Aucun admin trouvé pour notification');
    } else {
      // Créer une notification pour chaque admin
      const notificationTitle = subject || `Message de l'expert ${expert.first_name} ${expert.last_name}`;
      const notificationMessage = `Expert ${expert.first_name} ${expert.last_name} (${expert.email})${expert.approval_status === 'rejected' ? ' - COMPTE REFUSÉ' : expert.approval_status === 'pending' ? ' - COMPTE EN ATTENTE' : ''} demande des informations.\n\nMessage :\n${message}\n\nInformations expert :\n- Email : ${expert.email}\n- Entreprise : ${expert.company_name || 'N/A'}\n- Date de demande : ${new Date(expert.created_at).toLocaleDateString('fr-FR')}${expert.approval_status === 'rejected' ? '\n- Date de refus : À déterminer' : ''}${cabinetInfo ? `\n- Cabinet : ${cabinetInfo.name} (${cabinetInfo.siret || 'N/A'})` : ''}`;

      for (const admin of admins) {
        if (admin.auth_user_id) {
          await supabase
            .from('notification')
            .insert({
              user_id: admin.auth_user_id,
              user_type: 'admin',
              title: notificationTitle,
              message: notificationMessage,
              notification_type: 'expert_contact_request',
              priority: 'high',
              is_read: false,
              action_url: `/admin/experts/${expert.id}`,
              action_data: {
                expert_id: expert.id,
                expert_email: expert.email,
                expert_name: `${expert.first_name} ${expert.last_name}`,
                expert_company: expert.company_name,
                approval_status: expert.approval_status,
                request_date: expert.created_at,
                cabinet_id: expert.cabinet_id,
                cabinet_name: cabinetInfo?.name || null,
                message: message,
                contact_date: new Date().toISOString()
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }
      }
      console.log(`✅ Notifications admin envoyées (${admins.length} admins)`);
    }

    return res.json({
      success: true,
      message: 'Votre message a été envoyé aux équipes. Nous vous répondrons dans les plus brefs délais.'
    });

  } catch (error) {
    console.error('❌ Erreur POST /expert/contact-admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// POST /api/expert/leads - Créer un lead (expert uniquement)
router.post('/leads', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    const authUser = req.user as AuthUser;
    
    if (authUser.type !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux experts'
      });
    }

    const { name, email, phone, subject, contexte } = req.body;

    // Validation des champs obligatoires
    if (!name || !email || !contexte) {
      return res.status(400).json({
        success: false,
        message: 'Les champs nom, email et contexte sont obligatoires'
      });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide'
      });
    }

    // Récupérer l'ID de l'expert qui envoie le lead
    const expertId = authUser.database_id || authUser.id || null;
    
    // Insérer le lead dans la table contact_messages
    const leadSubject = subject 
      ? `[LEAD] ${subject.trim()}` 
      : '[LEAD] Lead ajouté par expert';
    
    // Préparer les données d'insertion avec sender_id et sender_type
    const leadData: any = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : null,
      subject: leadSubject,
      message: contexte.trim(),
      status: 'unread',
      created_at: new Date().toISOString()
    };
    
    // Ajouter sender_id et sender_type si l'expert est identifié
    if (expertId) {
      leadData.sender_id = expertId;
      leadData.sender_type = 'expert';
    }
    
    // Utiliser supabaseAdmin pour contourner RLS
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: lead, error } = await supabaseAdmin
      .from('contact_messages')
      .insert(leadData)
      .select('id')
      .single();

    if (error) {
      console.error('❌ Erreur insertion lead expert:', error);
      
      // Si la table n'existe pas
      if (error.code === '42P01') {
        return res.status(500).json({
          success: false,
          message: 'Table de contact non configurée'
        });
      }

      // Si les champs sender_id/sender_type n'existent pas, on réessaye sans
      if (error.message?.includes('column') && (error.message?.includes('sender_id') || error.message?.includes('sender_type'))) {
        console.log('⚠️ Champs sender_id/sender_type n\'existent pas, insertion sans...');
        const leadDataRetry: any = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone ? phone.trim() : null,
          subject: leadSubject,
          message: contexte.trim(),
          status: 'unread',
          created_at: new Date().toISOString()
        };
        
        const { data: leadRetry, error: errorRetry } = await supabaseAdmin
          .from('contact_messages')
          .insert(leadDataRetry)
          .select('id')
          .single();
        
        if (errorRetry) {
          return res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'enregistrement du lead',
            error: errorRetry.message
          });
        }
        
        console.log('✅ Lead créé avec succès (sans sender_id):', leadRetry?.id);
        return res.json({
          success: true,
          data: {
            id: leadRetry?.id,
            message: 'Lead enregistré avec succès'
          }
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'enregistrement du lead',
        error: error.message
      });
    }

    console.log('✅ Lead créé avec succès par expert:', lead?.id);

    // Créer une notification admin pour ce lead (comme pour les messages de contact publics)
    try {
      const { AdminNotificationService } = await import('../services/admin-notification-service');
      await AdminNotificationService.notifyNewContactMessage({
        contact_message_id: lead.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        subject: leadSubject,
        message: contexte.trim()
      });
      console.log('✅ Notification admin créée pour le lead expert');
    } catch (notifError) {
      console.error('❌ Erreur création notification lead expert:', notifError);
      // On continue même si la notification échoue
    }

    return res.json({
      success: true,
      data: {
        id: lead?.id,
        message: 'Lead enregistré avec succès'
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur route leads expert:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default router; 