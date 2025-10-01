import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { config } from '@/config/env';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, Users, MapPin, Video, Plus, Edit, Trash, Check, X, AlertTriangle } from 'lucide-react';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

interface CollaborativeEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  type: 'appointment' | 'deadline' | 'meeting' | 'task' | 'reminder';
  location?: string;
  is_online?: boolean;
  meeting_url?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  organizer: {
    user_id: string;
    user_type: 'client' | 'expert' | 'admin';
    email: string;
    name: string;
  };
  participants: Array<{
    user_id: string;
    user_type: 'client' | 'expert' | 'admin';
    email: string;
    name: string;
    status: 'pending' | 'accepted' | 'declined' | 'tentative';
  }>;
  meeting_details?: {
    platform: 'google_meet' | 'zoom' | 'teams' | 'other';
    meeting_url?: string;
    meeting_id?: string;
    password?: string;
    dial_in_numbers?: string[];
  };
  agenda_items?: Array<{
    id: string;
    title: string;
    description?: string;
    duration_minutes: number;
    presenter?: string;
  }>;
  documents?: Array<{
    id: string;
    name: string;
    url: string;
    type: 'presentation' | 'document' | 'spreadsheet' | 'other';
  }>;
}

interface EventStats {
  totalEvents: number;
  upcomingEvents: number;
  pendingResponses: number;
  acceptedEvents: number;
  declinedEvents: number;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const CollaborativeEventManager: React.FC = () => {
  const { user } = useAuth();
  
  const [events, setEvents] = useState<CollaborativeEvent[]>([]);
  const [stats, setStats] = useState<EventStats>({
    totalEvents: 0,
    upcomingEvents: 0,
    pendingResponses: 0,
    acceptedEvents: 0,
    declinedEvents: 0
  });
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // État du formulaire de création
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    is_online: false,
    type: 'meeting' as const,
    priority: 'medium' as const,
    participants: [] as Array<{
      user_id: string;
      user_type: 'client' | 'expert' | 'admin';
      email: string;
      name: string;
    }>,
    meeting_details: {
      platform: 'google_meet' as const,
      meeting_url: '',
      meeting_id: '',
      password: ''
    },
    agenda_items: [] as Array<{
      id: string;
      title: string;
      description: string;
      duration_minutes: number;
      presenter: string;
    }>
  });

  // Charger les données au montage
  useEffect(() => {
    if (user?.id) {
      loadEvents();
      loadStats();
    }
  }, [user?.id]);

  // Charger les événements
  const loadEvents = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`${config.API_URL}/api/collaborative-events`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Erreur lors du chargement');

      const data = await response.json();
      setEvents(data.data || []);
    } catch (error) {
      console.error('❌ Erreur chargement événements:', error);
      toast.error('Impossible de charger les événements');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Charger les statistiques
  const loadStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`${config.API_URL}/api/collaborative-events/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Erreur lors du chargement des statistiques');

      const data = await response.json();
      setStats(data.data || {
        totalEvents: 0,
        upcomingEvents: 0,
        pendingResponses: 0,
        acceptedEvents: 0,
        declinedEvents: 0
      });
    } catch (error) {
      console.error('❌ Erreur chargement statistiques:', error);
      toast.error('Impossible de charger les statistiques');
    }
  }, [user?.id]);

  // Créer un événement
  const createEvent = async () => {
    if (!user?.id) return;

    try {
      const eventData = {
        ...createForm,
        organizer: {
          user_id: user.id,
          user_type: user.type as 'client' | 'expert' | 'admin',
          email: user.email,
          name: user.name || user.email
        },
        participants: createForm.participants.map(p => ({
          ...p,
          status: 'pending' as const
        }))
      };

      const response = await fetch(`${config.API_URL}/api/collaborative-events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) throw new Error('Erreur lors de la création');

      toast.success('Événement créé avec succès');

      setShowCreateDialog(false);
      resetCreateForm();
      loadEvents();
      loadStats();
    } catch (error) {
      console.error('❌ Erreur création événement:', error);
      toast.error('Impossible de créer l\'événement');
    }
  };

  // Répondre à une invitation
  const respondToInvitation = async (eventId: string, response: 'accepted' | 'declined' | 'tentative') => {
    try {
      const responseData = await fetch(`/api/collaborative-events/invitations/${eventId}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ response })
      });

      if (!responseData.ok) throw new Error('Erreur lors de la réponse');

      toast.success('Réponse enregistrée avec succès');

      loadEvents();
      loadStats();
    } catch (error) {
      console.error('❌ Erreur réponse invitation:', error);
      toast.error('Impossible d\'enregistrer la réponse');
    }
  };

  // Annuler un événement
  const cancelEvent = async (eventId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cet événement ?')) return;

    try {
      const response = await fetch(`/api/collaborative-events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Erreur lors de l\'annulation');

      toast.success('Événement annulé avec succès');

      loadEvents();
      loadStats();
    } catch (error) {
      console.error('❌ Erreur annulation événement:', error);
      toast.error('Impossible d\'annuler l\'événement');
    }
  };

  // Réinitialiser le formulaire de création
  const resetCreateForm = () => {
    setCreateForm({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      location: '',
      is_online: false,
      type: 'meeting',
      priority: 'medium',
      participants: [],
      meeting_details: {
        platform: 'google_meet',
        meeting_url: '',
        meeting_id: '',
        password: ''
      },
      agenda_items: []
    });
  };

  // Ajouter un participant
  const addParticipant = () => {
    setCreateForm(prev => ({
      ...prev,
      participants: [...prev.participants, {
        user_id: '',
        user_type: 'client',
        email: '',
        name: ''
      }]
    }));
  };

  // Supprimer un participant
  const removeParticipant = (index: number) => {
    setCreateForm(prev => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index)
    }));
  };

  // Mettre à jour un participant
  const updateParticipant = (index: number, field: string, value: string) => {
    setCreateForm(prev => ({
      ...prev,
      participants: prev.participants.map((p, i) => 
        i === index ? { ...p, [field]: value } : p
      )
    }));
  };

  // Obtenir la couleur de priorité
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtenir la couleur de statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'tentative': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Événements Collaboratifs</h1>
          <p className="text-gray-600">Gérez vos réunions et rendez-vous partagés</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nouvel événement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un événement collaboratif</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Informations de base */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre *
                  </label>
                  <Input
                    value={createForm.title}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Titre de l'événement"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <Select
                    value={createForm.type}
                    onValueChange={(value: any) => setCreateForm(prev => ({ ...prev, type: value }))}
                  >
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priorité
                  </label>
                  <Select
                    value={createForm.priority}
                    onValueChange={(value: any) => setCreateForm(prev => ({ ...prev, priority: value }))}
                  >
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description de l'événement"
                  rows={3}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date et heure de début *
                  </label>
                  <Input
                    type="datetime-local"
                    value={createForm.start_date}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date et heure de fin *
                  </label>
                  <Input
                    type="datetime-local"
                    value={createForm.end_date}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>

              {/* Localisation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lieu
                  </label>
                  <Input
                    value={createForm.location}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Adresse ou lieu de réunion"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_online"
                    checked={createForm.is_online}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, is_online: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="is_online" className="text-sm font-medium text-gray-700">
                    Réunion en ligne
                  </label>
                </div>
              </div>

              {/* Détails de réunion en ligne */}
              {createForm.is_online && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900">Détails de la réunion en ligne</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">
                        Plateforme
                      </label>
                      <Select
                        value={createForm.meeting_details.platform}
                        onValueChange={(value: any) => setCreateForm(prev => ({
                          ...prev,
                          meeting_details: { ...prev.meeting_details, platform: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="google_meet">Google Meet</SelectItem>
                          <SelectItem value="zoom">Zoom</SelectItem>
                          <SelectItem value="teams">Microsoft Teams</SelectItem>
                          <SelectItem value="other">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">
                        URL de réunion
                      </label>
                      <Input
                        value={createForm.meeting_details.meeting_url}
                        onChange={(e) => setCreateForm(prev => ({
                          ...prev,
                          meeting_details: { ...prev.meeting_details, meeting_url: e.target.value }
                        }))}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Participants */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">Participants</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addParticipant}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </Button>
                </div>
                
                {createForm.participants.map((participant, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type
                      </label>
                      <Select
                        value={participant.user_type}
                        onValueChange={(value: any) => updateParticipant(index, 'user_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">Client</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom
                      </label>
                      <Input
                        value={participant.name}
                        onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                        placeholder="Nom complet"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={participant.email}
                        onChange={(e) => updateParticipant(index, 'email', e.target.value)}
                        placeholder="email@exemple.com"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeParticipant(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    resetCreateForm();
                  }}
                >
                  Annuler
                </Button>
                <Button onClick={createEvent} disabled={!createForm.title || !createForm.start_date || !createForm.end_date}>
                  Créer l'événement
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">À venir</p>
                <p className="text-2xl font-bold text-green-600">{stats.upcomingEvents}</p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingResponses}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Acceptés</p>
                <p className="text-2xl font-bold text-green-600">{stats.acceptedEvents}</p>
              </div>
              <Check className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Refusés</p>
                <p className="text-2xl font-bold text-red-600">{stats.declinedEvents}</p>
              </div>
              <X className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des événements */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Mes événements</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement...</p>
          </div>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun événement</h3>
              <p className="text-gray-600 mb-4">Vous n'avez pas encore d'événements collaboratifs.</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                Créer votre premier événement
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                        <Badge className={getPriorityColor(event.priority)}>
                          {event.priority}
                        </Badge>
                        {event.is_online && (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Video className="w-3 h-3 mr-1" />
                            En ligne
                          </Badge>
                        )}
                      </div>
                      
                      {event.description && (
                        <p className="text-gray-600 mb-3">{event.description}</p>
                      )}
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(event.start_date)}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {event.participants.length} participants
                        </div>
                      </div>
                      
                      {/* Participants */}
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Participants :</h4>
                        <div className="flex flex-wrap gap-2">
                          {event.participants.map((participant, index) => (
                            <Badge key={index} className={getStatusColor(participant.status)}>
                              {participant.name} ({participant.status})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {event.organizer.user_id === user?.id ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => console.log('Éditer événement:', event.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelEvent(event.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => respondToInvitation(event.id, 'accepted')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => respondToInvitation(event.id, 'declined')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 