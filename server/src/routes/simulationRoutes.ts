import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
// Import traiterSimulation supprimé - utilise maintenant les fonctions SQL
import { Database } from '../types/supabase';
import * as dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { RealTimeProcessor } from '../services/realTimeProcessor';

dotenv.config();

const router = Router();

// Configuration Supabase avec validation stricte
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis');
}

console.log(`SimulationRoutes - Initialisation Supabase avec URL: ${supabaseUrl}`);
console.log(`SimulationRoutes - Utilisation de la clé API: ${supabaseKey.substring(0, 20)}...`);

const supabase = createClient<Database>(supabaseUrl, supabaseKey);



// Route pour récupérer les questions
router.get('/questions', async (req: Request, res: Response) => {
  try {
    console.log('Récupération des questions de simulation (QuestionnaireQuestion)');
    
    const { data: questions, error } = await supabase
      .from('QuestionnaireQuestion')
      .select('*')
      .order('question_order', { ascending: true });

    if (error) {
      console.error('Erreur Supabase lors de la récupération des questions:', error);
      throw error;
    }

    console.log(`${questions?.length || 0} questions récupérées`);

    // Transformer les questions pour le format attendu par le front
    const formattedQuestions = questions.map(q => ({
      id: q.id,
      texte: q.question_text,
      type: q.question_type,
      ordre: q.question_order,
      categorie: q.category || 'general',
      options: q.response_options || {},
      description: q.help_text || '',
      importance: 5 // Valeur par défaut
    }));

    return res.json({
      success: true,
      data: formattedQuestions
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des questions:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Route pour créer une nouvelle simulation
router.post('/', async (req: Request, res: Response) => {
  try {
    const { client_id, answers } = req.body;
    
    if (!client_id) {
      return res.status(400).json({
        success: false,
        message: "L'ID du client est requis"
      });
    }

    // Initialiser CheminParcouru avec structure appropriée
    const cheminParcouruInitial = {
      etapes: [],
      temps_par_question: {},
      date_debut: new Date().toISOString(),
      retours_arriere: []
    };

    // Créer la simulation avec l'approche hybride
    const { data: simulation, error: simulationError } = await supabase
      .from('simulations')
      .insert({
        client_id: client_id,
        CheminParcouru: cheminParcouruInitial,
        Answers: answers || {},
        statut: 'en_cours',
        dateCreation: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (simulationError || !simulation) {
      throw simulationError || new Error('Erreur lors de la création de la simulation');
    }

    // Traiter la simulation si des réponses sont fournies
    if (answers && Object.keys(answers).length > 0) {
      try {
        // Utiliser la fonction SQL pour calculer l'éligibilité
        const { data: resultatsSQL } = await supabase
          .rpc('evaluer_eligibilite_avec_calcul', {
            p_simulation_id: simulation.id
          });
        
        console.log(`Simulation ${simulation.id} calculée avec succès (${resultatsSQL?.total_eligible || 0} éligibles)`);
      } catch (error) {
        console.error('Erreur lors du traitement de la simulation:', error);
        // On continue même si le traitement échoue
      }
    }

    return res.json({
      success: true,
      data: {
        simulation,
        message: 'Simulation créée avec succès'
      }
    });

  } catch (error) {
    console.error('Erreur lors de la création de la simulation:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Route pour terminer une simulation
router.post('/:id/terminer', async (req: Request, res: Response) => {
  try {
    const simulationId = parseInt(req.params.id);
    
    if (isNaN(simulationId)) {
      return res.status(400).json({
        success: false,
        message: "ID de simulation invalide"
      });
    }

    // Mettre à jour le statut de la simulation
    const { error: updateError } = await supabase
      .from('simulations')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', simulationId);

    if (updateError) {
      throw updateError;
    }

    // Traiter la simulation avec fonction SQL
    const { data: resultatsSQL } = await supabase
      .rpc('evaluer_eligibilite_avec_calcul', {
        p_simulation_id: simulationId
      });
    
    console.log(`Simulation ${simulationId} calculée: ${resultatsSQL?.total_eligible || 0} produits éligibles`);

    return res.json({
      success: true,
      message: 'Simulation terminée et traitée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la terminaison de la simulation:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Route pour sauvegarder les réponses (APPROCHE HYBRIDE)
router.post('/:id/answers', async (req: Request, res: Response) => {
  try {
    const simulationId = parseInt(req.params.id);
    const { answers } = req.body;
    
    if (isNaN(simulationId)) {
      return res.status(400).json({
        success: false,
        message: "ID de simulation invalide"
      });
    }

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({
        success: false,
        message: "Format de réponses invalide"
      });
    }

    // Sauvegarder les réponses directement dans simulations.answers (JSON)
    const { error: updateError } = await supabase
      .from('simulations')
      .update({
        answers: answers,
        updated_at: new Date().toISOString()
      })
      .eq('id', simulationId);

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Réponses sauvegardées (hybride) pour simulation ${simulationId}: ${Object.keys(answers).length} questions`);

    return res.json({
      success: true,
      message: 'Réponses sauvegardées avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la sauvegarde des réponses:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Route pour récupérer les réponses d'une simulation (APPROCHE HYBRIDE - Performance)
router.get('/:id/answers', async (req: Request, res: Response) => {
  try {
    const simulationId = parseInt(req.params.id);
    
    if (isNaN(simulationId)) {
      return res.status(400).json({
        success: false,
        message: "ID de simulation invalide"
      });
    }

    // OPTIMISATION : Récupérer directement depuis le JSON answers (plus rapide)
    const { data: simulation, error: selectError } = await supabase
      .from('simulations')
      .select('answers, results')
      .eq('id', simulationId)
      .single();

    if (selectError) {
      throw selectError;
    }

    if (!simulation) {
      return res.status(404).json({
        success: false,
        message: "Simulation non trouvée"
      });
    }

    return res.json({
      success: true,
      data: {
        answers: simulation.answers || {},
        results: simulation.results || {}
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des réponses:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Route pour analyser les réponses et récupérer les produits éligibles
router.post('/analyser-reponses', async (req: Request, res: Response) => {
  try {
    const { answers, simulationId } = req.body;
    
    console.log('📊 Analyse des réponses - simulationId:', simulationId);
    console.log('📊 Nombre de réponses:', answers ? Object.keys(answers).length : 0);

    if (!simulationId) {
      // Si pas de simulationId fourni, chercher la dernière simulation du client
      // Récupérer le token JWT pour obtenir le client_id
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: 'Token d\'authentification requis'
        });
      }

      const token = authHeader.split(' ')[1];
      let decoded: any;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Token invalide'
        });
      }

      // Récupérer la dernière simulation du client
      const { data: lastSimulation, error: simError } = await supabase
        .from('simulations')
        .select('id, client_id')
        .eq('client_id', decoded.database_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (simError || !lastSimulation) {
        console.error('❌ Erreur récupération simulation:', simError);
        return res.status(404).json({
          success: false,
          message: 'Aucune simulation trouvée pour ce client'
        });
      }

      const clientId = lastSimulation.client_id;
      console.log('🔍 Client ID:', clientId);

      // Récupérer les ClientProduitEligible pour ce client
      const { data: clientProduits, error: cpError } = await supabase
        .from('ClientProduitEligible')
        .select(`
          id,
          clientId,
          produitId,
          statut,
          tauxFinal,
          montantFinal,
          dureeFinale,
          priorite,
          notes,
          metadata,
          dateEligibilite,
          created_at,
          ProduitEligible:produitId (
            id,
            nom,
            categorie,
            description,
            montant_min,
            montant_max,
            taux_min,
            taux_max
          )
        `)
        .eq('clientId', clientId)
        .eq('simulationId', lastSimulation.id)
        .eq('statut', 'eligible')
        .order('priorite', { ascending: true });

      if (cpError) {
        console.error('❌ Erreur récupération ClientProduitEligible:', cpError);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la récupération des produits éligibles'
        });
      }

      const products = (clientProduits || []).map((cp: any) => ({
        id: cp.id,
        produitId: cp.produitId,
        tauxFinal: cp.tauxFinal || 0,
        montantFinal: cp.montantFinal || 0,
        dureeFinale: cp.dureeFinale || 12,
        statut: cp.statut,
        priorite: cp.priorite,
        notes: cp.notes,
        metadata: cp.metadata,
        dateEligibilite: cp.dateEligibilite,
        produit: {
          id: cp.ProduitEligible?.id || cp.produitId,
          nom: cp.ProduitEligible?.nom || 'Produit',
          description: cp.ProduitEligible?.description || '',
          categorie: cp.ProduitEligible?.categorie || ''
        }
      }));

      console.log(`✅ ${products.length} produits éligibles trouvés`);

      return res.json({
        success: true,
        data: {
          products: products
        }
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Paramètres insuffisants'
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse des réponses:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Route pour traiter une réponse en temps réel (APPROCHE HYBRIDE)
router.post('/:id/answer', async (req: Request, res: Response) => {
  try {
    const simulationId = parseInt(req.params.id);
    const { questionId, answer, timestamp } = req.body;
    
    if (isNaN(simulationId)) {
      return res.status(400).json({
        success: false,
        message: "ID de simulation invalide"
      });
    }

    if (!questionId || !answer) {
      return res.status(400).json({
        success: false,
        message: "questionId et answer sont requis"
      });
    }

    // ÉTAPE 1 : Récupérer la simulation actuelle
    const { data: currentSim } = await supabase
      .from('simulations')
      .select('answers, metadata')
      .eq('id', simulationId)
      .single();

    // ÉTAPE 2 : Mettre à jour answers (JSON) pour récupération rapide
    const updatedAnswers = {
      ...(currentSim?.answers || {}),
      [questionId]: answer
    };

    // ÉTAPE 4 : Mettre à jour metadata avec métadonnées du parcours
    const metadata = currentSim?.metadata || { etapes: [], temps_par_question: {} };
    metadata.etapes = [...(metadata.etapes || []), {
      questionId,
      timestamp: timestamp || new Date().toISOString(),
      valeur: answer
    }];
    metadata.temps_par_question = {
      ...(metadata.temps_par_question || {}),
      [questionId]: timestamp || new Date().toISOString()
    };

    // Mettre à jour la simulation
    await supabase
      .from('simulations')
      .update({
        answers: updatedAnswers,
        metadata: metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', simulationId);

    // ÉTAPE 3 : Traiter avec le processeur en temps réel (si disponible)
    try {
      const realTimeProcessor = new RealTimeProcessor();
      await realTimeProcessor.processAnswer(simulationId.toString(), {
        questionId,
        value: answer,
        timestamp: new Date(timestamp)
      });
    } catch (processorError) {
      console.warn('Processeur temps réel non disponible ou erreur:', processorError);
      // On continue même si le processeur échoue
    }

    // Récupérer la simulation mise à jour
    const { data: simulation, error: simError } = await supabase
      .from('simulations')
      .select('answers, metadata, status')
      .eq('id', simulationId)
      .single();

    if (simError) {
      throw simError;
    }

    // Vérifier si la simulation est terminée (toutes les questions répondues)
    const isComplete = simulation.status === 'completed' && 
                      simulation.answers && 
                      Object.keys(simulation.answers).length > 0;

    return res.json({
      success: true,
      simulationComplete: isComplete,
      result: isComplete ? {
        answers: simulation.answers,
        metadata: simulation.metadata
      } : null
    });

  } catch (error) {
    console.error('Erreur lors du traitement de la réponse:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

export default router; 