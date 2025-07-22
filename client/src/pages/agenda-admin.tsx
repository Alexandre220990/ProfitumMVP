import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Users, 
  Clock, 
  CalendarDays,
  Settings,
  Edit3,
  Eye,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Star,
  CheckCircle,
  AlertCircle,
  UserCheck,
  BarChart3,
  Target,
  Zap,
  Shield,
  Activity
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

interface AdminEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  is_online: boolean;
  meeting_url?: string;
  color: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  type: 'meeting' | 'audit' | 'presentation' | 'training' | 'review';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  client: {
    id: string;
    name: string;
    email: string;
    company: string;
    type: 'client' | 'expert' | 'admin';
  };
  expert?: {
    id: string;
    name: string;
    email: string;
    specialty: string;
  };
  revenue?: number;
  duration: number;
  participants_count: number;
  platform_commission?: number;
}

interface AdminStats {
  total_events: number;
  active_events: number;
  completed_events: number;
  total_revenue: number;
  platform_revenue: number;
  total_clients: number;
  total_experts: number;
  average_rating: number;
  completion_rate: number;
  growth_rate: number;
}

// ============================================================================
// COMPOSANTS INTERNES
// ============================================================================

const AdminDashboard = ({ stats }: { stats: AdminStats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Événements actifs */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Événements actifs</p>
              <p className="text-2xl font-bold text-blue-900">{stats.active_events}</p>
            </div>
            <div className="p-3 bg-blue-500 rounded-full">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <Progress value={stats.completion_rate} className="h-2" />
            <p className="text-xs text-blue-600 mt-1">
              {stats.completion_rate}% de taux de complétion
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Revenus totaux */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Revenus totaux</p>
              <p className="text-2xl font-bold text-green-900">
                {stats.total_revenue.toLocaleString('fr-FR')} €
              </p>
            </div>
            <div className="p-3 bg-green-500 rounded-full">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span className="text-sm">+{stats.growth_rate}% ce mois</span>
          </div>
        </CardContent>
      </Card>

      {/* Commission plateforme */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Commission plateforme</p>
              <p className="text-2xl font-bold text-purple-900">
                {stats.platform_revenue.toLocaleString('fr-FR')} €
              </p>
            </div>
            <div className="p-3 bg-purple-500 rounded-full">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-purple-600">
              {Math.round((stats.platform_revenue / stats.total_revenue) * 100)}% du total
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Utilisateurs */}
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Utilisateurs actifs</p>
              <p className="text-2xl font-bold text-orange-900">
                {stats.total_clients + stats.total_experts}
              </p>
            </div>
            <div className="p-3 bg-orange-500 rounded-full">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-orange-600">
              {stats.total_clients} clients • {stats.total_experts} experts
            </p>
          </div>
        </CardContent>
      </Card>
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
  const { toast } = useToast();

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
    toast({
      title: "Aujourd'hui",
      description: "Vous êtes maintenant sur la date d'aujourd'hui"
    });
  };

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Stats rapides */}
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span className="font-medium">{stats.active_events} événements actifs</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span className="font-medium">{stats.completed_events} complétés ce mois</span>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span className="font-medium">{stats.platform_revenue.toLocaleString('fr-FR')} € commission</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5" />
            <span className="font-medium">{stats.total_clients + stats.total_experts} utilisateurs</span>
          </div>
        </div>
      </div>

      {/* Navigation principale */}
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
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              Aujourd'hui
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nouvel événement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer un nouvel événement</DialogTitle>
              </DialogHeader>
              <CreateAdminEventForm currentDate={currentDate} />
            </DialogContent>
          </Dialog>

          <div className="flex items-center space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Synchroniser</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Analytics</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                    <Settings className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Paramètres</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateAdminEventForm = ({ currentDate }: { currentDate: Date }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: currentDate.toISOString().slice(0, 16),
    end_date: new Date(currentDate.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16),
    location: '',
    is_online: false,
    type: 'meeting' as const,
    priority: 'medium' as const,
    client_id: '',
    expert_id: '',
    revenue: '',
    platform_commission: '15'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Créer événement admin:', formData);
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
            placeholder="Titre de l'événement"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type d'événement
          </label>
          <Select 
            value={formData.type} 
            onValueChange={(value) => setFormData({ ...formData, type: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="meeting">Réunion</SelectItem>
              <SelectItem value="audit">Audit</SelectItem>
              <SelectItem value="presentation">Présentation</SelectItem>
              <SelectItem value="training">Formation</SelectItem>
              <SelectItem value="review">Revue</SelectItem>
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
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder="Description de l'événement..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client
          </label>
          <Select 
            value={formData.client_id} 
            onValueChange={(value) => setFormData({ ...formData, client_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">ABC Entreprise</SelectItem>
              <SelectItem value="2">Startup XYZ</SelectItem>
              <SelectItem value="3">Corporation DEF</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expert
          </label>
          <Select 
            value={formData.expert_id} 
            onValueChange={(value) => setFormData({ ...formData, expert_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un expert" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Jean Dupont - TICPE</SelectItem>
              <SelectItem value="2">Marie Martin - URSSAF</SelectItem>
              <SelectItem value="3">Pierre Lambert - CIR</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Revenus (€)
          </label>
          <Input
            type="number"
            value={formData.revenue}
            onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
            placeholder="500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Commission plateforme (%)
          </label>
          <Input
            type="number"
            value={formData.platform_commission}
            onChange={(e) => setFormData({ ...formData, platform_commission: e.target.value })}
            placeholder="15"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_online"
          checked={formData.is_online}
          onChange={(e) => setFormData({ ...formData, is_online: e.target.checked })}
          className="rounded border-gray-300"
        />
        <label htmlFor="is_online" className="text-sm font-medium text-gray-700">
          Événement en ligne
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline">
          Annuler
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          Créer l'événement
        </Button>
      </div>
    </form>
  );
};

const AdminEventCard = ({ event }: { event: AdminEvent }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusIcon = () => {
    switch (event.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityColor = () => {
    switch (event.priority) {
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-200 cursor-pointer ${
        isHovered ? 'shadow-lg transform scale-105' : 'shadow-sm'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ borderLeft: `4px solid ${event.color}` }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-gray-900 truncate">
                {event.title}
              </h3>
              {getStatusIcon()}
            </div>
            
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Clock className="w-3 h-3" />
                <span>
                  {formatTime(event.start_date)} - {formatTime(event.end_date)}
                </span>
              </div>
              
              {event.client && (
                <div className="flex items-center space-x-2">
                  <Users className="w-3 h-3" />
                  <span className="truncate">{event.client.name} - {event.client.company}</span>
                </div>
              )}
              
              {event.expert && (
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-3 h-3" />
                  <span className="truncate">{event.expert.name} - {event.expert.specialty}</span>
                </div>
              )}
              
              {event.revenue && (
                <div className="flex items-center space-x-2 text-green-600">
                  <DollarSign className="w-3 h-3" />
                  <span className="font-medium">{event.revenue} €</span>
                  {event.platform_commission && (
                    <span className="text-xs text-gray-500">
                      (+{event.platform_commission} € commission)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Badge className={getPriorityColor()}>
              {event.priority}
            </Badge>
            
            {isHovered && (
              <div className="flex items-center space-x-1 ml-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Eye className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Voir détails</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Edit3 className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Modifier</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function AgendaAdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Stats de démonstration
  const adminStats: AdminStats = useMemo(() => ({
    total_events: 156,
    active_events: 23,
    completed_events: 133,
    total_revenue: 45000,
    platform_revenue: 6750,
    total_clients: 45,
    total_experts: 28,
    average_rating: 4.7,
    completion_rate: 85,
    growth_rate: 23
  }), []);

  // Événements de démonstration
  const demoEvents: AdminEvent[] = useMemo(() => [
    {
      id: '1',
      title: 'Audit TICPE - Entreprise ABC',
      description: 'Audit complet pour récupération TICPE',
      start_date: new Date(currentDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(currentDate.getTime() + 4 * 60 * 60 * 1000).toISOString(),
      location: 'Bureau client',
      is_online: false,
      color: '#3B82F6',
      status: 'confirmed',
      type: 'audit',
      priority: 'high',
      duration: 120,
      revenue: 800,
      platform_commission: 120,
      participants_count: 3,
      client: {
        id: '1',
        name: 'Jean Dupont',
        email: 'jean@abc-entreprise.com',
        company: 'ABC Entreprise',
        type: 'client'
      },
      expert: {
        id: '1',
        name: 'Marie Martin',
        email: 'marie@expert.com',
        specialty: 'TICPE'
      }
    }
  ], [currentDate]);

  useEffect(() => {
    setTimeout(() => {
      setEvents(demoEvents);
      setIsLoading(false);
    }, 1000);
  }, [demoEvents]);

  const filteredEvents = useMemo(() => {
    return events;
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Événements récents</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredEvents.slice(0, 5).map((event) => (
                        <AdminEventCard key={event.id} event={event} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques rapides</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Taux de complétion</span>
                      <span className="font-semibold">{adminStats.completion_rate}%</span>
                    </div>
                    <Progress value={adminStats.completion_rate} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Croissance mensuelle</span>
                      <span className="font-semibold text-green-600">+{adminStats.growth_rate}%</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Note moyenne</span>
                      <div className="flex items-center">
                        <span className="font-semibold mr-2">{adminStats.average_rating}</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= adminStats.average_rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tous les événements</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredEvents.map((event) => (
                      <AdminEventCard key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
                <CardTitle>Analytics détaillées</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Tableaux de bord analytics avancés à venir...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 