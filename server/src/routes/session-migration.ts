import express, { Router, Request, Response } from 'express';
import { supabaseClient } from '../config/supabase';
import { SessionMigrationService, MigrationData, MigrationResult } from '../services/sessionMigrationService';

const router = express.Router();

/**
 * POST /api/session-migration/migrate
 * Migre une session temporaire vers un compte client
 */
router.post('/migrate', async (req: Request, res: Response) => {
  try {
    const { sessionToken, clientData } = req.body;

    if (!sessionToken || !clientData) {
      return res.status(400).json({
        success: false,
        message: 'sessionToken et clientData sont requis'
      });
    }

    console.log('🔄 Migration de session vers client:', sessionToken.substring(0, 8));

    const migrationData: MigrationData = {
      sessionToken,
      sessionId: sessionToken, // Utiliser le token comme ID
      clientData
    };

    const result: MigrationResult = await SessionMigrationService.migrateSessionToClient(migrationData);

    if (result.success) {
      console.log('✅ Migration réussie:', result.clientId);
      return res.json({
        success: true,
        data: {
          clientId: result.clientId,
          migratedProducts: result.migratedProducts || [],
          details: result.details,
          message: 'Migration terminée avec succès'
        }
      });
    } else {
      console.error('❌ Échec de la migration:', result.error);
      return res.status(400).json({
        success: false,
        message: 'Erreur lors de la migration',
        error: result.error,
        details: result.details
      });
    }

  } catch (error) {
    console.error('❌ Erreur inattendue lors de la migration:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * GET /api/session-migration/status/:sessionToken
 * Vérifie le statut d'une session de migration
 */
router.get('/status/:sessionToken', async (req: Request, res: Response) => {
  try {
    const { sessionToken } = req.params;

    console.log('🔍 Vérification statut migration:', sessionToken.substring(0, 8));

    // Vérifier si la session existe
    const { data: session, error } = await supabaseClient
      .from('SimulatorSession')
      .select('*')
      .eq('session_token', sessionToken)
      .single();

    if (error || !session) {
      return res.status(404).json({
        success: false,
        message: 'Session non trouvée'
      });
    }

    // Vérifier si la session a été migrée
    const { data: client, error: clientError } = await supabaseClient
      .from('Client')
      .select('id, email, name')
      .eq('session_migrated_from', sessionToken)
      .single();

    return res.json({
      success: true,
      data: {
        sessionExists: true,
        sessionData: session,
        isMigrated: !!client,
        clientData: client || null
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la vérification du statut:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * POST /api/session-migration/cleanup/:sessionToken
 * Nettoie une session temporaire après migration
 */
router.post('/cleanup/:sessionToken', async (req: Request, res: Response) => {
  try {
    const { sessionToken } = req.params;

    console.log('🧹 Nettoyage de la session:', sessionToken.substring(0, 8));

    const { error } = await supabaseClient
      .from('SimulatorSession')
      .delete()
      .eq('session_token', sessionToken);

    if (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du nettoyage',
        error: error.message
      });
    }

    return res.json({
      success: true,
      message: 'Session nettoyée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

export default router; 