import { Router } from 'express';
import { supabaseClient } from '../config/supabase';

const router = Router();
const supabase = supabaseClient;

// Mapping des produits du simulateur vers les UUID de ProduitEligible
const PRODUCT_MAPPING: { [key: string]: string } = {
  'TICPE': 'ticpe-uuid', // À remplacer par le vrai UUID
  'URSSAF': 'urssaf-uuid', // À remplacer par le vrai UUID
  'DFS': 'dfs-uuid', // À remplacer par le vrai UUID
  'FONCIER': 'foncier-uuid' // À remplacer par le vrai UUID
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

    // 2. Récupérer les UUIDs des produits éligibles
    const { data: produits, error: produitsError } = await supabase
      .from('ProduitEligible')
      .select('id, nom, categorie')
      .eq('active', true);

    if (produitsError) {
      console.error('Erreur récupération produits:', produitsError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des produits'
      });
    }

    // Créer un mapping dynamique basé sur les noms/catégories
    const productMapping: { [key: string]: string } = {};
    produits?.forEach((produit: any) => {
      const nom = produit.nom?.toUpperCase();
      const categorie = produit.categorie?.toUpperCase();
      
      if (nom?.includes('TICPE') || categorie?.includes('TICPE')) {
        productMapping['TICPE'] = produit.id;
      } else if (nom?.includes('URSSAF') || categorie?.includes('URSSAF')) {
        productMapping['URSSAF'] = produit.id;
      } else if (nom?.includes('DFS') || categorie?.includes('DFS')) {
        productMapping['DFS'] = produit.id;
      } else if (nom?.includes('FONCIER') || categorie?.includes('FONCIER')) {
        productMapping['FONCIER'] = produit.id;
      }
    });

    console.log('🔍 Mapping des produits:', productMapping);

    // 3. Récupérer le client créé (par email)
    console.log('🔍 Recherche du client avec email:', clientData.email);
    
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select('id, email, username')
      .eq('email', clientData.email)
      .single();

    if (clientError) {
      console.error('❌ Erreur recherche client:', clientError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la recherche du client'
      });
    }

    if (!client) {
      console.error('❌ Client non trouvé avec email:', clientData.email);
      return res.status(404).json({
        success: false,
        error: 'Client non trouvé après création'
      });
    }

    console.log('✅ Client trouvé:', { id: client.id, email: client.email });

    // 4. Créer les ClientProduitEligible pour chaque résultat
    const clientProduitsEligibles = [];
    
    console.log('🔍 Création des produits éligibles pour', eligibilityResults?.length || 0, 'résultats');
    
    for (const result of eligibilityResults || []) {
      console.log(`🔍 Traitement du produit: ${result.produit_id} (${result.estimated_savings}€)`);
      
      const produitId = productMapping[result.produit_id];
      
      if (!produitId) {
        console.warn(`⚠️ Produit non trouvé dans le mapping: ${result.produit_id}`);
        console.log('🔍 Mapping disponible:', Object.keys(productMapping));
        continue;
      }

      const clientProduitEligible = {
        id: crypto.randomUUID(),
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
        charte_signed_at: null,
        sessionId: session.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      clientProduitsEligibles.push(clientProduitEligible);
    }

    // 5. Insérer les ClientProduitEligible
    if (clientProduitsEligibles.length > 0) {
      const { data: insertedProducts, error: insertError } = await supabase
        .from('ClientProduitEligible')
        .insert(clientProduitsEligibles)
        .select();

      if (insertError) {
        console.error('Erreur insertion ClientProduitEligible:', insertError);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la création des produits éligibles'
        });
      }

      console.log(`✅ ${insertedProducts?.length || 0} produits éligibles créés`);
    }

    // 6. Marquer la session comme migrée
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
    console.error('Erreur lors de la migration:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la migration'
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
      error: 'Erreur serveur'
    });
  }
});

export default router; 