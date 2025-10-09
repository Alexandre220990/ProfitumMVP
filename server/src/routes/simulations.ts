import express, { Response, Request } from 'express';
import crypto from 'crypto';
import { supabase } from '../lib/supabase';
const fetch = require('node-fetch');
import { PYTHON_API_URL } from '../config/api';
import jwt from 'jsonwebtoken';


// Types pour l'authentification
interface AuthUser {
  id: string;
  email: string;
  type: 'client' | 'expert' | 'admin';
  user_metadata?: any;
  app_metadata?: any;
  aud?: string;
  created_at?: string;
}

interface TableTestResult {
  status: string;
  message?: string;
  count?: number;
  sample?: any;
  isEmpty?: boolean;
  sampleError?: string;
}

interface PythonAnalyseResponse {
  eligibleProduitIds?: string[];
  [key: string]: any;
}

const router = express.Router();

// Clé JWT pour la validation des tokens
import { jwtConfig } from '../config/jwt';
const JWT_SECRET = jwtConfig.secret;

// Route de test pour vérifier les tables
router.get('/test-tables', async (req: Request, res: Response) => {
  try {
    console.log('Test des tables...');
    const results: Record<string, any> = {};
    
    // Tables à tester
    const tables = [
      'Client', 
      'Simulation', 
      'ProduitEligible', 
      'ClientProduitEligible', 
      'Question', 
      'Reponse', 
      'SimulationResult'
    ];
    
    // Tester chaque table
    for (const table of tables) {
      try {
        console.log(`Test de la table ${table}...`);
        
        // Vérifier la table
        let tableTest: TableTestResult;
        try {
          const { data, error } = await supabase
            .from(table)
            .select('count')
            .single();
          
          if (error) {
            console.error(`Erreur lors de la vérification de la table ${table}:`, error);
            tableTest = { status: 'error', message: error.message };
          } else {
            tableTest = { status: 'ok', count: data?.count || 0 };
          }
        } catch (error) {
          console.error(`Erreur de requête pour ${table}:`, error);
          tableTest = { status: 'error', message: error instanceof Error ? error.message : 'Erreur inconnue' };
        }
        
        // Récupérer un échantillon
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          if (!error && data && data.length > 0) {
            tableTest.sample = data[0];
            tableTest.isEmpty = false;
          } else {
            tableTest.isEmpty = true;
          }
        } catch (error) {
          console.error(`Erreur lors de l'échantillonnage de ${table}:`, error);
          tableTest.sampleError = error instanceof Error ? error.message : 'Erreur inconnue';
        }
        
        results[table] = tableTest;
      } catch (tableError) {
        console.error(`Erreur globale pour ${table}:`, tableError);
        results[table] = { 
          status: 'error', 
          message: tableError instanceof Error ? tableError.message : 'Erreur inconnue' 
        };
      }
    }
    
    // Essayer de récupérer la configuration supabase
    results.config = {
      url: process.env.SUPABASE_URL,
      keyPresent: !!process.env.SUPABASE_KEY
    };
    
    return res.json({
      success: true,
      data: results,
      message: 'Test des tables terminé'
    });
  } catch (error) {
    console.error('Erreur lors du test des tables:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du test des tables',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Vérifier s'il existe une simulation récente pour le client (AVEC AUTHENTIFICATION) - OPTIMISÉ
router.get('/check-recent/:clientId', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { clientId } = req.params;
    
    console.log('🔍 Vérification simulation récente pour le client:', clientId, 'par utilisateur:', authUser.email);
    
    // Vérifier que l'utilisateur a accès à ce client
    if (authUser.type === 'client') {
      // Récupérer le client par auth_id pour vérifier l'accès
      const { data: client, error: clientError } = await supabase
        .from('Client')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

      if (clientError || !client || client.id !== clientId) {
        console.log('❌ Accès refusé: client ne peut accéder qu\'à ses propres données');
        return res.status(403).json({ 
          success: false, 
          message: 'Accès non autorisé à ce client' 
        });
      }
    }
    
    // Rechercher les simulations des 24 dernières heures (requêtes parallèles)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString();

    const [simulationResult, processedResult] = await Promise.all([
      supabase
        .from('simulations')
        .select('id, created_at, status')
        .eq('client_id', clientId)
        .gt('created_at', yesterdayISO)
        .order('created_at', { ascending: false })
        .limit(1),
      
      supabase
        .from('SimulationProcessed')
        .select('id, createdat, statut')
        .eq('clientid', clientId)
        .gt('createdat', yesterdayISO)
        .order('createdat', { ascending: false })
        .limit(1)
    ]);
    
    if (simulationResult.error) {
      console.error('❌ Erreur Supabase Simulation:', simulationResult.error);
      throw simulationResult.error;
    }

    if (processedResult.error) {
      console.error('⚠️ Erreur lors de la vérification des simulations traitées:', processedResult.error);
    }

    // Déterminer s'il y a une simulation récente
    const hasRecentSimulation = 
      (simulationResult.data && Array.isArray(simulationResult.data) && simulationResult.data.length > 0) || 
      (processedResult.data && Array.isArray(processedResult.data) && processedResult.data.length > 0);

    console.log('✅ Vérification terminée:', {
      hasRecentSimulation,
      simulationFound: simulationResult.data && Array.isArray(simulationResult.data) && simulationResult.data.length > 0,
      processedFound: processedResult.data && Array.isArray(processedResult.data) && processedResult.data.length > 0
    });

    return res.json({
      success: true,
      hasRecentSimulation,
      data: {
        simulation: simulationResult.data?.[0] || null,
        processed: processedResult.data?.[0] || null
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des simulations récentes:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des simulations récentes',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Route pour créer une simulation
router.post('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { clientId, type, data } = req.body;

    // Vérifier que l'utilisateur a le droit de créer une simulation
    if (authUser.type === 'client' && authUser.id !== clientId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Vous ne pouvez créer des simulations que pour votre propre compte' 
      });
    }

    console.log('🚀 Création d\'une nouvelle simulation:', { clientId, type, userId: authUser.id });

    // Créer la simulation en base
    const { data: simulation, error: simulationError } = await supabase
      .from('simulations')
      .insert({
        client_id: clientId,
        type,
        answers: data || {},
        status: 'en_cours',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (simulationError) {
      console.error('❌ Erreur lors de la création de la simulation:', simulationError);
      throw simulationError;
    }

    console.log('✅ Simulation créée avec succès:', simulation.id);

    // Envoyer à l'API Python pour analyse
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${PYTHON_API_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          simulation_id: simulation.id,
          client_id: clientId,
          answers: data,
          type: type
        })
      });

      const responseTime = Date.now() - startTime;
      console.log(`⏱️ Temps de réponse Python: ${responseTime}ms`);

      if (!response.ok) {
        throw new Error(`Erreur API Python: ${response.status} ${response.statusText}`);
      }

      const pythonResponse: PythonAnalyseResponse = await response.json();
      console.log('📊 Réponse Python reçue:', pythonResponse);

      // Mettre à jour la simulation avec les résultats
      const { error: updateError } = await supabase
        .from('simulations')
        .update({
          status: 'completed',
          results: pythonResponse,
          updated_at: new Date().toISOString()
        })
        .eq('id', simulation.id);

      if (updateError) {
        console.error('❌ Erreur lors de la mise à jour de la simulation:', updateError);
      }

      // Enregistrer les produits éligibles avec le nouveau système
      if (pythonResponse.eligibleProduitIds && pythonResponse.eligibleProduitIds.length > 0) {
        await enregistrerProduitsEligibles(clientId, simulation.id, pythonResponse.eligibleProduitIds);
      } else {
        // Fallback : Évaluer avec le nouveau moteur de règles
        console.log('⚠️ Pas de produits éligibles de Python, utilisation du moteur de règles');
        // TODO: Implémenter l'évaluation basée sur les réponses de la simulation
      }

      return res.json({
        success: true,
        data: {
          simulation: {
            ...simulation,
            results: pythonResponse
          }
        },
        message: 'Simulation créée et analysée avec succès'
      });

    } catch (pythonError) {
      console.error('❌ Erreur lors de l\'analyse Python:', pythonError);
      
      // Marquer la simulation comme échouée
      await supabase
        .from('simulations')
        .update({
          status: 'failed',
          metadata: { 
            error: pythonError instanceof Error ? pythonError.message : 'Erreur inconnue'
          }
        })
        .eq('id', simulation.id);

      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'analyse de la simulation',
        error: pythonError instanceof Error ? pythonError.message : 'Erreur inconnue'
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors de la création de la simulation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la simulation',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Route pour récupérer les simulations d'un client
router.get('/client/:clientId', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { clientId } = req.params;

    // Vérifier les permissions
    if (authUser.type === 'client' && authUser.id !== clientId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Vous ne pouvez voir que vos propres simulations' 
      });
    }

    console.log('🔍 Récupération des simulations pour le client:', clientId);

    const { data: simulations, error } = await supabase
      .from('simulations')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur lors de la récupération des simulations:', error);
      throw error;
    }

    return res.json({
      success: true,
      data: {
        simulations: simulations || []
      }
    });

  } catch (error: unknown) {
    console.error('❌ Erreur lors de la récupération des simulations:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des simulations',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Route pour exporter une simulation
router.post('/:id/export', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { id } = req.params;
    const { format, products, answers } = req.body;

    console.log('📤 Export de simulation:', { id, format, userId: authUser.id });

    // Récupérer la simulation
    const { data: simulation, error: simulationError } = await supabase
      .from('simulations')
      .select('*')
      .eq('id', id)
      .single();

    if (simulationError || !simulation) {
      return res.status(404).json({
        success: false,
        message: 'Simulation non trouvée'
      });
    }

    // Vérifier les permissions
    if (authUser.type === 'client' && simulation.clientId !== authUser.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez exporter que vos propres simulations'
      });
    }

    let buffer: Buffer;
    let filename: string;
    let contentType: string;

    switch (format) {
      case 'xlsx':
        buffer = await generateExcelExport(products, answers, simulation);
        filename = `simulation_${id}.xlsx`;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'pdf':
        buffer = await generatePDFExport(products, answers, simulation);
        filename = `simulation_${id}.pdf`;
        contentType = 'application/pdf';
        break;
      case 'docx':
        buffer = await generateWordExport(products, answers, simulation);
        filename = `simulation_${id}.docx`;
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Format d\'export non supporté'
        });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);

  } catch (error: unknown) {
    console.error('❌ Erreur lors de l\'export:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Fonction pour enregistrer TOUS les produits (éligibles ou non)
async function enregistrerProduitsEligibles(clientId: string, simulationId: number, produitIdsEligibles: string[]) {
  try {
    console.log('💾 Enregistrement de TOUS les produits pour le client:', { clientId, simulationId, produitIdsEligibles });

    // 1. Récupérer TOUS les 10 produits actifs de la BDD
    const { data: tousProduits, error: produitsError } = await supabase
      .from('ProduitEligible')
      .select('id, nom')
      .eq('active', true)
      .order('nom');

    if (produitsError || !tousProduits) {
      console.error('❌ Erreur récupération produits:', produitsError);
      throw produitsError;
    }

    console.log(`📦 ${tousProduits.length} produits actifs trouvés dans la BDD`);

    // 2. Créer les entrées pour TOUS les produits
    const produitsToInsert = tousProduits.map((produit, index) => {
      const isEligible = produitIdsEligibles.includes(produit.id);
      const eligibleIndex = produitIdsEligibles.indexOf(produit.id);
      
      return {
        clientId,
        produitId: produit.id,
        statut: isEligible ? 'eligible' : 'non_eligible',
        priorite: isEligible ? (eligibleIndex + 1) : (index + 10), // Éligibles en premier
        notes: isEligible 
          ? 'Produit détecté comme éligible via simulation' 
          : 'Produit non éligible selon simulation - Contactez un expert pour plus d\'informations',
        metadata: {
          source: 'simulation',
          simulation_id: simulationId,
          detected_at: new Date().toISOString(),
          is_eligible: isEligible,
          priority_label: isEligible 
            ? (eligibleIndex === 0 ? 'high' : eligibleIndex < 3 ? 'medium' : 'low')
            : 'none',
          eligibility_rank: isEligible ? (eligibleIndex + 1) : null
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    // 3. Insérer TOUS les produits
    const { error } = await supabase
      .from('ClientProduitEligible')
      .insert(produitsToInsert);

    if (error) {
      console.error('❌ Erreur lors de l\'enregistrement des produits:', error);
      throw error;
    }

    const nbEligibles = produitsToInsert.filter(p => p.statut === 'eligible').length;
    const nbNonEligibles = produitsToInsert.filter(p => p.statut === 'non_eligible').length;
    
    console.log(`✅ ${produitsToInsert.length} produits enregistrés avec succès:`);
    console.log(`   - ${nbEligibles} éligibles`);
    console.log(`   - ${nbNonEligibles} non éligibles`);
    console.log(`   - Source: simulation`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement des produits:', error);
    throw error;
  }
}

// Fonction pour générer l'export Excel
async function generateExcelExport(products: any[], answers: any, simulation: any): Promise<Buffer> {
  // Implémentation simplifiée - retourner un buffer vide pour l'instant
  return Buffer.from('Export Excel - À implémenter');
}

// Fonction pour générer l'export PDF
async function generatePDFExport(products: any[], answers: any, simulation: any): Promise<Buffer> {
  // Implémentation simplifiée - retourner un buffer vide pour l'instant
  return Buffer.from('Export PDF - À implémenter');
}

// Fonction pour générer l'export Word
async function generateWordExport(products: any[], answers: any, simulation: any): Promise<Buffer> {
  // Implémentation simplifiée - retourner un buffer vide pour l'instant
  return Buffer.from('Export Word - À implémenter');
}

export default router;