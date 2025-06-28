/**
 * État complet du chatbot
 */
export interface ChatbotState {
  simulationId: string | null;
  currentQuestionIndex: number;
  messages: Message[];
  answers: StoredAnswer[];
  created_at: string;
  updated_at: string;
}

/**
 * Message dans la conversation
 */
export interface Message {
  text: string;
  isUser: boolean;
  time: string;
}

/**
 * Message formaté pour l'API
 */
export interface ApiMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Réponse stockée pour une question
 */
export interface StoredAnswer {
  questionId: number;
  answer: string;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

/**
 * Statut d'une simulation
 */
export enum SimulationStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ERROR = 'error'
}

/**
 * Types d'erreurs API
 */
export enum ApiErrorType {
  TIMEOUT = 'timeout',
  SERVER_ERROR = 'server_error',
  VALIDATION_ERROR = 'validation_error',
  NETWORK_ERROR = 'network_error',
  UNKNOWN = 'unknown'
}

/**
 * Erreur API typée
 */
export interface ApiError {
  type: ApiErrorType;
  message: string;
  originalError?: unknown;
}

/**
 * Réponse API pour la création de session
 */
export interface StartSessionResponse {
  success: boolean;
  data?: {
    id: string;
    client_id: string;
    current_question_index: number;
    messages: Message[];
    answers: StoredAnswer[];
    completed: boolean;
    eligible_products: string[] | null;
    created_at: string;
    updated_at: string;
  };
  error?: ApiError;
}

/**
 * Payload pour la mise à jour de session
 */
export interface UpdateSessionPayload {
  current_question_index: number;
  messages: Message[];
  answers: StoredAnswer[];
}

/**
 * Payload pour terminer une session
 */
export interface CompleteSessionPayload {
  eligible_products: string[];
} 