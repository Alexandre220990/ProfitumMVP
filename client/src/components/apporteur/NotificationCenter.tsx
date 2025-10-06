import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Bell, Check, X, AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface NotificationCenterProps {
  apporteurId?: string;
}

export function NotificationCenter({ apporteurId }: NotificationCenterProps) {
  // Utilisation de apporteurId pour les futures requêtes API
  console.log('Apporteur ID:', apporteurId);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Données simulées
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Nouveau prospect qualifié',
        message: 'Entreprise ABC a été qualifiée comme prospect chaud',
        type: 'success',
        timestamp: 'Il y a 2 heures',
        read: false,
        priority: 'high'
      },
      {
        id: '2',
        title: 'Rendez-vous confirmé',
        message: 'Votre RDV avec Société XYZ est confirmé pour demain 14h',
        type: 'info',
        timestamp: 'Il y a 4 heures',
        read: false,
        priority: 'medium'
      },
      {
        id: '3',
        title: 'Commission payée',
        message: 'Votre commission de 2 250€ a été versée sur votre compte',
        type: 'success',
        timestamp: 'Il y a 1 jour',
        read: true,
        priority: 'high'
      }
    ];
    setNotifications(mockNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'info': return <Info className="h-4 w-4 text-blue-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 bg-red-600 text-white text-xs">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm">Notifications</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Tout marquer comme lu
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-xs"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>Aucune notification</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b hover:bg-gray-50 ${
                          !notification.read ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {getTypeIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {notification.title}
                              </h4>
                              <Badge className={getPriorityColor(notification.priority)}>
                                {notification.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {notification.timestamp}
                              </span>
                              <div className="flex space-x-1">
                                {!notification.read && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeNotification(notification.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}