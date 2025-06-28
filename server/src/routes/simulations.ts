import express, { Response, RequestHandler } from 'express';
import { authMiddleware, getAuthHeaders } from '../middleware/auth';
import { RequestWithUser, AuthUser, BaseUser, UserMetadata } from '../types/auth';
import crypto from 'crypto';
import { supabase } from '../lib/supabase';
const fetch = require('node-fetch');
import { PYTHON_API_URL } from '../config/api';
import jwt from 'jsonwebtoken';

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
const JWT_SECRET = process.env.JWT_SECRET || "EhAhS26BXDsowVPe";

// Route de test pour vérifier les tables
router.get('/test-tables', (async (req, res) => {
  const typedReq = req as RequestWithUser;
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
          // Ne pas écraser le statut si l'échantillonnage échoue
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
    
    res.json({
      success: true,
      data: results,
      message: 'Test des tables terminé'
    });
  } catch (error) {
    console.error('Erreur lors du test des tables:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du test des tables',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
}) as RequestHandler);

// Vérifier s'il existe une simulation récente pour le client (SANS AUTHENTIFICATION)
router.get('/check-recent/:clientId', (async (req, res) => {
  try {
    const { clientId } = req.params;
    console.log('🔍 Vérification simulation récente pour le client:', clientId);
    
    // Rechercher les simulations des 24 dernières heures
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Vérifier d'abord dans la table Simulation
    const { data: recentSimulations, error } = await supabase
      .from('Simulation')
      .select('*')
      .eq('clientId', clientId)
      .gt('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('❌ Erreur Supabase Simulation:', error);
      throw error;
    }

    // Vérifier également dans la table SimulationProcessed
    const { data: recentProcessed, error: processedError } = await supabase
      .from('SimulationProcessed')
      .select('*')
      .eq('clientid', clientId)
      .gt('createdat', yesterday.toISOString())
      .order('createdat', { ascending: false })
      .limit(1);
    
    if (processedError) {
      console.error('⚠️ Erreur lors de la vérification des simulations traitées:', processedError);
      // Ne pas interrompre le flux si cette requête échoue
    }

    // Déterminer s'il y a une simulation récente
    const hasRecentSimulation = 
      (recentSimulations && recentSimulations.length > 0) || 
      (recentProcessed && recentProcessed.length > 0);

    console.log('✅ Vérification terminée:', {
      hasRecentSimulation,
      simulationFound: recentSimulations?.length > 0,
      processedFound: Array.isArray(recentProcessed) && recentProcessed.length > 0
    });

    // Formater la réponse
    res.json({
      success: true,
      hasRecentSimulation,
      data: {
        simulation: recentSimulations?.[0] || null,
        processed: recentProcessed?.[0] || null
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des simulations récentes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des simulations récentes',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
}) as RequestHandler);

// Route pour créer ou récupérer une simulation
router.post('/', authMiddleware, (async (req, res) => {
  const typedReq = req as RequestWithUser;
  try {
    console.log('[POST /api/simulations] Requête reçue');
    console.log('Headers:', req.headers);
    console.log('Body reçu:', req.body);

    const { client_id } = req.body;

    if (!client_id) {
      console.log('❌ Client ID manquant');
      return res.status(400).json({ 
        success: false, 
        message: "L'ID du client est requis" 
      });
    }

    // Vérifier que l'utilisateur a le droit de créer une simulation pour ce client
    if (typedReq.user?.id !== client_id) {
      console.log('❌ Accès non autorisé');
      return res.status(403).json({ 
        success: false, 
        message: "Accès non autorisé" 
      });
    }

    console.log(`[POST /api/simulations] Client ID reçu : ${client_id}`);
    
    // Créer une nouvelle simulation
    const now = new Date().toISOString();
    
    const { data: simulation, error } = await supabase
      .from('Simulation')
      .insert({
        clientId: client_id,
        statut: 'en_cours',
        dateCreation: now,
        createdAt: now,
        updatedAt: now
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erreur lors de la création de la simulation:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la simulation'
      });
    }
    
    console.log('✅ Simulation créée:', simulation);
    
    return res.status(200).json({
      success: true,
      data: {
        simulation,
        message: 'Simulation créée avec succès'
      }
    });
  } catch (error) {
    console.error('❌ Exception générale dans POST /api/simulations:', error);
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur inconnue lors du traitement de la demande'
    });
  }
}) as RequestHandler);

// Fonction pour enregistrer une simulation traitée
async function enregistrerSimulationTraitee(
  clientId: string,
  simulationId: number, // L'ID généré par PostgreSQL
  produitsEligiblesIds: string[],
  produitsDetails: any[],
  rawAnswers: any,
  score: number,
  dureeAnalyseMs: number
) {
  try {
    console.log(`Enregistrement de la simulation traitée ${simulationId} pour le client ${clientId}`);
    
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('SimulationProcessed')
      .insert({
        clientid: clientId,
        simulationid: simulationId,
        dateprocessed: now,
        produitseligiblesids: produitsEligiblesIds,
        produitsdetails: produitsDetails,
        rawanswers: rawAnswers,
        score: score,
        dureeanalysems: dureeAnalyseMs,
        statut: 'completed',
        createdat: now,
        updatedat: now
      })
      .select()
      .single();
      
    if (error) {
      console.error('Erreur lors de l\'enregistrement de la simulation traitée:', error);
      return null;
    }
    
    console.log('Simulation traitée enregistrée avec succès:', data);
    return data;
  } catch (error) {
    console.error('Exception lors de l\'enregistrement de la simulation traitée:', error);
    return null;
  }
}

// Récupérer les simulations d'un client
router.get('/client/:clientId', authMiddleware, (async (req, res) => {
  const typedReq = req as RequestWithUser;
  try {
    if (!typedReq.user) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }
    
    if (typedReq.params.clientId !== typedReq.user.id && typedReq.user.type !== 'expert') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    // Récupérer les simulations avec leurs résultats associés
    const { data: simulations, error } = await supabase
      .from('Simulation')
      .select(`
        *,
        SimulationResult (*)
      `)
      .eq('clientId', typedReq.params.clientId)
      .order('createdAt', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: simulations
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des simulations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des simulations'
    });
  }
}) as RequestHandler);

// Fonction pour déterminer les produits éligibles en fonction des réponses
async function determinerProduitsEligibles(answers: any): Promise<string[]> {
  try {
    console.log('Analyse des réponses pour déterminer les produits éligibles:', answers);

    // Vérification de sécurité pour s'assurer que answers est un objet
    if (!answers || typeof answers !== 'object') {
      console.warn('Format des réponses invalide, utilisation de la logique de secours');
      answers = {};
    }

    console.log('Appel à l\'API Python pour déterminer les produits éligibles');

    const response = await fetch(`${PYTHON_API_URL}/analyse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ answers })
    });

    if (!response.ok) {
      console.error('Erreur de l\'API Python:', response.statusText);
      throw new Error('Échec de l\'analyse via l\'API Python');
    }

    const result = await response.json() as PythonAnalyseResponse;
    console.log('Résultat reçu de l\'API Python:', result);

    // Correction du typage avec l'interface définie
    const eligibleProduitIds = result && Array.isArray(result.eligibleProduitIds) 
      ? result.eligibleProduitIds 
      : [];
      
    if (eligibleProduitIds.length === 0) {
      console.warn('Aucun produit éligible retourné par l\'API Python ou format invalide');
    }

    return eligibleProduitIds;
  } catch (error) {
    console.error('Erreur lors de la détermination des produits éligibles:', error);
    // En cas d'erreur, renvoyer un tableau vide
    return [];
  }
}

// Fonction utilitaire pour extraire les réponses en tant qu'array
function extractArrayOrString(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return [value];
  return [];
}

// Récupérer la liste des questions pour le simulateur
router.get('/questions', (async (req, res) => {
  const typedReq = req as RequestWithUser;
  try {
    console.log('📩 GET /api/simulations/questions appelée');
    
    // Version simplifiée retournant des données statiques
    const questionsStatiques = [
      {
        id: 1,
        texte: 'Quel est le chiffre d\'affaires annuel de votre entreprise ?',
        type: 'nombre',
        ordre: 1,
        categorie: 'finance',
        options: {
          min: 0,
          max: 100000000,
          unite: '€'
        },
        description: 'Indiquez le montant hors taxes du dernier exercice fiscal.',
        importance: 3
      },
      {
        id: 2,
        texte: 'Combien d\'employés compte votre entreprise ?',
        type: 'nombre',
        ordre: 2,
        categorie: 'rh',
        options: {
          min: 0,
          max: 10000
        },
        description: 'Comptez tous les types de contrats (CDI, CDD, intérim...)',
        importance: 2
      },
      {
        id: 3,
        texte: 'Quel est votre secteur d\'activité principal ?',
        type: 'choix_unique',
        ordre: 3,
        categorie: 'general',
        options: {
          choix: [
            'Agriculture',
            'Industrie',
            'Construction',
            'Commerce',
            'Services',
            'Autre'
          ]
        },
        importance: 3
      },
      {
        id: 4,
        texte: 'Quels types de véhicules utilisez-vous dans votre activité ?',
        type: 'choix_multiple',
        ordre: 4,
        categorie: 'transport',
        options: {
          choix: [
            'Véhicules légers',
            'Utilitaires',
            'Poids lourds',
            'Engins de chantier',
            'Aucun'
          ]
        },
        description: 'Sélectionnez tous les types applicables.',
        importance: 2
      }
    ];

    console.log(`✅ ${questionsStatiques.length} questions statiques préparées`);
    
    // Renvoyer les données au client
    return res.json({
      success: true,
      data: questionsStatiques
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des questions:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur inconnue lors de la récupération des questions'
    });
  }
}) as RequestHandler);

export default router;