import * as React from "react";
import { useState, useCallback, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Users, FileText, AlertTriangle, Edit, Trash2, Bell, MapPin, Video, User } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from '@/components/ui/toast-notifications';
import { useGoogleCalendar } from '@/hooks/use-google-calendar';

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  type: 'appointment' | 'deadline' | 'meeting' | 'task' | 'reminder';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  category: 'client' | 'expert' | 'admin' | 'system' | 'collaborative';
  dossierId?: string;
  dossierName?: string;
  participants: string[];
  location?: string;
  isOnline?: boolean;
  meetingUrl?: string;
  phoneNumber?: string;
  color: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  reminders: Reminder[];
  metadata?: {
    stepId?: string;
    stepName?: string;
    progress?: number;
    assignee?: string;
    estimatedDuration?: number;
    expertId?: string;
    expertName?: string;
  };
}

export interface Reminder {
  id: string;
  type: 'email' | 'push' | 'sms';
  time: number; // minutes before event
  sent: boolean;
}

export interface DossierStep {
  id: string;
  dossierId: string;
  dossierName: string;
  stepName: string;
  stepType: 'validation' | 'documentation' | 'expertise' | 'approval' | 'payment';
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  estimatedDuration: number; // minutes
  progress: number; // 0-100
  dependencies?: string[];
}

export interface CalendarView {
  type: 'month' | 'week' | 'day' | 'agenda';
  date: Date;
}

// ============================================================================
// CONSTANTES ET CONFIGURATION
// ============================================================================

const EVENT_TYPES = {
  appointment: { icon: CalendarIcon, color: 'bg-blue-500', label: 'Rendez-vous' },
  deadline: { icon: AlertTriangle, color: 'bg-red-500', label: 'Échéance' },
  meeting: { icon: Users, color: 'bg-purple-500', label: 'Réunion' },
  task: { icon: FileText, color: 'bg-green-500', label: 'Tâche' },
  reminder: { icon: Bell, color: 'bg-yellow-500', label: 'Rappel' }
} as const;

const PRIORITY_COLORS = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
} as const;



// ============================================================================
// HOOKS PERSONNALISÉS
// ============================================================================

const useCalendarEvents = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [dossierSteps, setDossierSteps] = useState<DossierStep[]>([]);
  // SUPPRIMER : const [loading, setLoading] = useState(false);

  // ===============================
  // API UTILS (à brancher sur backend réel)
  // ===============================
  const apiBase = '/api/calendar';

  // --- Synchronisation Google Calendar (point d'extension) ---
  const syncWithGoogleCalendar = async () => {
    // TODO: Appeler ici le service de synchronisation Google Calendar
    addToast({ type: 'info', title: 'Synchronisation', message: 'Synchronisation Google Calendar à venir', duration: 3000 });
  };

  // Charger les événements
  const loadEvents = useCallback(async () => {
    if (!user?.id) return;
    
    // setLoading(true); // SUPPRIMER
    try {
      const res = await fetch(`${apiBase}/events?client_id=${user.id}`);
      if (!res.ok) throw new Error('Erreur API chargement événements');
      const eventsData: CalendarEvent[] = await res.json();
      setEvents(eventsData);
    } catch (error) {
      addToast({ type: 'error', title: 'Erreur', message: 'Erreur lors du chargement des événements', duration: 4000 });
      console.error('Erreur chargement événements:', error);
    } finally {
      // setLoading(false); // SUPPRIMER
    }
  }, [user?.id, addToast]);

  // Charger les étapes de dossier
  const loadDossierSteps = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const res = await fetch(`${apiBase}/steps?dossier_id=${user.id}`);
      if (!res.ok) throw new Error('Erreur API chargement étapes');
      const stepsData: DossierStep[] = await res.json();
      setDossierSteps(stepsData);
    } catch (error) {
      addToast({ type: 'error', title: 'Erreur', message: 'Erreur lors du chargement des étapes', duration: 4000 });
      console.error('Erreur chargement étapes:', error);
    }
  }, [user?.id, addToast]);

  // Charger les données au montage
  useEffect(() => {
    loadEvents();
    loadDossierSteps();
  }, [loadEvents, loadDossierSteps]);

  // ===============================
  // FONCTIONS OPÉRATIONNELLES
  // ===============================

  // Ajout d'un événement au calendrier
  const addEvent = useCallback(async (eventData: Omit<CalendarEvent, 'id'>) => {
    if (!user?.id) return null;
    // setLoading(true); // SUPPRIMER
    try {
      const res = await fetch(`${apiBase}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
      if (!res.ok) throw new Error('Erreur API création événement');
      const newEvent = await res.json();
      setEvents(prev => [...prev, newEvent]);
      addToast({ type: 'success', title: 'Événement créé', message: newEvent.title, duration: 3000 });
      // Simuler la programmation d'un rappel (à remplacer par un vrai service)
      setTimeout(() => {
        addToast({ type: 'info', title: 'Rappel', message: `Rappel pour ${newEvent.title}`, duration: 3000 });
      }, 10000); // 10s après création
      // Point d'appel pour la synchronisation
      await syncWithGoogleCalendar();
      return newEvent;
    } catch (error) {
      addToast({ type: 'error', title: 'Erreur', message: 'Erreur lors de la création de l\'événement', duration: 4000 });
      console.error('Erreur création événement:', error);
      return null;
    } finally {
      // setLoading(false); // SUPPRIMER
    }
  }, [user?.id, addToast]);

  // Mise à jour d'un événement existant
  const updateEvent = useCallback(async (id: string, updates: Partial<CalendarEvent>) => {
    // setLoading(true); // SUPPRIMER
    try {
      const res = await fetch(`${apiBase}/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Erreur API mise à jour événement');
      const updatedEvent = await res.json();
      setEvents(prev => prev.map(event => event.id === id ? updatedEvent : event));
      addToast({ type: 'success', title: 'Événement mis à jour', message: updatedEvent.title, duration: 3000 });
      await syncWithGoogleCalendar();
      return updatedEvent;
    } catch (error) {
      addToast({ type: 'error', title: 'Erreur', message: 'Erreur lors de la mise à jour', duration: 4000 });
      console.error('Erreur mise à jour événement:', error);
      return null;
    } finally {
      // setLoading(false); // SUPPRIMER
    }
  }, [addToast]);

  // Suppression d'un événement
  const deleteEvent = useCallback(async (id: string) => {
    // setLoading(true); // SUPPRIMER
    try {
      const res = await fetch(`${apiBase}/events/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur API suppression événement');
      setEvents(prev => prev.filter(event => event.id !== id));
      addToast({ type: 'success', title: 'Événement supprimé', message: `ID: ${id}`, duration: 3000 });
      await syncWithGoogleCalendar();
    } catch (error) {
      addToast({ type: 'error', title: 'Erreur', message: 'Erreur lors de la suppression', duration: 4000 });
      console.error('Erreur suppression événement:', error);
    } finally {
      // setLoading(false); // SUPPRIMER
    }
  }, [addToast]);

  // Ajout d'une étape de dossier
  const addDossierStep = useCallback(async (stepData: Omit<DossierStep, 'id'>) => {
    // setLoading(true); // SUPPRIMER
    try {
      const res = await fetch(`${apiBase}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stepData)
      });
      if (!res.ok) throw new Error('Erreur API création étape');
      const newStep = await res.json();
      setDossierSteps(prev => [...prev, newStep]);
      addToast({ type: 'success', title: 'Étape ajoutée', message: newStep.stepName, duration: 3000 });
      // Simuler la programmation d'un rappel
      setTimeout(() => {
        addToast({ type: 'info', title: 'Rappel', message: `Rappel pour l'étape ${newStep.stepName}`, duration: 3000 });
      }, 10000);
      return newStep;
    } catch (error) {
      addToast({ type: 'error', title: 'Erreur', message: 'Erreur lors de l\'ajout d\'étape', duration: 4000 });
      console.error('Erreur ajout étape:', error);
      return null;
    } finally {
      // setLoading(false); // SUPPRIMER
    }
  }, [addToast]);

  // Mise à jour d'une étape de dossier
  const updateDossierStep = useCallback(async (id: string, updates: Partial<DossierStep>) => {
    // setLoading(true); // SUPPRIMER
    try {
      const res = await fetch(`${apiBase}/steps/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Erreur API mise à jour étape');
      const updatedStep = await res.json();
      setDossierSteps(prev => prev.map(step => step.id === id ? updatedStep : step));
      addToast({ type: 'success', title: 'Étape mise à jour', message: updatedStep.stepName, duration: 3000 });
      return updatedStep;
    } catch (error) {
      addToast({ type: 'error', title: 'Erreur', message: 'Erreur lors de la mise à jour d\'étape', duration: 4000 });
      console.error('Erreur mise à jour étape:', error);
      return null;
    } finally {
      // setLoading(false); // SUPPRIMER
    }
  }, [addToast]);

  // Suppression d'une étape de dossier
  const deleteDossierStep = useCallback(async (id: string) => {
    // setLoading(true); // SUPPRIMER
    try {
      const res = await fetch(`${apiBase}/steps/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur API suppression étape');
      setDossierSteps(prev => prev.filter(step => step.id !== id));
      addToast({ type: 'success', title: 'Étape supprimée', message: `ID: ${id}`, duration: 3000 });
    } catch (error) {
      addToast({ type: 'error', title: 'Erreur', message: 'Erreur lors de la suppression d\'étape', duration: 4000 });
      console.error('Erreur suppression étape:', error);
    } finally {
      // setLoading(false); // SUPPRIMER
    }
  }, [addToast]);

  // ===============================
  // FIN FONCTIONS OPÉRATIONNELLES
  // ===============================

  return {
    events,
    dossierSteps,
    // loading, // SUPPRIMER
    addEvent,
    updateEvent,
    deleteEvent,
    addDossierStep,
    updateDossierStep,
    deleteDossierStep,
    loadEvents,
    loadDossierSteps,
    syncWithGoogleCalendar, // exposé pour usage manuel
  };
};

const useCalendarView = () => {
  const [view, setView] = useState<CalendarView>({
    type: 'month',
    date: new Date()
  });

  const navigateToDate = useCallback((date: Date) => {
    setView(prev => ({ ...prev, date }));
  }, []);

  const navigateToToday = useCallback(() => {
    setView(prev => ({ ...prev, date: new Date() }));
  }, []);

  const navigateToPrevious = useCallback(() => {
    setView(prev => {
      const newDate = new Date(prev.date);
      switch (prev.type) {
        case 'month':
          newDate.setMonth(newDate.getMonth() - 1);
          break;
        case 'week':
          newDate.setDate(newDate.getDate() - 7);
          break;
        case 'day':
          newDate.setDate(newDate.getDate() - 1);
          break;
      }
      return { ...prev, date: newDate };
    });
  }, []);

  const navigateToNext = useCallback(() => {
    setView(prev => {
      const newDate = new Date(prev.date);
      switch (prev.type) {
        case 'month':
          newDate.setMonth(newDate.getMonth() + 1);
          break;
        case 'week':
          newDate.setDate(newDate.getDate() + 7);
          break;
        case 'day':
          newDate.setDate(newDate.getDate() + 1);
          break;
      }
      return { ...prev, date: newDate };
    });
  }, []);

  return {
    view,
    setView,
    navigateToDate,
    navigateToToday,
    navigateToPrevious,
    navigateToNext
  };
};

// ============================================================================
// COMPOSANTS UTILITAIRES
// ============================================================================

interface EventCardProps {
  event: CalendarEvent;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ event, onEdit, onDelete, compact = false }) => {
  const typeConfig = EVENT_TYPES[event.type];
  const IconComponent = typeConfig.icon;
  const priorityColor = PRIORITY_COLORS[event.priority];

  const formatTime = (date: Date) => format(date, 'HH:mm', { locale: fr });

  return (
    <div className={cn(
      "p-4 rounded-xl border-l-4 shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md hover:scale-[1.02]",
      compact ? "text-sm" : "text-base",
      event.status === 'cancelled' ? 'opacity-50 bg-gradient-to-r from-gray-50 to-gray-25' : 'bg-gradient-to-r from-white to-slate-25'
    )}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={cn("w-3 h-3 rounded-full", typeConfig.color)} />
          <h4 className={cn(
            "font-medium truncate",
            compact ? "text-sm" : "text-base"
          )}>
            {event.title}
          </h4>
        </div>
        <div className="flex items-center space-x-1">
          <Badge className={priorityColor} variant="outline">
            {event.priority}
          </Badge>
          {event.isOnline && (
            <Badge variant="outline" className="bg-purple-100 text-purple-800">
              <Video className="w-3 h-3 mr-1" />
              En ligne
            </Badge>
          )}
        </div>
      </div>

      {!compact && event.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
          {event.description}
        </p>
      )}

      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>{formatTime(event.startDate)} - {formatTime(event.endDate)}</span>
        </div>
        {event.location && (
          <div className="flex items-center space-x-1">
            <MapPin className="w-3 h-3" />
            <span>{event.location}</span>
          </div>
        )}
      </div>

      {event.dossierName && (
        <div className="flex items-center space-x-1 text-xs text-gray-500 mb-2">
          <FileText className="w-3 h-3" />
          <span>{event.dossierName}</span>
        </div>
      )}

      {event.participants.length > 0 && (
        <div className="flex items-center space-x-1 text-xs text-gray-500 mb-2">
          <Users className="w-3 h-3" />
          <span>{event.participants.length} participant(s)</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <IconComponent className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-500">{typeConfig.label}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(event);
            }}
            className="h-6 w-6 p-0"
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(event.id);
            }}
            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

interface StepCardProps {
  step: DossierStep;
  onEdit: (step: DossierStep) => void;
  onDelete: (id: string) => void;
}

const StepCard: React.FC<StepCardProps> = ({ step, onEdit, onDelete }) => {
  const priorityColor = PRIORITY_COLORS[step.priority];
  const isOverdue = step.status === 'overdue' || (step.dueDate < new Date() && step.status !== 'completed');

  return (
    <div className={cn(
      "p-4 rounded-xl border-l-4 shadow-sm transition-all duration-200 hover:shadow-md",
      isOverdue ? 'border-l-red-500 bg-gradient-to-r from-red-50 to-red-25' : 'bg-gradient-to-r from-white to-slate-25'
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-sm mb-1 text-slate-800">{step.stepName}</h4>
          <p className="text-xs text-slate-600">{step.dossierName}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={priorityColor} variant="outline">
            {step.priority}
          </Badge>
          <Badge variant={step.status === 'completed' ? 'default' : 'secondary'}>
            {step.status === 'completed' ? 'Terminé' : 
             step.status === 'in_progress' ? 'En cours' : 
             step.status === 'overdue' ? 'En retard' : 'En attente'}
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Échéance: {format(step.dueDate, 'dd/MM/yyyy', { locale: fr })}</span>
          <span>Durée estimée: {step.estimatedDuration} min</span>
        </div>

        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${step.progress}%` }}
          />
        </div>
        <div className="text-xs text-slate-600 text-center">
          {step.progress}% terminé
        </div>

        {step.assignee && (
          <div className="text-xs text-slate-600 flex items-center space-x-1">
            <User className="w-3 h-3" />
            <span>Assigné à: {step.assignee}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end space-x-1 mt-4">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEdit(step)}
          className="h-7 w-7 p-0 hover:bg-slate-100 transition-colors"
        >
          <Edit className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(step.id)}
          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// COMPOSANT CALENDRIER DE BASE
// ============================================================================

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
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

// ============================================================================
// COMPOSANT CALENDRIER AVANCÉ
// ============================================================================

interface AdvancedCalendarProps {
  className?: string;
}

const AdvancedCalendar: React.FC<AdvancedCalendarProps> = ({ className }) => {
  const { addToast } = useToast();
  const {
    primaryIntegration,
    syncing,
    syncCalendar,
    refreshIntegrations
  } = useGoogleCalendar();

  const {
    events,
    dossierSteps,
    addEvent,
    updateEvent,
    deleteEvent,
    addDossierStep,
    updateDossierStep,
    deleteDossierStep
  } = useCalendarEvents();

  const {
    view,
    setView,
    navigateToDate,
    navigateToToday,
    navigateToPrevious,
    navigateToNext
  } = useCalendarView();

  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showStepDialog, setShowStepDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedStep, setSelectedStep] = useState<DossierStep | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filter, setFilter] = useState<string>('all');

  // Événements pour la date sélectionnée
  const eventsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter(event => isSameDay(event.startDate, selectedDate));
  }, [events, selectedDate]);

  // Étapes pour la date sélectionnée
  const stepsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return dossierSteps.filter(step => isSameDay(step.dueDate, selectedDate));
  }, [dossierSteps, selectedDate]);

  // Événements filtrés
  const filteredEvents = useMemo(() => {
    if (filter === 'all') return events;
    return events.filter(event => event.category === filter);
  }, [events, filter]);

  const handleDateSelect = useCallback((date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setShowEventDialog(true);
    }
  }, []);

  const handleEventSubmit = useCallback((eventData: Omit<CalendarEvent, 'id'>) => {
    if (selectedEvent) {
      updateEvent(selectedEvent.id, eventData);
    } else {
      addEvent(eventData);
    }
    setShowEventDialog(false);
    setSelectedEvent(null);
  }, [selectedEvent, addEvent, updateEvent]);

  const handleStepSubmit = useCallback((stepData: Omit<DossierStep, 'id'>) => {
    if (selectedStep) {
      updateDossierStep(selectedStep.id, stepData);
    } else {
      addDossierStep(stepData);
    }
    setShowStepDialog(false);
    setSelectedStep(null);
  }, [selectedStep, addDossierStep, updateDossierStep]);

  const handleEditEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDialog(true);
  }, []);

  const handleEditStep = useCallback((step: DossierStep) => {
    setSelectedStep(step);
    setShowStepDialog(true);
  }, []);

  // Fonction de synchronisation Google Calendar réellement opérationnelle
  const handleSyncGoogleCalendar = async () => {
    if (!primaryIntegration) {
      addToast({ type: 'error', title: 'Erreur', message: 'Aucune intégration Google Calendar trouvée', duration: 4000 });
      return;
    }
    try {
      await syncCalendar(primaryIntegration.id, 'full');
      await refreshIntegrations();
    } catch (error) {
      addToast({ type: 'error', title: 'Erreur', message: 'Erreur lors de la synchronisation Google Calendar', duration: 4000 });
    }
  };

  return (
    <div className={cn("min-h-screen bg-gray-50", className)}>
      {/* BARRE DE NAVIGATION CALENDRIER - Design aéré et moderne */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Navigation gauche - Plus espacée */}
          <div className="flex items-center gap-6">
            <Button 
              onClick={navigateToToday} 
              variant="ghost" 
              className="text-blue-600 hover:bg-blue-50 font-medium px-4 py-2 text-sm"
            >
              Aujourd'hui
            </Button>
            
            {/* Navigation avec flèches - Design amélioré */}
            <div className="flex items-center bg-gray-50 rounded-lg p-1">
              <Button 
                onClick={navigateToPrevious} 
                variant="ghost" 
                size="sm" 
                className="h-9 w-9 p-0 hover:bg-white rounded-md transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </Button>
              <Button 
                onClick={navigateToNext} 
                variant="ghost" 
                size="sm" 
                className="h-9 w-9 p-0 hover:bg-white rounded-md transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </Button>
            </div>
            
            {/* Titre du mois - Plus proéminent */}
            <h2 className="text-2xl font-bold text-gray-900">
              {format(view.date, 'MMMM yyyy', { locale: fr })}
            </h2>
          </div>

          {/* Contrôles droite - Mieux organisés */}
          <div className="flex items-center gap-4">
            {/* Bouton de synchronisation Google Calendar */}
            <Button onClick={handleSyncGoogleCalendar} variant="outline" disabled={syncing || !primaryIntegration}>
              <CalendarIcon className="w-4 h-4 mr-2" />
              {syncing ? 'Synchronisation...' : 'Synchroniser Google Calendar'}
            </Button>
            {/* Sélecteur de vue */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Vue :</span>
              <Select value={view.type} onValueChange={(v) => setView(prev => ({ ...prev, type: v as any }))}>
                <SelectTrigger className="w-28 bg-white border-gray-200 hover:border-gray-300 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Mois</SelectItem>
                  <SelectItem value="week">Semaine</SelectItem>
                  <SelectItem value="day">Jour</SelectItem>
                  <SelectItem value="agenda">Agenda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Filtre des événements */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Filtre :</span>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-36 bg-white border-gray-200 hover:border-gray-300 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les événements</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="collaborative">Collaboratif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bouton Nouvel événement - Plus proéminent */}
            <Button 
              onClick={() => setShowEventDialog(true)} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvel événement
            </Button>
          </div>
        </div>
      </div>

      {/* GRILLE CALENDRIER - Pleine largeur */}
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Sélecteur de vue en haut de la grille */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
              <Button
                variant={view.type === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView(prev => ({ ...prev, type: 'month' }))}
                className={cn(
                  "text-sm font-medium",
                  view.type === 'month' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                )}
              >
                Mois
              </Button>
              <Button
                variant={view.type === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView(prev => ({ ...prev, type: 'week' }))}
                className={cn(
                  "text-sm font-medium",
                  view.type === 'week' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                )}
              >
                Semaine
              </Button>
              <Button
                variant={view.type === 'day' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView(prev => ({ ...prev, type: 'day' }))}
                className={cn(
                  "text-sm font-medium",
                  view.type === 'day' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                )}
              >
                Jour
              </Button>
            </div>
          </div>

          {/* Contenu de la grille selon la vue */}
          <div className="p-8">
            {view.type === 'month' && (
              <div className="space-y-6">
                <Calendar
                  mode="single"
                  selected={selectedDate || undefined}
                  onSelect={handleDateSelect}
                  month={view.date}
                  onMonthChange={navigateToDate}
                  className="w-full"
                />
                
                {/* Événements de la date sélectionnée */}
                {selectedDate && (
                  <div className="mt-8 p-6 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-900 mb-4 text-lg">
                      Événements du {format(selectedDate, 'dd/MM/yyyy', { locale: fr })}
                    </h3>
                    <div className="space-y-4">
                      {eventsForSelectedDate.length === 0 && stepsForSelectedDate.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                          Aucun événement prévu pour cette date
                        </p>
                      ) : (
                        <>
                          {eventsForSelectedDate.map(event => (
                            <EventCard
                              key={event.id}
                              event={event}
                              onEdit={handleEditEvent}
                              onDelete={deleteEvent}
                              compact
                            />
                          ))}
                          {stepsForSelectedDate.map(step => (
                            <StepCard
                              key={step.id}
                              step={step}
                              onEdit={handleEditStep}
                              onDelete={deleteDossierStep}
                            />
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {view.type === 'agenda' && (
              <div className="flex gap-6">
                {/* Colonne principale avec agenda */}
                <div className="flex-1 space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Agenda</h3>
                  <div className="space-y-4">
                    {filteredEvents.length === 0 ? (
                      <p className="text-gray-500 text-center py-12">
                        Aucun événement prévu
                      </p>
                    ) : (
                      filteredEvents
                        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
                        .map(event => (
                          <EventCard
                            key={event.id}
                            event={event}
                            onEdit={handleEditEvent}
                            onDelete={deleteEvent}
                          />
                        ))
                    )}
                  </div>
                </div>

                {/* Section "À venir" sur la droite - style Google Calendar */}
                <div className="w-80 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">À venir</h3>
                  <div className="space-y-2">
                    {filteredEvents
                      .filter(event => event.startDate >= new Date())
                      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
                      .slice(0, 5)
                      .map(event => (
                        <div key={event.id} className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="flex items-start space-x-2">
                            <div className={cn("w-2 h-2 rounded-full mt-2 flex-shrink-0", EVENT_TYPES[event.type].color)} />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 text-sm truncate">{event.title}</h4>
                              <p className="text-xs text-gray-600 mt-1">
                                {format(event.startDate, 'EEEE dd MMM', { locale: fr })}
                              </p>
                              <p className="text-xs text-gray-500">
                                {format(event.startDate, 'HH:mm', { locale: fr })} - {format(event.endDate, 'HH:mm', { locale: fr })}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <Badge variant="outline" className={cn("text-xs", PRIORITY_COLORS[event.priority])}>
                                  {event.priority}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditEvent(event)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    {filteredEvents.filter(event => event.startDate >= new Date()).length === 0 && (
                      <div className="p-4 bg-white rounded-lg border border-gray-200 text-center">
                        <p className="text-gray-500 text-sm">
                          Aucun événement à venir
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Placeholder pour les vues semaine et jour */}
            {(view.type === 'week' || view.type === 'day') && (
              <div className="text-center py-16">
                <p className="text-gray-500 mb-6 text-lg">Vue {view.type === 'week' ? 'semaine' : 'jour'} en cours de développement</p>
                <Button 
                  onClick={() => setView(prev => ({ ...prev, type: 'month' }))}
                  variant="outline"
                  className="px-6 py-2"
                >
                  Retour à la vue mois
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog Événement */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent ? 'Modifier l\'événement' : 'Nouvel événement'}
            </DialogTitle>
            <DialogDescription>
              Créez ou modifiez un événement dans votre calendrier
            </DialogDescription>
          </DialogHeader>
          
          <EventForm
            event={selectedEvent}
            onSubmit={handleEventSubmit}
            onCancel={() => {
              setShowEventDialog(false);
              setSelectedEvent(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Étape de dossier */}
      <Dialog open={showStepDialog} onOpenChange={setShowStepDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedStep ? 'Modifier l\'étape' : 'Nouvelle étape de dossier'}
            </DialogTitle>
            <DialogDescription>
              Créez ou modifiez une étape de dossier avec échéance
            </DialogDescription>
          </DialogHeader>
          
          <StepForm
            step={selectedStep}
            onSubmit={handleStepSubmit}
            onCancel={() => {
              setShowStepDialog(false);
              setSelectedStep(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============================================================================
// FORMULAIRES
// ============================================================================

interface EventFormProps {
  event?: CalendarEvent | null;
  onSubmit: (event: Omit<CalendarEvent, 'id'>) => void;
  onCancel: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ event, onSubmit, onCancel }) => {
  const { user } = useAuth(); // Récupérer l'utilisateur actuel
  
  // Calculer la date de fin par défaut (1 heure après la date de début)
  const getDefaultEndDate = (startDate: Date) => {
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);
    return endDate;
  };
  
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    startDate: event?.startDate ? new Date(event.startDate) : new Date(),
    endDate: event?.endDate ? new Date(event.endDate) : new Date(),
    type: event?.type || 'appointment',
    priority: event?.priority || 'medium',
    category: event?.category || 'client',
    dossierId: event?.dossierId || '',
    dossierName: event?.dossierName || '',
    expertId: event?.metadata?.expertId || '',
    expertName: event?.metadata?.expertName || '',
    participants: event?.participants || [],
    location: event?.location || '',
    isOnline: event?.isOnline || false,
    meetingUrl: event?.meetingUrl || '',
    phoneNumber: event?.phoneNumber || '',
    color: event?.color || '#3B82F6'
  });

  // Charger les experts et dossiers au montage
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      // (chargement désactivé, tout est commenté)
    };
    loadData();
  }, [user?.id]);

  // Mettre à jour automatiquement la date de fin quand la date de début change
  useEffect(() => {
    if (formData.startDate >= formData.endDate) {
      setFormData(prev => ({
        ...prev,
        endDate: getDefaultEndDate(prev.startDate)
      }));
    }
  }, [formData.startDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      status: event?.status || 'pending',
      reminders: event?.reminders || [],
      metadata: {
        ...event?.metadata,
        expertId: formData.expertId,
        expertName: formData.expertName
      }
    });
  };

  return (
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
          <Select value={formData.type} onValueChange={(value: string) => setFormData(prev => ({ ...prev, type: value as any }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(EVENT_TYPES).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
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
          placeholder="Décrivez les détails de cet événement..."
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Date de début</Label>
          <Input
            id="startDate"
            type="datetime-local"
            value={format(formData.startDate, "yyyy-MM-dd'T'HH:mm")}
            onChange={(e) => setFormData(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="endDate">Date de fin</Label>
          <Input
            id="endDate"
            type="datetime-local"
            value={format(formData.endDate, "yyyy-MM-dd'T'HH:mm")}
            onChange={(e) => setFormData(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priority">Priorité</Label>
          <Select value={formData.priority} onValueChange={(value: string) => setFormData(prev => ({ ...prev, priority: value as any }))}>
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
          <Select value={formData.category} onValueChange={(value: string) => setFormData(prev => ({ ...prev, category: value as any }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="collaborative">Collaboratif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sélection d'expert */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="expert">Expert (optionnel)</Label>
          <Select 
            value={formData.expertId} 
            onValueChange={(v: string) => {
              // TODO: Associer l'expert sélectionné à l'événement
              setFormData(prev => ({ 
                ...prev, 
                expertId: v,
                expertName: '' // Placeholder, actual expert name will be fetched
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={"Sélectionner un expert"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun expert</SelectItem>
              {/* {experts.map(expert => ( // Supprimé */}
              {/*   <SelectItem key={expert.id} value={expert.id}> // Supprimé */}
              {/*     <div className="flex items-center gap-2"> // Supprimé */}
              {/*       <User className="w-4 h-4" /> // Supprimé */}
              {/*       <span>{expert.name}</span> // Supprimé */}
              {/*       <span className="text-xs text-gray-500">({expert.specializations.join(', ')})</span> // Supprimé */}
              {/*     </div> // Supprimé */}
              {/*   </SelectItem> // Supprimé */}
              {/* ))} // Supprimé */}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="dossier">Dossier (optionnel)</Label>
          <Select 
            value={formData.dossierId} 
            onValueChange={(v: string) => {
              // TODO: Associer le dossier sélectionné à l'événement
              setFormData(prev => ({ 
                ...prev, 
                dossierId: v,
                dossierName: '' // Placeholder, actual dossier name will be fetched
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={"Sélectionner un dossier"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun dossier</SelectItem>
              {/* {dossiers.map(dossier => ( // Supprimé */}
              {/*   <SelectItem key={dossier.id} value={dossier.id}> // Supprimé */}
              {/*     <div className="flex items-center gap-2"> // Supprimé */}
              {/*       <Briefcase className="w-4 h-4" /> // Supprimé */}
              {/*       <span>{dossier.product_type}</span> // Supprimé */}
              {/*       <span className="text-xs text-gray-500">({dossier.status})</span> // Supprimé */}
              {/*     </div> // Supprimé */}
              {/*   </SelectItem> // Supprimé */}
              {/* ))} // Supprimé */}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="location">Lieu</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="Adresse ou lieu de rendez-vous"
          />
        </div>
        <div>
          <Label htmlFor="phoneNumber">Téléphone</Label>
          <Input
            id="phoneNumber"
            value={formData.phoneNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
            placeholder="Numéro de téléphone"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isOnline"
          checked={formData.isOnline}
          onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, isOnline: checked }))}
        />
        <Label htmlFor="isOnline">Rendez-vous en ligne</Label>
      </div>

      {formData.isOnline && (
        <div>
          <Label htmlFor="meetingUrl">URL de réunion</Label>
          <Input
            id="meetingUrl"
            value={formData.meetingUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, meetingUrl: e.target.value }))}
            placeholder="https://meet.google.com/..."
          />
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          {event ? 'Modifier' : 'Créer'}
        </Button>
      </DialogFooter>
    </form>
  );
};

interface StepFormProps {
  step?: DossierStep | null;
  onSubmit: (step: Omit<DossierStep, 'id'>) => void;
  onCancel: () => void;
}

const StepForm: React.FC<StepFormProps> = ({ step, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    dossierId: step?.dossierId || '',
    dossierName: step?.dossierName || '',
    stepName: step?.stepName || '',
    stepType: step?.stepType || 'validation' as DossierStep['stepType'],
    dueDate: step?.dueDate || new Date(),
    priority: step?.priority || 'medium' as DossierStep['priority'],
    assignee: step?.assignee || '',
    estimatedDuration: step?.estimatedDuration || 60,
    progress: step?.progress || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      status: step?.status || 'pending'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dossierName">Nom du dossier</Label>
          <Input
            id="dossierName"
            value={formData.dossierName}
            onChange={(e) => setFormData(prev => ({ ...prev, dossierName: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="stepName">Nom de l'étape</Label>
          <Input
            id="stepName"
            value={formData.stepName}
            onChange={(e) => setFormData(prev => ({ ...prev, stepName: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="stepType">Type d'étape</Label>
          <Select value={formData.stepType} onValueChange={(value: string) => setFormData(prev => ({ ...prev, stepType: value as any }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="validation">Validation</SelectItem>
              <SelectItem value="documentation">Documentation</SelectItem>
              <SelectItem value="expertise">Expertise</SelectItem>
              <SelectItem value="approval">Approbation</SelectItem>
              <SelectItem value="payment">Paiement</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="dueDate">Date d'échéance</Label>
          <Input
            id="dueDate"
            type="datetime-local"
            value={format(formData.dueDate, "yyyy-MM-dd'T'HH:mm")}
            onChange={(e) => setFormData(prev => ({ ...prev, dueDate: new Date(e.target.value) }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priority">Priorité</Label>
          <Select value={formData.priority} onValueChange={(value: string) => setFormData(prev => ({ ...prev, priority: value as any }))}>
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
          <Label htmlFor="estimatedDuration">Durée estimée (minutes)</Label>
          <Input
            id="estimatedDuration"
            type="number"
            value={formData.estimatedDuration}
            onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) }))}
            min="1"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="assignee">Assigné à</Label>
        <Input
          id="assignee"
          value={formData.assignee}
          onChange={(e) => setFormData(prev => ({ ...prev, assignee: e.target.value }))}
          placeholder="Nom de la personne responsable"
        />
      </div>

      <div>
        <Label htmlFor="progress">Progression (%)</Label>
        <Input
          id="progress"
          type="number"
          value={formData.progress}
          onChange={(e) => setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
          min="0"
          max="100"
          required
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          {step ? 'Modifier' : 'Créer'}
        </Button>
      </DialogFooter>
    </form>
  );
};

export { Calendar, AdvancedCalendar };
