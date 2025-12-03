/**
 * ApporteurNotificationGroup - Composant pour afficher une notification parent avec ses enfants
 * Système expand/collapse pour visualiser les détails (version Apporteur)
 * Groupement par PROSPECT/CLIENT apporté
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronRight, 
  Eye,
  Trash2,
  Zap,
  AlertTriangle,
  Clock,
  Bell,
  FileText
} from 'lucide-react';
import { config } from '@/config/env';

interface Notification {
  id: string;
  user_id: string;
  user_type: string;
  title: string;
  message: string;
  notification_type: string;
  priority: 'low' | 'normal' | 'medium' | 'high' | 'urgent';
  is_read: boolean;
  is_parent?: boolean;
  is_child?: boolean;
  hidden_in_list?: boolean;
  children_count?: number;
  parent_id?: string;
  action_url?: string;
  action_data?: any;
  metadata?: any;
  created_at: string;
}

interface ApporteurNotificationGroupProps {
  notification: Notification;
  onNotificationClick: (notification: Notification) => void;
  onDismiss: (notificationId: string) => void;
}

export function ApporteurNotificationGroup({ 
  notification, 
  onNotificationClick, 
  onDismiss
}: ApporteurNotificationGroupProps) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<Notification[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);

  const isUrgent = notification.priority === 'urgent' || notification.priority === 'high';
  const childrenCount = notification.children_count || 0;

  const loadChildren = async () => {
    if (children.length > 0) {
      setExpanded(!expanded);
      return;
    }

    setLoadingChildren(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/api/notifications/${notification.id}/children`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setChildren(data.data);
          setExpanded(true);
        }
      }
    } catch (error) {
      console.error('❌ Erreur chargement enfants:', error);
    } finally {
      setLoadingChildren(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Zap className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const formatTimeElapsed = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `il y a ${diffDays}j`;
    } else if (diffHours > 0) {
      return `il y a ${diffHours}h`;
    } else {
      return 'À l\'instant';
    }
  };

  const getNotificationTileClasses = (notif: Notification, isChild: boolean = false) => {
    const baseClasses = isChild 
      ? 'p-3 rounded-md border cursor-pointer transition-all hover:shadow-sm ml-8'
      : 'p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md';
    
    const unreadClasses = !notif.is_read 
      ? 'bg-blue-50/80 border-blue-300 shadow-sm' 
      : 'bg-white border-gray-200';
    
    const urgentClasses = (notif.priority === 'urgent' || notif.priority === 'high') && !notif.is_read
      ? 'ring-2 ring-red-300/50 border-red-300'
      : '';
    
    return `${baseClasses} ${unreadClasses} ${urgentClasses}`;
  };

  return (
    <div>
      {/* NOTIFICATION PARENT */}
      <div className={getNotificationTileClasses(notification)}>
        <div className="flex items-start gap-3">
          {/* Indicateur non lue */}
          {!notification.is_read && (
            <div className="flex-shrink-0 mt-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            </div>
          )}
          
          {/* Bouton expand/collapse */}
          {notification.is_parent && childrenCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 flex-shrink-0 mt-1"
              onClick={(e) => {
                e.stopPropagation();
                loadChildren();
              }}
              disabled={loadingChildren}
            >
              {loadingChildren ? (
                <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
              ) : expanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </Button>
          )}
          
          <div className="flex-shrink-0 mt-1">
            <FileText className="w-5 h-5 text-blue-500" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className={`font-semibold text-sm ${!notification.is_read ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
                  {notification.title}
                </h4>
                {notification.children_count && notification.children_count > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {notification.children_count} action{notification.children_count > 1 ? 's' : ''}
                  </Badge>
                )}
                {isUrgent && (
                  <Badge variant="destructive" className="text-xs px-1.5 py-0">
                    <Zap className="w-3 h-3 mr-1" />
                    Urgent
                  </Badge>
                )}
                {getPriorityIcon(notification.priority)}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-red-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(notification.id);
                }}
              >
                <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-600" />
              </Button>
            </div>
            
            <p className={`text-sm mt-1 ${!notification.is_read ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>
              {notification.message}
            </p>
            
            <div className="flex items-center gap-3 mt-2 text-xs flex-wrap">
              <span className="text-gray-500">{formatTimeElapsed(notification.created_at)}</span>
              
              {!notification.is_read && (
                <Badge className="bg-blue-500 text-white text-xs font-semibold">
                  Non lu
                </Badge>
              )}
            </div>

            {notification.action_url && (
              <div className="mt-3 pt-2 border-t flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNotificationClick(notification)}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Voir prospect
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NOTIFICATIONS ENFANTS (expanded) */}
      {expanded && children.length > 0 && (
        <div className="mt-2 space-y-2 border-l-2 border-blue-200 ml-4 pl-2">
          {children.map((child) => {
            return (
              <div
                key={child.id}
                className={getNotificationTileClasses(child, true)}
                onClick={() => onNotificationClick(child)}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    <FileText className="w-4 h-4 text-gray-500" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-xs text-gray-700">
                        {child.title}
                      </h5>
                      {child.action_data?.days_waiting && (
                        <Badge variant="outline" className="text-xs">
                          {child.action_data.days_waiting}j
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-600 mt-1">
                      {child.message}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">
                        {formatTimeElapsed(child.created_at)}
                      </span>
                      {!child.is_read && (
                        <Badge className="bg-blue-500 text-white text-xs">
                          Non lu
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

