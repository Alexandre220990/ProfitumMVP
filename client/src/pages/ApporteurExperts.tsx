import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Building, 
  User, 
  Phone, 
  Mail, 
  Star, 
  Clock, 
  CheckCircle,
  Search,
  Filter,
  Eye,
  MessageCircle
} from 'lucide-react';
import { apporteurApi } from '@/services/apporteur-api';

interface Expert {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  company_name: string;
  specializations: string[];
  performance: {
    total_dossiers: number;
    rating: string;
    response_time: number;
    availability: string;
  };
}

export default function ApporteurExperts() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');

  useEffect(() => {
    fetchExperts();
  }, []);

  const fetchExperts = async () => {
    try {
      setLoading(true);
      const filters = {
        specialization: selectedSpecialization
      };
      
      const result = await apporteurApi.getExperts(filters);
      
      if (result.success && result.data) {
        setExperts(Array.isArray(result.data) ? result.data : []);
      } else {
        setError(result.error || 'Erreur lors du chargement des experts');
      }
    } catch (err) {
      console.error('Erreur fetchExperts:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const filteredExperts = experts.filter(expert => {
    const matchesSearch = expert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expert.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expert.specializations.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSpecialization = !selectedSpecialization || 
                                 expert.specializations.includes(selectedSpecialization);
    
    return matchesSearch && matchesSpecialization;
  });

  const handleSpecializationChange = (specialization: string) => {
    setSelectedSpecialization(specialization);
    // Re-fetch experts with new filter
    fetchExperts();
  };

  const getAvailabilityBadge = (availability: string) => {
    const config = {
      'available': { color: 'bg-green-100 text-green-800', label: 'Disponible' },
      'busy': { color: 'bg-red-100 text-red-800', label: 'Occupé' },
      'away': { color: 'bg-yellow-100 text-yellow-800', label: 'Absent' }
    };
    const badgeConfig = config[availability as keyof typeof config] || config['available'];
    return <Badge className={badgeConfig.color}>{badgeConfig.label}</Badge>;
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
          <Button onClick={fetchExperts} className="mt-4">
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
          <h1 className="text-3xl font-bold text-gray-900">Experts</h1>
          <p className="text-gray-600">Répertoire des experts disponibles</p>
        </div>
      </div>

      {/* Filtres et recherche */}
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
                  placeholder="Nom, entreprise, spécialisation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Spécialisation
              </label>
              <select
                value={selectedSpecialization}
                onChange={(e) => handleSpecializationChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes les spécialisations</option>
                <option value="CIR">CIR</option>
                <option value="TICPE">TICPE</option>
                <option value="URSSAF">URSSAF</option>
                <option value="DFS">DFS</option>
                <option value="Audit Énergétique">Audit Énergétique</option>
              </select>
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des experts */}
      <div className="grid gap-4">
        {filteredExperts.map((expert) => (
          <Card key={expert.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{expert.name}</h3>
                    {getAvailabilityBadge(expert.performance.availability)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {expert.company_name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {expert.email}
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {expert.phone_number}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {expert.performance.rating}/5
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {expert.performance.total_dossiers} dossiers
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Réponse: {expert.performance.response_time}h
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {expert.specializations.map((spec, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Voir
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Contacter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredExperts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun expert trouvé</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedSpecialization 
                ? 'Aucun expert ne correspond à vos critères de recherche.'
                : 'Aucun expert disponible pour le moment.'
              }
            </p>
            {(searchTerm || selectedSpecialization) && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSpecialization('');
                }}
              >
                Effacer les filtres
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
