/**
 * Composant Timeline pour afficher l'historique complet d'un client
 * Fusionne : événements client + tous les événements de tous les dossiers + commentaires
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Calendar, Filter, MessageSquare, Send, Edit, Trash2, Clock, MapPin, Video } from 'lucide-react';
import { config } from '@/config/env';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface TimelineEvent {
  id: string;
  client_id?: string;
  dossier_id?: string;
  date: string;
  type: string;
  actor_type: 'client' | 'expert' | 'admin' | 'system' | 'apporteur';
  actor_id?: string;
  actor_name: string;
  title: string;
  description?: string;
  metadata?: any;
  icon?: string;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray';
  action_url?: string;
}

interface ClientTimelineProps {
  clientId: string;
  userType?: 'client' | 'expert' | 'admin' | 'apporteur';
  compact?: boolean;
  maxEvents?: number;
  className?: string;
  clientInfo?: {
    name?: string;
    company_name?: string;
    phone_number?: string;
    email?: string;
  };
}

const getColorClass = (color?: string) => {
  switch (color) {
    case 'green': return 'bg-green-100 border-green-300 text-green-800';
    case 'blue': return 'bg-blue-100 border-blue-300 text-blue-800';
    case 'orange': return 'bg-orange-100 border-orange-300 text-orange-800';
    case 'red': return 'bg-red-100 border-red-300 text-red-800';
    case 'purple': return 'bg-purple-100 border-purple-300 text-purple-800';
    case 'gray': return 'bg-gray-100 border-gray-300 text-gray-800';
    default: return 'bg-blue-100 border-blue-300 text-blue-800';
  }
};

const getActorBadgeColor = (actorType: string) => {
  switch (actorType) {
    case 'client': return 'bg-blue-500';
    case 'expert': return 'bg-purple-500';
    case 'admin': return 'bg-red-500';
    case 'apporteur': return 'bg-green-500';
    case 'system': return 'bg-gray-500';
    default: return 'bg-gray-500';
  }
};

const getActorLabel = (actorType: string) => {
  switch (actorType) {
    case 'client': return 'Client';
    case 'expert': return 'Expert';
    case 'admin': return 'Admin';
    case 'apporteur': return 'Apporteur';
    case 'system': return 'Système';
    default: return actorType;
  }
};

export default function ClientTimeline({
  clientId,
  userType: _userType,
  compact = false,
  maxEvents = 100,
  className = '',
  clientInfo
}: ClientTimelineProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterActor, setFilterActor] = useState<string>('all');
  const [total, setTotal] = useState(0);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
      if (!token) {
        throw new Error('Token non trouvé');
      }

      // Construire URL avec filtres
      let url = `${config.API_URL}/api/clients/${clientId}/timeline?limit=${maxEvents}`;
      
      if (filterType !== 'all') {
        url += `&type=${filterType}`;
      }
      
      if (filterActor !== 'all') {
        url += `&actor_type=${filterActor}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setEvents(data.data.events || []);
        setTotal(data.data.total || 0);
      } else {
        throw new Error(data.message || 'Erreur chargement timeline');
      }

    } catch (err: any) {
      console.error('❌ Erreur chargement timeline client:', err);
      setError(err.message || 'Impossible de charger la timeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, [clientId, filterType, filterActor, maxEvents]);

  const handleAddComment = async () => {
    if (!commentText.trim() || !user) return;

    setSubmittingComment(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
      if (!token) {
        throw new Error('Token non trouvé');
      }

      const response = await fetch(`${config.API_URL}/api/clients/${clientId}/timeline/comment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: commentText.trim()
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors de l\'ajout du commentaire');
      }

      toast.success('Commentaire ajouté avec succès');
      setCommentText('');
      setShowCommentForm(false);
      
      // Recharger la timeline
      await loadTimeline();

    } catch (err: any) {
      console.error('❌ Erreur ajout commentaire client:', err);
      toast.error('Erreur', {
        description: err.message || 'Impossible d\'ajouter le commentaire'
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleEditComment = (event: TimelineEvent) => {
    setEditingCommentId(event.id || null);
    setEditingCommentText(event.description || '');
  };

  const handleUpdateComment = async () => {
    if (!editingCommentText.trim() || !editingCommentId || !user) return;

    setSubmittingComment(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
      if (!token) {
        throw new Error('Token non trouvé');
      }

      const response = await fetch(`${config.API_URL}/api/clients/${clientId}/timeline/comment/${editingCommentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: editingCommentText.trim()
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors de la modification du commentaire');
      }

      toast.success('Commentaire modifié avec succès');
      setEditingCommentId(null);
      setEditingCommentText('');
      
      // Recharger la timeline
      await loadTimeline();

    } catch (err: any) {
      console.error('❌ Erreur modification commentaire client:', err);
      toast.error('Erreur', {
        description: err.message || 'Impossible de modifier le commentaire'
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) return;
    if (!user) return;

    setSubmittingComment(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
      if (!token) {
        throw new Error('Token non trouvé');
      }

      const response = await fetch(`${config.API_URL}/api/clients/${clientId}/timeline/comment/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors de la suppression du commentaire');
      }

      toast.success('Commentaire supprimé avec succès');
      
      // Recharger la timeline
      await loadTimeline();

    } catch (err: any) {
      console.error('❌ Erreur suppression commentaire client:', err);
      toast.error('Erreur', {
        description: err.message || 'Impossible de supprimer le commentaire'
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCreateEvent = () => {
    // Préremplir avec les infos du client et naviguer vers agenda-admin
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    const endTime = new Date(tomorrow);
    endTime.setHours(9, 30, 0, 0);

    const description = clientInfo ? [
      clientInfo.name && `Nom: ${clientInfo.name}`,
      clientInfo.company_name && `Entreprise: ${clientInfo.company_name}`,
      clientInfo.phone_number && `Téléphone: ${clientInfo.phone_number}`,
      clientInfo.email && `Email: ${clientInfo.email}`
    ].filter(Boolean).join('\n') : '';

    // Stocker les données préremplies dans localStorage
    const prefillData = {
      title: `Rappel - ${clientInfo?.name || clientInfo?.company_name || 'Client'}`,
      description,
      start_date: tomorrow.toISOString().slice(0, 16),
      end_date: endTime.toISOString().slice(0, 16),
      client_id: clientId,
      priority: 'medium'
    };
    
    localStorage.setItem('calendar_event_prefill', JSON.stringify(prefillData));
    
    // Naviguer vers agenda-admin
    navigate('/admin/agenda-admin');
  };

  // Vérifier si l'utilisateur peut ajouter des commentaires
  const canAddComment = user && ['admin', 'expert', 'apporteur'].includes(user.type);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Chargement de la timeline...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">❌ {error}</p>
            <Button onClick={loadTimeline} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-xl">
              {compact ? 'Timeline' : 'Timeline Client'}
            </CardTitle>
            <Badge variant="secondary">{total} événement{total > 1 ? 's' : ''}</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {canAddComment && !compact && (
              <>
                <Button 
                  onClick={handleCreateEvent} 
                  variant="outline" 
                  size="sm"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Créer un rappel
                </Button>
                <Button 
                  onClick={() => setShowCommentForm(!showCommentForm)} 
                  variant="outline" 
                  size="sm"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {showCommentForm ? 'Annuler' : 'Ajouter un commentaire'}
                </Button>
              </>
            )}
            {!compact && (
              <Button onClick={loadTimeline} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Filtres */}
        {!compact && (
          <div className="flex gap-3 mt-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type d'événement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="document">📄 Documents</SelectItem>
                  <SelectItem value="status_change">🔄 Changement statut</SelectItem>
                  <SelectItem value="comment">💬 Commentaires</SelectItem>
                  <SelectItem value="dossier_created">📄 Création dossier</SelectItem>
                  <SelectItem value="expert_action">👨‍🔧 Action expert</SelectItem>
                  <SelectItem value="admin_action">👨‍💼 Action admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={filterActor} onValueChange={setFilterActor}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Acteur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="apporteur">Apporteur</SelectItem>
                <SelectItem value="system">Système</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>

      <CardContent className={compact ? "p-4" : "p-6"}>
        {/* Formulaire d'ajout de commentaire */}
        {showCommentForm && canAddComment && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <label className="text-sm font-medium text-gray-700">
                  Ajouter un commentaire sur ce client
                </label>
              </div>
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Ex: Client eu au téléphone, est actuellement en contact avec un autre cabinet..."
                className="min-h-[80px]"
                disabled={submittingComment}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCommentForm(false);
                    setCommentText('');
                  }}
                  disabled={submittingComment}
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!commentText.trim() || submittingComment}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {submittingComment ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Publier
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {events.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Aucun événement pour le moment
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event, index) => (
              <div
                key={event.id || index}
                className={`relative pl-8 pb-4 ${
                  index !== events.length - 1 ? 'border-l-2 border-gray-200' : ''
                }`}
              >
                {/* Icône événement */}
                <div className="absolute left-0 top-0 -translate-x-1/2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${getColorClass(event.color)}`}>
                    <span className="text-sm">{event.icon || '📋'}</span>
                  </div>
                </div>

                {/* Contenu événement */}
                <div className="ml-2">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge 
                          className={`text-xs ${getActorBadgeColor(event.actor_type)} text-white`}
                        >
                          {getActorLabel(event.actor_type)}
                        </Badge>
                        <span className="text-xs text-gray-600">{event.actor_name}</span>
                        {event.dossier_id && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <Badge variant="outline" className="text-xs">
                              📄 Dossier
                            </Badge>
                          </>
                        )}
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {formatDate(event.date)}
                        </span>
                      </div>
                    </div>
                    {/* Actions rapides pour les commentaires */}
                    {event.type === 'comment' && event.actor_id === user?.database_id && (
                      <div className="flex items-center gap-1 ml-2">
                        {editingCommentId === event.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleUpdateComment}
                              disabled={submittingComment}
                              className="h-6 px-2"
                            >
                              <Send className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingCommentId(null);
                                setEditingCommentText('');
                              }}
                              disabled={submittingComment}
                              className="h-6 px-2"
                            >
                              ✕
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditComment(event)}
                              className="h-6 px-2"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteComment(event.id!)}
                              disabled={submittingComment}
                              className="h-6 px-2 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Description - édition si en cours */}
                  {editingCommentId === event.id ? (
                    <div className="mt-2">
                      <Textarea
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        className="min-h-[80px]"
                        disabled={submittingComment}
                      />
                    </div>
                  ) : (
                    event.description && (
                      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                        {event.description}
                      </p>
                    )
                  )}

                  {/* Action URL */}
                  {event.action_url && (
                    <button
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowEventDialog(true);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1 inline-block"
                    >
                      → Voir détails
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Indicateur "Voir plus" si events tronqués */}
        {total > events.length && (
          <div className="text-center mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              {events.length} événements affichés sur {total}
            </p>
          </div>
        )}
      </CardContent>

      {/* Dialog pour afficher les détails de l'événement */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-lg">{selectedEvent?.icon || '📋'}</span>
              <span>{selectedEvent?.title || 'Détails de l\'événement'}</span>
            </DialogTitle>
            <DialogDescription>
              {selectedEvent && (
                <div className="space-y-4 mt-4">
                  {/* Date/Heure du rendez-vous mise en avant */}
                  {selectedEvent.metadata?.scheduled_date && selectedEvent.metadata?.scheduled_time && (
                    <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <h4 className="text-sm font-semibold text-blue-900">Date et heure du rendez-vous</h4>
                      </div>
                      <p className="text-lg font-bold text-blue-700">
                        {(() => {
                          const dateStr = selectedEvent.metadata.scheduled_date;
                          const timeStr = selectedEvent.metadata.scheduled_time;
                          const date = new Date(`${dateStr}T${timeStr}`);
                          return date.toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          }) + ' ' + date.toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                        })()}
                      </p>
                    </div>
                  )}

                  {/* Informations acteur */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge 
                      className={`text-xs ${getActorBadgeColor(selectedEvent.actor_type)} text-white`}
                    >
                      {getActorLabel(selectedEvent.actor_type)}
                    </Badge>
                    <span className="text-sm text-gray-600">{selectedEvent.actor_name}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {formatDate(selectedEvent.date)}
                    </span>
                  </div>

                  {/* Description */}
                  {selectedEvent.description && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                        {selectedEvent.description}
                      </p>
                    </div>
                  )}

                  {/* Métadonnées filtrées */}
                  {selectedEvent.metadata && (() => {
                    const filteredMetadata: any = {};
                    
                    // Filtrer selon les critères
                    if (selectedEvent.metadata.location !== null && selectedEvent.metadata.location !== undefined) {
                      filteredMetadata.location = selectedEvent.metadata.location;
                    }
                    if (selectedEvent.metadata.meeting_url !== null && selectedEvent.metadata.meeting_url !== undefined) {
                      filteredMetadata.meeting_url = selectedEvent.metadata.meeting_url;
                    }
                    if (selectedEvent.metadata.meeting_type) {
                      filteredMetadata.meeting_type = selectedEvent.metadata.meeting_type;
                    }
                    if (selectedEvent.metadata.scheduled_date) {
                      filteredMetadata.scheduled_date = selectedEvent.metadata.scheduled_date;
                    }
                    if (selectedEvent.metadata.scheduled_time) {
                      filteredMetadata.scheduled_time = selectedEvent.metadata.scheduled_time;
                    }

                    // Afficher seulement si on a des métadonnées à afficher
                    if (Object.keys(filteredMetadata).length > 0) {
                      return (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Métadonnées</h4>
                          <div className="space-y-2">
                            {filteredMetadata.location && (
                              <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                                <div>
                                  <span className="text-xs font-medium text-gray-600">Lieu :</span>
                                  <p className="text-sm text-gray-700">{filteredMetadata.location}</p>
                                </div>
                              </div>
                            )}
                            {filteredMetadata.meeting_url && (
                              <div className="flex items-start gap-2">
                                <Video className="w-4 h-4 text-gray-500 mt-0.5" />
                                <div>
                                  <span className="text-xs font-medium text-gray-600">URL de réunion :</span>
                                  <a 
                                    href={filteredMetadata.meeting_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline block"
                                  >
                                    {filteredMetadata.meeting_url}
                                  </a>
                                </div>
                              </div>
                            )}
                            {filteredMetadata.meeting_type && (
                              <div className="flex items-start gap-2">
                                <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
                                <div>
                                  <span className="text-xs font-medium text-gray-600">Type de réunion :</span>
                                  <p className="text-sm text-gray-700">
                                    {filteredMetadata.meeting_type === 'physical' ? 'Présentiel' :
                                     filteredMetadata.meeting_type === 'video' ? 'Visioconférence' :
                                     filteredMetadata.meeting_type === 'phone' ? 'Téléphone' :
                                     filteredMetadata.meeting_type}
                                  </p>
                                </div>
                              </div>
                            )}
                            {filteredMetadata.scheduled_date && (
                              <div className="flex items-start gap-2">
                                <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
                                <div>
                                  <span className="text-xs font-medium text-gray-600">Date prévue :</span>
                                  <p className="text-sm text-gray-700">
                                    {new Date(filteredMetadata.scheduled_date).toLocaleDateString('fr-FR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    })}
                                  </p>
                                </div>
                              </div>
                            )}
                            {filteredMetadata.scheduled_time && (
                              <div className="flex items-start gap-2">
                                <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
                                <div>
                                  <span className="text-xs font-medium text-gray-600">Heure prévue :</span>
                                  <p className="text-sm text-gray-700">
                                    {(() => {
                                      const timeStr = filteredMetadata.scheduled_time;
                                      const [hours, minutes] = timeStr.split(':');
                                      return `${hours}:${minutes}`;
                                    })()}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Bouton action */}
                  {selectedEvent.action_url && (
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (selectedEvent.action_url) {
                            window.open(selectedEvent.action_url, '_blank');
                          }
                        }}
                      >
                        Ouvrir dans une nouvelle page
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

