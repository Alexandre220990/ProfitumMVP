// ============================================================================
// TYPES DE BASE
// ============================================================================

/**
 * Thèmes disponibles pour l'interface utilisateur
 */
export type Theme = 'light' | 'dark' | 'auto';

/**
 * Langues disponibles
 */
export type Language = 'fr' | 'en' | 'es' | 'de';

/**
 * Types de notifications
 */
export type NotificationType = 'email' | 'push' | 'sms' | 'in_app';

/**
 * Fréquences de notification
 */
export type NotificationFrequency = 'immediate' | 'hourly' | 'daily' | 'weekly' | 'never';

/**
 * Types de tutoriels
 */
export type TutorialType = 
  | 'dashboard_intro'
  | 'audit_process'
  | 'document_upload'
  | 'messaging'
  | 'profile_setup'
  | 'expert_selection'
  | 'payment_process'
  | 'report_generation';

// ============================================================================
// INTERFACES DE CONFIGURATION
// ============================================================================

/**
 * Configuration des notifications par type
 */
export interface NotificationConfig {
  enabled: boolean;
  frequency: NotificationFrequency;
  quiet_hours?: {
    enabled: boolean;
    start: string; // Format HH:mm
    end: string;   // Format HH:mm
    timezone: string;
  };
}

/**
 * Configuration complète des notifications
 */
export interface NotificationSettings {
  email: NotificationConfig;
  push: NotificationConfig;
  sms?: NotificationConfig;
  in_app: NotificationConfig;
  marketing?: NotificationConfig;
  updates?: NotificationConfig;
  security?: NotificationConfig;
}

/**
 * Paramètres d'accessibilité
 */
export interface AccessibilitySettings {
  high_contrast: boolean;
  font_size: 'small' | 'medium' | 'large' | 'extra_large';
  reduced_motion: boolean;
  screen_reader: boolean;
  color_blindness_support: boolean;
}

/**
 * Paramètres de confidentialité
 */
export interface PrivacySettings {
  data_collection: boolean;
  analytics: boolean;
  marketing_emails: boolean;
  third_party_sharing: boolean;
  profile_visibility: 'public' | 'private' | 'experts_only';
}

/**
 * Paramètres de sécurité
 */
export interface SecuritySettings {
  two_factor_auth: boolean;
  session_timeout: number; // en minutes
  login_notifications: boolean;
  device_remember: boolean;
  password_expiry_reminder: boolean;
}

/**
 * Paramètres d'interface utilisateur étendus
 */
export interface UISettings {
  theme: Theme;
  language: Language;
  notifications: {
    email: boolean;
    push: boolean;
  };
  accessibility: AccessibilitySettings;
  layout: {
    sidebar_collapsed: boolean;
    compact_mode: boolean;
    show_help_tooltips: boolean;
    auto_save: boolean;
  };
  display: {
    date_format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    time_format: '12h' | '24h';
    currency: 'EUR' | 'USD' | 'GBP';
    timezone: string;
  };
}

// ============================================================================
// ÉTAT DES TUTORIELS
// ============================================================================

/**
 * État d'un tutoriel individuel
 */
export interface IndividualTutorialState {
  completed: boolean;
  completed_at?: string;
  skipped: boolean;
  skipped_at?: string;
  progress?: number; // 0-100
  steps_completed?: string[];
  last_accessed?: string;
}

/**
 * État complet des tutoriels
 */
export type TutorialProgress = Record<TutorialType, IndividualTutorialState>;

// ============================================================================
// PRÉFÉRENCES UTILISATEUR
// ============================================================================

/**
 * Préférences de navigation et d'expérience
 */
export interface NavigationPreferences {
  dashboard_visited: boolean;
  last_visited_page?: string;
  favorite_pages?: string[];
  recent_searches?: string[];
  quick_actions?: string[];
}

/**
 * Préférences de contenu et de personnalisation
 */
export interface ContentPreferences {
  preferred_expert_types?: string[];
  preferred_audit_types?: string[];
  content_language?: Language;
  show_advanced_features: boolean;
  auto_translate: boolean;
}

/**
 * Préférences de communication
 */
export interface CommunicationPreferences {
  preferred_contact_method: 'email' | 'phone' | 'in_app';
  response_time_expectation: 'immediate' | 'within_hour' | 'within_day' | 'flexible';
  availability_hours?: {
    start: string;
    end: string;
    timezone: string;
  };
}

/**
 * Préférences principales de l'utilisateur
 */
export interface UserPreferences {
  // Identifiants
  id: number;
  user_id: string;
  
  // Navigation et expérience
  dashboard_visited: boolean;
  navigation: NavigationPreferences;
  
  // Tutoriels
  tutorial_completed: TutorialProgress;
  
  // Interface utilisateur
  ui_settings: UISettings;
  
  // Notifications
  notifications_settings: NotificationSettings;
  
  // Contenu et personnalisation
  content: ContentPreferences;
  
  // Communication
  communication: CommunicationPreferences;
  
  // Confidentialité et sécurité
  privacy: PrivacySettings;
  security: SecuritySettings;
  
  // Métadonnées
  last_viewed_request?: number;
  created_at: string;
  updated_at: string;
  version: string;
}

// ============================================================================
// TYPES DE RÉPONSE API
// ============================================================================

/**
 * Réponse pour la récupération des préférences
 */
export interface PreferencesResponse {
  success: boolean;
  data: UserPreferences;
  message?: string;
  cached?: boolean;
  version?: string;
}

/**
 * Réponse pour la mise à jour des préférences
 */
export interface UpdatePreferencesResponse {
  success: boolean;
  data: UserPreferences;
  message?: string;
  changes?: Partial<UserPreferences>;
  timestamp: string;
}

/**
 * Réponse pour la validation des préférences
 */
export interface ValidatePreferencesResponse {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: Partial<UserPreferences>;
}

// ============================================================================
// TYPES D'ÉVÉNEMENTS
// ============================================================================

/**
 * Événements liés aux préférences
 */
export type PreferencesEvent = 
  | { type: 'PREFERENCES_LOADED'; data: UserPreferences }
  | { type: 'PREFERENCES_UPDATED'; data: UserPreferences; changes: Partial<UserPreferences> }
  | { type: 'PREFERENCES_RESET'; data: UserPreferences }
  | { type: 'TUTORIAL_COMPLETED'; tutorial: TutorialType }
  | { type: 'TUTORIAL_SKIPPED'; tutorial: TutorialType }
  | { type: 'THEME_CHANGED'; theme: Theme }
  | { type: 'LANGUAGE_CHANGED'; language: Language }
  | { type: 'NOTIFICATION_SETTINGS_CHANGED'; settings: Partial<NotificationSettings> };

// ============================================================================
// TYPES DE RETOUR DU HOOK
// ============================================================================

/**
 * État de chargement des préférences
 */
export interface PreferencesLoadingState {
  isLoading: boolean;
  isUpdating: boolean;
  isRefreshing: boolean;
  isResetting: boolean;
}

/**
 * État d'erreur des préférences
 */
export interface PreferencesErrorState {
  error: Error | null;
  lastError?: {
    message: string;
    timestamp: string;
    retryCount: number;
  };
}

/**
 * État de validation des préférences
 */
export interface PreferencesValidationState {
  isPreferencesValid: boolean;
  validationErrors: string[];
  validationWarnings: string[];
  lastValidated?: string;
}

/**
 * État des tutoriels
 */
export interface TutorialsState {
  hasUncompletedTutorials: boolean;
  completedTutorials: TutorialType[];
  skippedTutorials: TutorialType[];
  progress: Record<TutorialType, number>;
  nextRecommendedTutorial?: TutorialType;
}

/**
 * Fonctions de gestion des préférences
 */
export interface PreferencesActions {
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<UserPreferences>;
  setDashboardVisited: () => Promise<void>;
  setTutorialCompleted: (tutorialKey: TutorialType) => Promise<void>;
  skipTutorial: (tutorialKey: TutorialType) => Promise<void>;
  updateUISettings: (settings: Partial<UISettings>) => Promise<void>;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => Promise<void>;
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => Promise<void>;
  setLastViewedRequest: (requestId: number) => Promise<void>;
  refreshPreferences: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
  validatePreferences: () => Promise<ValidatePreferencesResponse>;
  exportPreferences: () => Promise<string>;
  importPreferences: (data: string) => Promise<UserPreferences>;
}

/**
 * Interface complète de retour du hook usePreferences
 */
export interface UsePreferencesReturn {
  // État principal
  preferences: UserPreferences | null;
  
  // États de chargement
  isLoading: boolean;
  isUpdating: boolean;
  isRefreshing: boolean;
  isResetting: boolean;
  
  // États d'erreur
  error: Error | null;
  lastError?: {
    message: string;
    timestamp: string;
    retryCount: number;
  };
  
  // États de validation
  isPreferencesValid: boolean;
  validationErrors: string[];
  validationWarnings: string[];
  lastValidated?: string;
  
  // État des tutoriels
  hasUncompletedTutorials: boolean;
  completedTutorials: TutorialType[];
  skippedTutorials: TutorialType[];
  progress: Record<TutorialType, number>;
  nextRecommendedTutorial?: TutorialType;
  
  // Actions
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<UserPreferences>;
  setDashboardVisited: () => Promise<void>;
  setTutorialCompleted: (tutorialKey: TutorialType) => Promise<void>;
  skipTutorial: (tutorialKey: TutorialType) => Promise<void>;
  updateUISettings: (settings: Partial<UISettings>) => Promise<void>;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => Promise<void>;
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => Promise<void>;
  setLastViewedRequest: (requestId: number) => Promise<void>;
  refreshPreferences: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
  validatePreferences: () => Promise<ValidatePreferencesResponse>;
  exportPreferences: () => Promise<string>;
  importPreferences: (data: string) => Promise<UserPreferences>;
}

// ============================================================================
// TYPES UTILITAIRES
// ============================================================================

/**
 * Type pour les mises à jour partielles avec validation
 */
export type PartialPreferencesUpdate<T extends keyof UserPreferences> = {
  [K in T]?: UserPreferences[K];
};

/**
 * Type pour les préférences par défaut
 */
export type DefaultPreferences = Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'version'>;

/**
 * Type pour les préférences minimales (création)
 */
export type CreatePreferencesData = Pick<UserPreferences, 'user_id'> & Partial<DefaultPreferences>;

/**
 * Type pour les préférences de cache
 */
export interface CachedPreferences {
  data: UserPreferences;
  timestamp: number;
  version: string;
  etag?: string;
}

// ============================================================================
// CONSTANTES ET VALEURS PAR DÉFAUT
// ============================================================================

/**
 * Valeurs par défaut pour les préférences
 */
export const DEFAULT_PREFERENCES: DefaultPreferences = {
  dashboard_visited: false,
  navigation: {
    dashboard_visited: false,
  },
  tutorial_completed: {} as TutorialProgress,
  ui_settings: {
    theme: 'light',
    language: 'fr',
    notifications: {
      email: true,
      push: true,
    },
    accessibility: {
      high_contrast: false,
      font_size: 'medium',
      reduced_motion: false,
      screen_reader: false,
      color_blindness_support: false,
    },
    layout: {
      sidebar_collapsed: false,
      compact_mode: false,
      show_help_tooltips: true,
      auto_save: true,
    },
    display: {
      date_format: 'DD/MM/YYYY',
      time_format: '24h',
      currency: 'EUR',
      timezone: 'Europe/Paris',
    },
  },
  notifications_settings: {
    email: { enabled: true, frequency: 'immediate' },
    push: { enabled: true, frequency: 'immediate' },
    in_app: { enabled: true, frequency: 'immediate' },
  },
  content: {
    show_advanced_features: false,
    auto_translate: false,
  },
  communication: {
    preferred_contact_method: 'email',
    response_time_expectation: 'within_day',
  },
  privacy: {
    data_collection: true,
    analytics: true,
    marketing_emails: false,
    third_party_sharing: false,
    profile_visibility: 'private',
  },
  security: {
    two_factor_auth: false,
    session_timeout: 30,
    login_notifications: true,
    device_remember: true,
    password_expiry_reminder: true,
  },
};

/**
 * Versions supportées
 */
export const SUPPORTED_VERSIONS = ['1.0.0', '1.1.0', '1.2.0'] as const;
export type SupportedVersion = typeof SUPPORTED_VERSIONS[number];

/**
 * Configuration des tutoriels
 */
export const TUTORIAL_CONFIG: Record<TutorialType, {
  title: string;
  description: string;
  estimated_duration: number; // en minutes
  required: boolean;
  prerequisites?: TutorialType[];
}> = {
  dashboard_intro: {
    title: 'Introduction au tableau de bord',
    description: 'Découvrez les fonctionnalités principales de votre tableau de bord',
    estimated_duration: 3,
    required: true,
  },
  audit_process: {
    title: 'Processus d\'audit',
    description: 'Comprendre le processus d\'audit étape par étape',
    estimated_duration: 5,
    required: true,
    prerequisites: ['dashboard_intro'],
  },
  document_upload: {
    title: 'Téléchargement de documents',
    description: 'Apprenez à télécharger et organiser vos documents',
    estimated_duration: 4,
    required: false,
  },
  messaging: {
    title: 'Système de messagerie',
    description: 'Communiquez efficacement avec les experts',
    estimated_duration: 3,
    required: false,
  },
  profile_setup: {
    title: 'Configuration du profil',
    description: 'Personnalisez votre profil utilisateur',
    estimated_duration: 2,
    required: false,
  },
  expert_selection: {
    title: 'Sélection d\'experts',
    description: 'Choisissez les experts adaptés à vos besoins',
    estimated_duration: 4,
    required: false,
  },
  payment_process: {
    title: 'Processus de paiement',
    description: 'Comprendre les options de paiement disponibles',
    estimated_duration: 3,
    required: false,
  },
  report_generation: {
    title: 'Génération de rapports',
    description: 'Générez et exportez vos rapports d\'audit',
    estimated_duration: 4,
    required: false,
  },
}; 

// Types pour les préférences expert

export interface ExpertPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    inApp: boolean;
  };
  availability: {
    workingHours: {
      start: string;
      end: string;
    };
    maxAssignments: number;
    preferredProducts: string[];
    autoAccept: boolean;
    timezone: string;
  };
  compensation: {
    minimumRate: number;
    preferredRate: number;
    autoNegotiate: boolean;
    currency: string;
  };
  display: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
  };
  privacy: {
    showProfile: boolean;
    showEarnings: boolean;
    showRating: boolean;
    allowContact: boolean;
  };
}

export interface PreferenceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  settings: PreferenceSetting[];
}

export interface PreferenceSetting {
  id: string;
  name: string;
  description: string;
  type: 'boolean' | 'number' | 'string' | 'select' | 'time' | 'currency';
  value: any;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
} 