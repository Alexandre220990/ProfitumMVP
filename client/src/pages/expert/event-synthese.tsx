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
  Phone,
  FileText,
  RefreshCw,
  Eye,
  Users,
  AlertTriangle,
  ArrowLeft,
  Edit
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { get } from '@/lib/api';
import { toast } from 'sonner';
import { RDVReportModal } from '@/components/rdv/RDVReportModal';

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
  client_id?: string;
  expert_id?: string;
  apporteur_id?: string;
  Client?: {
    id: string;
    company_name?: string;
    first_name?: string;
    last_name?: string;
    name?: string;
    email: string;
    phone_number?: string;
  };
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
  ApporteurAffaires?: {
    id: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    email: string;
    phone?: string;
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

interface ReportData {
  id: string;
  rdv_id: string;
  summary: string;
  visibility?: 'participants' | 'cabinet' | 'internal';
  created_at: string;
  updated_at: string;
}

interface EventSyntheseResponse {
  event: EventData;
  report: ReportData | null;
}

const ExpertEventSynthese: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventData | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadEventData();
    }
  }, [id]);

  const loadEventData = async () => {
    setLoading(true);
    try {
      const response = await get<EventSyntheseResponse>(`/expert/events/${id}/synthese`);
      if (response.success && response.data) {
        setEvent(response.data.event);
        setReport(response.data.report);
      } else {
        toast.error('Événement non trouvé');
        navigate('/expert/agenda');
        return;
      }
    } catch (error) {
      console.error('Erreur chargement événement:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.type !== 'expert') {
    return <Navigate to="/connect-expert" replace />;
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

  const getClientDisplayName = () => {
    if (!event?.Client) return null;
    return event.Client.company_name || 
           `${event.Client.first_name || ''} ${event.Client.last_name || ''}`.trim() || 
           event.Client.name ||
           event.Client.email;
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
            <TabsList className="grid grid-cols-4 w-full max-w-3xl">
              <TabsTrigger value="details">Détails</TabsTrigger>
              <TabsTrigger value="participants">Participants</TabsTrigger>
              <TabsTrigger value="produits">Produits</TabsTrigger>
              <TabsTrigger value="report">Rapport</TabsTrigger>
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

            {/* Onglet Rapport */}
            <TabsContent value="report" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-orange-600" />
                      Rapport d'Événement
                    </CardTitle>
                    <Button
                      onClick={() => setShowReportModal(true)}
                      variant={report ? "outline" : "default"}
                    >
                      {report ? (
                        <>
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier le rapport
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Ajouter un rapport
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {report ? (
                    <div className="space-y-4">
                      <div>
                        <span className="text-sm text-gray-600">Résumé</span>
                        <p className="font-medium text-gray-900 mt-1 whitespace-pre-wrap">
                          {report.summary}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>
                          Créé le {new Date(report.created_at).toLocaleDateString('fr-FR')}
                        </span>
                        {report.updated_at !== report.created_at && (
                          <span>
                            Modifié le {new Date(report.updated_at).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">Aucun rapport n'a été ajouté pour cet événement</p>
                      <Button onClick={() => setShowReportModal(true)}>
                        <FileText className="w-4 h-4 mr-2" />
                        Ajouter un rapport
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Relations */}
          {event.Client && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">{getClientDisplayName()}</p>
                  {event.Client.email && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Mail className="w-3 h-3" />
                      {event.Client.email}
                    </div>
                  )}
                  {event.Client.phone_number && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Phone className="w-3 h-3" />
                      {event.Client.phone_number}
                    </div>
                  )}
                  <Button
                    onClick={() => navigate(`/expert/client/${event.Client!.id}`)}
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Voir la synthèse client
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Modal de rapport */}
      {event && (
        <RDVReportModal
          rdvId={event.id}
          rdvTitle={event.title}
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            loadEventData();
          }}
          onSuccess={() => {
            loadEventData();
          }}
          existingReport={report || undefined}
        />
      )}
    </div>
  );
};

export default ExpertEventSynthese;

