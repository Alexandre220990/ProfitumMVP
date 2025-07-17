import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./use-auth";
import { get, post, put } from "@/lib/api";
import type { 
  UserPreferences, 
  UISettings, 
  UsePreferencesReturn,
  DefaultPreferences,
  TutorialType,
  NotificationSettings
} from '@/types/preferences';
import { DEFAULT_PREFERENCES } from '@/types/preferences';

// ============================================================================
// CONSTANTES ET CONFIGURATION
// ============================================================================

const API_ENDPOINTS = {
  PREFERENCES: '/api/preferences',
} as const;

const CACHE_CONFIG = {
  TTL: 5 * 60 * 1000, // 5 minutes
  KEY_PREFIX: 'user_preferences_',
} as const;

const ERROR_MESSAGES = {
  FETCH_FAILED: 'Impossible de récupérer les préférences',
  CREATE_FAILED: 'Impossible de créer les préférences',
  UPDATE_FAILED: 'Impossible de mettre à jour les préférences',
  NO_USER: 'Utilisateur non connecté',
  NO_PREFERENCES: 'Aucune préférence disponible',
} as const;

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

interface PreferencesCache {
  data: UserPreferences;
  timestamp: number;
  version: string;
}

interface UpdateOptions {
  optimistic?: boolean;
  invalidateCache?: boolean;
  retryCount?: number;
}

// ============================================================================
// UTILITAIRES
// ============================================================================

const defaultPreferences: DefaultPreferences = DEFAULT_PREFERENCES;

const getCacheKey = (userId: string): string => {
  return `${CACHE_CONFIG.KEY_PREFIX}${userId}`;
};

const getCachedPreferences = (userId: string): UserPreferences | null => {
  try {
    const cacheKey = getCacheKey(userId);
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const parsed: PreferencesCache = JSON.parse(cached);
    const now = Date.now();
    
    // Vérifier si le cache est encore valide
    if (now - parsed.timestamp > CACHE_CONFIG.TTL) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return parsed.data;
  } catch (error) {
    console.warn('Erreur lors de la lecture du cache des préférences:', error);
    return null;
  }
};

const setCachedPreferences = (userId: string, preferences: UserPreferences): void => {
  try {
    const cacheKey = getCacheKey(userId);
    const cacheData: PreferencesCache = {
      data: preferences,
      timestamp: Date.now(),
      version: '1.0.0',
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Erreur lors de l\'écriture du cache des préférences:', error);
  }
};

const clearCache = (userId: string): void => {
  try {
    const cacheKey = getCacheKey(userId);
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.warn('Erreur lors de la suppression du cache des préférences:', error);
  }
};

const validatePreferences = (data: any): data is UserPreferences => {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.id === 'number' &&
    typeof data.user_id === 'string' &&
    typeof data.dashboard_visited === 'boolean' &&
    typeof data.tutorial_completed === 'object' &&
    typeof data.ui_settings === 'object' &&
    typeof data.notifications_settings === 'object'
  );
};

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function usePreferences(): UsePreferencesReturn {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // ============================================================================
  // FONCTIONS INTERNES
  // ============================================================================

  const fetchPreferences = useCallback(async (): Promise<UserPreferences | null> => {
    if (!user?.id) {
      throw new Error(ERROR_MESSAGES.NO_USER);
    }

    try {
      // Essayer d'abord le cache
      const cached = getCachedPreferences(user.id);
      if (cached) {
        console.log('📦 Préférences récupérées depuis le cache');
        return cached;
      }

      // Sinon, faire l'appel API
      const response = await get<{ data: UserPreferences }>(API_ENDPOINTS.PREFERENCES);
      const data = response.data?.data;
      
      if (!data || !validatePreferences(data)) {
        throw new Error('Données de préférences invalides');
      }

      // Mettre en cache
      setCachedPreferences(user.id, data);
      console.log('📦 Préférences récupérées depuis l\'API et mises en cache');
      
      return data;
    } catch (err: any) {
      // Si les préférences n'existent pas encore, créer les préférences par défaut
      if (err.status === 404 || err.message?.includes('404')) {
        console.log('🆕 Création des préférences par défaut');
        return await createDefaultPreferences(user.id);
      }
      
      throw new Error(`${ERROR_MESSAGES.FETCH_FAILED}: ${err.message}`);
    }
  }, [user?.id]);

  const createDefaultPreferences = useCallback(async (userId: string): Promise<UserPreferences> => {
    try {
      const defaultPrefs = {
        ...defaultPreferences,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const response = await post<{ data: UserPreferences }>(API_ENDPOINTS.PREFERENCES, defaultPrefs);
      const data = response.data?.data;
      
      if (!data || !validatePreferences(data)) {
        throw new Error('Données de préférences invalides après création');
      }

      // Mettre en cache
      setCachedPreferences(userId, data);
      console.log('✅ Préférences par défaut créées avec succès');
      
      return data;
    } catch (err: any) {
      throw new Error(`${ERROR_MESSAGES.CREATE_FAILED}: ${err.message}`);
    }
  }, []);

  const updatePreferencesWithRetry = useCallback(async (
    updates: Partial<UserPreferences>,
    options: UpdateOptions = {}
  ): Promise<UserPreferences> => {
    const { optimistic = true, invalidateCache = true, retryCount = 3 } = options;
    
    if (!user?.id) {
      throw new Error(ERROR_MESSAGES.NO_USER);
    }

    if (!preferences) {
      throw new Error(ERROR_MESSAGES.NO_PREFERENCES);
    }

    // Mise à jour optimiste
    const optimisticData = { ...preferences, ...updates, updated_at: new Date().toISOString() };
    
    if (optimistic) {
      setPreferences(optimisticData);
      setCachedPreferences(user.id, optimisticData);
    }

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        const response = await put<{ data: UserPreferences }>(API_ENDPOINTS.PREFERENCES, updates);
        const data = response.data?.data;
        
        if (!data || !validatePreferences(data)) {
          throw new Error('Données de préférences invalides après mise à jour');
        }

        // Mettre à jour le cache
        if (invalidateCache) {
          setCachedPreferences(user.id, data);
        }

        console.log(`✅ Préférences mises à jour avec succès (tentative ${attempt})`);
        return data;
      } catch (err: any) {
        lastError = new Error(`${ERROR_MESSAGES.UPDATE_FAILED}: ${err.message}`);
        console.warn(`❌ Tentative ${attempt} échouée:`, err.message);
        
        if (attempt === retryCount) {
          // Restaurer l'état précédent en cas d'échec
          if (optimistic) {
            setPreferences(preferences);
            setCachedPreferences(user.id, preferences);
          }
          throw lastError;
        }
        
        // Attendre avant de réessayer (backoff exponentiel)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw lastError;
  }, [user?.id, preferences]);

  // ============================================================================
  // EFFETS
  // ============================================================================

  useEffect(() => {
    let isMounted = true;

    const loadPreferences = async () => {
      if (!user?.id) {
        if (isMounted) {
          setPreferences(null);
          setIsLoading(false);
          setError(null);
        }
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const data = await fetchPreferences();
        
        if (isMounted) {
          setPreferences(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err);
          console.error('❌ Erreur lors du chargement des préférences:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPreferences();

    return () => {
      isMounted = false;
    };
  }, [user?.id, fetchPreferences]);

  // ============================================================================
  // FONCTIONS PUBLIQUES
  // ============================================================================

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    try {
      setIsUpdating(true);
      setError(null);
      
      const updatedData = await updatePreferencesWithRetry(updates);
      setPreferences(updatedData);
      
      return updatedData;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [updatePreferencesWithRetry]);

  const setDashboardVisited = useCallback(async () => {
    await updatePreferences({ dashboard_visited: true });
  }, [updatePreferences]);

  const setTutorialCompleted = useCallback(async (tutorialKey: TutorialType) => {
    if (!preferences) return;

    const updatedTutorials = {
      ...preferences.tutorial_completed,
      [tutorialKey]: {
        completed: true,
        completed_at: new Date().toISOString(),
        skipped: false,
        progress: 100,
        steps_completed: ['all'],
        last_accessed: new Date().toISOString(),
      }
    };

    await updatePreferences({ tutorial_completed: updatedTutorials });
  }, [preferences, updatePreferences]);

  const updateUISettings = useCallback(async (settings: Partial<UISettings>) => {
    if (!preferences) return;

    const updatedSettings = {
      ...preferences.ui_settings,
      ...settings
    };

    await updatePreferences({ ui_settings: updatedSettings });
  }, [preferences, updatePreferences]);

  const updateNotificationSettings = useCallback(async (settings: Partial<NotificationSettings>) => {
    if (!preferences) return;

    const updatedSettings = {
      ...preferences.notifications_settings,
      ...settings
    };

    await updatePreferences({ notifications_settings: updatedSettings });
  }, [preferences, updatePreferences]);

  const setLastViewedRequest = useCallback(async (requestId: number) => {
    await updatePreferences({ last_viewed_request: requestId });
  }, [updatePreferences]);

  const refreshPreferences = useCallback(async () => {
    if (!user?.id) return;
    
    clearCache(user.id);
    const data = await fetchPreferences();
    setPreferences(data);
  }, [user?.id, fetchPreferences]);

  const resetToDefaults = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsUpdating(true);
      setError(null);
      
      const defaultPrefs = await createDefaultPreferences(user.id);
      setPreferences(defaultPrefs);
      
      console.log('🔄 Préférences réinitialisées aux valeurs par défaut');
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [user?.id, createDefaultPreferences]);

  // ============================================================================
  // VALEURS MÉMORISÉES
  // ============================================================================

  const memoizedPreferences = useMemo(() => preferences, [preferences]);
  const memoizedError = useMemo(() => error, [error]);

  const isPreferencesValid = useMemo(() => {
    return preferences ? validatePreferences(preferences) : false;
  }, [preferences]);

  const hasUncompletedTutorials = useMemo(() => {
    if (!preferences?.tutorial_completed) return false;
    return Object.keys(preferences.tutorial_completed).length === 0;
  }, [preferences?.tutorial_completed]);

  // ============================================================================
  // RETOUR
  // ============================================================================

  return {
    // État principal
    preferences: memoizedPreferences,
    
    // États de chargement
    isLoading,
    isUpdating,
    isRefreshing: false,
    isResetting: false,
    
    // États d'erreur
    error: memoizedError,
    
    // États de validation
    isPreferencesValid,
    validationErrors: [],
    validationWarnings: [],
    
    // État des tutoriels
    hasUncompletedTutorials,
    completedTutorials: [],
    skippedTutorials: [],
    progress: {} as Record<TutorialType, number>,
    
    // Actions
    updatePreferences,
    setDashboardVisited,
    setTutorialCompleted,
    skipTutorial: async () => {}, // À implémenter
    updateUISettings,
    updateNotificationSettings,
    updatePrivacySettings: async () => {}, // À implémenter
    updateSecuritySettings: async () => {}, // À implémenter
    setLastViewedRequest,
    refreshPreferences,
    resetToDefaults,
    validatePreferences: async () => ({ valid: true, errors: [], warnings: [] }), // À implémenter
    exportPreferences: async () => '', // À implémenter
    importPreferences: async () => memoizedPreferences!, // À implémenter
  };
} 