import { Router } from 'express';
import { supabaseClient, supabaseAdmin } from '../config/supabase';
import * as crypto from 'crypto';

const router = Router();
const supabase = supabaseClient;

// Mapping des produits du simulateur vers les UUID de ProduitEligible
const PRODUCT_MAPPING: { [key: string]: string } = {
  'TICPE': '32dd9cf8-15e2-4375-86ab-a95158d3ada1',
  'URSSAF': 'd1e8f740-7c2a-4b5e-9a91-0e15c0e7d3a2',
  'DFS': 'e2f9a830-8d3b-4c7c-b590-1d7631c0d4b5',
  'FONCIER': 'c5d2e980-4f63-44c0-b8a9-9d6e8e21c0f7',
  'CIR': '37da1c4e-3fcc-49f8-9acb-9b75e231edfd', // Recouvrement
  'CEE': 'b7f3c891-28d9-4982-b0eb-821c9e7cbcf0',
  'AUDIT_ENERGETIQUE': 'bc2b94ec-659b-4cf5-a693-d61178b03caf' // Optimisation Énergie
};

// Route pour récupérer les données d'une session
router.get('/session-data/:sessionToken', async (req, res) => {
  try {
    const { sessionToken } = req.params;

    // Récupérer la session
    const { data: session, error: sessionError } = await supabase
      .from('TemporarySession')
      .select('*')
      .eq('session_token', sessionToken)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({
        success: false,
        error: 'Session non trouvée'
      });
    }

    // Récupérer les réponses avec le bon session_id
    const { data: responses, error: responsesError } = await supabase
      .from('TemporaryResponse')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });

    if (responsesError) {
      console.error('Erreur récupération réponses:', responsesError);
    }

    // Récupérer les résultats d'éligibilité avec le bon session_id
    const { data: eligibilityResults, error: eligibilityError } = await supabase
      .from('TemporaryEligibility')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });

    if (eligibilityError) {
      console.error('Erreur récupération éligibilité:', eligibilityError);
    }

    return res.json({
      success: true,
      data: {
        session,
        responses: responses || [],
        eligibilityResults: eligibilityResults || []
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des données de session:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// Route pour migrer une session vers un compte client
router.post('/migrate', async (req, res) => {
  try {
    const { sessionToken, clientData, eligibilityResults } = req.body;

    console.log('🔍 Données reçues pour migration:', { 
      sessionToken: !!sessionToken, 
      clientData: !!clientData, 
      eligibilityResults: eligibilityResults?.length || 0 
    });

    if (!sessionToken) {
      return res.status(400).json({
        success: false,
        error: 'Session token manquant'
      });
    }

    if (!clientData || !clientData.email) {
      return res.status(400).json({
        success: false,
        error: 'Données client manquantes ou email manquant'
      });
    }

    // 1. Récupérer la session
    const { data: session, error: sessionError } = await supabase
      .from('TemporarySession')
      .select('*')
      .eq('session_token', sessionToken)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({
        success: false,
        error: 'Session non trouvée'
      });
    }

    // 2. Utiliser le mapping statique des produits
    const productMapping = PRODUCT_MAPPING;
    console.log('🔍 Mapping des produits:', productMapping);

    // 3. Récupérer le client créé (par email)
    console.log('🔍 Recherche du client avec email:', clientData.email);
    
    const { data: clients, error: clientError } = await supabaseAdmin
      .from('Client')
      .select('id, email, username')
      .eq('email', clientData.email);

    if (clientError) {
      console.error('❌ Erreur recherche client:', clientError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la recherche du client'
      });
    }

    const client = clients && clients.length > 0 ? clients[0] : null;

    if (!client) {
      console.error('❌ Client non trouvé avec email:', clientData.email);
      return res.status(404).json({
        success: false,
        error: 'Client non trouvé après création'
      });
    }

    console.log('✅ Client trouvé:', { id: client.id, email: client.email });

    // 4. Récupérer les éligibilités depuis la base de données
    console.log('🔍 Récupération des éligibilités pour session_id:', session.id);
    
    const { data: dbEligibilityResults, error: eligibilityError } = await supabase
      .from('TemporaryEligibility')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });

    if (eligibilityError) {
      console.error('❌ Erreur récupération éligibilités:', eligibilityError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des éligibilités'
      });
    }

    console.log(`✅ ${dbEligibilityResults?.length || 0} éligibilités trouvées`);

    // 5. Créer les ClientProduitEligible pour chaque résultat
    const clientProduitsEligibles = [];
    
    console.log('🔍 Création des produits éligibles pour', dbEligibilityResults?.length || 0, 'résultats');
    
    for (const result of dbEligibilityResults || []) {
      console.log(`🔍 Traitement du produit: ${result.produit_id} (${result.estimated_savings}€)`);
      
      const produitId = result.produit_id && typeof result.produit_id === 'string' 
        ? PRODUCT_MAPPING[result.produit_id] 
        : undefined;
      
      if (!produitId) {
        console.warn(`⚠️ Produit non trouvé dans le mapping: ${result.produit_id}`);
        console.log('🔍 Mapping disponible:', Object.keys(PRODUCT_MAPPING));
        continue;
      }

      const clientProduitEligible = {
        clientId: client.id,
        produitId: produitId,
        statut: result.eligibility_score >= 50 ? 'eligible' : 'non_eligible',
        tauxFinal: result.eligibility_score / 100,
        montantFinal: result.estimated_savings || 0,
        dureeFinale: 12, // 12 mois par défaut
        simulationId: null, // Pas de simulation pour l'instant
        metadata: {
          confidence_level: result.confidence_level,
          recommendations: result.recommendations || [],
          session_token: sessionToken,
          migrated_at: new Date().toISOString(),
          original_produit_id: result.produit_id
        },
        notes: `Migration depuis simulateur - Score: ${result.eligibility_score}%, Confiance: ${result.confidence_level}`,
        priorite: result.eligibility_score >= 80 ? 1 : result.eligibility_score >= 60 ? 2 : 3,
        dateEligibilite: new Date().toISOString(),
        current_step: 0,
        progress: 0,
        expert_id: null,
        charte_signed: false,
        charte_signed_at: null
      };

      clientProduitsEligibles.push(clientProduitEligible);
    }

    // 6. Insérer les ClientProduitEligible avec supabaseAdmin pour contourner RLS
    if (clientProduitsEligibles.length > 0) {
      const { data: insertedProducts, error: insertError } = await supabaseAdmin
        .from('ClientProduitEligible')
        .insert(clientProduitsEligibles)
        .select();

      if (insertError) {
        console.error('❌ Erreur insertion ClientProduitEligible:', insertError);
        console.error('📋 Détails erreur:', JSON.stringify(insertError, null, 2));
        console.error('📤 Données envoyées:', JSON.stringify(clientProduitsEligibles, null, 2));
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la création des produits éligibles',
          details: insertError.message || insertError
        });
      }

      console.log(`✅ ${insertedProducts?.length || 0} produits éligibles créés`);
    }

    // 7. Marquer la session comme migrée
    const { error: updateError } = await supabase
      .from('TemporarySession')
      .update({
        migrated_to_account: true,
        migrated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('Erreur mise à jour session:', updateError);
    }

    return res.json({
      success: true,
      data: {
        client_produit_eligibles: clientProduitsEligibles,
        migrated_count: clientProduitsEligibles.length,
        session_id: session.id
      },
      message: `Migration réussie: ${clientProduitsEligibles.length} produits éligibles créés`
    });

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    console.error('📋 Stack trace:', error instanceof Error ? error.stack : 'Stack trace non disponible');
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la migration',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Route pour vérifier si une session peut être migrée
router.get('/can-migrate/:sessionToken', async (req, res) => {
  try {
    const { sessionToken } = req.params;

    const { data: session, error } = await supabase
      .from('TemporarySession')
      .select('*')
      .eq('session_token', sessionToken)
      .single();

    if (error || !session) {
      return res.json({
        success: false,
        can_migrate: false,
        error: 'Session non trouvée'
      });
    }

    if (session.migrated_to_account) {
      return res.json({
        success: false,
        can_migrate: false,
        error: 'Session déjà migrée'
      });
    }

    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      return res.json({
        success: false,
        can_migrate: false,
        error: 'Session expirée'
      });
    }

    return res.json({
      success: true,
      can_migrate: true
    });

  } catch (error) {
    console.error('Erreur vérification migration:', error);
    return res.status(500).json({
      success: false,
      can_migrate: false,
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Route de diagnostic pour vérifier l'état de la migration
router.get('/diagnose/:sessionToken', async (req, res) => {
  try {
    const { sessionToken } = req.params;

    console.log('🔍 Diagnostic pour session:', sessionToken);

    // 1. Vérifier la session
    const { data: session, error: sessionError } = await supabase
      .from('TemporarySession')
      .select('*')
      .eq('session_token', sessionToken)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({
        success: false,
        error: 'Session non trouvée',
        sessionToken
      });
    }

    // 2. Vérifier les résultats d'éligibilité
    const { data: eligibilityResults, error: eligibilityError } = await supabase
      .from('TemporaryEligibility')
      .select('*')
      .eq('session_id', session.id);

    if (eligibilityError) {
      console.error('Erreur récupération éligibilité:', eligibilityError);
    }

    // 3. Vérifier les produits éligibles disponibles
    const { data: produits, error: produitsError } = await supabase
      .from('ProduitEligible')
      .select('id, nom, categorie')
      .eq('active', true);

    if (produitsError) {
      console.error('Erreur récupération produits:', produitsError);
    }

    // 4. Vérifier le mapping des produits
    const mappingStatus: { [key: string]: any } = {};
    for (const result of eligibilityResults || []) {
      const produitId = result.produit_id && typeof result.produit_id === 'string' 
        ? PRODUCT_MAPPING[result.produit_id] 
        : undefined;
      mappingStatus[result.produit_id as string] = {
        found: !!produitId,
        produitId: produitId,
        eligibility_score: result.eligibility_score,
        estimated_savings: result.estimated_savings
      };
    }

    // 5. Vérifier si le client existe déjà
    let clientExists = null;
    if (session.client_id) {
      const { data: client, error: clientError } = await supabase
        .from('Client')
        .select('id, email, username')
        .eq('id', session.client_id)
        .single();
      
      if (!clientError && client) {
        clientExists = client;
      }
    }

    return res.json({
      success: true,
      diagnostic: {
        session: {
          id: session.id,
          session_token: session.session_token,
          completed: session.completed,
          migrated_to_account: session.migrated_to_account,
          migrated_at: session.migrated_at,
          created_at: session.created_at
        },
        eligibility_results: eligibilityResults || [],
        produits_disponibles: produits || [],
        mapping_status: mappingStatus,
        client_exists: clientExists,
        product_mapping: PRODUCT_MAPPING
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur lors du diagnostic'
    });
  }
});

export default router; 