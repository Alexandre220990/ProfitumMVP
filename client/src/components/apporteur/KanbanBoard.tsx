import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Building, 
  Calendar, 
  CheckCircle,
  AlertCircle,
  Plus,
  MoreHorizontal,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Phone,
  Mail,
  ArrowRight,
  Target,
  Star
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

interface KanbanColumn {
  id: string;
  title: string;
  prospects: Prospect[];
  color: string;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  { 
    id: 'nouveau', 
    title: 'Nouveau', 
    prospects: [], 
    color: 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200' 
  },
  { 
    id: 'qualifie', 
    title: 'Qualifié', 
    prospects: [], 
    color: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200' 
  },
  { 
    id: 'rdv_negocie', 
    title: 'RDV négocié', 
    prospects: [], 
    color: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200' 
  },
  { 
    id: 'expert_valide', 
    title: 'Expert validé', 
    prospects: [], 
    color: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200' 
  },
  { 
    id: 'meeting_fait', 
    title: 'Meeting fait', 
    prospects: [], 
    color: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' 
  },
  { 
    id: 'en_cours', 
    title: 'En cours', 
    prospects: [], 
    color: 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200' 
  },
  { 
    id: 'signe', 
    title: 'Signé', 
    prospects: [], 
    color: 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200' 
  },
  { 
    id: 'refuse', 
    title: 'Refusé', 
    prospects: [], 
    color: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200' 
  }
];

export default function KanbanBoard() {
  const [columns, setColumns] = useState<KanbanColumn[]>(KANBAN_COLUMNS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterScore, setFilterScore] = useState<number>(0);

  useEffect(() => {
    fetchProspects();
  }, []);

  const fetchProspects = async () => {
    try {
      setLoading(true);
      const result = await apporteurApi.getClients();
      
      if (result.success && result.data) {
        const prospects = Array.isArray(result.data) ? result.data : [];
        organizeProspectsInColumns(prospects);
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

  const organizeProspectsInColumns = (prospects: Prospect[]) => {
    let filteredProspects = prospects;

    // Appliquer les filtres
    if (searchQuery) {
      filteredProspects = filteredProspects.filter(prospect => 
        prospect.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prospect.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prospect.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus.length > 0) {
      filteredProspects = filteredProspects.filter(prospect => 
        filterStatus.includes(prospect.status)
      );
    }

    if (filterScore > 0) {
      filteredProspects = filteredProspects.filter(prospect => 
        prospect.qualification_score >= filterScore
      );
    }

    const newColumns = KANBAN_COLUMNS.map(column => ({
      ...column,
      prospects: filteredProspects.filter(prospect => {
        switch (column.id) {
          case 'nouveau': return prospect.status === 'prospect';
          case 'qualifie': return prospect.status === 'qualified';
          case 'rdv_negocie': return prospect.status === 'rdv_negotiated';
          case 'expert_valide': return prospect.status === 'expert_validated';
          case 'meeting_fait': return prospect.status === 'meeting_done';
          case 'en_cours': return prospect.status === 'in_progress';
          case 'signe': return prospect.status === 'signed';
          case 'refuse': return prospect.status === 'refused';
          default: return false;
        }
      })
    }));
    setColumns(newColumns);
  };

  const handleStatusChange = async (prospectId: string, newStatus: string) => {
    try {
      const result = await apporteurApi.updateClientStatus(prospectId, newStatus);
      
      if (result.success) {
        // Recharger les données
        await fetchProspects();
      } else {
        setError(result.error || 'Erreur lors du changement de statut');
      }
    } catch (err) {
      console.error('Erreur changement statut:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
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
    <div className="bg-white rounded-lg shadow-lg border-0">
      {/* Barre de recherche et filtres compacts */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher par nom, entreprise ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowFilters(!showFilters)}
              variant="outline" 
              size="sm"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau
            </Button>
          </div>
        </div>

        {/* Panneau de filtres */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Score minimum
                </label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={filterScore}
                  onChange={(e) => setFilterScore(Number(e.target.value))}
                  className="w-full"
                  placeholder="Score de qualification"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statuts
                </label>
                <div className="flex flex-wrap gap-2">
                  {['prospect', 'qualified', 'rdv_negotiated', 'expert_validated', 'meeting_done', 'in_progress', 'signed', 'refused'].map((status) => (
                    <Button
                      key={status}
                      variant={filterStatus.includes(status) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        if (filterStatus.includes(status)) {
                          setFilterStatus(filterStatus.filter(s => s !== status));
                        } else {
                          setFilterStatus([...filterStatus, status]);
                        }
                      }}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Kanban Board Optimisé */}
      <div className="p-3 md:p-6">
        <div className="flex gap-3 md:gap-6 overflow-x-auto pb-6 scrollbar-hide -mx-3 md:mx-0 px-3 md:px-0">
          {columns.map((column) => (
            <div key={column.id} className="flex-shrink-0 w-[280px] md:w-80">
              <div className={`${column.color} rounded-xl p-6 border shadow-lg`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-gray-900 text-lg">{column.title}</h3>
                    <Badge variant="outline" className="bg-white shadow-sm">
                      {column.prospects.length}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {column.prospects.length > 0 ? 
                        Math.round((column.prospects.reduce((acc, p) => acc + p.qualification_score, 0) / column.prospects.length) * 10) / 10 
                        : 0
                      }/10
                    </span>
                  </div>
                </div>
              
                <div className="space-y-4">
                  {column.prospects.map((prospect) => (
                    <Card 
                      key={prospect.id} 
                      className="bg-white hover:shadow-xl transition-all duration-200 cursor-pointer border-0 shadow-md hover:scale-105"
                      onClick={() => console.log('Prospect sélectionné:', prospect.id)}
                    >
                      <CardContent className="p-5">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-gray-900 text-lg">{prospect.name}</h4>
                              {prospect.qualification_score >= 8 && (
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              )}
                            </div>
                            <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Building className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">{prospect.company_name}</span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Mail className="h-4 w-4 text-green-500" />
                            <span>{prospect.email}</span>
                          </div>

                          {prospect.phone_number && (
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <Phone className="h-4 w-4 text-purple-500" />
                              <span>{prospect.phone_number}</span>
                            </div>
                          )}
                          
                          {prospect.expert_name && (
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <CheckCircle className="h-4 w-4 text-emerald-500" />
                              <span className="font-medium">Expert: {prospect.expert_name}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-orange-500" />
                              <span className="text-sm font-semibold">Score: {prospect.qualification_score}/10</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(prospect.created_at).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-green-500" />
                              <span className="text-sm font-medium">{prospect.budget_range}</span>
                            </div>
                            <Badge 
                              variant={prospect.interest_level === 'high' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {prospect.interest_level}
                            </Badge>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(prospect.id, 'qualified');
                              }}
                              className="flex-1 hover:bg-blue-50 hover:border-blue-300"
                            >
                              <ArrowRight className="h-3 w-3 mr-1" />
                              Qualifier
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(prospect.id, 'rdv_negotiated');
                              }}
                              className="flex-1 hover:bg-green-50 hover:border-green-300"
                            >
                              <Calendar className="h-3 w-3 mr-1" />
                              RDV
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                
                  {column.prospects.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <Calendar className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium">Aucun prospect</p>
                      <p className="text-xs text-gray-400 mt-1">Glissez-déposez des prospects ici</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
