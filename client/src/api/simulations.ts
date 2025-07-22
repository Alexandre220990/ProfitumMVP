import { Question, SimulationResult } from "../types/database";
import { ApiError, ApiErrorType, StoredAnswer } from "../types/chatbot";
import { API_URL } from "../config";

/**
 * Vérifie si une simulation récente existe pour un client
 * @param clientId - L'identifiant du client
 * @returns Un objet indiquant l'existence, l'id de la simulation, l'index de la question courante et les réponses
 */
export const checkRecentSimulation = async (clientId: string): Promise<{ exists: boolean; 
  simulationId: number | null;
  currentQuestionIndex: number;
  answers: StoredAnswer[]; }> => { try {
    const response = await fetch(`${API_URL}/api/simulations/check-recent/${clientId}`);
    if (!response.ok) { if (response.status === 404) {
        return { exists: false, simulationId: null, currentQuestionIndex: 0, answers: [] };
      }
      throw createApiError(response);
    }
    const data = await response.json();
    return { exists: true, simulationId: data.simulationId, currentQuestionIndex: data.currentQuestionIndex, answers: data.answers || [] };
  } catch (error) { console.error('Erreur lors de la vérification de simulation récente: ', error);
    return { exists: false, simulationId: null, currentQuestionIndex: 0, answers: [] };
  }
};

/**
 * Récupère les questions pour une simulation
 * @returns Un tableau de questions
 */
export const fetchQuestions = async (): Promise<Question[]> => { try {
    const response = await fetch(`${API_URL}/api/simulations/questions`);
    if (!response.ok) {
      throw createApiError(response); }
    return await response.json();
  } catch (error) { console.error('Erreur lors de la récupération des questions: ', error);
    throw error; }
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
  result?: SimulationResult; }> => { try {
    const response = await fetch(`${API_URL}/api/simulations/answer`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ simulationId, questionId, answer })
    });
    if (!response.ok) { throw createApiError(response); }
    return await response.json();
  } catch (error) { console.error('Erreur lors de l\'envoi de la réponse: ', error);
    throw error; }
};

/**
 * Crée une nouvelle simulation
 * @param clientId - L'identifiant du client
 * @returns L'identifiant de la nouvelle simulation
 */
export const createSimulation = async (clientId: string): Promise<{ simulationId: number }> => { try {
    const response = await fetch(`${API_URL}/api/simulations/create`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId })
    });
    if (!response.ok) { throw createApiError(response); }
    return await response.json();
  } catch (error) { console.error('Erreur lors de la création de la simulation: ', error);
    throw error; }
};

/**
 * Crée une erreur API typée à partir d'une réponse
 * @param response - La réponse fetch
 * @returns Un objet ApiError typé
 */
const createApiError = (response: Response): ApiError => { let type = ApiErrorType.UNKNOWN;
  let message = 'Une erreur inattendue est survenue';
  if (response.status === 408 || response.status === 504) {
    type = ApiErrorType.TIMEOUT;
    message = 'Le serveur met trop de temps à répondre'; } else if (response.status >= 500) { type = ApiErrorType.SERVER_ERROR;
    message = 'Erreur serveur, nous travaillons à la résoudre'; } else if (response.status === 400) { type = ApiErrorType.VALIDATION_ERROR;
    message = 'Données invalides, veuillez vérifier'; } else if (response.status === 0) { type = ApiErrorType.NETWORK_ERROR;
    message = 'Problème de connexion, vérifiez votre connexion internet'; }
  return { type, message, originalError: response };
}; 