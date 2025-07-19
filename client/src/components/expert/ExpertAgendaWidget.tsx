import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Users, 
  Plus,
  ChevronRight,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import type { AgendaEvent } from "@/types/agenda";

interface ExpertAgendaWidgetProps {
  events: AgendaEvent[];
  className?: string;
}

export const ExpertAgendaWidget = ({ events, className = "" }: ExpertAgendaWidgetProps) => {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  // Filtrer les événements à venir
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter(event => new Date(event.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, showAll ? undefined : 5);
  }, [events, showAll]);

  // Événements du jour
  const todayEvents = useMemo(() => {
    const today = new Date().toDateString();
    return events.filter(event => 
      new Date(event.date).toDateString() === today
    );
  }, [events]);

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <Users className="h-4 w-4" />;
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'deadline':
        return <AlertCircle className="h-4 w-4" />;
      case 'task':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'Rendez-vous';
      case 'call':
        return 'Appel';
      case 'deadline':
        return 'Échéance';
      case 'task':
        return 'Tâche';
      default:
        return 'Événement';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Demain";
    } else {
      return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
    }
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  const handleViewEvent = (eventId: string) => {
    navigate(`/expert/agenda/event/${eventId}`);
  };

  const handleAddEvent = () => {
    navigate('/expert/agenda/new');
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Agenda
          </CardTitle>
          <div className="flex items-center space-x-2">
            {todayEvents.length > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {todayEvents.length} aujourd'hui
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddEvent}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Aucun événement à venir</p>
            <Button onClick={handleAddEvent} variant="outline">
              Planifier un événement
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleViewEvent(event.id)}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      {getEventTypeIcon(event.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {event.title}
                      </h4>
                      <Badge className={getPriorityColor(event.priority)}>
                        {event.priority}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(event.time)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                      {event.clientName && (
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span className="truncate">{event.clientName}</span>
                        </div>
                      )}
                    </div>
                    
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            ))}
            
            {events.length > 5 && (
              <div className="text-center pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? 'Voir moins' : `Voir tous les événements (${events.length})`}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 