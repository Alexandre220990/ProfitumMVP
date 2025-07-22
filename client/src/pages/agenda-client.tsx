import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { useCalendarEvents } from '@/hooks/use-calendar-events';
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
  RefreshCw,
  Bell,
  AlertTriangle
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
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
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
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Rechercher un événement..."
            className="pl-10 w-64"
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <Select onValueChange={onFilterChange} defaultValue="all">
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filtrer par type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
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

const EventCard = ({ event }: { event: any }) => {
  const getEventIcon = () => {
    switch (event.type) {
      case 'meeting':
        return <Users className="w-4 h-4" />;
      case 'appointment':
        return <Clock className="w-4 h-4" />;
      case 'reminder':
        return <Bell className="w-4 h-4" />;
      case 'deadline':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getPriorityColor = () => {
    switch (event.priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
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
              <Badge className={getPriorityColor()}>
                {event.priority}
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

const CreateEventForm = ({ currentDate, onSuccess }: { currentDate: Date; onSuccess: () => void }) => {
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
    type: 'meeting' as const,
    priority: 'medium' as const
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
        category: 'client'
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
          type: 'meeting',
          priority: 'medium'
        });

        // Fermer le dialog et rafraîchir
        onSuccess();
      }
    } catch (error) {
      console.error('❌ Erreur création événement:', error);
    } finally {
      setIsSubmitting(false);
    }
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
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
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
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
          {isSubmitting ? 'Création...' : 'Créer l\'événement'}
        </Button>
      </div>
    </form>
  );
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function AgendaClientPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>({ type: 'week', label: 'Semaine', icon: Calendar });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Utiliser le hook de calendrier
  const { events, loading, error, refresh } = useCalendarEvents({
    autoLoad: true,
    filters: {
      start_date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString(),
      end_date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString()
    }
  });

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

  const handleCreateSuccess = () => {
    setShowCreateDialog(false);
    refresh();
  };

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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Mon Agenda
          </h2>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
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
              <CreateEventForm 
                currentDate={currentDate} 
                onSuccess={handleCreateSuccess}
              />
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
                    <Button 
                      onClick={() => setShowCreateDialog(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
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