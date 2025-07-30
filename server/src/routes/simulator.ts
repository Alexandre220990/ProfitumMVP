import express from 'express';
import { supabaseClient } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// =====================================================
// TYPES ET INTERFACES
// =====================================================

interface SessionData {
  session_token: string;
  ip_address: string;
  user_agent: string;
}

interface ClientData {
  email?: string;
  nom?: string;
  prenom?: string;
  societe?: string;
  telephone?: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  pays?: string;
  siret?: string;
  secteur_activite?: string;
  chiffre_affaires?: number;
  nombre_employes?: number;
}

interface EligibilityResult {
  produit_id: string;
  eligibility_score: number;
  estimated_savings: number;
  confidence_level: string;
  recommendations: string[];
}

interface SimulatorResponse {
  session_token: string;
  responses: Record<string, any>;
}

interface SimulatorResults {
  session_data: any;
  eligibility_results: any[];
  expires_at: string;
  is_expired: boolean;
}

// =====================================================
// FONCTIONS UTILITAIRES
// =====================================================

/**
 * Envoie une notification pour les fortes éligibilités
 */
async function sendHighEligibilityNotification(sessionData: SessionData, results: EligibilityResult[]) {
  try {
    const highEligibilityResults = results.filter(r => r.eligibility_score >= 70);
    
    if (highEligibilityResults.length > 0) {
      const totalSavings = highEligibilityResults.reduce((sum: number, r: EligibilityResult) => sum + r.estimated_savings, 0);
      
      console.log('🚨 Forte éligibilité détectée !');
      console.log(`Session ID: ${sessionData.session_token}`);
      console.log(`IP: ${sessionData.ip_address}`);
      console.log(`Total des économies potentielles: ${totalSavings.toLocaleString('fr-FR')}€`);
      console.log('Produits très éligibles:');
      highEligibilityResults.forEach(r => {
        console.log(`  - ${r.produit_id}: ${r.eligibility_score}% éligible - ${r.estimated_savings}€`);
      });
    }
  } catch (error) {
    console.error('Erreur lors de la notification:', error);
  }
}

/**
 * Nettoie les sessions expirées automatiquement
 */
async function cleanupExpiredSessions() {
  try {
    const { data, error } = await supabaseClient.rpc('cleanup_expired_simulator_sessions');
    
    if (error) {
      console.error('Erreur lors du nettoyage des sessions:', error);
    } else {
      console.log(`🧹 ${data} sessions expirées nettoyées`);
    }
  } catch (error) {
    console.error('Erreur lors du nettoyage des sessions:', error);
  }
}

// Nettoyage automatique toutes les heures
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

// =====================================================
// ROUTES DU SIMULATEUR
// =====================================================

/**
 * POST /api/simulator/session
 * Crée une nouvelle session de simulation avec données client
 */
router.post('/session', async (req, res) => {
  try {
    console.log('🔄 Création d\'une nouvelle session simulateur...');
    
    const sessionToken = uuidv4();
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const clientData: ClientData = req.body.client_data || {};

    console.log(`📝 Données de session:`, {
      sessionToken: sessionToken.substring(0, 8) + '...',
      ipAddress,
      userAgent: userAgent.substring(0, 50) + '...',
      hasClientData: Object.keys(clientData).length > 0
    });

    // Préparer les données client avec IP et User-Agent
    const enrichedClientData = {
      ...clientData,
      ip_address: ipAddress,
      user_agent: userAgent
    };

    // Utiliser la nouvelle fonction pour créer la session
    const { data, error } = await supabaseClient.rpc('create_simulator_session_with_client_data', {
      p_session_token: sessionToken,
      p_client_data: enrichedClientData,
      p_expires_in_hours: 24
    });

    if (error) {
      console.error('❌ Erreur lors de la création de session:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la création de session',
        details: error.message
      });
    }

    console.log('✅ Session créée avec succès:', {
      sessionToken: sessionToken.substring(0, 8) + '...',
      expiresAt: data.expires_at
    });

    return res.json({
      success: true,
      session_token: sessionToken,
      session_id: data.session_id,
      expires_at: data.expires_at
    });
  } catch (error) {
    console.error('❌ Erreur inattendue lors de la création de session:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur inattendue lors de la création de session',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * GET /api/simulator/questions
 * Récupère les questions du questionnaire
 */
router.get('/questions', async (req, res) => {
  try {
    console.log('📋 Récupération des questions du questionnaire...');

    const { data, error } = await supabaseClient
      .from('QuestionnaireQuestion')
      .select('*')
      .order('question_order', { ascending: true });

    if (error) {
      console.error('❌ Erreur lors de la récupération des questions:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des questions',
        details: error.message
      });
    }

    console.log(`✅ ${data?.length || 0} questions récupérées`);

    return res.json({
      success: true,
      questions: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('❌ Erreur inattendue lors de la récupération des questions:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur inattendue lors de la récupération des questions',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * POST /api/simulator/response
 * Sauvegarde les réponses d'une session
 */
router.post('/response', async (req, res) => {
  try {
    const { session_token, responses } = req.body as SimulatorResponse;

    if (!session_token || !responses) {
      return res.status(400).json({
        success: false,
        error: 'session_token et responses sont requis'
      });
    }

    console.log(`💾 Sauvegarde des réponses pour la session: ${session_token.substring(0, 8)}...`);

    // Utiliser la nouvelle fonction pour sauvegarder les réponses
    const { data, error } = await supabaseClient.rpc('save_simulator_responses', {
      p_session_token: session_token,
      p_responses: responses
    });

    if (error) {
      console.error('❌ Erreur lors de la sauvegarde des réponses:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la sauvegarde des réponses',
        details: error.message
      });
    }

    console.log('✅ Réponses sauvegardées avec succès');

    return res.json({
      success: true,
      message: 'Réponses sauvegardées avec succès',
      questions_saved: data.questions_saved
    });
  } catch (error) {
    console.error('❌ Erreur inattendue lors de la sauvegarde des réponses:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur inattendue lors de la sauvegarde des réponses',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * POST /api/simulator/calculate-eligibility
 * Calcule l'éligibilité pour une session
 */
router.post('/calculate-eligibility', async (req, res) => {
  try {
    const { session_token } = req.body;

    if (!session_token) {
      return res.status(400).json({
        success: false,
        error: 'session_token est requis'
      });
    }

    console.log(`🎯 Calcul d'éligibilité pour la session: ${session_token.substring(0, 8)}...`);

    // Utiliser la nouvelle fonction pour calculer l'éligibilité
    const { data, error } = await supabaseClient.rpc('calculate_simulator_eligibility', {
      p_session_token: session_token
    });

    if (error) {
      console.error('❌ Erreur lors du calcul d\'éligibilité:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors du calcul d\'éligibilité',
        details: error.message
      });
    }

    console.log('✅ Éligibilité calculée avec succès');

    return res.json({
      success: true,
      eligibility_results: data.eligibility_results,
      message: 'Éligibilité calculée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur inattendue lors du calcul d\'éligibilité:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur inattendue lors du calcul d\'éligibilité',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * GET /api/simulator/results/:session_token
 * Récupère les résultats d'une session
 */
router.get('/results/:session_token', async (req, res) => {
  try {
    const { session_token } = req.params;

    console.log(`📊 Récupération des résultats pour la session: ${session_token.substring(0, 8)}...`);

    // Utiliser la nouvelle fonction pour récupérer les résultats
    const { data, error } = await supabaseClient.rpc('get_simulation_results', {
      p_session_token: session_token
    });

    if (error) {
      console.error('❌ Erreur lors de la récupération des résultats:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des résultats',
        details: error.message
      });
    }

    console.log('✅ Résultats récupérés avec succès');

    return res.json({
      success: true,
      ...data
    });
  } catch (error) {
    console.error('❌ Erreur inattendue lors de la récupération des résultats:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur inattendue lors de la récupération des résultats',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * POST /api/simulator/migrate/:session_token
 * Migre une session vers un client identifié
 */
router.post('/migrate/:session_token', async (req, res) => {
  try {
    const { session_token } = req.params;
    const clientInscriptionData = req.body;

    console.log(`🔄 Migration de la session vers client: ${session_token.substring(0, 8)}...`);

    // Utiliser la nouvelle fonction de migration
    const { data, error } = await supabaseClient.rpc('migrate_simulator_to_client', {
      p_session_token: session_token,
      p_client_inscription_data: clientInscriptionData
    });

    if (error) {
      console.error('❌ Erreur lors de la migration:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la migration',
        details: error.message
      });
    }

    console.log('✅ Migration réussie');

    return res.json({
      success: true,
      ...data
    });
  } catch (error) {
    console.error('❌ Erreur inattendue lors de la migration:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur inattendue lors de la migration',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * POST /api/simulator/track
 * Enregistre un événement de tracking pour analytics
 */
router.post('/track', async (req, res) => {
  try {
    const { session_token, event_type, event_data } = req.body;

    if (!session_token || !event_type) {
      return res.status(400).json({
        success: false,
        error: 'session_token et event_type sont requis'
      });
    }

    console.log(`📈 Tracking événement: ${event_type} pour la session: ${session_token.substring(0, 8)}...`);

    // Récupérer les métadonnées actuelles
    const { data: sessionData, error: fetchError } = await supabaseClient
      .from('SimulatorSession')
      .select('metadata')
      .eq('session_token', session_token)
      .single();

    if (fetchError) {
      console.error('❌ Erreur lors de la récupération de la session:', fetchError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération de la session',
        details: fetchError.message
      });
    }

    // Fusionner les métadonnées
    const currentMetadata = sessionData.metadata || {};
    const newEvent = {
      type: event_type,
      data: event_data,
      timestamp: new Date().toISOString()
    };

    const updatedMetadata = {
      ...currentMetadata,
      events: [...(currentMetadata.events || []), newEvent]
    };

    // Mettre à jour les métadonnées
    const { error } = await supabaseClient
      .from('SimulatorSession')
      .update({
        metadata: updatedMetadata
      })
      .eq('session_token', session_token);

    if (error) {
      console.error('❌ Erreur lors du tracking:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors du tracking',
        details: error.message
      });
    }

    console.log('✅ Événement tracké avec succès');

    return res.json({
      success: true,
      message: 'Événement tracké avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur inattendue lors du tracking:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur inattendue lors du tracking',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * GET /api/simulator/sessions
 * Récupère la liste des sessions (pour admin)
 */
router.get('/sessions', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;

    console.log('📋 Récupération des sessions...');

    let query = supabaseClient
      .from('SimulatorSession')
      .select('*')
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Erreur lors de la récupération des sessions:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des sessions',
        details: error.message
      });
    }

    console.log(`✅ ${data?.length || 0} sessions récupérées`);

    return res.json({
      success: true,
      sessions: data || [],
      count: data?.length || 0,
      pagination: {
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error) {
    console.error('❌ Erreur inattendue lors de la récupération des sessions:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur inattendue lors de la récupération des sessions',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * POST /api/simulator/abandon
 * Marque une session comme abandonnée
 */
router.post('/abandon', async (req, res) => {
  try {
    const { session_token, reason } = req.body;

    if (!session_token) {
      return res.status(400).json({
        success: false,
        error: 'session_token est requis'
      });
    }

    console.log(`❌ Abandon de la session: ${session_token.substring(0, 8)}...`);

    // Récupérer les métadonnées actuelles
    const { data: sessionData, error: fetchError } = await supabaseClient
      .from('SimulatorSession')
      .select('metadata')
      .eq('session_token', session_token)
      .single();

    if (fetchError) {
      console.error('❌ Erreur lors de la récupération de la session:', fetchError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération de la session',
        details: fetchError.message
      });
    }

    // Fusionner les métadonnées
    const currentMetadata = sessionData.metadata || {};
    const updatedMetadata = {
      ...currentMetadata,
      abandon_reason: reason,
      abandoned_at: new Date().toISOString()
    };

    const { error } = await supabaseClient
      .from('SimulatorSession')
      .update({
        status: 'abandoned',
        updated_at: new Date().toISOString(),
        metadata: updatedMetadata
      })
      .eq('session_token', session_token);

    if (error) {
      console.error('❌ Erreur lors de l\'abandon:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'abandon',
        details: error.message
      });
    }

    console.log('✅ Session marquée comme abandonnée');

    return res.json({
      success: true,
      message: 'Session abandonnée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur inattendue lors de l\'abandon:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur inattendue lors de l\'abandon',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * GET /api/simulator/health
 * Endpoint de santé du simulateur
 */
router.get('/health', async (req, res) => {
  try {
    // Vérifier la connexion à la base de données
    const { data, error } = await supabaseClient
      .from('SimulatorSession')
      .select('count')
      .limit(1);

    if (error) {
      return res.status(503).json({
        success: false,
        status: 'unhealthy',
        error: 'Erreur de connexion à la base de données',
        details: error.message
      });
    }

    return res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '2.0.0'
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Erreur inattendue',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

export default router; 