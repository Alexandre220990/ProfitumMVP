import express, { Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = express.Router();

// Type pour les requêtes authentifiées
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    type: 'client' | 'expert' | 'admin' | 'apporteur_affaires';
    email: string;
    permissions: string[];
    auth_id: string;
    database_id: string;
    user_metadata: {
      username: string;
      type: 'client' | 'expert' | 'admin' | 'apporteur_affaires';
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
    
    if (!user || user.type !== 'apporteur_affaires') {
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

    // Récupérer les prospects de l'apporteur
    const { data: prospects, error: prospectsError } = await supabase
      .from('ApporteurProspects')
      .select(`
        *,
        Client (
          id,
          name,
          email,
          company_name,
          phone_number
        )
      `)
      .eq('apporteur_id', user.database_id)
      .order('created_at', { ascending: false });

    if (prospectsError) {
      console.error('❌ Erreur récupération prospects:', prospectsError);
    }

    // Récupérer les commissions
    const { data: commissions, error: commissionsError } = await supabase
      .from('ApporteurCommissions')
      .select('*')
      .eq('apporteur_id', user.database_id)
      .order('created_at', { ascending: false });

    if (commissionsError) {
      console.error('❌ Erreur récupération commissions:', commissionsError);
    }

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
    
    if (!user || user.type !== 'apporteur_affaires') {
      res.status(403).json({
        success: false,
        message: 'Accès réservé aux apporteurs d\'affaires'
      });
      return;
    }

    const { data: prospects, error } = await supabase
      .from('ApporteurProspects')
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
        )
      `)
      .eq('apporteur_id', user.database_id)
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
    
    if (!user || user.type !== 'apporteur_affaires') {
      res.status(403).json({
        success: false,
        message: 'Accès réservé aux apporteurs d\'affaires'
      });
      return;
    }

    const { data: commissions, error } = await supabase
      .from('ApporteurCommissions')
      .select(`
        *,
        Client (
          id,
          name,
          company_name
        ),
        Dossier (
          id,
          reference
        )
      `)
      .eq('apporteur_id', user.database_id)
      .order('created_at', { ascending: false });

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
  console.log('🚀 ROUTE /clients APPELÉE');
  try {
    const user = req.user as any;
    
    console.log('🔍 Route /clients - User object:', user ? 'PRÉSENT' : 'MANQUANT');
    if (user) {
      console.log('🔍 User type:', user.type);
      console.log('🔍 User complet:', JSON.stringify(user, null, 2));
    }
    
    if (!user || user.type !== 'apporteur_affaires') {
      console.log('❌ Route /clients - Accès refusé:', { hasUser: !!user, userType: user?.type });
      res.status(403).json({
        success: false,
        message: 'Accès réservé aux apporteurs d\'affaires'
      });
      return;
    }

    // Récupérer les clients liés à cet apporteur via les prospects
    const { data: prospects, error } = await supabase
      .from('ApporteurProspects')
      .select(`
        *,
        Client (
          id,
          name,
          email,
          company_name,
          phone_number,
          city,
          siren,
          status,
          created_at
        )
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

    // Transformer les données pour retourner les clients
    const clients = prospects?.map(prospect => ({
      ...prospect.Client,
      prospect_id: prospect.id,
      prospect_status: prospect.status,
      prospect_created_at: prospect.created_at,
      notes: prospect.notes
    })) || [];

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
    
    if (!user || user.type !== 'apporteur_affaires') {
      res.status(403).json({
        success: false,
        message: 'Accès réservé aux apporteurs d\'affaires'
      });
      return;
    }

    // Vérifier que le client appartient à cet apporteur
    const { data: prospect, error: prospectError } = await supabase
      .from('ApporteurProspects')
      .select(`
        *,
        Client (
          *
        )
      `)
      .eq('apporteur_id', user.database_id)
      .eq('client_id', clientId)
      .single();

    if (prospectError || !prospect) {
      res.status(404).json({
        success: false,
        message: 'Client non trouvé ou accès non autorisé'
      });
      return;
    }

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
    
    if (!user || user.type !== 'apporteur_affaires') {
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
          source: 'apporteur_affaires'
        })
        .select('id')
        .single();

      if (clientCreateError) {
        console.error('❌ Erreur création client:', clientCreateError);
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la création du client'
        });
        return;
      }

      client = newClient;
    }

    // Créer le prospect
    const { data: prospect, error: prospectError } = await supabase
      .from('ApporteurProspects')
      .insert({
        apporteur_id: user.database_id,
        client_id: client.id,
        status: 'new',
        notes: notes || '',
        source: 'direct'
      })
      .select(`
        *,
        Client (
          id,
          name,
          email,
          company_name,
          phone_number
        )
      `)
      .single();

    if (prospectError) {
      console.error('❌ Erreur création prospect:', prospectError);
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la création du prospect'
        });
        return;
    }

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

export default router;
