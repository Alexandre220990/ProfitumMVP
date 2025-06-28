import { API_URL } from '../config';
import { 
  ApiError, 
  StartSessionResponse, 
  UpdateSessionPayload, 
  CompleteSessionPayload,
  ApiErrorType 
} from '../types/chatbot';

/**
 * Crée une erreur API typée
 */
const createApiError = (error: unknown): ApiError => {
  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      return { type: ApiErrorType.TIMEOUT, message: 'La requête a expiré' };
    }
    if (error.message.includes('network')) {
      return { type: ApiErrorType.NETWORK_ERROR, message: 'Erreur de connexion' };
    }
  }
  return { 
    type: ApiErrorType.UNKNOWN, 
    message: 'Une erreur inattendue est survenue',
    originalError: error 
  };
};

/**
 * Démarre une nouvelle session de chatbot
 */
export const startChatbotSession = async (clientId: string): Promise<StartSessionResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/chatbot/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId })
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors du démarrage de la session');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors du démarrage de la session:', error);
    throw createApiError(error);
  }
};

/**
 * Met à jour une session existante
 */
export const updateChatbotSession = async (
  sessionId: string,
  payload: UpdateSessionPayload
): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/api/chatbot/update/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la mise à jour de la session');
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la session:', error);
    throw createApiError(error);
  }
};

/**
 * Termine une session de chatbot
 */
export const completeChatbotSession = async (
  sessionId: string,
  payload: CompleteSessionPayload
): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/api/chatbot/complete/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la finalisation de la session');
    }
  } catch (error) {
    console.error('Erreur lors de la finalisation de la session:', error);
    throw createApiError(error);
  }
};

/**
 * Récupère une session existante
 */
export const getChatbotSession = async (sessionId: string): Promise<StartSessionResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/chatbot/session/${sessionId}`);
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération de la session');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération de la session:', error);
    throw createApiError(error);
  }
}; 