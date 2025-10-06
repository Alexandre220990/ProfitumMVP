import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Phone, 
  Plus, 
  Search, 
  Filter,
  TrendingUp,
  CheckCircle,
  Eye,
  Download,
  Building,
  DollarSign
} from 'lucide-react';
import { ApporteurRealDataService } from '../../services/apporteur-real-data-service';

/**
 * Page Rendez-vous
 * Gestion des rendez-vous et planification
 */
export default function MeetingsPage() {
  const router = useRouter();
  const { apporteurId } = router.query;
  const [meetings, setMeetings] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (apporteurId && typeof apporteurId === 'string') {
      loadMeetings();
    }
  }, [apporteurId]);

  const loadMeetings = async () => {
    try {
      const service = new ApporteurRealDataService(apporteurId as string);
      const result = await service.getRendezVous();
      
      if (result.success) {
        setMeetings(result.data || []);
      } else {
        setMeetings([]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des rendez-vous:', err);
      setMeetings([]);
    }
  };

  if (!apporteurId || typeof apporteurId !== 'string') {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ID Apporteur Requis</h2>
            <p className="text-gray-600">Veuillez vous connecter pour accéder à vos rendez-vous.</p>
          </div>
        </div>
      </div>
    );
  }


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'physical': return <MapPin className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Optimisé */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">Mes Rendez-vous</h1>
              <p className="text-gray-600 mt-1">Gérez vos rendez-vous et planifiez vos rencontres</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              <Button 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau RDV
              </Button>
            </div>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par titre, client, type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Panneau de filtres */}
          {showFilters && (
            <div className="bg-white p-4 rounded-lg border shadow-sm mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Tous les statuts</option>
                    <option value="confirmed">Confirmé</option>
                    <option value="pending">En attente</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Tous les types</option>
                    <option value="video">Vidéo</option>
                    <option value="physical">Physique</option>
                    <option value="phone">Téléphone</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => {
                      setStatusFilter('');
                      setTypeFilter('');
                      setSearchQuery('');
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Effacer les filtres
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Statistiques Optimisées */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">8</div>
                  <p className="text-sm font-semibold text-gray-600">RDV Confirmés</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">Cette semaine</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">3</div>
                  <p className="text-sm font-semibold text-gray-600">En Attente</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">Confirmation requise</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">75%</div>
                  <p className="text-sm font-semibold text-gray-600">Taux de Conversion</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">RDV → Signature</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">Demain</div>
                  <p className="text-sm font-semibold text-gray-600">Prochain RDV</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">14:00 - Entreprise ABC</p>
            </CardContent>
          </Card>
        </div>

        {/* Liste des Rendez-vous Optimisée */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              Rendez-vous à venir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {meetings.length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                    <Calendar className="h-12 w-12 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Aucun rendez-vous trouvé</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Commencez par planifier votre premier rendez-vous avec un prospect
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700 px-8 py-3">
                    <Plus className="h-5 w-5 mr-2" />
                    Planifier un RDV
                  </Button>
                </div>
              ) : (
                meetings.map((meeting) => (
                  <div key={meeting.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:scale-105">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          {getTypeIcon(meeting.type)}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-gray-900">{meeting.titre}</h4>
                          <p className="text-sm text-gray-600">{meeting.client_nom}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`${getStatusColor(meeting.statut)} px-3 py-1 rounded-full text-sm font-semibold`}>
                          {meeting.statut}
                        </Badge>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="hover:bg-blue-50">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="hover:bg-green-50">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{meeting.date_rdv}</p>
                          <p className="text-xs text-gray-600">{meeting.heure_debut} - {meeting.duree_minutes} min</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Building className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Entreprise</p>
                          <p className="text-xs text-gray-600">{meeting.client_entreprise || 'Non spécifiée'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Budget estimé</p>
                          <p className="text-xs text-gray-600">{meeting.budget_estime || 'À définir'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
