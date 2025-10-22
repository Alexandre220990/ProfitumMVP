import express, { Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = express.Router();

// Type pour les requêtes authentifiées
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    type: 'client' | 'expert' | 'admin' | 'apporteur';
    email: string;
    permissions: string[];
    auth_user_id: string;
    database_id: string;
    user_metadata: {
      username: string;
      type: 'client' | 'expert' | 'admin' | 'apporteur';
      company_name?: string;
      siren?: string;
      phone_number?: string;
      address?: string;
      city?: string;
      postal_code?: string;
    };
    app_metadata: any;
    aud: string;
    created_at: string;
  };
}

// ============================================================================
// ROUTES API APPORTEURS D'AFFAIRES
// ============================================================================

// GET /api/apporteur/dashboard - Données du dashboard apporteur
router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    
    if (!user || user.type !== 'apporteur') {
      res.status(403).json({
        success: false,
        message: 'Accès réservé aux apporteurs d\'affaires'
      });
      return;
    }

    console.log('🔍 Récupération des données dashboard apporteur:', {
      apporteurId: user.database_id,
      email: user.email
    });

    // Récupérer les statistiques de l'apporteur
    const { data: apporteur, error: apporteurError } = await supabase
      .from('ApporteurAffaires')
      .select('*')
      .eq('id', user.database_id)
      .single();

    if (apporteurError) {
      console.error('❌ Erreur récupération apporteur:', apporteurError);
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la récupération des données apporteur'
        });
        return;
    }

    // Récupérer les prospects de l'apporteur (clients avec status 'prospect')
    const { data: prospects, error: prospectsError } = await supabase
      .from('Client')
      .select(`
        id,
        name,
        email,
        company_name,
        phone_number,
        status,
        created_at
      `)
      .eq('apporteur_id', user.database_id)
      .eq('status', 'prospect')
      .order('created_at', { ascending: false });

    if (prospectsError) {
      console.error('❌ Erreur récupération prospects:', prospectsError);
    }

    // Récupérer les commissions (pour l'instant, retourner une liste vide)
    const commissions: any[] = [];
    console.log('ℹ️ Commissions: fonctionnalité à implémenter');

    // Calculer les statistiques
    const stats = {
      total_prospects: prospects?.length || 0,
      prospects_this_month: prospects?.filter(p => {
        const created = new Date(p.created_at);
        const now = new Date();
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      }).length || 0,
      total_commissions: commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0,
      commissions_this_month: commissions?.filter(c => {
        const created = new Date(c.created_at);
        const now = new Date();
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      }).reduce((sum, c) => sum + (c.amount || 0), 0) || 0,
      commission_rate: apporteur.commission_rate || 5.0
    };

    console.log('✅ Données dashboard apporteur récupérées:', stats);

    res.json({
      success: true,
      data: {
        apporteur,
        prospects: prospects || [],
        commissions: commissions || [],
        stats
      }
    });

  } catch (error) {
    console.error('❌ Erreur route dashboard apporteur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/apporteur/prospects - Liste des prospects
router.get('/prospects', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    
    if (!user || user.type !== 'apporteur') {
      res.status(403).json({
        success: false,
        message: 'Accès réservé aux apporteurs d\'affaires'
      });
      return;
    }

    const { data: prospects, error } = await supabase
      .from('Client')
      .select(`
        id,
        name,
        email,
        company_name,
        phone_number,
        city,
        siren,
        status,
        apporteur_id,
        qualification_score,
        interest_level,
        budget_range,
        timeline,
        source,
        notes,
        created_at
      `)
      .eq('apporteur_id', user.database_id)
      .eq('status', 'prospect')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération prospects:', error);
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la récupération des prospects'
        });
        return;
    }

    res.json({
      success: true,
      data: prospects || []
    });

  } catch (error) {
    console.error('❌ Erreur route prospects:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/apporteur/commissions - Liste des commissions
router.get('/commissions', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    
    if (!user || user.type !== 'apporteur') {
      res.status(403).json({
        success: false,
        message: 'Accès réservé aux apporteurs d\'affaires'
      });
      return;
    }

    // Commissions: fonctionnalité à implémenter
    const commissions: any[] = [];
    const error = null;

    if (error) {
      console.error('❌ Erreur récupération commissions:', error);
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la récupération des commissions'
        });
        return;
    }

    res.json({
      success: true,
      data: commissions || []
    });

  } catch (error) {
    console.error('❌ Erreur route commissions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/apporteur/clients - Liste des clients
router.get('/clients', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    console.log('📋 Récupération des clients pour apporteur:', user.email);

    // Récupérer les clients liés à cet apporteur directement depuis la table Client
    const { data: clients, error } = await supabase
      .from('Client')
      .select(`
        id,
        name,
        email,
        company_name,
        phone_number,
        city,
        siren,
        status,
        apporteur_id,
        qualification_score,
        interest_level,
        budget_range,
        timeline,
        source,
        address,
        website,
        decision_maker_position,
        notes,
        expert_contacted_at,
        converted_at,
        created_at
      `)
      .eq('apporteur_id', user.database_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération clients:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des clients'
      });
      return;
    }

    res.json({
      success: true,
      data: clients
    });

  } catch (error) {
    console.error('❌ Erreur route clients:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/apporteur/clients/:clientId - Détails d'un client
router.get('/clients/:clientId', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    const { clientId } = req.params;
    
    if (!user || user.type !== 'apporteur') {
      res.status(403).json({
        success: false,
        message: 'Accès réservé aux apporteurs d\'affaires'
      });
      return;
    }

    // Vérifier que le client appartient à cet apporteur
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select('*')
      .eq('id', clientId)
      .eq('apporteur_id', user.database_id)
      .single();

    if (clientError || !client) {
      res.status(404).json({
        success: false,
        message: 'Client non trouvé ou accès non autorisé'
      });
      return;
    }

    const prospect = {
      id: client.id,
      client_id: client.id,
      apporteur_id: user.database_id,
      status: client.status,
      notes: client.notes || '',
      Client: client
    };

    res.json({
      success: true,
      data: {
        ...prospect.Client,
        prospect_id: prospect.id,
        prospect_status: prospect.status,
        notes: prospect.notes
      }
    });

  } catch (error) {
    console.error('❌ Erreur route client details:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/apporteur/prospects - Créer un prospect
router.post('/prospects', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    
    if (!user || user.type !== 'apporteur') {
      res.status(403).json({
        success: false,
        message: 'Accès réservé aux apporteurs d\'affaires'
      });
      return;
    }

    const { client_data, notes } = req.body;

    if (!client_data || !client_data.name || !client_data.email) {
      res.status(400).json({
        success: false,
        message: 'Données client manquantes (nom et email requis)'
      });
      return;
    }

    // Créer ou récupérer le client
    let client;
    const { data: existingClient, error: clientSearchError } = await supabase
      .from('Client')
      .select('id')
      .eq('email', client_data.email)
      .single();

    if (existingClient) {
      client = existingClient;
    } else {
      // Créer un nouveau client
      const { data: newClient, error: clientCreateError } = await supabase
        .from('Client')
        .insert({
          name: client_data.name,
          email: client_data.email,
          company_name: client_data.company_name,
          phone_number: client_data.phone_number,
          city: client_data.city,
          siren: client_data.siren,
          source: 'apporteur'
        })
        .select('*')
        .single();

      if (clientCreateError) {
        console.error('❌ Erreur création client:', clientCreateError);
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la création du client'
        });
        return;
      }

      client = newClient as any;
    }

    // Le prospect est maintenant le client créé
    const prospect = {
      id: client.id,
      apporteur_id: user.database_id,
      client_id: client.id,
      status: client.status || 'prospect',
      notes: notes || '',
      source: 'direct',
      Client: {
        id: client.id,
        name: client.name || '',
        email: client.email || '',
        company_name: client.company_name || '',
        phone_number: client.phone_number || ''
      }
    };

    console.log('✅ Prospect créé:', prospect.id);

    res.status(201).json({
      success: true,
      message: 'Prospect créé avec succès',
      data: prospect
    });

  } catch (error) {
    console.error('❌ Erreur création prospect:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ✅ NOUVEAU: POST /api/apporteur/prospects/:clientId/assign-experts
// Assigner les experts sélectionnés manuellement par l'apporteur aux CPE
router.post('/prospects/:clientId/assign-experts', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    const { clientId } = req.params;
    const { expert_assignments } = req.body;
    
    if (!user || user.type !== 'apporteur') {
      res.status(403).json({
        success: false,
        message: 'Accès réservé aux apporteurs d\'affaires'
      });
      return;
    }
    
    if (!Array.isArray(expert_assignments)) {
      res.status(400).json({
        success: false,
        message: 'expert_assignments doit être un tableau'
      });
      return;
    }
    
    // Vérifier que le client appartient à l'apporteur
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select('id, apporteur_id')
      .eq('id', clientId)
      .single();
    
    if (clientError || !client || client.apporteur_id !== user.database_id) {
      res.status(404).json({
        success: false,
        message: 'Client non trouvé ou non autorisé'
      });
      return;
    }
    
    console.log(`✅ Assignation de ${expert_assignments.length} experts pour client ${clientId}`);
    
    // Mettre à jour chaque ClientProduitEligible avec son expert
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    for (const assignment of expert_assignments) {
      const { product_id, expert_id } = assignment;
      
      // Trouver le ClientProduitEligible correspondant
      const { data: cpe, error: cpeError } = await supabase
        .from('ClientProduitEligible')
        .select('id')
        .eq('clientId', clientId)
        .eq('id', product_id) // product_id est en fait le CPE id
        .single();
      
      if (cpeError || !cpe) {
        results.failed++;
        results.errors.push(`Produit ${product_id} non trouvé`);
        continue;
      }
      
      // Mettre à jour l'expert_id
      const { error: updateError } = await supabase
        .from('ClientProduitEligible')
        .update({
          expert_id: expert_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', cpe.id);
      
      if (updateError) {
        results.failed++;
        results.errors.push(`Erreur mise à jour ${product_id}: ${updateError.message}`);
        console.error(`❌ Erreur assignation expert pour CPE ${cpe.id}:`, updateError);
      } else {
        results.success++;
        console.log(`✅ Expert ${expert_id || 'aucun'} assigné au CPE ${cpe.id}`);
      }
    }
    
    res.json({
      success: true,
      message: `${results.success} expert(s) assigné(s) avec succès`,
      data: results
    });
    
  } catch (error) {
    console.error('❌ Erreur assignation experts:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur serveur'
    });
  }
});

export default router;
