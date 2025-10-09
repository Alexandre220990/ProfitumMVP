import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { traiterSimulation } from '../services/simulationProcessor';
import { Database } from '../types/supabase';
import * as dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { RealTimeProcessor } from '../services/realTimeProcessor';

dotenv.config();

const router = Router();

// Configuration Supabase avec les valeurs exactes fournies
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
// Utiliser la clé anon public pour les opérations côté client
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3Njk4NDksImV4cCI6MjA1NzM0NTg0OX0.2hahkZasfMfdFhQvP7rvPHzO1DBCl0FfsRVkxVZfdgk';

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
      .eq('active', true)
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
        await traiterSimulation(simulation.id);
        console.log(`Simulation ${simulation.id} traitée avec succès`);
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

    // Traiter la simulation
    await traiterSimulation(simulationId);

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

    // ÉTAPE 1 : Sauvegarder chaque réponse dans la table Reponse (normalisé)
    const reponsePromises = Object.entries(answers).map(async ([questionId, valeur]) => {
      // Vérifier si la réponse existe déjà
      const { data: existingReponse } = await supabase
        .from('Reponse')
        .select('id')
        .eq('simulationId', simulationId)
        .eq('questionId', parseInt(questionId))
        .single();

      if (existingReponse) {
        // Mettre à jour la réponse existante
        return supabase
          .from('Reponse')
          .update({
            valeur: Array.isArray(valeur) ? valeur[0] : String(valeur),
            updatedAt: new Date().toISOString()
          })
          .eq('id', existingReponse.id);
      } else {
        // Créer une nouvelle réponse
        return supabase
          .from('Reponse')
          .insert({
            simulationId: simulationId,
            questionId: parseInt(questionId),
            valeur: Array.isArray(valeur) ? valeur[0] : String(valeur),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
      }
    });

    await Promise.all(reponsePromises);

    // ÉTAPE 2 : Mettre à jour answers (JSON) dans simulations pour récupération rapide
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

    // ÉTAPE 1 : Sauvegarder dans la table Reponse (normalisé)
    const { data: existingReponse } = await supabase
      .from('Reponse')
      .select('id')
      .eq('simulationId', simulationId)
      .eq('questionId', parseInt(questionId))
      .single();

    if (existingReponse) {
      // Mettre à jour la réponse existante
      await supabase
        .from('Reponse')
        .update({
          valeur: String(answer),
          updatedAt: new Date().toISOString()
        })
        .eq('id', existingReponse.id);
    } else {
      // Créer une nouvelle réponse
      await supabase
        .from('Reponse')
        .insert({
          simulationId: simulationId,
          questionId: parseInt(questionId),
          valeur: String(answer),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
    }

    // ÉTAPE 2 : Récupérer la simulation actuelle
    const { data: currentSim } = await supabase
      .from('simulations')
      .select('answers, metadata')
      .eq('id', simulationId)
      .single();

    // ÉTAPE 3 : Mettre à jour answers (JSON) pour récupération rapide
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

    // ÉTAPE 5 : Traiter avec le processeur en temps réel (si disponible)
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