import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { useCalendarEvents } from '@/hooks/use-calendar-events';
import { 
  Calendar, 
  Plus, 
  Clock, 
  MapPin, 
  Users, 
  Video, 
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Settings,
  Edit3,
  Eye,
  RefreshCw,
  DollarSign,
  Star,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  MessageSquare,
  FileText,
  BarChart3,
  Target,
  Zap,
  Shield,
  Activity,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

interface AdminStats {
  total_events: number;
  total_users: number;
  total_experts: number;
  total_clients: number;
  active_events: number;
  pending_events: number;
  system_health: number;
  platform_revenue: number;
}

// ============================================================================
// COMPOSANTS INTERNES
// ============================================================================

const AdminDashboard = ({ stats }: { stats: AdminStats }) => {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold">{stats.total_events}</div>
            <div className="text-purple-100">Total événements</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{stats.total_users}</div>
            <div className="text-purple-100">Utilisateurs</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{stats.platform_revenue}€</div>
            <div className="text-purple-100">Revenus plateforme</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{stats.system_health}%</div>
            <div className="text-purple-100">Santé système</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminCalendarHeader = ({ 
  currentDate, 
  onDateChange, 
  stats
}: {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  stats: AdminStats;
}) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    onDateChange(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    onDateChange(newDate);
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-semibold text-gray-900">
              {formatDate(currentDate)}
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              Aujourd'hui
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevious}
              className="hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNext}
              className="hover:bg-gray-100"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nouvel événement système
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer un événement système</DialogTitle>
              </DialogHeader>
              <CreateAdminEventForm currentDate={currentDate} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

const AdminEventCard = ({ event }: { event: any }) => {
  const getEventIcon = () => {
    switch (event.type) {
      case 'system_maintenance':
        return <Settings className="w-4 h-4" />;
      case 'platform_update':
        return <Zap className="w-4 h-4" />;
      case 'security_alert':
        return <Shield className="w-4 h-4" />;
      case 'performance_monitoring':
        return <Activity className="w-4 h-4" />;
      case 'user_management':
        return <Users className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getStatusColor = () => {
    switch (event.status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = () => {
    switch (event.category) {
      case 'system':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'collaborative':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {getEventIcon()}
              <h3 className="font-semibold text-gray-900">{event.title}</h3>
              <Badge className={getStatusColor()}>
                {event.status}
              </Badge>
              <Badge className={getCategoryColor()}>
                {event.category}
              </Badge>
            </div>
            
            {event.description && (
              <p className="text-gray-600 text-sm mb-3">{event.description}</p>
            )}
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{formatTime(event.start_date)} - {formatTime(event.end_date)}</span>
              </div>
              
              {event.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
              )}
              
              {event.is_online && (
                <div className="flex items-center space-x-1">
                  <Video className="w-4 h-4" />
                  <span>En ligne</span>
                </div>
              )}
            </div>

            {event.metadata?.affected_users && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {event.metadata.affected_users} utilisateurs affectés
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Edit3 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const CreateAdminEventForm = ({ currentDate }: { currentDate: Date }) => {
  const { user } = useAuth();
  const { createEvent } = useCalendarEvents();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: currentDate.toISOString().slice(0, 16),
    end_date: new Date(currentDate.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16),
    location: '',
    is_online: false,
    meeting_url: '',
    type: 'system_maintenance' as const,
    priority: 'medium' as const,
    category: 'system' as const,
    affected_users: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) return;

    setIsSubmitting(true);

    try {
      const newEvent = await createEvent({
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        metadata: {
          affected_users: formData.affected_users ? parseInt(formData.affected_users) : undefined,
          meeting_url: formData.meeting_url
        }
      });

      if (newEvent) {
        // Réinitialiser le formulaire
        setFormData({
          title: '',
          description: '',
          start_date: currentDate.toISOString().slice(0, 16),
          end_date: new Date(currentDate.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16),
          location: '',
          is_online: false,
          meeting_url: '',
          type: 'system_maintenance',
          priority: 'medium',
          category: 'system',
          affected_users: ''
        });
      }
    } catch (error) {
      console.error('❌ Erreur création événement système:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titre de l'événement *
          </label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ex: Maintenance système - Mise à jour sécurité"
            required
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type d'événement
          </label>
          <Select 
            value={formData.type} 
            onValueChange={(value) => setFormData({ ...formData, type: value as any })}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system_maintenance">Maintenance système</SelectItem>
              <SelectItem value="platform_update">Mise à jour plateforme</SelectItem>
              <SelectItem value="security_alert">Alerte sécurité</SelectItem>
              <SelectItem value="performance_monitoring">Monitoring performance</SelectItem>
              <SelectItem value="user_management">Gestion utilisateurs</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          rows={3}
          placeholder="Détails de l'événement système..."
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Début *
          </label>
          <Input
            type="datetime-local"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fin *
          </label>
          <Input
            type="datetime-local"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lieu
          </label>
          <Input
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Lieu de l'événement"
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Utilisateurs affectés
          </label>
          <Input
            type="number"
            value={formData.affected_users}
            onChange={(e) => setFormData({ ...formData, affected_users: e.target.value })}
            placeholder="Nombre d'utilisateurs"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_online"
            checked={formData.is_online}
            onChange={(e) => setFormData({ ...formData, is_online: e.target.checked })}
            className="rounded border-gray-300"
            disabled={isSubmitting}
          />
          <label htmlFor="is_online" className="text-sm font-medium text-gray-700">
            Événement en ligne
          </label>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priorité
          </label>
          <Select 
            value={formData.priority} 
            onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Faible</SelectItem>
              <SelectItem value="medium">Moyenne</SelectItem>
              <SelectItem value="high">Élevée</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.is_online && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL de réunion
          </label>
          <Input
            value={formData.meeting_url}
            onChange={(e) => setFormData({ ...formData, meeting_url: e.target.value })}
            placeholder="https://meet.google.com/..."
            disabled={isSubmitting}
          />
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" disabled={isSubmitting}>
          Annuler
        </Button>
        <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>
          {isSubmitting ? 'Création...' : 'Créer l\'événement système'}
        </Button>
      </div>
    </form>
  );
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function AgendaAdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [currentDate, setCurrentDate] = useState(new Date());

  // Utiliser le hook de calendrier
  const { events, loading, error, refresh } = useCalendarEvents({
    autoLoad: true,
    filters: {
      start_date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString(),
      end_date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString()
    }
  });

  // Stats de démonstration
  const adminStats: AdminStats = useMemo(() => ({
    total_events: events.length,
    total_users: 1250,
    total_experts: 45,
    total_clients: 1205,
    active_events: events.filter(e => e.status === 'confirmed' || e.status === 'pending').length,
    pending_events: events.filter(e => e.status === 'pending').length,
    system_health: 98,
    platform_revenue: 45000
  }), [events]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => event.category === 'system' || event.category === 'admin');
  }, [events]);

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Admin */}
      <AdminDashboard stats={adminStats} />
      
      {/* Header */}
      <AdminCalendarHeader
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        stats={adminStats}
      />
      
      {/* Contenu principal */}
      <div className="p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="events">Événements</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Activité système
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Santé système</span>
                        <span>{adminStats.system_health}%</span>
                      </div>
                      <Progress value={adminStats.system_health} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Événements actifs</span>
                        <span>{adminStats.active_events}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Utilisateurs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total</span>
                      <span className="font-semibold">{adminStats.total_users}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Experts</span>
                      <span>{adminStats.total_experts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Clients</span>
                      <span>{adminStats.total_clients}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Revenus plateforme</span>
                      <span className="font-semibold">{adminStats.platform_revenue}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Événements en attente</span>
                      <span>{adminStats.pending_events}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="events" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Erreur de chargement
                </h3>
                <p className="text-gray-500 mb-4">{error}</p>
                <Button onClick={refresh} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Réessayer
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Vue du calendrier */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Événements système
                    </h2>
                    
                    {filteredEvents.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Aucun événement système trouvé
                        </h3>
                        <p className="text-gray-500 mb-4">
                          Créez votre premier événement système
                        </p>
                        <Button className="bg-purple-600 hover:bg-purple-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Nouvel événement système
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {filteredEvents.map((event) => (
                          <AdminEventCard key={event.id} event={event} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des utilisateurs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Interface de gestion des utilisateurs à venir...</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics et monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Tableaux de bord analytics à venir...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 