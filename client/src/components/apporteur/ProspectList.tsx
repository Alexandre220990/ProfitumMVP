import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Calendar,
  User,
  Building,
  Phone,
  Mail,
  MoreHorizontal
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
  expert?: {
    id: string;
    name: string;
    email: string;
  };
}

interface ProspectFilters {
  status?: string;
  interest_level?: string;
  budget_range?: string;
  timeline?: string;
  search?: string;
}

export default function ProspectList() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProspectFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProspects();
  }, [filters]);

  const fetchProspects = async () => {
    try {
      setLoading(true);
      const filtersWithSearch = { ...filters };
      if (searchTerm) filtersWithSearch.search = searchTerm;

      const result = await apporteurApi.getClients(filtersWithSearch);
      
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search: searchTerm }));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'prospect': { color: 'bg-blue-100 text-blue-800', label: 'Prospect' },
      'qualified': { color: 'bg-green-100 text-green-800', label: 'Qualifié' },
      'expert_assigned': { color: 'bg-yellow-100 text-yellow-800', label: 'Expert assigné' },
      'meeting_scheduled': { color: 'bg-purple-100 text-purple-800', label: 'RDV planifié' },
      'in_progress': { color: 'bg-orange-100 text-orange-800', label: 'En cours' },
      'converted': { color: 'bg-green-100 text-green-800', label: 'Converti' },
      'refused': { color: 'bg-red-100 text-red-800', label: 'Refusé' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['prospect'];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getInterestLevelBadge = (level: string) => {
    const levelConfig = {
      'high': { color: 'bg-green-100 text-green-800', label: 'Élevé' },
      'medium': { color: 'bg-yellow-100 text-yellow-800', label: 'Moyen' },
      'low': { color: 'bg-red-100 text-red-800', label: 'Faible' }
    };

    const config = levelConfig[level as keyof typeof levelConfig] || levelConfig['medium'];
    return <Badge className={config.color}>{config.label}</Badge>;
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
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchProspects} className="mt-4">
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
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Prospects</h1>
          <p className="text-gray-600">Liste de tous vos prospects</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Prospect
        </Button>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recherche
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nom, entreprise, email..."
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
                value={filters.status || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les statuts</option>
                <option value="prospect">Prospect</option>
                <option value="qualified">Qualifié</option>
                <option value="expert_assigned">Expert assigné</option>
                <option value="meeting_scheduled">RDV planifié</option>
                <option value="in_progress">En cours</option>
                <option value="converted">Converti</option>
                <option value="refused">Refusé</option>
              </select>
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niveau d'intérêt
              </label>
              <select
                value={filters.interest_level || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, interest_level: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les niveaux</option>
                <option value="high">Élevé</option>
                <option value="medium">Moyen</option>
                <option value="low">Faible</option>
              </select>
            </div>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Search className="h-4 w-4 mr-2" />
              Rechercher
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Liste des prospects */}
      <div className="grid gap-4">
        {prospects.map((prospect) => (
          <Card key={prospect.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{prospect.name}</h3>
                    {getStatusBadge(prospect.status)}
                    {getInterestLevelBadge(prospect.interest_level)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {prospect.company_name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {prospect.email}
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {prospect.phone_number}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div>Score: {prospect.qualification_score}/10</div>
                    <div>Budget: {prospect.budget_range}</div>
                    <div>Timeline: {prospect.timeline}</div>
                    {prospect.expert && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Expert: {prospect.expert.name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {prospects.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun prospect trouvé</h3>
            <p className="text-gray-600 mb-4">
              {Object.values(filters).some(v => v) 
                ? 'Aucun prospect ne correspond à vos critères de recherche.'
                : 'Vous n\'avez pas encore de prospects. Commencez par en créer un.'
              }
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Créer un prospect
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
