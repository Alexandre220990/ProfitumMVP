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
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3Njk4NDksImV4cCI6MjA1NzM0NTg0OX0.2hahkZasfMfdFhQvP7rvPHzO1DBCl0FfsRVkxVZfdgk';

console.log(`SimulationRoutes - Initialisation Supabase avec URL: ${supabaseUrl}`);
console.log(`SimulationRoutes - Utilisation de la clé API: ${supabaseKey.substring(0, 20)}...`);

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Middleware d'authentification
const authenticateUser = async (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    
    // Vérifier l'existence de l'utilisateur dans Supabase par email
    const { data: user, error } = await supabase
      .from('Client')
      .select('*')
      .eq('email', (decoded as any).email)
      .single();
      
    if (error || !user) {
      // Essayer dans la table Expert
      const { data: expert, error: expertError } = await supabase
        .from('Expert')
        .select('*')
        .eq('email', (decoded as any).email)
        .single();
        
      if (expertError || !expert) {
        return res.status(403).json({ message: 'Utilisateur non trouvé' });
      }
      
      (req as any).user = expert;
    } else {
      (req as any).user = user;
    }
    
    next();
    return;
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide' });
  }
};

// Route pour récupérer les questions
router.get('/questions', authenticateUser, async (req: Request, res: Response) => {
  try {
    console.log('Récupération des questions de simulation');
    
    const { data: questions, error } = await supabase
      .from('Question')
      .select('*')
      .order('ordre', { ascending: true });

    if (error) {
      console.error('Erreur Supabase lors de la récupération des questions:', error);
      throw error;
    }

    console.log(`${questions?.length || 0} questions récupérées`);

    // Normaliser les options des questions
    const normalizedQuestions = questions.map(q => {
      // Si options est déjà un objet et non un tableau, on garde tel quel
      if (
        q.options &&
        typeof q.options === "object" &&
        !Array.isArray(q.options)
      ) {
        return q;
      }

      // Sinon, si c'est une question à choix avec un tableau brut, on transforme
      if (
        (q.type === "choix_unique" || q.type === "choix_multiple") &&
        Array.isArray(q.options)
      ) {
        return {
          ...q,
          options: {
            choix: q.options
          }
        };
      }

      // Sinon, pas d'options
      return {
        ...q,
        options: {}
      };
    });

    // Transformer les questions pour le format attendu par le front
    const formattedQuestions = normalizedQuestions.map(q => ({
      id: q.id,
      texte: q.texte,
      type: q.type,
      ordre: q.ordre,
      categorie: q.categorie,
      options: q.options,
      description: q.description,
      importance: q.importance
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
router.post('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { client_id, answers } = req.body;
    
    if (!client_id) {
      return res.status(400).json({
        success: false,
        message: "L'ID du client est requis"
      });
    }

    // Créer la simulation
    const { data: simulation, error: simulationError } = await supabase
      .from('Simulation')
      .insert({
        clientId: client_id,
        cheminParcouru: answers || {},
        statut: 'en_cours',
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
router.post('/:id/terminer', authenticateUser, async (req: Request, res: Response) => {
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
      .from('Simulation')
      .update({
        statut: 'terminé',
        updatedAt: new Date().toISOString()
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

// Route pour sauvegarder les réponses
router.post('/:id/answers', authenticateUser, async (req: Request, res: Response) => {
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

    // Mettre à jour les réponses dans la table Simulation
    const { error: updateError } = await supabase
      .from('Simulation')
      .update({
        Answers: answers,
        updatedAt: new Date().toISOString()
      })
      .eq('id', simulationId);

    if (updateError) {
      throw updateError;
    }

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

// Route pour récupérer les réponses d'une simulation
router.get('/:id/answers', authenticateUser, async (req: Request, res: Response) => {
  try {
    const simulationId = parseInt(req.params.id);
    
    if (isNaN(simulationId)) {
      return res.status(400).json({
        success: false,
        message: "ID de simulation invalide"
      });
    }

    // Récupérer les réponses
    const { data: reponses, error: selectError } = await supabase
      .from('Reponse')
      .select('questionId, valeur')
      .eq('simulationId', simulationId);

    if (selectError) {
      throw selectError;
    }

    // Formater les réponses pour le front
    const formattedAnswers = reponses.reduce((acc, reponse) => {
      acc[reponse.questionId] = [reponse.valeur];
      return acc;
    }, {} as Record<number, string[]>);

    return res.json({
      success: true,
      data: formattedAnswers
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des réponses:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Route pour traiter une réponse en temps réel
router.post('/:id/answer', authenticateUser, async (req: Request, res: Response) => {
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

    // Créer une instance du processeur en temps réel
    const realTimeProcessor = new RealTimeProcessor();

    // Traiter la réponse
    await realTimeProcessor.processAnswer(simulationId.toString(), {
      questionId,
      value: answer,
      timestamp: new Date(timestamp)
    });

    // Récupérer les produits éligibles mis à jour
    const { data: simulation, error: simError } = await supabase
      .from('chatbotsimulation')
      .select('eligible_products, processing_status')
      .eq('id', simulationId)
      .single();

    if (simError) {
      throw simError;
    }

    // Vérifier si la simulation est terminée
    const isComplete = simulation.processing_status === 'completed' && 
                      simulation.eligible_products && 
                      simulation.eligible_products.length > 0;

    return res.json({
      success: true,
      simulationComplete: isComplete,
      result: isComplete ? {
        produits: simulation.eligible_products
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