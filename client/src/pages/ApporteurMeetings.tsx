import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { apporteurApi } from '@/services/apporteur-api';
import { 
  Calendar, 
  Clock, 
  User, 
  Building, 
  Phone, 
  Video, 
  MapPin,
  Plus,
  Filter,
  Search
} from 'lucide-react';

interface Meeting {
  id: string;
  client_name: string;
  company_name: string;
  expert_name: string;
  meeting_type: 'physical' | 'video' | 'phone';
  scheduled_date: string;
  scheduled_time: string;
  duration: number;
  location?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

export default function ApporteurMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const result = await apporteurApi.getClients(); // Récupérer les clients avec leurs RDV
      
      if (result.success && result.data) {
        // Transformer les données clients en meetings
        const meetingsData = Array.isArray(result.data) ? result.data : [];
        setMeetings(meetingsData);
      } else {
        setMeetings([]);
        if (result.error) {
          setError(result.error);
        }
      }
    } catch (err) {
      console.error('Erreur fetchMeetings:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'scheduled': { color: 'bg-yellow-100 text-yellow-800', label: 'Planifié' },
      'confirmed': { color: 'bg-green-100 text-green-800', label: 'Confirmé' },
      'completed': { color: 'bg-blue-100 text-blue-800', label: 'Terminé' },
      'cancelled': { color: 'bg-red-100 text-red-800', label: 'Annulé' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['scheduled'];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'physical': return <MapPin className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const filteredMeetings = meetings.filter((meeting: Meeting) => {
    const matchesSearch = meeting.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meeting.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meeting.expert_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || meeting.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchMeetings} className="mt-4">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rendez-vous</h1>
          <p className="text-gray-600">Gestion de vos rendez-vous avec les experts</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau RDV
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recherche
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Client, expert, entreprise..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les statuts</option>
                <option value="scheduled">Planifié</option>
                <option value="confirmed">Confirmé</option>
                <option value="completed">Terminé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des rendez-vous */}
      <div className="grid gap-4">
        {filteredMeetings.map((meeting: Meeting) => (
          <Card key={meeting.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{meeting.client_name}</h3>
                    {getStatusBadge(meeting.status)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {meeting.company_name}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Expert: {meeting.expert_name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {meeting.scheduled_date} à {meeting.scheduled_time}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {meeting.duration} min
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      {getMeetingTypeIcon(meeting.meeting_type)}
                      {meeting.meeting_type === 'physical' ? 'Physique' : 
                       meeting.meeting_type === 'video' ? 'Visio' : 'Téléphone'}
                    </div>
                    {meeting.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {meeting.location}
                      </div>
                    )}
                  </div>

                  {meeting.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700">{meeting.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    Modifier
                  </Button>
                  <Button variant="outline" size="sm">
                    Annuler
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMeetings.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun rendez-vous</h3>
            <p className="text-gray-600 mb-4">
              Vous n'avez pas encore de rendez-vous planifiés.
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Planifier un RDV
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
