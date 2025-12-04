import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle,
  X,
  Users,
  Star,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { config } from '@/config';
import { getSupabaseToken } from '@/lib/auth-helpers';
import { toast } from 'sonner';

interface Expert {
  id: string;
  name: string;
  company_name: string;
  email: string;
  specializations: string[];
  rating: number;
}

interface ClientProduitEligible {
  id: string;
  produitId: string;
  expert_id: string | null;
  montantFinal: number;
  statut: string;
  ProduitEligible?: {
    nom: string;
    description: string;
  };
  Expert?: Expert;
}

interface Props {
  cpe: ClientProduitEligible;
  onExpertValidated: () => void;
}

export function ExpertSelectionCard({ cpe, onExpertValidated }: Props) {
  const [showExpertSelector, setShowExpertSelector] = useState(false);
  const [availableExperts, setAvailableExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  
  const currentExpert = cpe.Expert;
  const hasExpert = !!cpe.expert_id;
  const productName = cpe.ProduitEligible?.nom || 'Produit';
  
  // Charger les experts disponibles
  const loadExperts = async () => {
    try {
      setLoading(true);
      console.log(`🔍 Chargement experts pour ${productName}...`);
      
      const response = await fetch(`${config.API_URL}/api/client/products/${cpe.id}/available-experts`, {
        headers: {
          'Authorization': `Bearer ${await getSupabaseToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setAvailableExperts(result.data || []);
        console.log(`✅ ${result.data?.length || 0} expert(s) disponible(s)`);
      } else {
        toast.error('Erreur lors du chargement des experts');
      }
    } catch (error) {
      console.error('Erreur chargement experts:', error);
      toast.error('Impossible de charger les experts');
    } finally {
      setLoading(false);
    }
  };
  
  // Valider l'expert proposé
  const validateExpert = async () => {
    if (!cpe.expert_id) return;
    
    try {
      setValidating(true);
      const response = await fetch(`${config.API_URL}/api/client/products/${cpe.id}/validate-expert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getSupabaseToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ expert_id: cpe.expert_id })
      });
      
      if (response.ok) {
        toast.success('Expert validé avec succès !');
        onExpertValidated();
      } else {
        toast.error('Erreur lors de la validation');
      }
    } catch (error) {
      console.error('Erreur validation:', error);
      toast.error('Erreur lors de la validation');
    } finally {
      setValidating(false);
    }
  };
  
  // Changer d'expert
  const selectExpert = async (expertId: string) => {
    try {
      setValidating(true);
      const response = await fetch(`${config.API_URL}/api/client/products/${cpe.id}/select-expert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getSupabaseToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ expert_id: expertId })
      });
      
      if (response.ok) {
        toast.success('Expert sélectionné avec succès !');
        setShowExpertSelector(false);
        onExpertValidated();
      } else {
        toast.error('Erreur lors de la sélection');
      }
    } catch (error) {
      console.error('Erreur sélection:', error);
      toast.error('Erreur lors de la sélection');
    } finally {
      setValidating(false);
    }
  };
  
  return (
    <Card className="p-4 border-2 border-gray-200">
      {/* Header Produit */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-semibold text-lg">{productName}</h4>
          {cpe.montantFinal > 0 && (
            <p className="text-sm text-green-600 font-medium">
              Économies estimées : {cpe.montantFinal.toLocaleString()}€
            </p>
          )}
        </div>
        <Badge variant={hasExpert ? "default" : "outline"}>
          {cpe.statut}
        </Badge>
      </div>
      
      {/* Expert proposé par l'apporteur */}
      {hasExpert && currentExpert ? (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">
                  Expert proposé par votre apporteur
                </span>
              </div>
              <div className="mt-2">
                <p className="font-medium text-gray-900">{currentExpert.name}</p>
                <p className="text-sm text-gray-600">{currentExpert.company_name}</p>
                <p className="text-xs text-gray-500 mt-1">{currentExpert.email}</p>
              </div>
              {currentExpert.specializations && currentExpert.specializations.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {currentExpert.specializations.slice(0, 3).map((spec, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {spec}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-yellow-600 ml-2">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-semibold">{currentExpert.rating || 4.5}/5</span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={validateExpert}
              disabled={validating}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {validating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Validation...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Valider cet expert
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowExpertSelector(true);
                loadExperts();
              }}
              disabled={validating}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Changer
            </Button>
          </div>
        </div>
      ) : (
        /* Aucun expert proposé */
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900">
                Aucun expert n'a été présélectionné pour ce produit
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Vous pouvez choisir un expert parmi les spécialistes disponibles
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setShowExpertSelector(true);
                  loadExperts();
                }}
                className="mt-3"
              >
                <Users className="h-4 w-4 mr-2" />
                Choisir un expert
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Sélecteur d'experts */}
      {showExpertSelector && (
        <div className="mt-4 p-4 border-2 border-blue-300 rounded-lg bg-blue-50">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-semibold text-gray-900">
              Experts disponibles
            </h5>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowExpertSelector(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Chargement...</p>
            </div>
          ) : availableExperts.length === 0 ? (
            <div className="text-center py-4 text-sm text-gray-500">
              <AlertCircle className="h-5 w-5 mx-auto mb-2 text-gray-400" />
              <p>Aucun expert disponible</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableExperts.map((expert) => (
                <Card
                  key={expert.id}
                  className={`p-3 cursor-pointer hover:bg-white transition-all ${
                    expert.id === cpe.expert_id ? 'border-2 border-blue-500' : 'border'
                  }`}
                  onClick={() => selectExpert(expert.id)}
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
                    <div className="flex items-center gap-1 text-yellow-600 ml-2">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm">{expert.rating || 4.5}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

