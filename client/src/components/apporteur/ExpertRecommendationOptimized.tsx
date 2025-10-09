import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Star, 
  CheckCircle, 
  FileText, 
  TrendingUp,
  Lightbulb,
  AlertTriangle
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface ExpertRecommendation {
  expert: {
    id: string;
    name: string;
    company_name: string;
    rating: number;
  };
  products: Array<{
    id: string;
    name: string;
    score: number;
    estimatedSavings: number;
  }>;
  combinedScore: number;
  estimatedDuration: number;
  estimatedSavings: number;
}

interface ExpertRecommendationOptimizedProps {
  recommendation: ExpertRecommendation;
  isSelected: boolean;
  onSelect: () => void;
  onViewProfile?: () => void;
  showAdvantages?: boolean;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function ExpertRecommendationOptimized({ 
  recommendation,
  isSelected,
  onSelect,
  onViewProfile,
  showAdvantages = true
}: ExpertRecommendationOptimizedProps) {
  
  const isMultiProduct = recommendation.products.length > 1;
  
  return (
    <Card 
      className={`
        p-5 cursor-pointer transition-all duration-300 border-2
        ${isSelected 
          ? 'ring-4 ring-purple-400 bg-purple-50 border-purple-500 shadow-xl' 
          : 'hover:bg-purple-50 border-purple-200 hover:border-purple-400 hover:shadow-lg'
        }
      `}
      onClick={onSelect}
    >
      {/* Header Expert */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          {/* Avatar */}
          <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
            isSelected ? 'bg-purple-600' : 'bg-purple-300'
          }`}>
            <User className={`h-7 w-7 ${isSelected ? 'text-white' : 'text-purple-700'}`} />
          </div>
          
          {/* Infos */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-gray-900 truncate">{recommendation.expert.name}</h4>
              {isSelected && (
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-gray-600 truncate">{recommendation.expert.company_name}</p>
          </div>
          
          {/* Rating */}
          <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1.5 rounded-lg flex-shrink-0">
            <Star className="h-4 w-4 text-yellow-600 fill-current" />
            <span className="font-bold text-sm text-yellow-900">
              {recommendation.expert.rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Badge Multi-produits */}
      {isMultiProduct && (
        <div className="mb-4">
          <Badge className="bg-green-600 text-white">
            <TrendingUp className="h-3 w-3 mr-1" />
            Traite {recommendation.products.length} produits en 1 RDV
          </Badge>
        </div>
      )}
      
      {/* Produits */}
      <div className="bg-white rounded-lg p-4 mb-4 border border-purple-200">
        <p className="text-xs font-semibold text-gray-700 mb-3">
          {isMultiProduct ? 'Produits traités :' : 'Produit traité :'}
        </p>
        <div className="space-y-2">
          {recommendation.products.map((product) => (
            <div key={product.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {product.score >= 80 ? (
                  <span className="text-base">🏆</span>
                ) : product.score >= 60 ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                )}
                <span className="font-medium text-gray-900">{product.name}</span>
                <span className="text-xs text-gray-500">(Match: {product.score}%)</span>
              </div>
              <span className="text-xs text-green-700 font-semibold">
                ~{product.estimatedSavings.toLocaleString('fr-FR')}€
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-purple-100 rounded p-2 text-center">
          <div className="text-lg font-bold text-purple-900">{recommendation.combinedScore}%</div>
          <div className="text-[10px] text-purple-700">Score Moyen</div>
        </div>
        <div className="bg-blue-100 rounded p-2 text-center">
          <div className="text-lg font-bold text-blue-900">{recommendation.estimatedDuration}</div>
          <div className="text-[10px] text-blue-700">Minutes</div>
        </div>
        <div className="bg-green-100 rounded p-2 text-center">
          <div className="text-lg font-bold text-green-900">~{(recommendation.estimatedSavings / 1000).toFixed(0)}k€</div>
          <div className="text-[10px] text-green-700">Économies</div>
        </div>
      </div>
      
      {/* Avantages */}
      {showAdvantages && isMultiProduct && (
        <div className="bg-green-50 border border-green-300 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-green-900">
              <p className="font-semibold mb-1">Avantage : Expert Multi-Spécialités</p>
              <p>Traite {recommendation.products.length} produits en 1 seul RDV, simplifie l'organisation pour le client.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Actions */}
      {onViewProfile && (
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile();
            }}
            className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <FileText className="h-4 w-4 mr-2" />
            Voir Profil Complet
          </Button>
        </div>
      )}
      
      {/* Checkbox selection */}
      <div className={`mt-4 p-3 rounded-lg border-2 ${
        isSelected 
          ? 'bg-purple-600 border-purple-700' 
          : 'bg-white border-purple-200'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
            isSelected ? 'border-white bg-white' : 'border-gray-400'
          }`}>
            {isSelected && <div className="w-3 h-3 bg-purple-600 rounded" />}
          </div>
          <span className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-700'}`}>
            {isSelected ? '✓ Expert sélectionné' : 'Cliquez pour sélectionner'}
          </span>
        </div>
      </div>
    </Card>
  );
}

export default ExpertRecommendationOptimized;

