import express, { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthUser } from '../types/auth';
import messagesRouter from './admin/messages';

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
      if (item.statut === 'eligible') {
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
        compensation,
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
      .eq('statut', 'eligible');

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
        compensation,
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
    const updateExpertData = {
      ...updateData,
      // Mapping city -> location
      location: updateData.city || updateData.location,
      // S'assurer que les nouveaux champs sont présents
      website: updateData.website || null,
      linkedin: updateData.linkedin || null,
      languages: updateData.languages || ['Français'],
      availability: updateData.availability || 'disponible',
      max_clients: updateData.max_clients || 10,
      hourly_rate: updateData.hourly_rate || 0,
      phone: updateData.phone || null,
      // Ajouter le mot de passe hashé si fourni
      ...(hashedPassword && { password: hashedPassword }),
      updated_at: new Date().toISOString()
    };

    // Supprimer les champs qui ne doivent pas être mis à jour
    delete updateExpertData.city;
    delete updateExpertData.temp_password;

    const { data, error } = await supabaseClient
      .from('Expert')
      .update(updateExpertData)
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
      specializations: expertData.specializations || [],
      rating: expertData.rating || 0,
      compensation: expertData.compensation || 0,
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
      availability: expertData.availability || 'disponible',
      max_clients: expertData.max_clients || 10,
      hourly_rate: expertData.hourly_rate || 0,
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
      return acc + dossiers.filter(d => ['eligible', 'en_cours'].includes(d.statut)).length;
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
    const dossiers_actifs = dossiersList.filter(d => ['eligible', 'en_cours'].includes(d.statut)).length;
    const dossiers_valides = dossiersList.filter(d => d.statut === 'validated').length;
    const taux_reussite = total_dossiers > 0 ? parseFloat(((dossiers_valides / total_dossiers) * 100).toFixed(1)) : 0;
    
    const en_pre_eligibilite = dossiersList.filter(d => d.validation_state === 'documents_uploaded').length;
    
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
        siren
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
        nombreEmployes,
        revenuAnnuel,
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
      .eq('statut', 'eligible')
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
        produitsEligibles.filter(p => p.statut === 'eligible').length : 0,
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

// DELETE /api/admin/clients/:id - Supprimer un client
router.delete('/clients/:id', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).user.id;

    // Récupérer les informations du client avant suppression
    const { data: client } = await supabaseClient
      .from('Client')
      .select('*')
      .eq('id', id)
      .single();

    // Supprimer les données associées (en cascade si possible)
    await supabaseClient
      .from('ClientProduitEligible')
      .delete()
      .eq('clientId', id);

    await supabaseClient
      .from('Audit')
      .delete()
      .eq('client_id', id);

    await supabaseClient
      .from('client_charte_signature')
      .delete()
      .eq('client_id', id);

    // Supprimer le client
    const { error } = await supabaseClient
      .from('Client')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
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
        user_agent: req.get('User-Agent')
      });

    res.json({
      success: true,
      message: 'Client supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du client'
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
      console.error('❌ Erreur récupération stats:', error);
      
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

    const { data: topClients, error } = await supabaseAdmin
      .from('ClientProduitEligible')
      .select(`
        clientId,
        "montantFinal",
        Client!ClientProduitEligible_clientId_fkey (
          company_name,
          email
        )
      `)
      .eq('produitId', id)
      .not('Client.email', 'like', '%@profitum.temp');

    if (error) {
      console.error('❌ Erreur récupération top clients:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Erreur lors de la récupération des top clients' 
      });
    }

    // Grouper par client et calculer les stats
    const clientsMap = new Map();
    
    topClients?.forEach((item: any) => {
      const clientId = item.clientId;
      const client = item.Client;
      const montant = item.montantFinal || 0;

      if (!clientsMap.has(clientId)) {
        clientsMap.set(clientId, {
          company_name: client?.company_name || 'N/A',
          email: client?.email || 'N/A',
          nombre_dossiers: 0,
          montant_total: 0
        });
      }

      const clientData = clientsMap.get(clientId);
      clientData.nombre_dossiers += 1;
      clientData.montant_total += montant;
    });

    // Convertir en tableau et calculer la moyenne
    const topClientsArray = Array.from(clientsMap.values())
      .map(client => ({
        ...client,
        montant_moyen: client.nombre_dossiers > 0 ? client.montant_total / client.nombre_dossiers : 0
      }))
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

    const { data: dossiers, error } = await supabaseAdmin
      .from('ClientProduitEligible')
      .select(`
        *,
        Client!ClientProduitEligible_clientId_fkey (
          id,
          company_name,
          first_name,
          last_name,
          email
        )
      `)
      .eq('produitId', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération dossiers:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Erreur lors de la récupération des dossiers' 
      });
    }

    return res.json({
      success: true,
      data: {
        dossiers: dossiers || []
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

// GET /api/admin/notifications - Notifications système
router.get('/notifications', asyncHandler(async (req, res) => {
  try {
    const { type, priority, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabaseClient
      .from('notification')
      .select('*')
      .eq('user_type', 'admin');

    if (type) {
      query = query.eq('notification_type', type);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data: notifications, error, count } = await query
      .range(offset, offset + Number(limit) - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des notifications' });
    }

    return res.json({
      success: true,
      data: {
        notifications: notifications || [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

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

// GET /api/admin/experts/all - Tous les experts de la plateforme
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

// POST /api/admin/dossiers/:id/assign-expert - Assigner un expert à un dossier
router.post('/dossiers/:id/assign-expert', async (req, res) => {
  try {
    const { id } = req.params;
    const { expert_id } = req.body;
    
    console.log(`👨‍🏫 Assignation expert ${expert_id} au dossier ${id}`);

    if (!expert_id) {
      return res.status(400).json({
        success: false,
        message: 'L\'ID de l\'expert est requis'
      });
    }

    // Vérifier que l'expert existe et est approuvé
    const { data: expert, error: expertError } = await supabaseClient
      .from('Expert')
      .select('id, first_name, last_name, approval_status')
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

    // Assigner l'expert au dossier
    const { data: dossier, error } = await supabaseClient
      .from('ClientProduitEligible')
      .update({ 
        expert_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur assignation expert:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'assignation de l\'expert'
      });
    }

    console.log(`✅ Expert ${expert.first_name} ${expert.last_name} assigné`);
    
    return res.json({
      success: true,
      data: { 
        dossier,
        expert: {
          id: expert.id,
          first_name: expert.first_name,
          last_name: expert.last_name
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
    const { status, priority, limit = 50 } = req.query;
    
    let query = supabaseClient
      .from('AdminNotification')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Number(limit));
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (priority) {
      query = query.eq('priority', priority);
    }
    
    const { data: notifications, error } = await query;
    
    if (error) {
      console.error('❌ Erreur récupération notifications:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des notifications'
      });
    }
    
    return res.json({
      success: true,
      data: { notifications: notifications || [] }
    });
    
  } catch (error) {
    console.error('❌ Erreur route notifications:', error);
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
    
    const { data, error } = await supabaseClient
      .from('AdminNotification')
      .update({ 
        status: 'read',
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erreur mise à jour notification:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la notification'
      });
    }
    
    return res.json({
      success: true,
      data: { notification: data }
    });
    
  } catch (error) {
    console.error('❌ Erreur route notification read:', error);
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
    
    const { data, error } = await supabaseClient
      .from('AdminNotification')
      .update({ 
        status: 'archived',
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
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
          email
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

export default router;
