/**
 * Interface générique pour toutes les réponses API
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Interface pour les réponses d'erreur API
 */
export interface ApiError {
  success: false;
  message: string;
  error?: unknown;
} 