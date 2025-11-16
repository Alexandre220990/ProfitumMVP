import { useSearchParams } from 'react-router-dom';
import { useState, useEffect, useCallback, useMemo, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Bell, Check, X, Filter, Settings, AlertCircle, CheckCircle, Download, Archive, Clock, Activity, Users } from 'lucide-react';
import apporteurApi from '@/services/apporteur-api';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 20;

/**
 * Page Notifications
 * Centre de notifications et alertes
 */
type NotificationItem = {
  id: string;
  titre: string;
  message: string;
  type_notification: string;
  priorite: string;
  lue: boolean;
  status?: string;
  created_at: string;
  updated_at?: string;
  type_couleur?: string;
  read?: boolean;
  is_read?: boolean;
};

export default function NotificationsPage() {
  const [searchParams] = useSearchParams();
  const apporteurId = searchParams.get('apporteurId');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [markingIds, setMarkingIds] = useState<Record<string, boolean>>({});
  const [archivingIds, setArchivingIds] = useState<Record<string, boolean>>({});
  const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [archivingAll, setArchivingAll] = useState(false);
  const [paginationInfo, setPaginationInfo] = useState({ page: 1, totalPages: 1, total: 0 });
  const [metrics, setMetrics] = useState({ unread: 0, highPriority: 0, total: 0 });

  const loadNotifications = useCallback(async () => {
    if (!apporteurId || typeof apporteurId !== 'string') {
      setNotifications([]);
      setPaginationInfo({ page: 1, totalPages: 1, total: 0 });
      setMetrics({ unread: 0, highPriority: 0, total: 0 });
      return;
    }

    setLoading(true);
    try {
      const result = await apporteurApi.getNotifications({
        page,
        limit: ITEMS_PER_PAGE,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        search: searchQuery || undefined,
      });

      if (result.success) {
        const response = result.data as {
          notifications?: NotificationItem[];
          pagination?: { page: number; total_pages: number; total: number };
          metrics?: { unread: number; highPriority: number; total: number };
        } | undefined;

        const payload = response?.notifications;
        const normalizedData = Array.isArray(payload) ? payload : [];
        setNotifications(normalizedData);

        const pagination = response?.pagination;
        if (pagination) {
          setPaginationInfo({
            page: pagination.page || page,
            totalPages: pagination.total_pages || 1,
            total: pagination.total || normalizedData.length,
          });
        } else {
          setPaginationInfo({
            page,
            totalPages: 1,
            total: normalizedData.length,
          });
        }

        if (response?.metrics) {
          setMetrics({
            unread: response.metrics.unread ?? 0,
            highPriority: response.metrics.highPriority ?? 0,
            total: response.metrics.total ?? 0,
          });
        } else {
          setMetrics({ unread: 0, highPriority: 0, total: normalizedData.length });
        }
      } else {
        setNotifications([]);
        setPaginationInfo({ page: 1, totalPages: 1, total: 0 });
        setMetrics({ unread: 0, highPriority: 0, total: 0 });
        if (result.error) {
          toast.error(result.error);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      toast.error('Impossible de charger les notifications.');
      setNotifications([]);
      setPaginationInfo({ page: 1, totalPages: 1, total: 0 });
      setMetrics({ unread: 0, highPriority: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [apporteurId, page, typeFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    setSearchTerm(searchQuery);
  }, [searchQuery]);

  const handleSearchSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearchQuery(searchTerm.trim());
  }, [searchTerm]);

  const handleResetFilters = useCallback(() => {
    setSearchTerm('');
    setSearchQuery('');
    setTypeFilter('all');
    setPriorityFilter('all');
    setPage(1);
  }, []);

  if (!apporteurId || typeof apporteurId !== 'string') {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ID Apporteur Requis</h2>
            <p className="text-gray-600">Veuillez vous connecter pour accéder aux notifications.</p>
          </div>
        </div>
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'organisation': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const normalizedNotifications = useMemo<NotificationItem[]>(
    () =>
      notifications.map((notification) => ({
        ...notification,
        read: notification.read ?? notification.lue ?? notification.is_read ?? false,
      })),
    [notifications]
  );

  const unreadCount = metrics.unread;
  const highPriorityCount = metrics.highPriority;
  const totalNotifications = metrics.total;
  const readRate =
    totalNotifications === 0 ? 100 : Math.round(((totalNotifications - unreadCount) / totalNotifications) * 100);

  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    if (!notificationId) return;
    setMarkingIds((prev) => ({ ...prev, [notificationId]: true }));
    try {
      const result = await apporteurApi.markNotificationAsRead(notificationId);
      if (result.success) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, read: true, lue: true, is_read: true } : notif
          )
        );
        await loadNotifications();
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Erreur marquage notification:', error);
      toast.error('Impossible de marquer la notification.');
    } finally {
      setMarkingIds((prev) => {
        const next = { ...prev };
        delete next[notificationId];
        return next;
      });
    }
  }, [loadNotifications]);

  const handleMarkAllAsRead = useCallback(async () => {
    setMarkingAllRead(true);
    try {
      const result = await apporteurApi.markAllNotificationsAsRead();
      if (result.success) {
        setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true, lue: true, is_read: true })));
        await loadNotifications();
        toast.success('Toutes les notifications ont été marquées comme lues.');
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Erreur mark all notifications:', error);
      toast.error('Impossible de marquer toutes les notifications.');
    } finally {
      setMarkingAllRead(false);
    }
  }, [loadNotifications]);

  const handleArchiveNotification = useCallback(async (notificationId: string) => {
    if (!notificationId) return;
    setArchivingIds((prev) => ({ ...prev, [notificationId]: true }));
    try {
      const result = await apporteurApi.archiveNotification(notificationId);
      if (result.success) {
        toast.success('Notification archivée.');
        await loadNotifications();
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Erreur archivage notification:', error);
      toast.error('Impossible d’archiver la notification.');
    } finally {
      setArchivingIds((prev) => {
        const next = { ...prev };
        delete next[notificationId];
        return next;
      });
    }
  }, [loadNotifications]);

  const handleArchiveAll = useCallback(async () => {
    setArchivingAll(true);
    try {
      const result = await apporteurApi.archiveAllNotifications();
      if (result.success) {
        toast.success('Notifications archivées.');
        await loadNotifications();
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Erreur archivage notifications:', error);
      toast.error('Impossible d’archiver les notifications.');
    } finally {
      setArchivingAll(false);
    }
  }, [loadNotifications]);

  const handleDeleteNotification = useCallback(async (notificationId: string) => {
    if (!notificationId) return;
    setDeletingIds((prev) => ({ ...prev, [notificationId]: true }));
    try {
      const result = await apporteurApi.deleteNotification(notificationId);
      if (result.success) {
        toast.success('Notification supprimée.');
        await loadNotifications();
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Erreur suppression notification:', error);
      toast.error('Impossible de supprimer la notification.');
    } finally {
      setDeletingIds((prev) => {
        const next = { ...prev };
        delete next[notificationId];
        return next;
      });
    }
  }, [loadNotifications]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      <div className="container mx-auto py-6">
        {/* Header Optimisé */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8">
          <div className="mb-6 lg:mb-0">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Mes Notifications</h1>
            <p className="text-gray-600 text-lg">Centre de notifications et alertes en temps réel</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="bg-white hover:bg-gray-50">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button variant="outline" className="bg-white hover:bg-gray-50" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </Button>
          </div>
        </div>

        {/* Filtres Avancés */}
        {showFilters && (
          <Card className="mb-6 bg-white shadow-lg border-0">
            <CardContent className="p-6 space-y-4">
              <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
                  <Input
                    placeholder="Rechercher par titre ou message..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Appliquer
                  </Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={handleResetFilters}>
                    Réinitialiser
                  </Button>
                </div>
              </form>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="all">Tous les types</option>
                    <option value="success">Succès</option>
                    <option value="info">Information</option>
                    <option value="warning">Avertissement</option>
                    <option value="error">Erreur</option>
                    <option value="organisation">Organisation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => {
                      setPriorityFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="all">Toutes les priorités</option>
                    <option value="high">Haute</option>
                    <option value="medium">Moyenne</option>
                    <option value="low">Basse</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistiques Optimisées */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Non Lues</CardTitle>
              <div className="p-2 bg-red-200 rounded-lg">
                <Bell className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-900">{unreadCount}</div>
              <p className="text-sm text-red-700">Notifications en attente</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Priorité Haute</CardTitle>
              <div className="p-2 bg-orange-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">{highPriorityCount}</div>
              <p className="text-sm text-orange-700">Urgentes</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total</CardTitle>
              <div className="p-2 bg-blue-200 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{totalNotifications}</div>
              <p className="text-sm text-blue-700">Toutes notifications</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Taux de Lecture</CardTitle>
              <div className="p-2 bg-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">{readRate}%</div>
              <p className="text-sm text-green-700">Notifications lues</p>
            </CardContent>
          </Card>
        </div>

        {/* Liste des Notifications Optimisée */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Bell className="h-6 w-6 text-orange-600" />
                </div>
                Notifications Récentes
              </CardTitle>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-green-50 disabled:opacity-60"
                  onClick={handleMarkAllAsRead}
                  disabled={markingAllRead || unreadCount === 0}
                >
                  <Check className="h-4 w-4 mr-1" />
                  {markingAllRead ? 'Marquage…' : 'Marquer tout comme lu'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-red-50 disabled:opacity-60"
                  onClick={handleArchiveAll}
                  disabled={archivingAll}
                >
                  <Archive className="h-4 w-4 mr-1" />
                  {archivingAll ? 'Archivage…' : 'Archiver tout'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-gray-600">
                Chargement des notifications...
              </div>
            ) : normalizedNotifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <Bell className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Aucune notification</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Vous êtes à jour ! Vos nouvelles notifications apparaîtront ici
                </p>
              </div>
            ) : (
              <>
              <div className="space-y-4">
                  {normalizedNotifications.map((notification) => (
                  <div key={notification.id} className={`flex items-center justify-between p-6 border rounded-xl hover:shadow-lg transition-all duration-200 ${
                    !notification.read ? 'bg-blue-50 border-blue-200 shadow-md' : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-center space-x-4">
                      <div className={`h-4 w-4 rounded-full ${!notification.read ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-bold text-gray-900 text-lg">{notification.titre}</h3>
                            <Badge className={`${getTypeColor(notification.type_notification)} px-3 py-1 rounded-full text-xs font-semibold`}>
                              {notification.type_notification === 'organisation' ? 'Organisation' : notification.type_notification}
                          </Badge>
                            <Badge className={`${getPriorityColor(notification.priorite)} px-3 py-1 rounded-full text-xs font-semibold`}>
                              {notification.priorite}
                          </Badge>
                          {notification.type_notification === 'organisation' && (
                            <Badge className="bg-purple-600/10 text-purple-700 border border-purple-200 px-2 py-0.5 text-[11px] flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Équipe
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-4 w-4" />
                            <span>{notification.created_at}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                      {!notification.read && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="hover:bg-green-50 disabled:opacity-60"
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={!!markingIds[notification.id]}
                          >
                          <Check className="h-4 w-4 mr-1" />
                            {markingIds[notification.id] ? 'Marquage…' : 'Marquer lu'}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-blue-50 disabled:opacity-60"
                          onClick={() => handleArchiveNotification(notification.id)}
                          disabled={!!archivingIds[notification.id]}
                        >
                          <Archive className="h-4 w-4 mr-1" />
                          {archivingIds[notification.id] ? 'Archivage…' : 'Archiver'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-red-50 disabled:opacity-60"
                          onClick={() => handleDeleteNotification(notification.id)}
                          disabled={!!deletingIds[notification.id]}
                        >
                        <X className="h-4 w-4 mr-1" />
                          {deletingIds[notification.id] ? 'Suppression…' : 'Supprimer'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-6">
                  <p className="text-sm text-gray-500">
                    Page {paginationInfo.page} / {paginationInfo.totalPages} — {paginationInfo.total} notification(s)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={paginationInfo.page <= 1 || loading}
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={paginationInfo.page >= paginationInfo.totalPages || loading}
                      onClick={() => setPage((prev) => Math.min(prev + 1, paginationInfo.totalPages))}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
