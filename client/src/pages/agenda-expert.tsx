import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
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
  AlertCircle,
  UserCheck,
  MessageSquare,
  FileText,
  BarChart3,
  Target,
  Zap
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

interface ExpertEvent {
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
  type: 'consultation' | 'audit' | 'meeting' | 'presentation' | 'follow_up';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  client: {
    id: string;
    name: string;
    email: string;
    company: string;
    avatar?: string;
  };
  revenue?: number;
  duration: number; // en minutes
  preparation_time?: number; // en minutes
  materials?: string[];
  notes?: string;
  follow_up_required?: boolean;
  next_action?: string;
}

interface ExpertStats {
  total_events: number;
  completed_events: number;
  pending_events: number;
  total_revenue: number;
  average_rating: number;
  total_clients: number;
  completion_rate: number;
  average_duration: number;
}

// ============================================================================
// COMPOSANTS INTERNES
// ============================================================================

const ExpertDashboard = ({ stats }: { stats: ExpertStats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Événements totaux */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Événements totaux</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total_events}</p>
            </div>
            <div className="p-3 bg-blue-500 rounded-full">
              <Calendar className="w-6 h-6 text-white" />
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
          <div className="mt-4">
            <p className="text-sm text-green-600">
              Moyenne: {Math.round(stats.total_revenue / stats.total_events)} €/événement
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Note moyenne */}
      <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Note moyenne</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.average_rating}</p>
            </div>
            <div className="p-3 bg-yellow-500 rounded-full">
              <Star className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= stats.average_rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Clients actifs */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Clients actifs</p>
              <p className="text-2xl font-bold text-purple-900">{stats.total_clients}</p>
            </div>
            <div className="p-3 bg-purple-500 rounded-full">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-purple-600">
              {stats.pending_events} événements en attente
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ExpertCalendarHeader = ({ 
  currentDate, 
  onDateChange, 
  view, 
  stats 
}: {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  view: any;
  stats: ExpertStats;
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

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    switch (view.type) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }
    onDateChange(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    switch (view.type) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }
    onDateChange(newDate);
  };

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Stats rapides */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span className="font-medium">{stats.pending_events} événements en attente</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span className="font-medium">{stats.completed_events} complétés ce mois</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5" />
            <span className="font-medium">{stats.total_clients} clients actifs</span>
          </div>
        </div>
      </div>

      {/* Navigation principale */}
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevious}
              className="hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <h1 className="text-2xl font-semibold text-gray-900">
              {formatDate(currentDate)}
            </h1>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNext}
              className="hover:bg-gray-100"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
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
              <CreateExpertEventForm currentDate={currentDate} />
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

const CreateExpertEventForm = ({ currentDate }: { currentDate: Date }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: currentDate.toISOString().slice(0, 16),
    end_date: new Date(currentDate.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16),
    location: '',
    is_online: false,
    type: 'consultation' as const,
    priority: 'medium' as const,
    client_email: '',
    revenue: '',
    preparation_time: '30',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Créer consultation:', formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titre de la consultation *
          </label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ex: Audit TICPE - Entreprise ABC"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de consultation
          </label>
          <Select 
            value={formData.type} 
            onValueChange={(value) => setFormData({ ...formData, type: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="consultation">Consultation</SelectItem>
              <SelectItem value="audit">Audit</SelectItem>
              <SelectItem value="meeting">Réunion</SelectItem>
              <SelectItem value="presentation">Présentation</SelectItem>
              <SelectItem value="follow_up">Suivi</SelectItem>
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
          placeholder="Détails de la consultation..."
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
            Email du client
          </label>
          <Input
            type="email"
            value={formData.client_email}
            onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
            placeholder="client@entreprise.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Revenus estimés (€)
          </label>
          <Input
            type="number"
            value={formData.revenue}
            onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
            placeholder="500"
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
            placeholder="Bureau ou adresse"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Temps de préparation (min)
          </label>
          <Select 
            value={formData.preparation_time} 
            onValueChange={(value) => setFormData({ ...formData, preparation_time: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
              <SelectItem value="60">1 heure</SelectItem>
              <SelectItem value="90">1h30</SelectItem>
            </SelectContent>
          </Select>
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
          Consultation en ligne
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes privées
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          placeholder="Notes internes..."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline">
          Annuler
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          Planifier la consultation
        </Button>
      </div>
    </form>
  );
};

const ExpertEventCard = ({ event }: { event: ExpertEvent }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getEventIcon = () => {
    switch (event.type) {
      case 'consultation':
        return <Users className="w-4 h-4" />;
      case 'audit':
        return <FileText className="w-4 h-4" />;
      case 'meeting':
        return event.is_online ? <Video className="w-4 h-4" /> : <Users className="w-4 h-4" />;
      case 'presentation':
        return <BarChart3 className="w-4 h-4" />;
      case 'follow_up':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h${mins > 0 ? mins : ''}` : `${mins}min`;
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
              {getEventIcon()}
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
                <span className="text-gray-400">({formatDuration(event.duration)})</span>
              </div>
              
              {event.client && (
                <div className="flex items-center space-x-2">
                  <Users className="w-3 h-3" />
                  <span className="truncate">{event.client.name} - {event.client.company}</span>
                </div>
              )}
              
              {event.location && (
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
              
              {event.revenue && (
                <div className="flex items-center space-x-2 text-green-600">
                  <DollarSign className="w-3 h-3" />
                  <span className="font-medium">{event.revenue} €</span>
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

export default function AgendaExpertPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view] = useState({ type: 'week', label: 'Semaine', icon: Calendar });
  const [events, setEvents] = useState<ExpertEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Stats de démonstration
  const expertStats: ExpertStats = useMemo(() => ({
    total_events: 24,
    completed_events: 18,
    pending_events: 6,
    total_revenue: 12500,
    average_rating: 4.8,
    total_clients: 12,
    completion_rate: 75,
    average_duration: 90
  }), []);

  // Événements de démonstration
  const demoEvents: ExpertEvent[] = useMemo(() => [
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
      preparation_time: 45,
      client: {
        id: '1',
        name: 'Jean Dupont',
        email: 'jean@abc-entreprise.com',
        company: 'ABC Entreprise'
      }
    },
    {
      id: '2',
      title: 'Consultation URSSAF - Startup XYZ',
      description: 'Vérification des cotisations et optimisation',
      start_date: new Date(currentDate.getTime() + 6 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(currentDate.getTime() + 7 * 60 * 60 * 1000).toISOString(),
      location: 'En ligne',
      is_online: true,
      meeting_url: 'https://meet.google.com/abc-defg-hij',
      color: '#10B981',
      status: 'pending',
      type: 'consultation',
      priority: 'medium',
      duration: 60,
      revenue: 500,
      preparation_time: 30,
      client: {
        id: '2',
        name: 'Marie Martin',
        email: 'marie@startup-xyz.com',
        company: 'Startup XYZ'
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
      {/* Dashboard Expert */}
      <ExpertDashboard stats={expertStats} />
      
      {/* Header */}
      <ExpertCalendarHeader
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        view={view}
        stats={expertStats}
      />
      
      {/* Contenu principal */}
      <div className="p-6">
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar">Calendrier</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Vue du calendrier */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Consultations à venir
                    </h2>
                    
                    {filteredEvents.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Aucune consultation trouvée
                        </h3>
                        <p className="text-gray-500 mb-4">
                          Planifiez votre première consultation
                        </p>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Nouvelle consultation
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {filteredEvents.map((event) => (
                          <ExpertEventCard key={event.id} event={event} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="clients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des clients</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Interface de gestion des clients à venir...</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics et performances</CardTitle>
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