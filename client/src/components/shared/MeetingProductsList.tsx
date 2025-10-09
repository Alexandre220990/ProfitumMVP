import { Badge } from '@/components/ui/badge';
import { Euro, Trophy, CheckCircle, AlertTriangle } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface Product {
  id: string;
  name: string;
  score?: number;
  estimatedSavings: number;
  priority?: number;
}

interface MeetingProductsListProps {
  products: Product[];
  showSavings?: boolean;
  showScores?: boolean;
  compact?: boolean;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function MeetingProductsList({ 
  products, 
  showSavings = true,
  showScores = false,
  compact = false
}: MeetingProductsListProps) {
  
  const totalSavings = products.reduce((sum, p) => sum + p.estimatedSavings, 0);
  
  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {products.map((product) => (
          <Badge key={product.id} variant="outline" className="text-xs">
            {product.name}
          </Badge>
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {products.map((product) => (
        <div 
          key={product.id} 
          className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
        >
          <div className="flex items-center gap-3 flex-1">
            {/* Icône selon score */}
            {showScores && product.score && (
              product.score >= 80 ? (
                <Trophy className="h-4 w-4 text-green-600" />
              ) : product.score >= 60 ? (
                <CheckCircle className="h-4 w-4 text-blue-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              )
            )}
            
            {/* Numéro priorité */}
            {product.priority && product.priority <= 10 && (
              <span className="text-xs font-bold text-gray-500">#{product.priority}</span>
            )}
            
            {/* Nom */}
            <span className="font-medium text-gray-900">{product.name}</span>
            
            {/* Score */}
            {showScores && product.score && (
              <Badge 
                className={`text-xs ${
                  product.score >= 80 ? 'bg-green-600' :
                  product.score >= 60 ? 'bg-blue-600' :
                  'bg-orange-600'
                } text-white`}
              >
                {product.score}%
              </Badge>
            )}
          </div>
          
          {/* Économies */}
          {showSavings && (
            <div className="flex items-center gap-1 text-green-700">
              <Euro className="h-4 w-4" />
              <span className="text-sm font-semibold">
                ~{product.estimatedSavings.toLocaleString('fr-FR')}€
              </span>
            </div>
          )}
        </div>
      ))}
      
      {/* Total */}
      {showSavings && products.length > 1 && (
        <div className="pt-3 border-t-2 border-gray-300">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-2 border-green-300">
            <span className="font-bold text-gray-900">Total Économies</span>
            <div className="flex items-center gap-1 text-green-700">
              <Euro className="h-5 w-5" />
              <span className="text-lg font-bold">
                ~{totalSavings.toLocaleString('fr-FR')}€
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MeetingProductsList;

