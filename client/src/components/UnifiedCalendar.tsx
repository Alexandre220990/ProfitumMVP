import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Users, FileText, AlertTriangle, Edit, Trash2, Bell, MapPin, Video, List, CalendarDays, RefreshCw } from 'lucide-react';
import { format, isSameDay, startOfWeek, endOfWeek, addDays, subDays, startOfMonth, endOfMonth, addMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

import { useCalendarEvents } from '@/hooks/use-calendar-events';
import { CalendarEvent } from '@/services/calendar-service';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

interface CalendarView {
  type: 'month' | 'week' | 'day' | 'agenda' | 'list';
  date: Date;
}

interface UnifiedCalendarProps {
  className?: string;
  theme?: 'blue' | 'green' | 'purple';
  showHeader?: boolean;
  enableGoogleSync?: boolean;
  enableRealTime?: boolean;
  defaultView?: 'month' | 'week' | 'day' | 'agenda' | 'list';
  filters?: {
    type?: string;
    category?: string;
    dossier_id?: string;
  };
}

// ============================================================================
// CONSTANTES ET CONFIGURATION
// ============================================================================

const EVENT_TYPES = {
  appointment: { icon: CalendarIcon, color: 'bg-blue-500', label: 'Rendez-vous' },
  deadline: { icon: AlertTriangle, color: 'bg-red-500', label: 'Échéance' },
  meeting: { icon: Users, color: 'bg-purple-500', label: 'Réunion' },
  task: { icon: FileText, color: 'bg-green-500', label: 'Tâche' },
  reminder: { icon: Bell, color: 'bg-yellow-500', label: 'Rappel' },
  consultation: { icon: CalendarIcon, color: 'bg-blue-500', label: 'Consultation' },
  audit: { icon: AlertTriangle, color: 'bg-red-500', label: 'Audit' },
  presentation: { icon: Users, color: 'bg-purple-500', label: 'Présentation' },
  follow_up: { icon: FileText, color: 'bg-green-500', label: 'Suivi' }
} as const;

const PRIORITY_COLORS = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
  urgent: 'bg-red-100 text-red-800'
} as const;

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
} as const;

// ============================================================================
// COMPOSANT CALENDRIER UNIFIÉ
// ============================================================================

export const UnifiedCalendar: React.FC<UnifiedCalendarProps> = ({
  className = '',
  showHeader = true,
  enableGoogleSync = false,
  enableRealTime = true,
  defaultView = 'month',
  filters = {}
}) => {
  
  // Configuration du fuseau horaire français
  const TIMEZONE = 'Europe/Paris';
  
  // Fonction pour obtenir l'heure actuelle en France
  const getCurrentTimeInFrance = () => {
    return toZonedTime(new Date(), TIMEZONE);
  };
  
  // État local
  const [view, setView] = useState<CalendarView>({ type: defaultView, date: getCurrentTimeInFrance() });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState('all');

  // Hook calendrier unifié
  const {
    loading,
    isConnected,
    filteredEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    getUpcomingEvents,
    syncWithGoogleCalendar
  } = useCalendarEvents({
    autoLoad: true,
    enableRealTime,
    enableGoogleSync,
    view: view.type,
    filters: {
      ...filters,
      start_date: getViewStartDate(view).toISOString(),
      end_date: getViewEndDate(view).toISOString()
    }
  });

  // ========================================
  // FONCTIONS UTILITAIRES
  // ========================================

  function getViewStartDate(currentView: CalendarView): Date {
    switch (currentView.type) {
      case 'day':
        return new Date(currentView.date.setHours(0, 0, 0, 0));
      case 'week':
        return startOfWeek(currentView.date, { locale: fr });
      case 'month':
        return startOfMonth(currentView.date);
      case 'agenda':
      case 'list':
        return subDays(currentView.date, 30);
      default:
        return currentView.date;
    }
  }

  function getViewEndDate(currentView: CalendarView): Date {
    switch (currentView.type) {
      case 'day':
        return new Date(currentView.date.setHours(23, 59, 59, 999));
      case 'week':
        return endOfWeek(currentView.date, { locale: fr });
      case 'month':
        return endOfMonth(currentView.date);
      case 'agenda':
      case 'list':
        return addDays(currentView.date, 30);
      default:
        return currentView.date;
    }
  }

  // ========================================
  // GESTION DES ÉVÉNEMENTS
  // ========================================

  const handleDateSelect = useCallback((date: Date | undefined) => {
    if (date) {
      // Convertir la date sélectionnée au fuseau horaire français
      const dateInFrance = toZonedTime(date, TIMEZONE);
      setSelectedDate(dateInFrance);
      setShowEventDialog(true);
    }
  }, []);

  const handleEventSubmit = useCallback(async (eventData: any) => {
    try {
      if (selectedEvent) {
        await updateEvent({ ...eventData, id: selectedEvent.id });
      } else {
        // Convertir les dates au fuseau horaire français
        const startDate = selectedDate ? fromZonedTime(selectedDate, TIMEZONE) : getCurrentTimeInFrance();
        const endDate = eventData.end_date ? fromZonedTime(new Date(eventData.end_date), TIMEZONE) : addMinutes(startDate, 30);
        
        await createEvent({
          ...eventData,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        });
      }
      setShowEventDialog(false);
      setSelectedEvent(null);
      setSelectedDate(null);
    } catch (error) {
      console.error('Erreur création/mise à jour événement:', error);
    }
  }, [selectedEvent, selectedDate, createEvent, updateEvent]);

  const handleEditEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDialog(true);
  }, []);

  const handleDeleteEvent = useCallback(async (eventId: string) => {
    try {
      await deleteEvent(eventId);
    } catch (error) {
      console.error('Erreur suppression événement:', error);
    }
  }, [deleteEvent]);

  // ========================================
  // COMPOSANT EVENT CARD
  // ========================================

  const EventCard: React.FC<{ event: CalendarEvent; compact?: boolean }> = ({ event, compact = false }) => {
    const formatTime = (date: Date) => format(date, 'HH:mm', { locale: fr });
    const formatDate = (date: Date) => format(date, 'dd/MM/yyyy', { locale: fr });

    const getEventIcon = () => {
      const eventType = EVENT_TYPES[event.type as keyof typeof EVENT_TYPES] || EVENT_TYPES.appointment;
      const Icon = eventType.icon;
      return <Icon className="h-4 w-4" />;
    };

    const getPriorityColor = () => {
      return PRIORITY_COLORS[event.priority] || PRIORITY_COLORS.medium;
    };

    const getStatusColor = () => {
      return STATUS_COLORS[event.status] || STATUS_COLORS.pending;
    };

    if (compact) {
      return (
        <div 
          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
          onClick={() => handleEditEvent(event)}
        >
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-full", EVENT_TYPES[event.type as keyof typeof EVENT_TYPES]?.color || 'bg-blue-500')}>
              {getEventIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 truncate">{event.title}</h4>
              <p className="text-sm text-gray-500">
                {formatTime(new Date(event.start_date))} - {formatTime(new Date(event.end_date))}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getPriorityColor()}>
              {event.priority}
            </Badge>
            <Badge className={getStatusColor()}>
              {event.status}
            </Badge>
          </div>
        </div>
      );
    }

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className={cn("p-2 rounded-full mt-1", EVENT_TYPES[event.type as keyof typeof EVENT_TYPES]?.color || 'bg-blue-500')}>
                {getEventIcon()}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                  <Badge className={getPriorityColor()}>
                    {event.priority}
                  </Badge>
                  <Badge className={getStatusColor()}>
                    {event.status}
                  </Badge>
                </div>
                
                {event.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {event.description}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(new Date(event.start_date))} à {formatTime(new Date(event.start_date))}</span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  
                  {event.is_online && (
                    <div className="flex items-center gap-1">
                      <Video className="h-4 w-4" />
                      <span>En ligne</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditEvent(event)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteEvent(event.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ========================================
  // RENDU DES VUES
  // ========================================

  const renderMonthView = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {format(view.date, 'MMMM yyyy', { locale: fr })}
        </h2>
      </div>
      
      {/* Grille simple pour le mois */}
      <div className="grid grid-cols-7 gap-1">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
        
        {Array.from({ length: 35 }, (_, i) => {
          const date = addDays(startOfMonth(view.date), i);
          const dayEvents = getEventsForDate(date);
          
          return (
            <div
              key={i}
              className={cn(
                "p-2 min-h-[80px] border border-gray-200 cursor-pointer hover:bg-gray-50",
                isSameDay(date, new Date()) && "bg-blue-50 border-blue-300"
              )}
              onClick={() => handleDateSelect(date)}
            >
              <div className="text-sm font-medium">{format(date, 'd')}</div>
              {dayEvents.length > 0 && (
                <div className="mt-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto"></div>
                  <div className="text-xs text-gray-500 mt-1">{dayEvents.length} événement(s)</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Événements de la date sélectionnée */}
      {selectedDate && (
        <div className="mt-8 p-6 bg-gray-50 rounded-xl">
          <h3 className="font-semibold text-gray-900 mb-4 text-lg">
            Événements du {format(selectedDate, 'dd/MM/yyyy', { locale: fr })}
          </h3>
          <div className="space-y-4">
            {getEventsForDate(selectedDate).length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Aucun événement prévu pour cette date
              </p>
            ) : (
              getEventsForDate(selectedDate).map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  compact
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderAgendaView = () => {
    const upcomingEvents = getUpcomingEvents(30);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Agenda</h2>
          <Button onClick={() => setShowEventDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel événement
          </Button>
        </div>

        <div className="space-y-4">
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun événement à venir</h3>
              <p className="mt-1 text-sm text-gray-500">
                Créez votre premier événement pour commencer.
              </p>
            </div>
          ) : (
            upcomingEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
              />
            ))
          )}
        </div>
      </div>
    );
  };

  const renderListView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Liste des événements</h2>
        <Button onClick={() => setShowEventDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel événement
        </Button>
      </div>

      {/* Filtres et recherche */}
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Rechercher un événement..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Select value={currentFilter} onValueChange={setCurrentFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="appointment">Rendez-vous</SelectItem>
            <SelectItem value="meeting">Réunion</SelectItem>
            <SelectItem value="task">Tâche</SelectItem>
            <SelectItem value="deadline">Échéance</SelectItem>
            <SelectItem value="reminder">Rappel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun événement trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">
              Essayez de modifier vos filtres ou créez un nouvel événement.
            </p>
          </div>
        ) : (
          filteredEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
            />
          ))
        )}
      </div>
    </div>
  );

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Calendrier</h1>
            {isConnected && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Connecté
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView(prev => ({ ...prev, date: new Date() }))}
            >
              Aujourd'hui
            </Button>
            
            <div className="flex border rounded-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView(prev => ({ 
                  ...prev, 
                  date: subDays(prev.date, 1) 
                }))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView(prev => ({ 
                  ...prev, 
                  date: addDays(prev.date, 1) 
                }))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sélecteur de vue */}
      <div className="flex items-center gap-2 mb-6">
        <Tabs value={view.type} onValueChange={(value) => setView(prev => ({ ...prev, type: value as any }))}>
          <TabsList>
            <TabsTrigger value="month" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Mois
            </TabsTrigger>
            <TabsTrigger value="agenda" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Agenda
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Liste
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {enableGoogleSync && (
          <Button
            variant="outline"
            size="sm"
            onClick={syncWithGoogleCalendar}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Sync Google
          </Button>
        )}
      </div>

      {/* Contenu de la vue */}
      <div className="bg-white rounded-lg border">
        <div className="p-6">
          {view.type === 'month' && renderMonthView()}
          {view.type === 'agenda' && renderAgendaView()}
          {view.type === 'list' && renderListView()}
        </div>
      </div>

      {/* Dialog de création/édition d'événement */}
      <EventDialog
        open={showEventDialog}
        onOpenChange={setShowEventDialog}
        event={selectedEvent}
        onSubmit={handleEventSubmit}
        onCancel={() => {
          setShowEventDialog(false);
          setSelectedEvent(null);
          setSelectedDate(null);
        }}
      />
    </div>
  );
};

// ============================================================================
// DIALOG D'ÉVÉNEMENT
// ============================================================================

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent | null;
  onSubmit: (event: any) => void;
  onCancel: () => void;
}

const EventDialog: React.FC<EventDialogProps> = ({ open, onOpenChange, event, onSubmit, onCancel }) => {
  // Configuration du fuseau horaire français
  const TIMEZONE = 'Europe/Paris';
  
  // Fonction pour obtenir l'heure actuelle en France
  const getCurrentTimeInFrance = () => {
    return toZonedTime(new Date(), TIMEZONE);
  };
  
  // Fonction pour formater l'heure en format datetime-local
  const formatDateTimeLocal = (date: Date) => {
    return format(date, "yyyy-MM-dd'T'HH:mm");
  };
  
  // Fonction pour obtenir l'heure de fin par défaut (30 minutes après)
  const getDefaultEndTime = (startDate: Date) => {
    return addMinutes(startDate, 30);
  };
  
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    start_date: event?.start_date 
      ? formatDateTimeLocal(toZonedTime(new Date(event.start_date), TIMEZONE))
      : formatDateTimeLocal(getCurrentTimeInFrance()),
    end_date: event?.end_date 
      ? formatDateTimeLocal(toZonedTime(new Date(event.end_date), TIMEZONE))
      : formatDateTimeLocal(getDefaultEndTime(getCurrentTimeInFrance())),
    type: event?.type || 'appointment',
    priority: event?.priority || 'medium',
    status: event?.status || 'pending',
    location: event?.location || '',
    is_online: event?.is_online || false,
    meeting_url: event?.meeting_url || '',
    color: event?.color || '#3B82F6'
  });

  // Effet pour mettre à jour automatiquement l'heure de fin quand l'heure de début change
  React.useEffect(() => {
    if (formData.start_date && !event) { // Seulement pour les nouveaux événements
      const startDate = new Date(formData.start_date);
      const endDate = getDefaultEndTime(startDate);
      setFormData(prev => ({
        ...prev,
        end_date: formatDateTimeLocal(endDate)
      }));
    }
  }, [formData.start_date, event]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convertir les dates au fuseau horaire français
    const startDate = fromZonedTime(new Date(formData.start_date), TIMEZONE);
    const endDate = formData.end_date 
      ? fromZonedTime(new Date(formData.end_date), TIMEZONE)
      : getDefaultEndTime(startDate);
    
    const eventData = {
      ...formData,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    };
    
    onSubmit(eventData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {event ? 'Modifier l\'événement' : 'Créer un événement'}
          </DialogTitle>
          <DialogDescription>
            {event ? 'Modifiez les détails de votre événement.' : 'Créez un nouvel événement dans votre calendrier.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="type">Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appointment">Rendez-vous</SelectItem>
                  <SelectItem value="meeting">Réunion</SelectItem>
                  <SelectItem value="task">Tâche</SelectItem>
                  <SelectItem value="deadline">Échéance</SelectItem>
                  <SelectItem value="reminder">Rappel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Date et heure de début *</Label>
              <Input
                id="start_date"
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="end_date">Date et heure de fin *</Label>
              <Input
                id="end_date"
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priorité</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status">Statut</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="confirmed">Confirmé</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="location">Lieu</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_online"
              checked={formData.is_online}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_online: checked }))}
            />
            <Label htmlFor="is_online">Événement en ligne</Label>
          </div>

          {formData.is_online && (
            <div>
              <Label htmlFor="meeting_url">URL de réunion</Label>
              <Input
                id="meeting_url"
                value={formData.meeting_url}
                onChange={(e) => setFormData(prev => ({ ...prev, meeting_url: e.target.value }))}
                placeholder="https://meet.google.com/..."
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit">
              {event ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 