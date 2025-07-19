import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Clock, Users, MapPin, Video, AlertTriangle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarEvent, DossierStep } from '@/services/calendar-service';

interface UpcomingEventsProps {
  events: CalendarEvent[];
  dossierSteps: DossierStep[];
  onEventClick?: (event: CalendarEvent) => void;
  onStepClick?: (step: DossierStep) => void;
  className?: string;
}

const EVENT_TYPE_ICONS = {
  appointment: Calendar,
  deadline: AlertTriangle,
  meeting: Users,
  task: FileText,
  reminder: Clock
} as const;

const PRIORITY_COLORS = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-blue-100 text-blue-800'
} as const;

const STEP_TYPE_COLORS = {
  validation: 'bg-purple-100 text-purple-800',
  documentation: 'bg-blue-100 text-blue-800',
  expertise: 'bg-green-100 text-green-800',
  approval: 'bg-orange-100 text-orange-800',
  payment: 'bg-red-100 text-red-800'
} as const;

type CalendarItem = 
  | { itemType: 'event'; data: CalendarEvent }
  | { itemType: 'step'; data: DossierStep };

export const UpcomingEvents: React.FC<UpcomingEventsProps> = ({
  events,
  dossierSteps,
  onEventClick,
  onStepClick,
  className = ''
}) => {
  // Combiner et trier les événements et étapes
  const allItems: CalendarItem[] = [
    ...events.map(event => ({
      itemType: 'event' as const,
      data: event
    })),
    ...dossierSteps.map(step => ({
      itemType: 'step' as const,
      data: step
    }))
  ].sort((a, b) => {
    const dateA = new Date(a.itemType === 'event' ? a.data.start_date : a.data.due_date);
    const dateB = new Date(b.itemType === 'event' ? b.data.start_date : b.data.due_date);
    return dateA.getTime() - dateB.getTime();
  });

  // Grouper par date
  const groupedItems = allItems.reduce((groups, item) => {
    const dateKey = format(
      new Date(item.itemType === 'event' ? item.data.start_date : item.data.due_date), 
      'yyyy-MM-dd'
    );
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
    return groups;
  }, {} as Record<string, CalendarItem[]>);

  const formatTime = (date: string) => format(new Date(date), 'HH:mm', { locale: fr });
  const formatDate = (date: string) => format(new Date(date), 'EEEE d MMMM', { locale: fr });

  const isToday = (date: string) => {
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  };

  const isOverdue = (date: string) => {
    return new Date(date) < new Date();
  };

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="w-5 h-5 text-blue-600" />
          Événements à venir
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[600px] overflow-y-auto">
          {Object.keys(groupedItems).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun événement prévu</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedItems).map(([dateKey, items]) => (
                <div key={dateKey} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                  {/* En-tête de date */}
                  <div className={`px-4 py-2 mb-3 rounded-lg ${
                    isToday(dateKey) 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <h3 className={`font-medium ${
                        isToday(dateKey) ? 'text-blue-700' : 'text-gray-700'
                      }`}>
                        {isToday(dateKey) ? 'Aujourd\'hui' : formatDate(dateKey)}
                      </h3>
                      {isToday(dateKey) && (
                        <Badge variant="default" className="bg-blue-600">
                          {items.length} événement{items.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Événements du jour */}
                  <div className="space-y-2 px-4">
                    {items.map((item) => {
                      if (item.itemType === 'event') {
                        const event = item.data;
                        const IconComponent = EVENT_TYPE_ICONS[event.type];
                        const isOverdueEvent = isOverdue(event.start_date);

                        return (
                          <div
                            key={event.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                              isOverdueEvent ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
                            }`}
                            onClick={() => onEventClick?.(event)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <IconComponent className="w-4 h-4 text-gray-600" />
                                <h4 className="font-medium text-sm truncate flex-1">
                                  {event.title}
                                </h4>
                              </div>
                              <div className="flex items-center gap-1">
                                <Badge className={PRIORITY_COLORS[event.priority]} variant="outline">
                                  {event.priority}
                                </Badge>
                                {event.is_online && (
                                  <Badge variant="outline" className="bg-purple-100 text-purple-800">
                                    <Video className="w-3 h-3 mr-1" />
                                    En ligne
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatTime(event.start_date)}</span>
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span className="truncate">{event.location}</span>
                                </div>
                              )}
                            </div>

                            {event.dossier_name && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <FileText className="w-3 h-3" />
                                <span className="truncate">{event.dossier_name}</span>
                              </div>
                            )}
                          </div>
                        );
                      } else {
                        const step = item.data;
                        const isOverdueStep = isOverdue(step.due_date);

                        return (
                          <div
                            key={step.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                              isOverdueStep ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
                            }`}
                            onClick={() => onStepClick?.(step)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-600" />
                                <h4 className="font-medium text-sm truncate flex-1">
                                  {step.step_name}
                                </h4>
                              </div>
                              <div className="flex items-center gap-1">
                                <Badge className={STEP_TYPE_COLORS[step.step_type]} variant="outline">
                                  {step.step_type}
                                </Badge>
                                <Badge className={PRIORITY_COLORS[step.priority]} variant="outline">
                                  {step.priority}
                                </Badge>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatTime(step.due_date)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                <span className="truncate">{step.dossier_name}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Progression: {step.progress}%</span>
                              <span>Durée estimée: {step.estimated_duration}h</span>
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 