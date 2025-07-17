import { post, get } from "./api";
import { 
  CharteSignatureApiResponse, 
  CharteSignatureCheckResponse, 
  CharteSignatureRequest,
  CharteSignature,
  CharteSignatureResponse
} from "@/types/api";

// ============================================================================
// CONSTANTES ET CONFIGURATION
// ============================================================================

const API_ENDPOINTS = {
  SIGNATURE: '/charte-signature',
  CHECK: (id: string) => `/charte-signature/${id}`,
} as const;

const CLIENT_INFO = {
  IP_SERVICES: [
    'https://api.ipify.org?format=json',
    'https://ipapi.co/json',
    'https://api.myip.com',
  ],
  TIMEOUT: 5000, // 5 secondes
} as const;

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

interface ClientInfo {
  ip: string | null;
  userAgent: string | null;
  timestamp: string;
  sessionId?: string;
}

interface SignatureMetadata {
  clientInfo: {
    ip: string | null;
    userAgent: {
      userAgent: string | null;
      browserInfo: {
        name: string;
        version: string;
        platform: string;
      };
      deviceType: 'desktop' | 'mobile' | 'tablet';
      platform: string;
      language: string;
      timezone: string;
    };
    timestamp: string;
    sessionId?: string;
  };
  signatureMethod: 'digital' | 'manual';
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browserInfo: {
    name: string;
    version: string;
    platform: string;
  };
}

// ============================================================================
// UTILITAIRES
// ============================================================================

const detectDeviceType = (): 'desktop' | 'mobile' | 'tablet' => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return 'tablet';
  }
  
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(userAgent)) {
    return 'mobile';
  }
  
  return 'desktop';
};

const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';
  let platform = navigator.platform;

  // Détection du navigateur
  if (userAgent.includes('Chrome')) {
    browserName = 'Chrome';
    browserVersion = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.includes('Firefox')) {
    browserName = 'Firefox';
    browserVersion = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.includes('Safari')) {
    browserName = 'Safari';
    browserVersion = userAgent.match(/Version\/(\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.includes('Edge')) {
    browserName = 'Edge';
    browserVersion = userAgent.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
  }

  return { name: browserName, version: browserVersion, platform };
};

const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// ============================================================================
// FONCTIONS PRINCIPALES
// ============================================================================

/**
 * Enregistre une signature de charte avec métadonnées complètes
 * @param data - Données de la signature
 * @param options - Options de signature
 * @returns Promise avec la réponse de l'API
 */
export const signCharte = async (
  data: CharteSignatureRequest,
  options: {
    includeMetadata?: boolean;
    signatureMethod?: 'digital' | 'manual';
    sessionId?: string;
  } = {}
): Promise<CharteSignatureApiResponse> => {
  try {
    const {
      includeMetadata = true,
      signatureMethod = 'digital',
      sessionId = generateSessionId()
    } = options;

    // Préparer les données enrichies
    const enrichedData: CharteSignatureRequest & { metadata?: SignatureMetadata } = {
      ...data,
      ...(includeMetadata && {
        metadata: {
          clientInfo: {
            ip: await getClientIP(),
            userAgent: getClientUserAgent(),
            timestamp: new Date().toISOString(),
            sessionId,
          },
          signatureMethod,
          deviceType: detectDeviceType(),
          browserInfo: getBrowserInfo(),
        }
      })
    };

    const response = await post<CharteSignature>(
      API_ENDPOINTS.SIGNATURE, 
      enrichedData
    );
    
    // Vérifier que la réponse est valide
    if (!response.success || !response.data) {
      throw new Error('Réponse invalide de l\'API de signature');
    }
    
    return {
      success: true,
      data: response.data,
      message: response.message
    } as CharteSignatureApiResponse;

    // Log de l'activité
    console.log('📝 Signature de charte enregistrée:', {
      clientProduitEligibleId: data.clientProduitEligibleId,
      sessionId,
      timestamp: new Date().toISOString(),
    });

    return response;
  } catch (error) {
    console.error('❌ Erreur lors de la signature de charte:', error);
    throw new Error(`Échec de la signature de charte: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

/**
 * Vérifie si une signature de charte existe pour un produit éligible
 * @param clientProduitEligibleId - ID du ClientProduitEligible
 * @param options - Options de vérification
 * @returns Promise avec la réponse de l'API
 */
export const checkCharteSignature = async (
  clientProduitEligibleId: string,
  options: {
    includeDetails?: boolean;
    validateExpiry?: boolean;
  } = {}
): Promise<CharteSignatureCheckResponse> => {
  try {
    const { includeDetails = true, validateExpiry = true } = options;

    const queryParams = new URLSearchParams({
      includeDetails: includeDetails.toString(),
      validateExpiry: validateExpiry.toString(),
    });

    const endpoint = `${API_ENDPOINTS.CHECK(clientProduitEligibleId)}?${queryParams}`;
    
    const response = await get<CharteSignatureResponse>(endpoint);
    
    // Vérifier que la réponse est valide
    if (!response.success || !response.data) {
      throw new Error('Réponse invalide de l\'API de vérification');
    }
    
    return {
      success: true,
      data: response.data,
      message: response.message
    } as CharteSignatureCheckResponse;

    // Log de la vérification
    console.log('🔍 Vérification de signature de charte:', {
      clientProduitEligibleId,
      signed: response.data?.signed,
      timestamp: new Date().toISOString(),
    });

    return response;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de signature:', error);
    throw new Error(`Échec de la vérification de signature: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

/**
 * Récupère l'adresse IP du client via plusieurs services
 * @param options - Options de récupération
 * @returns Promise avec l'adresse IP ou null
 */
export const getClientIP = async (options: {
  timeout?: number;
  fallbackServices?: boolean;
} = {}): Promise<string | null> => {
  const { 
    timeout = CLIENT_INFO.TIMEOUT, 
    fallbackServices = true 
  } = options;

  try {
    // Essayer d'abord le service principal
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(CLIENT_INFO.IP_SERVICES[0], {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return data.ip || null;
    }

    // Si le service principal échoue et que les services de fallback sont activés
    if (fallbackServices) {
      for (let i = 1; i < CLIENT_INFO.IP_SERVICES.length; i++) {
        try {
          const fallbackController = new AbortController();
          const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), timeout);

          const fallbackResponse = await fetch(CLIENT_INFO.IP_SERVICES[i], {
            signal: fallbackController.signal,
          });

          clearTimeout(fallbackTimeoutId);

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            return fallbackData.ip || null;
          }
        } catch (fallbackError) {
          console.warn(`Service de fallback ${i} échoué:`, fallbackError);
          continue;
        }
      }
    }

    return null;
  } catch (error) {
    console.warn('⚠️ Impossible de récupérer l\'IP du client:', error);
    return null;
  }
};

/**
 * Récupère l'User-Agent du navigateur avec informations enrichies
 * @returns L'User-Agent et informations complémentaires
 */
export const getClientUserAgent = (): {
  userAgent: string | null;
  browserInfo: ReturnType<typeof getBrowserInfo>;
  deviceType: ReturnType<typeof detectDeviceType>;
  platform: string;
  language: string;
  timezone: string;
} => {
  return {
    userAgent: navigator.userAgent || null,
    browserInfo: getBrowserInfo(),
    deviceType: detectDeviceType(),
    platform: navigator.platform,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
};

/**
 * Valide une signature de charte côté client
 * @param signature - Signature à valider
 * @returns Résultat de la validation
 */
export const validateCharteSignature = (signature: CharteSignature): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Vérifications obligatoires
  if (!signature.id) {
    errors.push('ID de signature manquant');
  }

  if (!signature.client_id) {
    errors.push('ID client manquant');
  }

  if (!signature.produit_id) {
    errors.push('ID produit manquant');
  }

  if (!signature.signature_date) {
    errors.push('Date de signature manquante');
  }

  // Vérifications de format
  if (signature.signature_date) {
    const signatureDate = new Date(signature.signature_date);
    const now = new Date();
    
    if (isNaN(signatureDate.getTime())) {
      errors.push('Format de date de signature invalide');
    } else if (signatureDate > now) {
      errors.push('Date de signature dans le futur');
    }
  }

  // Vérifications optionnelles (warnings)
  if (!signature.ip_address) {
    warnings.push('Adresse IP non enregistrée');
  }

  if (!signature.user_agent) {
    warnings.push('User-Agent non enregistré');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Récupère les statistiques de signatures
 * @param clientId - ID du client (optionnel)
 * @returns Statistiques des signatures
 */
export const getSignatureStats = async (clientId?: string): Promise<{
  totalSignatures: number;
  signaturesThisMonth: number;
  signaturesThisYear: number;
  averageSignaturesPerDay: number;
}> => {
  try {
    const endpoint = clientId 
      ? `/charte-signature/stats?clientId=${clientId}`
      : '/charte-signature/stats';
    
    const response = await get(endpoint);
    const data = response.data as any;
    
    // Vérifier que les données ont la structure attendue
    if (data && typeof data === 'object' && 'totalSignatures' in data) {
      return {
        totalSignatures: data.totalSignatures || 0,
        signaturesThisMonth: data.signaturesThisMonth || 0,
        signaturesThisYear: data.signaturesThisYear || 0,
        averageSignaturesPerDay: data.averageSignaturesPerDay || 0,
      };
    }
    
    return {
      totalSignatures: 0,
      signaturesThisMonth: 0,
      signaturesThisYear: 0,
      averageSignaturesPerDay: 0,
    };
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error);
    return {
      totalSignatures: 0,
      signaturesThisMonth: 0,
      signaturesThisYear: 0,
      averageSignaturesPerDay: 0,
    };
  }
};

// ============================================================================
// HOOKS ET UTILITAIRES AVANCÉS
// ============================================================================

/**
 * Hook pour gérer les signatures de charte avec état local
 */
export const useCharteSignature = () => {
  const signCharteWithState = async (
    data: CharteSignatureRequest,
    options?: Parameters<typeof signCharte>[1]
  ) => {
    try {
      const result = await signCharte(data, options);
      
      // Stocker en local storage pour cache
      localStorage.setItem(
        `charte_signature_${data.clientProduitEligibleId}`,
        JSON.stringify({
          ...result.data,
          cachedAt: new Date().toISOString(),
        })
      );

      return result;
    } catch (error) {
      throw error;
    }
  };

  const checkCharteSignatureWithCache = async (
    clientProduitEligibleId: string,
    options?: Parameters<typeof checkCharteSignature>[1]
  ) => {
    try {
      // Vérifier le cache d'abord
      const cached = localStorage.getItem(`charte_signature_${clientProduitEligibleId}`);
      if (cached) {
        const cachedData = JSON.parse(cached);
        const cacheAge = Date.now() - new Date(cachedData.cachedAt).getTime();
        
        // Cache valide pendant 5 minutes
        if (cacheAge < 5 * 60 * 1000) {
          return {
            success: true,
            data: cachedData,
            fromCache: true,
          };
        }
      }

      // Sinon, faire l'appel API
      const result = await checkCharteSignature(clientProduitEligibleId, options);
      
      // Mettre à jour le cache
      if (result.success && result.data) {
        localStorage.setItem(
          `charte_signature_${clientProduitEligibleId}`,
          JSON.stringify({
            ...result.data,
            cachedAt: new Date().toISOString(),
          })
        );
      }

      return { ...result, fromCache: false };
    } catch (error) {
      throw error;
    }
  };

  return {
    signCharte: signCharteWithState,
    checkCharteSignature: checkCharteSignatureWithCache,
    getClientIP,
    getClientUserAgent,
    validateCharteSignature,
    getSignatureStats,
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
  API_ENDPOINTS,
  CLIENT_INFO,
  type ClientInfo,
  type SignatureMetadata,
}; 