import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export interface Permission { id: string;
  name: string;
  description: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'share' | 'manage';
  conditions?: Record<string, any>;
}

export interface Role { 
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  level: number; // 1 = admin, 2 = expert, 3 = client
}

export interface UserPermissions { 
  userId: string;
  roles: Role[];
  customPermissions: Permission[];
  effectivePermissions: Permission[];
}

export const usePermissions = () => { const { user } = useAuth();
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  // Permissions par défaut selon le type d'utilisateur
  const getDefaultPermissions = (userType: string): Permission[] => { const basePermissions: Permission[] = [
      {
        id: 'profile-read, ', name: 'Lecture du profil, ', description: 'Peut lire son propre profil, ', resource: 'profile, ', action: 'read' }
    ];

    switch (userType) { case 'admin':
        return [
          ...basePermissions, {
            id: 'admin-full, ', name: 'Accès administrateur complet, ', description: 'Accès complet à toutes les fonctionnalités, ', resource: '*, ', action: 'manage' },
          { id: 'users-manage, ', name: 'Gestion des utilisateurs, ', description: 'Peut gérer tous les utilisateurs, ', resource: 'users, ', action: 'manage' },
          { id: 'documents-manage, ', name: 'Gestion des documents, ', description: 'Peut gérer tous les documents, ', resource: 'documents, ', action: 'manage' },
          { id: 'workflows-manage, ', name: 'Gestion des workflows, ', description: 'Peut gérer tous les workflows, ', resource: 'workflows, ', action: 'manage' },
          { id: 'analytics-full, ', name: 'Analytics complets, ', description: 'Accès à toutes les données analytics, ', resource: 'analytics, ', action: 'read' }
        ];

      case 'expert':
        return [
          ...basePermissions,
          { id: 'assignments-read', name: 'Lecture des assignations', description: 'Peut voir ses assignations', resource: 'assignments', action: 'read', conditions: { owner: 'self' }
          },
          { id: 'assignments-update', name: 'Mise à jour des assignations', description: 'Peut mettre à jour ses assignations', resource: 'assignments', action: 'update', conditions: { owner: 'self' }
          },
          { id: 'clients-read', name: 'Lecture des clients', description: 'Peut voir les informations de ses clients', resource: 'clients', action: 'read', conditions: { assigned: 'self' }
          },
          { id: 'documents-read', name: 'Lecture des documents', description: 'Peut lire les documents partagés', resource: 'documents', action: 'read', conditions: { shared: true }
          }
        ];

      case 'client':
        return [
          ...basePermissions,
          { id: 'own-dossiers-manage', name: 'Gestion de ses dossiers', description: 'Peut gérer ses propres dossiers', resource: 'dossiers', action: 'manage', conditions: { owner: 'self' }
          },
          { id: 'experts-read', name: 'Lecture des experts', description: 'Peut voir les informations des experts', resource: 'experts', action: 'read' },
          { id: 'workflow-participate', name: 'Participation aux workflows', description: 'Peut participer aux workflows de ses dossiers', resource: 'workflows', action: 'update', conditions: { owner: 'self' }
          },
          { id: 'documents-read-own', name: 'Lecture de ses documents', description: 'Peut lire ses propres documents', resource: 'documents', action: 'read', conditions: { owner: 'self' }
          }
        ];

      default: return basePermissions; }
  };

  // Vérifier si l'utilisateur a une permission spécifique
  const hasPermission = (
    resource: string,
    action: string,
    conditions?: Record<string, any>
  ): boolean => { if (!userPermissions) return false;

    return userPermissions.effectivePermissions.some(permission => {
      // Vérifier la ressource (wildcard ou correspondance exacte)
      const resourceMatch = permission.resource === '*' || permission.resource === resource;
      
      // Vérifier l'action
      const actionMatch = permission.action === action || permission.action === 'manage';
      
      // Vérifier les conditions si spécifiées
      const conditionsMatch = !conditions || !permission.conditions || 
        Object.entries(conditions).every(([key, value]) => 
          permission.conditions![key] === value
        );

      return resourceMatch && actionMatch && conditionsMatch; });
  };

  // Vérifier les permissions multiples
  const hasAnyPermission = (permissions: Array<{ resource: string; action: string; conditions?: Record<string, any> }>): boolean => { return permissions.some(({ resource, action, conditions }) => 
      hasPermission(resource, action, conditions)
    );
  };

  const hasAllPermissions = (permissions: Array<{ resource: string; action: string; conditions?: Record<string, any> }>): boolean => { return permissions.every(({ resource, action, conditions }) => 
      hasPermission(resource, action, conditions)
    );
  };

  // Charger les permissions utilisateur
  useEffect(() => { const loadUserPermissions = async () => {
      if (!user) {
        setUserPermissions(null);
        setLoading(false);
        return; }

      try { // Permissions par défaut selon le type d'utilisateur
        const defaultPermissions = getDefaultPermissions(user.type);
        
        // TODO: Charger les permissions personnalisées depuis l'API
        const customPermissions: Permission[] = [];
        
        // Calculer les permissions effectives
        const effectivePermissions = [...defaultPermissions, ...customPermissions];
        
        setUserPermissions({
          userId: user.id, roles: [], // TODO: Charger les rôles depuis l'API
          customPermissions, effectivePermissions });
      } catch (error) { console.error('Erreur lors du chargement des permissions: ', error);
        // Fallback aux permissions par défaut
        const defaultPermissions = getDefaultPermissions(user.type);
        setUserPermissions({
          userId: user.id, roles: [], customPermissions: [], effectivePermissions: defaultPermissions });
      } finally { setLoading(false); }
    };

    loadUserPermissions();
  }, [user]);

  return { userPermissions, loading, hasPermission, hasAnyPermission, hasAllPermissions, isAdmin: user?.type === 'admin', isExpert: user?.type === 'expert', isClient: user?.type === 'client' };
}; 