import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, BellOff, Settings, Check, X, AlertCircle, Info, FileText, Users, Zap, Shield, Search, Trash2, Archive, ArchiveRestore } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useSupabaseNotifications } from '@/hooks/useSupabaseNotifications';
import { toast } from 'sonner';

const UnifiedNotificationCenter: React.FC = () => {
  // Détection du rôle utilisateur
  const { user } = useAuth();
  const userRole = user?.type || 'client'; // fallback client

  // Préférences et notifications push
  const {
    isSupported,
    isEnabled,
    isLoading: loadingPush,
    requestPermission,
    preferences,
    updatePreferences
  } = usePushNotifications();

  // Utilisation du hook factorisé
  const { notifications, loading } = useSupabaseNotifications();
  
  // État local
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);

  // Filtrage dynamique selon le rôle
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) || notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filtre par statut
    let matchesFilter = true;
    if (filter === 'unread') {
      matchesFilter = notification.status === 'unread' || !notification.is_read;
    } else if (filter === 'archived') {
      matchesFilter = notification.status === 'archived';
    } else if (filter === 'all') {
      // "All" exclut les archivées
      matchesFilter = notification.status !== 'archived';
    }
    
    if (userRole === 'client' && notification.user_type === 'admin') return false;
    if (userRole === 'expert' && notification.user_type === 'admin') return false;
    return matchesSearch && matchesFilter;
  });

  // Actions
  const markAsRead = async (notificationId: string) => {
    try {
      let endpoint = `/api/notifications/${notificationId}/read`;
      let method: 'PUT' | 'POST' | 'PATCH' = 'PUT';

      if (userRole === 'expert') {
        endpoint = `/api/expert/notifications/${notificationId}/read`;
        method = 'POST';
      } else if (userRole === 'admin') {
        endpoint = `/api/admin/notifications/${notificationId}/read`;
        method = 'PATCH';
      }

      const token = localStorage.getItem('token') || '';
      const headers: Record<string, string> = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      if (method === 'PUT' || method === 'POST' || method === 'PATCH') {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(endpoint, { method, headers });

      if (response.status === 404) {
        toast.info('Notification introuvable ou déjà traitée.');
        return;
      }

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }
      // Le hook realtime mettra à jour automatiquement l'état
    } catch (error) { console.error('Erreur marquage lu:', error); }
  };

  const archiveNotification = async (notificationId: string) => {
    try {
      let endpoint = `/api/notifications/${notificationId}/archive`;
      let method: 'PUT' | 'POST' | 'DELETE' = 'PUT';

      if (userRole === 'expert') {
        endpoint = `/api/expert/notifications/${notificationId}/archive`;
        method = 'POST';
      } else if (userRole === 'admin') {
        endpoint = `/api/admin/notifications/${notificationId}/archive`;
        method = 'DELETE';
      }

      const token = localStorage.getItem('token') || '';
      const headers: Record<string, string> = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      if (method !== 'DELETE') {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(endpoint, { 
        method,
        headers
      });
      
      if (response.ok) {
        console.log('✅ Notification archivée');
      }
      // Le hook realtime mettra à jour automatiquement l'état
    } catch (error) { console.error('Erreur archivage:', error); }
  };

  const unarchiveNotification = async (notificationId: string) => {
    try {
      let endpoint = `/api/notifications/${notificationId}/unarchive`;
      let method: 'PUT' | 'POST' | 'PATCH' = 'PUT';

      if (userRole === 'expert') {
        endpoint = `/api/expert/notifications/${notificationId}/unarchive`;
        method = 'POST';
      } else if (userRole === 'admin') {
        console.warn('Endpoint unarchive indisponible pour les admins');
        return;
      }

      const token = localStorage.getItem('token') || '';
      const headers: Record<string, string> = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      if (method === 'PUT' || method === 'POST' || method === 'PATCH') {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(endpoint, { 
        method,
        headers
      });
      
      if (response.ok) {
        console.log('✅ Notification restaurée');
      }
      // Le hook realtime mettra à jour automatiquement l'état
    } catch (error) { console.error('Erreur restauration:', error); }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      let endpoint = `/api/notifications/${notificationId}`;
      if (userRole === 'expert') endpoint = `/api/expert/notifications/${notificationId}`;
      if (userRole === 'admin') endpoint = `/api/admin/notifications/${notificationId}`;
      await fetch(endpoint, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      // Le hook realtime mettra à jour automatiquement l'état
    } catch (error) { console.error('Erreur suppression:', error); }
  };

  // UI helpers
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <Check className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <X className="h-4 w-4 text-red-500" />;
      case 'security': return <Shield className="h-4 w-4 text-purple-500" />;
      case 'system': return <Zap className="h-4 w-4 text-indigo-500" />;
      case 'user': return <Users className="h-4 w-4 text-blue-500" />;
      case 'business': return <FileText className="h-4 w-4 text-emerald-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'À l\'instant';
    if (diffInHours < 24) return `Il y a ${Math.floor(diffInHours)}h`;
    if (diffInHours < 48) return 'Hier';
    return date.toLocaleDateString('fr-FR');
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case 'client': return 'Client';
      case 'expert': return 'Expert';
      case 'admin': return 'Administrateur';
      default: return 'Utilisateur';
    }
  };

  // Actions rapides
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(unreadNotifications.map(n => markAsRead(n.id)));
    } catch (error) {
      console.error('Erreur marquage tout lu:', error);
    }
  };

  const deleteAllRead = async () => {
    try {
      const readNotifications = notifications.filter(n => n.is_read);
      await Promise.all(readNotifications.map(n => deleteNotification(n.id)));
    } catch (error) {
      console.error('Erreur suppression tout lu:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Bell className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Centre de Notifications</h2>
              <p className="text-sm text-gray-500">{getRoleLabel()} • {notifications.length} notifications</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreferences(!showPreferences)}
              className="flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Préférences</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.close()}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex">
          {/* Sidebar */}
          <div className="w-64 border-r bg-gray-50 p-4">
            <div className="space-y-4">
              {/* Filtres */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Filtres</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between",
                      filter === 'all' ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <span>Toutes</span>
                    <Badge variant="secondary" className="ml-2">
                      {notifications.filter(n => n.status !== 'archived').length}
                    </Badge>
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between",
                      filter === 'unread' ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <span>Non lues</span>
                    <Badge variant="secondary" className="ml-2 bg-blue-500 text-white">
                      {notifications.filter(n => n.status === 'unread' || !n.is_read).length}
                    </Badge>
                  </button>
                  <button
                    onClick={() => setFilter('archived')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between",
                      filter === 'archived' ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <div className="flex items-center">
                      <Archive className="h-4 w-4 mr-2" />
                      <span>Archivées</span>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {notifications.filter(n => n.status === 'archived').length}
                    </Badge>
                  </button>
                </div>
              </div>

              {/* Actions rapides */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Actions</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllAsRead}
                    className="w-full justify-start"
                    disabled={!notifications.some(n => !n.is_read)}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Tout marquer comme lu
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deleteAllRead}
                    className="w-full justify-start text-red-600 hover:text-red-700"
                    disabled={!notifications.some(n => n.is_read)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer tout lu
                  </Button>
                </div>
              </div>

              {/* Préférences */}
              {showPreferences && (
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Préférences</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Notifications push</span>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={requestPermission}
                        disabled={!isSupported || loadingPush}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Notifications email</span>
                      <Switch
                        checked={preferences?.email_enabled || false}
                        onCheckedChange={(checked) => updatePreferences({ email_enabled: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Notifications SMS</span>
                      <Switch
                        checked={preferences?.sms_enabled || false}
                        onCheckedChange={(checked) => updatePreferences({ sms_enabled: checked })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col">
            {/* Search bar */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher dans les notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Notifications list */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <BellOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucune notification trouvée</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={cn(
                        "transition-all duration-200 hover:shadow-md cursor-pointer",
                        !notification.is_read && "border-l-4 border-l-blue-500 bg-blue-50"
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="mt-1">
                              {getTypeIcon(notification.notification_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-medium text-gray-900 truncate">
                                  {notification.title}
                                </h4>
                                <Badge
                                  variant="secondary"
                                  className={cn("text-xs", getPriorityColor(notification.priority))}
                                >
                                  {notification.priority}
                                </Badge>
                                {!notification.is_read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>{formatDate(notification.created_at)}</span>
                                <span className="capitalize">{notification.user_type}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 ml-4">
                            {notification.status === 'archived' ? (
                              // Boutons pour notifications archivées
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => unarchiveNotification(notification.id)}
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                  title="Restaurer"
                                >
                                  <ArchiveRestore className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNotification(notification.id)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  title="Supprimer définitivement"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              // Boutons pour notifications actives
                              <>
                                {notification.status === 'unread' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                    className="h-8 w-8 p-0"
                                    title="Marquer comme lu"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => archiveNotification(notification.id)}
                                  className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
                                  title="Archiver"
                                >
                                  <Archive className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNotification(notification.id)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedNotificationCenter; 