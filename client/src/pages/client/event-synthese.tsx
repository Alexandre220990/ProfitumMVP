import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingScreen from '@/components/LoadingScreen';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  User,
  Mail,
  FileText,
  RefreshCw,
  Users,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { get } from '@/lib/api';
import { toast } from 'sonner';

interface EventData {
  id: string;
  title: string;
  description?: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes?: number;
  location?: string;
  meeting_type?: string;
  meeting_url?: string;
  status: string;
  priority?: string;
  type?: string;
  category?: string;
  created_at: string;
  updated_at: string;
  expert_id?: string;
  Expert?: {
    id: string;
    first_name?: string;
    last_name?: string;
    name: string;
    company_name?: string;
    email: string;
    cabinet_id?: string;
    Cabinet?: {
      id: string;
      name: string;
      siret?: string;
    };
  };
  RDV_Produits?: Array<{
    produit_id: string;
    ProduitEligible?: {
      id: string;
      nom: string;
      description?: string;
      categorie?: string;
    };
  }>;
  RDV_Participants?: Array<{
    user_id: string;
    user_type: string;
    status: string;
    name?: string;
    email?: string;
    company_name?: string;
  }>;
}

interface EventSyntheseResponse {
  event: EventData;
}

const ClientEventSynthese: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventData | null>(null);

  useEffect(() => {
    if (id) {
      loadEventData();
    }
  }, [id]);

  const loadEventData = async () => {
    setLoading(true);
    try {
      const response = await get<EventSyntheseResponse>(`/client/events/${id}/synthese`);
      if (response.success && response.data) {
        setEvent(response.data.event);
      } else {
        toast.error('Événement non trouvé');
        navigate('/agenda-client');
        return;
      }
    } catch (error) {
      console.error('Erreur chargement événement:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.type !== 'client') {
    return <Navigate to="/connect-client" replace />;
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      'pending': { label: 'À venir', className: 'bg-blue-100 text-blue-800' },
      'confirmed': { label: 'Confirmé', className: 'bg-green-100 text-green-800' },
      'in_progress': { label: 'En cours', className: 'bg-orange-100 text-orange-800' },
      'completed': { label: 'Terminé', className: 'bg-emerald-100 text-emerald-800' },
      'cancelled': { label: 'Annulé', className: 'bg-red-100 text-red-800' },
      'no_show': { label: 'Absent', className: 'bg-gray-100 text-gray-800' }
    };
    
    const badge = badges[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  const formatDateTime = (date: string, time: string) => {
    const dateTime = new Date(`${date}T${time}`);
    return dateTime.toLocaleString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  const getExpertDisplayName = () => {
    if (!event?.Expert) return null;
    return `${event.Expert.first_name || ''} ${event.Expert.last_name || ''}`.trim() || 
           event.Expert.name ||
           event.Expert.email;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="mr-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <h1 className="text-2xl font-semibold text-gray-700">
                Synthèse Événement
              </h1>
            </div>
            {!loading && event && (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">{event.title}</h2>
                {event.status && getStatusBadge(event.status)}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadEventData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingScreen />
      ) : !event ? (
        <div className="text-center py-20">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Événement non trouvé</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPIs Rapides */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Date & Heure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {formatDateTime(event.scheduled_date, event.scheduled_time)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Durée
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-gray-900">
                    {formatDuration(event.duration_minutes)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  {event.meeting_type === 'video' ? (
                    <Video className="w-4 h-4" />
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}
                  Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {event.meeting_type === 'video' ? 'Vidéoconférence' : 'Présentiel'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Participants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-gray-900">
                    {event.RDV_Participants?.length || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Onglets */}
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-3xl">
              <TabsTrigger value="details">Détails</TabsTrigger>
              <TabsTrigger value="participants">Participants</TabsTrigger>
              <TabsTrigger value="produits">Produits</TabsTrigger>
            </TabsList>

            {/* Onglet Détails */}
            <TabsContent value="details" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Informations de l'Événement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Titre</span>
                      <p className="font-medium text-gray-900 mt-1">{event.title}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Statut</span>
                      <p className="font-medium mt-1">{getStatusBadge(event.status)}</p>
                    </div>
                    {event.description && (
                      <div className="col-span-2">
                        <span className="text-gray-600">Description</span>
                        <p className="font-medium text-gray-900 mt-1 whitespace-pre-wrap">{event.description}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Date & Heure</span>
                      <p className="font-medium text-gray-900 mt-1">
                        {formatDateTime(event.scheduled_date, event.scheduled_time)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Durée</span>
                      <p className="font-medium text-gray-900 mt-1">{formatDuration(event.duration_minutes)}</p>
                    </div>
                    {event.location && (
                      <div>
                        <span className="text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Lieu
                        </span>
                        <p className="font-medium text-gray-900 mt-1">{event.location}</p>
                      </div>
                    )}
                    {event.meeting_url && (
                      <div>
                        <span className="text-gray-600 flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          Lien de réunion
                        </span>
                        <a 
                          href={event.meeting_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline mt-1 block"
                        >
                          {event.meeting_url}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Participants */}
            <TabsContent value="participants" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    Participants ({event.RDV_Participants?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {event.RDV_Participants && event.RDV_Participants.length > 0 ? (
                    <div className="space-y-3">
                      {event.RDV_Participants.map((participant, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {participant.name || participant.email || `Participant ${idx + 1}`}
                              </p>
                              {participant.email && (
                                <p className="text-sm text-gray-500">{participant.email}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {participant.user_type}
                                </Badge>
                                <Badge 
                                  variant={participant.status === 'accepted' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {participant.status === 'accepted' ? 'Accepté' : 
                                   participant.status === 'declined' ? 'Refusé' :
                                   participant.status === 'pending' ? 'En attente' : participant.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">Aucun participant</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Produits */}
            <TabsContent value="produits" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    Produits Associés ({event.RDV_Produits?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {event.RDV_Produits && event.RDV_Produits.length > 0 ? (
                    <div className="space-y-3">
                      {event.RDV_Produits.map((rdvProduit, idx) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <p className="font-medium text-gray-900">
                            {rdvProduit.ProduitEligible?.nom || 'Produit'}
                          </p>
                          {rdvProduit.ProduitEligible?.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {rdvProduit.ProduitEligible.description}
                            </p>
                          )}
                          {rdvProduit.ProduitEligible?.categorie && (
                            <Badge variant="outline" className="mt-2 text-xs">
                              {rdvProduit.ProduitEligible.categorie}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">Aucun produit associé</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Relations */}
          {event.Expert && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" />
                  Expert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">{getExpertDisplayName()}</p>
                  {event.Expert.email && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Mail className="w-3 h-3" />
                      {event.Expert.email}
                    </div>
                  )}
                  {event.Expert.company_name && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      {event.Expert.company_name}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientEventSynthese;

