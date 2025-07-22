import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { useCalendarEvents } from '@/hooks/use-calendar-events';
import { 
  Calendar, 
  Plus, 
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
  RefreshCw,
  DollarSign,
  Star,
  CheckCircle,
  AlertCircle,
  UserCheck,
  MessageSquare,
  FileText,
  BarChart3,
  Target,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

interface ExpertStats {
  total_events: number;
  completed_events: number;
  pending_events: number;
  total_revenue: number;
  average_rating: number;
  total_clients: number;
  completion_rate: number;
  average_duration: number;
}

// ============================================================================
// COMPOSANTS INTERNES
// ============================================================================

const ExpertDashboard = ({ stats }: { stats: ExpertStats }) => {
  return (
    <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold">{stats.total_events}</div>
            <div className="text-green-100">Total événements</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{stats.completed_events}</div>
            <div className="text-green-100">Terminés</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{stats.total_revenue}€</div>
            <div className="text-green-100">Revenus</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{stats.average_rating}/5</div>
            <div className="text-green-100">Note moyenne</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExpertCalendarHeader = ({ 
  currentDate, 
  onDateChange, 
  view,
  stats
}: {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  view: any;
  stats: ExpertStats;
}) => {
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
  };

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    onDateChange(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
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
              className="text-green-600 border-green-200 hover:bg-green-50"
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

          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle consultation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle consultation</DialogTitle>
              </DialogHeader>
              <CreateExpertEventForm currentDate={currentDate} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

const ExpertEventCard = ({ event }: { event: any }) => {
  const getEventIcon = () => {
    switch (event.type) {
      case 'consultation':
        return <Users className="w-4 h-4" />;
      case 'audit':
        return <FileText className="w-4 h-4" />;
      case 'meeting':
        return <MessageSquare className="w-4 h-4" />;
      case 'presentation':
        return <BarChart3 className="w-4 h-4" />;
      case 'follow_up':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getStatusColor = () => {
    switch (event.status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
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
              <Badge className={getStatusColor()}>
                {event.status}
              </Badge>
              {event.revenue && (
                <Badge className="bg-green-100 text-green-800">
                  <DollarSign className="w-3 h-3 mr-1" />
                  {event.revenue}€
                </Badge>
              )}
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

            {event.client && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {event.client.name} - {event.client.company}
                  </span>
                </div>
              </div>
            )}
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

const CreateExpertEventForm = ({ currentDate }: { currentDate: Date }) => {
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
    type: 'consultation' as const,
    priority: 'medium' as const,
    revenue: '',
    preparation_time: '30'
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
        category: 'expert',
        revenue: formData.revenue ? parseInt(formData.revenue) : undefined,
        metadata: {
          preparation_time: parseInt(formData.preparation_time),
          meeting_url: formData.meeting_url
        }
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
          type: 'consultation',
          priority: 'medium',
          revenue: '',
          preparation_time: '30'
        });
      }
    } catch (error) {
      console.error('❌ Erreur création consultation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titre de la consultation *
          </label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ex: Audit TICPE - Entreprise ABC"
            required
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de consultation
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
              <SelectItem value="consultation">Consultation</SelectItem>
              <SelectItem value="audit">Audit</SelectItem>
              <SelectItem value="meeting">Réunion</SelectItem>
              <SelectItem value="presentation">Présentation</SelectItem>
              <SelectItem value="follow_up">Suivi</SelectItem>
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
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          rows={3}
          placeholder="Détails de la consultation..."
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
            placeholder="Lieu de la consultation"
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Revenus (€)
          </label>
          <Input
            type="number"
            value={formData.revenue}
            onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
            placeholder="500"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
            Consultation en ligne
          </label>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Temps de préparation (min)
          </label>
          <Input
            type="number"
            value={formData.preparation_time}
            onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
            placeholder="30"
            disabled={isSubmitting}
          />
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
        <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
          {isSubmitting ? 'Création...' : 'Créer la consultation'}
        </Button>
      </div>
    </form>
  );
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function AgendaExpertPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view] = useState({ type: 'week', label: 'Semaine', icon: Calendar });

  // Utiliser le hook de calendrier
  const { events, loading, error, refresh } = useCalendarEvents({
    autoLoad: true,
    filters: {
      start_date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString(),
      end_date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString()
    }
  });

  // Stats de démonstration
  const expertStats: ExpertStats = useMemo(() => ({
    total_events: events.length,
    completed_events: events.filter(e => e.status === 'completed').length,
    pending_events: events.filter(e => e.status === 'pending').length,
    total_revenue: events.reduce((sum, e) => sum + (e.revenue || 0), 0),
    average_rating: 4.8,
    total_clients: new Set(events.map(e => e.client_id).filter(Boolean)).size,
    completion_rate: events.length > 0 ? Math.round((events.filter(e => e.status === 'completed').length / events.length) * 100) : 0,
    average_duration: 90
  }), [events]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => event.category === 'expert');
  }, [events]);

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Expert */}
      <ExpertDashboard stats={expertStats} />
      
      {/* Header */}
      <ExpertCalendarHeader
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        view={view}
        stats={expertStats}
      />
      
      {/* Contenu principal */}
      <div className="p-6">
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar">Calendrier</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
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
                      Consultations à venir
                    </h2>
                    
                    {filteredEvents.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Aucune consultation trouvée
                        </h3>
                        <p className="text-gray-500 mb-4">
                          Planifiez votre première consultation
                        </p>
                        <Button className="bg-green-600 hover:bg-green-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Nouvelle consultation
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {filteredEvents.map((event) => (
                          <ExpertEventCard key={event.id} event={event} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="clients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des clients</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Interface de gestion des clients à venir...</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics et performances</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Tableaux de bord analytics à venir...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 