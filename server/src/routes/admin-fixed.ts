import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticateUser } from '../middleware/authenticate';
import { RequestWithUser } from '../types/auth';

const router = Router();

// Configuration Supabase
const supabase = createClient(
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
      // Activité récente
      recentActivity: recentActivity?.map(client => ({
        id: client.id,
        created_at: client.created_at,
        derniereConnexion: client.derniereConnexion
      })) || [],
      // Évolution temporelle
      dailyStats,
      // Répartition géographique
      cityStats
    };

    res.json(dashboardData);

  } catch (error) {
    console.error('Erreur dashboard admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données du dashboard'
    });
  }
}));

// Route pour récupérer tous les dossiers clients
router.get('/dossiers', authenticateUser, async (req: Request, res) => {
  try {
    const { page = 1, limit = 10, status, client, produit, expert, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
    
    // Vérifier que l'utilisateur est admin
    const { data: admin, error: adminError } = await supabase
      .from('Admin')
      .select('*')
      .eq('id', req.user?.id)
      .single();
    
    if (adminError || !admin) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    let query = supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        client_id,
        produit_eligible_id,
        validation_state,
        expert_id,
        created_at,
        updated_at,
        Client:Client!inner(id, email, company_name, phone_number),
        ProduitEligible:ProduitEligible!inner(id, nom, description),
        Expert:Expert!inner(id, name, email, company_name)
      `);

    // Filtres
    if (status && status !== 'all') {
      query = query.eq('validation_state', status);
    }
    
    if (client && client !== 'all') {
      query = query.eq('client_id', client);
    }
    
    if (produit && produit !== 'all') {
      query = query.eq('produit_eligible_id', produit);
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
      console.error('Erreur récupération dossiers:', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération des dossiers' });
    }

    res.json({
      dossiers,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / parseInt(limit as string))
      }
    });

  } catch (error) {
    console.error('Erreur route dossiers:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour récupérer les statistiques des dossiers
router.get('/dossiers/stats', authenticateUser, async (req: Request, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    const { data: admin, error: adminError } = await supabase
      .from('Admin')
      .select('*')
      .eq('id', req.user?.id)
      .single();
    
    if (adminError || !admin) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Statistiques par statut
    const { data: statusStats, error: statusError } = await supabase
      .from('ClientProduitEligible')
      .select('validation_state');

    if (statusError) {
      return res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
    }

    const statusCount: StatusCount = {};
    statusStats?.forEach(item => {
      if (item.validation_state) {
        statusCount[item.validation_state] = (statusCount[item.validation_state] || 0) + 1;
      }
    });

    // Statistiques par produit
    const { data: produitStats, error: produitError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        ProduitEligible:ProduitEligible!inner(nom)
      `);

    if (produitError) {
      return res.status(500).json({ error: 'Erreur lors de la récupération des statistiques produits' });
    }

    const produitCount: ProduitCount = {};
    produitStats?.forEach(item => {
      const nom = (item.ProduitEligible as any)?.[0]?.nom;
      if (nom) {
        produitCount[nom] = (produitCount[nom] || 0) + 1;
      }
    });

    // Dossiers avec experts assignés
    const { data: dossiersWithExperts, error: expertsError } = await supabase
      .from('ClientProduitEligible')
      .select('expert_id')
      .not('expert_id', 'is', null);

    if (expertsError) {
      return res.status(500).json({ error: 'Erreur lors de la récupération des statistiques experts' });
    }

    res.json({
      totalDossiers: statusStats?.length || 0,
      dossiersAvecExpert: dossiersWithExperts?.length || 0,
      dossiersSansExpert: (statusStats?.length || 0) - (dossiersWithExperts?.length || 0),
      repartitionStatut: statusCount,
      repartitionProduit: produitCount
    });

  } catch (error) {
    console.error('Erreur route stats dossiers:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour récupérer les détails d'un dossier
router.get('/dossiers/:id', authenticateUser, async (req: Request, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que l'utilisateur est admin
    const { data: admin, error: adminError } = await supabase
      .from('Admin')
      .select('*')
      .eq('id', req.user?.id)
      .single();
    
    if (adminError || !admin) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const { data: dossier, error } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        Client:Client!inner(*),
        ProduitEligible:ProduitEligible!inner(*),
        Expert:Expert!inner(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erreur récupération dossier:', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération du dossier' });
    }

    if (!dossier) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }

    res.json(dossier);

  } catch (error) {
    console.error('Erreur route dossier details:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour mettre à jour un dossier
router.put('/dossiers/:id', authenticateUser, async (req: Request, res) => {
  try {
    const { id } = req.params;
    const { validation_state, expert_id, commentaire } = req.body;
    
    // Vérifier que l'utilisateur est admin
    const { data: admin, error: adminError } = await supabase
      .from('Admin')
      .select('*')
      .eq('id', req.user?.id)
      .single();
    
    if (adminError || !admin) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const updateData: UpdateData = {
      updated_at: new Date().toISOString()
    };

    if (validation_state) updateData.validation_state = validation_state;
    if (expert_id !== undefined) updateData.expert_id = expert_id;
    if (commentaire) updateData.commentaire = commentaire;

    const { data: dossier, error } = await supabase
      .from('ClientProduitEligible')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erreur mise à jour dossier:', error);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du dossier' });
    }

    res.json(dossier);

  } catch (error) {
    console.error('Erreur route mise à jour dossier:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router; 