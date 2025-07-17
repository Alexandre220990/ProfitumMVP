import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

// Types pour les permissions
interface Permission { 
  id: string;
  name: string;
  description: string;
  resource: string;
  action: 'read' | 'write' | 'delete' | 'admin' 
}

interface Role { 
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  level: number; // 1: Auditor, 2: Admin, 3: Super Admin 
}

interface AdminUser { 
  id: string;
  email: string;
  role: Role;
  permissions: Permission[];
  lastLogin: string;
  isActive: boolean 
}

// Types pour les notifications
interface AdminNotification { 
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'security';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  action?: {
    label: string;
    url: string; 
  };
}

// Types pour les analytics
interface AdminMetrics { 
  totalUsers: number;
  activeUsers: number;
  totalDossiers: number;
  completedDossiers: number;
  totalRevenue: number;
  conversionRate: number;
  avgProcessingTime: number;
  securityScore: number;
  complianceScore: number 
}

// Types pour le thème
interface AdminTheme { 
  mode: 'light' | 'dark' | 'auto';
  primaryColor: string;
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean 
}

// Types pour l'audit sécurité
interface SecurityAlert { 
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'authentication' | 'authorization' | 'data_protection' | 'network' | 'compliance';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
  actionRequired: boolean 
}

interface AdminContextType { 
  // Permissions
  currentUser: AdminUser | null;
  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (roleName: string) => boolean;
  
  // Thème
  theme: AdminTheme;
  setTheme: (theme: Partial<AdminTheme>) => void;
  
  // Notifications
  notifications: AdminNotification[];
  addNotification: (notification: Omit<AdminNotification, 'id' | 'timestamp'>) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
  unreadCount: number;
  
  // Analytics
  metrics: AdminMetrics | null;
  loadingMetrics: boolean;
  refreshMetrics: () => Promise<void>;
  
  // Sécurité
  securityAlerts: SecurityAlert[];
  addSecurityAlert: (alert: Omit<SecurityAlert, 'id' | 'timestamp'>) => void;
  resolveSecurityAlert: (id: string) => void;
  criticalAlertsCount: number;
  
  // A/B Testing
  activeTests: any[];
  createTest: (test: any) => Promise<void>;
  updateTest: (id: string, updates: any) => Promise<void>;
  
  // Utilitaires
  isLoading: boolean;
  error: string | null 
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Rôles et permissions prédéfinis
const ROLES: Role[] = [
  { 
    id: 'auditor', 
    name: 'Auditor', 
    description: 'Accès en lecture seule pour audit et conformité', 
    level: 1, 
    permissions: [
      { id: 'read_dashboard', name: 'Lire Dashboard', description: 'Accès au dashboard en lecture', resource: 'dashboard', action: 'read' },
      { id: 'read_reports', name: 'Lire Rapports', description: 'Accès aux rapports', resource: 'reports', action: 'read' },
      { id: 'read_audit', name: 'Lire Audit', description: 'Accès aux logs d\'audit', resource: 'audit', action: 'read' },
      { id: 'read_compliance', name: 'Lire Conformité', description: 'Accès aux données de conformité', resource: 'compliance', action: 'read' }
    ]
  },
  { 
    id: 'admin', 
    name: 'Admin', 
    description: 'Administration complète de la plateforme', 
    level: 2, 
    permissions: [
      { id: 'read_dashboard', name: 'Lire Dashboard', description: 'Accès au dashboard', resource: 'dashboard', action: 'read' },
      { id: 'write_dashboard', name: 'Modifier Dashboard', description: 'Modifier le dashboard', resource: 'dashboard', action: 'write' },
      { id: 'read_users', name: 'Gérer Utilisateurs', description: 'Gestion des utilisateurs', resource: 'users', action: 'read' },
      { id: 'write_users', name: 'Modifier Utilisateurs', description: 'Modifier les utilisateurs', resource: 'users', action: 'write' },
      { id: 'read_reports', name: 'Lire Rapports', description: 'Accès aux rapports', resource: 'reports', action: 'read' },
      { id: 'write_reports', name: 'Modifier Rapports', description: 'Modifier les rapports', resource: 'reports', action: 'write' },
      { id: 'read_audit', name: 'Lire Audit', description: 'Accès aux logs d\'audit', resource: 'audit', action: 'read' },
      { id: 'write_audit', name: 'Modifier Audit', description: 'Modifier les logs d\'audit', resource: 'audit', action: 'write' },
      { id: 'read_compliance', name: 'Lire Conformité', description: 'Accès aux données de conformité', resource: 'compliance', action: 'read' },
      { id: 'write_compliance', name: 'Modifier Conformité', description: 'Modifier la conformité', resource: 'compliance', action: 'write' },
      { id: 'read_security', name: 'Lire Sécurité', description: 'Accès à la sécurité', resource: 'security', action: 'read' },
      { id: 'write_security', name: 'Modifier Sécurité', description: 'Modifier la sécurité', resource: 'security', action: 'write' }
    ]
  },
  { 
    id: 'super_admin', 
    name: 'Super Admin', 
    description: 'Accès complet et gestion des autres admins', 
    level: 3, 
    permissions: [
      { id: 'admin_all', name: 'Administration Complète', description: 'Accès complet à toutes les fonctionnalités', resource: '*', action: 'admin' }
    ]
  }
];

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => { 
  const { user } = useAuth();
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [theme, setThemeState] = useState<AdminTheme>({ 
    mode: 'light', 
    primaryColor: '#2563eb', 
    accentColor: '#10b981', 
    fontSize: 'medium', 
    compactMode: false 
  });
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [activeTests, setActiveTests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialiser l'utilisateur admin
  useEffect(() => { 
    if (user && user.type === 'admin') {
      const adminRole = ROLES.find(r => r.id === 'admin') || ROLES[1];
      const adminUser = {
        id: user.id, 
        email: user.email, 
        role: adminRole, 
        permissions: adminRole.permissions, 
        lastLogin: new Date().toISOString(), 
        isActive: true 
      };
      
      setCurrentUser(adminUser);
    } else {
      setCurrentUser(null);
    }
  }, [user]);

  // Charger le thème depuis localStorage
  useEffect(() => { 
    const savedTheme = localStorage.getItem('admin-theme');
    if (savedTheme) {
      setThemeState(JSON.parse(savedTheme)); 
    }
  }, []);

  // Sauvegarder le thème
  const setTheme = (newTheme: Partial<AdminTheme>) => { 
    const updatedTheme = { ...theme, ...newTheme };
    setThemeState(updatedTheme);
    localStorage.setItem('admin-theme', JSON.stringify(updatedTheme));
  };

  // Vérifier les permissions
  const hasPermission = (resource: string, action: string): boolean => { 
    if (!currentUser) return false;
    
    // Super admin a tous les droits
    if (currentUser.role.id === 'super_admin') return true;
    
    return currentUser.permissions.some(p => 
      (p.resource === resource || p.resource === '*') && 
      (p.action === action || p.action === 'admin')
    ); 
  };

  const hasRole = (roleName: string): boolean => { 
    return currentUser?.role.id === roleName; 
  };

  // Gestion des notifications
  const addNotification = (notification: Omit<AdminNotification, 'id' | 'timestamp'>) => { 
    const newNotification: AdminNotification = {
      ...notification, 
      id: Date.now().toString(), 
      timestamp: new Date().toISOString() 
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => { 
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const clearNotifications = () => { 
    setNotifications([]); 
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Charger les métriques
  const refreshMetrics = async () => { 
    setLoadingMetrics(true);
    try {
      // Utiliser import.meta.env pour Vite au lieu de process.env
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const response = await fetch(`${API_URL}/api/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const dashboardData = data.data;
          const metrics: AdminMetrics = {
            totalUsers: dashboardData.totalClients + dashboardData.totalExperts,
            activeUsers: dashboardData.activeUsers || 0,
            totalDossiers: dashboardData.totalAudits,
            completedDossiers: dashboardData.completedAudits,
            totalRevenue: dashboardData.totalObtainedGain,
            conversionRate: dashboardData.conversionRate * 100,
            avgProcessingTime: dashboardData.avgProcessingTime || 4.2,
            securityScore: dashboardData.securityScore || 92,
            complianceScore: dashboardData.complianceScore || 98.5
          };
          setMetrics(metrics);
        } else {
          setError(data.message || 'Erreur lors du chargement des métriques');
        }
      } else {
        setError('Erreur lors du chargement des métriques');
      }
    } catch (error) { 
      setError('Erreur lors du chargement des métriques'); 
      console.error('Erreur refreshMetrics: ', error);
    } finally { 
      setLoadingMetrics(false); 
    }
  };

  // Gestion des alertes de sécurité
  const addSecurityAlert = (alert: Omit<SecurityAlert, 'id' | 'timestamp'>) => { 
    const newAlert: SecurityAlert = {
      ...alert, 
      id: Date.now().toString(), 
      timestamp: new Date().toISOString() 
    };
    setSecurityAlerts(prev => [newAlert, ...prev]);
  };

  const resolveSecurityAlert = (id: string) => { 
    setSecurityAlerts(prev => 
      prev.map(a => a.id === id ? { ...a, resolved: true } : a)
    );
  };

  const criticalAlertsCount = securityAlerts.filter(a => 
    a.severity === 'critical' && !a.resolved
  ).length;

  // A/B Testing
  const createTest = async (test: any) => { 
    setIsLoading(true);
    try {
      // TODO: API call
      setActiveTests(prev => [...prev, { ...test, id: Date.now().toString() }]);
    } catch (error) { 
      setError('Erreur lors de la création du test'); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const updateTest = async (id: string, updates: any) => { 
    setIsLoading(true);
    try {
      // TODO: API call
      setActiveTests(prev => 
        prev.map(t => t.id === id ? { ...t, ...updates } : t)
      );
    } catch (error) { 
      setError('Erreur lors de la mise à jour du test'); 
    } finally { 
      setIsLoading(false); 
    }
  };

  // Charger les métriques au montage
  useEffect(() => { 
    if (currentUser) {
      // Temporairement désactivé pour éviter les erreurs
      // refreshMetrics(); 
    }
  }, [currentUser]);

  const value: AdminContextType = { 
    currentUser, 
    hasPermission, 
    hasRole, 
    theme, 
    setTheme, 
    notifications, 
    addNotification, 
    markAsRead, 
    clearNotifications, 
    unreadCount, 
    metrics, 
    loadingMetrics, 
    refreshMetrics, 
    securityAlerts, 
    addSecurityAlert, 
    resolveSecurityAlert, 
    criticalAlertsCount, 
    activeTests, 
    createTest, 
    updateTest, 
    isLoading, 
    error 
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => { 
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider'); 
  }
  return context;
}; 