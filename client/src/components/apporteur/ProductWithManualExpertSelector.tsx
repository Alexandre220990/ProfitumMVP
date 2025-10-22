import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Users,
  Star,
  CheckCircle,
  X,
  AlertCircle
} from 'lucide-react';
import { config } from '@/config';
import { toast } from 'sonner';

interface Expert {
  id: string;
  name: string;
  company_name: string;
  email: string;
  specializations: string[];
  rating: number;
}

interface Product {
  id: string;
  produit_id: string;
  produit_name: string;
  produit_description: string;
  statut: 'eligible' | 'to_confirm' | 'non_eligible';
  montant_estime: number;
  priorite: number;
  recommended_expert?: {
    id: string;
    name: string;
    company_name: string;
    rating: number;
    matchScore: number;
  };
}

interface Props {
  product: Product;
  onExpertSelected: (productId: string, expertId: string | null) => void;
  selectedExpertId?: string | null;
}

export function ProductWithManualExpertSelector({ 
  product, 
  onExpertSelected,
  selectedExpertId 
}: Props) {
  
  const [availableExperts, setAvailableExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(false);
  const [showExpertSelector, setShowExpertSelector] = useState(false);
  
  // Charger les experts disponibles pour ce produit
  useEffect(() => {
    if (showExpertSelector) {
      loadExperts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showExpertSelector]);
  
  const loadExperts = async () => {
    try {
      setLoading(true);
      console.log(`🔍 Chargement de TOUS les experts pour le produit ${product.produit_name}...`);
      
      const response = await fetch(`${config.API_URL}/api/apporteur/experts/by-products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productIds: [product.produit_id] })
      });
      
      if (response.ok) {
        const result = await response.json();
        const experts = result.data || [];
        setAvailableExperts(experts);
        console.log(`✅ ${experts.length} expert(s) disponible(s) pour ${product.produit_name}`);
        
        if (experts.length === 0) {
          toast.warning(`Aucun expert disponible pour ${product.produit_name}`);
        }
      } else {
        console.error('❌ Erreur HTTP:', response.status);
        toast.error('Erreur lors du chargement des experts');
      }
    } catch (error) {
      console.error('❌ Erreur chargement experts:', error);
      toast.error('Impossible de charger les experts');
    } finally {
      setLoading(false);
    }
  };
  
  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'eligible': return 'bg-green-100 text-green-800';
      case 'to_confirm': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'eligible': return 'Éligible';
      case 'to_confirm': return 'À confirmer';
      default: return 'Non éligible';
    }
  };
  
  const selectedExpert = selectedExpertId 
    ? availableExperts.find(e => e.id === selectedExpertId) 
    : null;
  
  const recommendedExpert = product.recommended_expert;
  
  return (
    <Card className="p-4 border-2 border-gray-200 hover:border-blue-300 transition-all">
      {/* Header Produit */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-lg">{product.produit_name}</h4>
            <Badge className={getStatutColor(product.statut)}>
              {getStatutLabel(product.statut)}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">{product.produit_description}</p>
        </div>
        
        {product.montant_estime > 0 && (
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {product.montant_estime.toLocaleString()}€
            </div>
            <p className="text-xs text-gray-500">Économies estimées</p>
          </div>
        )}
      </div>
      
      {/* Expert recommandé (suggestion IA) */}
      {recommendedExpert && (
        <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-900">
              Expert recommandé par IA
            </span>
            <Badge variant="outline" className="text-xs">
              Score: {Math.round(recommendedExpert.matchScore)}%
            </Badge>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-sm font-medium">{recommendedExpert.name}</p>
              <p className="text-xs text-gray-600">{recommendedExpert.company_name}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-yellow-600">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-semibold">{recommendedExpert.rating}/5</span>
              </div>
              {selectedExpertId === recommendedExpert.id ? (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onExpertSelected(product.id, null)}
                  className="text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Retirer
                </Button>
              ) : (
                <Button 
                  size="sm"
                  onClick={() => onExpertSelected(product.id, recommendedExpert.id)}
                  className="text-xs"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Sélectionner
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Expert sélectionné */}
      {selectedExpert && selectedExpertId !== recommendedExpert?.id && (
        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-semibold text-green-900">
              Expert sélectionné
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-sm font-medium">{selectedExpert.name}</p>
              <p className="text-xs text-gray-600">{selectedExpert.company_name}</p>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onExpertSelected(product.id, null)}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Retirer
            </Button>
          </div>
        </div>
      )}
      
      {/* Aucun expert sélectionné */}
      {!selectedExpertId && (
        <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Aucun expert sélectionné - Le client pourra choisir lui-même
            </span>
          </div>
        </div>
      )}
      
      {/* Bouton Choisir un autre expert */}
      <div className="mt-3">
        {!showExpertSelector ? (
          <Button 
            type="button"
            variant="outline" 
            size="sm" 
            onClick={() => setShowExpertSelector(true)}
            className="w-full"
          >
            <Users className="h-4 w-4 mr-2" />
            {selectedExpertId ? 'Changer d\'expert' : 'Choisir un expert'}
          </Button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-semibold">Experts disponibles</h5>
              <Button 
                type="button"
                variant="ghost" 
                size="sm" 
                onClick={() => setShowExpertSelector(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {loading ? (
              <div className="text-center py-4 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Chargement de tous les experts disponibles...
              </div>
            ) : availableExperts.length === 0 ? (
              <div className="text-center py-4 text-sm text-gray-500 bg-yellow-50 border border-yellow-200 rounded p-3">
                <AlertCircle className="h-5 w-5 mx-auto mb-2 text-yellow-600" />
                <p className="font-medium text-yellow-900">Aucun expert disponible pour ce produit</p>
                <p className="text-xs mt-1 text-yellow-700">Contactez l'administrateur pour ajouter des experts spécialisés</p>
              </div>
            ) : (
              <div>
                <div className="text-xs text-gray-600 mb-2 bg-blue-50 p-2 rounded">
                  💡 <strong>{availableExperts.length} expert(s)</strong> disponible(s) pour ce produit - Parcourez la liste complète ci-dessous
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded p-2">
                  {availableExperts.map((expert) => (
                  <Card 
                    key={expert.id}
                    className={`p-3 cursor-pointer hover:bg-gray-50 transition-all ${
                      selectedExpertId === expert.id 
                        ? 'border-2 border-blue-500 bg-blue-50' 
                        : 'border border-gray-200'
                    }`}
                    onClick={() => {
                      onExpertSelected(product.id, expert.id);
                      setShowExpertSelector(false);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{expert.name}</p>
                        <p className="text-xs text-gray-600">{expert.company_name}</p>
                        {expert.specializations && expert.specializations.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {expert.specializations.slice(0, 2).map((spec, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-yellow-600">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm">{expert.rating || 4.5}</span>
                      </div>
                    </div>
                  </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

