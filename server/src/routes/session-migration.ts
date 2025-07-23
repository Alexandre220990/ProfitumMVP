import express, { Router, Request, Response } from 'express';
import { SimulationSessionService } from '../services/SimulationSessionService';
import { supabase } from '../lib/supabase';

const router = express.Router();

/**
 * Route pour créer une session temporaire
 * POST /api/session-migration/create-session
 */
router.post('/create-session', async (req: Request, res: Response) => {
  try {
    const { simulationData } = req.body;
    
    if (!simulationData) {
      return res.status(400).json({
        success: false,
        error: 'Données de simulation requises'
      });
    }
    
    console.log('🔄 Création session temporaire pour simulation');
    
    // Créer la session temporaire
    const sessionResult = await SimulationSessionService.createTemporarySession(simulationData);
    
    return res.json({
      success: true,
      data: sessionResult,
      message: 'Session temporaire créée avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur création session temporaire:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la session temporaire'
    });
  }
});

/**
 * Route pour valider une session temporaire
 * GET /api/session-migration/validate/:sessionToken
 */
router.get('/validate/:sessionToken', async (req: Request, res: Response) => {
  try {
    const { sessionToken } = req.params;
    
    if (!sessionToken) {
      return res.status(400).json({
        success: false,
        error: 'Token de session requis'
      });
    }
    
    // Valider la session
    const isValid = await SimulationSessionService.validateSession(sessionToken);
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Session expirée ou invalide'
      });
    }
    
    // Récupérer les données de session
    const sessionData = await SimulationSessionService.getSessionData(sessionToken);
    const products = await SimulationSessionService.getSessionProducts(sessionData.sessionId);
    
    return res.json({
      success: true,
      data: {
        session: sessionData,
        products: products
      },
      message: 'Session valide'
    });
    
  } catch (error) {
    console.error('❌ Erreur validation session:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la validation de la session'
    });
  }
});

/**
 * Route pour migrer une session vers un compte client permanent
 * POST /api/session-migration/migrate
 */
router.post('/migrate', async (req: Request, res: Response) => {
  try {
    const { sessionToken, clientData } = req.body;
    
    // Validation des données
    if (!sessionToken || !clientData) {
      return res.status(400).json({
        success: false,
        error: 'Token de session et données client requis'
      });
    }
    
    // Validation des champs obligatoires
    const requiredFields = [
      'email', 'password', 'username', 'company_name', 
      'phone_number', 'address', 'city', 'postal_code', 'siren'
    ];
    
    const missingFields = requiredFields.filter(field => !clientData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Champs requis manquants: ${missingFields.join(', ')}`
      });
    }
    
    console.log('🔄 Début migration session vers client');
    
    // Vérifier la validité de la session
    const isValid = await SimulationSessionService.validateSession(sessionToken);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Session expirée ou invalide'
      });
    }
    
    // Effectuer la migration
    const migrationResult = await SimulationSessionService.migrateSessionToClient(
      sessionToken,
      clientData
    );
    
    if (!migrationResult.success) {
      return res.status(500).json({
        success: false,
        error: migrationResult.error || 'Erreur lors de la migration'
      });
    }
    
    return res.json({
      success: true,
      data: migrationResult,
      message: 'Migration réussie'
    });
    
  } catch (error) {
    console.error('❌ Erreur migration session:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la migration'
    });
  }
});

/**
 * Route pour récupérer les produits d'une session temporaire
 * GET /api/session-migration/products/:sessionId
 */
router.get('/products/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'ID de session requis'
      });
    }
    
    // Récupérer les produits de la session
    const products = await SimulationSessionService.getSessionProducts(sessionId);
    
    return res.json({
      success: true,
      data: products,
      message: 'Produits récupérés avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération produits session:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des produits'
    });
  }
});

/**
 * Route pour nettoyer les sessions expirées (admin seulement)
 * POST /api/session-migration/cleanup
 */
router.post('/cleanup', async (req: Request, res: Response) => {
  try {
    // Vérifier les permissions admin (à implémenter selon votre système)
    // const isAdmin = await checkAdminPermissions(req);
    // if (!isAdmin) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Accès non autorisé'
    //   });
    // }
    
    console.log('🧹 Nettoyage des sessions expirées');
    
    // Appeler la fonction de nettoyage de la base de données
    // Cette fonction est définie dans la migration SQL
    const { data, error } = await supabase.rpc('cleanup_expired_sessions');
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      message: 'Nettoyage des sessions expirées terminé'
    });
    
  } catch (error) {
    console.error('❌ Erreur nettoyage sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du nettoyage des sessions'
    });
  }
});

export default router; 