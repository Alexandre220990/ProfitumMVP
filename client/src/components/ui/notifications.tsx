import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { Switch } from "./switch";
import { Label } from "./label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Input } from "./input";
import { Bell, Settings, X, Check, AlertTriangle, Info, User, Shield, Eye, Trash2, Plus, Search, RefreshCw, Zap, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'security' | 'system' | 'user' | 'business';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'user' | 'system' | 'security' | 'business' | 'compliance';
  sender?: string;
  recipient?: string;
  action?: {
    label: string;
    url: string;
    type: 'link' | 'button' | 'modal';
  };
  metadata?: {
    userId?: string;
    dossierId?: string;
    expertId?: string;
    amount?: number;
    status?: string;
  };
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
  categories: {
    user: boolean;
    system: boolean;
    security: boolean;
    business: boolean;
    compliance: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: Notification['type'];
  title: string;
  message: string;
  variables: string[];
  category: Notification['category'];
  priority: Notification['priority'];
}

// ============================================================================
// CONSTANTES ET CONFIGURATION
// ============================================================================

const NOTIFICATION_TYPES = {
  info: { icon: Info, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/20' },
  success: { icon: Check, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/20' },
  warning: { icon: AlertTriangle, color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/20' },
  error: { icon: X, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/20' },
  security: { icon: Shield, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/20' },
  system: { icon: Zap, color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900/20' },
  user: { icon: User, color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-900/20' },
  business: { icon: FileText, color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/20' }
} as const;

const PRIORITY_COLORS = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
} as const;

const DEFAULT_PREFERENCES: NotificationPreferences = {
  email: true,
  push: true,
  sms: false,
  inApp: true,
  categories: {
    user: true,
    system: true,
    security: true,
    business: true,
    compliance: true
  },
  quietHours: { enabled: false, start: '22:00', end: '08:00' }
};

// ============================================================================
// HOOKS PERSONNALISÉS
// ============================================================================

const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: Remplacer par l'API réelle
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'security',
          title: 'Tentative de connexion suspecte',
          message: 'Détection d\'une tentative de connexion depuis une IP non reconnue',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          read: false,
          priority: 'high',
          category: 'security',
          sender: 'Système de sécurité',
          metadata: { userId: 'user123', status: 'pending' }
        },
        {
          id: '2',
          type: 'business',
          title: 'Nouveau dossier créé',
          message: 'Le client Jean Dupont a créé un nouveau dossier TICPE',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          read: false,
          priority: 'medium',
          category: 'business',
          sender: 'Système',
          metadata: { dossierId: 'dossier456', amount: 5000 }
        },
        {
          id: '3',
          type: 'success',
          title: 'Expert assigné avec succès',
          message: 'L\'expert Marie Martin a été assigné au dossier URSSAF',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          read: true,
          priority: 'medium',
          category: 'business',
          sender: 'Système d\'assignation',
          metadata: { expertId: 'expert789', dossierId: 'dossier123' }
        },
        {
          id: '4',
          type: 'warning',
          title: 'Dossier en attente de validation',
          message: 'Le dossier DFS de la société ABC est en attente depuis 48h',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read: false,
          priority: 'high',
          category: 'business',
          sender: 'Système de workflow',
          metadata: { dossierId: 'dossier789', status: 'pending_validation' }
        },
        {
          id: '5',
          type: 'info',
          title: 'Mise à jour système',
          message: 'Une nouvelle version de la plateforme sera déployée ce soir',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          read: true,
          priority: 'low',
          category: 'system',
          sender: 'Équipe technique'
        }
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const deleteAllRead = useCallback(() => {
    setNotifications(prev => prev.filter(notification => !notification.read));
  }, []);

  return {
    notifications,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead
  };
};

const useNotificationStats = (notifications: Notification[]) => {
  return useMemo(() => ({
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    critical: notifications.filter(n => n.priority === 'critical').length,
    read: notifications.filter(n => n.read).length,
    byCategory: {
      user: notifications.filter(n => n.category === 'user').length,
      system: notifications.filter(n => n.category === 'system').length,
      security: notifications.filter(n => n.category === 'security').length,
      business: notifications.filter(n => n.category === 'business').length,
      compliance: notifications.filter(n => n.category === 'compliance').length
    }
  }), [notifications]);
};

// ============================================================================
// COMPOSANTS UTILITAIRES
// ============================================================================

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const NotificationCard: React.FC<NotificationCardProps> = React.memo(({ 
  notification, 
  onMarkAsRead, 
  onDelete 
}) => {
  const typeConfig = NOTIFICATION_TYPES[notification.type];
  const IconComponent = typeConfig.icon;
  const priorityColor = PRIORITY_COLORS[notification.priority];

  return (
    <div className={cn(
      "flex items-start space-x-3 p-4 rounded-lg border transition-all duration-200",
      notification.read 
        ? 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700' 
        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30'
    )}>
      <div className={cn("p-2 rounded-lg", typeConfig.bgColor)}>
        <IconComponent className={cn("w-4 h-4", typeConfig.color)} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className={cn(
                "font-medium truncate",
                notification.read 
                  ? 'text-gray-700 dark:text-gray-300' 
                  : 'text-gray-900 dark:text-gray-100'
              )}>
                {notification.title}
              </h4>
              <Badge className={priorityColor} variant="outline">
                {notification.priority}
              </Badge>
            </div>
            
            <p className={cn(
              "text-sm mb-2",
              notification.read 
                ? 'text-gray-600 dark:text-gray-400' 
                : 'text-gray-700 dark:text-gray-300'
            )}>
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{notification.sender}</span>
              <span>{new Date(notification.timestamp).toLocaleString('fr-FR')}</span>
            </div>
          </div>
        </div>
        
        {notification.action && (
          <div className="mt-3">
            <Button size="sm" variant="outline">
              {notification.action.label}
            </Button>
          </div>
        )}
      </div>
      
      <div className="flex flex-col space-y-1">
        {!notification.read && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onMarkAsRead(notification.id)}
            className="h-8 w-8 p-0"
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(notification.id)}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
});

NotificationCard.displayName = 'NotificationCard';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

const StatsCard: React.FC<StatsCardProps> = React.memo(({ title, value, icon: Icon, color, bgColor }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center space-x-4">
        <div className={cn("p-2 rounded-lg", bgColor)}>
          <Icon className={cn("w-6 h-6", color)} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {value}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
));

StatsCard.displayName = 'StatsCard';

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const NotificationsSystem: React.FC = React.memo(() => {
  const {
    notifications,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead
  } = useNotifications();

  const stats = useNotificationStats(notifications);
  
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadNotifications();
    loadTemplates();
  }, [loadNotifications]);

  const loadTemplates = useCallback(async () => {
    try {
      const mockTemplates: NotificationTemplate[] = [
        {
          id: '1',
          name: 'Nouveau dossier',
          type: 'info',
          title: 'Nouveau dossier créé',
          message: 'Le client {clientName} a créé un nouveau dossier {productType}',
          variables: ['clientName', 'productType'],
          category: 'business',
          priority: 'medium'
        },
        {
          id: '2',
          name: 'Expert assigné',
          type: 'success',
          title: 'Expert assigné avec succès',
          message: 'L\'expert {expertName} a été assigné au dossier {dossierId}',
          variables: ['expertName', 'dossierId'],
          category: 'business',
          priority: 'medium'
        }
      ];
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Erreur lors du chargement des templates:', error);
    }
  }, []);

  const updatePreferences = useCallback((updates: Partial<NotificationPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  }, []);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      const matchesFilter = filter === 'all' || notification.category === filter;
      const matchesSearch = search === '' || 
        notification.title.toLowerCase().includes(search.toLowerCase()) ||
        notification.message.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [notifications, filter, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Notifications
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestion des notifications et alertes système
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button onClick={loadNotifications} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          
          <Button onClick={() => setShowPreferences(true)} variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Préférences
          </Button>
          
          <Button onClick={() => setShowTemplates(true)} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Templates
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total"
          value={stats.total}
          icon={Bell}
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-100 dark:bg-blue-900/20"
        />
        <StatsCard
          title="Non lues"
          value={stats.unread}
          icon={Bell}
          color="text-red-600 dark:text-red-400"
          bgColor="bg-red-100 dark:bg-red-900/20"
        />
        <StatsCard
          title="Critiques"
          value={stats.critical}
          icon={AlertTriangle}
          color="text-yellow-600 dark:text-yellow-400"
          bgColor="bg-yellow-100 dark:bg-yellow-900/20"
        />
        <StatsCard
          title="Lues"
          value={stats.read}
          icon={Check}
          color="text-green-600 dark:text-green-400"
          bgColor="bg-green-100 dark:bg-green-900/20"
        />
      </div>

      {/* Filtres et actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher dans les notifications..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="user">Utilisateur</SelectItem>
                <SelectItem value="system">Système</SelectItem>
                <SelectItem value="security">Sécurité</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="compliance">Conformité</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              <Button onClick={markAllAsRead} variant="outline" size="sm">
                <Check className="w-4 h-4 mr-2" />
                Tout marquer comme lu
              </Button>
              <Button onClick={deleteAllRead} variant="outline" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer les lues
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Notifications ({filteredNotifications.length})</span>
            {stats.unread > 0 && (
              <Badge variant="destructive">
                {stats.unread} non lues
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Aucune notification</p>
                <p className="text-sm">
                  {search || filter !== 'all' 
                    ? 'Aucune notification ne correspond à vos critères de recherche'
                    : 'Vous n\'avez aucune notification pour le moment'
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog Préférences */}
      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Préférences de notifications</DialogTitle>
            <DialogDescription>
              Configurez vos préférences de notifications
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-4">Canaux de notification</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email">Notifications par email</Label>
                  <Switch
                    id="email"
                    checked={preferences.email}
                    onCheckedChange={(checked) => updatePreferences({ email: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push">Notifications push</Label>
                  <Switch
                    id="push"
                    checked={preferences.push}
                    onCheckedChange={(checked) => updatePreferences({ push: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms">Notifications SMS</Label>
                  <Switch
                    id="sms"
                    checked={preferences.sms}
                    onCheckedChange={(checked) => updatePreferences({ sms: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="inApp">Notifications in-app</Label>
                  <Switch
                    id="inApp"
                    checked={preferences.inApp}
                    onCheckedChange={(checked) => updatePreferences({ inApp: checked })}
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Catégories</h4>
              <div className="space-y-4">
                {Object.entries(preferences.categories).map(([category, enabled]) => (
                  <div key={category} className="flex items-center justify-between">
                    <Label htmlFor={category} className="capitalize">
                      {category}
                    </Label>
                    <Switch
                      id={category}
                      checked={enabled}
                      onCheckedChange={(checked) => 
                        updatePreferences({ 
                          categories: { 
                            ...preferences.categories, 
                            [category]: checked 
                          } 
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowPreferences(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Templates */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Templates de notifications</DialogTitle>
            <DialogDescription>
              Gérez vos templates de notifications
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {template.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        Variables: {template.variables.join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{template.category}</Badge>
                      <Badge variant="outline">{template.priority}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowTemplates(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

NotificationsSystem.displayName = 'NotificationsSystem';