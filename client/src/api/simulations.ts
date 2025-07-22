import { Question, SimulationResult } from "../types/database";
import api from "../lib/api";

// Types pour les réponses de simulation
interface StoredAnswer {
  questionId: number;
  answer: string;
}

/**
 * Vérifie si une simulation récente existe pour un client
 * @param clientId - L'identifiant du client
 * @returns Un objet indiquant l'existence, l'id de la simulation, l'index de la question courante et les réponses
 */
export const checkRecentSimulation = async (clientId: string): Promise<{ exists: boolean; 
  simulationId: number | null;
  currentQuestionIndex: number;
  answers: StoredAnswer[]; }> => { 
  try {
    const response = await api.get(`/api/simulations/check-recent/${clientId}`);
    
    if (response.data.success) {
      return { 
        exists: response.data.hasRecentSimulation, 
        simulationId: response.data.data?.simulation?.id || null, 
        currentQuestionIndex: 0, 
        answers: [] 
      };
    } else {
      return { exists: false, simulationId: null, currentQuestionIndex: 0, answers: [] };
    }
  } catch (error: any) { 
    console.error('Erreur lors de la vérification de simulation récente: ', error);
    
    // Si c'est une erreur 401, l'utilisateur n'est pas authentifié
    if (error.response?.status === 401) {
      console.log('⚠️ Utilisateur non authentifié pour la vérification de simulation');
    }
    
    return { exists: false, simulationId: null, currentQuestionIndex: 0, answers: [] };
  }
};

/**
 * Récupère les questions pour une simulation
 * @returns Un tableau de questions
 */
export const fetchQuestions = async (): Promise<Question[]> => { 
  try {
    const response = await api.get('/api/simulations/questions');
    return response.data;
  } catch (error) { 
    console.error('Erreur lors de la récupération des questions: ', error);
    throw error; 
  }
};

/**
 * Envoie une réponse à une question
 * @param simulationId - L'identifiant de la simulation
 * @param questionId - L'identifiant de la question
 * @param answer - La réponse à envoyer
 * @returns Un objet indiquant si la simulation est terminée et le résultat éventuel
 */
export const sendAnswer = async (
  simulationId: number | null,
  questionId: number,
  answer: string
): Promise<{ simulationComplete: boolean;
  result?: SimulationResult; }> => { 
  try {
    const response = await api.post('/api/simulations/answer', {
      simulationId, questionId, answer
    });
    return response.data;
  } catch (error) { 
    console.error('Erreur lors de l\'envoi de la réponse: ', error);
    throw error; 
  }
};

/**
 * Crée une nouvelle simulation
 * @param clientId - L'identifiant du client
 * @returns L'identifiant de la nouvelle simulation
 */
export const createSimulation = async (clientId: string): Promise<{ simulationId: number }> => { 
  try {
    const response = await api.post('/api/simulations/create', { clientId });
    return response.data;
  } catch (error) { 
    console.error('Erreur lors de la création de la simulation: ', error);
    throw error; 
  }
};

 