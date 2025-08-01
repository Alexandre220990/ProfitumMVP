import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Star, 
  Clock, 
  Award, 
  CheckCircle, 
  Search, 
  MapPin,
  Mail,
  Phone,
  Building2
} from 'lucide-react';
import { config } from '@/config/env';

interface ExpertSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossierId: string;
  onExpertSelected?: (expert: Expert) => void;
}

interface Expert {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  specialites: string[];
  experience_years: number;
  rating: number;
  completed_projects: number;
  location?: string;
  hourly_rate?: number;
  availability: 'available' | 'busy' | 'unavailable';
  description?: string;
  certifications?: string[];
  languages?: string[];
}

interface ExpertFilters {
  search: string;
  speciality: string;
  experience: string;
  rating: string;
  availability: string;
}

export default function ExpertSelectionModal({
  isOpen,
  onClose,
  dossierId,
  onExpertSelected
}: ExpertSelectionModalProps) {
  const { toast } = useToast();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [filteredExperts, setFilteredExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [filters, setFilters] = useState<ExpertFilters>({
    search: '',
    speciality: '',
    experience: '',
    rating: '',
    availability: ''
  });

  // Charger les experts disponibles
  useEffect(() => {
    if (isOpen) {
      loadExperts();
    }
  }, [isOpen]);

  // Filtrer les experts
  useEffect(() => {
    let filtered = experts;

    // Filtre par recherche
    if (filters.search) {
      filtered = filtered.filter(expert =>
        expert.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        expert.company_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        expert.specialites.some(spec => spec.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    // Filtre par spécialité
    if (filters.speciality) {
      filtered = filtered.filter(expert =>
        expert.specialites.includes(filters.speciality)
      );
    }

    // Filtre par expérience
    if (filters.experience) {
      const minYears = parseInt(filters.experience);
      filtered = filtered.filter(expert => expert.experience_years >= minYears);
    }

    // Filtre par note
    if (filters.rating) {
      const minRating = parseFloat(filters.rating);
      filtered = filtered.filter(expert => expert.rating >= minRating);
    }

    // Filtre par disponibilité
    if (filters.availability) {
      filtered = filtered.filter(expert => expert.availability === filters.availability);
    }

    setFilteredExperts(filtered);
  }, [experts, filters]);

  const loadExperts = async () => {
    try {
      setLoading(true);
      
      // Construire les paramètres de requête
      const params = new URLSearchParams();
      if (filters.speciality) params.append('speciality', filters.speciality);
      if (filters.experience) params.append('experience', filters.experience);
      if (filters.rating) params.append('rating', filters.rating);
      if (filters.availability) params.append('availability', filters.availability);
      
      const response = await fetch(`${config.API_URL}/api/experts?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Transformer les données pour correspondre à l'interface Expert
          const transformedExperts = data.data.map((expert: any) => ({
            id: expert.id,
            name: expert.name,
            email: expert.email,
            company_name: expert.company_name,
            specialites: expert.specializations || [],
            experience_years: expert.experience || 0,
            rating: expert.rating || 0,
            completed_projects: expert.completed_projects || 0,
            location: expert.location,
            hourly_rate: expert.compensation,
            availability: expert.disponibilites || 'available',
            description: expert.description,
            certifications: expert.certifications || []
          }));
          setExperts(transformedExperts);
        } else {
          throw new Error(data.message);
        }
      } else {
        throw new Error('Erreur lors du chargement des experts');
      }
    } catch (error) {
      console.error('❌ Erreur chargement experts:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les experts disponibles",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExpertSelection = async (expert: Expert) => {
    try {
      setSelecting(true);
      
      const response = await fetch(`${config.API_URL}/api/dossier-steps/expert/select`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dossier_id: dossierId,
          expert_id: expert.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSelectedExpert(expert);
          onExpertSelected?.(expert);
          
          toast({
            title: "Succès",
            description: `${expert.name} a été sélectionné pour votre dossier`,
          });

          // Fermer le modal après un délai
          setTimeout(() => {
            onClose();
            setSelectedExpert(null);
          }, 2000);
        } else {
          throw new Error(data.message);
        }
      } else {
        throw new Error('Erreur lors de la sélection de l\'expert');
      }
    } catch (error) {
      console.error('❌ Erreur sélection expert:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sélectionner cet expert",
        variant: "destructive"
      });
    } finally {
      setSelecting(false);
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailabilityText = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'Disponible';
      case 'busy':
        return 'Occupé';
      case 'unavailable':
        return 'Indisponible';
      default:
        return 'Inconnu';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Sélectionner un expert pour votre dossier TICPE
          </DialogTitle>
          <DialogDescription>
            Choisissez l'expert qui vous accompagnera dans votre démarche de remboursement TICPE.
          </DialogDescription>
        </DialogHeader>

        {/* Filtres */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher un expert..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.speciality} onValueChange={(value) => setFilters(prev => ({ ...prev, speciality: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Spécialité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les spécialités</SelectItem>
                <SelectItem value="TICPE">TICPE</SelectItem>
                <SelectItem value="Fiscal">Fiscal</SelectItem>
                <SelectItem value="Comptable">Comptable</SelectItem>
                <SelectItem value="Transport">Transport</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.experience} onValueChange={(value) => setFilters(prev => ({ ...prev, experience: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Expérience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toute expérience</SelectItem>
                <SelectItem value="5">5+ ans</SelectItem>
                <SelectItem value="10">10+ ans</SelectItem>
                <SelectItem value="15">15+ ans</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.rating} onValueChange={(value) => setFilters(prev => ({ ...prev, rating: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Note" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes notes</SelectItem>
                <SelectItem value="4">4+ étoiles</SelectItem>
                <SelectItem value="4.5">4.5+ étoiles</SelectItem>
                <SelectItem value="5">5 étoiles</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.availability} onValueChange={(value) => setFilters(prev => ({ ...prev, availability: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Disponibilité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toute disponibilité</SelectItem>
                <SelectItem value="available">Disponible</SelectItem>
                <SelectItem value="busy">Occupé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Liste des experts */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des experts...</p>
            </div>
          </div>
        ) : filteredExperts.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun expert trouvé</h3>
            <p className="text-gray-600">Aucun expert ne correspond à vos critères de recherche.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredExperts.map((expert) => (
              <Card key={expert.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">{expert.name}</h3>
                          {expert.company_name && (
                            <p className="text-sm text-gray-600">{expert.company_name}</p>
                          )}
                        </div>
                        <Badge className={getAvailabilityColor(expert.availability)}>
                          {getAvailabilityText(expert.availability)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm font-medium">{expert.rating}/5</span>
                            <div className="flex">{renderStars(expert.rating)}</div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{expert.experience_years} ans d'expérience</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Award className="w-4 h-4" />
                              <span>{expert.completed_projects} projets</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {expert.specialites.map((speciality) => (
                              <Badge key={speciality} variant="outline" className="text-xs">
                                {speciality}
                              </Badge>
                            ))}
                          </div>
                          {expert.location && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span>{expert.location}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {expert.description && (
                        <p className="text-sm text-gray-600 mb-4">{expert.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {expert.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            <span>{expert.email}</span>
                          </div>
                        )}
                        {expert.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            <span>{expert.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      {expert.hourly_rate && (
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Tarif horaire</p>
                          <p className="font-semibold text-lg text-blue-600">{expert.hourly_rate}€/h</p>
                        </div>
                      )}
                      
                      <Button
                        onClick={() => handleExpertSelection(expert)}
                        disabled={selecting || expert.availability === 'unavailable'}
                        className="min-w-[120px]"
                      >
                        {selecting && selectedExpert?.id === expert.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Sélection...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Sélectionner
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Statistiques */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{filteredExperts.length}</p>
              <p className="text-sm text-gray-600">Experts trouvés</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {filteredExperts.filter(e => e.availability === 'available').length}
              </p>
              <p className="text-sm text-gray-600">Disponibles</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">
                {filteredExperts.filter(e => e.rating >= 4.5).length}
              </p>
              <p className="text-sm text-gray-600">4.5+ étoiles</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {Math.round(filteredExperts.reduce((acc, e) => acc + e.experience_years, 0) / filteredExperts.length)} ans
              </p>
              <p className="text-sm text-gray-600">Expérience moyenne</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 