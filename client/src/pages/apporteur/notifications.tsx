import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Bell, Check, X, Filter, Settings, AlertCircle, CheckCircle, Download, Archive, Clock, Activity } from 'lucide-react';
import { ApporteurRealDataService } from '../../services/apporteur-real-data-service';

/**
 * Page Notifications
 * Centre de notifications et alertes
 */
export default function NotificationsPage() {
  const router = useRouter();
  const { apporteurId } = router.query;
  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);


  useEffect(() => {
    const loadNotifications = async () => {
      if (!apporteurId || typeof apporteurId !== 'string') return;
      
      try {
        const service = new ApporteurRealDataService(apporteurId);
        const result = await service.getNotifications();
        const data = result.success ? result.data : null;
        setNotifications(data || []);
      } catch (err) {
        console.error('Erreur lors du chargement des notifications:', err);
        setNotifications([]);
      }
    };

    loadNotifications();
  }, [apporteurId]);

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

  const unreadCount = notifications.filter(n => !n.read).length;
  const highPriorityCount = notifications.filter(n => n.priority === 'high' && !n.read).length;

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
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
                  <Input
                    placeholder="Rechercher une notification..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="all">Tous les types</option>
                    <option value="success">Succès</option>
                    <option value="info">Information</option>
                    <option value="warning">Avertissement</option>
                    <option value="error">Erreur</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
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
              <div className="text-3xl font-bold text-blue-900">{notifications.length}</div>
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
              <div className="text-3xl font-bold text-green-900">
                {Math.round(((notifications.length - unreadCount) / notifications.length) * 100)}%
              </div>
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
                <Button variant="outline" size="sm" className="hover:bg-green-50">
                  <Check className="h-4 w-4 mr-1" />
                  Marquer tout comme lu
                </Button>
                <Button variant="outline" size="sm" className="hover:bg-red-50">
                  <Archive className="h-4 w-4 mr-1" />
                  Archiver tout
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
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
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div key={notification.id} className={`flex items-center justify-between p-6 border rounded-xl hover:shadow-lg transition-all duration-200 ${
                    !notification.read ? 'bg-blue-50 border-blue-200 shadow-md' : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-center space-x-4">
                      <div className={`h-4 w-4 rounded-full ${!notification.read ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-bold text-gray-900 text-lg">{notification.title}</h3>
                          <Badge className={`${getTypeColor(notification.type)} px-3 py-1 rounded-full text-xs font-semibold`}>
                            {notification.type}
                          </Badge>
                          <Badge className={`${getPriorityColor(notification.priority)} px-3 py-1 rounded-full text-xs font-semibold`}>
                            {notification.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>{notification.timestamp}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {!notification.read && (
                        <Button variant="outline" size="sm" className="hover:bg-green-50">
                          <Check className="h-4 w-4 mr-1" />
                          Marquer lu
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="hover:bg-red-50">
                        <X className="h-4 w-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
