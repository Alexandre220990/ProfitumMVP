import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseNotifications, SupabaseNotification } from '@/hooks/useSupabaseNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Archive,
  ArrowLeft,
  Bell,
  Check,
  Inbox,
  Loader2,
  RefreshCw,
  Search,
  Undo2
} from 'lucide-react';

type NotificationView = 'unread' | 'read' | 'archived';

const viewConfig: Record<NotificationView, { label: string; description: string; icon: React.ElementType }> = {
  unread: {
    label: 'Non lues',
    description: 'Les notifications qui nécessitent votre attention.',
    icon: Inbox,
  },
  read: {
    label: 'Lues',
    description: 'Vos notifications déjà consultées.',
    icon: Check,
  },
  archived: {
    label: 'Archivées',
    description: 'Historique et éléments mis de côté.',
    icon: Archive,
  },
};

const formatDate = (date: string) => {
  try {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return date;
  }
};

const NotificationCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadNotifications,
    readNotifications,
    archivedNotifications,
    unreadCount,
    loading,
    reload,
    markAsRead,
    archiveNotification,
    unarchiveNotification,
  } = useSupabaseNotifications();

  const [activeView, setActiveView] = useState<NotificationView>('unread');
  const [searchQuery, setSearchQuery] = useState('');

  const statsCards = [
    {
      key: 'unread',
      title: 'Non lues',
      count: unreadNotifications.length,
      description: 'En attente de lecture',
      accent: 'bg-blue-50 text-blue-600',
    },
    {
      key: 'read',
      title: 'Lues',
      count: readNotifications.length,
      description: 'Déjà consultées',
      accent: 'bg-emerald-50 text-emerald-600',
    },
    {
      key: 'archived',
      title: 'Archivées',
      count: archivedNotifications.length,
      description: 'Classées ou clôturées',
      accent: 'bg-slate-100 text-slate-600',
    },
  ] as const;

  const currentNotifications = useMemo(() => {
    let source: SupabaseNotification[] = [];
    switch (activeView) {
      case 'unread':
        source = unreadNotifications;
        break;
      case 'read':
        source = readNotifications;
        break;
      case 'archived':
        source = archivedNotifications;
        break;
      default:
        source = notifications;
    }

    if (!searchQuery) {
      return source;
    }

    return source.filter((notification) => {
      const haystack = `${notification.title ?? ''} ${notification.message ?? ''}`.toLowerCase();
      return haystack.includes(searchQuery.toLowerCase());
    });
  }, [activeView, archivedNotifications, notifications, readNotifications, unreadNotifications, searchQuery]);

  const emptyState = useMemo(() => {
    switch (activeView) {
      case 'unread':
        return "Vous n'avez aucune notification non lue pour le moment.";
      case 'read':
        return "Aucune notification lue pour le moment.";
      case 'archived':
        return "Vous n'avez pas encore archivé de notification.";
      default:
        return "Aucune notification disponible.";
    }
  }, [activeView]);

  const handleNotificationClick = async (notification: SupabaseNotification) => {
    if (!notification) return;

    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const handleMarkAsRead = async (notification: SupabaseNotification) => {
    if (notification.is_read) return;
    await markAsRead(notification.id);
  };

  const handleArchiveToggle = async (notification: SupabaseNotification) => {
    if (notification.status === 'archived') {
      await unarchiveNotification(notification.id);
      return;
    }

    await archiveNotification(notification.id);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <Bell className="h-9 w-9 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900">Centre de notifications</h1>
                  <p className="text-sm text-slate-500">
                    {notifications.length} notification{notifications.length > 1 ? 's' : ''} au total
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => reload()}
              className="flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              Rafraîchir
            </Button>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
          {/* Sidebar */}
          <div className="space-y-4">
            <div className="grid gap-3">
              {statsCards.map((card) => (
                <Card
                  key={card.key}
                  className={cn(
                    'border border-slate-200 shadow-sm transition-all duration-200',
                    activeView === card.key && 'ring-2 ring-blue-200'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setActiveView(card.key as NotificationView)}
                    className="w-full text-left"
                  >
                    <CardHeader className="space-y-2">
                      <CardTitle className="flex items-center justify-between text-sm font-semibold text-slate-900">
                        {card.title}
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', card.accent)}>
                          {card.count}
                        </span>
                      </CardTitle>
                      <p className="text-xs text-slate-500">{card.description}</p>
                    </CardHeader>
                  </button>
                </Card>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="space-y-4">
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-white/60 backdrop-blur-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {React.createElement(viewConfig[activeView].icon, {
                        className: 'h-5 w-5 text-blue-600',
                      })}
                      <h2 className="text-lg font-semibold text-slate-900">
                        {viewConfig[activeView].label}
                      </h2>
                    </div>
                    <p className="text-sm text-slate-500">{viewConfig[activeView].description}</p>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Rechercher une notification"
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <ScrollArea className="max-h-[70vh]">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-10 text-sm text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      <p className="mt-2">Chargement des notifications...</p>
                    </div>
                  ) : currentNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center text-sm text-slate-500">
                      <Inbox className="h-10 w-10 text-slate-300 mb-3" />
                      <p>{emptyState}</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {currentNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            'group flex items-start gap-4 px-6 py-5 transition hover:bg-blue-50/60',
                            !notification.is_read && notification.status !== 'archived' && 'bg-blue-50/40'
                          )}
                        >
                          <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            <Bell className="h-4 w-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3
                                className={cn(
                                  'text-sm font-semibold text-slate-900',
                                  notification.is_read && 'font-medium'
                                )}
                              >
                                {notification.title || 'Notification'}
                              </h3>
                              {notification.priority && (
                                <Badge variant="secondary" className="text-xs capitalize bg-slate-100 text-slate-600">
                                  {notification.priority}
                                </Badge>
                              )}
                              {notification.status === 'archived' && (
                                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                                  Archivée
                                </Badge>
                              )}
                            </div>

                            <p className="mt-2 text-sm text-slate-600">
                              {notification.message}
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                              <span>{formatDate(notification.created_at)}</span>
                              {notification.notification_type && (
                                <span className="capitalize">
                                  {notification.notification_type.replace(/_/g, ' ')}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            {notification.status !== 'archived' && !notification.is_read && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-blue-600 hover:text-blue-700"
                                onClick={() => handleMarkAsRead(notification)}
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Marquer comme lue
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-slate-500 hover:text-slate-700"
                              onClick={() => handleArchiveToggle(notification)}
                            >
                              {notification.status === 'archived' ? (
                                <>
                                  <Undo2 className="mr-2 h-4 w-4" />
                                  Restaurer
                                </>
                              ) : (
                                <>
                                  <Archive className="mr-2 h-4 w-4" />
                                  Archiver
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                              onClick={() => handleNotificationClick(notification)}
                            >
                              Ouvrir
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenterPage;