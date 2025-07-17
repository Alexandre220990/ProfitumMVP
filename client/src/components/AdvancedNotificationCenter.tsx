import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  BellOff, 
  Settings, 
  Check,
  X,
  AlertCircle,
  Info,
  FileText,
  Users,
  Zap,
  Shield,
  Mail,
  Smartphone,
  Monitor,
  Search,
  Trash2,
  Star,
  StarOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'security' | 'system' | 'user' | 'business';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  starred: boolean;
  created_at: string;
  data?: any;
}

interface AdvancedNotificationCenterProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdvancedNotificationCenter({ 
  className,
  isOpen = false,
  onClose 
}: AdvancedNotificationCenterProps) {
  const {
    isSupported,
    isEnabled,
    isLoading,
    requestPermission,
    sendTestNotification,
    preferences,
    updatePreferences,
    isQuietHours
  } = usePushNotifications();

  // État local
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);

  // Charger les notifications
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
  };

  // Filtrer les notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'unread' && !notification.read) ||
      (filter === 'starred' && notification.starred);
    
    return matchesSearch && matchesFilter;
  });

  // Marquer comme lu
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Erreur marquage lu:', error);
    }
  };

  // Marquer comme favori
  const toggleStarred = async (notificationId: string) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      const newStarred = !notification?.starred;
      
      await fetch(`/api/notifications/${notificationId}/star`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ starred: newStarred })
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, starred: newStarred } : n)
      );
    } catch (error) {
      console.error('Erreur toggle favori:', error);
    }
  };

  // Supprimer une notification
  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  // Obtenir l'icône selon le type
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

  // Obtenir la couleur de priorité
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  if (!isOpen) return null;

  return (
    <div className={cn("fixed inset-0 z-50 bg-black/50 flex items-center justify-center", className)}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Bell className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Centre de Notifications</h2>
              <p className="text-sm text-gray-600">
                {isEnabled ? 'Notifications activées' : 'Notifications désactivées'}
                {isQuietHours && ' • Heures silencieuses'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isEnabled && isSupported && (
              <Button onClick={requestPermission} disabled={isLoading}>
                <Bell className="h-4 w-4 mr-2" />
                Activer
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => setShowPreferences(!showPreferences)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Filtres et préférences */}
          <div className="w-80 border-r bg-gray-50">
            <Tabs defaultValue="notifications" className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="preferences">Préférences</TabsTrigger>
              </TabsList>

              <TabsContent value="notifications" className="h-full">
                <div className="p-4 space-y-4">
                  {/* Recherche */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Filtres */}
                  <div className="space-y-2">
                    <Button
                      variant={filter === 'all' ? 'default' : 'ghost'}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setFilter('all')}
                    >
                      Toutes ({notifications.length})
                    </Button>
                    <Button
                      variant={filter === 'unread' ? 'default' : 'ghost'}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setFilter('unread')}
                    >
                      Non lues ({notifications.filter(n => !n.read).length})
                    </Button>
                    <Button
                      variant={filter === 'starred' ? 'default' : 'ghost'}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setFilter('starred')}
                    >
                      Favoris ({notifications.filter(n => n.starred).length})
                    </Button>
                  </div>

                  {/* Actions rapides */}
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={sendTestNotification}
                      disabled={!isEnabled}
                    >
                      Test Notification
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preferences" className="h-full">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-6">
                    {/* Canaux de notification */}
                    <div>
                      <h3 className="font-medium mb-3">Canaux de notification</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Monitor className="h-4 w-4" />
                            <span>Dans l'application</span>
                          </div>
                          <Switch
                            checked={preferences?.inApp ?? true}
                            onCheckedChange={(checked) => 
                              updatePreferences({ inApp: checked })
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Bell className="h-4 w-4" />
                            <span>Notifications push</span>
                          </div>
                          <Switch
                            checked={preferences?.push ?? false}
                            onCheckedChange={(checked) => 
                              updatePreferences({ push: checked })
                            }
                            disabled={!isEnabled}
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>Email</span>
                          <Switch
                            checked={preferences?.email ?? false}
                            onCheckedChange={(checked) => 
                              updatePreferences({ email: checked })
                            }
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Smartphone className="h-4 w-4" />
                          <span>SMS</span>
                          <Switch
                            checked={preferences?.sms ?? false}
                            onCheckedChange={(checked) => 
                              updatePreferences({ sms: checked })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Heures silencieuses */}
                    <div>
                      <h3 className="font-medium mb-3">Heures silencieuses</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span>Activer</span>
                          <Switch
                            checked={preferences?.quietHours?.enabled ?? false}
                            onCheckedChange={(checked) => 
                                                        updatePreferences({ 
                            quietHours: { 
                              enabled: checked,
                              start: preferences?.quietHours?.start || '22:00',
                              end: preferences?.quietHours?.end || '08:00'
                            } 
                          })
                            }
                          />
                        </div>
                        
                        {preferences?.quietHours?.enabled && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-sm text-gray-600">Début</label>
                              <input
                                type="time"
                                value={preferences.quietHours.start}
                                onChange={(e) => 
                                  updatePreferences({ 
                                    quietHours: { 
                                      ...preferences.quietHours, 
                                      start: e.target.value 
                                    } 
                                  })
                                }
                                className="w-full p-2 border rounded"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-gray-600">Fin</label>
                              <input
                                type="time"
                                value={preferences.quietHours.end}
                                onChange={(e) => 
                                  updatePreferences({ 
                                    quietHours: { 
                                      ...preferences.quietHours, 
                                      end: e.target.value 
                                    } 
                                  })
                                }
                                className="w-full p-2 border rounded"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Catégories */}
                    <div>
                      <h3 className="font-medium mb-3">Catégories</h3>
                      <div className="space-y-2">
                        {Object.entries(preferences?.categories || {}).map(([category, enabled]) => (
                          <div key={category} className="flex items-center justify-between">
                            <span className="capitalize">{category}</span>
                            <Switch
                              checked={enabled}
                              onCheckedChange={(checked) => 
                                updatePreferences({ 
                                  categories: { 
                                    ...preferences?.categories, 
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
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          {/* Zone principale - Liste des notifications */}
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <BellOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucune notification</p>
                    <p className="text-sm text-gray-400">
                      {filter === 'all' ? 'Vous êtes à jour !' : 'Aucune notification correspondant aux filtres'}
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        !notification.read && "border-blue-200 bg-blue-50",
                        notification.starred && "border-yellow-200 bg-yellow-50"
                      )}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {getTypeIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-medium text-sm line-clamp-2">
                                  {notification.title}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                              </div>
                              
                              <div className="flex items-center space-x-1 ml-2">
                                <Badge 
                                  variant="outline" 
                                  className={getPriorityColor(notification.priority)}
                                >
                                  {notification.priority}
                                </Badge>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleStarred(notification.id);
                                  }}
                                >
                                  {notification.starred ? (
                                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                  ) : (
                                    <StarOff className="h-4 w-4 text-gray-400" />
                                  )}
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-gray-400" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-400">
                                {formatDate(notification.created_at)}
                              </span>
                              
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
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
} 