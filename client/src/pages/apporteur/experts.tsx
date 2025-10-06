import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { 
  Building, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Search, 
  Filter, 
  Plus,
  TrendingUp,
  Users,
  CheckCircle,
  Eye,
  Download,
  Award,
  MessageSquare
} from 'lucide-react';
import { ApporteurRealDataService } from '../../services/apporteur-real-data-service';

/**
 * Page Experts
 * Gestion des experts et leurs spécialisations
 */
export default function ExpertsPage() {
  const router = useRouter();
  const { apporteurId } = router.query;
  const [experts, setExperts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (apporteurId && typeof apporteurId === 'string') {
      loadExperts();
    }
  }, [apporteurId]);

  const loadExperts = async () => {
    try {
      const service = new ApporteurRealDataService(apporteurId as string);
      const result = await service.getExperts();
      
      if (result.success) {
        setExperts(result.data || []);
      } else {
        setExperts([]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des experts:', err);
      setExperts([]);
    }
  };

  if (!apporteurId || typeof apporteurId !== 'string') {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ID Apporteur Requis</h2>
            <p className="text-gray-600">Veuillez vous connecter pour accéder aux experts.</p>
          </div>
        </div>
      </div>
    );
  }


  const expertsData = experts;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'busy': return 'Occupé';
      case 'offline': return 'Hors ligne';
      default: return 'Inconnu';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Optimisé */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">Mes Experts</h1>
              <p className="text-gray-600 mt-1">Gérez vos experts et leurs spécialisations</p>
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
                Ajouter Expert
              </Button>
            </div>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par nom, spécialité, localisation..."
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
                    Spécialité
                  </label>
                  <select
                    value={specialtyFilter}
                    onChange={(e) => setSpecialtyFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Toutes les spécialités</option>
                    <option value="TICPE">TICPE</option>
                    <option value="URSSAF">URSSAF</option>
                    <option value="TVA">TVA</option>
                    <option value="CEE">CEE</option>
                  </select>
                </div>
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
                    <option value="available">Disponible</option>
                    <option value="busy">Occupé</option>
                    <option value="offline">Hors ligne</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => {
                      setSpecialtyFilter('');
                      setStatusFilter('');
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
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">12</div>
                  <p className="text-sm font-semibold text-gray-600">Total Experts</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">Experts actifs</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">8</div>
                  <p className="text-sm font-semibold text-gray-600">Disponibles</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">En ligne maintenant</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">91%</div>
                  <p className="text-sm font-semibold text-gray-600">Taux de Réussite</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">Dossiers réussis</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Award className="h-6 w-6 text-orange-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">8</div>
                  <p className="text-sm font-semibold text-gray-600">Spécialisations</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">Domaines couverts</p>
            </CardContent>
          </Card>
        </div>

        {/* Liste des Experts Optimisée */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              Liste des Experts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {expertsData.length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                    <Users className="h-12 w-12 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Aucun expert trouvé</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Commencez par ajouter votre premier expert à votre réseau
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700 px-8 py-3">
                    <Plus className="h-5 w-5 mr-2" />
                    Ajouter un Expert
                  </Button>
                </div>
              ) : (
                expertsData.map((expert) => (
                  <div key={expert.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:scale-105">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                          <Building className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xl text-gray-900">{expert.name}</h4>
                          <p className="text-sm text-gray-600 font-medium">{expert.specialty}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-semibold text-gray-700">{expert.rating}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600">{expert.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">{expert.dossiers} dossiers</div>
                          <div className="text-sm text-gray-600">{expert.successRate}% réussite</div>
                        </div>
                        <Badge className={`${getStatusColor(expert.status)} px-4 py-2 rounded-full text-sm font-semibold`}>
                          {getStatusText(expert.status)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Téléphone</p>
                          <p className="text-xs text-gray-600">{expert.phone}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Email</p>
                          <p className="text-xs text-gray-600">{expert.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Award className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Performance</p>
                          <p className="text-xs text-gray-600">{expert.successRate}% de réussite</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 hover:bg-blue-50">
                        <Phone className="h-4 w-4 mr-2" />
                        Appeler
                      </Button>
                      <Button variant="outline" className="flex-1 hover:bg-green-50">
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                      </Button>
                      <Button variant="outline" className="flex-1 hover:bg-purple-50">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      <Button variant="outline" className="flex-1 hover:bg-orange-50">
                        <Eye className="h-4 w-4 mr-2" />
                        Voir
                      </Button>
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
