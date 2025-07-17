import express from 'express';
import { SessionMigrationService, MigrationData } from '../services/sessionMigrationService';
import { supabase } from '../lib/supabase';

const router = express.Router();

/**
 * Routes de migration des sessions temporaires vers des comptes clients
 * ====================================================================
 * 
 * Ces routes permettent de transformer les utilisateurs du simulateur
 * en véritables clients avec leurs produits éligibles.
 */

// Route pour vérifier si une session peut être migrée
router.get('/can-migrate/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID requis'
      });
    }

    const canMigrate = await SessionMigrationService.canMigrateSession(sessionId);

    res.json({
      success: true,
      can_migrate: canMigrate,
      session_id: sessionId
    });

  } catch (error) {
    console.error('Erreur vérification migration:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification de migration'
    });
  }
});

// Route pour récupérer les données de session pour migration
router.get('/session-data/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID requis'
      });
    }

    // Vérifier que la session peut être migrée
    const canMigrate = await SessionMigrationService.canMigrateSession(sessionId);
    if (!canMigrate) {
      return res.status(400).json({
        success: false,
        error: 'Cette session ne peut pas être migrée'
      });
    }

    // Récupérer les données de session
    const { data: sessionData, error: sessionError } = await supabase
      .from('TemporarySession')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      return res.status(404).json({
        success: false,
        error: 'Session non trouvée'
      });
    }

    // Récupérer les réponses
    const { data: responses, error: responsesError } = await supabase
      .from('TemporaryResponse')
      .select(`
        *,
        QuestionnaireQuestion (
          question_text,
          question_type,
          produits_cibles
        )
      `)
      .eq('session_id', sessionId);

    if (responsesError) {
      console.error('Erreur récupération réponses:', responsesError);
    }

    // Récupérer les résultats d'éligibilité
    const { data: eligibilityResults, error: eligibilityError } = await supabase
      .from('TemporaryEligibility')
      .select('*')
      .eq('session_id', sessionId);

    if (eligibilityError) {
      console.error('Erreur récupération éligibilité:', eligibilityError);
    }

    // Extraire les données client des réponses
    const extractedData = SessionMigrationService.extractClientDataFromResponses(responses || []);

    res.json({
      success: true,
      data: {
        session: sessionData,
        responses: responses || [],
        eligibility_results: eligibilityResults || [],
        extracted_client_data: extractedData,
        total_potential_savings: (eligibilityResults || []).reduce((sum: number, r: any) => sum + (r.estimated_savings || 0), 0),
        high_eligibility_count: (eligibilityResults || []).filter((r: any) => r.eligibility_score >= 70).length
      }
    });

  } catch (error) {
    console.error('Erreur récupération données session:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des données de session'
    });
  }
});

// Route pour migrer une session vers un compte client
router.post('/migrate', async (req, res) => {
  try {
    const migrationData: MigrationData = req.body;

    // Validation des données requises
    if (!migrationData.sessionToken || !migrationData.sessionId || !migrationData.clientData) {
      return res.status(400).json({
        success: false,
        error: 'Données de migration incomplètes'
      });
    }

    const { email, password, username, company_name, phone_number, address, city, postal_code, siren } = migrationData.clientData;

    if (!email || !password || !username || !company_name || !phone_number || !address || !city || !postal_code || !siren) {
      return res.status(400).json({
        success: false,
        error: 'Tous les champs client sont requis'
      });
    }

    // Vérifier que la session peut être migrée
    const canMigrate = await SessionMigrationService.canMigrateSession(migrationData.sessionId);
    if (!canMigrate) {
      return res.status(400).json({
        success: false,
        error: 'Cette session ne peut pas être migrée'
      });
    }

    // Effectuer la migration
    const migrationResult = await SessionMigrationService.migrateSessionToClient(migrationData);

    if (!migrationResult.success) {
      return res.status(500).json({
        success: false,
        error: migrationResult.error || 'Erreur lors de la migration'
      });
    }

    // Retourner le résultat avec les informations du client créé
    res.json({
      success: true,
      message: 'Migration réussie',
      data: {
        client_id: migrationResult.clientId,
        client_produit_eligibles: migrationResult.clientProduitEligibles,
        migration_details: migrationResult.details
      }
    });

  } catch (error) {
    console.error('Erreur migration session:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la migration de la session'
    });
  }
});

// Route pour récupérer les statistiques de migration
router.get('/stats', async (req, res) => {
  try {
    const stats = await SessionMigrationService.getMigrationStats();

    if (!stats) {
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des statistiques'
      });
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Erreur récupération stats migration:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// Route pour récupérer les sessions migrées d'un client
router.get('/client/:clientId/migrations', async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        error: 'Client ID requis'
      });
    }

    // Récupérer les sessions migrées pour ce client
    const { data: sessions, error: sessionsError } = await supabase
      .from('TemporarySession')
      .select(`
        *,
        TemporaryResponse (count),
        TemporaryEligibility (count)
      `)
      .eq('client_id', clientId)
      .eq('migrated_to_account', true);

    if (sessionsError) {
      console.error('Erreur récupération sessions migrées:', sessionsError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des sessions migrées'
      });
    }

    res.json({
      success: true,
      data: {
        client_id: clientId,
        migrated_sessions: sessions || [],
        total_migrations: sessions?.length || 0
      }
    });

  } catch (error) {
    console.error('Erreur récupération migrations client:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des migrations'
    });
  }
});

// Route pour annuler une migration (en cas d'erreur)
router.post('/rollback/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID requis'
      });
    }

    // Marquer la session comme non migrée
    const { error: updateError } = await supabase
      .from('TemporarySession')
      .update({
        migrated_to_account: false,
        migrated_at: null,
        client_id: null
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Erreur rollback migration:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors du rollback'
      });
    }

    res.json({
      success: true,
      message: 'Rollback effectué avec succès',
      session_id: sessionId
    });

  } catch (error) {
    console.error('Erreur rollback migration:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du rollback de la migration'
    });
  }
});

// Route de migration simplifiée (sans dépendance au simulateur)
router.post('/migrate-simple', async (req, res) => {
  try {
    const { clientData, eligibilityResults } = req.body;

    if (!clientData || !eligibilityResults) {
      return res.status(400).json({
        success: false,
        error: 'Données client et résultats d\'éligibilité requis'
      });
    }

    console.log('🔄 Migration simplifiée - Création client direct');

    // 1. Créer directement le compte client
    const clientId = await SessionMigrationService.createClientAccountDirect(clientData);

    if (!clientId) {
      return res.status(500).json({
        success: false,
        error: 'Échec de la création du compte client'
      });
    }

    // 2. Créer les ClientProduitEligible
    const clientProduitEligibles = await SessionMigrationService.createClientProduitEligiblesDirect(
      clientId,
      eligibilityResults
    );

    // 3. Sauvegarder les données de simulation
    await SessionMigrationService.saveSimulationDataDirect(
      clientId,
      eligibilityResults
    );

    res.json({
      success: true,
      data: {
        clientId,
        client_produit_eligibles: clientProduitEligibles || [],
        message: 'Client créé avec succès'
      }
    });

  } catch (error) {
    console.error('Erreur migration simplifiée:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la migration'
    });
  }
});

export default router; 