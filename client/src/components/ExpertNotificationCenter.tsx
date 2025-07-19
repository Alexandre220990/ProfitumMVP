import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { 
  Bell, 
  MessageCircle, 
  Briefcase, 
  AlertCircle,
  Clock,
  Euro
} from "lucide-react";
import type { ExpertNotification } from "@/types/notification";

const ExpertNotificationCenter = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<ExpertNotification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        // Simuler des notifications pour l'exemple
        const mockNotifications: ExpertNotification[] = [
          {
            id: '1',
            type: 'assignment',
            title: 'Nouvelle assignation',
            message: 'Vous avez reçu une nouvelle assignation pour un audit TICPE',
            timestamp: new Date().toISOString(),
            read: false,
            actionUrl: '/expert/assignments/1',
            priority: 'high',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            type: 'message',
            title: 'Nouveau message',
            message: 'Message de la part de votre client concernant l\'audit en cours',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            read: false,
            actionUrl: '/expert/messagerie',
            priority: 'normal',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            updated_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: '3',
            type: 'payment',
            title: 'Paiement reçu',
            message: 'Vous avez reçu un paiement de 1500€ pour l\'audit TICPE',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            read: true,
            actionUrl: '/expert/mes-affaires',
            priority: 'normal',
            created_at: new Date(Date.now() - 7200000).toISOString(),
            updated_at: new Date(Date.now() - 7200000).toISOString()
          },
          {
            id: '4',
            type: 'reminder',
            title: 'Rappel - Échéance',
            message: 'Rappel : Échéance pour l\'audit énergétique dans 2 jours',
            timestamp: new Date(Date.now() - 10800000).toISOString(),
            read: true,
            actionUrl: '/expert/agenda',
            priority: 'high',
            created_at: new Date(Date.now() - 10800000).toISOString(),
            updated_at: new Date(Date.now() - 10800000).toISOString()
          }
        ];
        
        setNotifications(mockNotifications);
      } catch (error) {
        console.error('Erreur chargement notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, [user]);

  const handleNotificationClick = (notification: ExpertNotification) => {
    // Marquer comme lu
    setNotifications(prev => 
      prev.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      )
    );
    
    // Naviguer vers l'action
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2 border-b">
          <h4 className="font-medium">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs"
            >
              Tout marquer comme lu
            </Button>
          )}
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              Chargement...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Aucune notification
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-3 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start space-x-3 w-full">
                  <div className="flex-shrink-0 mt-1">
                    {notification.type === 'assignment' && <Briefcase className="h-4 w-4 text-blue-600" />}
                    {notification.type === 'message' && <MessageCircle className="h-4 w-4 text-green-600" />}
                    {notification.type === 'payment' && <Euro className="h-4 w-4 text-green-600" />}
                    {notification.type === 'reminder' && <Clock className="h-4 w-4 text-orange-600" />}
                    {notification.type === 'system' && <AlertCircle className="h-4 w-4 text-gray-600" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </p>
                      <Badge 
                        variant={notification.priority === 'high' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {notification.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(notification.timestamp).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
        
        {notifications.length > 0 && (
          <DropdownMenuSeparator />
        )}
        
        <div className="p-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/expert/notifications')}
            className="w-full"
          >
            Voir toutes les notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExpertNotificationCenter; 