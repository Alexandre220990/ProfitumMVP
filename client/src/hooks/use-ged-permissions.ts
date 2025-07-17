import { useMemo, useCallback } from 'react';
import { useAuth } from "./use-auth";

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export type UserType = 'admin' | 'client' | 'expert';
export type DocumentCategory = 'business' | 'technical' | 'compliance' | 'financial';
export type PermissionAction = keyof GEDPermissions;

export interface GEDPermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canCreate: boolean;
  canShare: boolean;
  canManageLabels: boolean;
  canManagePermissions: boolean;
  canExport: boolean;
  canArchive: boolean;
}

export interface DocumentPermission {
  documentId: string;
  userType: UserType;
  permissions: GEDPermissions;
  grantedAt?: string;
  expiresAt?: string;
}

export interface CategoryAccess {
  business: boolean;
  technical: boolean;
  compliance: boolean;
  financial: boolean;
}

// ============================================================================
// CONSTANTES ET CONFIGURATION
// ============================================================================

const PERMISSION_LEVELS = {
  NONE: {
    canRead: false,
    canWrite: false,
    canDelete: false,
    canCreate: false,
    canShare: false,
    canManageLabels: false,
    canManagePermissions: false,
    canExport: false,
    canArchive: false,
  },
  READ_ONLY: {
    canRead: true,
    canWrite: false,
    canDelete: false,
    canCreate: false,
    canShare: false,
    canManageLabels: false,
    canManagePermissions: false,
    canExport: true,
    canArchive: false,
  },
  CONTRIBUTOR: {
    canRead: true,
    canWrite: true,
    canDelete: false,
    canCreate: true,
    canShare: true,
    canManageLabels: false,
    canManagePermissions: false,
    canExport: true,
    canArchive: false,
  },
  MANAGER: {
    canRead: true,
    canWrite: true,
    canDelete: true,
    canCreate: true,
    canShare: true,
    canManageLabels: true,
    canManagePermissions: false,
    canExport: true,
    canArchive: true,
  },
  ADMIN: {
    canRead: true,
    canWrite: true,
    canDelete: true,
    canCreate: true,
    canShare: true,
    canManageLabels: true,
    canManagePermissions: true,
    canExport: true,
    canArchive: true,
  },
} as const;

const USER_PERMISSIONS: Record<UserType, GEDPermissions> = {
  admin: PERMISSION_LEVELS.ADMIN,
  expert: PERMISSION_LEVELS.CONTRIBUTOR,
  client: PERMISSION_LEVELS.READ_ONLY,
};

const CATEGORY_ACCESS_MATRIX: Record<UserType, CategoryAccess> = {
  admin: {
    business: true,
    technical: true,
    compliance: true,
    financial: true,
  },
  expert: {
    business: true,
    technical: false,
    compliance: true,
    financial: false,
  },
  client: {
    business: true,
    technical: false,
    compliance: false,
    financial: false,
  },
};

// ============================================================================
// UTILITAIRES
// ============================================================================

const hasPermission = (permissions: GEDPermissions, action: PermissionAction): boolean => {
  return permissions[action] ?? false;
};

const canAccessCategoryForUser = (userType: UserType, category: DocumentCategory): boolean => {
  return CATEGORY_ACCESS_MATRIX[userType]?.[category] ?? false;
};

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useGEDPermissions() {
  const { user } = useAuth();

  // ============================================================================
  // PERMISSIONS DE BASE (mémorisées)
  // ============================================================================

  const basePermissions = useMemo((): GEDPermissions => {
    if (!user?.type) return PERMISSION_LEVELS.NONE;
    return USER_PERMISSIONS[user.type] ?? PERMISSION_LEVELS.NONE;
  }, [user?.type]);

  const userType = useMemo((): UserType | null => {
    return user?.type as UserType || null;
  }, [user?.type]);

  // ============================================================================
  // FONCTIONS DE VÉRIFICATION (mémorisées)
  // ============================================================================

  const canPerformAction = useCallback((action: PermissionAction): boolean => {
    return hasPermission(basePermissions, action);
  }, [basePermissions]);

  const canPerformMultipleActions = useCallback((actions: PermissionAction[]): boolean => {
    return actions.every(action => hasPermission(basePermissions, action));
  }, [basePermissions]);

  const canPerformAnyAction = useCallback((actions: PermissionAction[]): boolean => {
    return actions.some(action => hasPermission(basePermissions, action));
  }, [basePermissions]);

  const getDocumentPermissions = useCallback((documentId: string): GEDPermissions => {
    // TODO: Implémenter la récupération des permissions spécifiques depuis l'API
    // Pour l'instant, on utilise les permissions de base
    console.log(`Récupération des permissions pour le document: ${documentId}`);
    return basePermissions;
  }, [basePermissions]);

  const canAccessCategory = useCallback((category: DocumentCategory): boolean => {
    if (!userType) return false;
    return canAccessCategoryForUser(userType, category);
  }, [userType]);

  const canCreateInCategory = useCallback((category: DocumentCategory): boolean => {
    return canPerformAction('canCreate') && canAccessCategory(category);
  }, [canPerformAction, canAccessCategory]);

  const canEditInCategory = useCallback((category: DocumentCategory): boolean => {
    return canPerformAction('canWrite') && canAccessCategory(category);
  }, [canPerformAction, canAccessCategory]);

  const canDeleteInCategory = useCallback((category: DocumentCategory): boolean => {
    return canPerformAction('canDelete') && canAccessCategory(category);
  }, [canPerformAction, canAccessCategory]);

  // ============================================================================
  // VÉRIFICATIONS SPÉCIALISÉES
  // ============================================================================

  const canManageDocuments = useCallback((): boolean => {
    return canPerformMultipleActions(['canCreate', 'canWrite', 'canDelete']);
  }, [canPerformMultipleActions]);

  const canShareDocuments = useCallback((): boolean => {
    return canPerformAction('canShare');
  }, [canPerformAction]);

  const canExportDocuments = useCallback((): boolean => {
    return canPerformAction('canExport');
  }, [canPerformAction]);

  const canArchiveDocuments = useCallback((): boolean => {
    return canPerformAction('canArchive');
  }, [canPerformAction]);

  const canManageSystem = useCallback((): boolean => {
    return canPerformMultipleActions(['canManageLabels', 'canManagePermissions']);
  }, [canPerformMultipleActions]);

  // ============================================================================
  // ACCÈS PAR CATÉGORIE (mémorisé)
  // ============================================================================

  const categoryAccess = useMemo((): CategoryAccess => {
    if (!userType) {
      return {
        business: false,
        technical: false,
        compliance: false,
        financial: false,
      };
    }

    return CATEGORY_ACCESS_MATRIX[userType];
  }, [userType]);

  // ============================================================================
  // ÉTATS DÉRIVÉS (mémorisés)
  // ============================================================================

  const isAdmin = useMemo((): boolean => userType === 'admin', [userType]);
  const isExpert = useMemo((): boolean => userType === 'expert', [userType]);
  const isClient = useMemo((): boolean => userType === 'client', [userType]);
  const isAuthenticated = useMemo((): boolean => !!userType, [userType]);

  const hasFullAccess = useMemo((): boolean => {
    return isAdmin || canPerformMultipleActions(['canRead', 'canWrite', 'canCreate', 'canDelete']);
  }, [isAdmin, canPerformMultipleActions]);

  const hasReadOnlyAccess = useMemo((): boolean => {
    return canPerformAction('canRead') && !canPerformAction('canWrite');
  }, [canPerformAction]);

  // ============================================================================
  // RÉSULTAT FINAL
  // ============================================================================

  return {
    // === ÉTAT DE BASE ===
    permissions: basePermissions,
    userType,
    isAuthenticated,
    
    // === RÔLES UTILISATEUR ===
    isAdmin,
    isExpert,
    isClient,
    
    // === NIVEAUX D'ACCÈS ===
    hasFullAccess,
    hasReadOnlyAccess,
    
    // === VÉRIFICATIONS D'ACTIONS ===
    canPerformAction,
    canPerformMultipleActions,
    canPerformAnyAction,
    
    // === VÉRIFICATIONS SPÉCIALISÉES ===
    canManageDocuments,
    canShareDocuments,
    canExportDocuments,
    canArchiveDocuments,
    canManageSystem,
    
    // === VÉRIFICATIONS PAR CATÉGORIE ===
    canAccessCategory,
    canCreateInCategory,
    canEditInCategory,
    canDeleteInCategory,
    categoryAccess,
    
    // === PERMISSIONS DE DOCUMENTS ===
    getDocumentPermissions,
    
    // === UTILITAIRES ===
    permissionLevels: PERMISSION_LEVELS,
  };
}

// ============================================================================
// HOOKS SPÉCIALISÉS
// ============================================================================

export function useDocumentPermissions(documentId: string) {
  const { getDocumentPermissions, canPerformAction } = useGEDPermissions();
  
  const documentPermissions = useMemo(() => {
    return getDocumentPermissions(documentId);
  }, [getDocumentPermissions, documentId]);

  const canReadDocument = useCallback(() => {
    return canPerformAction('canRead');
  }, [canPerformAction]);

  const canEditDocument = useCallback(() => {
    return canPerformAction('canWrite');
  }, [canPerformAction]);

  const canDeleteDocument = useCallback(() => {
    return canPerformAction('canDelete');
  }, [canPerformAction]);

  const canShareDocument = useCallback(() => {
    return canPerformAction('canShare');
  }, [canPerformAction]);

  return {
    permissions: documentPermissions,
    canRead: canReadDocument,
    canEdit: canEditDocument,
    canDelete: canDeleteDocument,
    canShare: canShareDocument,
  };
}

export function useCategoryPermissions(category: DocumentCategory) {
  const { 
    canAccessCategory, 
    canCreateInCategory, 
    canEditInCategory, 
    canDeleteInCategory,
    categoryAccess 
  } = useGEDPermissions();

  const hasAccess = useMemo(() => {
    return canAccessCategory(category);
  }, [canAccessCategory, category]);

  const canCreate = useMemo(() => {
    return canCreateInCategory(category);
  }, [canCreateInCategory, category]);

  const canEdit = useMemo(() => {
    return canEditInCategory(category);
  }, [canEditInCategory, category]);

  const canDelete = useMemo(() => {
    return canDeleteInCategory(category);
  }, [canDeleteInCategory, category]);

  return {
    hasAccess,
    canCreate,
    canEdit,
    canDelete,
    categoryAccess: categoryAccess[category],
  };
} 