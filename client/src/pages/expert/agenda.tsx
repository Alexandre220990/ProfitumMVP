import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast-notifications";
import { get } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Phone, 
  Plus, 
  Edit, 
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import HeaderExpert from "@/components/HeaderExpert";
import type { AgendaEvent } from "@/types/agenda";

const ExpertAgenda = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAgendaData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Charger les événements de l'agenda
      const response = await get<AgendaEvent[]>(`/api/expert/agenda`);
      if (response.success && response.data) {
        setEvents(response.data);
      }

      addToast({
        type: 'success',
        title: 'Agenda chargé',
        message: 'Vos événements ont été récupérés avec succès',
        duration: 3000
      });

    } catch (error) {
      console.error('Erreur chargement agenda:', error);
      setError('Erreur lors de la récupération de l\'agenda');
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la récupération de l\'agenda',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  }, [user, addToast]);

  useEffect(() => {
    fetchAgendaData();
  }, [fetchAgendaData]);

  // Filtrer les événements
  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || event.type === filterType;
    const matchesDate = new Date(event.date).toDateString() === selectedDate.toDateString();
    return matchesSearch && matchesType && matchesDate;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

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

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">Élevée</Badge>;
      case 'normal':
        return <Badge className="bg-blue-100 text-blue-800">Normale</Badge>;
      case 'low':
        return <Badge className="bg-gray-100 text-gray-800">Faible</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Programmé</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Terminé</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Annulé</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  const handleEventAction = (eventId: string, action: string) => {
    console.log(`Action ${action} sur l'événement ${eventId}`);
    // Logique pour gérer les actions sur les événements
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <CardTitle className="text-xl mb-2">Chargement de votre agenda...</CardTitle>
            <p className="text-gray-600">Nous récupérons vos événements et rendez-vous</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Authentification requise</CardTitle>
            <p className="text-gray-600">Vous devez être connecté pour accéder à cette page.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => navigate("/connexion-expert")} className="w-full">
              Se connecter
            </Button>
            <Button variant="secondary" onClick={() => navigate("/")} className="w-full">
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <HeaderExpert />
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="mt-16"></div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-red-600">Problème de chargement de l'agenda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 text-red-600 mb-4">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
              <Button onClick={() => window.location.reload()}>
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <HeaderExpert />
      
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mt-16"></div>
        
        {/* En-tête de la page */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Agenda
          </h1>
          <p className="text-gray-600">
            Gérez vos rendez-vous, appels et échéances
          </p>
        </div>

        {/* Contrôles de navigation */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {/* Navigation par date */}
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDateChange('prev')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {formatDate(selectedDate.toISOString())}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {filteredEvents.length} événement(s)
                  </p>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDateChange('next')}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => navigate("/expert/agenda/new")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvel événement
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filtres et recherche */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Rechercher un événement ou client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Type d'événement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="meeting">Rendez-vous</SelectItem>
                  <SelectItem value="call">Appels</SelectItem>
                  <SelectItem value="deadline">Échéances</SelectItem>
                  <SelectItem value="task">Tâches</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  Liste
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                >
                  Calendrier
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des événements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Événements du {formatDate(selectedDate.toISOString())}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredEvents.length > 0 ? (
              <div className="space-y-4">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Icône du type d'événement */}
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          {getEventTypeIcon(event.type)}
                        </div>
                        
                        {/* Informations de l'événement */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{event.title}</h3>
                            {getPriorityBadge(event.priority)}
                            {getStatusBadge(event.status)}
                          </div>
                          
                          <p className="text-gray-600 mb-2">{event.description}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatTime(event.time)} ({event.duration} min)
                            </div>
                            
                            {event.clientName && (
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {event.clientName}
                              </div>
                            )}
                            
                            {event.location && (
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {event.location}
                              </div>
                            )}
                          </div>
                          
                          {event.notes && (
                            <p className="text-sm text-gray-500 mt-2 italic">
                              Note: {event.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        {event.status === 'scheduled' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEventAction(event.id, 'complete')}
                            >
                              Terminer
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEventAction(event.id, 'edit')}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEventAction(event.id, 'delete')}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun événement pour cette date
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || filterType !== 'all' 
                    ? 'Aucun événement ne correspond à vos critères de recherche'
                    : 'Vous n\'avez aucun événement programmé pour cette date'
                  }
                </p>
                <Button
                  onClick={() => navigate("/expert/agenda/new")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un événement
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExpertAgenda; 