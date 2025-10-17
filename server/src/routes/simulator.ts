import express, { Request, Response } from 'express';
import { supabaseClient } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';
import { traiterSimulation } from '../services/simulationProcessor';

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

// Cache pour les questions du questionnaire (durée: 1 heure)
let questionsCache: any = null;
let questionsCacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 heure en millisecondes

/**
 * Récupère les questions du questionnaire avec cache
 */
async function getQuestionsWithCache() {
  const now = Date.now();
  
  // Vérifier si le cache est valide
  if (questionsCache && (now - questionsCacheTimestamp) < CACHE_DURATION) {
    console.log('📋 Questions récupérées depuis le cache');
    return questionsCache;
  }
  
  // Récupérer depuis la base de données
  console.log('📋 Récupération des questions depuis la base de données...');
  const { data, error } = await supabaseClient
    .from('QuestionnaireQuestion')
    .select('*')
    .order('question_order', { ascending: true });
  
  if (error) {
    throw error;
  }
  
  // Mettre à jour le cache
  questionsCache = data;
  questionsCacheTimestamp = now;
  
  console.log(`✅ ${data?.length || 0} questions mises en cache`);
  return data;
}

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
 * Crée une nouvelle session de simulation avec client temporaire
 * MODE ANONYME uniquement - Pour /simulateur (public)
 */
router.post('/session', async (req, res) => {
  try {
    console.log('🔄 Création session simulateur PUBLIC (mode anonyme uniquement)...');
    
    const sessionToken = uuidv4();
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const clientData: ClientData = req.body.client_data || {};

    console.log(`📝 Données de session:`, {
      sessionToken: sessionToken.substring(0, 8) + '...',
      ipAddress,
      userAgent: userAgent.substring(0, 50) + '...',
      hasClientData: Object.keys(clientData).length > 0,
      authenticated: false
    });

    // Préparer les données client avec IP et User-Agent
    const enrichedClientData = {
      ...clientData,
      ip_address: ipAddress,
      user_agent: userAgent
    };

    // Créer la simulation avec client temporaire
    const { data, error } = await supabaseClient.rpc('create_simulation_with_temporary_client', {
      p_session_token: sessionToken,
      p_client_data: enrichedClientData
    });

    if (error) {
      console.error('❌ Erreur lors de la création de session:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la création de session',
        details: error.message
      });
    }

    console.log('✅ Session anonyme créée avec client temporaire:', {
      sessionToken: sessionToken.substring(0, 8) + '...',
      clientId: data.client_id,
      simulationId: data.simulation_id,
      expiresAt: data.expires_at,
      authenticated: false
    });

    return res.json({
      success: true,
      session_token: sessionToken,
      client_id: data.client_id,
      simulation_id: data.simulation_id,
      expires_at: data.expires_at,
      authenticated: false,
      message: 'Session créée avec client temporaire automatique'
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
 * Récupère les questions du questionnaire (AVEC CACHE)
 */
router.get('/questions', async (req, res) => {
  try {
    console.log('📋 Récupération des questions du questionnaire...');

    const data = await getQuestionsWithCache();

    console.log(`✅ ${data?.length || 0} questions récupérées`);

    return res.json({
      success: true,
      questions: data || [],
      count: data?.length || 0,
      cached: questionsCache && (Date.now() - questionsCacheTimestamp) < CACHE_DURATION
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
    console.log(`📝 Réponses à sauvegarder:`, responses);

    // 1. Récupérer la simulation actuelle
    const { data: currentSim, error: getError } = await supabaseClient
      .from('simulations')
      .select('id, answers')
      .eq('session_token', session_token)
      .single();

    if (getError || !currentSim) {
      console.error('❌ Simulation non trouvée:', getError);
      return res.status(404).json({
        success: false,
        error: 'Simulation non trouvée'
      });
    }

    // 2. Fusionner les nouvelles réponses avec les existantes
    const existingAnswers = currentSim.answers || {};
    const updatedAnswers = {
      ...existingAnswers,
      ...responses
    };

    console.log(`📊 Mise à jour: ${Object.keys(existingAnswers).length} réponses existantes + ${Object.keys(responses).length} nouvelles = ${Object.keys(updatedAnswers).length} total`);

    // 3. Sauvegarder dans simulations.answers
    const { error: updateError } = await supabaseClient
      .from('simulations')
      .update({
        answers: updatedAnswers,
        updated_at: new Date().toISOString()
      })
      .eq('session_token', session_token);

    if (updateError) {
      console.error('❌ Erreur sauvegarde:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la sauvegarde des réponses',
        details: updateError.message
      });
    }

    console.log('✅ Réponses sauvegardées avec succès dans simulations.answers');

    return res.json({
      success: true,
      message: 'Réponses sauvegardées avec succès',
      questions_saved: Object.keys(responses).length,
      total_answers: Object.keys(updatedAnswers).length
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
 * NOUVELLE VERSION: Utilise traiterSimulation() au lieu de RPC
 */
router.post('/calculate-eligibility', async (req, res) => {
  try {
    console.log('📥 Requête calculate-eligibility reçue');
    console.log('📥 Body:', req.body);
    
    const { session_token } = req.body;

    if (!session_token) {
      console.error('❌ session_token manquant dans le body');
      return res.status(400).json({
        success: false,
        error: 'session_token est requis',
        received_body: req.body
      });
    }

    console.log(`🎯 Calcul d'éligibilité pour la session: ${session_token.substring(0, 8)}...`);

    // 1. Récupérer la simulation par session_token
    const { data: simulation, error: simError } = await supabaseClient
      .from('simulations')
      .select('id, client_id, answers, status')
      .eq('session_token', session_token)
      .single();

    if (simError || !simulation) {
      console.error('❌ Simulation non trouvée:', simError);
      return res.status(404).json({
        success: false,
        error: 'Simulation non trouvée',
        details: simError?.message
      });
    }

    console.log(`📋 Simulation trouvée: ID=${simulation.id}, Client=${simulation.client_id}`);
    console.log(`📝 Réponses disponibles: ${Object.keys(simulation.answers || {}).length}`);

    // 2. Vérifier qu'il y a des réponses
    if (!simulation.answers || Object.keys(simulation.answers).length === 0) {
      console.warn('⚠️ Aucune réponse dans simulation.answers');
      return res.status(400).json({
        success: false,
        error: 'Aucune réponse trouvée pour cette simulation'
      });
    }

    console.log(`📝 Réponses brutes (UUIDs):`, Object.keys(simulation.answers));

    // 3. IMPORTANT: Convertir les UUIDs des questions en question_id textuels
    // Les réponses sont sauvegardées avec UUID (ex: "d3207985...")
    // Mais les règles utilisent question_id (ex: "GENERAL_001")
    const { data: questions, error: questionsError } = await supabaseClient
      .from('QuestionnaireQuestion')
      .select('id, question_id')
      .in('id', Object.keys(simulation.answers));

    if (questionsError || !questions) {
      console.error('❌ Erreur récupération questions:', questionsError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des questions'
      });
    }

    // Créer un mapping UUID → question_id
    const uuidToQuestionId: Record<string, string> = {};
    questions.forEach(q => {
      uuidToQuestionId[q.id] = q.question_id;
    });

    // Convertir les réponses UUID → question_id
    const convertedAnswers: Record<string, any> = {};
    Object.entries(simulation.answers).forEach(([uuid, value]) => {
      const questionId = uuidToQuestionId[uuid];
      if (questionId) {
        convertedAnswers[questionId] = value;
      }
    });

    console.log(`🔄 Conversion: ${Object.keys(simulation.answers).length} UUIDs → ${Object.keys(convertedAnswers).length} question_id`);
    console.log(`📝 Question IDs convertis:`, Object.keys(convertedAnswers));

    // Sauvegarder aussi les réponses converties pour éviter de refaire la conversion
    await supabaseClient
      .from('simulations')
      .update({
        status: 'completed',
        answers: convertedAnswers,  // Remplacer par les IDs convertis
        updated_at: new Date().toISOString()
      })
      .eq('id', simulation.id);

    // 4. Traiter la simulation avec notre fonction corrigée
    try {
      await traiterSimulation(parseInt(simulation.id));
      console.log(`✅ Simulation ${simulation.id} traitée avec succès`);
    } catch (processError) {
      console.error('❌ Erreur traitement simulation:', processError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors du traitement de la simulation',
        details: processError instanceof Error ? processError.message : 'Erreur inconnue'
      });
    }

    // 5. Récupérer les ClientProduitEligible créés
    let clientProduits: any[] = [];
    if (simulation.client_id) {
      const { data: produits } = await supabaseClient
        .from('ClientProduitEligible')
        .select(`
          id,
          statut,
          tauxFinal,
          montantFinal,
          dureeFinale,
          priorite,
          notes,
          metadata,
          produitId,
          ProduitEligible:produitId (
            id,
            nom,
            categorie,
            description
          )
        `)
        .eq('clientId', simulation.client_id)
        .eq('simulationId', simulation.id)
        .eq('statut', 'eligible')
        .order('priorite', { ascending: true });

      clientProduits = produits || [];
      console.log(`📦 ${clientProduits.length} ClientProduitEligible récupérés`);
    }

    return res.json({
      success: true,
      eligibility_results: clientProduits,
      client_produits: clientProduits,
      message: `${clientProduits.length} produits éligibles identifiés`
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
      .from('simulations')
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
      .from('simulations')
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
      .from('simulations')
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
      .from('simulations')
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
      .from('simulations')
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
 * POST /api/simulator/create-auth-account - Créer un compte d'authentification pour un client migré
 */
router.post('/create-auth-account', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }
    
    console.log(`🔐 Création de compte auth pour: ${email}`);
    
    // Vérifier que le client existe
    const { data: client, error: clientError } = await supabaseClient
      .from('Client')
      .select('id, email, name, company_name')
      .eq('email', email)
      .single();
    
    if (clientError || !client) {
      console.error('❌ Client non trouvé:', clientError);
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }
    
    console.log('✅ Client trouvé:', { id: client.id, email: client.email });
    
    // Créer le compte d'authentification
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        type: 'client',
        name: client.name,
        company_name: client.company_name
      }
    });
    
    if (authError) {
      console.error('❌ Erreur création compte auth:', authError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du compte',
        error: authError.message
      });
    }
    
    if (!authData.user) {
      console.error('❌ Aucun utilisateur créé dans Auth');
      return res.status(500).json({
        success: false,
        message: 'Échec de la création du compte d\'authentification'
      });
    }
    
    console.log('✅ Compte Auth créé:', { auth_user_id: authData.user.id });
    
    // Mettre à jour le client avec l'auth_user_id
    const { error: updateError } = await supabaseClient
      .from('Client')
      .update({ auth_user_id: authData.user.id })
      .eq('id', client.id);
    
    if (updateError) {
      console.error('❌ Erreur mise à jour client:', updateError);
      // Nettoyer le compte Auth en cas d'erreur
      await supabaseClient.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du client',
        error: updateError.message
      });
    }
    
    console.log(`✅ Compte auth créé avec succès pour: ${email}`);
    
    return res.json({
      success: true,
      message: 'Compte d\'authentification créé avec succès',
      data: {
        client_id: client.id,
        auth_user_id: authData.user.id,
        email: email
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur création compte auth:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * POST /api/simulator/link-auth-account - Lier un compte d'authentification existant à un client migré
 */
router.post('/link-auth-account', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email requis'
      });
    }
    
    console.log(`🔗 Liaison du compte auth pour: ${email}`);
    
    // 1. Vérifier que le client existe
    const { data: client, error: clientError } = await supabaseClient
      .from('Client')
      .select('id, email, name, company_name, auth_user_id')
      .eq('email', email)
      .single();
    
    if (clientError || !client) {
      console.error('❌ Client non trouvé:', clientError);
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }
    
    console.log('✅ Client trouvé:', { 
      id: client.id, 
      email: client.email, 
      auth_user_id: client.auth_user_id,
      auth_user_id_type: typeof client.auth_user_id 
    });
    
    // 2. Si le client a déjà un auth_user_id, retourner les informations
    if (client.auth_user_id) {
      return res.json({
        success: true,
        message: 'Client déjà lié à un compte d\'authentification',
        data: {
          client_id: client.id,
          auth_user_id: client.auth_user_id,
          email: email
        }
      });
    }
    
    // 3. Récupérer l'utilisateur Auth existant
    console.log('🔍 Récupération des utilisateurs Auth...');
    const { data: authUsers, error: authError } = await supabaseClient.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erreur récupération utilisateurs Auth:', authError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des utilisateurs',
        error: authError.message
      });
    }
    
    console.log(`📊 ${authUsers.users.length} utilisateurs Auth trouvés`);
    
    // 4. Trouver l'utilisateur par email
    const authUser = authUsers.users.find(user => user.email === email);
    
    if (!authUser) {
      console.error('❌ Utilisateur Auth non trouvé pour:', email);
      console.log('📧 Emails disponibles:', authUsers.users.map(u => u.email));
      return res.status(404).json({
        success: false,
        message: 'Compte d\'authentification non trouvé'
      });
    }
    
    console.log('✅ Utilisateur Auth trouvé:', { 
      auth_user_id: authUser.id, 
      email: authUser.email,
      auth_user_id_type: typeof authUser.id 
    });
    
    // 5. Mettre à jour le client avec l'auth_user_id
    console.log('🔄 Mise à jour du client avec auth_user_id:', authUser.id);
    const { error: updateError } = await supabaseClient
      .from('Client')
      .update({ auth_user_id: authUser.id })
      .eq('id', client.id);
    
    if (updateError) {
      console.error('❌ Erreur mise à jour client:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du client',
        error: updateError.message
      });
    }
    
    console.log(`✅ Client lié avec succès au compte auth: ${email}`);
    
    return res.json({
      success: true,
      message: 'Client lié avec succès au compte d\'authentification',
      data: {
        client_id: client.id,
        auth_user_id: authUser.id,
        email: email
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur liaison compte auth:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
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
      .from('simulations')
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
      version: '2.0.0',
      cache: {
        questions: questionsCache ? 'active' : 'inactive',
        lastUpdate: questionsCacheTimestamp ? new Date(questionsCacheTimestamp).toISOString() : null
      }
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

/**
 * GET /api/simulator/performance
 * Endpoint de monitoring des performances
 */
router.get('/performance', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test de performance de la base de données
    const dbStartTime = Date.now();
    const { data, error } = await supabaseClient
      .from('simulations')
      .select('count')
      .limit(1);
    const dbResponseTime = Date.now() - dbStartTime;

    if (error) {
      return res.status(503).json({
        success: false,
        status: 'database_error',
        error: 'Erreur de connexion à la base de données',
        details: error.message
      });
    }

    const totalResponseTime = Date.now() - startTime;

    return res.json({
      success: true,
      status: 'operational',
      timestamp: new Date().toISOString(),
      performance: {
        totalResponseTime: `${totalResponseTime}ms`,
        databaseResponseTime: `${dbResponseTime}ms`,
        cacheStatus: questionsCache ? 'active' : 'inactive',
        cacheAge: questionsCacheTimestamp ? `${Math.floor((Date.now() - questionsCacheTimestamp) / 1000)}s` : 'N/A'
      },
      recommendations: [
        dbResponseTime > 500 ? 'Considérer l\'optimisation des requêtes de base de données' : null,
        !questionsCache ? 'Activer le cache pour améliorer les performances' : null
      ].filter(Boolean)
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      status: 'error',
      error: 'Erreur lors du test de performance',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * POST /api/simulator/migrate-temporary-client
 * Migre un client temporaire vers un client permanent
 */
router.post('/migrate-temporary-client', async (req, res) => {
  try {
    const { 
      temp_client_id, 
      real_email, 
      real_password, 
      real_data 
    } = req.body;

    if (!temp_client_id || !real_email || !real_password) {
      return res.status(400).json({
        success: false,
        error: 'temp_client_id, real_email et real_password sont requis'
      });
    }

    console.log(`🔄 Migration du client temporaire ${temp_client_id} vers ${real_email}...`);

    // Utiliser la fonction de migration
    const { data, error } = await supabaseClient.rpc('migrate_temporary_client', {
      p_temp_client_id: temp_client_id,
      p_real_email: real_email,
      p_real_password: real_password,
      p_real_data: real_data || {}
    });

    if (error) {
      console.error('❌ Erreur lors de la migration:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la migration du client',
        details: error.message
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Client temporaire non trouvé ou déjà migré'
      });
    }

    console.log('✅ Client temporaire migré avec succès:', {
      temp_client_id,
      real_email
    });

    return res.json({
      success: true,
      message: 'Client temporaire migré avec succès',
      client_id: temp_client_id,
      email: real_email
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
 * GET /api/simulator/temporary-client/:client_id
 * Récupère les informations d'un client temporaire
 */
router.get('/temporary-client/:client_id', async (req, res) => {
  try {
    const { client_id } = req.params;

    console.log(`📋 Récupération des infos du client temporaire ${client_id}...`);

    const { data, error } = await supabaseClient
      .from('Client')
      .select('id, email, name, company_name, type, expires_at, metadata')
      .eq('id', client_id)
      .eq('type', 'temporaire')
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: 'Client temporaire non trouvé'
      });
    }

    console.log('✅ Informations client temporaire récupérées');

    return res.json({
      success: true,
      client: data
    });
  } catch (error) {
    console.error('❌ Erreur inattendue lors de la récupération:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur inattendue lors de la récupération',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

export default router; 