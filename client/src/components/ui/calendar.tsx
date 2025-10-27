import React, { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Users, FileText, AlertTriangle, Edit, Trash2, Bell, MapPin, Video, List, CalendarDays, RefreshCw, Eye, Grid } from 'lucide-react';
import { format, isSameDay, startOfWeek, endOfWeek, addDays, subDays, startOfMonth, endOfMonth, addMinutes, addMonths, subMonths, getDay, getDate, isSameMonth, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';

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
import { motion } from 'framer-motion';
import { DayPicker } from 'react-day-picker';
import { buttonVariants } from '@/components/ui/button';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

interface CalendarView {
  type: 'month' | 'week' | 'day' | 'agenda' | 'list';
  date: Date;
}

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  type: 'appointment' | 'meeting' | 'reminder' | 'task';
  category: 'personal' | 'work' | 'health' | 'social' | 'collaborative';
  is_online?: boolean;
  meeting_url?: string;
  phone_number?: string;
  location?: string;
  participants?: string[];
  reminders?: Array<{ type: 'email' | 'push'; time: number }>;
  color?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'confirmed' | 'cancelled';
}

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent | null;
  onSubmit: (event: Partial<CalendarEvent>) => void;
  onCancel: () => void;
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

const startOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const endOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

const getViewStartDate = (currentView: CalendarView): Date => {
  switch (currentView.type) {
    case 'day':
      return startOfDay(currentView.date);
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
};

const getViewEndDate = (currentView: CalendarView): Date => {
  switch (currentView.type) {
    case 'day':
      return endOfDay(currentView.date);
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
};

// ============================================================================
// COMPOSANT CALENDRIER UNIFIÉ
// ============================================================================

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

export const UnifiedCalendar: React.FC<UnifiedCalendarProps> = ({
  className = '',
  showHeader = true,
  enableGoogleSync = false,
  enableRealTime = true,
  defaultView = 'month',
  filters = {}
}) => {
  
  // État local avec date calibrée pour août 2024
  const [view, setView] = useState<CalendarView>({ 
    type: defaultView, 
    date: new Date(2024, 7, 8, 13, 2) // 8 août 2024 à 13:02
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(2024, 7, 8, 13, 2));
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
  // GESTION DES ÉVÉNEMENTS
  // ========================================

  const handleDateSelect = useCallback((date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setShowEventDialog(true);
    }
  }, []);

  const handleEventSubmit = useCallback(async (eventData: Partial<CalendarEvent>) => {
    try {
      if (selectedEvent) {
        await updateEvent(selectedEvent.id, eventData);
      } else {
        await createEvent(eventData);
      }
      setShowEventDialog(false);
      setSelectedEvent(null);
      setSelectedDate(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'événement:', error);
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
      console.error('Erreur lors de la suppression de l\'événement:', error);
    }
  }, [deleteEvent]);

  // ========================================
  // RENDU DES VUES
  // ========================================

  const renderMonthView = () => {
    const startDate = startOfMonth(view.date);
    const endDate = endOfMonth(view.date);
    const startDay = getDay(startDate);
    const daysInMonth = getDate(endDate);
    
    const days = [];
    const firstDayOfMonth = new Date(2024, 7, 1); // 1er août 2024
    const lastDayOfMonth = new Date(2024, 7, 31); // 31 août 2024
    
    // Ajouter les jours du mois précédent pour remplir la première semaine
    for (let i = startDay; i > 0; i--) {
      const date = subDays(firstDayOfMonth, i);
      days.push({ date, isCurrentMonth: false });
    }
    
    // Ajouter tous les jours du mois actuel
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(2024, 7, i);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Ajouter les jours du mois suivant pour remplir la dernière semaine
    const remainingDays = 42 - days.length; // 6 semaines * 7 jours
    for (let i = 1; i <= remainingDays; i++) {
      const date = addDays(lastDayOfMonth, i);
      days.push({ date, isCurrentMonth: false });
    }

    return (
      <div className="space-y-6">
        {/* Navigation du mois */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView(prev => ({ ...prev, date: subMonths(prev.date, 1) }))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h2 className="text-xl font-semibold text-gray-900">
            {format(view.date, 'MMMM yyyy', { locale: fr })}
          </h2>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView(prev => ({ ...prev, date: addMonths(prev.date, 1) }))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Grille du calendrier */}
        <div className="grid grid-cols-7 gap-1">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
          
          {days.map(({ date, isCurrentMonth }, index) => {
            const dayEvents = getEventsForDate(date);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isCurrentDay = isToday(date);
            
            return (
              <div
                key={index}
                className={cn(
                  "p-2 min-h-[80px] border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors",
                  !isCurrentMonth && "bg-gray-50 text-gray-400",
                  isCurrentDay && "bg-blue-50 border-blue-300",
                  isSelected && "bg-blue-100 border-blue-400"
                )}
                onClick={() => handleDateSelect(date)}
              >
                <div className={cn(
                  "text-sm font-medium",
                  isCurrentDay && "text-blue-600 font-bold"
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
                    onEdit={handleEditEvent}
                    onDelete={handleDeleteEvent}
                    compact
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(view.date, { locale: fr });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Semaine du {format(weekStart, 'dd/MM/yyyy', { locale: fr })}
          </h2>
          <Button onClick={() => setShowEventDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel événement
          </Button>
        </div>
        
        <div className="grid grid-cols-8 gap-1">
          <div className="p-2"></div>
          {weekDays.map(day => (
            <div key={day.toISOString()} className="p-2 text-center">
              <div className="text-sm font-medium text-gray-900">
                {format(day, 'EEE', { locale: fr })}
              </div>
              <div className="text-lg font-bold text-gray-700">
                {format(day, 'd')}
              </div>
            </div>
          ))}
          
          <div className="p-2 text-sm font-medium text-gray-500">Heure</div>
          {weekDays.map(day => (
            <div key={day.toISOString()} className="min-h-[400px] border border-gray-200 p-2">
              {getEventsForDate(day).map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onEdit={handleEditEvent}
                  onDelete={handleDeleteEvent}
                  compact
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(view.date);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {format(view.date, 'EEEE dd MMMM yyyy', { locale: fr })}
          </h2>
          <Button onClick={() => setShowEventDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel événement
          </Button>
        </div>
        
        <div className="space-y-4">
          {dayEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun événement aujourd'hui</h3>
              <p className="mt-1 text-sm text-gray-500">
                Créez votre premier événement pour commencer.
              </p>
            </div>
          ) : (
            dayEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
              />
            ))
          )}
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
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
              />
            ))
          )}
        </div>
      </div>
    );
  };

  const renderListView = () => {
    const allEvents = filteredEvents || [];
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Liste des événements</h2>
          <Button onClick={() => setShowEventDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel événement
          </Button>
        </div>

        <div className="space-y-4">
          {allEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun événement</h3>
              <p className="mt-1 text-sm text-gray-500">
                Créez votre premier événement pour commencer.
              </p>
            </div>
          ) : (
            allEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
              />
            ))
          )}
        </div>
      </div>
    );
  };

  // ========================================
  // COMPOSANT CARTE D'ÉVÉNEMENT
  // ========================================

  const EventCard: React.FC<{ 
    event: CalendarEvent; 
    compact?: boolean;
    onEdit?: (event: CalendarEvent) => void;
    onDelete?: (eventId: string) => void;
  }> = ({ event, compact = false, onEdit, onDelete }) => {
    const getEventIcon = () => {
      switch (event.type) {
        case 'appointment': return CalendarIcon;
        case 'meeting': return Users;
        case 'reminder': return Bell;
        case 'task': return FileText;
        default: return CalendarIcon;
      }
    };

    const getEventColor = () => {
      switch (event.type) {
        case 'appointment': return 'bg-blue-500';
        case 'meeting': return 'bg-purple-500';
        case 'reminder': return 'bg-yellow-500';
        case 'task': return 'bg-green-500';
        default: return 'bg-gray-500';
      }
    };

    const Icon = getEventIcon();
    const colorClass = getEventColor();

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all",
          compact && "p-3"
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={cn("p-2 rounded-lg", colorClass)}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {event.title}
              </h3>
              
              {event.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {event.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {format(new Date(event.start_date), 'HH:mm')} - {format(new Date(event.end_date), 'HH:mm')}
                  </span>
                </div>
                
                {event.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{event.location}</span>
                  </div>
                )}
                
                {event.is_online && (
                  <div className="flex items-center gap-1">
                    <Video className="w-3 h-3" />
                    <span>En ligne</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {event.category}
                </Badge>
                {event.priority && (
                  <Badge 
                    variant={event.priority === 'high' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {event.priority}
                  </Badge>
                )}
                {event.status && (
                  <Badge 
                    variant={event.status === 'confirmed' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {event.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {!compact && (onEdit || onDelete) && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(event)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(event.id)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // ========================================
  // COMPOSANT DIALOG D'ÉVÉNEMENT
  // ========================================

  const EventDialog: React.FC<EventDialogProps> = ({
    open,
    onOpenChange,
    event,
    onSubmit,
    onCancel
  }) => {
    const [formData, setFormData] = useState<Partial<CalendarEvent>>({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      type: 'appointment',
      category: 'personal',
      location: '',
      is_online: false,
      priority: 'medium',
      status: 'pending'
    });

    useEffect(() => {
      if (event) {
        setFormData({
          title: event.title,
          description: event.description,
          start_date: event.start_date,
          end_date: event.end_date,
          type: event.type,
          category: event.category,
          location: event.location,
          is_online: event.is_online,
          priority: event.priority,
          status: event.status
        });
      } else {
        setFormData({
          title: '',
          description: '',
          start_date: selectedDate?.toISOString() || new Date().toISOString(),
          end_date: selectedDate ? addMinutes(selectedDate, 60).toISOString() : addMinutes(new Date(), 60).toISOString(),
          type: 'appointment',
          category: 'personal',
          location: '',
          is_online: false,
          priority: 'medium',
          status: 'pending'
        });
      }
    }, [event, selectedDate]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {event ? 'Modifier l\'événement' : 'Nouvel événement'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appointment">Rendez-vous</SelectItem>
                    <SelectItem value="meeting">Réunion</SelectItem>
                    <SelectItem value="reminder">Rappel</SelectItem>
                    <SelectItem value="task">Tâche</SelectItem>
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
                <Label htmlFor="start_date">Début</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={formData.start_date ? format(new Date(formData.start_date), "yyyy-MM-dd'T'HH:mm") : ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: new Date(e.target.value).toISOString() }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="end_date">Fin</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date ? format(new Date(formData.end_date), "yyyy-MM-dd'T'HH:mm") : ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: new Date(e.target.value).toISOString() }))}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personnel</SelectItem>
                    <SelectItem value="work">Travail</SelectItem>
                    <SelectItem value="health">Santé</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="collaborative">Collaboratif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="priority">Priorité</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Élevée</SelectItem>
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
                placeholder="Adresse ou lieu de l'événement"
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
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuler
              </Button>
              <Button type="submit">
                {event ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header avec navigation */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Calendrier</h1>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Chargement...
              </div>
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
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEventDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvel événement
            </Button>
          </div>
        </div>
      )}

      {/* Navigation des vues */}
      <div className="flex items-center gap-2 mb-6">
        <Tabs value={view.type} onValueChange={(value) => setView(prev => ({ ...prev, type: value as any }))}>
          <TabsList>
            <TabsTrigger value="month" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Mois
            </TabsTrigger>
            <TabsTrigger value="week" className="flex items-center gap-2">
              <Grid className="h-4 w-4" />
              Semaine
            </TabsTrigger>
            <TabsTrigger value="day" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
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

      {/* Contenu de la vue */}
      <div className="bg-white rounded-lg border">
        <div className="p-6">
          {view.type === 'month' && renderMonthView()}
          {view.type === 'week' && renderWeekView()}
          {view.type === 'day' && renderDayView()}
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
// Composant de base pour la vue calendrier
// ============================================================================

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      } as any}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";
