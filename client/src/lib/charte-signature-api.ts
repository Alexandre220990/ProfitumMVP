import { post, get } from './api';
import { 
  CharteSignatureApiResponse, 
  CharteSignatureCheckResponse, 
  CharteSignatureRequest 
} from '@/types/api';

/**
 * Enregistre une signature de charte
 * @param data - Données de la signature
 * @returns Promise avec la réponse de l'API
 */
export const signCharte = async (data: CharteSignatureRequest): Promise<CharteSignatureApiResponse> => {
  return await post<CharteSignatureApiResponse['data']>('/charte-signature', data);
};

/**
 * Vérifie si une signature de charte existe pour un produit éligible
 * @param clientProduitEligibleId - ID du ClientProduitEligible
 * @returns Promise avec la réponse de l'API
 */
export const checkCharteSignature = async (clientProduitEligibleId: string): Promise<CharteSignatureCheckResponse> => {
  return await get<CharteSignatureCheckResponse['data']>(`/charte-signature/${clientProduitEligibleId}`);
};

/**
 * Récupère l'adresse IP du client (pour l'audit)
 * @returns L'adresse IP ou null si non disponible
 */
export const getClientIP = (): string | null => {
  // Cette fonction peut être étendue pour récupérer l'IP via un service externe
  // Pour l'instant, on retourne null car l'IP sera récupérée côté serveur
  return null;
};

/**
 * Récupère l'User-Agent du navigateur
 * @returns L'User-Agent ou null si non disponible
 */
export const getClientUserAgent = (): string | null => {
  return navigator.userAgent || null;
}; 