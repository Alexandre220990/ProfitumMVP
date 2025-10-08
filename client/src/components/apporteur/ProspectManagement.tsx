import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ProspectForm from './ProspectForm';
import { 
  Users, 
  Calendar, 
  Search, 
  Filter, 
  Plus,
  AlertCircle,
  TrendingUp,
  Target,
  Star,
  Clock,
  CheckCircle,
  RefreshCw,
  Download,
  Activity,
  Building,
  Mail,
  Phone
} from 'lucide-react';
import { apporteurApi } from '@/services/apporteur-api';

interface Prospect {
  id: string;
  name: string;
  company_name: string;
  email: string;
  phone_number: string;
  status: string;
  qualification_score: number;
  interest_level: string;
  budget_range: string;
  timeline: string;
  created_at: string;
  updated_at: string;
  preselected_expert_id?: string;
  expert_name?: string;
}

export default function ProspectManagement() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [showProspectForm, setShowProspectForm] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchProspects();
  }, []);

  const fetchProspects = async () => {
    try {
      setLoading(true);
      const result = await apporteurApi.getClients();
      
      if (result.success && result.data) {
        setProspects(Array.isArray(result.data) ? result.data : []);
      } else {
        setError(result.error || 'Erreur lors du chargement des prospects');
      }
    } catch (err) {
      console.error('Erreur fetchProspects:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };


  const getStatusCounts = () => {
    const counts = {
      total: prospects.length,
      nouveau: prospects.filter(p => p.status === 'prospect').length,
      qualifie: prospects.filter(p => p.status === 'qualified').length,
      rdv_negocie: prospects.filter(p => p.status === 'rdv_negotiated').length,
      expert_valide: prospects.filter(p => p.status === 'expert_validated').length,
      meeting_fait: prospects.filter(p => p.status === 'meeting_done').length,
      en_cours: prospects.filter(p => p.status === 'in_progress').length,
      signe: prospects.filter(p => p.status === 'signed').length,
      refuse: prospects.filter(p => p.status === 'refused').length
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  const handleStatusClick = (status: string) => {
    setSelectedStatus(selectedStatus === status ? null : status);
    setStatusFilter(selectedStatus === status ? '' : status);
  };

  const getFilteredProspects = () => {
    let filtered = prospects;
    
    if (searchTerm) {
      filtered = filtered.filter(prospect => 
        prospect.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prospect.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prospect.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(prospect => prospect.status === statusFilter);
    }
    
    return filtered;
  };

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
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchProspects} className="mt-4">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Optimisé */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">Gestion Prospects</h1>
              <p className="text-gray-600 mt-1">Suivez et gérez vos prospects efficacement</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              <Button variant="outline" className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Importer
              </Button>
              <Button 
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowProspectForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Prospect
              </Button>
            </div>
          </div>
        </div>

        {/* Statistiques Optimisées - Cliquables */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6 mb-8">
          <Card 
            className={`bg-white shadow-lg hover:shadow-xl transition-all duration-200 border-0 cursor-pointer ${
              selectedStatus === null ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => handleStatusClick('all')}
          >
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{statusCounts.total}</div>
              <div className="text-sm font-semibold text-gray-600">Total</div>
            </CardContent>
          </Card>
          
          <Card 
            className={`bg-white shadow-lg hover:shadow-xl transition-all duration-200 border-0 cursor-pointer ${
              selectedStatus === 'prospect' ? 'ring-2 ring-gray-500 bg-gray-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => handleStatusClick('prospect')}
          >
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Target className="h-6 w-6 text-gray-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-600 mb-1">{statusCounts.nouveau}</div>
              <div className="text-sm font-semibold text-gray-600">Nouveau</div>
            </CardContent>
          </Card>
          
          <Card 
            className={`bg-white shadow-lg hover:shadow-xl transition-all duration-200 border-0 cursor-pointer ${
              selectedStatus === 'qualified' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => handleStatusClick('qualified')}
          >
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-1">{statusCounts.qualifie}</div>
              <div className="text-sm font-semibold text-gray-600">Qualifié</div>
            </CardContent>
          </Card>
          
          <Card 
            className={`bg-white shadow-lg hover:shadow-xl transition-all duration-200 border-0 cursor-pointer ${
              selectedStatus === 'rdv_negotiated' ? 'ring-2 ring-yellow-500 bg-yellow-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => handleStatusClick('rdv_negotiated')}
          >
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-yellow-600 mb-1">{statusCounts.rdv_negocie}</div>
              <div className="text-sm font-semibold text-gray-600">RDV négocié</div>
            </CardContent>
          </Card>
          
          <Card 
            className={`bg-white shadow-lg hover:shadow-xl transition-all duration-200 border-0 cursor-pointer ${
              selectedStatus === 'expert_validated' ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => handleStatusClick('expert_validated')}
          >
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-purple-600 mb-1">{statusCounts.expert_valide}</div>
              <div className="text-sm font-semibold text-gray-600">Expert validé</div>
            </CardContent>
          </Card>
          
          <Card 
            className={`bg-white shadow-lg hover:shadow-xl transition-all duration-200 border-0 cursor-pointer ${
              selectedStatus === 'meeting_done' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => handleStatusClick('meeting_done')}
          >
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-1">{statusCounts.meeting_fait}</div>
              <div className="text-sm font-semibold text-gray-600">Meeting fait</div>
            </CardContent>
          </Card>
          
          <Card 
            className={`bg-white shadow-lg hover:shadow-xl transition-all duration-200 border-0 cursor-pointer ${
              selectedStatus === 'in_progress' ? 'ring-2 ring-orange-500 bg-orange-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => handleStatusClick('in_progress')}
          >
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-orange-600 mb-1">{statusCounts.en_cours}</div>
              <div className="text-sm font-semibold text-gray-600">En cours</div>
            </CardContent>
          </Card>
          
          <Card 
            className={`bg-white shadow-lg hover:shadow-xl transition-all duration-200 border-0 cursor-pointer ${
              selectedStatus === 'signed' ? 'ring-2 ring-emerald-500 bg-emerald-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => handleStatusClick('signed')}
          >
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-emerald-600 mb-1">{statusCounts.signe}</div>
              <div className="text-sm font-semibold text-gray-600">Signé</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et Recherche Optimisés */}
        <Card className="bg-white shadow-lg border-0 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-end">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher par nom, entreprise, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="w-full lg:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tous les statuts</option>
                  <option value="prospect">Nouveau</option>
                  <option value="qualified">Qualifié</option>
                  <option value="rdv_negotiated">RDV négocié</option>
                  <option value="expert_validated">Expert validé</option>
                  <option value="meeting_done">Meeting fait</option>
                  <option value="in_progress">En cours</option>
                  <option value="signed">Signé</option>
                  <option value="refused">Refusé</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 lg:flex-none">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                </Button>
                <Button variant="outline" className="flex-1 lg:flex-none">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des Prospects Filtrés */}
        {selectedStatus && (
          <Card className="bg-white shadow-lg border-0 mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                Prospects - {selectedStatus === 'all' ? 'Tous' : selectedStatus}
                <Badge variant="outline" className="ml-auto">
                  {getFilteredProspects().length} prospect{getFilteredProspects().length > 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {getFilteredProspects().length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun prospect trouvé</p>
                </div>
              ) : (
                <div className="divide-y">
                  {getFilteredProspects().map((prospect) => (
                    <div key={prospect.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-lg text-gray-900">{prospect.name}</h4>
                            <Badge 
                              variant={prospect.status === 'signed' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {prospect.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-blue-500" />
                              <span>{prospect.company_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-green-500" />
                              <span>{prospect.email}</span>
                            </div>
                            {prospect.phone_number && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-purple-500" />
                                <span>{prospect.phone_number}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-orange-500" />
                              <span>Score: {prospect.qualification_score}/10</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedProspect(prospect);
                              setShowDetailsModal(true);
                            }}
                          >
                            Voir détails
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer avec Statistiques */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg border-0 mt-8">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{prospects.length}</div>
                <div className="text-sm text-gray-600">Total Prospects</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 bg-green-100 rounded-full">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {statusCounts.qualifie + statusCounts.rdv_negocie + statusCounts.expert_valide}
                </div>
                <div className="text-sm text-gray-600">En cours de qualification</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <CheckCircle className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{statusCounts.signe}</div>
                <div className="text-sm text-gray-600">Prospects signés</div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-blue-200">
              <p className="text-center text-sm text-gray-600">
                Cliquez sur une carte de statut ci-dessus pour voir les prospects correspondants
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Formulaire de création de prospect */}
        {showProspectForm && (
          <ProspectForm 
            onCancel={() => setShowProspectForm(false)}
            onSuccess={() => {
              setShowProspectForm(false);
              fetchProspects(); // Rafraîchir la liste après création
            }}
          />
        )}

        {/* Modal de détails du prospect avec possibilité de modification */}
        {showDetailsModal && selectedProspect && (
          <ProspectForm 
            prospectId={selectedProspect.id}
            onCancel={() => {
              setShowDetailsModal(false);
              setSelectedProspect(null);
            }}
            onSuccess={() => {
              setShowDetailsModal(false);
              setSelectedProspect(null);
              fetchProspects(); // Rafraîchir la liste après modification
            }}
          />
        )}
      </div>
    </div>
  );
}
