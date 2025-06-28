import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Configuration Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/dashboard - Dashboard principal avec KPIs
router.get('/dashboard', asyncHandler(async (req, res) => {
  try {
    // 1. KPIs Utilisateurs
    const { count: totalClients } = await supabase
      .from('Client')
      .select('*', { count: 'exact', head: true });

    const { count: totalExperts } = await supabase
      .from('Expert')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: pendingExperts } = await supabase
      .from('Expert')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'pending');

    // Nouveaux ce mois
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: newClientsThisMonth } = await supabase
      .from('Client')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    const { count: newExpertsThisMonth } = await supabase
      .from('Expert')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    // 2. KPIs Dossiers
    const { count: totalAudits } = await supabase
      .from('Audit')
      .select('*', { count: 'exact', head: true });

    const { count: activeAudits } = await supabase
      .from('Audit')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'en_cours');

    const { count: completedAudits } = await supabase
      .from('Audit')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'terminé');

    // 3. KPIs Financiers
    const { data: auditsData } = await supabase
      .from('Audit')
      .select('potential_gain, obtained_gain');

    const totalPotentialGain = auditsData?.reduce((sum, audit) => 
      sum + (audit.potential_gain || 0), 0) || 0;
    
    const totalObtainedGain = auditsData?.reduce((sum, audit) => 
      sum + (audit.obtained_gain || 0), 0) || 0;

    // 4. Répartition par produit
    const { data: clientProduits } = await supabase
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
    const { data: expertStats } = await supabase
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
    const { data: recentActivity } = await supabase
      .from('Client')
      .select('id, created_at, derniereConnexion')
      .order('derniereConnexion', { ascending: false })
      .limit(10);

    // 7. Qualité et alertes
    const { count: delayedAudits } = await supabase
      .from('Audit')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'en_cours')
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Plus de 30 jours

    // 8. Évolution temporelle (7 derniers jours)
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { count: newClients } = await supabase
        .from('Client')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      const { count: newAudits } = await supabase
        .from('Audit')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      dailyStats.push({
        date: date.toISOString().split('T')[0],
        newClients: newClients || 0,
        newAudits: newAudits || 0
      });
    }

    // 9. Répartition géographique
    const { data: locationStats } = await supabase
      .from('Client')
      .select('city')
      .not('city', 'is', null);

    const cityStats = locationStats?.reduce((acc, client) => {
      const city = client.city;
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // 10. Funnel de conversion
    const { count: totalEligibleProducts } = await supabase
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

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Erreur dashboard admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données du dashboard'
    });
  }
}));

// GET /api/admin/stats/experts - Statistiques détaillées des experts
router.get('/stats/experts', asyncHandler(async (req, res) => {
  try {
    const { data: experts } = await supabase
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

    res.json({
      success: true,
      data: {
        experts,
        specializationStats
      }
    });

  } catch (error) {
    console.error('Erreur stats experts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques experts'
    });
  }
}));

// GET /api/admin/stats/clients - Statistiques détaillées des clients
router.get('/stats/clients', asyncHandler(async (req, res) => {
  try {
    const { data: clients } = await supabase
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

    res.json({
      success: true,
      data: {
        clients,
        engagementStats
      }
    });

  } catch (error) {
    console.error('Erreur stats clients:', error);
    res.status(500).json({
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

    let query = supabase
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
    const { count: totalCount } = await supabase
      .from('Expert')
      .select('*', { count: 'exact', head: true });

    res.json({
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
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des experts'
    });
  }
}));

// GET /api/admin/experts/:id - Détails d'un expert
router.get('/experts/:id', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const { data: expert, error } = await supabase
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
    const { data: audits } = await supabase
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

    res.json({
      success: true,
      data: {
        expert,
        stats
      }
    });

  } catch (error) {
    console.error('Erreur récupération expert:', error);
    res.status(500).json({
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

    const { data: expert, error: expertError } = await supabase
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

    const { data, error } = await supabase
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
    await supabase
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

    res.json({
      success: true,
      data,
      message: 'Expert approuvé avec succès'
    });

  } catch (error) {
    console.error('Erreur approbation expert:', error);
    res.status(500).json({
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

    const { data: expert, error: expertError } = await supabase
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

    const { data, error } = await supabase
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
    await supabase
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

    res.json({
      success: true,
      data,
      message: 'Expert rejeté avec succès'
    });

  } catch (error) {
    console.error('Erreur rejet expert:', error);
    res.status(500).json({
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
    const { data: oldExpert } = await supabase
      .from('Expert')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('Expert')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log de l'action
    await supabase
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

    res.json({
      success: true,
      data,
      message: 'Expert modifié avec succès'
    });

  } catch (error) {
    console.error('Erreur modification expert:', error);
    res.status(500).json({
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
    const { data: existingExpert } = await supabase
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
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
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

    // Insérer dans la table Expert
    const { data: newExpert, error: expertError } = await supabase
      .from('Expert')
      .insert({
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
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (expertError) {
      // Supprimer l'utilisateur Auth si l'insertion échoue
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw expertError;
    }

    // Log de l'action
    await supabase
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

    res.status(201).json({
      success: true,
      data: newExpert,
      message: 'Expert créé avec succès'
    });

  } catch (error) {
    console.error('Erreur création expert:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'expert'
    });
  }
}));

// ========================================
// ROUTES CLIENTS
// ========================================

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

    let query = supabase
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
    const { count: totalCount } = await supabase
      .from('Client')
      .select('*', { count: 'exact', head: true });

    res.json({
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
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des clients'
    });
  }
}));

// GET /api/admin/clients/:id - Détails d'un client
router.get('/clients/:id', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer les informations du client
    const { data: client, error: clientError } = await supabase
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
    const { data: produitsEligibles } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        ProduitEligible(name, description, category)
      `)
      .eq('clientId', id);

    // Récupérer les audits du client
    const { data: audits } = await supabase
      .from('Audit')
      .select(`
        *,
        Expert(name, email, company_name)
      `)
      .eq('client_id', id);

    // Récupérer la signature de charte
    const { data: charteSignature } = await supabase
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

    res.json({
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
    res.status(500).json({
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
    const { data: oldClient } = await supabase
      .from('Client')
      .select('statut')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
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
    await supabase
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
    const { data: client } = await supabase
      .from('Client')
      .select('*')
      .eq('id', id)
      .single();

    // Supprimer les données associées (en cascade si possible)
    await supabase
      .from('ClientProduitEligible')
      .delete()
      .eq('clientId', id);

    await supabase
      .from('Audit')
      .delete()
      .eq('client_id', id);

    await supabase
      .from('client_charte_signature')
      .delete()
      .eq('client_id', id);

    // Supprimer le client
    const { error } = await supabase
      .from('Client')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    // Log de l'action
    await supabase
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

export default router; 