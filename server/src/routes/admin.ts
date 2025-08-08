import express, { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthUser } from '../types/auth';
import messagesRouter from './admin/messages';

const router = express.Router();

// Configuration Supabase
const supabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    return res.json({
      success: true,
      message: 'Route admin fonctionne',
      timestamp: new Date().toISOString()
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

// Route de test pour vérifier l'authentification admin
router.get('/test-auth', asyncHandler(async (req, res) => {
  try {
    console.log('🧪 Test authentification admin appelée');
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }
    
    return res.json({
      success: true,
      message: 'Admin authentifié avec succès',
      data: {
        user: {
          id: user.id,
          type: user.type,
          email: user.email
        }
      }
    });
  } catch (error) {
    console.error('Erreur test auth admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du test d\'authentification admin'
    });
  }
}));

// Route de test pour vérifier les clients
router.get('/test-clients', asyncHandler(async (req, res) => {
  try {
    console.log('🧪 Test route clients appelée');
    const { data: clients, error } = await supabaseClient
      .from('Client')
      .select('id, email, company_name')
      .limit(5);
    
    if (error) {
      throw error;
    }
    
    return res.json({
      success: true,
      message: 'Route clients fonctionne',
      data: {
        clients: clients || [],
        count: clients?.length || 0
      }
    });
  } catch (error) {
    console.error('Erreur test route clients:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du test de la route clients'
    });
  }
}));

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
        name,
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
        name: expert.name,
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

    const { data: expert, error } = await supabaseClient
      .from('Expert')
      .select(`
        *,
        Admin!Expert_approved_by_fkey(name as approved_by_name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        message: 'Expert non trouvé'
      });
    }

    // Récupérer les statistiques de l'expert
    const { data: audits } = await supabaseClient
      .from('Audit')
      .select('*')
      .eq('expert_id', id);

    const stats = {
      totalAudits: audits && audits.length ? audits.length : 0,
      completedAudits: audits && audits.length ? audits.filter(a => a.status === 'terminé').length : 0,
      activeAudits: audits && audits.length ? audits.filter(a => a.status === 'en_cours').length : 0,
      totalGains: audits && audits.length ? audits.reduce((sum, a) => sum + (a.obtained_gain || 0), 0) : 0,
      successRate: audits && audits.length > 0 ?
        (audits.filter(a => a.status === 'terminé').length || 0) / audits.length * 100 : 0
    };

    return res.json({
      success: true,
      data: {
        expert,
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

    return res.json({
      success: true,
      data,
      message: 'Expert approuvé avec succès'
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
      updated_at: new Date().toISOString()
    };

    // Supprimer le champ city car il n'existe pas en base
    delete updateExpertData.city;

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
    if (!expertData.name || !expertData.email || !expertData.company_name) {
      return res.status(400).json({
        success: false,
        message: 'Nom, email et nom de l\'entreprise sont requis'
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

    // Créer l'utilisateur Supabase Auth
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: expertData.email,
      password: 'Expert2024!', // Mot de passe temporaire
      email_confirm: true,
      user_metadata: {
        role: 'expert',
        name: expertData.name
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
    const expertInsertData = {
      id: authData.user.id, // Utiliser l'ID Supabase Auth
      name: expertData.name,
      email: expertData.email,
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
      auth_id: authData.user.id,
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
        ProduitEligible:ProduitEligible(id, nom, category, description)
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

// POST /api/admin/clients - Créer un nouveau client
router.post('/clients', asyncHandler(async (req, res) => {
  try {
    const {
      email,
      company_name,
      phone_number,
      city,
      siren,
      description,
      statut = 'actif'
    } = req.body;

    // Validation des données
    if (!email || !company_name) {
      return res.status(400).json({
        success: false,
        message: 'Email et nom de l\'entreprise sont requis'
      });
    }

    // Vérifier si l'email existe déjà
    const { data: existingClient } = await supabaseClient
      .from('Client')
      .select('id')
      .eq('email', email)
      .single();

    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: 'Un client avec cet email existe déjà'
      });
    }

    // Créer le client
    const { data: newClient, error } = await supabaseClient
      .from('Client')
      .insert({
        email,
        company_name,
        phone_number,
        city,
        siren,
        description,
        statut,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur création client:', error);
      throw error;
    }

    // Log de l'action
    await supabaseClient
      .from('AdminAuditLog')
      .insert({
        admin_id: (req as any).user.id,
        action: 'client_created',
        table_name: 'Client',
        record_id: newClient.id,
        new_values: newClient,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

    return res.status(201).json({
      success: true,
      data: newClient,
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
    
    console.log('✅ Admin authentifié:', (req as any).admin.id);

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
        Client:Client!inner(
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
        ),
        Simulation:Simulation(
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
      return res.status(500).json({ error: 'Erreur lors de la récupération des dossiers' });
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
      Simulation: dossier.Simulation,
      metadata: dossier.metadata,
      notes: dossier.notes,
      priorite: dossier.priorite
    })) || [];

    return res.json({
      dossiers: dossiersTransformes,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / parseInt(limit as string))
      }
    });

  } catch (error) {
    console.error('❌ Erreur route dossiers:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
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
      return res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
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
      return res.status(500).json({ error: 'Erreur lors de la récupération des statistiques produits' });
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
      return res.status(500).json({ error: 'Erreur lors de la récupération des statistiques experts' });
    }

    // Statistiques financières
    const { data: montants, error: montantsError } = await supabaseClient
      .from('ClientProduitEligible')
      .select('montantFinal');

    if (montantsError) {
      console.error('❌ Erreur récupération montants:', montantsError);
      return res.status(500).json({ error: 'Erreur lors de la récupération des montants' });
    }

    const totalMontant = montants?.reduce((sum, item) => sum + (item.montantFinal || 0), 0) || 0;
    const montantMoyen = montants?.length ? totalMontant / montants.length : 0;

    console.log('✅ Statistiques calculées avec succès');

    return res.json({
      totalDossiers: statusStats?.length || 0,
      dossiersAvecExpert: dossiersWithExperts?.length || 0,
      dossiersSansExpert: (statusStats?.length || 0) - (dossiersWithExperts?.length || 0),
      repartitionStatut: statusCount,
      repartitionProduit: produitCount,
      totalMontant,
      montantMoyen: Math.round(montantMoyen * 100) / 100
    });

  } catch (error) {
    console.error('❌ Erreur récupération statistiques dossiers:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération des statistiques des dossiers' });
  }
});

// Route pour récupérer les produits éligibles
router.get('/produits', async (req, res) => {
  try {
    console.log('✅ Récupération des produits éligibles');

    const { data: produits, error } = await supabaseClient
      .from('ProduitEligible')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération produits:', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération des produits' });
    }

    console.log('✅ Produits récupérés:', produits?.length || 0);

    return res.json({
      produits: produits || []
    });

  } catch (error) {
    console.error('❌ Erreur route produits:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour ajouter un nouveau produit
router.post('/produits', async (req, res) => {
  try {
    console.log('✅ Ajout d\'un nouveau produit');

    const {
      nom,
      description,
      categorie,
      montant_min,
      montant_max,
      taux_min,
      taux_max,
      duree_min,
      duree_max
    } = req.body;

    const { data: produit, error } = await supabaseClient
      .from('ProduitEligible')
      .insert({
        nom,
        description,
        categorie,
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
      produit
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
      montant_min,
      montant_max,
      taux_min,
      taux_max,
      duree_min,
      duree_max
    } = req.body;

    const { data: produit, error } = await supabaseClient
      .from('ProduitEligible')
      .update({
        nom,
        description,
        categorie,
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
      produit
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
    const { data: dossiers, error: checkError } = await supabaseClient
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

    const { error } = await supabaseClient
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

    return res.json({
      success: true,
      dossier
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
        const expertName = (item.Expert as any)?.name || 'Inconnu';
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
      .select('id, email, name, created_at')
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
        adminName: adminUser.name
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

export default router;
