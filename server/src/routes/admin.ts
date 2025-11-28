import express, { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthUser } from '../types/auth';
import messagesRouter from './admin/messages';
import { normalizeDossierStatus } from '../utils/dossierStatus';
import { ClientTimelineService } from '../services/client-timeline-service';

const router = express.Router();

// Configuration Supabase
const supabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Alias pour la compatibilité
const supabaseAdmin = supabaseClient;

// Types pour les statistiques
interface StatusCount {
  [key: string]: number;
}

interface ProduitCount {
  [key: string]: number;
}

interface UpdateData {
  updated_at: string;
  validation_state?: string;
  expert_id?: string;
  commentaire?: string;
}

type NormalizedStatus = ReturnType<typeof normalizeDossierStatus>;

type StatusUpdate = {
  id: string;
  current: string | null;
  normalized: NormalizedStatus;
};

// Route de test pour vérifier que les routes admin fonctionnent
router.get('/test', asyncHandler(async (req, res) => {
  try {
    console.log('🧪 Test route admin appelée');
    
    // Vérifier si l'utilisateur est authentifié
    const user = (req as any).user;
    console.log('👤 Utilisateur dans la requête:', user);
    
    return res.json({
      success: true,
      message: 'Route admin fonctionne',
      timestamp: new Date().toISOString(),
      user: user ? {
        id: user.id,
        type: user.type,
        email: user.email
      } : null
    });
  } catch (error) {
    console.error('Erreur test route admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du test de la route admin'
    });
  }
}));

// Route de diagnostic pour l'authentification admin
router.get('/diagnostic', asyncHandler(async (req, res) => {
  try {
    console.log('🔍 Diagnostic authentification admin...');
    
    // Vérifier si l'utilisateur est authentifié
    const user = (req as any).user;
    console.log('👤 Utilisateur dans la requête:', user);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié',
        diagnostic: {
          hasUser: false,
          authMiddleware: 'failed'
        }
      });
    }
    
    // Vérifier le type d'utilisateur
    if (user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs',
        diagnostic: {
          hasUser: true,
          userType: user.type,
          expectedType: 'admin',
          authMiddleware: 'success'
        }
      });
    }
    
    // Vérifier si l'admin existe en base
    const { data: adminData, error: adminError } = await supabaseClient
      .from('Admin')
      .select('id, email, name')
      .eq('email', user.email)
      .single();
    
    console.log('🔍 Recherche admin en base:', { adminData, adminError });
    
    return res.json({
      success: true,
      message: 'Admin authentifié avec succès',
      diagnostic: {
        hasUser: true,
        userType: user.type,
        email: user.email,
        databaseId: user.database_id,
        adminInDatabase: !!adminData,
        adminError: adminError?.message || null,
        authMiddleware: 'success'
      },
      user: {
        id: user.id,
        type: user.type,
        email: user.email,
        database_id: user.database_id
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur diagnostic admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du diagnostic',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
}));

// Route de test d'authentification admin supprimée - l'authentification est gérée par le middleware

// Route de test clients supprimée - les routes de production sont suffisantes

// GET /api/admin/dashboard - Dashboard principal avec KPIs
router.get('/dashboard', asyncHandler(async (req, res) => {
  try {
    // 1. KPIs Utilisateurs
    const { count: totalClients } = await supabaseClient
      .from('Client')
      .select('*', { count: 'exact', head: true });

    const { count: totalExperts } = await supabaseClient
      .from('Expert')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: pendingExperts } = await supabaseClient
      .from('Expert')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'pending');

    // Nouveaux ce mois
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: newClientsThisMonth } = await supabaseClient
      .from('Client')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    const { count: newExpertsThisMonth } = await supabaseClient
      .from('Expert')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    // 2. KPIs Dossiers
    const { count: totalAudits } = await supabaseClient
      .from('Audit')
      .select('*', { count: 'exact', head: true });

    const { count: activeAudits } = await supabaseClient
      .from('Audit')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'en_cours');

    const { count: completedAudits } = await supabaseClient
      .from('Audit')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'terminé');

    // 3. KPIs Financiers
    const { data: auditsData } = await supabaseClient
      .from('Audit')
      .select('potential_gain, obtained_gain');

    const totalPotentialGain = auditsData?.reduce((sum, audit) => 
      sum + (audit.potential_gain || 0), 0) || 0;
    
    const totalObtainedGain = auditsData?.reduce((sum, audit) => 
      sum + (audit.obtained_gain || 0), 0) || 0;

    // 3.5. KPIs Produits Éligibles
    const { count: totalProduits } = await supabaseClient
      .from('ProduitEligible')
      .select('*', { count: 'exact', head: true });

    const { count: newProduitsThisMonth } = await supabaseClient
      .from('ProduitEligible')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    // 4. Répartition par produit
    const { data: clientProduits } = await supabaseClient
      .from('ClientProduitEligible')
      .select('produitId, statut');

    const produitStats = clientProduits?.reduce((acc, item) => {
      const produitId = item.produitId;
      if (!acc[produitId]) {
        acc[produitId] = { total: 0, eligible: 0 };
      }
      acc[produitId].total++;
      const normalized = normalizeDossierStatus(item.statut);
      if (normalized === 'pending_upload' || normalized === 'pending_admin_validation') {
        acc[produitId].eligible++;
      }
      return acc;
    }, {} as Record<string, { total: number; eligible: number }>) || {};

    // 5. Performance par expert
    const { data: expertStats } = await supabaseClient
      .from('Expert')
      .select(`
        id,
        first_name,
        last_name,
        company_name,
        rating,
        compensation:client_fee_percentage,
        specializations
      `)
      .eq('status', 'active');

    // 6. Engagement client
    const { data: recentActivity } = await supabaseClient
      .from('Client')
      .select('id, created_at, derniereConnexion')
      .order('derniereConnexion', { ascending: false })
      .limit(10);

    // 7. Qualité et alertes
    const { count: delayedAudits } = await supabaseClient
      .from('Audit')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'en_cours')
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Plus de 30 jours

    // 8. Évolution temporelle (7 derniers jours) - OPTIMISÉ
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Requête groupée pour les clients
    const { data: dailyClients } = await supabaseClient
      .from('Client')
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString());
    
    // Requête groupée pour les audits
    const { data: dailyAudits } = await supabaseClient
      .from('Audit')
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString());
    
    // Grouper par jour
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const newClients = dailyClients?.filter(item => 
        item.created_at?.startsWith(dateStr)
      ).length || 0;
      
      const newAudits = dailyAudits?.filter(item => 
        item.created_at?.startsWith(dateStr)
      ).length || 0;
      
      dailyStats.push({
        date: dateStr,
        newClients,
        newAudits
      });
    }

    // 9. Répartition géographique
    const { data: locationStats } = await supabaseClient
      .from('Client')
      .select('city')
      .not('city', 'is', null);

    const cityStats = locationStats?.reduce((acc, client) => {
      const city = client.city;
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // 10. Funnel de conversion
    const { count: totalEligibleProducts } = await supabaseClient
      .from('ClientProduitEligible')
      .select('*', { count: 'exact', head: true })
      .in('statut', ['pending_upload', 'pending_admin_validation', 'admin_validated']);

    // Gestion des valeurs null
    const totalClientsCount = totalClients || 0;
    const totalEligibleProductsCount = totalEligibleProducts || 0;
    const totalAuditsCount = totalAudits || 0;
    const completedAuditsCount = completedAudits || 0;

    const conversionRate = totalClientsCount > 0 ? totalEligibleProductsCount / totalClientsCount : 0;
    const auditRate = totalEligibleProductsCount > 0 ? totalAuditsCount / totalEligibleProductsCount : 0;
    const successRate = totalAuditsCount > 0 ? completedAuditsCount / totalAuditsCount : 0;

    const dashboardData = {
      // KPIs Principaux
      kpis: {
        users: {
          totalClients: totalClientsCount,
          totalExperts: totalExperts || 0,
          pendingExperts: pendingExperts || 0,
          newClientsThisMonth: newClientsThisMonth || 0,
          newExpertsThisMonth: newExpertsThisMonth || 0
        },
        dossiers: {
          total: totalAuditsCount,
          active: activeAudits || 0,
          completed: completedAuditsCount,
          delayed: delayedAudits || 0
        },
        financier: {
          totalPotentialGain: totalPotentialGain,
          totalObtainedGain: totalObtainedGain,
          conversionRate: Math.round(conversionRate * 100),
          auditRate: Math.round(auditRate * 100),
          successRate: Math.round(successRate * 100)
        },
        produits: {
          total: totalProduits || 0,
          newThisMonth: newProduitsThisMonth || 0
        }
      },
      // Répartition par produit
      produitStats,
      // Performance par expert
      expertStats: expertStats?.map(expert => ({
        id: expert.id,
        name: `${expert.first_name || ''} ${expert.last_name || ''}`.trim() || expert.company_name,
        rating: expert.rating,
        compensation: expert.compensation,
        specializations: expert.specializations
      })) || [],
      // Engagement client
      recentActivity: recentActivity?.map(client => ({
        id: client.id,
        created_at: client.created_at,
        derniereConnexion: client.derniereConnexion
      })) || [],
      // Évolution temporelle
      dailyStats,
      // Répartition géographique
      locationStats: Object.entries(cityStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      // Funnel de conversion
      funnel: {
        clients: totalClientsCount,
        eligibleProducts: totalEligibleProductsCount,
        audits: totalAuditsCount,
        completed: completedAuditsCount
      }
    };

    return res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Erreur dashboard admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données du dashboard'
    });
  }
}));

// GET /api/admin/stats/experts - Statistiques détaillées des experts
router.get('/stats/experts', asyncHandler(async (req, res) => {
  try {
    const { data: experts } = await supabaseClient
      .from('Expert')
      .select(`
        id,
        name,
        email,
        company_name,
        specializations,
        rating,
        compensation:client_fee_percentage,
        status,
        approval_status,
        created_at,
        approved_at,
        approved_by,
        experience
      `)
      .order('created_at', { ascending: false });

    // Statistiques par spécialisation
    const specializationStats = experts?.reduce((acc, expert) => {
      expert.specializations?.forEach((spec: string) => {
        if (!acc[spec]) {
          acc[spec] = { count: 0, totalRating: 0, totalCompensation: 0, avgRating: 0, avgCompensation: 0 };
        }
        acc[spec].count++;
        acc[spec].totalRating += expert.rating || 0;
        acc[spec].totalCompensation += expert.compensation || 0;
      });
      return acc;
    }, {} as Record<string, { count: number; totalRating: number; totalCompensation: number; avgRating: number; avgCompensation: number }>) || {};

    // Calculer les moyennes
    Object.keys(specializationStats).forEach(spec => {
      const stats = specializationStats[spec];
      stats.avgRating = stats.count > 0 ? stats.totalRating / stats.count : 0;
      stats.avgCompensation = stats.count > 0 ? stats.totalCompensation / stats.count : 0;
    });

    return res.json({
      success: true,
      data: {
        experts,
        specializationStats
      }
    });

  } catch (error) {
    console.error('Erreur stats experts:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques experts'
    });
  }
}));

// GET /api/admin/stats/clients - Statistiques détaillées des clients
router.get('/stats/clients', asyncHandler(async (req, res) => {
  try {
    const { data: clients } = await supabaseClient
      .from('Client')
      .select(`
        id,
        email,
        company_name,
        created_at,
        derniereConnexion,
        statut
      `)
      .order('created_at', { ascending: false });

    // Statistiques d'engagement
    const engagementStats = {
      total: clients?.length || 0,
      active: clients?.filter(c => c.statut === 'actif').length || 0,
      inactive: clients?.filter(c => c.statut === 'inactif').length || 0,
      recentActivity: clients?.filter(c => {
        if (!c.derniereConnexion) return false;
        const lastLogin = new Date(c.derniereConnexion);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return lastLogin > weekAgo;
      }).length || 0
    };

    return res.json({
      success: true,
      data: {
        clients,
        engagementStats
      }
    });

  } catch (error) {
    console.error('Erreur stats clients:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques clients'
    });
  }
}));

// GET /api/admin/experts - Liste des experts avec filtres
router.get('/experts', asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      specialization,
      search,
      approval_status,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    let query = supabaseClient
      .from('Expert')
      .select(`
        id,
        name,
        first_name,
        last_name,
        email,
        company_name,
        specializations,
        secteur_activite,
        rating,
        status,
        approval_status,
        created_at,
        approved_at,
        approved_by,
        experience
      `);

    // Filtres
    if (status && status !== 'all') {
      query = query.eq('status', String(status));
    }
    if (approval_status && approval_status !== 'all') {
      query = query.eq('approval_status', String(approval_status));
    }
    if (specialization) {
      query = query.contains('specializations', [String(specialization)]);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`);
    }

    // Tri
    query = query.order(String(sortBy), { ascending: String(sortOrder) === 'asc' });

    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    query = query.range(offset, offset + Number(limit) - 1);

    const { data: experts, error, count } = await query;

    if (error) {
      throw error;
    }

    // Récupérer le nombre total pour la pagination
    const { count: totalCount } = await supabaseClient
      .from('Expert')
      .select('*', { count: 'exact', head: true });

    return res.json({
      success: true,
      data: {
        experts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / Number(limit))
        }
      }
    });

  } catch (error) {
    console.error('Erreur récupération experts:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des experts'
    });
  }
}));

// GET /api/admin/experts/:id/produits - Récupérer les produits éligibles d'un expert
router.get('/experts/:id/produits', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const { data: produits, error } = await supabaseClient
      .from('ExpertProduitEligible')
      .select(`
        id,
        produit_id,
        niveau_expertise,
        statut,
        ProduitEligible(*)
      `)
      .eq('expert_id', id)
      .eq('statut', 'actif');

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      data: produits || []
    });

  } catch (error) {
    console.error('Erreur récupération produits expert:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits de l\'expert'
    });
  }
}));

// GET /api/admin/experts/all - Tous les experts de la plateforme
// ⚠️ IMPORTANT: Cette route doit être AVANT /experts/:id pour éviter que "all" soit interprété comme un ID
router.get('/experts/all', asyncHandler(async (req, res) => {
  try {
    console.log('🔍 Récupération de tous les experts...');
    
    const { data: experts, error } = await supabaseClient
      .from('Expert')
      .select(`
        id,
        name,
        first_name,
        last_name,
        email,
        company_name,
        specializations,
        secteur_activite,
        experience,
        location,
        rating,
        status,
        approval_status,
        created_at,
        approved_at,
        approved_by,
        description
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération tous les experts:', error);
      throw error;
    }

    console.log(`✅ ${experts?.length || 0} experts trouvés sur la plateforme`);

    return res.json({
      success: true,
      data: {
        experts: experts || []
      }
    });

  } catch (error) {
    console.error('❌ Erreur route experts/all:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de tous les experts'
    });
  }
}));

// GET /api/admin/experts/all - Tous les experts de la plateforme
// ⚠️ IMPORTANT: Cette route doit être AVANT /experts/:id pour éviter que "all" soit interprété comme un ID
router.get('/experts/all', asyncHandler(async (req, res) => {
  try {
    console.log('🔍 Récupération de tous les experts...');
    
    const { data: experts, error } = await supabaseClient
      .from('Expert')
      .select(`
        id,
        name,
        first_name,
        last_name,
        email,
        company_name,
        specializations,
        secteur_activite,
        experience,
        location,
        rating,
        status,
        approval_status,
        created_at,
        approved_at,
        approved_by,
        description
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération tous les experts:', error);
      throw error;
    }

    console.log(`✅ ${experts?.length || 0} experts trouvés sur la plateforme`);

    return res.json({
      success: true,
      data: {
        experts: experts || []
      }
    });

  } catch (error) {
    console.error('❌ Erreur route experts/all:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de tous les experts'
    });
  }
}));

// GET /api/admin/experts/:id - Détails d'un expert
router.get('/experts/:id', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer l'expert
    const { data: expert, error } = await supabaseClient
      .from('Expert')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !expert) {
      return res.status(404).json({
        success: false,
        message: 'Expert non trouvé'
      });
    }

    // Récupérer le nom de l'admin qui a approuvé l'expert
    let approved_by_name = null;
    if (expert.approved_by) {
      const { data: adminData } = await supabaseClient
        .from('Admin')
        .select('first_name, last_name, company_name')
        .eq('id', expert.approved_by)
        .single();
      approved_by_name = `${adminData?.first_name || ''} ${adminData?.last_name || ''}`.trim() || adminData?.company_name || null;
    }

    // Récupérer les statistiques de l'expert (utiliser ClientProduitEligible au lieu d'Audit)
    const { data: assignments } = await supabaseClient
      .from('ClientProduitEligible')
      .select('*')
      .eq('expert_id', id);

    const stats = {
      totalAudits: assignments && assignments.length ? assignments.length : 0,
      completedAudits: assignments && assignments.length ? assignments.filter(a => a.statut === 'validated').length : 0,
      activeAudits: assignments && assignments.length ? assignments.filter(a => a.statut === 'in_progress').length : 0,
      totalGains: assignments && assignments.length ? assignments.reduce((sum, a) => sum + (a.montantFinal || 0), 0) : 0,
      successRate: assignments && assignments.length > 0 ?
        (assignments.filter(a => a.statut === 'validated').length || 0) / assignments.length * 100 : 0
    };

    return res.json({
      success: true,
      data: {
        expert: {
          ...expert,
          approved_by_name
        },
        stats
      }
    });

  } catch (error) {
    console.error('Erreur récupération expert:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'expert'
    });
  }
}));

// PUT /api/admin/experts/:id/approve - Approuver un expert
router.put('/experts/:id/approve', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).user.id;

    const { data: expert, error: expertError } = await supabaseClient
      .from('Expert')
      .select('*')
      .eq('id', id)
      .single();

    if (expertError || !expert) {
      return res.status(404).json({
        success: false,
        message: 'Expert non trouvé'
      });
    }

    if (expert.approval_status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'L\'expert est déjà approuvé'
      });
    }

    const { data, error } = await supabaseClient
      .from('Expert')
      .update({
        approval_status: 'approved',
        approved_by: adminId,
        approved_at: new Date().toISOString(),
        status: 'active'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log de l'action
    await supabaseClient
      .from('AdminAuditLog')
      .insert({
        admin_id: adminId,
        action: 'expert_approved',
        table_name: 'Expert',
        record_id: id,
        old_values: { approval_status: expert.approval_status },
        new_values: { approval_status: 'approved' },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

    // 🔔 ENVOYER EMAIL DE CONFIRMATION À L'EXPERT
    try {
      const { EmailService } = await import('../services/EmailService');
      await EmailService.sendExpertApprovalNotification(
        expert.email,
        expert.first_name || expert.name?.split(' ')[0] || 'Expert',
        expert.last_name || expert.name?.split(' ').slice(1).join(' ') || '',
        `${process.env.FRONTEND_URL || 'https://www.profitum.app'}/connexion-expert`
      );
      console.log('✅ Email d\'approbation envoyé à l\'expert');
    } catch (emailError) {
      console.error('❌ Erreur envoi email expert (non bloquant):', emailError);
    }

    // 🔔 CRÉER NOTIFICATION DANS LE DASHBOARD EXPERT
    try {
      if (expert.auth_user_id) {
        await supabaseClient
          .from('notification')
          .insert({
            user_id: expert.auth_user_id,
            user_type: 'expert',
            title: '🎉 Compte approuvé !',
            message: 'Votre compte expert a été approuvé. Vous pouvez maintenant accéder à tous les services de la plateforme Profitum.',
            notification_type: 'expert_approved',
            priority: 'high',
            is_read: false,
            action_url: '/expert/dashboard',
            action_data: {
              expert_id: expert.id,
              approved_at: new Date().toISOString()
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        console.log('✅ Notification dashboard créée pour l\'expert');
      }
    } catch (notifError) {
      console.error('❌ Erreur création notification expert (non bloquant):', notifError);
    }

    return res.json({
      success: true,
      data,
      message: 'Expert approuvé avec succès. Un email de confirmation a été envoyé.'
    });

  } catch (error) {
    console.error('Erreur approbation expert:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'approbation de l\'expert'
    });
  }
}));

// PUT /api/admin/experts/:id/reject - Rejeter un expert
router.put('/experts/:id/reject', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).user.id;

    const { data: expert, error: expertError } = await supabaseClient
      .from('Expert')
      .select('*')
      .eq('id', id)
      .single();

    if (expertError || !expert) {
      return res.status(404).json({
        success: false,
        message: 'Expert non trouvé'
      });
    }

    const { data, error } = await supabaseClient
      .from('Expert')
      .update({
        approval_status: 'rejected',
        status: 'inactive'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log de l'action
    await supabaseClient
      .from('AdminAuditLog')
      .insert({
        admin_id: adminId,
        action: 'expert_rejected',
        table_name: 'Expert',
        record_id: id,
        old_values: { approval_status: expert.approval_status },
        new_values: { approval_status: 'rejected', reason },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

    // 🔔 NOTIFICATION AU CABINET : Si l'expert appartient à un cabinet, notifier OWNER et MANAGER
    if (expert.cabinet_id) {
      try {
        // Récupérer les membres OWNER et MANAGER du cabinet
        const { data: cabinetMembers, error: membersError } = await supabaseClient
          .from('CabinetMember')
          .select(`
            id,
            member_id,
            team_role,
            Expert:member_id (
              id,
              auth_user_id,
              first_name,
              last_name,
              email
            )
          `)
          .eq('cabinet_id', expert.cabinet_id)
          .in('team_role', ['OWNER', 'MANAGER'])
          .eq('status', 'active');

        if (!membersError && cabinetMembers && cabinetMembers.length > 0) {
          // Créer une notification pour chaque OWNER/MANAGER
          for (const member of cabinetMembers) {
            const expertMember = Array.isArray(member.Expert) ? member.Expert[0] : member.Expert;
            if (expertMember?.auth_user_id) {
              await supabaseClient
                .from('notification')
                .insert({
                  user_id: expertMember.auth_user_id,
                  user_type: 'expert',
                  title: '⚠️ Expert refusé par l\'administration',
                  message: `L'expert ${expert.first_name} ${expert.last_name} (${expert.email}) a été refusé par l'administration.${reason ? ` Raison : ${reason}` : ''}`,
                  notification_type: 'expert_rejected',
                  priority: 'high',
                  is_read: false,
                  action_url: `/expert/cabinet/team`,
                  action_data: {
                    expert_id: expert.id,
                    expert_email: expert.email,
                    expert_name: `${expert.first_name} ${expert.last_name}`,
                    rejected_at: new Date().toISOString(),
                    reason: reason || null,
                    cabinet_id: expert.cabinet_id
                  },
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
            }
          }
          console.log(`✅ Notifications cabinet envoyées (${cabinetMembers.length} membres)`);
        }
      } catch (cabinetNotifError) {
        console.error('⚠️ Erreur notification cabinet (non bloquant):', cabinetNotifError);
      }
    }

    return res.json({
      success: true,
      data,
      message: 'Expert rejeté avec succès'
    });

  } catch (error) {
    console.error('Erreur rejet expert:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du rejet de l\'expert'
    });
  }
}));

// PUT /api/admin/experts/:id/suspend - Suspendre un expert approuvé
router.put('/experts/:id/suspend', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).user.id;
    const { reason } = req.body || {};

    const { data: expert, error: expertError } = await supabaseClient
      .from('Expert')
      .select('*')
      .eq('id', id)
      .single();

    if (expertError || !expert) {
      return res.status(404).json({
        success: false,
        message: 'Expert non trouvé'
      });
    }

    const { data, error } = await supabaseClient
      .from('Expert')
      .update({
        status: 'suspended',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    await supabaseClient
      .from('AdminAuditLog')
      .insert({
        admin_id: adminId,
        action: 'expert_suspended',
        table_name: 'Expert',
        record_id: id,
        old_values: { status: expert.status },
        new_values: { status: 'suspended', reason },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

    return res.json({
      success: true,
      data,
      message: 'Expert suspendu avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suspension expert:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la suspension de l\'expert'
    });
  }
}));

// PUT /api/admin/experts/:id/reactivate - Réactiver un expert refusé ou suspendu
router.put('/experts/:id/reactivate', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).user.id;

    const { data: expert, error: expertError } = await supabaseClient
      .from('Expert')
      .select('*')
      .eq('id', id)
      .single();

    if (expertError || !expert) {
      return res.status(404).json({
        success: false,
        message: 'Expert non trouvé'
      });
    }

    const updateData: any = {
      status: 'active',
      updated_at: new Date().toISOString()
    };

    if (expert.approval_status !== 'approved') {
      updateData.approval_status = 'approved';
      updateData.approved_at = new Date().toISOString();
      updateData.approved_by = adminId;
    }

    const { data, error } = await supabaseClient
      .from('Expert')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    await supabaseClient
      .from('AdminAuditLog')
      .insert({
        admin_id: adminId,
        action: 'expert_reactivated',
        table_name: 'Expert',
        record_id: id,
        old_values: { status: expert.status, approval_status: expert.approval_status },
        new_values: { status: 'active', approval_status: updateData.approval_status || expert.approval_status },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

    return res.json({
      success: true,
      data,
      message: 'Expert réactivé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur réactivation expert:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la réactivation de l\'expert'
    });
  }
}));

// DELETE /api/admin/experts/:id - Supprimer définitivement un expert
router.delete('/experts/:id', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).user.id;

    const { data: expert, error: expertError } = await supabaseClient
      .from('Expert')
      .select('*')
      .eq('id', id)
      .single();

    if (expertError || !expert) {
      return res.status(404).json({
        success: false,
        message: 'Expert non trouvé'
      });
    }

    const { error } = await supabaseClient
      .from('Expert')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    await supabaseClient
      .from('AdminAuditLog')
      .insert({
        admin_id: adminId,
        action: 'expert_deleted',
        table_name: 'Expert',
        record_id: id,
        old_values: expert,
        new_values: {},
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

    return res.json({
      success: true,
      message: 'Expert supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suppression expert:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'expert'
    });
  }
}));

// PUT /api/admin/experts/:id - Modifier un expert
router.put('/experts/:id', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).user.id;
    const updateData = req.body;

    // Récupérer les anciennes valeurs
    const { data: oldExpert } = await supabaseClient
      .from('Expert')
      .select('*')
      .eq('id', id)
      .single();

    // Hasher le mot de passe si fourni
    let hashedPassword = null;
    if (updateData.password && updateData.password.trim() !== '') {
      console.log('🔐 Hashage du nouveau mot de passe...');
      hashedPassword = await bcrypt.hash(updateData.password, 10);

      // Mettre à jour aussi dans Supabase Auth si l'expert a un auth_user_id
      if (oldExpert?.auth_user_id) {
        try {
          await supabaseClient.auth.admin.updateUserById(
            oldExpert.auth_user_id,
            { password: updateData.password }
          );
          console.log('✅ Mot de passe Supabase Auth mis à jour');
        } catch (authError) {
          console.error('⚠️ Erreur mise à jour mot de passe Auth (non bloquant):', authError);
        }
      }
    }

    // Préparer les données de mise à jour avec mapping correct
    const updateExpertData: any = {
      ...updateData,
      // Mapping city -> location
      location: updateData.city || updateData.location,
      // S'assurer que les nouveaux champs sont présents
      website: updateData.website || null,
      linkedin: updateData.linkedin || null,
      languages: updateData.languages || ['Français'],
      secteur_activite: updateData.secteur_activite || [], // Secteurs d'activité
      availability: updateData.availability || 'disponible',
      max_clients: updateData.max_clients || 10,
      hourly_rate: updateData.hourly_rate !== undefined ? (updateData.hourly_rate || null) : undefined, // Optionnel, NULL accepté
      phone: updateData.phone || null,
      // Stocker autre_produit si fourni
      autre_produit: updateData.autre_produit || null,
      // Mapping compensation (%) -> client_fee_percentage (décimal)
      ...(updateData.compensation !== undefined && {
        client_fee_percentage: updateData.compensation / 100
      }),
      // Ajouter le mot de passe hashé si fourni
      ...(hashedPassword && { password: hashedPassword }),
      updated_at: new Date().toISOString()
    };

    // Supprimer les champs qui ne doivent pas être mis à jour directement dans Expert
    delete updateExpertData.city;
    delete updateExpertData.temp_password;
    delete updateExpertData.produits_eligibles; // Géré séparément
    delete updateExpertData.cabinet_role; // Géré séparément
    delete updateExpertData.compensation; // Mappé vers client_fee_percentage

    const { data, error } = await supabaseClient
      .from('Expert')
      .update(updateExpertData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Mettre à jour les ProduitEligible dans ExpertProduitEligible (si produits_eligibles fournis)
    if (updateData.produits_eligibles !== undefined) {
      try {
        // Supprimer les anciens produits
        await supabaseClient
          .from('ExpertProduitEligible')
          .delete()
          .eq('expert_id', id);

        // Ajouter les nouveaux produits
        if (updateData.produits_eligibles.length > 0) {
          const expertProduitEligibles = updateData.produits_eligibles.map((produitId: string) => ({
            expert_id: id,
            produit_id: produitId,
            niveau_expertise: 'intermediaire',
            statut: 'actif',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));

          const { error: epeError } = await supabaseClient
            .from('ExpertProduitEligible')
            .insert(expertProduitEligibles);

          if (epeError) {
            console.error('⚠️ Erreur mise à jour ExpertProduitEligible (non bloquant):', epeError);
          } else {
            console.log(`✅ ${expertProduitEligibles.length} produits éligibles mis à jour pour l'expert`);
          }
        }
      } catch (epeErr) {
        console.error('⚠️ Erreur lors de la mise à jour des produits (non bloquant):', epeErr);
      }
    }

    // Log de l'action
    await supabaseClient
      .from('AdminAuditLog')
      .insert({
        admin_id: adminId,
        action: 'expert_updated',
        table_name: 'Expert',
        record_id: id,
        old_values: oldExpert,
        new_values: data,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

    return res.json({
      success: true,
      data,
      message: 'Expert modifié avec succès'
    });

  } catch (error) {
    console.error('Erreur modification expert:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de l\'expert'
    });
  }
}));

// POST /api/admin/experts - Créer un nouvel expert
router.post('/experts', asyncHandler(async (req, res) => {
  try {
    const adminId = (req as any).user.id;
    const expertData = req.body;

    // Validation des données requises
    if ((!expertData.first_name && !expertData.last_name) || !expertData.email || !expertData.company_name) {
      return res.status(400).json({
        success: false,
        message: 'Nom, email et nom de l\'entreprise sont requis'
      });
    }

    // Validation du mot de passe
    if (!expertData.password || expertData.password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Un mot de passe d\'au moins 8 caractères est requis'
      });
    }

    // Vérifier si l'email existe déjà
    const { data: existingExpert } = await supabaseClient
      .from('Expert')
      .select('id')
      .eq('email', expertData.email)
      .single();

    if (existingExpert) {
      return res.status(400).json({
        success: false,
        message: 'Un expert avec cet email existe déjà'
      });
    }

    // Hasher le mot de passe
    console.log('🔐 Hashage du mot de passe admin...');
    const hashedPassword = await bcrypt.hash(expertData.password, 10);

    // Créer l'utilisateur Supabase Auth avec le mot de passe fourni
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: expertData.email,
      password: expertData.password, // Utiliser le mot de passe fourni par l'admin
      email_confirm: true,
      user_metadata: {
        type: 'expert',
        name: `${expertData.first_name || ''} ${expertData.last_name || ''}`.trim() || expertData.company_name
      }
    });

    if (authError) {
      console.error('Erreur création utilisateur Auth:', authError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de l\'utilisateur'
      });
    }

    // Préparer les données expert avec tous les champs
    // Migration automatique name → first_name/last_name
    let firstName = expertData.first_name;
    let lastName = expertData.last_name;
    
    // Utiliser directement first_name et last_name
    firstName = expertData.first_name || '';
    lastName = expertData.last_name || '';
    
    const expertInsertData = {
      id: authData.user.id, // Utiliser l'ID Supabase Auth
      first_name: firstName || expertData.company_name || '',
      last_name: lastName || '',
      email: expertData.email,
      password: hashedPassword, // Stocker le mot de passe hashé
      company_name: expertData.company_name,
      specializations: expertData.specializations || [], // Garder pour compatibilité
      autre_produit: expertData.autre_produit || null,
      rating: expertData.rating || 0,
      client_fee_percentage: expertData.compensation ? expertData.compensation / 100 : 0.30, // Convertir % en décimal (30% = 0.30)
      status: expertData.status || 'active',
      approval_status: expertData.approval_status || 'pending',
      experience: expertData.experience,
      description: expertData.description,
      siren: expertData.siren,
      abonnement: expertData.abonnement || 'starter',
      // Nouveaux champs
      website: expertData.website || null,
      linkedin: expertData.linkedin || null,
      languages: expertData.languages || ['Français'],
      secteur_activite: expertData.secteur_activite || [], // Secteurs d'activité de l'expert
      availability: expertData.availability || 'disponible',
      max_clients: expertData.max_clients || 10,
      hourly_rate: expertData.hourly_rate || null, // Optionnel, NULL accepté
      phone: expertData.phone || null,
      location: expertData.city || null, // Mapping city -> location
      auth_user_id: authData.user.id, // 🔥 Lien vers Supabase Auth
      is_active: true,
      created_at: new Date().toISOString()
    };

    // Insérer dans la table Expert
    const { data: newExpert, error: expertError } = await supabaseClient
      .from('Expert')
      .insert(expertInsertData)
      .select()
      .single();

    if (expertError) {
      // Supprimer l'utilisateur Auth si l'insertion échoue
      await supabaseClient.auth.admin.deleteUser(authData.user.id);
      throw expertError;
    }

    // Enregistrer les ProduitEligible dans ExpertProduitEligible (si produits_eligibles fournis)
    if (expertData.produits_eligibles && expertData.produits_eligibles.length > 0) {
      try {
        const expertProduitEligibles = expertData.produits_eligibles.map((produitId: string) => ({
          expert_id: newExpert.id,
          produit_id: produitId,
          niveau_expertise: 'intermediaire',
          statut: 'actif',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { error: epeError } = await supabaseClient
          .from('ExpertProduitEligible')
          .insert(expertProduitEligibles);

        if (epeError) {
          console.error('⚠️ Erreur insertion ExpertProduitEligible (non bloquant):', epeError);
        } else {
          console.log(`✅ ${expertProduitEligibles.length} produits éligibles enregistrés pour l'expert`);
        }
      } catch (epeErr) {
        console.error('⚠️ Erreur lors de l\'enregistrement des produits (non bloquant):', epeErr);
      }
    }

    // Log de l'action
    await supabaseClient
      .from('AdminAuditLog')
      .insert({
        admin_id: adminId,
        action: 'expert_created',
        table_name: 'Expert',
        record_id: newExpert.id,
        new_values: newExpert,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

    return res.status(201).json({
      success: true,
      data: newExpert,
      message: 'Expert créé avec succès'
    });

  } catch (error) {
    console.error('Erreur création expert:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'expert'
    });
  }
}));

// ========================================
// ROUTES CLIENTS
// ========================================

// GET /api/admin/client-produits-eligibles - Données pour le pipeline business
router.get('/client-produits-eligibles', asyncHandler(async (req, res) => {
  try {
    const { data: clientProduitsEligibles, error } = await supabaseClient
      .from('ClientProduitEligible')
      .select(`
        id,
        clientId,
        produitId,
        statut,
        tauxFinal,
        montantFinal,
        dureeFinale,
        current_step,
        progress,
        created_at,
        updated_at,
        simulationId,
        metadata,
        notes,
        priorite,
        dateEligibilite,
        expert_id,
        sessionId,
        Client:Client(id, company_name, email),
        ProduitEligible:ProduitEligible(id, nom, categorie, description)
      `)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      data: clientProduitsEligibles || []
    });

  } catch (error) {
    console.error('Erreur récupération ClientProduitEligible:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données pipeline'
    });
  }
}));

// GET /api/admin/validations/experts - Validations des experts
router.get('/validations/experts', asyncHandler(async (req, res) => {
  try {
    // Récupérer les experts avec leurs informations d'authentification
    const { data: experts, error } = await supabaseClient
      .from('authenticated_users')
      .select(`
        id,
        email,
        user_type,
        profile_id,
        raw_user_meta_data,
        Expert!inner(
          id,
          name,
          company_name,
          approval_status,
          status,
          phone,
          location,
          rating,
          experience,
          created_at,
          updated_at,
          approved_by,
          approved_at
        )
      `)
      .eq('user_type', 'expert')
      .eq('Expert.approval_status', 'pending')
      .order('Expert.created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      data: experts || []
    });

  } catch (error) {
    console.error('Erreur récupération validations experts:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des validations experts'
    });
  }
}));

// GET /api/admin/validations/content - Validations de contenu
router.get('/validations/content', asyncHandler(async (req, res) => {
  try {
    const { data: content, error } = await supabaseClient
      .from('GEDDocument')
      .select(`
        id,
        title,
        description,
        category,
        file_path,
        version,
        created_at,
        last_modified,
        created_by,
        is_active
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      data: content || []
    });

  } catch (error) {
    console.error('Erreur récupération validations content:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des validations content'
    });
  }
}));

// ========================================
// Routes pour les statistiques KPI
// ========================================

// Stats Clients
router.get('/clients/stats', asyncHandler(async (req, res): Promise<void> => {
  try {
    const { data: clients, error: clientsError } = await supabaseClient
      .from('Client')
      .select(`
        id,
        status,
        created_at,
        ClientProduitEligible (
          id,
          statut
        )
      `);

    if (clientsError) throw clientsError;

    const clientsList = clients || [];
    const total_clients = clientsList.length;
    const clients_actifs = clientsList.filter(c => c.status === 'active').length;
    const clients_avec_dossiers = clientsList.filter(c => (c.ClientProduitEligible as any[])?.length > 0).length;
    const taux_engagement = total_clients > 0 ? parseFloat(((clients_avec_dossiers / total_clients) * 100).toFixed(1)) : 0;
    
    const dossiers_en_cours = clientsList.reduce((acc, c) => {
      const dossiers = (c.ClientProduitEligible as any[]) || [];
      return acc + dossiers.filter(d => {
        const status = normalizeDossierStatus(d.statut);
        return status !== 'admin_rejected' && status !== 'refund_completed';
      }).length;
    }, 0);
    
    const date_30j = new Date();
    date_30j.setDate(date_30j.getDate() - 30);
    const nouveaux_ce_mois = clientsList.filter(c => new Date(c.created_at) >= date_30j).length;
    
    res.json({
      success: true,
      data: {
        total_clients,
        clients_actifs,
        taux_engagement,
        dossiers_en_cours,
        nouveaux_ce_mois
      }
    });
  } catch (error) {
    console.error('Erreur stats clients:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des statistiques clients'
    });
  }
}));

// Stats Experts
router.get('/experts/stats', asyncHandler(async (req, res): Promise<void> => {
  try {
    const { data: experts, error: expertsError } = await supabaseClient
      .from('Expert')
      .select(`
        id,
        approval_status,
        rating,
        created_at,
        ClientProduitEligible (
          id,
          statut
        )
      `);

    if (expertsError) throw expertsError;

    const expertsList = experts || [];
    const total_experts = expertsList.length;
    const experts_approuves = expertsList.filter(e => e.approval_status === 'approved').length;
    const en_attente_validation = expertsList.filter(e => e.approval_status === 'pending').length;
    
    const ratings = expertsList.filter(e => e.rating).map(e => e.rating);
    const note_moyenne = ratings.length > 0 
      ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
      : 0;
    
    const dossiers_actifs = expertsList.reduce((acc, e) => {
      const dossiers = (e.ClientProduitEligible as any[]) || [];
      return acc + dossiers.filter(d => d.statut === 'en_cours').length;
    }, 0);
    
    res.json({
      success: true,
      data: {
        total_experts,
        experts_approuves,
        note_moyenne,
        dossiers_actifs,
        en_attente_validation
      }
    });
  } catch (error) {
    console.error('Erreur stats experts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des statistiques experts'
    });
  }
}));

// Stats Dossiers
router.get('/dossiers/stats', asyncHandler(async (req, res): Promise<void> => {
  try {
    const { data: dossiers, error: dossiersError } = await supabaseClient
      .from('ClientProduitEligible')
      .select('*');

    if (dossiersError) throw dossiersError;

    const dossiersList = dossiers || [];
    const total_dossiers = dossiersList.length;
    const activeStatuses = new Set([
      'pending_upload',
      'pending_admin_validation',
      'admin_validated',
      'expert_assigned',
      'expert_pending_validation',
      'expert_validated',
      'charte_pending',
      'charte_signed',
      'documents_requested',
      'complementary_documents_upload_pending',
      'complementary_documents_sent',
      'complementary_documents_validated',
      'complementary_documents_refused',
      'audit_in_progress',
      'audit_completed',
      'validation_pending',
      'validated',
      'implementation_in_progress',
      'implementation_validated',
      'payment_requested',
      'payment_in_progress'
    ]);
    const dossiers_actifs = dossiersList.filter(d => activeStatuses.has(normalizeDossierStatus(d.statut))).length;
    const dossiers_valides = dossiersList.filter(d => normalizeDossierStatus(d.statut) === 'validated').length;
    const taux_reussite = total_dossiers > 0 ? parseFloat(((dossiers_valides / total_dossiers) * 100).toFixed(1)) : 0;
    
    const en_pre_eligibilite = dossiersList.filter(d => normalizeDossierStatus(d.statut) === 'pending_admin_validation').length;
    
    // Calculer montants (depuis metadata.montant_estime ou champ direct)
    const montants = dossiersList
      .map(d => {
        const montant = d.metadata?.montant_estime || d.montant_estime || 0;
        return typeof montant === 'string' ? parseFloat(montant) : montant;
      })
      .filter(m => !isNaN(m) && m > 0);
    
    const montant_total = montants.reduce((acc, m) => acc + m, 0);
    const montant_moyen = montants.length > 0 ? montant_total / montants.length : 0;
    
    res.json({
      success: true,
      data: {
        total_dossiers,
        dossiers_actifs,
        taux_reussite,
        en_pre_eligibilite,
        montant_total: Math.round(montant_total),
        montant_moyen: Math.round(montant_moyen)
      }
    });
  } catch (error) {
    console.error('Erreur stats dossiers:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des statistiques dossiers'
    });
  }
}));

// GET /api/admin/clients - Liste des clients avec filtres
router.get('/clients', asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    let query = supabaseClient
      .from('Client')
      .select(`
        id,
        email,
        company_name,
        phone_number,
        statut,
        created_at,
        derniereConnexion,
        siren,
        type
      `);

    // Filtres
    if (status && status !== "all") {
      query = query.eq('statut', String(status));
    }
    if (search) {
      query = query.or(`email.ilike.%${search}%,company_name.ilike.%${search}%,city.ilike.%${search}%`);
    }

    // Tri
    query = query.order(String(sortBy), { ascending: String(sortOrder) === 'asc' });

    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    query = query.range(offset, offset + Number(limit) - 1);

    const { data: clients, error } = await query;

    if (error) {
      throw error;
    }

    // Récupérer le nombre total pour la pagination
    const { count: totalCount } = await supabaseClient
      .from('Client')
      .select('*', { count: 'exact', head: true });

    return res.json({
      success: true,
      data: {
        clients,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / Number(limit))
        }
      }
    });

  } catch (error) {
    console.error('Erreur récupération clients:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des clients'
    });
  }
}));

// POST /api/admin/clients - Créer un nouveau client avec compte Auth
router.post('/clients', asyncHandler(async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      company_name,
      phone,
      address,
      city,
      postal_code,
      siren,
      secteurActivite,
      nombreEmployes,
      revenuAnnuel,
      notes,
      username
    } = req.body;

    // Validation des données
    if (!email || !company_name || !first_name || !last_name || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, nom, prénom, entreprise et mot de passe sont requis'
      });
    }

    // Vérifier si l'email existe déjà dans Supabase Auth
    const { data: existingAuthUser } = await supabaseClient.auth.admin.listUsers();
    const emailExists = existingAuthUser?.users?.some(u => u.email === email);

    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // 1. Créer le compte Supabase Auth
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        name: `${first_name} ${last_name}`,
        type: 'client',
        company_name,
        phone_number: phone,
        siren,
        city,
        postal_code,
        address,
        email_verified: true
      }
    });

    if (authError || !authData.user) {
      console.error('❌ Erreur création auth:', authError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du compte utilisateur',
        details: authError?.message
      });
    }

    // 2. Créer l'entrée dans la table Client
    // Convertir les chaînes vides en NULL pour les champs numériques
    const nombreEmployesValue = nombreEmployes === '' || nombreEmployes === null || nombreEmployes === undefined 
      ? null 
      : Number(nombreEmployes);
    const revenuAnnuelValue = revenuAnnuel === '' || revenuAnnuel === null || revenuAnnuel === undefined 
      ? null 
      : Number(revenuAnnuel);

    const { data: newClient, error: clientError } = await supabaseClient
      .from('Client')
      .insert({
        auth_user_id: authData.user.id,
        email,
        first_name,
        last_name,
        name: `${first_name} ${last_name}`,
        username: username || `${first_name}${last_name}`,
        company_name,
        phone_number: phone,
        address,
        city,
        postal_code,
        siren,
        secteurActivite,
        nombreEmployes: nombreEmployesValue,
        revenuAnnuel: revenuAnnuelValue,
        type: 'client',
        statut: 'actif',
        notes,
        dateCreation: new Date().toISOString(),
        derniereConnexion: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by_admin: (req as any).user?.database_id || null,
        metadata: {
          created_via: 'admin_form',
          created_by: (req as any).user?.email,
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (clientError) {
      console.error('❌ Erreur création client dans BDD:', clientError);
      // Supprimer le compte Auth si échec création client
      await supabaseClient.auth.admin.deleteUser(authData.user.id);
      throw clientError;
    }

    // 3. Log de l'action admin
    await supabaseClient
      .from('AdminAuditLog')
      .insert({
        admin_id: (req as any).user?.id,
        action: 'client_created',
        table_name: 'Client',
        record_id: newClient.id,
        new_values: newClient,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

    console.log('✅ Client créé avec succès par admin:', {
      clientId: newClient.id,
      email: newClient.email,
      authUserId: authData.user.id
    });

    // Ajouter les notes à la timeline si elles existent
    if (notes && notes.trim()) {
      const adminName = (req as any).user?.name || (req as any).user?.email || 'Administrateur';
      await ClientTimelineService.addEvent({
        client_id: newClient.id,
        date: new Date().toISOString(),
        type: 'admin_action',
        actor_type: 'admin',
        actor_id: (req as any).user?.database_id || null,
        actor_name: adminName,
        title: 'Notes internes ajoutées',
        description: notes.trim(),
        metadata: {
          action: 'notes_added',
          created_via: 'admin_form'
        },
        icon: '📝',
        color: 'orange'
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        client: newClient,
        auth_user_id: authData.user.id
      },
      message: 'Client créé avec succès'
    });

  } catch (error) {
    console.error('Erreur création client:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du client'
    });
  }
}));

// GET /api/admin/admins - Liste des administrateurs
router.get('/admins', asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 200, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabaseClient
      .from('Admin')
      .select('id, name, email, is_active, created_at')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    query = query.range(offset, offset + Number(limit) - 1);

    const { data: admins, error } = await query;

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      data: {
        admins: admins || []
      }
    });

  } catch (error: any) {
    console.error('Erreur récupération admins:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des administrateurs'
    });
  }
}));

// POST /api/admin/admins - Créer un nouvel administrateur
router.post('/admins', asyncHandler(async (req, res) => {
  try {
    const adminId = (req as any).user.id;
    const { email, name, password, role } = req.body;

    // Validation des données requises
    if (!email || !name || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, nom et mot de passe sont requis'
      });
    }

    // Validation du mot de passe
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères'
      });
    }

    // Vérifier si l'admin existe déjà dans la table Admin (vérification rapide)
    const { data: existingAdmin } = await supabaseClient
      .from('Admin')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Un administrateur avec cet email existe déjà'
      });
    }

    // 1. Créer l'utilisateur Supabase Auth avec le mot de passe fourni
    // Si l'email existe déjà dans Auth, Supabase retournera une erreur
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        type: 'admin',
        name: name
      }
    });

    if (authError || !authData.user) {
      console.error('❌ Erreur création utilisateur Auth:', authError);
      
      // Vérifier si l'erreur est due à un email déjà existant
      if (authError?.message?.includes('already registered') || 
          authError?.message?.includes('User already registered') ||
          authError?.status === 422) {
        return res.status(400).json({
          success: false,
          message: 'Un utilisateur avec cet email existe déjà dans le système'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du compte utilisateur',
        details: authError?.message
      });
    }

    // 2. Créer l'entrée dans la table Admin
    const { data: newAdmin, error: adminError } = await supabaseClient
      .from('Admin')
      .insert({
        email,
        name,
        role: role || 'admin',
        is_active: true,
        auth_user_id: authData.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, email, name, role, is_active, auth_user_id, created_at')
      .single();

    if (adminError) {
      console.error('❌ Erreur création admin:', adminError);
      
      // Nettoyer : supprimer l'utilisateur Auth créé si la création Admin échoue
      try {
        await supabaseClient.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error('❌ Erreur lors du nettoyage:', cleanupError);
      }
      
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de l\'administrateur',
        details: adminError.message
      });
    }

    // 3. Envoyer l'email avec les identifiants au nouvel admin
    try {
      const { EmailService } = await import('../services/EmailService');
      const emailSent = await EmailService.sendAdminCredentials(
        newAdmin.email,
        newAdmin.name,
        password
      );

      if (!emailSent) {
        console.warn('⚠️ L\'email n\'a pas pu être envoyé, mais l\'admin a été créé avec succès');
        // Ne pas faire échouer la création si l'email échoue
      } else {
        console.log('✅ Email identifiants envoyé avec succès à:', newAdmin.email);
      }
    } catch (emailError) {
      console.warn('⚠️ Erreur lors de l\'envoi de l\'email:', emailError);
      // Ne pas faire échouer la création si l'email échoue
    }

    // 4. Logger l'action dans AdminAuditLog
    try {
      const { error: logError } = await supabaseClient.rpc('log_admin_action', {
        p_admin_id: adminId,
        p_action: 'CREATE_ADMIN',
        p_table_name: 'Admin',
        p_record_id: newAdmin.id,
        p_old_values: null,
        p_new_values: JSON.stringify({
          email: newAdmin.email,
          name: newAdmin.name,
          role: newAdmin.role,
          is_active: newAdmin.is_active
        }),
        p_description: `Création d'un nouvel administrateur : ${newAdmin.name} (${newAdmin.email})`,
        p_severity: 'INFO'
      });

      if (logError) {
        console.warn('⚠️ Erreur lors du logging de l\'action admin:', logError);
        // Ne pas faire échouer la création si le logging échoue
      }
    } catch (logError) {
      console.warn('⚠️ Erreur lors du logging de l\'action admin:', logError);
    }

    console.log('✅ Admin créé avec succès:', {
      id: newAdmin.id,
      email: newAdmin.email,
      name: newAdmin.name,
      created_by: adminId
    });

    return res.status(201).json({
      success: true,
      message: 'Administrateur créé avec succès',
      data: {
        admin: {
          id: newAdmin.id,
          email: newAdmin.email,
          name: newAdmin.name,
          role: newAdmin.role,
          is_active: newAdmin.is_active,
          created_at: newAdmin.created_at
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur création admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'administrateur',
      details: error.message
    });
  }
}));

// PUT /api/admin/profile/password - Changer le mot de passe de l'admin connecté
router.put('/profile/password', asyncHandler(async (req, res) => {
  try {
    const adminId = (req as any).user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 8 caractères'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Les nouveaux mots de passe ne correspondent pas'
      });
    }

    // Récupérer l'admin
    const { data: admin, error: adminError } = await supabaseClient
      .from('Admin')
      .select('id, email, auth_user_id')
      .eq('id', adminId)
      .single();

    if (adminError || !admin) {
      return res.status(404).json({
        success: false,
        message: 'Administrateur non trouvé'
      });
    }

    // Vérifier l'ancien mot de passe en tentant une connexion
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: admin.email!,
      password: currentPassword
    });

    if (authError || !authData?.user) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Mettre à jour le mot de passe dans Supabase Auth
    if (admin.auth_user_id) {
      const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
        admin.auth_user_id,
        { password: newPassword }
      );

      if (updateError) {
        console.error('❌ Erreur mise à jour mot de passe:', updateError);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la mise à jour du mot de passe',
          details: updateError.message
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Aucun compte d\'authentification associé'
      });
    }

    // Logger l'action
    try {
      await supabaseClient.rpc('log_admin_action', {
        p_admin_id: adminId,
        p_action: 'CHANGE_PASSWORD',
        p_table_name: 'Admin',
        p_record_id: adminId,
        p_old_values: null,
        p_new_values: JSON.stringify({ password_changed: true }),
        p_description: 'Changement de mot de passe administrateur',
        p_severity: 'INFO'
      });
    } catch (logError) {
      console.warn('⚠️ Erreur lors du logging:', logError);
    }

    console.log('✅ Mot de passe admin mis à jour avec succès:', admin.email);

    return res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });

  } catch (error: any) {
    console.error('❌ Erreur changement mot de passe admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe',
      details: error.message
    });
  }
}));

// POST /api/admin/clients/:clientId/simulation - Créer simulation et calculer éligibilité
router.post('/clients/:clientId/simulation', asyncHandler(async (req, res) => {
  try {
    const { clientId } = req.params;
    const { answers } = req.body;

    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Les réponses de simulation sont requises'
      });
    }

    console.log('🧮 Création simulation pour client:', clientId, `avec ${Object.keys(answers).length} réponse(s)`);

    // 1. Vérifier que le client existe
    const { data: client, error: clientError } = await supabaseClient
      .from('Client')
      .select('id, email, company_name')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    // 2. Créer la simulation
    const { data: simulation, error: simulationError } = await supabaseClient
      .from('simulations')
      .insert({
        client_id: clientId,
        type: 'authentifiee',
        status: 'completed',
        answers: answers,
        metadata: {
          source: 'admin_form',
          created_by: (req as any).user?.email,
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (simulationError || !simulation) {
      console.error('❌ Erreur création simulation:', simulationError);
      throw simulationError || new Error('Erreur lors de la création de la simulation');
    }

    console.log('✅ Simulation créée:', simulation.id);

    // 3. Calculer l'éligibilité via la fonction SQL
    const { data: resultatsSQL, error: calcError } = await supabaseClient
      .rpc('evaluer_eligibilite_avec_calcul', {
        p_simulation_id: simulation.id
      });

    if (calcError) {
      console.error('❌ Erreur calcul éligibilité:', calcError);
      // Continue même si le calcul échoue
    }

    console.log(`✅ Calcul terminé: ${resultatsSQL?.total_eligible || 0} produit(s) éligible(s)`);

    // 4. Récupérer les produits éligibles créés
    const { data: produitsEligibles, error: produitsError } = await supabaseClient
      .from('ClientProduitEligible')
      .select(`
        *,
        ProduitEligible!inner(
          id,
          nom,
          description,
          categorie,
          montant_min,
          montant_max,
          taux_min,
          taux_max
        )
      `)
      .eq('clientId', clientId)
      .in('statut', ['pending_upload', 'pending_admin_validation', 'admin_validated'])
      .order('montantFinal', { ascending: false, nullsFirst: false });

    if (produitsError) {
      console.error('❌ Erreur récupération produits:', produitsError);
    }

    const eligibleProducts = (produitsEligibles || []).map((cp: any) => ({
      id: cp.id,
      produitId: cp.produitId,
      statut: cp.statut,
      tauxFinal: cp.tauxFinal,
      montantFinal: cp.montantFinal,
      dureeFinale: cp.dureeFinale,
      produit: cp.ProduitEligible
    }));

    // 5. Log de l'action admin
    await supabaseClient
      .from('AdminAuditLog')
      .insert({
        admin_id: (req as any).user?.id,
        action: 'simulation_created',
        table_name: 'simulations',
        record_id: simulation.id,
        new_values: { simulation_id: simulation.id, client_id: clientId, eligible_count: eligibleProducts.length },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

    return res.status(201).json({
      success: true,
      data: {
        simulation_id: simulation.id,
        eligible_products: eligibleProducts,
        total_eligible: eligibleProducts.length,
        total_savings: eligibleProducts.reduce((sum: number, p: any) => sum + (p.montantFinal || 0), 0)
      },
      message: `${eligibleProducts.length} produit(s) éligible(s) identifié(s)`
    });

  } catch (error) {
    console.error('❌ Erreur simulation admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul d\'éligibilité',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
}));

// GET /api/admin/clients/:id - Détails d'un client
router.get('/clients/:id', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer les informations du client
    const { data: client, error: clientError } = await supabaseClient
      .from('Client')
      .select('*')
      .eq('id', id)
      .single();

    if (clientError || !client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    // Récupérer les produits éligibles du client
    const { data: produitsEligibles } = await supabaseClient
      .from('ClientProduitEligible')
      .select(`
        *,
        ProduitEligible:ProduitEligible!inner(
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
      .eq('clientId', id);

    // Récupérer les audits du client
    const { data: audits } = await supabaseClient
      .from('Audit')
      .select(`
        *,
        Expert(name, email, company_name)
      `)
      .eq('client_id', id);

    // Récupérer la signature de charte
    const { data: charteSignature } = await supabaseClient
      .from('client_charte_signature')
      .select('*')
      .eq('client_id', id)
      .single();

    // Statistiques du client
    const stats = {
      totalProduits: produitsEligibles && produitsEligibles.length ? produitsEligibles.length : 0,
      produitsEligibles: produitsEligibles && produitsEligibles.length ? 
        produitsEligibles.filter(p => {
          const status = normalizeDossierStatus(p.statut);
          return status === 'pending_upload' || status === 'pending_admin_validation' || status === 'admin_validated';
        }).length : 0,
      totalAudits: audits && audits.length ? audits.length : 0,
      auditsEnCours: audits && audits.length ? 
        audits.filter(a => a.status === 'en_cours').length : 0,
      auditsTermines: audits && audits.length ? 
        audits.filter(a => a.status === 'terminé').length : 0,
      gainsPotentiels: audits && audits.length ? 
        audits.reduce((sum, a) => sum + (a.potential_gain || 0), 0) : 0,
      gainsObtenus: audits && audits.length ? 
        audits.reduce((sum, a) => sum + (a.obtained_gain || 0), 0) : 0,
      charteSignee: !!charteSignature
    };

    return res.json({
      success: true,
      data: {
        client,
        produitsEligibles: produitsEligibles || [],
        audits: audits || [],
        charteSignature,
        stats
      }
    });

  } catch (error) {
    console.error('Erreur récupération client:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du client'
    });
  }
}));

// PUT /api/admin/clients/:id/status - Modifier le statut d'un client
router.put('/clients/:id/status', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = (req as any).user.id;

    // Récupérer les anciennes valeurs
    const { data: oldClient } = await supabaseClient
      .from('Client')
      .select('statut')
      .eq('id', id)
      .single();

    const { data, error } = await supabaseClient
      .from('Client')
      .update({
        statut: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log de l'action
    await supabaseClient
      .from('AdminAuditLog')
      .insert({
        admin_id: adminId,
        action: 'client_status_updated',
        table_name: 'Client',
        record_id: id,
        old_values: { statut: oldClient?.statut },
        new_values: { statut: status },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

    res.json({
      success: true,
      data,
      message: 'Statut du client modifié avec succès'
    });

  } catch (error) {
    console.error('Erreur modification statut client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du statut'
    });
  }
}));

// DELETE /api/admin/clients/:id - Supprimer un client définitivement
router.delete('/clients/:id', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).user.id;

    // Récupérer les informations du client avant suppression
    const { data: client, error: clientFetchError } = await supabaseClient
      .from('Client')
      .select('*')
      .eq('id', id)
      .single();

    if (clientFetchError || !client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    console.log(`🗑️ Suppression définitive du client ${id} (${client.email}) par l'admin ${adminId}`);

    // ⚠️ IMPORTANT: Supprimer dans l'ordre pour respecter les contraintes FK
    // Ordre basé sur les règles FK : NO ACTION d'abord, puis CASCADE/SET NULL

    // PRIORITÉ 1 : Tables avec NO ACTION (doivent être supprimées AVANT les clients)
    try {
      await supabaseClient.from('RDV_Task').delete().eq('client_id', id);
      await supabaseClient.from('RDV_Timeline').delete().eq('client_id', id);
    } catch (err: any) {
      // Ignorer si les tables n'existent pas
      if (!err.message?.includes('does not exist')) {
        console.warn('Erreur suppression RDV_Task/Timeline:', err.message);
      }
    }

    // PRIORITÉ 2 : Documents et fichiers
    await supabaseClient.from('ClientProcessDocument').delete().eq('client_id', id);
    await supabaseClient.from('SharedClientDocument').delete().eq('client_id', id);
    try {
      await supabaseClient.from('GEDDocument').delete().eq('created_by', id);
    } catch (err: any) {
      if (!err.message?.includes('does not exist')) {
        console.warn('Erreur suppression GEDDocument:', err.message);
      }
    }
    await supabaseClient.from('document_request').delete().eq('client_id', id);

    // PRIORITÉ 3 : Dossiers et produits
    await supabaseClient.from('Dossier').delete().eq('clientId', id);
    await supabaseClient.from('ClientProduitEligible').delete().eq('clientId', id);
    try {
      await supabaseClient.from('ClientStatut').delete().eq('client_id', id);
    } catch (err: any) {
      if (!err.message?.includes('does not exist')) {
        console.warn('Erreur suppression ClientStatut:', err.message);
      }
    }

    // PRIORITÉ 4 : Rendez-vous
    await supabaseClient.from('RDV').delete().eq('client_id', id);
    try {
      await supabaseClient.from('Appointment').delete().eq('clientId', id);
      await supabaseClient.from('Reminder').delete().eq('client_id', id);
    } catch (err: any) {
      if (!err.message?.includes('does not exist')) {
        console.warn('Erreur suppression Appointment/Reminder:', err.message);
      }
    }

    // PRIORITÉ 5 : Simulations
    await supabaseClient.from('simulations').delete().eq('client_id', id);
    try {
      await supabaseClient.from('simulationhistory').delete().eq('client_id', id);
    } catch (err: any) {
      if (!err.message?.includes('does not exist')) {
        console.warn('Erreur suppression simulationhistory:', err.message);
      }
    }

    // PRIORITÉ 6 : Expert et assignations
    await supabaseClient.from('expertassignment').delete().eq('client_id', id);
    try {
      await supabaseClient.from('ClientExpert').delete().eq('client_id', id);
    } catch (err: any) {
      if (!err.message?.includes('does not exist')) {
        console.warn('Erreur suppression ClientExpert:', err.message);
      }
    }

    // PRIORITÉ 7 : Signatures et timeline
    await supabaseClient.from('client_charte_signature').delete().eq('client_id', id);
    try {
      await supabaseClient.from('client_timeline').delete().eq('client_id', id);
    } catch (err: any) {
      if (!err.message?.includes('does not exist')) {
        console.warn('Erreur suppression client_timeline:', err.message);
      }
    }

    // PRIORITÉ 8 : Notifications
    await supabaseClient
      .from('notification')
      .delete()
      .eq('user_id', id)
      .eq('user_type', 'client');

    // PRIORITÉ 9 : Audits (peut ne pas exister dans toutes les bases)
    try {
      await supabaseClient.from('Audit').delete().or(`clientId.eq.${id},client_id.eq.${id}`);
    } catch (err: any) {
      if (!err.message?.includes('does not exist')) {
        console.warn('Erreur suppression Audit:', err.message);
      }
    }

    // ENFIN : Supprimer le client
    const { error: deleteError } = await supabaseClient
      .from('Client')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    // Log de l'action
    await supabaseClient
      .from('AdminAuditLog')
      .insert({
        admin_id: adminId,
        action: 'client_deleted',
        table_name: 'Client',
        record_id: id,
        old_values: client,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        metadata: {
          email: client.email,
          company_name: client.company_name,
          deleted_at: new Date().toISOString()
        }
      });

    console.log(`✅ Client ${id} supprimé définitivement avec toutes ses dépendances`);

    return res.json({
      success: true,
      message: 'Client supprimé définitivement avec toutes ses données associées'
    });

  } catch (error: any) {
    console.error('Erreur suppression client:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la suppression du client'
    });
  }
}));

// PUT /api/admin/clients/:id/notes - Modifier les notes internes d'un client
router.put('/clients/:id/notes', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = (req as any).user?.database_id;
    const adminName = (req as any).user?.name || (req as any).user?.email || 'Administrateur';

    // Récupérer les anciennes notes
    const { data: oldClient } = await supabaseClient
      .from('Client')
      .select('notes')
      .eq('id', id)
      .single();

    if (!oldClient) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    // Mettre à jour les notes
    const { data: updatedClient, error } = await supabaseClient
      .from('Client')
      .update({
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Ajouter un événement à la timeline
    const hadNotes = oldClient.notes && oldClient.notes.trim();
    const hasNotes = notes && notes.trim();
    
    if (hasNotes) {
      // Si on modifie ou ajoute des notes
      await ClientTimelineService.addEvent({
        client_id: id,
        date: new Date().toISOString(),
        type: 'admin_action',
        actor_type: 'admin',
        actor_id: adminId,
        actor_name: adminName,
        title: hadNotes ? 'Notes internes modifiées' : 'Notes internes ajoutées',
        description: notes.trim(),
        metadata: {
          action: hadNotes ? 'notes_updated' : 'notes_added',
          previous_notes: hadNotes ? oldClient.notes : null
        },
        icon: '📝',
        color: 'orange'
      });
    } else if (hadNotes) {
      // Si on supprime les notes
      await ClientTimelineService.addEvent({
        client_id: id,
        date: new Date().toISOString(),
        type: 'admin_action',
        actor_type: 'admin',
        actor_id: adminId,
        actor_name: adminName,
        title: 'Notes internes supprimées',
        description: 'Les notes internes ont été supprimées',
        metadata: {
          action: 'notes_deleted',
          previous_notes: oldClient.notes
        },
        icon: '🗑️',
        color: 'red'
      });
    }

    // Log de l'action
    await supabaseClient
      .from('AdminAuditLog')
      .insert({
        admin_id: (req as any).user?.id,
        action: 'client_notes_updated',
        table_name: 'Client',
        record_id: id,
        old_values: { notes: oldClient.notes },
        new_values: { notes: notes || null },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

    return res.json({
      success: true,
      data: updatedClient,
      message: 'Notes mises à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur modification notes client:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification des notes'
    });
  }
}));

// DELETE /api/admin/clients/:id/notes - Supprimer les notes internes d'un client
router.delete('/clients/:id/notes', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).user?.database_id;
    const adminName = (req as any).user?.name || (req as any).user?.email || 'Administrateur';

    // Récupérer les anciennes notes
    const { data: oldClient } = await supabaseClient
      .from('Client')
      .select('notes')
      .eq('id', id)
      .single();

    if (!oldClient) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    if (!oldClient.notes || !oldClient.notes.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Aucune note à supprimer'
      });
    }

    // Supprimer les notes
    const { data: updatedClient, error } = await supabaseClient
      .from('Client')
      .update({
        notes: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Ajouter un événement à la timeline
    await ClientTimelineService.addEvent({
      client_id: id,
      date: new Date().toISOString(),
      type: 'admin_action',
      actor_type: 'admin',
      actor_id: adminId,
      actor_name: adminName,
      title: 'Notes internes supprimées',
      description: 'Les notes internes ont été supprimées',
      metadata: {
        action: 'notes_deleted',
        previous_notes: oldClient.notes
      },
      icon: '🗑️',
      color: 'red'
    });

    // Log de l'action
    await supabaseClient
      .from('AdminAuditLog')
      .insert({
        admin_id: (req as any).user?.id,
        action: 'client_notes_deleted',
        table_name: 'Client',
        record_id: id,
        old_values: { notes: oldClient.notes },
        new_values: { notes: null },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

    return res.json({
      success: true,
      data: updatedClient,
      message: 'Notes supprimées avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression notes client:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression des notes'
    });
  }
}));

// POST /api/admin/clients/:id/client-produit-eligible/calculate - Calculer les valeurs à partir des réponses
router.post('/clients/:id/client-produit-eligible/calculate', asyncHandler(async (req, res) => {
  try {
    const { produitId, answers } = req.body;

    if (!produitId) {
      return res.status(400).json({
        success: false,
        message: 'produitId est obligatoire'
      });
    }

    // Récupérer le produit avec sa formule
    const { data: produit, error: produitError } = await supabaseClient
      .from('ProduitEligible')
      .select('id, nom, formule_calcul, parametres_requis, taux_min, taux_max, duree_min, duree_max')
      .eq('id', produitId)
      .single();

    if (produitError || !produit) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    // Mapper les réponses vers les variables de formule
    const { data: mappedAnswers, error: mapError } = await supabaseClient.rpc('mapper_reponses_vers_variables', {
      p_reponses: answers || {}
    });

    if (mapError) {
      console.error('Erreur mapping réponses:', mapError);
      // Continuer avec les réponses brutes si le mapping échoue
    }

    const reponsesMappees = mappedAnswers || answers || {};

    // Calculer le montant avec la fonction SQL
    const { data: calculResult, error: calcError } = await supabaseClient.rpc('calculer_montant_produit', {
      p_produit_id: produitId,
      p_reponses: reponsesMappees
    });

    if (calcError) {
      console.error('Erreur calcul produit:', calcError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du calcul du montant',
        error: calcError.message
      });
    }

    // Extraire les valeurs du résultat
    const montantFinal = calculResult?.montant || 0;
    const calculDetails = calculResult?.details || {};
    const isEligible = calculResult?.is_eligible || false;

    // Déterminer tauxFinal et dureeFinale selon le produit
    // Par défaut, utiliser les valeurs min/max du produit ou des valeurs par défaut
    let tauxFinal = produit.taux_min || 0.35; // 35% par défaut
    let dureeFinale = produit.duree_min || 12; // 12 mois par défaut

    // Si le produit a des taux min/max, utiliser la moyenne ou le min
    if (produit.taux_min && produit.taux_max) {
      tauxFinal = (produit.taux_min + produit.taux_max) / 2;
    } else if (produit.taux_min) {
      tauxFinal = produit.taux_min;
    }

    // Convertir tauxFinal en décimal si nécessaire (si > 1, c'est un pourcentage)
    if (tauxFinal > 1) {
      tauxFinal = tauxFinal / 100;
    }

    return res.json({
      success: true,
      data: {
        montantFinal: Math.round(montantFinal * 100) / 100,
        tauxFinal: Math.round(tauxFinal * 10000) / 10000, // 4 décimales
        dureeFinale,
        isEligible,
        calculDetails,
        reponsesMappees
      }
    });

  } catch (error: any) {
    console.error('Erreur calcul ClientProduitEligible:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du calcul'
    });
  }
}));

// POST /api/admin/clients/:id/client-produit-eligible - Créer un ClientProduitEligible pour un client
router.post('/clients/:id/client-produit-eligible', asyncHandler(async (req, res) => {
  try {
    const { id: clientId } = req.params;
    const adminId = (req as any).user?.database_id;
    const adminName = (req as any).user?.name || (req as any).user?.email || 'Administrateur';
    
    const {
      produitId,
      montantFinal,
      tauxFinal,
      dureeFinale,
      clientFeePercentage,
      profitumFeePercentage,
      notes,
      calcul_details
    } = req.body;

    // Validation des champs obligatoires
    if (!produitId || montantFinal === undefined || tauxFinal === undefined || dureeFinale === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Les champs produitId, montantFinal, tauxFinal et dureeFinale sont obligatoires'
      });
    }

    // Vérifier que le client existe
    const { data: client, error: clientError } = await supabaseClient
      .from('Client')
      .select('id, email, company_name, first_name, last_name')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    // Vérifier que le produit existe
    const { data: produit, error: produitError } = await supabaseClient
      .from('ProduitEligible')
      .select('id, nom, categorie')
      .eq('id', produitId)
      .single();

    if (produitError || !produit) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    // Normaliser tauxFinal : si > 1, c'est un pourcentage, convertir en décimal
    let tauxFinalNormalized = parseFloat(tauxFinal);
    if (tauxFinalNormalized > 1) {
      tauxFinalNormalized = tauxFinalNormalized / 100;
    }

    // Déterminer le statut initial
    const statut = montantFinal >= 1000 ? 'eligible' : 'to_confirm';

    // Créer le ClientProduitEligible
    const { data: newDossier, error: insertError } = await supabaseClient
      .from('ClientProduitEligible')
      .insert({
        clientId: clientId,
        produitId: produitId,
        statut: statut,
        montantFinal: parseFloat(montantFinal),
        tauxFinal: tauxFinalNormalized, // Utiliser la valeur normalisée
        dureeFinale: parseInt(dureeFinale),
        notes: notes || `Créé manuellement par ${adminName}`,
        calcul_details: calcul_details || {},
        metadata: {
          source: 'admin_manual_creation',
          created_by: adminId,
          created_by_name: adminName,
          created_at: new Date().toISOString(),
          client_fee_percentage: clientFeePercentage ? parseFloat(clientFeePercentage) : 0.30,
          profitum_fee_percentage: profitumFeePercentage ? parseFloat(profitumFeePercentage) : 0.30
        },
        priorite: montantFinal >= 10000 ? 1 : montantFinal >= 5000 ? 2 : 3,
        dateEligibilite: new Date().toISOString(),
        current_step: 0,
        progress: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erreur création ClientProduitEligible:', insertError);
      throw insertError;
    }

    // Ajouter un événement à la timeline
    await ClientTimelineService.addEvent({
      client_id: clientId,
      dossier_id: newDossier.id,
      date: new Date().toISOString(),
      type: 'dossier_created',
      actor_type: 'admin',
      actor_id: adminId,
      actor_name: adminName,
      title: `Dossier créé: ${produit.nom}`,
      description: `Un nouveau dossier a été créé pour le produit ${produit.nom} avec un montant de ${montantFinal}€`,
      metadata: {
        dossier_id: newDossier.id,
        produit_id: produitId,
        produit_nom: produit.nom,
        montant: montantFinal,
        statut: statut
      },
      icon: '📁',
      color: 'blue'
    });

    // Log de l'action
    await supabaseClient
      .from('AdminAuditLog')
      .insert({
        admin_id: (req as any).user?.id,
        action: 'client_produit_eligible_created',
        table_name: 'ClientProduitEligible',
        record_id: newDossier.id,
        new_values: newDossier,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

    return res.json({
      success: true,
      data: newDossier,
      message: 'Dossier créé avec succès'
    });

  } catch (error: any) {
    console.error('Erreur création ClientProduitEligible:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la création du dossier'
    });
  }
}));

// Route pour récupérer tous les dossiers clients (ClientProduitEligible)
router.get('/dossiers', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, client, produit, expert, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
    
    console.log('✅ Admin authentifié:', (req as any).user?.id);

    // Requête pour récupérer les dossiers avec jointures
    let query = supabaseClient
      .from('ClientProduitEligible')
      .select(`
        id,
        clientId,
        expert_id,
        produitId,
        statut,
        montantFinal,
        tauxFinal,
        dureeFinale,
        created_at,
        updated_at,
        current_step,
        progress,
        simulationId,
        metadata,
        notes,
        priorite,
        dateEligibilite,
        Client(
          id,
          email,
          company_name,
          phone_number,
          name,
          city,
          secteurActivite,
          nombreEmployes,
          revenuAnnuel
        ),
        ProduitEligible(
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
        ),
        simulations(
          id,
          created_at
        )
      `);

    // Filtres
    if (status && status !== 'all') {
      query = query.eq('statut', status);
    }
    
    if (client && client !== 'all') {
      query = query.eq('clientId', client);
    }
    
    if (produit && produit !== 'all') {
      query = query.eq('produitId', produit);
    }
    
    if (expert && expert !== 'all') {
      query = query.eq('expert_id', expert);
    }

    // Tri
    query = query.order(sortBy as string, { ascending: sortOrder === 'asc' });

    // Pagination
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    query = query.range(offset, offset + parseInt(limit as string) - 1);

    const { data: dossiers, error, count } = await query;

    if (error) {
      console.error('❌ Erreur récupération dossiers:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la récupération des dossiers' 
      });
    }

    console.log('✅ Dossiers récupérés:', dossiers?.length || 0);

    // Transformer les données pour correspondre au frontend
    const dossiersTransformes = dossiers?.map(dossier => ({
      id: dossier.id,
      client_id: dossier.clientId,
      expert_id: dossier.expert_id,
      produit_eligible_id: dossier.produitId,
      validation_state: dossier.statut,
      created_at: dossier.created_at,
      updated_at: dossier.updated_at,
      montant: dossier.montantFinal,
      taux: dossier.tauxFinal,
      duree: dossier.dureeFinale,
      current_step: dossier.current_step,
      progress: dossier.progress,
      simulationId: dossier.simulationId,
      Client: dossier.Client,
      ProduitEligible: dossier.ProduitEligible,
      simulations: dossier.simulations,
      metadata: dossier.metadata,
      notes: dossier.notes,
      priorite: dossier.priorite
    })) || [];

    return res.json({
      success: true,
      data: {
        dossiers: dossiersTransformes,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: count || 0,
          totalPages: Math.ceil((count || 0) / parseInt(limit as string))
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur route dossiers:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des dossiers' 
    });
  }
});

// Route pour récupérer les statistiques des dossiers
router.get('/dossiers/stats', async (req, res) => {
  try {
    console.log('✅ Récupération des statistiques des dossiers');

    // Statistiques par statut
    const { data: statusStats, error: statusError } = await supabaseClient
      .from('ClientProduitEligible')
      .select('statut');

    if (statusError) {
      console.error('❌ Erreur récupération stats statut:', statusError);
      return res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la récupération des statistiques' 
      });
    }

    const statusCount: StatusCount = {};
    statusStats?.forEach(item => {
      if (item.statut) {
        statusCount[item.statut] = (statusCount[item.statut] || 0) + 1;
      }
    });

    // Statistiques par produit
    const { data: produitStats, error: produitError } = await supabaseClient
      .from('ClientProduitEligible')
      .select(`
        ProduitEligible:ProduitEligible!inner(nom)
      `);

    if (produitError) {
      console.error('❌ Erreur récupération stats produit:', produitError);
      return res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la récupération des statistiques produits' 
      });
    }

    const produitCount: ProduitCount = {};
    produitStats?.forEach(item => {
      const nom = (item.ProduitEligible as any)?.nom;
      if (nom) {
        produitCount[nom] = (produitCount[nom] || 0) + 1;
      }
    });

    // Dossiers avec experts assignés
    const { data: dossiersWithExperts, error: expertsError } = await supabaseClient
      .from('ClientProduitEligible')
      .select('expert_id')
      .not('expert_id', 'is', null);

    if (expertsError) {
      console.error('❌ Erreur récupération stats experts:', expertsError);
      return res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la récupération des statistiques experts' 
      });
    }

    // Statistiques financières
    const { data: montants, error: montantsError } = await supabaseClient
      .from('ClientProduitEligible')
      .select('montantFinal');

    if (montantsError) {
      console.error('❌ Erreur récupération montants:', montantsError);
      return res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la récupération des montants' 
      });
    }

    const totalMontant = montants?.reduce((sum, item) => sum + (item.montantFinal || 0), 0) || 0;
    const montantMoyen = montants?.length ? totalMontant / montants.length : 0;

    console.log('✅ Statistiques calculées avec succès');

    return res.json({
      success: true,
      data: {
        statusStats: statusCount,
        produitStats: produitCount,
        dossiersWithExperts: dossiersWithExperts?.length || 0,
        totalDossiers: statusStats?.length || 0,
        totalMontant,
        montantMoyen,
        dossiersSansExpert: (statusStats?.length || 0) - (dossiersWithExperts?.length || 0)
      }
    });

  } catch (error) {
    console.error('❌ Erreur route dossiers/stats:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des statistiques' 
    });
  }
});

// Route pour récupérer les produits éligibles
router.get('/produits', async (req, res) => {
  try {
    console.log('✅ Récupération des produits éligibles');

    const { data: produits, error } = await supabaseAdmin
      .from('ProduitEligible')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération produits:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Erreur lors de la récupération des produits' 
      });
    }

    console.log('✅ Produits récupérés:', produits?.length || 0);

    return res.json({
      success: true,
      data: {
        produits: produits || []
      }
    });

  } catch (error) {
    console.error('❌ Erreur route produits:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

// Route pour récupérer les statistiques des produits
router.get('/produits/stats', asyncHandler(async (req, res): Promise<void> => {
  try {
    console.log('📊 Récupération statistiques produits...');

    const { data: produits, error } = await supabaseAdmin
      .from('ProduitEligible')
      .select('*');

    if (error) {
      console.error('❌ Erreur récupération produits pour stats:', error);
      res.status(500).json({ 
        success: false,
        error: 'Erreur lors de la récupération des statistiques' 
      });
      return;
    }

    // Calculer les statistiques
    const totalProduits = produits?.length || 0;
    
    // Regrouper par catégorie
    const parCategorie: { [key: string]: number } = {};
    produits?.forEach((p: any) => {
      const cat = p.categorie || 'Non catégorisé';
      parCategorie[cat] = (parCategorie[cat] || 0) + 1;
    });

    // Produits les plus utilisés (basé sur ClientProduitEligible)
    const { data: utilisations, error: errUtilisations } = await supabaseAdmin
      .from('ClientProduitEligible')
      .select('produitId');

    const produitsPopulaires: { [key: string]: number } = {};
    utilisations?.forEach((u: any) => {
      if (u.produitId) {
        produitsPopulaires[u.produitId] = (produitsPopulaires[u.produitId] || 0) + 1;
      }
    });

    // Top 3 produits
    const top3 = Object.entries(produitsPopulaires)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id, count]) => {
        const produit = produits?.find((p: any) => p.id === id);
        return {
          id,
          nom: produit?.nom || 'Inconnu',
          utilisations: count
        };
      });

    console.log('✅ Stats produits calculées:', { totalProduits, categories: Object.keys(parCategorie).length });

    res.json({
      success: true,
      data: {
        stats: {
          total_produits: totalProduits,
          par_categorie: parCategorie,
          total_utilisations: utilisations?.length || 0,
          top_3_produits: top3
        }
      }
    });
    return;

  } catch (error) {
    console.error('❌ Erreur stats produits:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur lors du calcul des statistiques' 
    });
    return;
  }
}));

// Route pour ajouter un nouveau produit
router.post('/produits', async (req, res) => {
  try {
    console.log('✅ Ajout d\'un nouveau produit');

    const {
      nom,
      description,
      categorie,
      secteurs_activite,
      type_produit,
      active,
      montant_min,
      montant_max,
      taux_min,
      taux_max,
      duree_min,
      duree_max
    } = req.body;

    const { data: produit, error } = await supabaseAdmin
      .from('ProduitEligible')
      .insert({
        nom,
        description,
        categorie,
        secteurs_activite: secteurs_activite && Array.isArray(secteurs_activite) ? secteurs_activite : [],
        type_produit: type_produit || 'financier',
        active: active !== undefined ? active : true,
        montant_min: montant_min ? parseFloat(montant_min) : null,
        montant_max: montant_max ? parseFloat(montant_max) : null,
        taux_min: taux_min ? parseFloat(taux_min) : null,
        taux_max: taux_max ? parseFloat(taux_max) : null,
        duree_min: duree_min ? parseInt(duree_min) : null,
        duree_max: duree_max ? parseInt(duree_max) : null
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur ajout produit:', error);
      return res.status(500).json({ error: 'Erreur lors de l\'ajout du produit' });
    }

    console.log('✅ Produit ajouté avec succès:', produit.id);

    return res.json({
      success: true,
      data: {
        produit
      }
    });

  } catch (error) {
    console.error('❌ Erreur route ajout produit:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour modifier un produit
router.put('/produits/:id', async (req, res) => {
  try {
    console.log('✅ Modification du produit:', req.params.id);

    const { id } = req.params;
    const {
      nom,
      description,
      categorie,
      secteurs_activite,
      type_produit,
      active,
      montant_min,
      montant_max,
      taux_min,
      taux_max,
      duree_min,
      duree_max
    } = req.body;

    const { data: produit, error } = await supabaseAdmin
      .from('ProduitEligible')
      .update({
        nom,
        description,
        categorie,
        secteurs_activite: secteurs_activite && Array.isArray(secteurs_activite) ? secteurs_activite : [],
        type_produit,
        active: active !== undefined ? active : true,
        montant_min: montant_min ? parseFloat(montant_min) : null,
        montant_max: montant_max ? parseFloat(montant_max) : null,
        taux_min: taux_min ? parseFloat(taux_min) : null,
        taux_max: taux_max ? parseFloat(taux_max) : null,
        duree_min: duree_min ? parseInt(duree_min) : null,
        duree_max: duree_max ? parseInt(duree_max) : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur modification produit:', error);
      return res.status(500).json({ error: 'Erreur lors de la modification du produit' });
    }

    if (!produit) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    console.log('✅ Produit modifié avec succès:', produit.id);

    return res.json({
      success: true,
      data: {
        produit
      }
    });

  } catch (error) {
    console.error('❌ Erreur route modification produit:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour supprimer un produit
router.delete('/produits/:id', async (req, res) => {
  try {
    console.log('✅ Suppression du produit:', req.params.id);

    const { id } = req.params;

    // Vérifier si le produit est utilisé dans des dossiers
    const { data: dossiers, error: checkError } = await supabaseAdmin
      .from('ClientProduitEligible')
      .select('id')
      .eq('produitId', id);

    if (checkError) {
      console.error('❌ Erreur vérification dossiers:', checkError);
      return res.status(500).json({ error: 'Erreur lors de la vérification des dossiers' });
    }

    if (dossiers && dossiers.length > 0) {
      return res.status(400).json({ 
        error: 'Impossible de supprimer ce produit car il est utilisé dans des dossiers existants' 
      });
    }

    const { error } = await supabaseAdmin
      .from('ProduitEligible')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Erreur suppression produit:', error);
      return res.status(500).json({ error: 'Erreur lors de la suppression du produit' });
    }

    console.log('✅ Produit supprimé avec succès:', id);

    return res.json({
      success: true,
      message: 'Produit supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur route suppression produit:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================================================
// ROUTES SYNTHÈSE PRODUIT
// ============================================================================

// Route pour obtenir les détails d'un produit
router.get('/produits/:id', asyncHandler(async (req, res) => {
  try {
    console.log('📦 Récupération détails produit:', req.params.id);

    const { id } = req.params;

    const { data: produit, error } = await supabaseAdmin
      .from('ProduitEligible')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Erreur récupération produit:', error);
      return res.status(404).json({ 
        success: false,
        error: 'Produit non trouvé' 
      });
    }

    console.log('✅ Produit récupéré:', produit);

    return res.json({
      success: true,
      data: {
        produit
      }
    });

  } catch (error) {
    console.error('❌ Erreur route détails produit:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
}));

// Route pour obtenir les statistiques commerciales d'un produit
router.get('/produits/:id/stats', asyncHandler(async (req, res) => {
  try {
    console.log('📊 Récupération statistiques produit:', req.params.id);

    const { id } = req.params;

    // Requête SQL pour les statistiques
    const { data: stats, error } = await supabaseAdmin
      .rpc('get_produit_stats', { produit_id: id });

    if (error) {
      console.warn('ℹ️ RPC get_produit_stats indisponible, fallback manuel:', error);
      
      // Si la fonction RPC n'existe pas encore, calculer manuellement
      const { data: dossiers, error: dossiersError } = await supabaseAdmin
        .from('ClientProduitEligible')
        .select('statut, "montantFinal", "tauxFinal"')
        .eq('produitId', id);

      if (dossiersError) {
        return res.status(500).json({ 
          success: false,
          error: 'Erreur lors de la récupération des statistiques' 
        });
      }

      // Calculer les stats manuellement
      const total_dossiers = dossiers?.length || 0;
      const dossiers_valides = dossiers?.filter(d => d.statut === 'validated').length || 0;
      const dossiers_en_cours = dossiers?.filter(d => 
        ['pending', 'in_progress', 'documents_uploaded', 'eligible'].includes(d.statut)
      ).length || 0;
      const dossiers_rejetes = dossiers?.filter(d => d.statut === 'rejected').length || 0;

      const montantsValides = dossiers?.map(d => d.montantFinal || 0).filter(m => m > 0) || [];
      const tauxValides = dossiers?.map(d => d.tauxFinal || 0).filter(t => t > 0) || [];

      const montant_total = montantsValides.reduce((sum, m) => sum + m, 0);
      const montant_moyen = montantsValides.length > 0 ? montant_total / montantsValides.length : 0;
      const montant_min_reel = montantsValides.length > 0 ? Math.min(...montantsValides) : 0;
      const montant_max_reel = montantsValides.length > 0 ? Math.max(...montantsValides) : 0;

      const taux_moyen = tauxValides.length > 0 ? tauxValides.reduce((sum, t) => sum + t, 0) / tauxValides.length : 0;
      const taux_min_reel = tauxValides.length > 0 ? Math.min(...tauxValides) : 0;
      const taux_max_reel = tauxValides.length > 0 ? Math.max(...tauxValides) : 0;

      return res.json({
        success: true,
        data: {
          stats: {
            total_dossiers,
            dossiers_valides,
            dossiers_en_cours,
            dossiers_rejetes,
            montant_total,
            montant_moyen,
            montant_min_reel,
            montant_max_reel,
            taux_moyen,
            taux_min_reel,
            taux_max_reel
          }
        }
      });
    }

    return res.json({
      success: true,
      data: {
        stats: stats[0] || {}
      }
    });

  } catch (error) {
    console.error('❌ Erreur route stats produit:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
}));

// Route pour obtenir le top 5 des clients d'un produit
router.get('/produits/:id/top-clients', asyncHandler(async (req, res) => {
  try {
    console.log('👥 Récupération top clients produit:', req.params.id);

    const { id } = req.params;

    const { data: topClientsRaw, error } = await supabaseAdmin
      .from('ClientProduitEligible')
      .select('clientId, "montantFinal"')
      .eq('produitId', id);

    if (error) {
      console.error('❌ Erreur récupération top clients:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Erreur lors de la récupération des top clients' 
      });
    }

    const clientsMap = new Map<string, { nombre_dossiers: number; montant_total: number }>();
    const clientIds = new Set<string>();

    topClientsRaw?.forEach((item: any) => {
      if (!item.clientId) return;
      const montant = item.montantFinal || 0;
      if (!clientsMap.has(item.clientId)) {
        clientsMap.set(item.clientId, { nombre_dossiers: 0, montant_total: 0 });
      }
      const clientData = clientsMap.get(item.clientId)!;
      clientData.nombre_dossiers += 1;
      clientData.montant_total += montant;
      clientIds.add(item.clientId);
    });

    let clientsInfoIndex: Record<string, { company_name: string; email: string }> = {};

    if (clientIds.size > 0) {
      const { data: clientsInfo, error: clientsError } = await supabaseAdmin
        .from('Client')
        .select('id, company_name, first_name, last_name, email')
        .in('id', Array.from(clientIds));

      if (!clientsError && clientsInfo) {
        clientsInfo.forEach((client: any) => {
          const displayName = client.company_name || `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'N/A';
          clientsInfoIndex[client.id] = {
            company_name: displayName,
            email: client.email || 'N/A'
          };
        });
      }
    }

    const topClientsArray = Array.from(clientsMap.entries())
      .map(([clientId, stats]) => {
        const info = clientsInfoIndex[clientId] || { company_name: 'N/A', email: 'N/A' };
        return {
          clientId,
          company_name: info.company_name,
          email: info.email,
          nombre_dossiers: stats.nombre_dossiers,
          montant_total: stats.montant_total,
          montant_moyen: stats.nombre_dossiers > 0 ? stats.montant_total / stats.nombre_dossiers : 0
        };
      })
      .filter(client => !client.email?.includes('@profitum.temp'))
      .sort((a, b) => b.nombre_dossiers - a.nombre_dossiers || b.montant_total - a.montant_total)
      .slice(0, 5);

    return res.json({
      success: true,
      data: {
        topClients: topClientsArray
      }
    });

  } catch (error) {
    console.error('❌ Erreur route top clients:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
}));

// Route pour obtenir l'évolution mensuelle d'un produit
router.get('/produits/:id/evolution', asyncHandler(async (req, res) => {
  try {
    console.log('📈 Récupération évolution produit:', req.params.id);

    const { id } = req.params;

    const { data: dossiers, error } = await supabaseAdmin
      .from('ClientProduitEligible')
      .select('created_at, "montantFinal"')
      .eq('produitId', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération évolution:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Erreur lors de la récupération de l\'évolution' 
      });
    }

    // Grouper par mois
    const evolutionMap = new Map();
    
    dossiers?.forEach((dossier: any) => {
      const date = new Date(dossier.created_at);
      const mois = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const montant = dossier.montantFinal || 0;

      if (!evolutionMap.has(mois)) {
        evolutionMap.set(mois, {
          mois,
          nombre_dossiers: 0,
          montant_total: 0
        });
      }

      const moisData = evolutionMap.get(mois);
      moisData.nombre_dossiers += 1;
      moisData.montant_total += montant;
    });

    // Convertir en tableau et calculer la moyenne
    const evolutionArray = Array.from(evolutionMap.values())
      .map(mois => ({
        ...mois,
        montant_moyen: mois.nombre_dossiers > 0 ? mois.montant_total / mois.nombre_dossiers : 0
      }))
      .sort((a, b) => b.mois.localeCompare(a.mois))
      .slice(0, 12); // 12 derniers mois

    return res.json({
      success: true,
      data: {
        evolution: evolutionArray
      }
    });

  } catch (error) {
    console.error('❌ Erreur route évolution:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
}));

// Route pour obtenir les dossiers liés à un produit
router.get('/produits/:id/dossiers', asyncHandler(async (req, res) => {
  try {
    console.log('📁 Récupération dossiers produit:', req.params.id);

    const { id } = req.params;

    const { data: dossiersRaw, error } = await supabaseAdmin
      .from('ClientProduitEligible')
      .select('*')
      .eq('produitId', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération dossiers:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Erreur lors de la récupération des dossiers' 
      });
    }

    const clientIds = Array.from(new Set((dossiersRaw || [])
      .map((d: any) => d.clientId)
      .filter((id: string | null) => !!id)));

    let clientsIndex: Record<string, any> = {};

    if (clientIds.length > 0) {
      const { data: clientsData, error: clientsError } = await supabaseAdmin
        .from('Client')
        .select('id, company_name, first_name, last_name, email')
        .in('id', clientIds);

      if (!clientsError && clientsData) {
        clientsData.forEach((client: any) => {
          clientsIndex[client.id] = client;
        });
      }
    }

    const dossiers = (dossiersRaw || []).map((dossier: any) => ({
      ...dossier,
      Client: dossier.clientId ? clientsIndex[dossier.clientId] || null : null
    }));

    return res.json({
      success: true,
      data: {
        dossiers
      }
    });

  } catch (error) {
    console.error('❌ Erreur route dossiers produit:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
}));

// ============================================================================
// FIN ROUTES SYNTHÈSE PRODUIT
// ============================================================================

// Route pour ajouter un nouveau dossier
router.post('/dossiers', async (req, res) => {
  try {
    console.log('✅ Ajout d\'un nouveau dossier');

    const {
      client_id,
      produit_id,
      expert_id,
      montant,
      taux,
      duree
    } = req.body;

    const { data: dossier, error } = await supabaseClient
      .from('ClientProduitEligible')
      .insert({
        clientId: client_id,
        produitId: produit_id,
        expert_id: expert_id || null,
        statut: 'en_cours',
        montantFinal: montant ? parseFloat(montant) : null,
        tauxFinal: taux ? parseFloat(taux) : null,
        dureeFinale: duree ? parseInt(duree) : null,
        current_step: 0,
        progress: 0
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur ajout dossier:', error);
      return res.status(500).json({ error: 'Erreur lors de l\'ajout du dossier' });
    }

    console.log('✅ Dossier ajouté avec succès:', dossier.id);

    // 🔧 GÉNÉRATION AUTOMATIQUE DES ÉTAPES
    try {
      const { DossierStepGenerator } = require('../services/dossierStepGenerator');
      const stepsGenerated = await DossierStepGenerator.generateStepsForDossier(dossier.id);
      
      if (stepsGenerated) {
        console.log('✅ Étapes générées automatiquement pour le dossier:', dossier.id);
      } else {
        console.warn('⚠️ Échec de la génération automatique des étapes pour le dossier:', dossier.id);
      }
    } catch (stepError) {
      console.error('❌ Erreur génération automatique des étapes:', stepError);
      // Ne pas faire échouer la création du dossier si la génération d'étapes échoue
    }

    return res.json({
      success: true,
      dossier,
      steps_generated: true
    });

  } catch (error) {
    console.error('❌ Erreur route ajout dossier:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/admin/users - Gestion des utilisateurs
router.get('/users', asyncHandler(async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    if (type === 'clients') {
      const { data: users, error, count } = await supabaseClient
        .from('Client')
        .select('*', { count: 'exact' })
        .range(offset, offset + Number(limit) - 1)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des clients' });
      }

      return res.json({
        success: true,
        data: {
          users: users || [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: count || 0
          }
        }
      });
    } else if (type === 'experts') {
      const { data: users, error, count } = await supabaseClient
        .from('Expert')
        .select('*', { count: 'exact' })
        .range(offset, offset + Number(limit) - 1)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des experts' });
      }

      return res.json({
        success: true,
        data: {
          users: users || [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: count || 0
          }
        }
      });
    } else {
      // Retourner les deux types
      const [clients, experts] = await Promise.all([
        supabaseClient.from('Client').select('*').range(offset, offset + Number(limit) - 1),
        supabaseClient.from('Expert').select('*').range(offset, offset + Number(limit) - 1)
      ]);

      return res.json({
        success: true,
        data: {
          clients: clients.data || [],
          experts: experts.data || [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: (clients.count || 0) + (experts.count || 0)
          }
        }
      });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

// GET /api/admin/assignments - Gestion des assignations
router.get('/assignments', asyncHandler(async (req, res) => {
  try {
    const { status, expert_id, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabaseClient
      .from('expertassignment')
      .select(`
        *,
        Expert (id, name, email, specializations),
        ClientProduitEligible (
          id,
          Client (id, name, company_name, email),
          ProduitEligible (id, nom, description)
        )
      `);

    if (status) {
      query = query.eq('status', status);
    }

    if (expert_id) {
      query = query.eq('expert_id', expert_id);
    }

    const { data: assignments, error, count } = await query
      .range(offset, offset + Number(limit) - 1)
      .order('assignment_date', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des assignations' });
    }

    return res.json({
      success: true,
      data: {
        assignments: assignments || [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des assignations:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

// POST /api/admin/assignments/:id/assign - Assigner un expert
router.post('/assignments/:id/assign', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { expert_id, notes } = req.body;

    const { data: assignment, error } = await supabaseClient
      .from('expertassignment')
      .update({
        expert_id,
        notes,
        status: 'assigned',
        assignment_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: 'Erreur lors de l\'assignation' });
    }

    return res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Erreur lors de l\'assignation:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

// ⚠️ ROUTE SUPPRIMÉE - Utiliser la route ligne 5177 qui utilise AdminNotification
// GET /api/admin/notifications - Cette route a été remplacée par celle ligne 5177 qui utilise AdminNotification
// Ancienne route utilisant 'notification' avec user_type='admin' - SUPPRIMÉE

// POST /api/admin/notifications - Créer une notification
router.post('/notifications', asyncHandler(async (req, res) => {
  try {
    const { title, message, notification_type, priority, user_id, user_type } = req.body;

    const { data: notification, error } = await supabaseClient
      .from('notification')
      .insert({
        title,
        message,
        notification_type,
        priority,
        user_id,
        user_type,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: 'Erreur lors de la création de la notification' });
    }

    return res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

// GET /api/admin/analytics/detailed - Analytics détaillées
router.get('/analytics/detailed', asyncHandler(async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculer la date de début selon la période
    const startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // 1. Évolution des utilisateurs
    const { data: userEvolution } = await supabaseClient
      .from('Client')
      .select('created_at')
      .gte('created_at', startDate.toISOString());

    const { data: expertEvolution } = await supabaseClient
      .from('Expert')
      .select('created_at')
      .gte('created_at', startDate.toISOString());

    // 2. Performance des produits
    const { data: productPerformance } = await supabaseClient
      .from('ClientProduitEligible')
      .select(`
        statut,
        ProduitEligible (id, nom),
        created_at
      `)
      .gte('created_at', startDate.toISOString());

    // 3. Performance des experts
    const { data: expertPerformance } = await supabaseClient
      .from('expertassignment')
      .select(`
        status,
        compensation_amount,
        Expert (id, name),
        assignment_date,
        completed_date
      `)
      .gte('assignment_date', startDate.toISOString());

    // 4. Répartition géographique
    const { data: geographicData } = await supabaseClient
      .from('Client')
      .select('city, created_at')
      .gte('created_at', startDate.toISOString())
      .not('city', 'is', null);

    // 5. Taux de conversion
    const { data: conversionData } = await supabaseClient
      .from('ClientProduitEligible')
      .select('statut, created_at')
      .gte('created_at', startDate.toISOString());

    // Calculer les métriques
    const analytics = {
      userGrowth: {
        clients: userEvolution?.length || 0,
        experts: expertEvolution?.length || 0,
        total: (userEvolution?.length || 0) + (expertEvolution?.length || 0)
      },
      productPerformance: productPerformance?.reduce((acc, item) => {
        const productName = (item.ProduitEligible as any)?.nom || 'Inconnu';
        if (!acc[productName]) {
          acc[productName] = { total: 0, eligible: 0, conversion: 0 };
        }
        acc[productName].total++;
        if (item.statut === 'eligible') {
          acc[productName].eligible++;
        }
        acc[productName].conversion = (acc[productName].eligible / acc[productName].total) * 100;
        return acc;
      }, {} as Record<string, any>) || {},
      expertPerformance: expertPerformance?.reduce((acc, item) => {
        const expertName = `${(item.Expert as any)?.first_name || ''} ${(item.Expert as any)?.last_name || ''}`.trim() || (item.Expert as any)?.company_name || 'Inconnu';
        if (!acc[expertName]) {
          acc[expertName] = { 
            assignments: 0, 
            completed: 0, 
            revenue: 0, 
            avgCompletionTime: 0 
          };
        }
        acc[expertName].assignments++;
        if (item.status === 'completed') {
          acc[expertName].completed++;
          acc[expertName].revenue += Number(item.compensation_amount) || 0;
        }
        return acc;
      }, {} as Record<string, any>) || {},
      geographicDistribution: geographicData?.reduce((acc, item) => {
        acc[item.city] = (acc[item.city] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      conversionRates: {
        total: conversionData?.length || 0,
        eligible: conversionData?.filter(item => item.statut === 'eligible').length || 0,
        rate: conversionData?.length ? 
          (conversionData.filter(item => item.statut === 'eligible').length / conversionData.length) * 100 : 0
      }
    };

    return res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Erreur lors du calcul des analytics:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

// GET /api/admin/security/alerts - Alertes de sécurité
router.get('/security/alerts', asyncHandler(async (req, res) => {
  try {
    const { severity, resolved, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Pour l'instant, on simule les alertes de sécurité
    // TODO: Implémenter un vrai système d'alertes
    const mockAlerts = [
      {
        id: '1',
        severity: 'medium',
        type: 'authentication',
        title: 'Tentative de connexion suspecte',
        description: 'Plusieurs tentatives de connexion depuis une IP inhabituelle',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        resolved: false,
        actionRequired: true
      },
      {
        id: '2',
        severity: 'low',
        type: 'data_protection',
        title: 'Document non sécurisé détecté',
        description: 'Un document a été uploadé sans chiffrement',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        resolved: true,
        actionRequired: false
      }
    ];

    let filteredAlerts = mockAlerts;

    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }

    if (resolved !== undefined) {
      const isResolved = resolved === 'true';
      filteredAlerts = filteredAlerts.filter(alert => alert.resolved === isResolved);
    }

    const paginatedAlerts = filteredAlerts.slice(offset, offset + Number(limit));

    return res.json({
      success: true,
      data: {
        alerts: paginatedAlerts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: filteredAlerts.length
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

// POST /api/admin/security/alerts/:id/resolve - Résoudre une alerte
router.post('/security/alerts/:id/resolve', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution_notes } = req.body;

    // TODO: Implémenter la résolution d'alertes dans la base de données
    console.log(`Alerte ${id} résolue avec les notes: ${resolution_notes}`);

    return res.json({
      success: true,
      message: 'Alerte résolue avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la résolution de l\'alerte:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

// Route pour obtenir les statistiques admin
router.get('/stats', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    
    // Vérifier que l'utilisateur est admin
    if (authUser.type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Récupérer les statistiques
    const { data: clients, error: clientsError } = await supabaseClient
      .from('Client')
      .select('id');

    const { data: experts, error: expertsError } = await supabaseClient
      .from('Expert')
      .select('id');

    const { data: audits, error: auditsError } = await supabaseClient
      .from('Audit')
      .select('id');

    if (clientsError || expertsError || auditsError) {
      console.error('Erreur lors de la récupération des statistiques:', { clientsError, expertsError, auditsError });
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    return res.json({
      success: true,
      data: {
        totalClients: clients?.length || 0,
        totalExperts: experts?.length || 0,
        totalAudits: audits?.length || 0
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Routes pour les messages admin
router.use('/messages', messagesRouter);

// Route pour créer un admin de test (temporaire)
router.post('/create-test-admin', asyncHandler(async (req, res) => {
  try {
    const { email, name } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email et nom requis'
      });
    }
    
    // Vérifier si l'admin existe déjà
    const { data: existingAdmin } = await supabaseClient
      .from('Admin')
      .select('id, email')
      .eq('email', email)
      .single();
    
    if (existingAdmin) {
      return res.json({
        success: true,
        message: 'Admin existe déjà',
        admin: existingAdmin
      });
    }
    
    // Créer l'admin
    const { data: newAdmin, error } = await supabaseClient
      .from('Admin')
      .insert({
        email,
        name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Erreur création admin:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de l\'admin',
        error: error.message
      });
    }
    
    return res.json({
      success: true,
      message: 'Admin créé avec succès',
      admin: newAdmin
    });
    
  } catch (error) {
    console.error('Erreur création admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
}));

// Route temporaire pour créer un admin de test (SANS AUTHENTIFICATION)
router.post('/create-test-admin-temp', asyncHandler(async (req, res) => {
  try {
    const { email, name } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email et nom requis'
      });
    }
    
    console.log('🔧 Création admin de test:', { email, name });
    
    // Vérifier si l'admin existe déjà
    const { data: existingAdmin } = await supabaseClient
      .from('Admin')
      .select('id, email, name')
      .eq('email', email)
      .single();
    
    if (existingAdmin) {
      console.log('✅ Admin existe déjà:', existingAdmin);
      return res.json({
        success: true,
        message: 'Admin existe déjà',
        admin: existingAdmin
      });
    }
    
    // Créer l'admin
    const { data: newAdmin, error } = await supabaseClient
      .from('Admin')
      .insert({
        email,
        name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, email, name, created_at')
      .single();
    
    if (error) {
      console.error('❌ Erreur création admin:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de l\'admin',
        error: error.message
      });
    }
    
    console.log('✅ Admin créé avec succès:', newAdmin);
    return res.json({
      success: true,
      message: 'Admin créé avec succès',
      admin: newAdmin
    });
    
  } catch (error) {
    console.error('❌ Erreur création admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'admin'
    });
  }
}));

// Route de diagnostic pour l'authentification admin (SANS MIDDLEWARE)
router.get('/diagnostic-no-auth', asyncHandler(async (req, res) => {
  try {
    console.log('🔍 Diagnostic authentification admin (sans middleware)...');
    
    // Vérifier les headers d'authentification
    const authHeader = req.headers.authorization;
    const cookies = req.cookies;
    
    console.log('📋 Headers auth:', authHeader);
    console.log('🍪 Cookies:', Object.keys(cookies));
    
    // Vérifier si un token existe
    const token = authHeader?.replace('Bearer ', '') || cookies.token || cookies.supabase_token;
    
    if (!token) {
      return res.json({
        success: false,
        message: 'Aucun token trouvé',
        headers: authHeader ? 'Présent' : 'Absent',
        cookies: Object.keys(cookies),
        hasToken: false
      });
    }
    
    console.log('✅ Token trouvé:', token.substring(0, 20) + '...');
    
    // Vérifier la validité du token avec Supabase
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    
    if (error || !user) {
      return res.json({
        success: false,
        message: 'Token invalide',
        error: error?.message,
        hasValidToken: false
      });
    }
    
    console.log('✅ Token valide pour utilisateur:', user.email);
    
    // Vérifier si l'utilisateur existe dans la table Admin
    const { data: adminUser, error: adminError } = await supabaseClient
      .from('Admin')
      .select('id, email, first_name, last_name, company_name, created_at')
      .eq('email', user.email)
      .single();
    
    if (adminError || !adminUser) {
      return res.json({
        success: false,
        message: 'Utilisateur non trouvé dans la table Admin',
        userEmail: user.email,
        adminError: adminError?.message,
        isAdmin: false
      });
    }
    
    console.log('✅ Admin trouvé:', adminUser);
    
    return res.json({
      success: true,
      message: 'Authentification admin réussie',
      user: {
        id: user.id,
        email: user.email,
        adminId: adminUser.id,
        adminName: `${adminUser.first_name || ''} ${adminUser.last_name || ''}`.trim() || adminUser.company_name
      },
      isAdmin: true
    });
    
  } catch (error) {
    console.error('❌ Erreur diagnostic admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du diagnostic',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
}));

// GET /api/admin/experts/pending - Experts en attente de validation
router.get('/experts/pending', asyncHandler(async (req, res) => {
  try {
    console.log('🔍 Récupération experts en attente...');
    
    const { data: experts, error } = await supabaseClient
      .from('Expert')
      .select(`
        id,
        name,
        first_name,
        last_name,
        email,
        company_name,
        specializations,
        secteur_activite,
        status,
        approval_status,
        created_at,
        experience,
        documents
      `)
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération experts pending:', error);
      throw error;
    }

    console.log(`✅ ${experts?.length || 0} experts en attente trouvés`);

    return res.json({
      success: true,
      data: {
        experts: experts || []
      }
    });

  } catch (error) {
    console.error('❌ Erreur route experts/pending:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des experts en attente'
    });
  }
}));

// GET /api/admin/clients/waiting - Clients en attente avec leurs produits éligibles
router.get('/clients/waiting', asyncHandler(async (req, res) => {
  try {
    console.log('🔍 Récupération clients en attente...');
    
    // Récupérer les clients avec leurs produits éligibles en attente
    const { data: clients, error } = await supabaseClient
      .from('Client')
      .select(`
        id,
        company_name,
        email,
        statut,
        created_at,
        produits_eligibles!inner(
          id,
          produitId,
          statut,
          progress,
          montantFinal,
          tauxFinal,
          created_at,
          updated_at
        )
      `)
      .eq('produits_eligibles.statut', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération clients waiting:', error);
      throw error;
    }

    console.log(`✅ ${clients?.length || 0} clients en attente trouvés`);

    return res.json({
      success: true,
      data: {
        clients: clients || []
      }
    });

  } catch (error) {
    console.error('❌ Erreur route clients/waiting:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des clients en attente'
    });
  }
}));

// GET /api/admin/dossiers/pending - Dossiers à traiter (ClientProduitEligible)
router.get('/dossiers/pending', asyncHandler(async (req, res) => {
  try {
    console.log('🔍 Récupération dossiers à traiter...');
    
    const { data: dossiers, error } = await supabaseClient
      .from('ClientProduitEligible')
      .select(`
        id,
        clientId,
        produitId,
        statut,
        progress,
        montantFinal,
        tauxFinal,
        expert_id,
        created_at,
        updated_at,
        Client!inner(
          id,
          company_name,
          email,
          statut
        ),
        ProduitEligible!inner(
          id,
          nom,
          description,
          montant_min,
          montant_max,
          taux_min,
          taux_max
        )
      `)
      .in('statut', ['pending', 'in_progress'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération dossiers pending:', error);
      throw error;
    }

    console.log(`✅ ${dossiers?.length || 0} dossiers à traiter trouvés`);

    return res.json({
      success: true,
      data: {
        dossiers: dossiers || []
      }
    });

  } catch (error) {
    console.error('❌ Erreur route dossiers/pending:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des dossiers à traiter'
    });
  }
}));

// POST /api/admin/experts/:id/validate - Valider un expert
router.post('/experts/:id/validate', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { commentaire } = req.body;
    const user = (req as any).user;

    console.log(`✅ Validation expert ${id} par admin ${user.id}`);

    const { data, error } = await supabaseClient
      .from('Expert')
      .update({
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user.id,
        commentaire_admin: commentaire
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur validation expert:', error);
      throw error;
    }

    return res.json({
      success: true,
      message: 'Expert validé avec succès',
      data
    });

  } catch (error) {
    console.error('❌ Erreur route validation expert:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation de l\'expert'
    });
  }
}));

// POST /api/admin/experts/:id/reject - Rejeter un expert
router.post('/experts/:id/reject', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { commentaire } = req.body;
    const user = (req as any).user;

    console.log(`❌ Rejet expert ${id} par admin ${user.id}`);

    const { data, error } = await supabaseClient
      .from('Expert')
      .update({
        approval_status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: user.id,
        commentaire_admin: commentaire
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur rejet expert:', error);
      throw error;
    }

    return res.json({
      success: true,
      message: 'Expert rejeté',
      data
    });

  } catch (error) {
    console.error('❌ Erreur route rejet expert:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du rejet de l\'expert'
    });
  }
}));

// POST /api/admin/dossiers/:id/validate - Valider un dossier
router.post('/dossiers/:id/validate', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { expert_id, commentaire } = req.body;
    const user = (req as any).user;

    console.log(`✅ Validation dossier ${id} par admin ${user.id}`);

    const { data, error } = await supabaseClient
      .from('ClientProduitEligible')
      .update({
        statut: 'validated',
        validated_at: new Date().toISOString(),
        validated_by: user.id,
        expert_id: expert_id || null,
        commentaire_admin: commentaire
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur validation dossier:', error);
      throw error;
    }

    return res.json({
      success: true,
      message: 'Dossier validé avec succès',
      data
    });

  } catch (error) {
    console.error('❌ Erreur route validation dossier:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation du dossier'
    });
  }
}));

// POST /api/admin/dossiers/:id/reject - Rejeter un dossier
router.post('/dossiers/:id/reject', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { commentaire } = req.body;
    const user = (req as any).user;

    console.log(`❌ Rejet dossier ${id} par admin ${user.id}`);

    const { data, error } = await supabaseClient
      .from('ClientProduitEligible')
      .update({
        statut: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: user.id,
        commentaire_admin: commentaire
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur rejet dossier:', error);
      throw error;
    }

    return res.json({
      success: true,
      message: 'Dossier rejeté',
      data
    });

  } catch (error) {
    console.error('❌ Erreur route rejet dossier:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du rejet du dossier'
    });
  }
}));

// GET /api/admin/clients/all - Tous les clients de la plateforme
router.get('/clients/all', asyncHandler(async (req, res) => {
  try {
    console.log('🔍 Récupération de tous les clients...');
    
    const { data: clients, error } = await supabaseClient
      .from('Client')
      .select(`
        id,
        company_name,
        email,
        statut,
        created_at,
        updated_at,
        type,
        produits_eligibles(
          id,
          produitId,
          statut,
          progress,
          montantFinal,
          tauxFinal,
          created_at,
          updated_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération tous les clients:', error);
      throw error;
    }

    console.log(`✅ ${clients?.length || 0} clients trouvés sur la plateforme`);

    return res.json({
      success: true,
      data: {
        clients: clients || []
      }
    });

  } catch (error) {
    console.error('❌ Erreur route clients/all:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de tous les clients'
    });
  }
}));

// Route /experts/all déplacée plus haut (avant /experts/:id) pour éviter les conflits de routing

// GET /api/admin/apporteurs/:id - Détails d'un apporteur
router.get('/apporteurs/:id', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer l'apporteur
    const { data: apporteur, error } = await supabaseClient
      .from('ApporteurAffaires')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !apporteur) {
      return res.status(404).json({
        success: false,
        message: 'Apporteur non trouvé'
      });
    }

    return res.json({
      success: true,
      data: apporteur
    });

  } catch (error) {
    console.error('Erreur récupération apporteur:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'apporteur'
    });
  }
}));

// GET /api/admin/dossiers/all - Tous les ClientProduitEligible de la plateforme
router.get('/dossiers/all', async (req, res) => {
  try {
    console.log('🔍 Récupération de tous les ClientProduitEligible...');
    console.log('✅ Admin authentifié:', (req as any).user?.id);
    
    const { data: dossiers, error } = await supabaseClient
      .from('ClientProduitEligible')
      .select(`
        id,
        clientId,
        produitId,
        statut,
        progress,
        montantFinal,
        tauxFinal,
        expert_id,
        eligibility_validated_at,
        pre_eligibility_validated_at,
        expert_report_status,
        validation_admin_notes,
        created_at,
        updated_at,
        Client(
          id,
          company_name,
          first_name,
          last_name,
          email,
          statut,
          phone_number,
          apporteur_id
        ),
        ProduitEligible(
          id,
          nom,
          description,
          montant_min,
          montant_max,
          taux_min,
          taux_max,
          categorie
        ),
        Expert!fk_clientproduiteligible_expert(
          id,
          first_name,
          last_name,
          company_name,
          email,
          specializations,
          rating,
          approval_status
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération tous les dossiers:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la récupération de tous les ClientProduitEligible' 
      });
    }

    console.log(`✅ ${dossiers?.length || 0} ClientProduitEligible trouvés sur la plateforme`);

    return res.json({
      success: true,
      data: {
        dossiers: dossiers || []
      }
    });

  } catch (error) {
    console.error('❌ Erreur route dossiers/all:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de tous les ClientProduitEligible'
    });
  }
});

// GET /api/admin/experts/:id/assignments - Assignations d'un expert
router.get('/experts/:id/assignments', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const { data: assignments, error } = await supabaseClient
      .from('ClientProduitEligible')
      .select(`
        id,
        clientId,
        produitId,
        statut,
        created_at,
        updated_at,
        montantFinal,
        tauxFinal,
        progress,
        Client(
          id,
          company_name,
          email,
          phone_number
        ),
        ProduitEligible(
          id,
          nom,
          description,
          categorie
        )
      `)
      .eq('expert_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération assignations:', error);
      throw error;
    }

    console.log(`✅ ${assignments?.length || 0} assignations trouvées pour l'expert ${id}`);

    return res.json({
      success: true,
      data: {
        assignments: assignments || []
      }
    });

  } catch (error) {
    console.error('❌ Erreur route experts/:id/assignments:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des assignations'
    });
  }
}));

// PUT /api/admin/experts/:id/status - Mettre à jour le statut d'un expert
router.put('/experts/:id/status', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment, admin_id } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }

    const updateData: any = {
      approval_status: status,
      updated_at: new Date().toISOString()
    };

    if (status === 'approved') {
      updateData.approved_by = admin_id;
      updateData.approved_at = new Date().toISOString();
      updateData.status = 'active';
    }

    const { data: expert, error } = await supabaseClient
      .from('Expert')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur mise à jour expert:', error);
      throw error;
    }

    // Log de l'action
    await supabaseClient
      .from('AdminAuditLog')
      .insert({
        admin_id,
        action: `expert_${status}`,
        target_id: id,
        target_type: 'expert',
        details: comment || `Expert ${status === 'approved' ? 'approuvé' : 'rejeté'}`,
        timestamp: new Date().toISOString()
      });

    console.log(`✅ Expert ${id} ${status} avec succès`);

    return res.json({
      success: true,
      data: {
        expert
      }
    });

  } catch (error) {
    console.error('❌ Erreur route experts/:id/status:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut'
    });
  }
}));

// ============================================================================
// VALIDATION D'ÉLIGIBILITÉ DES DOSSIERS
// ============================================================================

/**
 * GET /api/admin/dossiers/pending-validation
 * Liste des dossiers en attente de validation d'éligibilité
 */
router.get('/dossiers/pending-validation', asyncHandler(async (req, res) => {
  try {
    console.log('🔍 Récupération des dossiers en attente de validation...');
    
    const { data: dossiers, error } = await supabaseClient
      .from('ClientProduitEligible')
      .select(`
        *,
        Client (
          id,
          name,
          company_name,
          email,
          phone_number
        ),
        ProduitEligible (
          id,
          nom,
          description,
          categorie
        )
      `)
      .eq('statut', 'documents_uploaded')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Erreur récupération dossiers pending:', error);
      throw error;
    }

    console.log(`✅ ${dossiers?.length || 0} dossiers en attente de validation`);

    return res.json({
      success: true,
      data: dossiers || []
    });

  } catch (error) {
    console.error('❌ Erreur route pending-validation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des dossiers en attente'
    });
  }
}));

/**
 * POST /api/admin/dossiers/:id/propose-expert
 * Proposer un expert pour un dossier
 */
router.post('/dossiers/:id/propose-expert', asyncHandler(async (req, res): Promise<void> => {
  const { id } = req.params;
  const { expert_id, message } = req.body;
  const user = req.user as AuthUser;

  if (!expert_id) {
    res.status(400).json({ success: false, message: 'Expert ID requis' });
    return;
  }

  try {
    // Vérifier que le dossier existe et est éligible
    const { data: dossier, error: dossierError } = await supabaseClient
      .from('ClientProduitEligible')
      .select(`
        *,
        Client:clientId (
          id,
          company_name,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (dossierError || !dossier) {
      res.status(404).json({ success: false, message: 'Dossier non trouvé' });
      return;
    }

    if (dossier.validation_state !== 'eligibility_validated') {
      res.status(400).json({ 
        success: false, 
        message: 'Le dossier doit être éligible pour proposer un expert' 
      });
      return;
    }

    // Vérifier que l'expert existe et est actif
    const { data: expert, error: expertError } = await supabaseClient
      .from('Expert')
      .select('id, first_name, last_name, company_name, email, status, approval_status')
      .eq('id', expert_id)
      .single();

    if (expertError || !expert) {
      res.status(404).json({ success: false, message: 'Expert non trouvé' });
      return;
    }

    if (expert.approval_status !== 'approved' || expert.status !== 'active') {
      res.status(400).json({ 
        success: false, 
        message: 'Expert non disponible' 
      });
      return;
    }

    // Mettre à jour le dossier avec l'expert proposé
    const { error: updateError } = await supabaseClient
      .from('ClientProduitEligible')
      .update({
        expert_id: expert_id,
        validation_state: 'expert_proposed',
        current_step: 3,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // Envoyer notification au client
    const { error: notificationError } = await supabaseClient
      .from('notification')
      .insert({
        user_id: dossier.clientId,
        user_type: 'client',
        notification_type: 'expert_proposed',
        title: '🎯 Expert proposé pour votre dossier',
        message: `L'administrateur vous propose ${`${expert.first_name || ''} ${expert.last_name || ''}`.trim() || expert.company_name} comme expert pour votre dossier. Vous pouvez accepter ou demander un autre expert.`,
        priority: 'high',
        action_url: `/client/dossiers/${id}/expert-selection`,
        action_data: {
          dossier_id: id,
          expert_id: expert_id,
          expert_name: `${expert.first_name || ''} ${expert.last_name || ''}`.trim() || expert.company_name,
          admin_message: message || 'Expert proposé par l\'administrateur'
        }
      });

    if (notificationError) {
      console.error('Erreur notification client:', notificationError);
    }

    // Envoyer notification à l'expert
    const { error: expertNotificationError } = await supabaseClient
      .from('notification')
      .insert({
        user_id: expert_id,
        user_type: 'expert',
        notification_type: 'assignment_proposed',
        title: '📋 Proposition d\'assignation',
        message: `Vous avez été proposé pour le dossier de ${dossier.Client?.company_name || 'un client'}. En attente de confirmation du client.`,
        priority: 'medium',
        action_url: `/expert/assignments`,
        action_data: {
          dossier_id: id,
          client_name: dossier.Client?.company_name,
          client_email: dossier.Client?.email
        }
      });

    if (expertNotificationError) {
      console.error('Erreur notification expert:', expertNotificationError);
    }

    res.json({
      success: true,
      message: 'Expert proposé avec succès',
      data: {
        dossier_id: id,
        expert_id: expert_id,
        expert_name: `${expert.first_name || ''} ${expert.last_name || ''}`.trim() || expert.company_name,
        client_name: dossier.Client?.company_name
      }
    });

  } catch (error) {
    console.error('Erreur proposition expert:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la proposition d\'expert' 
    });
  }
}));

/**
 * POST /api/admin/dossiers/:id/validate-eligibility
 * Valider ou rejeter l'éligibilité d'un dossier
 */
router.post('/dossiers/:id/validate-eligibility', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body; // action: 'approve' | 'reject'
    const admin = (req as any).user;

    if (!admin || admin.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action invalide (approve ou reject requis)'
      });
    }

    console.log('📝 Admin - Validation éligibilité:', {
      dossier_id: id,
      action,
      admin_id: admin.database_id,
      admin_email: admin.email,
      notes
    });

    // Récupérer le dossier pour vérifier qu'il existe
    const { data: dossier, error: fetchError } = await supabaseClient
      .from('ClientProduitEligible')
      .select('*, Client(email, company_name), ProduitEligible(nom)')
      .eq('id', id)
      .single();

    if (fetchError || !dossier) {
      console.error('❌ Dossier non trouvé:', id, fetchError);
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    // ✅ NOUVEAUX CHAMPS : Utiliser les colonnes dédiées au lieu de metadata
    const isApproved = action === 'approve';
    const newStatut = isApproved ? 'admin_validated' : 'admin_rejected';
    const newStep = isApproved ? 2 : 1;
    const newProgress = isApproved ? 25 : 10;

    // Mettre à jour le dossier avec les nouveaux champs
    const { data: updatedDossier, error: updateError } = await supabaseClient
      .from('ClientProduitEligible')
      .update({
        // ✅ Nouveau système
        admin_eligibility_status: isApproved ? 'validated' : 'rejected',
        admin_validated_by: admin.database_id,
        eligibility_validated_at: isApproved ? new Date().toISOString() : null,
        validation_admin_notes: notes || null,
        
        // Statut global
        statut: newStatut,
        current_step: newStep,
        progress: newProgress,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur mise à jour dossier:', updateError);
      throw updateError;
    }

    console.log(`✅ Admin - Éligibilité ${isApproved ? 'validée' : 'rejetée'} pour le dossier ${id}`, {
      admin_eligibility_status: isApproved ? 'validated' : 'rejected',
      statut: newStatut
    });

    // 📅 TIMELINE : Ajouter événement validation/refus éligibilité
    try {
      const { DossierTimelineService } = await import('../services/dossier-timeline-service');
      
      // Récupérer le nom de l'admin
      const { data: adminData } = await supabaseClient
        .from('Admin')
        .select('name')
        .eq('id', admin.database_id)
        .single();

      const adminName = adminData?.name || admin.email || 'Admin';
      
      if (action === 'approve') {
        await DossierTimelineService.eligibiliteValidee({
          dossier_id: id,
          admin_name: adminName,
          notes: notes
        });
      } else {
        await DossierTimelineService.eligibiliteRefusee({
          dossier_id: id,
          admin_name: adminName,
          reason: notes || 'Documents non conformes'
        });
      }

      console.log('✅ Événement timeline ajouté (validation éligibilité)');
    } catch (timelineError) {
      console.error('⚠️ Erreur timeline (non bloquant):', timelineError);
    }

    // ✅ ENVOYER NOTIFICATION AU CLIENT
    try {
      const { ClientNotificationService } = await import('../services/client-notification-service');
      
      if (action === 'approve') {
        await ClientNotificationService.notifyEligibilityValidated({
          client_id: dossier.clientId,
          client_produit_id: id,
          product_type: dossier.ProduitEligible?.nom || 'Produit',
          product_name: dossier.ProduitEligible?.nom,
          validated_by: admin.database_id,
          validated_by_email: admin.email,
          notes: notes
        });
      } else {
        await ClientNotificationService.notifyEligibilityRejected({
          client_id: dossier.clientId,
          client_produit_id: id,
          product_type: dossier.ProduitEligible?.nom || 'Produit',
          product_name: dossier.ProduitEligible?.nom,
          rejected_by: admin.database_id,
          rejected_by_email: admin.email,
          rejection_reason: notes
        });
      }
      console.log(`✅ Notification ${action === 'approve' ? 'validation' : 'rejet'} envoyée au client`);
    } catch (notifError) {
      console.error('❌ Erreur envoi notification client (non bloquant):', notifError);
    }

    return res.json({
      success: true,
      message: `Éligibilité ${action === 'approve' ? 'validée' : 'rejetée'} avec succès`,
      data: updatedDossier
    });

  } catch (error: any) {
    console.error('❌ Erreur validation éligibilité:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation',
      details: error.message
    });
  }
}));

// PATCH /api/admin/dossiers/:id/statut - Modifier le statut d'un dossier
router.patch('/dossiers/:id/statut', async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    
    console.log(`🔄 Mise à jour statut dossier ${id} vers ${statut}`);

    if (!statut) {
      return res.status(400).json({
        success: false,
        message: 'Le statut est requis'
      });
    }

    // Mettre à jour le statut et récupérer les données complètes
    const { data: dossier, error } = await supabaseClient
      .from('ClientProduitEligible')
      .update({ 
        statut,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, ProduitEligible(nom)')
      .single();

    if (error) {
      console.error('❌ Erreur mise à jour statut:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du statut'
      });
    }

    console.log(`✅ Statut mis à jour: ${statut}`);
    
    // 🔔 NOTIFICATION CLIENT : Changement de statut
    try {
      const { NotificationTriggers } = await import('../services/NotificationTriggers');
      await NotificationTriggers.onDossierStatusChange(dossier.clientId, {
        id: dossier.id,
        nom: dossier.ProduitEligible?.nom || 'Dossier',
        statut: statut,
        produit: dossier.ProduitEligible?.nom
      });
      console.log('✅ Notification changement statut envoyée');
    } catch (notifError) {
      console.error('❌ Erreur notification (non bloquant):', notifError);
    }
    
    return res.json({
      success: true,
      data: { dossier }
    });

  } catch (error) {
    console.error('❌ Erreur route dossiers/:id/statut:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/admin/dossiers/:id/available-experts - Récupérer les experts disponibles pour un dossier (filtrés par produit éligible)
router.get('/dossiers/:id/available-experts', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🔍 [ADMIN] Récupération experts disponibles pour dossier ${id}`);

    // Récupérer le dossier avec le produit éligible
    const { data: dossierData, error: dossierFetchError } = await supabaseClient
      .from('ClientProduitEligible')
      .select(`
        id,
        produitId,
        ProduitEligible:produitId (
          id,
          nom
        )
      `)
      .eq('id', id)
      .single();

    if (dossierFetchError || !dossierData) {
      console.error('❌ Erreur récupération dossier:', dossierFetchError);
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    const produitId = dossierData.produitId;
    if (!produitId) {
      return res.status(400).json({
        success: false,
        message: 'Le dossier n\'a pas de produit éligible associé'
      });
    }

    // Récupérer les experts qui ont ce produit dans leur catalogue via ExpertProduitEligible
    const { data: expertProduits, error: expertProduitsError } = await supabaseClient
      .from('ExpertProduitEligible')
      .select(`
        expert_id,
        produit_id,
        niveau_expertise,
        statut,
        Expert!inner (
          id,
          name,
          first_name,
          last_name,
          email,
          company_name,
          specializations,
          rating,
          status,
          approval_status,
          description
        )
      `)
      .eq('produit_id', produitId)
      .eq('statut', 'actif')
      .eq('Expert.status', 'active')
      .eq('Expert.approval_status', 'approved');

    if (expertProduitsError) {
      console.error('❌ Erreur récupération experts:', expertProduitsError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des experts'
      });
    }

    // Dédupliquer les experts et formater les données
    const uniqueExperts = new Map<string, any>();
    
    for (const ep of expertProduits || []) {
      const expert: any = ep.Expert;
      if (expert && !Array.isArray(expert) && expert.id && !uniqueExperts.has(expert.id)) {
        uniqueExperts.set(expert.id, {
          id: expert.id,
          name: expert.name || (expert.first_name && expert.last_name ? `${expert.first_name} ${expert.last_name}` : expert.email),
          first_name: expert.first_name,
          last_name: expert.last_name,
          email: expert.email,
          company_name: expert.company_name,
          specializations: expert.specializations || [],
          rating: expert.rating || 4.0,
          status: expert.status,
          approval_status: expert.approval_status,
          description: expert.description,
          niveau_expertise: ep.niveau_expertise
        });
      }
    }

    const experts = Array.from(uniqueExperts.values());

    console.log(`✅ ${experts.length} expert(s) disponible(s) pour le produit ${produitId}`);

    return res.json({
      success: true,
      data: {
        experts: experts,
        produit: dossierData.ProduitEligible
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur route available-experts:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      details: error.message
    });
  }
});

// POST /api/admin/dossiers/:id/assign-expert - Assigner un expert à un dossier
router.post('/dossiers/:id/assign-expert', async (req, res) => {
  try {
    const { id } = req.params;
    const { expert_id } = req.body;
    
    console.log(`👨‍🏫 [ADMIN] Assignation expert ${expert_id} au dossier ${id}`);

    if (!expert_id) {
      return res.status(400).json({
        success: false,
        message: 'L\'ID de l\'expert est requis'
      });
    }

    // Récupérer le dossier avec les relations nécessaires
    const { data: dossierData, error: dossierFetchError } = await supabaseClient
      .from('ClientProduitEligible')
      .select(`
        id,
        clientId,
        produitId,
        statut,
        montantFinal,
        Client:clientId (
          id,
          company_name,
          first_name,
          last_name,
          email
        ),
        ProduitEligible:produitId (
          id,
          nom,
          type_produit
        )
      `)
      .eq('id', id)
      .single();

    if (dossierFetchError || !dossierData) {
      console.error('❌ Erreur récupération dossier:', dossierFetchError);
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    // Vérifier que l'expert existe et est approuvé
    const { data: expert, error: expertError } = await supabaseClient
      .from('Expert')
      .select('id, first_name, last_name, name, email, approval_status, status, specializations')
      .eq('id', expert_id)
      .single();

    if (expertError || !expert) {
      return res.status(404).json({
        success: false,
        message: 'Expert non trouvé'
      });
    }

    if (expert.approval_status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'L\'expert n\'est pas encore approuvé'
      });
    }

    if (expert.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'L\'expert n\'est pas actif'
      });
    }

    const expertName = expert.name || 
      (expert.first_name && expert.last_name ? `${expert.first_name} ${expert.last_name}` : expert.email) ||
      'Expert';

    // Assigner l'expert au dossier
    const { data: dossier, error: updateError } = await supabaseClient
      .from('ClientProduitEligible')
      .update({ 
        expert_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur assignation expert:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'assignation de l\'expert'
      });
    }

    // Créer l'entrée dans expertassignment (pour cohérence avec le workflow client)
    const clientInfo = Array.isArray(dossierData.Client) ? dossierData.Client[0] : dossierData.Client;
    const produitInfo = Array.isArray(dossierData.ProduitEligible) ? dossierData.ProduitEligible[0] : dossierData.ProduitEligible;
    
    const { data: assignment, error: assignError } = await supabaseClient
      .from('expertassignment')
      .insert({
        expert_id: expert_id,
        client_id: dossierData.clientId,
        client_produit_eligible_id: id,
        status: 'pending',
        assignment_date: new Date().toISOString(),
        notes: `Assignation par admin pour dossier ${id}`
      })
      .select()
      .single();

    if (assignError) {
      console.error('⚠️ Erreur création assignation (non bloquant):', assignError);
      // On continue quand même, ce n'est pas bloquant
    } else {
      console.log('✅ Entrée expertassignment créée');
    }

    // 📅 TIMELINE : Ajouter événement assignation expert
    try {
      const { DossierTimelineService } = await import('../services/dossier-timeline-service');
      
      const clientName = clientInfo?.company_name || 
        (clientInfo?.first_name && clientInfo?.last_name 
          ? `${clientInfo.first_name} ${clientInfo.last_name}` 
          : clientInfo?.email) ||
        'Client';
      const productName = produitInfo?.nom || 'Produit';
      
      await DossierTimelineService.expertAssigne({
        dossier_id: id,
        expert_id: expert_id,
        expert_name: expertName,
        product_name: productName,
        client_name: clientName
      });

      console.log('✅ Événement timeline ajouté (expert assigné par admin)');
    } catch (timelineError) {
      console.error('⚠️ Erreur timeline (non bloquant):', timelineError);
    }

    // 🔔 NOTIFICATION : Envoyer notification à l'expert
    try {
      const { ExpertNotificationService } = await import('../services/expert-notification-service');
      
      const clientName = clientInfo?.first_name && clientInfo?.last_name
        ? `${clientInfo.first_name} ${clientInfo.last_name}`
        : clientInfo?.company_name || 'Client';
      
      const produitNom = produitInfo?.nom || 'Produit';
      const produitType = produitInfo?.type_produit || produitInfo?.nom || 'Produit';
      
      await ExpertNotificationService.notifyDossierPendingAcceptance({
        expert_id: expert_id,
        client_produit_id: id,
        client_id: dossierData.clientId,
        client_company: clientInfo?.company_name,
        client_name: clientName,
        product_type: produitType,
        product_name: produitNom,
        estimated_amount: dossierData.montantFinal || 0
      });
      
      console.log('✅ Notification envoyée à l\'expert');
    } catch (notifError) {
      console.error('⚠️ Erreur notification expert (non bloquant):', notifError);
    }

    console.log(`✅ Expert ${expertName} assigné au dossier ${id} par admin`);
    
    return res.json({
      success: true,
      data: { 
        dossier,
        assignment,
        expert: {
          id: expert.id,
          first_name: expert.first_name,
          last_name: expert.last_name,
          name: expertName
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur route dossiers/:id/assign-expert:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/admin/notifications - Récupérer les notifications admin
router.get('/notifications', async (req, res) => {
  try {
    const { status, priority, limit = 100 } = req.query;
    const authUser = (req as any).user as AuthUser;
    
    console.log('🔍 Récupération notifications admin - authUser:', {
      id: authUser?.id,
      type: authUser?.type,
      database_id: authUser?.database_id
    });
    
    // Récupérer depuis AdminNotification (table globale pour tous les admins)
    let adminNotificationQuery = supabaseClient
      .from('AdminNotification')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Si un status spécifique est demandé, filtrer
    if (status && status !== 'all') {
      adminNotificationQuery = adminNotificationQuery.eq('status', status);
    }
    
    if (priority) {
      adminNotificationQuery = adminNotificationQuery.eq('priority', priority);
    }
    
    // Appliquer la limite seulement si demandée
    if (limit && Number(limit) > 0) {
      adminNotificationQuery = adminNotificationQuery.limit(Number(limit));
    }
    
    const { data: adminNotifications, error: adminError } = await adminNotificationQuery;
    
    if (adminError) {
      console.error('❌ Erreur récupération AdminNotification:', adminError);
    }
    
    // Récupérer aussi depuis notification (pour les notifications d'événement)
    let eventNotifications: any[] = [];
    const userId = authUser?.id || authUser?.database_id || authUser?.auth_user_id;
    
    if (userId) {
      console.log(`🔍 Recherche notifications événement pour user_id: ${userId}`);
      
      let eventNotificationQuery = supabaseClient
        .from('notification')
        .select('*')
        .eq('user_id', userId)
        .eq('user_type', 'admin')
        .order('created_at', { ascending: false });
      
      // Filtrer par type de notification d'événement
      eventNotificationQuery = eventNotificationQuery.in('notification_type', [
        'event_upcoming',
        'event_in_progress',
        'event_completed'
      ]);
      
      // Si un status spécifique est demandé, filtrer
      if (status && status !== 'all') {
        if (status === 'unread') {
          eventNotificationQuery = eventNotificationQuery.eq('is_read', false);
        } else if (status === 'read') {
          eventNotificationQuery = eventNotificationQuery.eq('is_read', true);
        } else if (status === 'archived') {
          eventNotificationQuery = eventNotificationQuery.eq('status', 'archived');
        }
      }
      
      if (priority) {
        eventNotificationQuery = eventNotificationQuery.eq('priority', priority);
      }
      
      // Appliquer la limite seulement si demandée
      if (limit && Number(limit) > 0) {
        eventNotificationQuery = eventNotificationQuery.limit(Number(limit));
      }
      
      const { data: eventNotifs, error: eventError } = await eventNotificationQuery;
      
      if (eventError) {
        console.error('❌ Erreur récupération notifications événement:', eventError);
      } else {
        eventNotifications = eventNotifs || [];
        console.log(`✅ ${eventNotifications.length} notifications d'événement trouvées`);
      }
    } else {
      console.warn('⚠️ Aucun user_id trouvé dans authUser, impossible de récupérer les notifications d\'événement');
    }
    
    // Normaliser les notifications AdminNotification pour le front-end
    const normalizedAdminNotifications = (adminNotifications || []).map((notif: any) => ({
      ...notif,
      // Pour AdminNotification: 'unread' = non lu, 'read' = lu, 'archived' = archivé
      // Synchroniser is_read avec status si nécessaire
      is_read: notif.is_read !== undefined ? notif.is_read : (notif.status === 'read' || (notif.read_at !== null && notif.read_at !== undefined)),
      status: notif.status || 'unread', // Assurer que status existe
      notification_type: notif.type || notif.notification_type,
    }));
    
    // Normaliser les notifications d'événement pour le front-end
    const normalizedEventNotifications = (eventNotifications || []).map((notif: any) => ({
      ...notif,
      // Pour notification: is_read est déjà défini, status peut être 'unread', 'read', 'archived'
      is_read: notif.is_read !== undefined ? notif.is_read : (notif.status === 'read'),
      status: notif.status || (notif.is_read ? 'read' : 'unread'),
      notification_type: notif.notification_type || notif.type,
      // Mapper les champs pour correspondre au format AdminNotification si nécessaire
      type: notif.notification_type || notif.type,
      // S'assurer que action_url est préservé (important pour les notifications d'événement)
      action_url: notif.action_url || null,
    }));
    
    // Fusionner les deux listes de notifications
    const allNotifications = [...normalizedAdminNotifications, ...normalizedEventNotifications];
    
    // Trier par date de création (plus récentes en premier)
    allNotifications.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });
    
    // Appliquer la limite globale si nécessaire
    const limitedNotifications = limit && Number(limit) > 0 
      ? allNotifications.slice(0, Number(limit))
      : allNotifications;
    
    console.log(`✅ Notifications récupérées: ${normalizedAdminNotifications.length} AdminNotification + ${normalizedEventNotifications.length} événements = ${limitedNotifications.length} total`);
    
    return res.json({
      success: true,
      data: { notifications: limitedNotifications }
    });
    
  } catch (error) {
    console.error('❌ Erreur route notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/admin/contact/:id - Récupérer un message de contact
router.get('/contact/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user as AuthUser;
    
    if (!user || user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    const { data: contactMessage, error } = await supabaseAdmin
      .from('contact_messages')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !contactMessage) {
      console.error('❌ Erreur récupération message contact:', error);
      return res.status(404).json({
        success: false,
        message: 'Message de contact introuvable'
      });
    }

    return res.json({
      success: true,
      data: contactMessage
    });

  } catch (error) {
    console.error('❌ Erreur route contact:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// PATCH /api/admin/contact/:id/status - Mettre à jour le statut d'un message de contact
router.patch('/contact/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = (req as any).user as AuthUser;
    
    if (!user || user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    // Aligner les statuts : unread, read, replied, archived
    // Mapping : new -> unread, read -> read, replied -> replied, archived -> archived
    let normalizedStatus = status;
    if (status === 'new') {
      normalizedStatus = 'unread';
    }
    // 'replied' reste 'replied' (statut distinct)
    
    if (!normalizedStatus || !['unread', 'read', 'replied', 'archived'].includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide. Valeurs acceptées: new (unread), read, replied, archived'
      });
    }

    const { data, error } = await supabaseAdmin
      .from('contact_messages')
      .update({ 
        status: normalizedStatus, // Utiliser le statut normalisé
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    // Mettre à jour la notification AdminNotification correspondante si elle existe
    if (!error && data) {
      const { data: notifications } = await supabaseClient
        .from('AdminNotification')
        .select('id')
        .eq('type', 'contact_message')
        .contains('metadata', { contact_message_id: id });
      
      if (notifications && notifications.length > 0) {
        // Mettre à jour toutes les notifications de contact correspondantes
        for (const notif of notifications) {
          await supabaseClient
            .from('AdminNotification')
            .update({
              status: normalizedStatus,
              is_read: normalizedStatus === 'read' || normalizedStatus === 'replied', // replied est considéré comme lu
              read_at: (normalizedStatus === 'read' || normalizedStatus === 'replied') ? new Date().toISOString() : null,
              archived_at: normalizedStatus === 'archived' ? new Date().toISOString() : null,
              updated_at: new Date().toISOString()
            })
            .eq('id', notif.id);
        }
      }
    }

    if (error || !data) {
      console.error('❌ Erreur mise à jour statut:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du statut'
      });
    }

    return res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('❌ Erreur route contact status:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// PATCH /api/admin/notifications/:id/read - Marquer notification comme lue
router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user as AuthUser;
    
    if (!user || user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }
    
    // ✅ CORRECTION: Récupérer l'auth_user_id pour filtrer les notifications
    // Les notifications utilisent auth_user_id (Supabase Auth ID) dans user_id
    let userId = (user as any).id || (user as any).auth_user_id;
    
    // Si user.id et auth_user_id sont undefined, récupérer depuis la table Admin
    if (!userId || userId === 'undefined' || userId === undefined) {
      const databaseId = (user as any).database_id;
      
      if (!databaseId) {
        console.error('❌ Erreur: user.id et database_id sont undefined', {
          user: user ? {
            type: user.type,
            email: (user as any).email,
            hasId: !!(user as any).id,
            hasAuthUserId: !!(user as any).auth_user_id,
            hasDatabaseId: !!(user as any).database_id
          } : 'user is null'
        });
        return res.status(500).json({
          success: false,
          message: 'Erreur d\'authentification: ID utilisateur manquant'
        });
      }
      
      // Récupérer l'auth_user_id depuis la table Admin
      const { data: adminData, error: adminError } = await supabaseAdmin
        .from('Admin')
        .select('auth_user_id')
        .eq('id', databaseId)
        .single();
      
      if (adminError || !adminData || !adminData.auth_user_id) {
        console.error('❌ Erreur récupération auth_user_id admin:', adminError);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la récupération des informations utilisateur'
        });
      }
      
      userId = adminData.auth_user_id;
    }
    
    // ✅ CORRECTION: Utiliser la table 'AdminNotification' et mettre à jour status + is_read
    // Vérifier d'abord si la notification existe
    console.log(`🔍 Recherche notification ${id} dans AdminNotification`);
    const { data: existing, error: checkError } = await supabaseClient
      .from('AdminNotification')
      .select('id, status, is_read, type, title')
      .eq('id', id)
      .maybeSingle();
    
    if (checkError) {
      console.error('❌ Erreur vérification notification:', checkError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification de la notification'
      });
    }
    
    if (!existing) {
      // Vérifier aussi dans la table notification au cas où
      console.log(`⚠️ Notification ${id} non trouvée dans AdminNotification, vérification dans notification...`);
      const { data: notifInOtherTable, error: otherError } = await supabaseClient
        .from('notification')
        .select('id, status, is_read, notification_type, title, user_type, user_id')
        .eq('id', id)
        .maybeSingle();
      
      if (notifInOtherTable) {
        console.log(`ℹ️ Notification trouvée dans table 'notification' avec user_type: ${notifInOtherTable.user_type}`);
        
        // Si c'est une notification admin dans la table notification, la mettre à jour là-bas
        if (notifInOtherTable.user_type === 'admin') {
          const { data: updatedNotif, error: updateError } = await supabaseClient
            .from('notification')
            .update({ 
              status: 'read',
              is_read: true,
              read_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_type', 'admin')
            .select();
          
          if (updateError) {
            console.error('❌ Erreur mise à jour notification dans table notification:', updateError);
            return res.status(500).json({
              success: false,
              message: 'Erreur lors de la mise à jour de la notification'
            });
          }
          
          if (updatedNotif && updatedNotif.length > 0) {
            return res.json({
              success: true,
              message: 'Notification marquée comme lue',
              data: { notification: updatedNotif[0] }
            });
          }
        }
        
        return res.status(400).json({
          success: false,
          message: 'Cette notification est dans la table notification mais pas pour un admin'
        });
      }
      
      console.warn(`ℹ️ Notification admin ${id} introuvable dans AdminNotification et notification`);
      return res.status(404).json({
        success: false,
        message: 'Notification introuvable'
      });
    }
    
    console.log(`✅ Notification trouvée: ${existing.type} - ${existing.title} (status: ${existing.status})`);
    
    // Mettre à jour la notification
    const { data, error } = await supabaseClient
      .from('AdminNotification')
      .update({ 
        status: 'read',
        is_read: true,
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('❌ Erreur mise à jour notification:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la notification'
      });
    }

    if (!data || data.length === 0) {
      console.warn(`ℹ️ Notification admin ${id} non mise à jour après update`);
      return res.status(404).json({
        success: false,
        message: 'Notification introuvable ou déjà traitée'
      });
    }
    
    return res.json({
      success: true,
      message: 'Notification marquée comme lue',
      data: { notification: data[0] }
    });
    
  } catch (error) {
    console.error('❌ Erreur route notification read:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// PATCH /api/admin/notifications/:id/unread - Marquer notification comme non lue
router.patch('/notifications/:id/unread', async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user as AuthUser;
    
    if (!user || user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }
    
    // ✅ CORRECTION: Récupérer l'auth_user_id pour filtrer les notifications
    let userId = (user as any).id || (user as any).auth_user_id;
    
    if (!userId || userId === 'undefined' || userId === undefined) {
      const databaseId = (user as any).database_id;
      
      if (databaseId) {
        const { data: adminData, error: adminError } = await supabaseAdmin
          .from('Admin')
          .select('auth_user_id')
          .eq('id', databaseId)
          .single();
        
        if (!adminError && adminData?.auth_user_id) {
          userId = adminData.auth_user_id;
        }
      }
    }
    
    // Vérifier que la notification existe dans AdminNotification
    const { data: existing, error: checkError } = await supabaseClient
      .from('AdminNotification')
      .select('id, status')
      .eq('id', id)
      .maybeSingle();
    
    if (checkError) {
      console.error('❌ Erreur vérification notification:', checkError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification de la notification'
      });
    }
    
    if (!existing) {
      // Vérifier aussi dans la table notification au cas où (notifications d'événement)
      console.log(`⚠️ Notification ${id} non trouvée dans AdminNotification, vérification dans notification...`);
      const { data: notifInOtherTable, error: otherError } = await supabaseClient
        .from('notification')
        .select('id, status, is_read, notification_type, title, user_type, user_id')
        .eq('id', id)
        .maybeSingle();
      
      if (notifInOtherTable) {
        console.log(`ℹ️ Notification trouvée dans table 'notification' avec user_type: ${notifInOtherTable.user_type}`);
        
        // Si c'est une notification admin dans la table notification, la mettre à jour là-bas
        if (notifInOtherTable.user_type === 'admin') {
          const { data: updatedNotif, error: updateError } = await supabaseClient
            .from('notification')
            .update({ 
              status: 'unread',
              is_read: false,
              read_at: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_type', 'admin')
            .select();
          
          if (updateError) {
            console.error('❌ Erreur mise à jour notification dans table notification:', updateError);
            return res.status(500).json({
              success: false,
              message: 'Erreur lors de la mise à jour de la notification'
            });
          }
          
          if (updatedNotif && updatedNotif.length > 0) {
            return res.json({
              success: true,
              message: 'Notification marquée comme non lue',
              data: { notification: updatedNotif[0] }
            });
          }
        }
        
        return res.status(400).json({
          success: false,
          message: 'Cette notification est dans la table notification mais pas pour un admin'
        });
      }
      
      return res.status(404).json({
        success: false,
        message: 'Notification introuvable'
      });
    }
    
    // Marquer comme non lu dans AdminNotification
    const { data, error } = await supabaseClient
      .from('AdminNotification')
      .update({ 
        status: 'unread',
        is_read: false,
        read_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('❌ Erreur mise à jour notification:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la notification'
      });
    }
    
    return res.json({
      success: true,
      message: 'Notification marquée comme non lue',
      data: { notification: data }
    });
    
  } catch (error) {
    console.error('❌ Erreur route notification unread:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// PATCH /api/admin/notifications/:id/unarchive - Réintégrer notification depuis archivé
router.patch('/notifications/:id/unarchive', async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user as AuthUser;
    
    if (!user || user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }
    
    // Vérifier que la notification existe et est archivée
    const { data: existing, error: checkError } = await supabaseClient
      .from('AdminNotification')
      .select('id, status, read_at, is_read')
      .eq('id', id)
      .maybeSingle();
    
    if (checkError) {
      console.error('❌ Erreur vérification notification:', checkError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification de la notification'
      });
    }
    
    if (!existing) {
      // Vérifier aussi dans la table notification au cas où (notifications d'événement)
      console.log(`⚠️ Notification ${id} non trouvée dans AdminNotification, vérification dans notification...`);
      const { data: notifInOtherTable, error: otherError } = await supabaseClient
        .from('notification')
        .select('id, status, is_read, read_at, notification_type, title, user_type, user_id')
        .eq('id', id)
        .maybeSingle();
      
      if (notifInOtherTable) {
        console.log(`ℹ️ Notification trouvée dans table 'notification' avec user_type: ${notifInOtherTable.user_type}`);
        
        // Si c'est une notification admin dans la table notification, la mettre à jour là-bas
        if (notifInOtherTable.user_type === 'admin') {
          if (notifInOtherTable.status !== 'archived') {
            return res.status(400).json({
              success: false,
              message: 'Cette notification n\'est pas archivée'
            });
          }
          
          const wasRead = notifInOtherTable.is_read || notifInOtherTable.read_at !== null;
          const newStatus = wasRead ? 'read' : 'unread';
          
          const { data: updatedNotif, error: updateError } = await supabaseClient
            .from('notification')
            .update({ 
              status: newStatus,
              is_read: wasRead,
              archived_at: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_type', 'admin')
            .select();
          
          if (updateError) {
            console.error('❌ Erreur réintégration notification dans table notification:', updateError);
            return res.status(500).json({
              success: false,
              message: 'Erreur lors de la réintégration de la notification'
            });
          }
          
          if (updatedNotif && updatedNotif.length > 0) {
            return res.json({
              success: true,
              message: `Notification réintégrée (${newStatus})`,
              data: { notification: updatedNotif[0] }
            });
          }
        }
        
        return res.status(400).json({
          success: false,
          message: 'Cette notification est dans la table notification mais pas pour un admin'
        });
      }
      
      return res.status(404).json({
        success: false,
        message: 'Notification introuvable'
      });
    }
    
    if (existing.status !== 'archived') {
      return res.status(400).json({
        success: false,
        message: 'Cette notification n\'est pas archivée'
      });
    }
    
    // Réintégrer la notification : si elle avait été lue avant archivage, la remettre en "read", sinon en "unread"
    const wasRead = existing.is_read || existing.read_at !== null;
    const newStatus = wasRead ? 'read' : 'unread';
    
    const { data, error } = await supabaseClient
      .from('AdminNotification')
      .update({ 
        status: newStatus,
        is_read: wasRead,
        archived_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('❌ Erreur réintégration notification:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la réintégration de la notification'
      });
    }
    
    return res.json({
      success: true,
      message: `Notification réintégrée (${newStatus})`,
      data: { notification: data }
    });
    
  } catch (error) {
    console.error('❌ Erreur route notification unarchive:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// DELETE /api/admin/notifications/:id - Archiver notification
router.delete('/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier d'abord si la notification existe
    const { data: existing, error: checkError } = await supabaseClient
      .from('AdminNotification')
      .select('id, status')
      .eq('id', id)
      .maybeSingle();
    
    if (checkError) {
      console.error('❌ Erreur vérification notification:', checkError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification de la notification'
      });
    }
    
    // Si la notification n'existe pas dans AdminNotification, vérifier dans notification
    if (!existing) {
      // Vérifier aussi dans la table notification au cas où (notifications d'événement)
      console.log(`⚠️ Notification ${id} non trouvée dans AdminNotification, vérification dans notification...`);
      const { data: notifInOtherTable, error: otherError } = await supabaseClient
        .from('notification')
        .select('id, status, notification_type, title, user_type, user_id')
        .eq('id', id)
        .maybeSingle();
      
      if (notifInOtherTable) {
        console.log(`ℹ️ Notification trouvée dans table 'notification' avec user_type: ${notifInOtherTable.user_type}`);
        
        // Si c'est une notification admin dans la table notification, l'archiver là-bas
        if (notifInOtherTable.user_type === 'admin') {
          if (notifInOtherTable.status === 'archived') {
            return res.json({
              success: true,
              message: 'Notification déjà archivée',
              data: { notification: notifInOtherTable }
            });
          }
          
          const { data: updatedNotif, error: updateError } = await supabaseClient
            .from('notification')
            .update({ 
              status: 'archived',
              archived_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_type', 'admin')
            .select();
          
          if (updateError) {
            console.error('❌ Erreur archivage notification dans table notification:', updateError);
            return res.status(500).json({
              success: false,
              message: 'Erreur lors de l\'archivage de la notification'
            });
          }
          
          if (updatedNotif && updatedNotif.length > 0) {
            return res.json({
              success: true,
              message: 'Notification archivée',
              data: { notification: updatedNotif[0] }
            });
          }
        }
        
        return res.status(400).json({
          success: false,
          message: 'Cette notification est dans la table notification mais pas pour un admin'
        });
      }
      
      return res.json({
        success: true,
        message: 'Notification introuvable ou déjà supprimée',
        data: { notification: null }
      });
    }
    
    if (existing.status === 'archived') {
      return res.json({
        success: true,
        message: 'Notification déjà archivée',
        data: { notification: existing }
      });
    }
    
    // Archiver la notification dans AdminNotification
    const { data, error } = await supabaseClient
      .from('AdminNotification')
      .update({ 
        status: 'archived',
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('❌ Erreur archivage notification:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'archivage de la notification'
      });
    }
    
    return res.json({
      success: true,
      data: { notification: data }
    });
    
  } catch (error) {
    console.error('❌ Erreur route notification archive:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/admin/dossiers/:id - Détails complets d'un dossier
router.get('/dossiers/:id', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🔍 Récupération dossier ${id}`);

    const { data: dossier, error } = await supabaseClient
      .from('ClientProduitEligible')
      .select(`
        *,
        Client!inner (
          id,
          company_name,
          first_name,
          last_name,
          email,
          phone_number
        ),
        ProduitEligible!inner (
          id,
          nom,
          description,
          categorie
        ),
        Expert!fk_clientproduiteligible_expert (
          id,
          first_name,
          last_name,
          name,
          company_name,
          email,
          cabinet_id,
          Cabinet:cabinet_id (
            id,
            name,
            siret
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !dossier) {
      console.error('❌ Erreur récupération dossier:', error);
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    console.log('✅ Dossier récupéré:', dossier.id);

    return res.json({
      success: true,
      data: dossier
    });

  } catch (error) {
    console.error('❌ Erreur route dossiers/:id:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
}));

// GET /api/admin/dossiers/:id/historique - Historique d'un dossier
router.get('/dossiers/:id/historique', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📜 Récupération historique dossier ${id}`);

    const { data: historique, error } = await supabaseClient
      .from('DossierHistorique')
      .select('*')
      .eq('dossier_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération historique:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'historique'
      });
    }

    return res.json({
      success: true,
      data: { historique: historique || [] }
    });

  } catch (error) {
    console.error('❌ Erreur route historique:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/admin/dossiers/:id/commentaires - Commentaires d'un dossier
router.get('/dossiers/:id/commentaires', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`💬 Récupération commentaires dossier ${id}`);

    const { data: commentaires, error } = await supabaseClient
      .from('DossierCommentaire')
      .select('*')
      .eq('dossier_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération commentaires:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des commentaires'
      });
    }

    return res.json({
      success: true,
      data: { commentaires: commentaires || [] }
    });

  } catch (error) {
    console.error('❌ Erreur route commentaires:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/admin/dossiers/:id/commentaires - Ajouter un commentaire
router.post('/dossiers/:id/commentaires', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, is_private = false, parent_comment_id = null } = req.body;
    const authUser = (req as any).user;
    
    console.log(`💬 Ajout commentaire dossier ${id}`);

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu du commentaire est requis'
      });
    }

    // Déterminer le nom de l'auteur
    let author_name = 'Utilisateur';
    if (authUser) {
      if (authUser.type === 'admin') {
        author_name = authUser.email || 'Admin';
      } else {
        author_name = authUser.email || 'Utilisateur';
      }
    }

    const { data: commentaire, error } = await supabaseClient
      .from('DossierCommentaire')
      .insert({
        dossier_id: id,
        author_id: authUser?.database_id || authUser?.auth_user_id || authUser?.id,
        author_type: authUser?.type || 'admin',
        author_name,
        content: content.trim(),
        is_private,
        parent_comment_id
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur ajout commentaire:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'ajout du commentaire'
      });
    }

    // Ajouter une entrée dans l'historique
    await supabaseClient
      .from('DossierHistorique')
      .insert({
        dossier_id: id,
        user_id: authUser?.database_id || authUser?.auth_user_id || authUser?.id,
        user_type: authUser?.type || 'admin',
        user_name: author_name,
        action_type: 'comment_added',
        description: `Commentaire ajouté${is_private ? ' (privé)' : ''}`
      });

    console.log(`✅ Commentaire ajouté`);
    
    return res.json({
      success: true,
      data: { commentaire }
    });

  } catch (error) {
    console.error('❌ Erreur route ajout commentaire:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// DELETE /api/admin/dossiers/:dossierId/commentaires/:commentId - Supprimer un commentaire
router.delete('/dossiers/:dossierId/commentaires/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const authUser = (req as any).user;
    
    console.log(`🗑️ Suppression commentaire ${commentId}`);

    // Vérifier que l'utilisateur est l'auteur ou un admin
    const { data: commentaire } = await supabaseClient
      .from('DossierCommentaire')
      .select('author_id, author_type')
      .eq('id', commentId)
      .single();

    if (!commentaire) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé'
      });
    }

    const isAuthor = commentaire.author_id === (authUser?.database_id || authUser?.auth_user_id || authUser?.id);
    const isAdmin = authUser?.type === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à supprimer ce commentaire'
      });
    }

    const { error } = await supabaseClient
      .from('DossierCommentaire')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('❌ Erreur suppression commentaire:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du commentaire'
      });
    }

    console.log(`✅ Commentaire supprimé`);
    
    return res.json({
      success: true,
      data: { message: 'Commentaire supprimé' }
    });

  } catch (error) {
    console.error('❌ Erreur route suppression commentaire:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.post('/dossiers/:id/recalculate-progress', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { DossierStepGenerator } = await import('../services/dossierStepGenerator');

  const success = await DossierStepGenerator.updateDossierProgress(id);

  if (!success) {
    return res.status(500).json({
      success: false,
      message: 'Impossible de recalculer la progression du dossier'
    });
  }

  const { data: dossier } = await supabaseAdmin
    .from('ClientProduitEligible')
    .select('*')
    .eq('id', id)
    .single();

  return res.json({
    success: true,
    data: dossier
  });
}));

router.post('/dossiers/normalize-statuses', asyncHandler(async (_req, res) => {
  const { data: dossiers, error } = await supabaseAdmin
    .from('ClientProduitEligible')
    .select('id, statut');

  if (error) {
    console.error('❌ Erreur lecture statuts legacy:', error);
    throw error;
  }

  const updates: StatusUpdate[] = (dossiers || [])
    .map((d: { id: string; statut: string | null }): StatusUpdate => ({
      id: d.id,
      current: d.statut,
      normalized: normalizeDossierStatus(d.statut)
    }))
    .filter(d => d.current !== d.normalized);

  for (let index = 0; index < updates.length; index += 100) {
    const chunk = updates.slice(index, index + 100);
    const { error: updateError } = await supabaseAdmin
      .from('ClientProduitEligible')
      .upsert(
        chunk.map(({ id, normalized }: StatusUpdate) => ({ id, statut: normalized })),
        { onConflict: 'id' }
      );

    if (updateError) {
      console.error('❌ Erreur normalisation statuts:', updateError);
      throw updateError;
    }
  }

  return res.json({
    success: true,
    updated: updates.length
  });
}));

// POST /api/admin/leads - Créer un lead (admin uniquement)
router.post('/leads', asyncHandler(async (req, res) => {
  try {
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

    // Récupérer l'ID de l'admin qui envoie le lead
    const user = (req as any).user;
    const adminId = user?.database_id || user?.id || null;
    
    // Insérer le lead dans la table contact_messages
    // On utilise le champ subject pour marquer que c'est un lead si le champ type n'existe pas
    const leadSubject = subject 
      ? `[LEAD] ${subject.trim()}` 
      : '[LEAD] Lead ajouté manuellement';
    
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
    
    // Ajouter sender_id et sender_type si l'admin est identifié
    if (adminId) {
      leadData.sender_id = adminId;
      leadData.sender_type = 'admin';
    }
    
    const { data: lead, error } = await supabaseAdmin
      .from('contact_messages')
      .insert(leadData)
      .select('id')
      .single();

    if (error) {
      console.error('❌ Erreur insertion lead:', error);
      
      // Si la table n'existe pas, on la crée automatiquement
      if (error.code === '42P01') {
        console.log('⚠️ Table contact_messages n\'existe pas, création en cours...');
        return res.status(500).json({
          success: false,
          message: 'Table de contact non configurée. Veuillez créer la table contact_messages dans Supabase.'
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

    console.log('✅ Lead créé avec succès:', lead?.id);

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
      console.log('✅ Notification admin créée pour le lead');
    } catch (notifError) {
      console.error('❌ Erreur création notification lead:', notifError);
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
    console.error('❌ Erreur route leads:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
}));

// GET /api/admin/events/:id/synthese - Synthèse complète d'un événement
router.get('/events/:id/synthese', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🔍 Récupération synthèse événement ${id}`);

    // Vérifier que l'ID est valide (UUID format)
    if (!id || typeof id !== 'string' || id.length < 30) {
      console.error('❌ ID événement invalide:', id);
      return res.status(400).json({
        success: false,
        message: 'ID événement invalide'
      });
    }

    // Vérifier d'abord que l'ID existe dans la table RDV
    const { data: rdvCheck, error: checkError } = await supabaseClient
      .from('RDV')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !rdvCheck) {
      console.error('❌ Vérification ID RDV - Événement non trouvé dans la table RDV:', {
        id,
        error: checkError,
        code: checkError?.code,
        message: checkError?.message
      });
      
      // Vérifier si l'ID existe dans d'autres tables (pour diagnostic)
      const { data: calendarCheck } = await supabaseClient
        .from('CalendarEvent')
        .select('id')
        .eq('id', id)
        .single();
      
      if (calendarCheck) {
        console.warn('⚠️ ID trouvé dans CalendarEvent au lieu de RDV - Migration nécessaire');
      }
      
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé dans la base de données',
        eventId: id,
        suggestion: 'Vérifiez que l\'ID correspond bien à un événement dans la table RDV'
      });
    }

    // Récupérer l'événement avec toutes ses relations depuis la table RDV
    const { data: event, error: eventError } = await supabaseClient
      .from('RDV')
      .select(`
        *,
        Client:client_id (
          id,
          company_name,
          first_name,
          last_name,
          name,
          email,
          phone_number
        ),
        Expert:expert_id (
          id,
          first_name,
          last_name,
          name,
          company_name,
          email,
          cabinet_id,
          Cabinet:cabinet_id (
            id,
            name,
            siret
          )
        ),
        ApporteurAffaires:apporteur_id (
          id,
          first_name,
          last_name,
          company_name,
          email,
          phone
        ),
        RDV_Produits(*, ProduitEligible(*)),
        RDV_Participants (
          user_id,
          user_type,
          status
        )
      `)
      .eq('id', id)
      .single();

    if (eventError) {
      console.error('❌ Erreur récupération événement:', {
        error: eventError,
        code: eventError.code,
        message: eventError.message,
        details: eventError.details,
        hint: eventError.hint,
        eventId: id
      });
      
      // Si l'événement n'existe pas (code PGRST116)
      if (eventError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Événement non trouvé',
          eventId: id
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'événement',
        error: eventError.message
      });
    }

    if (!event) {
      console.error('❌ Événement non trouvé (data null):', id);
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé',
        eventId: id
      });
    }

    // Récupérer le rapport si existant
    const { data: report, error: reportError } = await supabaseClient
      .from('RDV_Report')
      .select('*')
      .eq('rdv_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (reportError && reportError.code !== 'PGRST116') {
      console.error('❌ Erreur récupération rapport:', reportError);
    }

    // Enrichir les participants avec leurs informations
    const enrichedParticipants = [];
    if (event.RDV_Participants && event.RDV_Participants.length > 0) {
      for (const participant of event.RDV_Participants) {
        let participantData = null;
        
        if (participant.user_type === 'client') {
          const { data: clientData } = await supabaseClient
            .from('Client')
            .select('id, name, email, company_name')
            .eq('id', participant.user_id)
            .single();
          participantData = clientData;
        } else if (participant.user_type === 'expert') {
          const { data: expertData } = await supabaseClient
            .from('Expert')
            .select('id, name, email, company_name')
            .eq('id', participant.user_id)
            .single();
          participantData = expertData;
        } else if (participant.user_type === 'apporteur') {
          const { data: apporteurData } = await supabaseClient
            .from('ApporteurAffaires')
            .select('id, first_name, last_name, company_name, email')
            .eq('id', participant.user_id)
            .single();
          participantData = apporteurData;
        }

        if (participantData) {
          enrichedParticipants.push({
            ...participant,
            ...participantData
          });
        }
      }
    }

    console.log('✅ Synthèse événement récupérée:', event.id);

    return res.json({
      success: true,
      data: {
        event: {
          ...event,
          RDV_Participants: enrichedParticipants
        },
        report: report || null
      }
    });

  } catch (error) {
    console.error('❌ Erreur route events/:id/synthese:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
}));

// POST /api/admin/events/sync-completed - Forcer la vérification et mise à jour des RDV passés
router.post('/events/sync-completed', asyncHandler(async (req, res) => {
  try {
    console.log('🔍 Synchronisation manuelle des RDV passés demandée par admin');

    // Importer le service de complétion RDV
    const rdvCompletionServiceModule = await import('../services/rdvCompletionService');
    const rdvCompletionService = rdvCompletionServiceModule.default as any;
    
    // Appeler la méthode publique de vérification forcée
    await rdvCompletionService.forceCheck();

    return res.json({
      success: true,
      message: 'Synchronisation des RDV passés effectuée avec succès'
    });

  } catch (error: any) {
    console.error('❌ Erreur synchronisation RDV passés:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la synchronisation des RDV passés',
      error: error.message
    });
  }
}));

export default router;
