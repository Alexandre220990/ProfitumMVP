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

// Route pour migrer une session vers un compte client - REFACTORISÉE
router.post('/migrate', async (req, res) => {
  try {
    const { sessionToken, clientData } = req.body;

    console.log('🚀 MIGRATION REFACTORISÉE - Début du processus');
    console.log('📤 Données reçues:', { 
      sessionToken: !!sessionToken, 
      clientData: !!clientData
    });

    // 1. Validation des paramètres
    if (!sessionToken) {
      console.log('❌ Validation échouée: Session token manquant');
      return res.status(400).json({
        success: false,
        error: 'Session token manquant'
      });
    }

    if (!clientData || !clientData.email) {
      console.log('❌ Validation échouée: Données client manquantes');
      return res.status(400).json({
        success: false,
        error: 'Données client manquantes ou email manquant'
      });
    }

    console.log('✅ Validation des paramètres réussie');

    // 2. Récupération de la session
    console.log('🔍 Étape 1: Récupération de la session...');
    
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('TemporarySession')
      .select('*')
      .eq('session_token', sessionToken)
      .single();

    if (sessionError || !session) {
      console.log('❌ Session non trouvée:', sessionToken);
      return res.status(404).json({
        success: false,
        error: 'Session non trouvée'
      });
    }

    console.log('✅ Session trouvée:', {
      id: session.id,
      session_token: session.session_token,
      completed: session.completed,
      migrated_to_account: session.migrated_to_account
    });

    // 3. Vérification que la session n'est pas déjà migrée
    if (session.migrated_to_account) {
      console.log('❌ Session déjà migrée');
      return res.status(400).json({
        success: false,
        error: 'Session déjà migrée vers un compte'
      });
    }

    // 4. Récupération du client
    console.log('🔍 Étape 2: Récupération du client...');
    
    const { data: client, error: clientError } = await supabaseAdmin
      .from('Client')
      .select('id, email, company_name')
      .eq('email', clientData.email)
      .single();

    if (clientError || !client) {
      console.log('❌ Client non trouvé:', clientData.email);
      return res.status(404).json({
        success: false,
        error: 'Client non trouvé après création'
      });
    }

    console.log('✅ Client trouvé:', {
      id: client.id,
      email: client.email,
      company_name: client.company_name
    });

    // 5. Récupération des éligibilités depuis la base de données
    console.log('🔍 Étape 3: Récupération des éligibilités...');
    
    const { data: dbEligibilityResults, error: eligibilityError } = await supabaseAdmin
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
    
    if (dbEligibilityResults && dbEligibilityResults.length > 0) {
      dbEligibilityResults.forEach((elig, index) => {
        console.log(`   ${index + 1}. Produit: ${elig.produit_id}, Score: ${elig.eligibility_score}%, Économies: ${elig.estimated_savings}€`);
      });
    }

    // 6. Vérification du mapping des produits
    console.log('🔍 Étape 4: Vérification du mapping des produits...');
    
    const { data: products, error: productsError } = await supabaseAdmin
      .from('ProduitEligible')
      .select('id, nom');

    if (productsError) {
      console.error('❌ Erreur récupération produits:', productsError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des produits'
      });
    }

    console.log(`✅ ${products?.length || 0} produits dans le catalogue`);

    // 7. Création des ClientProduitEligible
    console.log('🔍 Étape 5: Création des produits éligibles...');
    
    const clientProduitsEligibles = [];
    
    if (dbEligibilityResults && dbEligibilityResults.length > 0) {
      for (const result of dbEligibilityResults) {
        console.log(`🔍 Traitement du produit: ${result.produit_id} (${result.estimated_savings}€)`);
        
        const produitId = result.produit_id && typeof result.produit_id === 'string' 
          ? PRODUCT_MAPPING[result.produit_id] 
          : undefined;
        
        if (!produitId) {
          console.warn(`⚠️ Produit non trouvé dans le mapping: ${result.produit_id}`);
          continue;
        }

        // Vérifier que le produit existe dans le catalogue
        const productExists = products?.some(p => p.id === produitId);
        if (!productExists) {
          console.warn(`⚠️ Produit ${result.produit_id} (${produitId}) non trouvé dans le catalogue`);
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
        console.log(`✅ Produit préparé: ${result.produit_id} → ${produitId}`);
      }
    }

    // 8. Insertion des ClientProduitEligible
    console.log('🔍 Étape 6: Insertion des produits éligibles...');
    
    if (clientProduitsEligibles.length > 0) {
      console.log(`📤 Insertion de ${clientProduitsEligibles.length} produits éligibles...`);
      
      const { data: insertedProducts, error: insertError } = await supabaseAdmin
        .from('ClientProduitEligible')
        .insert(clientProduitsEligibles)
        .select();

      if (insertError) {
        console.error('❌ Erreur insertion ClientProduitEligible:', insertError);
        console.error('📋 Détails erreur:', JSON.stringify(insertError, null, 2));
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la création des produits éligibles',
          details: insertError.message || insertError
        });
      }

      console.log(`✅ ${insertedProducts?.length || 0} produits éligibles créés`);
      
      if (insertedProducts && insertedProducts.length > 0) {
        insertedProducts.forEach((prod, index) => {
          console.log(`   ${index + 1}. ID: ${prod.id}, Client: ${prod.clientId}, Produit: ${prod.produitId}, Statut: ${prod.statut}`);
        });
      }
    } else {
      console.log('⚠️ Aucun produit à insérer');
    }

    // 9. Marquage de la session comme migrée
    console.log('🔍 Étape 7: Marquage de la session comme migrée...');
    
    const { error: updateError } = await supabaseAdmin
      .from('TemporarySession')
      .update({
        migrated_to_account: true,
        migrated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('❌ Erreur marquage session:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors du marquage de la session'
      });
    }

    console.log('✅ Session marquée comme migrée');

    // 10. Vérification finale
    console.log('🔍 Étape 8: Vérification finale...');
    
    const { data: finalProducts, error: finalError } = await supabaseAdmin
      .from('ClientProduitEligible')
      .select('*')
      .eq('clientId', client.id);

    if (finalError) {
      console.error('❌ Erreur vérification finale:', finalError);
    } else {
      console.log(`✅ ${finalProducts?.length || 0} produits éligibles finaux pour le client`);
    }

    // 11. Réponse de succès
    console.log('🎉 MIGRATION RÉUSSIE !');
    
    return res.json({
      success: true,
      data: {
        client_id: client.id,
        client_email: client.email,
        session_id: session.id,
        session_token: sessionToken,
        client_produit_eligibles: finalProducts || [],
        migrated_count: finalProducts?.length || 0,
        total_savings: finalProducts?.reduce((sum, prod) => sum + (prod.montantFinal || 0), 0) || 0
      },
      message: `Migration réussie: ${finalProducts?.length || 0} produits éligibles créés pour ${client.email}`
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