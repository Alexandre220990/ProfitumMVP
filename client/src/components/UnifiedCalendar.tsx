import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Users, FileText, AlertTriangle, Edit, Trash2, Bell, MapPin, Video, List, CalendarDays, RefreshCw } from 'lucide-react';
import { format, isSameDay, startOfWeek, endOfWeek, addDays, subDays, startOfMonth, endOfMonth, addMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';


import { useCalendarEvents } from '@/hooks/use-calendar-events';
import { CalendarEvent } from '@/services/calendar-service';
import { useAuth } from '@/hooks/use-auth';
import { config } from '@/config';
import { toast } from 'sonner';

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
  
  // État local
  const [view, setView] = useState<CalendarView>({ type: defaultView, date: new Date() });
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



  const handleEventSubmit = useCallback(async (eventData: any) => {
    try {
      console.log('🔍 handleEventSubmit appelé avec:', eventData);
      
      if (selectedEvent) {
        console.log('📝 Mise à jour événement existant');
        await updateEvent({ ...eventData, id: selectedEvent.id });
      } else {
        console.log('📝 Création nouvel événement');
        // Utiliser les dates du formulaire directement
        console.log('🔍 Appel createEvent avec:', eventData);
        await createEvent(eventData);
      }
      setShowEventDialog(false);
      setSelectedEvent(null);
      setSelectedDate(null);
    } catch (error) {
      console.error('❌ Erreur création/mise à jour événement:', error);
    }
  }, [selectedEvent, createEvent, updateEvent]);

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

  const renderMonthView = () => {
    // Calculer le premier lundi de la semaine contenant le 1er du mois
    const firstDayOfMonth = startOfMonth(view.date);
    const firstMondayOfMonth = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
    
    // Calculer le nombre de jours à afficher (6 semaines = 42 jours)
    const daysToShow = 42;
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendrier principal */}
        <div className="lg:col-span-2 space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {format(view.date, 'MMMM yyyy', { locale: fr })}
            </h2>
          </div>
          
          {/* Grille du mois avec lundi en premier */}
          <div className="grid grid-cols-7 gap-1">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
            
            {Array.from({ length: daysToShow }, (_, i) => {
              const date = addDays(firstMondayOfMonth, i);
              const dayEvents = getEventsForDate(date);
              const isCurrentMonth = date.getMonth() === view.date.getMonth();
              const isToday = isSameDay(date, new Date());
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              
              return (
                <div
                  key={i}
                  className={cn(
                    "p-2 min-h-[80px] border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors",
                    !isCurrentMonth && "bg-gray-50 text-gray-400",
                    isToday && "bg-blue-50 border-blue-300 font-bold",
                    isSelected && "bg-blue-100 border-blue-400"
                  )}
                  onClick={() => setSelectedDate(date)}
                >
                  <div className={cn(
                    "text-sm font-medium",
                    isToday && "text-blue-600",
                    isSelected && "text-blue-700"
                  )}>
                    {format(date, 'd')}
                  </div>
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
        </div>
        
        {/* Panneau latéral des événements */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            {selectedDate ? (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 text-lg mb-3">
                    {format(selectedDate, 'EEEE dd MMMM yyyy', { locale: fr })}
                  </h3>
                  <Button
                    size="sm"
                    onClick={() => setShowEventDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Nouvel événement
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {getEventsForDate(selectedDate).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CalendarIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm">Aucun événement prévu</p>
                      <p className="text-xs text-gray-400 mt-1">Cliquez sur "Nouvel événement" pour commencer</p>
                    </div>
                  ) : (
                    getEventsForDate(selectedDate).map(event => (
                      <div
                        key={event.id}
                        className="p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleEditEvent(event)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", EVENT_TYPES[event.type as keyof typeof EVENT_TYPES]?.color || 'bg-blue-500')}></div>
                            <span className="font-medium text-gray-900 text-sm">
                              {event.title}
                            </span>
                          </div>
                          <Badge className="text-xs">
                            {EVENT_TYPES[event.type as keyof typeof EVENT_TYPES]?.label || event.type}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(event.start_date), 'HH:mm', { locale: fr })} - {format(new Date(event.end_date), 'HH:mm', { locale: fr })}
                        </div>
                        {event.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Sélectionnez une date</h3>
                <p className="text-sm text-gray-500">
                  Cliquez sur un jour dans le calendrier pour voir les événements
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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
  const { user } = useAuth();
  const [prospects, setProspects] = React.useState<any[]>([]);
  const [experts, setExperts] = React.useState<any[]>([]);
  const [loadingLists, setLoadingLists] = React.useState(false);
  
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
      ? formatDateTimeLocal(new Date(event.start_date))
      : formatDateTimeLocal(new Date()),
    end_date: event?.end_date 
      ? formatDateTimeLocal(new Date(event.end_date))
      : formatDateTimeLocal(getDefaultEndTime(new Date())),
    type: event?.type || 'appointment',
    priority: event?.priority || 'medium',
    category: event?.category || 'client',
    location: event?.location || '',
    is_online: event?.is_online || false,
    meeting_url: event?.meeting_url || '',
    color: event?.color || '#3B82F6',
    client_id: event?.client_id || '',
    expert_id: event?.expert_id || ''
  });

  // Charger les listes de prospects et experts au montage
  React.useEffect(() => {
    if (open && user?.type === 'apporteur') {
      loadProspectsAndExperts();
    }
  }, [open, user]);

  const loadProspectsAndExperts = async () => {
    setLoadingLists(true);
    try {
      // Charger les prospects
      const prospectsResponse = await fetch(`${config.API_URL}/api/apporteur/prospects`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (prospectsResponse.ok) {
        const prospectsData = await prospectsResponse.json();
        setProspects(prospectsData.data || []);
      }

      // Charger les experts
      const expertsResponse = await fetch(`${config.API_URL}/api/experts`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (expertsResponse.ok) {
        const expertsData = await expertsResponse.json();
        setExperts(expertsData.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement listes:', error);
    } finally {
      setLoadingLists(false);
    }
  };

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
    
    console.log('🔍 EventDialog handleSubmit appelé');
    console.log('🔍 Données du formulaire avant traitement:', formData);
    
    // Validation pour apporteur : client_id obligatoire
    if (user?.type === 'apporteur' && !formData.client_id) {
      toast.error('⚠️ Vous devez sélectionner un client/prospect pour ce rendez-vous');
      return;
    }
    
    // Utiliser les dates directement
    const startDate = new Date(formData.start_date);
    const endDate = formData.end_date 
      ? new Date(formData.end_date)
      : getDefaultEndTime(startDate);
    
    const eventData = {
      ...formData,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      // Nettoyer les champs vides
      location: formData.location || null,
      meeting_url: formData.meeting_url || null,
      client_id: formData.client_id || undefined,
      expert_id: formData.expert_id || undefined
    };
    
    console.log('🔍 Données d\'événement envoyées:', eventData);
    console.log('🔍 Appel onSubmit avec:', eventData);
    
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

          {/* Sélecteurs Client et Expert (pour apporteurs) */}
          {user?.type === 'apporteur' && (
            <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div>
                <Label htmlFor="client_id" className="text-blue-900">Client/Prospect * <span className="text-xs text-blue-600">(Obligatoire)</span></Label>
                <Select 
                  value={formData.client_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
                  disabled={loadingLists}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder={loadingLists ? "Chargement..." : "Sélectionner un client/prospect"} />
                  </SelectTrigger>
                  <SelectContent>
                    {prospects.map((prospect) => (
                      <SelectItem key={prospect.id} value={prospect.id}>
                        {prospect.first_name} {prospect.last_name} {prospect.company_name ? `(${prospect.company_name})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!formData.client_id && (
                  <p className="text-xs text-red-600 mt-1">⚠️ Vous devez sélectionner un client/prospect</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="expert_id" className="text-blue-900">Expert <span className="text-xs text-blue-600">(Optionnel)</span></Label>
                <div className="flex gap-2">
                  <Select 
                    value={formData.expert_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, expert_id: value }))}
                    disabled={loadingLists}
                  >
                    <SelectTrigger className="bg-white flex-1">
                      <SelectValue placeholder={loadingLists ? "Chargement..." : "Sélectionner un expert (optionnel)"} />
                    </SelectTrigger>
                    <SelectContent>
                      {experts.map((expert) => (
                        <SelectItem key={expert.id} value={expert.id}>
                          {expert.first_name} {expert.last_name} {expert.company_name ? `(${expert.company_name})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.expert_id && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, expert_id: '' }))}
                      className="shrink-0"
                    >
                      Retirer
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

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
              <Label htmlFor="category">Catégorie</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                  <SelectItem value="admin">Administration</SelectItem>
                  <SelectItem value="system">Système</SelectItem>
                  <SelectItem value="collaborative">Collaboratif</SelectItem>
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