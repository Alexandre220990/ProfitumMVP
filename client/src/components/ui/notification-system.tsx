import { createContext, useContext, useCallback, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, AlertCircle, Info, Bell, CheckCircle } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

// Types pour les notifications
export interface Notification { id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void; };
  timestamp: Date;
  read: boolean
}

interface NotificationContextType { notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Hook pour utiliser les notifications
export const useNotifications = () => { const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider'); }
  return context;
};

// Provider des notifications
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => { const [notifications, setNotifications] = useState<Notification[]>([]);

  // Demander la permission pour les notifications push
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission(); }
  }, []);

  // Ajouter une notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => { const newNotification: Notification = {
      ...notification, id: Math.random().toString(36).substr(2, 9), timestamp: new Date(), read: false };

    setNotifications(prev => [newNotification, ...prev]);

    // Notification push si autorisée
    if ('Notification' in window && Notification.permission === 'granted') { new Notification(notification.title, {
        body: notification.message, icon: '/Logo-Profitum.png', badge: '/Logo-Profitum.png', tag: newNotification.id, requireInteraction: notification.type === 'error' });
    }

    // Auto-suppression après durée
    if (notification.duration !== 0) { setTimeout(() => {
        removeNotification(newNotification.id); }, notification.duration || 5000);
    }
  }, []);

  // Supprimer une notification
  const removeNotification = useCallback((id: string) => { setNotifications(prev => prev.filter(n => n.id !== id)); }, []);

  // Marquer comme lu
  const markAsRead = useCallback((id: string) => { setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  // Marquer toutes comme lues
  const markAllAsRead = useCallback(() => { setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Effacer toutes les notifications
  const clearAll = useCallback(() => { setNotifications([]); }, []);

  // Compter les notifications non lues
  const unreadCount = notifications.filter(n => !n.read).length;

  const value: NotificationContextType = { notifications, addNotification, removeNotification, markAsRead, markAllAsRead, clearAll, unreadCount };

  return (
    <NotificationContext.Provider value={ value }>
      { children }
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

// Composant d'affichage des notifications
const NotificationContainer: React.FC = () => { const { notifications, removeNotification, markAsRead, markAllAsRead, clearAll, unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (type: Notification['type']) => { switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />; }
  };

  const getTypeStyles = (type: Notification['type']) => { switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50 dark: bg-green-900/20 dark:border-green-800';
      case 'error':
        return 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'info':
        return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800'; }
  };

  if (!document.body) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-2">
      { /* Bouton de notification */ }
      <div className="relative">
        <Button
          variant="outline"
          size="icon"
          onClick={ () => setIsOpen(!isOpen) }
          className="relative"
        >
          <Bell className="w-5 h-5" />
          { unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount }
            </span>
          )}
        </Button>
      </div>

      { /* Panneau des notifications */ }
      { isOpen && (
        <div className="bg-white dark: bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-80 max-h-96 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Notifications
            </h3>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Tout marquer comme lu
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={ clearAll }
                className="text-xs"
              >
                Effacer tout
              </Button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            { notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark: text-gray-400">
                Aucune notification
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={ cn(
                    'p-4 border-b border-gray-100 dark: border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors, ', getTypeStyles(notification.type), !notification.read && 'bg-blue-50 dark: bg-blue-900/10'
) }
                  onClick={ () => markAsRead(notification.id) }
                >
                  <div className="flex items-start space-x-3">
                    { getIcon(notification.type) }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark: text-gray-100">
                        { notification.title }
                      </p>
                      <p className="text-sm text-gray-600 dark: text-gray-300 mt-1">
                        { notification.message }
                      </p>
                      { notification.action && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            notification.action!.onClick(); }}
                          className="p-0 h-auto text-xs mt-2"
                        >
                          { notification.action.label }
                        </Button>
                      )}
                      <p className="text-xs text-gray-400 dark: text-gray-500 mt-2">
                        { notification.timestamp.toLocaleTimeString() }
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={ (e) => {
                        e.stopPropagation();
                        removeNotification(notification.id); }}
                      className="text-gray-400 hover: text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      { /* Notifications toast */ }
      <div className="space-y-2">
        { notifications.slice(0, 3).map((notification) => (
          <div
            key={notification.id }
            className={ cn(
              'p-4 rounded-lg border shadow-lg max-w-sm animate-slide-in-right', getTypeStyles(notification.type)
            ) }
          >
            <div className="flex items-start space-x-3">
              { getIcon(notification.type) }
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark: text-gray-100">
                  { notification.title }
                </p>
                <p className="text-sm text-gray-600 dark: text-gray-300 mt-1">
                  { notification.message }
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={ () => removeNotification(notification.id) }
                className="text-gray-400 hover: text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ),)}
      </div>
    </div>,
    document.body
  );
}; 