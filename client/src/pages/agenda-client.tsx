import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Plus, 
  Search, 
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
  Calendar as CalendarIcon,
  Grid,
  List,
  Sun,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  is_online: boolean;
  meeting_url?: string;
  color: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  type: 'meeting' | 'appointment' | 'reminder' | 'deadline';
  priority: 'low' | 'medium' | 'high';
  participants?: Array<{
    id: string;
    name: string;
    email: string;
    type: 'client' | 'expert' | 'admin';
    status: 'pending' | 'accepted' | 'declined';
  }>;
  metadata?: {
    google_event_id?: string;
    organizer?: {
      id: string;
      name: string;
      email: string;
    };
    agenda_items?: Array<{
      id: string;
      title: string;
      duration: number;
    }>;
  };
}

interface CalendarView {
  type: 'day' | 'week' | 'month' | 'agenda';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// ============================================================================
// COMPOSANTS INTERNES
// ============================================================================

const CalendarHeader = ({ 
  currentDate, 
  onDateChange, 
  view
}: {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  view: CalendarView;
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
    <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200">
      {/* Navigation et titre */}
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
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNext}
            className="hover:bg-gray-100"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
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

      {/* Actions principales */}
      <div className="flex items-center space-x-3">
        {/* Bouton Nouvel événement */}
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
            <CreateEventForm currentDate={currentDate} />
          </DialogContent>
        </Dialog>

        {/* Boutons d'action */}
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
                  <Settings className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Paramètres</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

const CalendarToolbar = ({ 
  view, 
  onViewChange, 
  onSearchChange,
  onFilterChange 
}: {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onSearchChange: (search: string) => void;
  onFilterChange: (filter: string) => void;
}) => {
  const views: CalendarView[] = [
    { type: 'day', label: 'Jour', icon: Sun },
    { type: 'week', label: 'Semaine', icon: Calendar },
    { type: 'month', label: 'Mois', icon: Grid },
    { type: 'agenda', label: 'Agenda', icon: List }
  ];

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
      {/* Vues du calendrier */}
      <div className="flex items-center space-x-1">
        {views.map((viewOption) => {
          const Icon = viewOption.icon;
          return (
            <Button
              key={viewOption.type}
              variant={view.type === viewOption.type ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewChange(viewOption)}
              className={view.type === viewOption.type 
                ? "bg-blue-600 text-white" 
                : "hover:bg-gray-200"
              }
            >
              <Icon className="w-4 h-4 mr-2" />
              {viewOption.label}
            </Button>
          );
        })}
      </div>

      {/* Recherche et filtres */}
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Rechercher des événements..."
            className="pl-10 w-64"
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <Select onValueChange={onFilterChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les événements</SelectItem>
            <SelectItem value="meeting">Réunions</SelectItem>
            <SelectItem value="appointment">Rendez-vous</SelectItem>
            <SelectItem value="reminder">Rappels</SelectItem>
            <SelectItem value="deadline">Échéances</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

const CreateEventForm = ({ currentDate }: { currentDate: Date }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: currentDate.toISOString().slice(0, 16),
    end_date: new Date(currentDate.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16),
    location: '',
    is_online: false,
    type: 'meeting' as const,
    priority: 'medium' as const
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implémenter la création d'événement
    console.log('Créer événement:', formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titre *
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
            Type
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
              <SelectItem value="appointment">Rendez-vous</SelectItem>
              <SelectItem value="reminder">Rappel</SelectItem>
              <SelectItem value="deadline">Échéance</SelectItem>
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
            Lieu
          </label>
          <Input
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Lieu de l'événement"
          />
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

const EventCard = ({ event }: { event: CalendarEvent }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getEventIcon = () => {
    switch (event.type) {
      case 'meeting':
        return event.is_online ? <Video className="w-4 h-4" /> : <Users className="w-4 h-4" />;
      case 'appointment':
        return <Calendar className="w-4 h-4" />;
      case 'reminder':
        return <Clock className="w-4 h-4" />;
      case 'deadline':
        return <CalendarIcon className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getPriorityColor = () => {
    switch (event.priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
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
              {getEventIcon()}
              <h3 className="font-semibold text-gray-900 truncate">
                {event.title}
              </h3>
            </div>
            
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Clock className="w-3 h-3" />
                <span>
                  {formatTime(event.start_date)} - {formatTime(event.end_date)}
                </span>
              </div>
              
              {event.location && (
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
              
              {event.participants && event.participants.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Users className="w-3 h-3" />
                  <span>{event.participants.length} participant(s)</span>
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

export default function AgendaClientPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>({ type: 'week', label: 'Semaine', icon: Calendar });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Événements de démonstration
  const demoEvents: CalendarEvent[] = useMemo(() => [
    {
      id: '1',
      title: 'Réunion avec Expert TICPE',
      description: 'Discussion sur la récupération TICPE',
      start_date: new Date(currentDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(currentDate.getTime() + 3 * 60 * 60 * 1000).toISOString(),
      location: 'Bureau principal',
      is_online: false,
      color: '#3B82F6',
      status: 'confirmed',
      type: 'meeting',
      priority: 'high',
      participants: [
        { id: '1', name: 'Jean Dupont', email: 'jean@expert.com', type: 'expert', status: 'accepted' }
      ]
    },
    {
      id: '2',
      title: 'Appel de suivi URSSAF',
      description: 'Vérification des cotisations',
      start_date: new Date(currentDate.getTime() + 5 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(currentDate.getTime() + 5.5 * 60 * 60 * 1000).toISOString(),
      location: 'En ligne',
      is_online: true,
      meeting_url: 'https://meet.google.com/abc-defg-hij',
      color: '#10B981',
      status: 'pending',
      type: 'appointment',
      priority: 'medium',
      participants: [
        { id: '2', name: 'Marie Martin', email: 'marie@urssaf.fr', type: 'admin', status: 'pending' }
      ]
    }
  ], [currentDate]);

  useEffect(() => {
    // Simuler le chargement des événements
    setTimeout(() => {
      setEvents(demoEvents);
      setIsLoading(false);
    }, 1000);
  }, [demoEvents]);

  const filteredEvents = useMemo(() => {
    let filtered = events;
    
    if (searchQuery) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(event => event.type === filterType);
    }
    
    return filtered;
  }, [events, searchQuery, filterType]);

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <CalendarHeader
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        view={view}
      />
      
      {/* Toolbar */}
      <CalendarToolbar
        view={view}
        onViewChange={setView}
        onSearchChange={setSearchQuery}
        onFilterChange={setFilterType}
      />
      
      {/* Contenu principal */}
      <div className="p-6">
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
                  Événements à venir
                </h2>
                
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucun événement trouvé
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {searchQuery || filterType !== 'all' 
                        ? 'Essayez de modifier vos critères de recherche'
                        : 'Créez votre premier événement pour commencer'
                      }
                    </p>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Créer un événement
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 