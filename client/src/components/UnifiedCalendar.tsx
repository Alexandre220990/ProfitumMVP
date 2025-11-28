import React, { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Users, FileText, AlertTriangle, Edit, Trash2, Bell, MapPin, Video, List, CalendarDays, RefreshCw } from 'lucide-react';
import { format, isSameDay, startOfWeek, endOfWeek, addDays, subDays, startOfMonth, endOfMonth, addMinutes, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

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
  showViewSelector?: boolean;
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
  showViewSelector = true,
  enableGoogleSync = false,
  enableRealTime = true,
  defaultView = 'month',
  filters = {}
}) => {
  
  // État local
  const [view, setView] = useState<CalendarView>({ type: defaultView, date: new Date() });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState('all');
  
  // Vérifier si des données préremplies sont disponibles (depuis timeline)
  useEffect(() => {
    const prefillData = localStorage.getItem('calendar_event_prefill');
    if (prefillData) {
      try {
        const data = JSON.parse(prefillData);
        // Créer un événement temporaire avec les données préremplies
        const prefillEvent: Partial<CalendarEvent> = {
          title: data.title || '',
          description: data.description || '',
          start_date: data.start_date ? new Date(data.start_date).toISOString() : '',
          end_date: data.end_date ? new Date(data.end_date).toISOString() : '',
          client_id: data.client_id,
          dossier_id: data.dossier_id,
          priority: data.priority || 'medium'
        };
        setSelectedEvent(prefillEvent as CalendarEvent);
        setShowEventDialog(true);
        // Nettoyer après utilisation
        localStorage.removeItem('calendar_event_prefill');
      } catch (err) {
        console.error('Erreur parsing prefill data:', err);
        localStorage.removeItem('calendar_event_prefill');
      }
    }
  }, []);

  // Gérer l'affichage automatique d'un événement depuis l'URL (notifications)
  useEffect(() => {
    const handleDisplayEvent = (eventData: { event: CalendarEvent; action?: 'view' | 'edit' }) => {
      const { event, action = 'view' } = eventData;
      
      // Fermer les popups précédents avant d'ouvrir le nouveau
      setShowEventDialog(false);
      setShowDetailsDialog(false);
      
      // Petit délai pour s'assurer que les popups sont bien fermés
      setTimeout(() => {
        // Naviguer vers la date de l'événement
        if (event.start_date) {
          const eventDate = new Date(event.start_date);
          setView({
            type: 'day', // Afficher la vue jour pour mieux voir l'événement
            date: eventDate
          });
        }

        // Sélectionner et afficher l'événement
        setSelectedEvent(event);
        
        if (action === 'edit') {
          setShowDetailsDialog(false);
          setShowEventDialog(true);
        } else {
          setShowEventDialog(false);
          setShowDetailsDialog(true);
        }
      }, 100);
    };

    // Fonction pour vérifier le localStorage
    const checkLocalStorage = () => {
      const eventToDisplay = localStorage.getItem('calendar_event_to_display');
      if (eventToDisplay) {
        try {
          const data = JSON.parse(eventToDisplay);
          handleDisplayEvent(data);
          // Nettoyer après utilisation
          localStorage.removeItem('calendar_event_to_display');
        } catch (err) {
          console.error('❌ Erreur parsing event to display:', err);
          localStorage.removeItem('calendar_event_to_display');
        }
      }
    };

    // Vérifier localStorage au montage
    checkLocalStorage();

    // Écouter l'événement personnalisé pour afficher un événement
    const handleCustomEvent = (e: CustomEvent) => {
      if (e.detail?.event) {
        handleDisplayEvent(e.detail);
      }
    };

    // Écouter l'événement pour fermer les popups
    const handleCloseDialogs = () => {
      setShowEventDialog(false);
      setShowDetailsDialog(false);
      setSelectedEvent(null);
    };

    // Écouter les changements dans le localStorage (pour les cas où l'événement est ajouté après le montage)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'calendar_event_to_display' && e.newValue) {
        checkLocalStorage();
      }
    };

    window.addEventListener('calendar:display-event', handleCustomEvent as EventListener);
    window.addEventListener('calendar:close-dialogs', handleCloseDialogs as EventListener);
    window.addEventListener('storage', handleStorageChange);

    // Vérifier périodiquement le localStorage (fallback)
    const intervalId = setInterval(() => {
      checkLocalStorage();
    }, 500);

    return () => {
      window.removeEventListener('calendar:display-event', handleCustomEvent as EventListener);
      window.removeEventListener('calendar:close-dialogs', handleCloseDialogs as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  // Hook calendrier unifié
  const {
    loading,
    isConnected,
    filteredEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
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

  // Fonctions de navigation adaptées à la vue
  const navigatePrevious = useCallback(() => {
    setView(prev => {
      let newDate: Date;
      switch (prev.type) {
        case 'month':
          newDate = subMonths(prev.date, 1);
          break;
        case 'week':
          newDate = subWeeks(prev.date, 1);
          break;
        case 'day':
          newDate = subDays(prev.date, 1);
          break;
        default:
          newDate = subDays(prev.date, 1);
      }
      return { ...prev, date: newDate };
    });
  }, []);

  const navigateNext = useCallback(() => {
    setView(prev => {
      let newDate: Date;
      switch (prev.type) {
        case 'month':
          newDate = addMonths(prev.date, 1);
          break;
        case 'week':
          newDate = addWeeks(prev.date, 1);
          break;
        case 'day':
          newDate = addDays(prev.date, 1);
          break;
        default:
          newDate = addDays(prev.date, 1);
      }
      return { ...prev, date: newDate };
    });
  }, []);

  const navigateToday = useCallback(() => {
    setView(prev => ({ ...prev, date: new Date() }));
  }, []);

  // Labels pour les boutons de navigation selon la vue
  const getNavigationLabels = () => {
    switch (view.type) {
      case 'month':
        return { prev: 'Mois précédent', next: 'Mois suivant' };
      case 'week':
        return { prev: 'Semaine précédente', next: 'Semaine suivante' };
      case 'day':
        return { prev: 'Jour précédent', next: 'Jour suivant' };
      default:
        return { prev: 'Précédent', next: 'Suivant' };
    }
  };

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
        console.log('🔍 Appel createEvent avec:', eventData);
        await createEvent(eventData);
      }
      setShowEventDialog(false);
      setSelectedEvent(null);
      setSelectedDate(null);
    } catch (error) {
      console.error('❌ Erreur création/mise à jour événement:', error);
      throw error;
    }
  }, [selectedEvent, createEvent, updateEvent]);

  const handleViewEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowDetailsDialog(true);
  }, []);

  const handleEditEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowDetailsDialog(false);
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
          onClick={() => handleViewEvent(event)}
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
      <Card 
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => handleViewEvent(event)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendrier principal */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={navigatePrevious}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              {getNavigationLabels().prev}
            </Button>
            
            <h2 className="text-2xl font-bold text-gray-900">
              {format(view.date, 'MMMM yyyy', { locale: fr })}
            </h2>
            
            <Button
              variant="outline"
              size="sm"
              onClick={navigateNext}
              className="flex items-center gap-2"
            >
              {getNavigationLabels().next}
              <ChevronRight className="h-4 w-4" />
            </Button>
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
                        onClick={() => handleViewEvent(event)}
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

  const renderWeekView = () => {
    const weekStart = startOfWeek(view.date, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(view.date, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    
    // Grille horaire de 7h à 20h
    const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7h à 20h
    const hourHeight = 60; // pixels par heure
    
    // Fonction pour obtenir la position et hauteur d'un événement
    const getEventStyle = (event: CalendarEvent) => {
      const startDate = new Date(event.start_date);
      const endDate = new Date(event.end_date);
      const startHour = startDate.getHours() + startDate.getMinutes() / 60;
      const endHour = endDate.getHours() + endDate.getMinutes() / 60;
      
      const top = (startHour - 7) * hourHeight;
      const height = (endHour - startHour) * hourHeight;
      
      return {
        top: `${Math.max(0, top)}px`,
        height: `${Math.max(30, height)}px`
      };
    };
    
    // Couleurs vives selon le type d'événement
    const getEventColor = (event: CalendarEvent) => {
      const colors: Record<string, string> = {
        'appointment': 'bg-blue-500 border-blue-600',
        'meeting': 'bg-green-500 border-green-600',
        'deadline': 'bg-red-500 border-red-600',
        'task': 'bg-purple-500 border-purple-600',
        'reminder': 'bg-orange-500 border-orange-600'
      };
      return colors[event.type] || 'bg-blue-500 border-blue-600';
    };
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={navigatePrevious}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            {getNavigationLabels().prev}
          </Button>
          
          <h2 className="text-xl font-semibold text-gray-900">
            Semaine du {format(weekStart, 'dd/MM', { locale: fr })} au {format(weekEnd, 'dd/MM/yyyy', { locale: fr })}
          </h2>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={navigateNext}
              className="flex items-center gap-2"
            >
              {getNavigationLabels().next}
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button onClick={() => setShowEventDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel événement
            </Button>
          </div>
        </div>
        
        <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-white">
          {/* Colonne des heures */}
          <div className="w-16 flex-shrink-0 border-r border-gray-300">
            <div className="h-12 border-b border-gray-300"></div>
            {hours.map((hour) => (
              <div 
                key={hour} 
                className="relative border-b border-gray-200"
                style={{ height: `${hourHeight}px` }}
              >
                <span className="absolute -top-2 right-2 text-xs text-gray-500 bg-white px-1">
                  {hour}:00
                </span>
              </div>
            ))}
          </div>
          
          {/* Colonnes des jours */}
          {weekDays.map((day) => {
            const dayEvents = getEventsForDate(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div 
                key={day.toISOString()} 
                className={cn(
                  "flex-1 border-r border-gray-300 last:border-r-0",
                  isToday && "bg-blue-50/30"
                )}
              >
                {/* En-tête du jour */}
                <div className={cn(
                  "h-12 border-b border-gray-300 flex flex-col items-center justify-center",
                  isToday && "bg-blue-100 border-blue-300"
                )}>
                  <div className="text-xs font-medium text-gray-600">
                    {format(day, 'EEE', { locale: fr })}
                  </div>
                  <div className={cn(
                    "text-lg font-bold",
                    isToday ? "text-blue-600" : "text-gray-900"
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>
                
                {/* Grille horaire avec événements */}
                <div className="relative">
                  {/* Lignes des heures */}
                  {hours.map((hour) => (
                    <div 
                      key={hour} 
                      className="border-b border-gray-200"
                      style={{ height: `${hourHeight}px` }}
                    />
                  ))}
                  
                  {/* Événements positionnés absolument */}
                  {dayEvents.map((event) => {
                    const style = getEventStyle(event);
                    const colorClass = getEventColor(event);
                    const startTime = format(new Date(event.start_date), 'HH:mm', { locale: fr });
                    const endTime = format(new Date(event.end_date), 'HH:mm', { locale: fr });
                    
                    return (
                      <div
                        key={event.id}
                        className={cn(
                          "absolute left-1 right-1 rounded-lg border-2 text-white p-2 cursor-pointer shadow-md hover:shadow-lg transition-shadow overflow-hidden",
                          colorClass
                        )}
                        style={style}
                        onClick={() => handleViewEvent(event)}
                      >
                        <div className="font-semibold text-xs truncate mb-0.5">
                          {event.title}
                        </div>
                        <div className="text-xs opacity-90">
                          {startTime} - {endTime}
                        </div>
                        {parseInt(style.height) > 40 && (
                          <div className="text-xs opacity-80 mt-0.5">
                            {event.location || ''}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(view.date);
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={navigatePrevious}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            {getNavigationLabels().prev}
          </Button>
          
          <h2 className="text-xl font-semibold text-gray-900">
            {format(view.date, 'EEEE dd MMMM yyyy', { locale: fr })}
          </h2>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={navigateNext}
              className="flex items-center gap-2"
            >
              {getNavigationLabels().next}
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button onClick={() => setShowEventDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel événement
            </Button>
          </div>
        </div>
        
        <div className="space-y-4">
          {dayEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun événement ce jour</h3>
              <p className="mt-1 text-sm text-gray-500">
                Créez votre premier événement pour commencer.
              </p>
            </div>
          ) : (
            dayEvents.map(event => (
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
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Liste des événements</h2>
        <Button onClick={() => setShowEventDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel événement
        </Button>
      </div>

      {/* Filtres et recherche */}
      <div className="flex gap-4 mb-4">
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
              onClick={navigateToday}
            >
              Aujourd'hui
            </Button>
            
            <div className="flex border rounded-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={navigatePrevious}
                title={getNavigationLabels().prev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateNext}
                title={getNavigationLabels().next}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sélecteur de vue */}
      {showViewSelector && (
        <div className="flex items-center gap-2 mb-3">
          <Tabs value={view.type} onValueChange={(value) => setView(prev => ({ ...prev, type: value as any }))}>
            <TabsList>
              <TabsTrigger value="month" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Mois
              </TabsTrigger>
              <TabsTrigger value="week" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Semaine
              </TabsTrigger>
              <TabsTrigger value="day" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Jour
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
      )}

      {/* Contenu de la vue */}
      <div className="bg-white rounded-lg border">
        <div className="p-4">
          {view.type === 'month' && renderMonthView()}
          {view.type === 'week' && renderWeekView()}
          {view.type === 'day' && renderDayView()}
          {view.type === 'list' && renderListView()}
        </div>
      </div>

      {/* Dialog de détails d'événement */}
      <EventDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        event={selectedEvent}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        onClose={() => {
          setShowDetailsDialog(false);
          setSelectedEvent(null);
        }}
      />

      {/* Dialog de création/édition d'événement */}
      <EventDialog
        open={showEventDialog}
        onOpenChange={setShowEventDialog}
        event={selectedEvent}
        selectedDate={selectedDate}
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
// DIALOG DE DÉTAILS D'ÉVÉNEMENT (Lecture seule)
// ============================================================================

interface EventDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  onClose: () => void;
}

const EventDetailsDialog: React.FC<EventDetailsDialogProps> = ({ 
  open, 
  onOpenChange, 
  event, 
  onEdit, 
  onDelete,
  onClose 
}) => {
  const [report, setReport] = useState<any | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Charger le rapport de RDV si l'événement a un rdv_id
  useEffect(() => {
    if (open && event && event.metadata?.rdv_id) {
      loadReport(event.metadata.rdv_id);
    } else {
      setReport(null);
    }
  }, [open, event]);

  const loadReport = async (rdvId: string) => {
    setLoadingReport(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/api/rdv/${rdvId}/report`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setReport(data.data);
        } else {
          setReport(null);
        }
      } else {
        setReport(null);
      }
    } catch (error) {
      console.error('Erreur chargement rapport:', error);
      setReport(null);
    } finally {
      setLoadingReport(false);
    }
  };

  if (!event) return null;

  const formatFullDateTime = (date: Date) => format(date, 'dd/MM/yyyy à HH:mm', { locale: fr });

  const getEventIcon = () => {
    const eventType = EVENT_TYPES[event.type as keyof typeof EVENT_TYPES] || EVENT_TYPES.appointment;
    const Icon = eventType.icon;
    return <Icon className="h-5 w-5" />;
  };

  const getPriorityLabel = () => {
    const labels: Record<string, string> = {
      low: 'Faible',
      medium: 'Moyenne',
      high: 'Élevée',
      critical: 'Critique',
      urgent: 'Urgente'
    };
    return labels[event.priority] || event.priority;
  };

  const getStatusLabel = () => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      confirmed: 'Confirmé',
      completed: 'Terminé',
      cancelled: 'Annulé'
    };
    return labels[event.status] || event.status;
  };

  const getCategoryLabel = () => {
    const labels: Record<string, string> = {
      qualification: '🔍 Qualification',
      presentation_expert: '👤 Présentation expert',
      proposition_commerciale: '📄 Proposition commerciale',
      signature: '✅ Signature',
      suivi: '📋 Suivi',
      autre: '🔹 Autre'
    };
    return labels[event.category || ''] || event.category || 'Non spécifié';
  };

  const handleDeleteClick = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      onDelete(event.id);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className={cn("p-3 rounded-full", EVENT_TYPES[event.type as keyof typeof EVENT_TYPES]?.color || 'bg-blue-500')}>
                {getEventIcon()}
              </div>
              <div className="flex-1">
                <DialogTitle className="text-2xl mb-2">{event.title}</DialogTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={PRIORITY_COLORS[event.priority] || PRIORITY_COLORS.medium}>
                    {getPriorityLabel()}
                  </Badge>
                  <Badge className={STATUS_COLORS[event.status] || STATUS_COLORS.pending}>
                    {getStatusLabel()}
                  </Badge>
                  <Badge variant="outline">
                    {EVENT_TYPES[event.type as keyof typeof EVENT_TYPES]?.label || event.type}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Description */}
          {event.description && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description
              </h4>
              <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {/* Rapport de RDV */}
          {event.metadata?.rdv_id && (
            <div>
              {loadingReport ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Chargement du rapport...</span>
                </div>
              ) : report ? (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Rapport de RDV
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-700 whitespace-pre-wrap">{report.summary}</p>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Date et heure */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Date et heure
            </h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-gray-700">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Début :</span>
                <span>{formatFullDateTime(new Date(event.start_date))}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Fin :</span>
                <span>{formatFullDateTime(new Date(event.end_date))}</span>
              </div>
            </div>
          </div>

          {/* Lieu et format */}
          {(event.location || event.is_online) && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Lieu et format</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {event.is_online && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Video className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Événement en ligne</span>
                  </div>
                )}
                {event.meeting_url && (
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-gray-500" />
                    <a 
                      href={event.meeting_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {event.meeting_url}
                    </a>
                  </div>
                )}
                {event.location && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Étape commerciale */}
          {event.category && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Étape commerciale</h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-gray-700">{getCategoryLabel()}</span>
              </div>
            </div>
          )}

          {/* L'événement concerne */}
          {(event.client_info || event.expert_info || (event as any).apporteur_info) && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">L'événement concerne :</h4>
              <p className="text-xs text-gray-500 mb-2">Ces informations permettent d'enrichir l'événement sans ajouter de participants officiels</p>
              <div className="bg-slate-50 rounded-lg p-3 space-y-2 border border-slate-200">
                {event.client_info && (
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">👤 Client</div>
                    <div className="text-gray-700 ml-5">
                      {event.client_info.full_name}
                      {event.client_info.company_name && (
                        <span className="text-gray-500"> • {event.client_info.company_name}</span>
                      )}
                    </div>
                  </div>
                )}
                {event.expert_info && (
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">🎯 Expert</div>
                    <div className="text-gray-700 ml-5">
                      {event.expert_info.full_name}
                      {event.expert_info.company_name && (
                        <span className="text-gray-500"> • {event.expert_info.company_name}</span>
                      )}
                    </div>
                  </div>
                )}
                {(event as any).apporteur_info && (
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">🤝 Apporteur</div>
                    <div className="text-gray-700 ml-5">
                      {(event as any).apporteur_info.full_name}
                      {(event as any).apporteur_info.company_name && (
                        <span className="text-gray-500"> • {(event as any).apporteur_info.company_name}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Participants (vrais participants qui reçoivent des notifications) */}
          {event.participants && Array.isArray(event.participants) && event.participants.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participants
              </h4>
              <p className="text-xs text-gray-500 mb-2">Ces personnes ont été invitées et recevront des notifications</p>
              <div className="bg-blue-50 rounded-lg p-3 space-y-2 border border-blue-200">
                {event.participants.map((participant: any, index: number) => (
                  <div key={participant.id || index} className="text-sm">
                    <div className="font-medium text-gray-900">
                      {participant.type === 'client' && '👤'}
                      {participant.type === 'expert' && '🎯'}
                      {participant.type === 'apporteur' && '🤝'}
                      {participant.type === 'admin' && '👨‍💼'}
                      {' '}
                      {participant.name || participant.email || 'Participant'}
                    </div>
                    {participant.email && (
                      <div className="text-gray-600 ml-5 text-xs">{participant.email}</div>
                    )}
                    {participant.status && (
                      <div className="text-xs ml-5 mt-1">
                        <Badge variant={participant.status === 'accepted' ? 'default' : participant.status === 'declined' ? 'destructive' : 'secondary'} className="text-xs">
                          {participant.status === 'pending' && 'En attente'}
                          {participant.status === 'accepted' && 'Accepté'}
                          {participant.status === 'declined' && 'Refusé'}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-2 mt-6 pt-4 border-t">
          <Button
            variant="destructive"
            onClick={handleDeleteClick}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Fermer
            </Button>
            <Button
              onClick={() => onEdit(event)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Modifier
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// DIALOG D'ÉVÉNEMENT (Création/Édition)
// ============================================================================

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent | null;
  selectedDate?: Date | null;
  onSubmit: (event: any) => void;
  onCancel: () => void;
}

type ParticipantType = 'client' | 'expert' | 'apporteur' | 'admin' | 'user';

interface ParticipantOption {
  id: string;
  name: string;
  email?: string;
  type: ParticipantType;
  isTemporary?: boolean;
}


const participantTypeOrder: ParticipantType[] = ['client', 'expert', 'apporteur', 'admin', 'user'];

const normalizeLabel = (value?: string | null) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const looksTemporary = (value?: string | null) => {
  const normalized = normalizeLabel(value);
  if (!normalized) return false;
  return normalized.includes('client temporaire') || normalized.includes('temporaire') || normalized.includes('temporary');
};

const EventDialog: React.FC<EventDialogProps> = ({ open, onOpenChange, event, selectedDate, onSubmit, onCancel }) => {
  const { user } = useAuth();
  
  // Fonction pour formater l'heure en format datetime-local
  const formatDateTimeLocal = (date: Date) => {
    return format(date, "yyyy-MM-dd'T'HH:mm");
  };
  
  // Fonction pour obtenir l'heure de fin par défaut (30 minutes après)
  const getDefaultEndTime = (startDate: Date) => {
    return addMinutes(startDate, 30);
  };
  
  // Vérifier si des données préremplies sont disponibles (depuis timeline)
  const getPrefillData = () => {
    if (event) return null; // Ne pas utiliser prefill si on édite un événement existant
    try {
      const prefill = localStorage.getItem('calendar_event_prefill');
      if (prefill) {
        const data = JSON.parse(prefill);
        localStorage.removeItem('calendar_event_prefill');
        return data;
      }
    } catch (err) {
      console.error('Erreur parsing prefill:', err);
      localStorage.removeItem('calendar_event_prefill');
    }
    return null;
  };

  const prefillData = React.useMemo(() => getPrefillData(), [open, event]);

  const [formData, setFormData] = useState({
    title: event?.title || prefillData?.title || '',
    description: event?.description || prefillData?.description || '',
    start_date: event?.start_date 
      ? formatDateTimeLocal(new Date(event.start_date))
      : prefillData?.start_date 
        ? formatDateTimeLocal(new Date(prefillData.start_date))
        : formatDateTimeLocal(new Date()),
    end_date: event?.end_date 
      ? formatDateTimeLocal(new Date(event.end_date))
      : prefillData?.end_date
        ? formatDateTimeLocal(new Date(prefillData.end_date))
        : formatDateTimeLocal(getDefaultEndTime(new Date())),
    priority: event?.priority || prefillData?.priority || 'medium',
    location: event?.location || '',
    is_online: event?.is_online || false,
    meeting_url: event?.meeting_url || '',
    color: event?.color || '#3B82F6',
    client_id: event?.client_id || prefillData?.client_id || '',
    expert_id: event?.expert_id || '',
    apporteur_id: (event as any)?.apporteur_id || '',
    dossier_id: (event as any)?.dossier_id || prefillData?.dossier_id || '',
    participants: event?.participants || []
  });

  const [availableParticipants, setAvailableParticipants] = useState<ParticipantOption[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [openParticipantSections, setOpenParticipantSections] = useState<Record<string, boolean>>({
    client: false,
    expert: false,
    apporteur: false,
    admin: false
  });
  const canAssignExpert = ['admin', 'apporteur'].includes(user?.type || '');
  const canAssignApporteur = user?.type === 'admin';

  const participantGroups = React.useMemo(() => {
    const groups: Record<ParticipantType, ParticipantOption[]> = {
      client: [],
      expert: [],
      apporteur: [],
      admin: [],
      user: []
    };

    availableParticipants.forEach((participant) => {
      if (participant.type === 'client' && participant.isTemporary) {
        return;
      }
      const key = participant.type || 'user';
      groups[key].push(participant);
    });

    participantTypeOrder.forEach((type) => {
      groups[type].sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
    });

    return groups;
  }, [availableParticipants]);

  const clientOptions = participantGroups.client;
  const expertOptions = participantGroups.expert;
  const apporteurOptions = participantGroups.apporteur;

  React.useEffect(() => {
    if (open && ['admin', 'expert', 'apporteur', 'client'].includes(user?.type || '')) {
      loadAvailableParticipants();
    }
    
    // Réinitialiser formData si prefillData change
    if (open && prefillData && !event) {
      setFormData(prev => ({
        ...prev,
        title: prefillData.title || prev.title,
        description: prefillData.description || prev.description,
        start_date: prefillData.start_date ? formatDateTimeLocal(new Date(prefillData.start_date)) : prev.start_date,
        end_date: prefillData.end_date ? formatDateTimeLocal(new Date(prefillData.end_date)) : prev.end_date,
        client_id: prefillData.client_id || prev.client_id,
        dossier_id: prefillData.dossier_id || prev.dossier_id,
        priority: prefillData.priority || prev.priority
      }));
    }
  }, [open, user?.type, prefillData, event]);

  // Mettre à jour les dates quand selectedDate change (si le formulaire est ouvert et qu'on n'édite pas un événement)
  React.useEffect(() => {
    if (open && selectedDate && !event) {
      // Préserver l'heure si elle existe déjà dans formData
      const currentStart = formData.start_date ? new Date(formData.start_date) : null;
      const currentEnd = formData.end_date ? new Date(formData.end_date) : null;
      
      // Calculer la nouvelle date de début avec l'heure préservée ou 9h par défaut
      const newStartDate = new Date(selectedDate);
      if (currentStart) {
        newStartDate.setHours(currentStart.getHours(), currentStart.getMinutes(), 0, 0);
      } else {
        newStartDate.setHours(9, 0, 0, 0);
      }
      
      // Calculer la nouvelle date de fin avec la durée préservée ou 30 minutes par défaut
      const newEndDate = new Date(newStartDate);
      if (currentStart && currentEnd) {
        const duration = currentEnd.getTime() - currentStart.getTime();
        newEndDate.setTime(newStartDate.getTime() + duration);
      } else {
        newEndDate.setTime(newStartDate.getTime() + 30 * 60 * 1000); // 30 minutes
      }
      
      setFormData(prev => ({
        ...prev,
        start_date: formatDateTimeLocal(newStartDate),
        end_date: formatDateTimeLocal(newEndDate)
      }));
    }
  }, [selectedDate, open, event]);

  // Charger tous les participants disponibles
  const loadAvailableParticipants = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const requests: Array<{ type: ParticipantType; url: string }> = [];

      if (user?.type === 'admin') {
        requests.push(
          { type: 'client', url: `${config.API_URL}/api/admin/clients?limit=200` },
          { type: 'expert', url: `${config.API_URL}/api/admin/experts?limit=200` },
          { type: 'apporteur', url: `${config.API_URL}/api/admin/apporteurs?limit=200` },
          { type: 'admin', url: `${config.API_URL}/api/calendar/admins?limit=200` }
        );
      } else if (user?.type === 'expert') {
        requests.push(
          { type: 'client', url: `${config.API_URL}/api/admin/clients?limit=200` },
          { type: 'admin', url: `${config.API_URL}/api/calendar/admins?limit=200` }
        );
      } else if (user?.type === 'apporteur') {
        requests.push(
          { type: 'client', url: `${config.API_URL}/api/apporteur/prospects` },
          { type: 'expert', url: `${config.API_URL}/api/experts` },
          { type: 'admin', url: `${config.API_URL}/api/calendar/admins?limit=200` }
        );
      } else if (user?.type === 'client') {
        requests.push(
          { type: 'expert', url: `${config.API_URL}/api/experts` },
          { type: 'admin', url: `${config.API_URL}/api/calendar/admins?limit=200` }
        );
      }

      const participants: ParticipantOption[] = [];

      for (const request of requests) {
        try {
          const response = await fetch(request.url, { headers });
          if (!response.ok) continue;
          const payload = await response.json();
          const items = extractParticipantItems(payload);
          const mapped = items
            .map((item: any) => mapParticipant(item, request.type))
            .filter((participant): participant is ParticipantOption => !!participant);
          participants.push(...mapped);
        } catch (requestError) {
          console.warn(`⚠️ Impossible de charger ${request.type}:`, requestError);
        }
      }

      setAvailableParticipants(participants);
    } catch (error) {
      console.error('Erreur chargement participants:', error);
    }
  };

  const extractParticipantItems = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.clients)) return data.clients;
    if (Array.isArray(data.experts)) return data.experts;
    if (Array.isArray(data.apporteurs)) return data.apporteurs;
    if (Array.isArray(data.admins)) return data.admins;
    if (data.data) {
      if (Array.isArray(data.data.clients)) return data.data.clients;
      if (Array.isArray(data.data.experts)) return data.data.experts;
      if (Array.isArray(data.data.apporteurs)) return data.data.apporteurs;
      if (Array.isArray(data.data.admins)) return data.data.admins;
      if (Array.isArray(data.data.prospects)) return data.data.prospects;
      if (Array.isArray(data.data.data)) return data.data.data;
    }
    if (Array.isArray(data.items)) return data.items;
    return [];
  };

  const mapParticipant = (item: any, type: ParticipantType): ParticipantOption | null => {
    if (!item?.id) return null;
    const fallbackName = `${item.first_name || ''} ${item.last_name || ''}`.trim();
    const displayName = item.company_name || item.full_name || fallbackName || item.name || item.email || 'Participant';
    const isTemporary = item.is_temporary === true || looksTemporary(displayName) || looksTemporary(item.email);

    return {
      id: item.id,
      name: displayName,
      email: item.email || undefined,
      type,
      isTemporary
    };
  };

  // Gestion des participants optionnels
  const handleAddParticipant = (participant: ParticipantOption) => {
    if (!formData.participants.find((p: any) => p.id === participant.id)) {
      setFormData(prev => ({
        ...prev,
        participants: [...prev.participants, {
          id: participant.id,
          name: participant.name,
          email: participant.email,
          type: participant.type
        }]
      }));
    }
  };

  const handleRemoveParticipant = (participantId: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter((p: any) => p.id !== participantId)
    }));
  };

  const toggleParticipantSection = (type: string) => {
    setOpenParticipantSections(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Labels pour les types de participants
  const participantTypeLabels: Record<ParticipantType, string> = {
    client: 'Clients',
    expert: 'Experts',
    apporteur: 'Apporteurs',
    admin: 'Administrateurs',
    user: 'Autres'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔍 EventDialog handleSubmit appelé');
    console.log('🔍 Données du formulaire avant traitement:', formData);

    const errors: Record<string, string> = {};
    // Plus de validation obligatoire pour client_id - tout est optionnel sauf titre et dates

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitError('Veuillez renseigner les champs obligatoires');
      toast.error('Merci de compléter les champs obligatoires du rendez-vous');
      return;
    }

    setFieldErrors({});
    setSubmitError(null);
    
    const startDate = new Date(formData.start_date);
    const endDate = formData.end_date 
      ? new Date(formData.end_date)
      : getDefaultEndTime(startDate);
    
    const eventData = {
      title: formData.title,
      description: formData.description || undefined,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      priority: formData.priority || 'medium',
      location: formData.location || null,
      meeting_url: formData.meeting_url || null,
      is_online: formData.is_online || false,
      client_id: formData.client_id || undefined,
      expert_id: formData.expert_id || undefined,
      apporteur_id: formData.apporteur_id || undefined,
      dossier_id: formData.dossier_id || undefined,
      color: formData.color || '#3B82F6',
      participants: formData.participants.length > 0 ? formData.participants.map((p: any) => ({
        user_id: p.id,
        user_type: p.type,
        user_email: p.email,
        user_name: p.name
      })) : undefined
    };
    
    console.log('🔍 Données d\'événement envoyées:', eventData);
    console.log('🔍 Appel onSubmit avec:', eventData);
    
    try {
      await onSubmit(eventData);
    } catch (error: any) {
      const message = error?.message || 'Impossible d\'enregistrer l\'événement';
      const field = error?.field;
      setSubmitError(message);
      if (field) {
        setFieldErrors({ [field]: message });
      }
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {event ? 'Modifier l\'événement' : 'Créer un événement'}
          </DialogTitle>
          <DialogDescription>
            {event ? 'Modifiez les détails de votre événement.' : 'Créez un nouvel événement dans votre calendrier.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          {/* L'événement concerne : (pour enrichir les infos, pas participants officiels) */}
          <div className="space-y-2">
            <Label>L'événement concerne : <span className="text-xs text-gray-500">(optionnel)</span></Label>
            <p className="text-xs text-gray-500 mb-2">Ces informations permettent d'enrichir l'événement sans ajouter de participants officiels</p>
          </div>
          
          {/* L'événement concerne : Client, Expert, Apporteur (optionnel) */}
          <div className="grid gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="client_id" className="text-slate-900">
                Client <span className="text-xs text-gray-500">(optionnel)</span>
              </Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, client_id: value }));
                  setFieldErrors(prev => ({ ...prev, client_id: '' }));
                }}
                disabled={clientOptions.length === 0}
              >
                <SelectTrigger className={cn('bg-white', fieldErrors.client_id && 'border-red-500')}>
                  <SelectValue placeholder={clientOptions.length === 0 ? 'Aucun client disponible' : 'Sélectionner un client'} />
                </SelectTrigger>
                <SelectContent>
                  {clientOptions.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.client_id && (
                <p className="text-xs text-red-600">{fieldErrors.client_id}</p>
              )}
            </div>

            {canAssignExpert && (
              <div className="space-y-1">
                <Label htmlFor="expert_id" className="text-slate-900">
                  Expert <span className="text-xs text-gray-500">(optionnel)</span>
                </Label>
                <Select
                  value={formData.expert_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, expert_id: value }))}
                  disabled={expertOptions.length === 0}
                >
                  <SelectTrigger className="bg-white flex-1">
                    <SelectValue placeholder={expertOptions.length === 0 ? 'Aucun expert' : 'Sélectionner un expert'} />
                  </SelectTrigger>
                  <SelectContent>
                    {expertOptions.map((expert) => (
                      <SelectItem key={expert.id} value={expert.id}>
                        {expert.name}
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
                    className="mt-1"
                  >
                    Retirer l'expert
                  </Button>
                )}
              </div>
            )}

            {canAssignApporteur && (
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="apporteur_id" className="text-slate-900">
                  Apporteur <span className="text-xs text-gray-500">(optionnel)</span>
                </Label>
                <Select
                  value={formData.apporteur_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, apporteur_id: value }))}
                  disabled={apporteurOptions.length === 0}
                >
                  <SelectTrigger className="bg-white flex-1">
                    <SelectValue placeholder={apporteurOptions.length === 0 ? 'Aucun apporteur' : 'Sélectionner un apporteur'} />
                  </SelectTrigger>
                  <SelectContent>
                    {apporteurOptions.map((apporteur) => (
                      <SelectItem key={apporteur.id} value={apporteur.id}>
                        {apporteur.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.apporteur_id && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, apporteur_id: '' }))}
                    className="mt-1"
                  >
                    Retirer l'apporteur
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Participants optionnels */}
          <div className="space-y-2">
            <Label>Participants <span className="text-xs text-gray-500">(optionnel)</span></Label>
            <p className="text-xs text-gray-500 mb-2">Ajoutez des participants qui recevront une notification pour cet événement</p>
            
            {/* Liste des participants sélectionnés */}
            {formData.participants.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.participants.map((participant: any) => (
                  <Badge 
                    key={participant.id} 
                    variant="secondary" 
                    className="flex items-center gap-1 px-3 py-1"
                  >
                    <Users className="w-3 h-3" />
                    {participant.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(participant.id)}
                      className="ml-1 hover:text-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                loadAvailableParticipants();
                setShowParticipantsModal(true);
              }}
              className="w-full"
            >
              <Users className="w-4 h-4 mr-2" />
              {formData.participants.length > 0 
                ? `Modifier les participants (${formData.participants.length})` 
                : 'Ajouter des participants'}
            </Button>
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

          {submitError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {submitError}
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

        {/* Modal de sélection de participants */}
        <Dialog open={showParticipantsModal} onOpenChange={setShowParticipantsModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajouter des participants</DialogTitle>
              <DialogDescription>
                Sélectionnez les personnes à inviter à cet événement. Elles recevront une notification.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              {participantTypeOrder.map((type) => {
                const group = participantGroups[type];
                const visibleGroup = group?.filter(participant => !(participant.type === 'client' && participant.isTemporary)) || [];
                if (visibleGroup.length === 0) return null;

                const isOpen = openParticipantSections[type] || false;
                const isAlreadyAdded = (participantId: string) => 
                  formData.participants.find((p: any) => p.id === participantId);

                return (
                  <Collapsible
                    key={type}
                    open={isOpen}
                    onOpenChange={() => toggleParticipantSection(type)}
                  >
                    <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{participantTypeLabels[type] || type}</span>
                        <Badge variant="secondary" className="text-xs">
                          {visibleGroup.length}
                        </Badge>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-2">
                      <div className="max-h-60 overflow-y-auto space-y-2 p-2 border rounded-lg bg-gray-50">
                        {visibleGroup.map((participant) => {
                          const alreadyAdded = isAlreadyAdded(participant.id);
                          return (
                            <button
                              key={participant.id}
                              type="button"
                              onClick={() => !alreadyAdded && handleAddParticipant(participant)}
                              disabled={alreadyAdded}
                              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                alreadyAdded 
                                  ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed' 
                                  : 'hover:bg-blue-50 hover:border-blue-300 border-gray-200 cursor-pointer bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium">
                                  {participant.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{participant.name}</p>
                                  {participant.email && (
                                    <p className="text-xs text-gray-500 truncate">{participant.email}</p>
                                  )}
                                </div>
                                {alreadyAdded && (
                                  <Badge variant="secondary" className="text-xs">Ajouté</Badge>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}

              {participantTypeOrder.every(type => (participantGroups[type] || []).length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun participant disponible</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowParticipantsModal(false)}
              >
                Fermer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}; 