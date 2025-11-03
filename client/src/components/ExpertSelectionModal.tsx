import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Users, 
  Star, 
  Clock, 
  Award, 
  CheckCircle, 
  Search, 
  MapPin,
  Mail,
  Phone
} from 'lucide-react';
import { config } from '@/config/env';

interface ExpertSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossierId: string;
  onExpertSelected?: (expert: Expert) => void;
  produitEligible?: {
    id: string;
    nom: string;
    description?: string;
  };
  currentExpert?: Expert | null; // Expert actuellement assigné
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
  onExpertSelected,
  produitEligible,
  currentExpert
}: ExpertSelectionModalProps) {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [filteredExperts, setFilteredExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [tempSelectedExpert, setTempSelectedExpert] = useState<Expert | null>(null);
  const [filters, setFilters] = useState<ExpertFilters>({
    search: '',
    speciality: 'all',
    experience: 'all',
    rating: 'all',
    availability: 'all'
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

    // Filtre automatique par produit éligible
    if (produitEligible?.nom) {
      const produitNom = produitEligible.nom.toLowerCase();
      filtered = filtered.filter(expert =>
        expert.specialites.some(spec => {
          const specLower = spec.toLowerCase();
          return (
            // Correspondance directe avec le nom du produit
            specLower.includes(produitNom) ||
            // Correspondances spécifiques par produit
            (produitNom.includes('ticpe') && (
              specLower.includes('transport') ||
              specLower.includes('carburant') ||
              specLower.includes('véhicule') ||
              specLower.includes('ticpe')
            )) ||
            (produitNom.includes('urssaf') && (
              specLower.includes('social') ||
              specLower.includes('urssaf') ||
              specLower.includes('cotisation') ||
              specLower.includes('salaire')
            )) ||
            (produitNom.includes('foncier') && (
              specLower.includes('fiscal') ||
              specLower.includes('foncier') ||
              specLower.includes('immobilier') ||
              specLower.includes('taxe')
            )) ||
            (produitNom.includes('dfs') && (
              specLower.includes('social') ||
              specLower.includes('dfs') ||
              specLower.includes('déduction')
            )) ||
            (produitNom.includes('cir') && (
              specLower.includes('fiscal') ||
              specLower.includes('cir') ||
              specLower.includes('recherche') ||
              specLower.includes('innovation')
            )) ||
            (produitNom.includes('audit') && (
              specLower.includes('energetique') ||
              specLower.includes('audit') ||
              specLower.includes('énergie')
            ))
          );
        })
      );
    }

    // Filtre par recherche
    if (filters.search) {
      filtered = filtered.filter(expert =>
        expert.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        expert.company_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        expert.specialites.some(spec => spec.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    // Filtre par spécialité
    if (filters.speciality && filters.speciality !== 'all') {
      filtered = filtered.filter(expert =>
        expert.specialites.includes(filters.speciality)
      );
    }

    // Filtre par expérience
    if (filters.experience && filters.experience !== 'all') {
      const minYears = parseInt(filters.experience);
      filtered = filtered.filter(expert => {
        const experienceYears = expert.experience_years || 0;
        return experienceYears >= minYears;
      });
    }

    // Filtre par note
    if (filters.rating && filters.rating !== 'all') {
      const minRating = parseFloat(filters.rating);
      filtered = filtered.filter(expert => expert.rating >= minRating);
    }

    // Filtre par disponibilité
    if (filters.availability && filters.availability !== 'all') {
      filtered = filtered.filter(expert => expert.availability === filters.availability);
    }

    setFilteredExperts(filtered);
  }, [experts, filters, produitEligible]);

  const loadExperts = async () => {
    try {
      setLoading(true);
      
      // Construire les paramètres de requête
      const params = new URLSearchParams();
      if (filters.speciality && filters.speciality !== 'all') params.append('speciality', filters.speciality);
      if (filters.experience && filters.experience !== 'all') params.append('experience', filters.experience);
      if (filters.rating && filters.rating !== 'all') params.append('rating', filters.rating);
      if (filters.availability && filters.availability !== 'all') params.append('availability', filters.availability);
      
      const response = await fetch(`${config.API_URL}/api/client/experts?${params.toString()}`, {
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
            experience_years: expert.experience ? parseInt(expert.experience.split(' ')[0]) || 0 : 0,
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
      toast.error("Impossible de charger les experts disponibles");
    } finally {
      setLoading(false);
    }
  };

  const handleExpertSelection = async (expert: Expert) => {
    // Sélection temporaire - l'expert se met en surbrillance
    setTempSelectedExpert(expert);
  };

  const handleExpertValidation = async () => {
    if (!tempSelectedExpert) return;
    
    try {
      setSelecting(true);
      
      const requestBody = {
        dossier_id: dossierId,
        expert_id: tempSelectedExpert.id
      };
      
      const token = localStorage.getItem('token');
      console.log('🔍 [DEBUG] Envoi requête sélection expert:', {
        url: `${config.API_URL}/api/dossier-steps/expert/select`,
        body: requestBody,
        token: token ? 'Présent' : 'Absent',
        tokenLength: token?.length || 0,
        method: 'POST'
      });
      
      const fetchOptions = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      };
      
      console.log('🔍 [DEBUG] Options fetch:', fetchOptions);
      
      const response = await fetch(`${config.API_URL}/api/dossier-steps/expert/select`, fetchOptions);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [DEBUG] Données reçues:', data);
        if (data.success) {
          onExpertSelected?.(tempSelectedExpert);
          
          toast.success(`${tempSelectedExpert.name} a été sélectionné pour votre dossier`);

          // Fermer le modal après un délai
          setTimeout(() => {
            onClose();
            setTempSelectedExpert(null);
          }, 2000);
        } else {
          throw new Error(data.message);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ [DEBUG] Erreur HTTP:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Erreur lors de la sélection de l'expert: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Erreur sélection expert:', error);
      toast.error("Impossible de sélectionner cet expert");
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
            Sélectionner un expert pour votre dossier {produitEligible?.nom || 'TICPE'}
          </DialogTitle>
          <DialogDescription>
            Choisissez l'expert qui vous accompagnera dans votre démarche de {produitEligible?.nom || 'TICPE'}.
          </DialogDescription>
        </DialogHeader>

        {/* Filtres */}
        <div className="space-y-4">
          {produitEligible?.nom && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Filtrage automatique :</strong> Seuls les experts spécialisés en <strong>{produitEligible.nom}</strong> sont affichés.
              </p>
            </div>
          )}
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
                <SelectItem value="all">Toutes les spécialités</SelectItem>
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
                <SelectItem value="all">Toute expérience</SelectItem>
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
                <SelectItem value="all">Toutes notes</SelectItem>
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
                <SelectItem value="all">Toute disponibilité</SelectItem>
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
          <div className="grid gap-6">
            {filteredExperts.map((expert) => (
              <Card 
                key={expert.id} 
                className={`transition-all duration-300 hover:shadow-lg ${
                  tempSelectedExpert?.id === expert.id 
                    ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 shadow-lg' 
                    : 'hover:shadow-lg border-gray-200'
                }`}
              >
                <CardContent className="p-6">
                  {/* Header avec avatar et infos principales */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                          {expert.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        {tempSelectedExpert?.id === expert.id && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-xl text-gray-900">{expert.name}</h3>
                          <Badge className={getAvailabilityColor(expert.availability)}>
                            {getAvailabilityText(expert.availability)}
                          </Badge>
                        </div>
                        
                        {expert.company_name && (
                          <p className="text-sm font-medium text-gray-700 mb-1">{expert.company_name}</p>
                        )}
                        
                        {(tempSelectedExpert?.id === expert.id || currentExpert?.id === expert.id) && (
                          <div className="flex items-center gap-1 mt-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-semibold text-green-700">
                              {tempSelectedExpert?.id === expert.id ? 'Expert sélectionné' : 'Expert actuellement assigné'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Compensation */}
                    {expert.hourly_rate && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Compensation</p>
                        <p className="font-bold text-2xl text-blue-600">{expert.hourly_rate}€</p>
                        <p className="text-xs text-gray-500">/heure</p>
                      </div>
                    )}
                  </div>

                  {/* Informations détaillées */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    {/* Colonne gauche - Note et expérience */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-5 h-5 text-yellow-400 fill-current" />
                          <span className="font-semibold text-lg">{expert.rating}</span>
                          <span className="text-gray-500">/5</span>
                        </div>
                        <div className="flex">{renderStars(expert.rating)}</div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">{expert.experience_years} ans d'expérience</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Award className="w-4 h-4 text-purple-500" />
                          <span className="font-medium">{expert.completed_projects} projets réalisés</span>
                        </div>
                      </div>
                    </div>

                    {/* Colonne droite - Spécialités et localisation */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Spécialités</p>
                        <div className="flex flex-wrap gap-1">
                          {expert.specialites.map((speciality) => (
                            <Badge key={speciality} variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                              {speciality}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {expert.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <MapPin className="w-4 h-4 text-red-500" />
                          <span className="font-medium">{expert.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {expert.description && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 leading-relaxed">{expert.description}</p>
                    </div>
                  )}

                  {/* Contact */}
                  <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                    {expert.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{expert.email}</span>
                      </div>
                    )}
                    {expert.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{expert.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex justify-end">
                      
                      {tempSelectedExpert?.id === expert.id ? (
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={handleExpertValidation}
                            disabled={selecting}
                            className="min-w-[120px] bg-green-600 hover:bg-green-700"
                          >
                            {selecting ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Validation...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Valider
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => setTempSelectedExpert(null)}
                            variant="outline"
                            size="sm"
                            className="min-w-[120px]"
                          >
                            Annuler
                          </Button>
                        </div>
                      ) : currentExpert?.id === expert.id ? (
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            disabled
                            className="min-w-[120px] bg-green-50 border-green-200 text-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Actuellement assigné
                          </Button>
                          <Button
                            onClick={() => handleExpertSelection(expert)}
                            disabled={selecting}
                            variant="outline"
                            size="sm"
                            className="min-w-[120px]"
                          >
                            Changer d'expert
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleExpertSelection(expert)}
                          disabled={selecting || expert.availability === 'unavailable'}
                          className="min-w-[120px]"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Sélectionner
                        </Button>
                      )}
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