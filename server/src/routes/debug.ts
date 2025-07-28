import { Router } from 'express';
import { supabaseClient, supabaseAdmin } from '../config/supabase';

const router = Router();

// Route pour vérifier l'existence d'un client par email
router.post('/client-by-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email requis'
      });
    }

    console.log('🔍 Recherche client par email:', email);

    const { data: client, error } = await supabaseAdmin
      .from('Client')
      .select('id, email, username, created_at')
      .eq('email', email)
      .single();

    if (error) {
      console.error('❌ Erreur recherche client:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la recherche du client',
        details: error.message
      });
    }

    if (!client) {
      console.log('❌ Client non trouvé:', email);
      return res.status(404).json({
        success: false,
        error: 'Client non trouvé',
        email: email
      });
    }

    console.log('✅ Client trouvé:', client);
    return res.json({
      success: true,
      data: client
    });

  } catch (error) {
    console.error('❌ Erreur générale:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Route pour lister tous les clients (pour debug)
router.get('/all-clients', async (req, res) => {
  try {
    console.log('🔍 Récupération de tous les clients...');

    const { data: clients, error } = await supabaseAdmin
      .from('Client')
      .select('id, email, username, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('❌ Erreur récupération clients:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des clients',
        details: error.message
      });
    }

    console.log('✅ Clients récupérés:', clients?.length || 0);
    return res.json({
      success: true,
      data: clients || []
    });

  } catch (error) {
    console.error('❌ Erreur générale:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Route pour vérifier la structure de la table Client
router.get('/client-table-structure', async (req, res) => {
  try {
    console.log('🔍 Vérification structure table Client...');

    const { data, error } = await supabaseClient
      .rpc('get_table_structure', { table_name: 'Client' });

    if (error) {
      console.error('❌ Erreur récupération structure:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération de la structure',
        details: error.message
      });
    }

    return res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('❌ Erreur générale:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router; 