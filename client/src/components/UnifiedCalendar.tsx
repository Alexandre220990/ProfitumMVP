import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Users, User, FileText, AlertTriangle, Edit, Trash2, Bell, MapPin, Video, List, CalendarDays, RefreshCw } from 'lucide-react';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

          {/* Participants */}
          {(event.client_info || event.expert_info) && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participants
              </h4>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
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

const participantTypeLabels: Record<ParticipantType, string> = {
  client: 'Clients',
  expert: 'Experts',
  apporteur: 'Apporteurs',
  admin: 'Administrateurs',
  user: 'Autres'
};

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

const EventDialog: React.FC<EventDialogProps> = ({ open, onOpenChange, event, onSubmit, onCancel }) => {
  const { user } = useAuth();
  
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
    category: event?.category || 'qualification',
    location: event?.location || '',
    is_online: event?.is_online || false,
    meeting_url: event?.meeting_url || '',
    color: event?.color || '#3B82F6',
    client_id: event?.client_id || '',
    expert_id: event?.expert_id || '',
    apporteur_id: (event as any)?.apporteur_id || '',
    participants: event?.participants || []
  });

  // État pour gérer le modal de sélection de participants
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [availableParticipants, setAvailableParticipants] = useState<ParticipantOption[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const requiresClientSelection = ['admin', 'expert', 'apporteur'].includes(user?.type || '');
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
  }, [open, user?.type]);

  // Charger tous les participants disponibles
  const loadAvailableParticipants = async () => {
    setLoadingParticipants(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const requests: Array<{ type: ParticipantType; url: string }> = [];

      if (user?.type === 'admin') {
        requests.push(
          { type: 'client', url: `${config.API_URL}/api/admin/clients?limit=200` },
          { type: 'expert', url: `${config.API_URL}/api/admin/experts?limit=200` },
          { type: 'apporteur', url: `${config.API_URL}/api/admin/apporteurs?limit=200` }
        );
      } else if (user?.type === 'expert') {
        requests.push({ type: 'client', url: `${config.API_URL}/api/admin/clients?limit=200` });
      } else if (user?.type === 'apporteur') {
        requests.push(
          { type: 'client', url: `${config.API_URL}/api/apporteur/prospects` },
          { type: 'expert', url: `${config.API_URL}/api/experts` }
        );
      } else if (user?.type === 'client') {
        requests.push({ type: 'expert', url: `${config.API_URL}/api/experts` });
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
    } finally {
      setLoadingParticipants(false);
    }
  };

  const extractParticipantItems = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.clients)) return data.clients;
    if (Array.isArray(data.experts)) return data.experts;
    if (Array.isArray(data.apporteurs)) return data.apporteurs;
    if (data.data) {
      if (Array.isArray(data.data.clients)) return data.data.clients;
      if (Array.isArray(data.data.experts)) return data.data.experts;
      if (Array.isArray(data.data.apporteurs)) return data.data.apporteurs;
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

  // Ajouter un participant
  const handleAddParticipant = (participant: any) => {
    if (!formData.participants.find((p: any) => p.id === participant.id)) {
      setFormData(prev => ({
        ...prev,
        participants: [...prev.participants, participant]
      }));
    }
    setShowParticipantsModal(false);
  };

  // Retirer un participant
  const handleRemoveParticipant = (participantId: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter((p: any) => p.id !== participantId)
    }));
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
    if (requiresClientSelection && !formData.client_id) {
      errors.client_id = user?.type === 'apporteur'
        ? 'Sélectionnez un client/prospect'
        : 'Sélectionnez un client';
    }

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
      ...formData,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      location: formData.location || null,
      meeting_url: formData.meeting_url || null,
      client_id: formData.client_id || undefined,
      expert_id: formData.expert_id || undefined,
      apporteur_id: formData.apporteur_id || undefined
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

          {/* Participants additionnels (optionnel) */}
          <div className="space-y-2">
            <Label>Participants <span className="text-xs text-gray-500">(optionnel)</span></Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.participants.length > 0 ? (
                formData.participants.map((participant: any) => (
                  <Badge 
                    key={participant.id} 
                    variant="secondary" 
                    className="flex items-center gap-1 px-3 py-1"
                  >
                    <User className="w-3 h-3" />
                    {participant.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(participant.id)}
                      className="ml-1 hover:text-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-xs text-gray-500">Aucun participant ajouté</p>
              )}
            </div>
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
              Ajouter un participant
            </Button>
          </div>

          {requiresClientSelection && (
            <div className="grid gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="client_id" className="text-slate-900">
                  {user?.type === 'apporteur' ? 'Client / Prospect *' : 'Client *'}
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
                {clientOptions.length === 0 && (
                  <p className="text-xs text-slate-500">
                    Aucun client disponible. Ajoutez un participant ou créez un client avant de planifier ce rendez-vous.
                  </p>
                )}
              </div>

              {canAssignExpert && (
                <div className="space-y-1">
                  <Label htmlFor="expert_id" className="text-slate-900">
                    Expert {user?.type === 'apporteur' ? '(optionnel)' : ''}
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
                    >
                      Retirer l'expert
                    </Button>
                  )}
                </div>
              )}

              {canAssignApporteur && (
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="apporteur_id" className="text-slate-900">
                    Apporteur (optionnel)
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
                    >
                      Retirer l'apporteur
                    </Button>
                  )}
                </div>
              )}
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
              <Label htmlFor="category">Étape Commerciale</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qualification">🔍 Qualification</SelectItem>
                  <SelectItem value="presentation_expert">👤 Présentation expert</SelectItem>
                  <SelectItem value="proposition_commerciale">📄 Proposition commerciale</SelectItem>
                  <SelectItem value="signature">✅ Signature</SelectItem>
                  <SelectItem value="suivi">📋 Suivi</SelectItem>
                  <SelectItem value="autre">🔹 Autre</SelectItem>
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ajouter un participant</DialogTitle>
              <DialogDescription>
                Sélectionnez une personne à inviter à cet événement
              </DialogDescription>
            </DialogHeader>
            
            {loadingParticipants ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : participantTypeOrder.every(type => (participantGroups[type] || []).length === 0) ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucun participant disponible</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {participantTypeOrder.map((type) => {
                  const group = participantGroups[type];
                  const visibleGroup = group?.filter(participant => !(participant.type === 'client' && participant.isTemporary)) || [];
                  if (visibleGroup.length === 0) return null;
                  return (
                    <div key={type} className="space-y-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {participantTypeLabels[type]}
                      </p>
                      {visibleGroup.map((participant) => {
                        const isAlreadyAdded = formData.participants.find((p: any) => p.id === participant.id);
                        return (
                          <button
                            key={participant.id}
                            type="button"
                            onClick={() => !isAlreadyAdded && handleAddParticipant(participant)}
                            disabled={isAlreadyAdded}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${
                              isAlreadyAdded 
                                ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed' 
                                : 'hover:bg-blue-50 hover:border-blue-300 border-gray-200 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                  {participant.name?.charAt(0).toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{participant.name}</p>
                                <p className="text-xs text-gray-500 truncate">{participant.email}</p>
                              </div>
                              {isAlreadyAdded && (
                                <Badge variant="secondary" className="text-xs">Ajouté</Badge>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="flex justify-end">
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