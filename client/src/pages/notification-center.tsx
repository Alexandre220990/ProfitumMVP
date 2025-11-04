import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  BellOff, 
  Settings, 
  Check, 
  X, 
  AlertCircle, 
  FileText, 
  Users, 
  Shield, 
  Search, 
  Trash2,
  Filter,
  Calendar,
  MessageSquare,
  Clock,
  Star,
  Mail,
  Smartphone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useSupabaseNotifications } from '@/hooks/useSupabaseNotifications';

const NotificationCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.type || 'client';

  // Hooks de notifications
  const {
    isSupported,
    isEnabled,
    isLoading: loadingPush,
    requestPermission
  } = usePushNotifications();

  const { notifications, loading, reload } = useSupabaseNotifications();
  
  // État local
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'important' | 'calendar' | 'messages'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);
  const [filterPriority, setFilterPriority] = useState<'low' | 'normal' | 'high' | 'urgent' | 'all'>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Statistiques
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const importantCount = notifications.filter(n => n.priority === 'high' || n.priority === 'urgent').length;
  const calendarCount = notifications.filter(n => n.notification_type.includes('calendar')).length;
  const messageCount = notifications.filter(n => n.notification_type.includes('message')).length;

  // Filtrage des notifications
  const getFilteredNotifications = () => {
    let filtered = notifications;

    // Filtre par onglet
    switch (activeTab) {
      case 'unread':
        filtered = filtered.filter(n => !n.is_read);
        break;
      case 'important':
        filtered = filtered.filter(n => n.priority === 'high' || n.priority === 'urgent');
        break;
      case 'calendar':
        filtered = filtered.filter(n => n.notification_type.includes('calendar'));
        break;
      case 'messages':
        filtered = filtered.filter(n => n.notification_type.includes('message'));
        break;
    }

    // Filtre par recherche
    if (searchQuery) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtre par priorité
    if (filterPriority !== 'all') {
      filtered = filtered.filter(n => n.priority === filterPriority);
    }

    // Filtre par type
    if (filterType !== 'all') {
      filtered = filtered.filter(n => n.notification_type === filterType);
    }

    // Filtre par rôle utilisateur
    if (userRole === 'client' && filtered.some(n => n.user_type === 'admin')) {
      filtered = filtered.filter(n => n.user_type !== 'admin');
    }
    if (userRole === 'expert' && filtered.some(n => n.user_type === 'admin')) {
      filtered = filtered.filter(n => n.user_type !== 'admin');
    }

    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();

  // Actions
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      // TODO: Implémenter l'action marquer comme lu
      console.log('Marquer comme lu:', notificationId);
      await reload();
    } catch (error) {
      console.error('Erreur marquer comme lu:', error);
    }
  };

  // ✅ Navigation sur clic de notification
  const handleNotificationClick = async (notification: any) => {
    // Marquer comme lu si non lu
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }

    // Naviguer vers l'action_url si disponible
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // TODO: Implémenter l'action marquer tout comme lu
      console.log('Marquer tout comme lu');
      await reload();
    } catch (error) {
      console.error('Erreur marquer tout comme lu:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      // TODO: Implémenter l'action supprimer notification
      console.log('Supprimer notification:', notificationId);
      await reload();
    } catch (error) {
      console.error('Erreur supprimer notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'calendar_event_created':
      case 'calendar_event_updated':
      case 'calendar_event_reminder':
        return <Calendar className="h-4 w-4" />;
      case 'message_received':
      case 'message_urgent':
        return <MessageSquare className="h-4 w-4" />;
      case 'deadline_reminder':
      case 'validation_reminder':
        return <Clock className="h-4 w-4" />;
      case 'document_uploaded':
      case 'document_validated':
      case 'document_rejected':
        return <FileText className="h-4 w-4" />;
      case 'expert_assignment':
      case 'expert_approved':
        return <Users className="h-4 w-4" />;
      case 'system_alert':
      case 'security_alert':
        return <Shield className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case 'client':
        return 'Client';
      case 'expert':
        return 'Expert';
      case 'admin':
        return 'Administrateur';
      default:
        return 'Utilisateur';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="h-5 w-5 mr-2" />
                Retour
              </Button>
              <div className="flex items-center space-x-3">
                <Bell className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Centre de Notifications</h1>
                  <p className="text-sm text-gray-500">{getRoleLabel()} • {notifications.length} notifications</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowPreferences(!showPreferences)}
                className="flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Préférences</span>
              </Button>
              
              {unreadCount > 0 && (
                <Button
                  onClick={handleMarkAllAsRead}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Tout marquer comme lu
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Préférences */}
          {showPreferences && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Préférences</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Notifications Push */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">Notifications Push</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Activer les notifications push</span>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={requestPermission}
                          disabled={!isSupported || loadingPush}
                        />
                      </div>
                      {!isSupported && (
                        <p className="text-xs text-red-600">Non supporté par votre navigateur</p>
                      )}
                    </div>
                  </div>

                  {/* Canaux de notification */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">Canaux de notification</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Email</span>
                        </div>
                        <Switch
                          checked={true}
                          onCheckedChange={() => {}}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Smartphone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Push</span>
                        </div>
                        <Switch
                          checked={true}
                          onCheckedChange={() => {}}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Filtres */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">Filtres</h3>
                    <div className="space-y-2">
                      <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value as 'low' | 'normal' | 'high' | 'urgent' | 'all')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="all">Toutes les priorités</option>
                        <option value="urgent">Urgent</option>
                        <option value="high">Élevée</option>
                        <option value="normal">Normale</option>
                        <option value="low">Faible</option>
                      </select>
                      
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="all">Tous les types</option>
                        <option value="calendar_event_created">Événements calendrier</option>
                        <option value="message_received">Messages</option>
                        <option value="document_uploaded">Documents</option>
                        <option value="deadline_reminder">Rappels</option>
                        <option value="system_alert">Alertes système</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main content */}
          <div className={cn("space-y-6", showPreferences ? "lg:col-span-3" : "lg:col-span-4")}>
            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher dans les notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPreferences(!showPreferences)}
                  className="flex items-center space-x-2"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filtres</span>
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all" className="flex items-center space-x-2">
                  <Bell className="h-4 w-4" />
                  <span>Toutes</span>
                  {notifications.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {notifications.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="unread" className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>Non lues</span>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-1">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="important" className="flex items-center space-x-2">
                  <Star className="h-4 w-4" />
                  <span>Importantes</span>
                  {importantCount > 0 && (
                    <Badge variant="destructive" className="ml-1">
                      {importantCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Calendrier</span>
                  {calendarCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {calendarCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="messages" className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Messages</span>
                  {messageCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {messageCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : filteredNotifications.length === 0 ? (
                      <div className="text-center py-12">
                        <BellOff className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune notification</h3>
                        <p className="text-gray-500">
                          {activeTab === 'all' 
                            ? "Vous n'avez aucune notification pour le moment."
                            : `Aucune notification ${activeTab === 'unread' ? 'non lue' : activeTab === 'important' ? 'importante' : activeTab === 'calendar' ? 'de calendrier' : 'de message'} trouvée.`
                          }
                        </p>
                      </div>
                    ) : (
                      filteredNotifications.map((notification) => (
                        <Card
                          key={notification.id}
                          className={cn(
                            "transition-all duration-200 hover:shadow-md cursor-pointer",
                            !notification.is_read && "border-l-4 border-l-blue-500 bg-blue-50"
                          )}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1">
                                <div className={cn(
                                  "p-2 rounded-full",
                                  !notification.is_read ? "bg-blue-100" : "bg-gray-100"
                                )}>
                                  {getNotificationIcon(notification.notification_type)}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h3 className={cn(
                                      "text-sm font-medium truncate",
                                      !notification.is_read ? "text-gray-900" : "text-gray-700"
                                    )}>
                                      {notification.title}
                                    </h3>
                                    <Badge 
                                      variant="outline" 
                                      className={cn("text-xs", getPriorityColor(notification.priority))}
                                    >
                                      {notification.priority}
                                    </Badge>
                                  </div>
                                  
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  
                                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <span>
                                      {new Date(notification.created_at).toLocaleString('fr-FR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                    <span className="capitalize">{notification.notification_type.replace('_', ' ')}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-1 ml-4" onClick={(e) => e.stopPropagation()}>
                                {!notification.is_read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkAsRead(notification.id);
                                    }}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteNotification(notification.id);
                                  }}
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenterPage; 