import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Award,
  FileText,
  TrendingUp,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { ExpertSelectionCard } from './ExpertSelectionCard';

interface ClientProduitEligible {
  id: string;
  produitId: string;
  expert_id: string | null;
  montantFinal: number;
  statut: string;
  priorite: number;
  current_step: number;
  progress: number;
  metadata?: any;
  ProduitEligible?: {
    nom: string;
    description: string;
  };
  Expert?: {
    id: string;
    name: string;
    company_name: string;
    email: string;
    specializations: string[];
    rating: number;
  };
}

interface Props {
  products: ClientProduitEligible[];
  onRefresh: () => void;
  onNavigateToProduct: (id: string) => void;
}

export function ClientProductsWithExpertSelection({ 
  products, 
  onRefresh,
  onNavigateToProduct 
}: Props) {
  
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  
  const getProductIcon = (nom?: string) => {
    const nomLower = nom?.toLowerCase() || '';
    if (nomLower.includes('ticpe')) return <TrendingUp className="w-6 h-6" />;
    if (nomLower.includes('urssaf')) return <Award className="w-6 h-6" />;
    if (nomLower.includes('foncier')) return <FileText className="w-6 h-6" />;
    return <FileText className="w-6 h-6" />;
  };
  
  const getStatusConfig = (statut: string) => {
    switch (statut) {
      case 'eligible':
        return { color: 'bg-green-100 text-green-800', label: 'Éligible' };
      case 'to_confirm':
        return { color: 'bg-yellow-100 text-yellow-800', label: 'À confirmer' };
      case 'en_cours':
        return { color: 'bg-blue-100 text-blue-800', label: 'En cours' };
      default:
        return { color: 'bg-gray-100 text-gray-800', label: statut };
    }
  };
  
  const isFromApporteur = (product: ClientProduitEligible) => 
    product.metadata?.source?.includes('apporteur');
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => {
        const statusConfig = getStatusConfig(product.statut);
        const fromApporteur = isFromApporteur(product);
        const isExpanded = expandedProduct === product.id;
        
        return (
          <div key={product.id}>
            {/* Carte Produit Principale */}
            <Card 
              className={`p-4 cursor-pointer hover:shadow-lg transition-all border-2 ${
                fromApporteur ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'
              }`}
              onClick={() => {
                if (!product.expert_id && product.current_step === 0) {
                  // Si pas d'expert et pas encore commencé, expand pour choisir
                  setExpandedProduct(isExpanded ? null : product.id);
                } else {
                  // Sinon, naviguer vers la page du produit
                  onNavigateToProduct(product.id);
                }
              }}
            >
              {/* Badge Apporteur */}
              {fromApporteur && (
                <div className="mb-2">
                  <Badge className="bg-blue-600 text-white flex items-center gap-1 w-fit">
                    <UserCheck className="h-3 w-3" />
                    Recommandé par votre conseiller
                  </Badge>
                </div>
              )}
              
              {/* Header */}
              <CardContent className="p-0">
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-blue-600 p-2 bg-blue-50 rounded-lg">
                    {getProductIcon(product.ProduitEligible?.nom)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">
                      {product.ProduitEligible?.nom || 'Produit'}
                    </h3>
                    <Badge className={`${statusConfig.color} mt-1`}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>
                
                {/* Montant */}
                {product.montantFinal > 0 && (
                  <div className="bg-green-50 p-3 rounded-lg mb-3">
                    <p className="text-xs text-green-700">Économies estimées</p>
                    <p className="text-2xl font-bold text-green-600">
                      {product.montantFinal.toLocaleString()}€
                    </p>
                  </div>
                )}
                
                {/* Expert */}
                {product.expert_id && product.Expert ? (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-xs text-green-700 mb-1">Expert assigné</p>
                    <p className="text-sm font-semibold text-green-900">
                      {product.Expert.name}
                    </p>
                    <p className="text-xs text-green-600">
                      {product.Expert.company_name}
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="text-xs text-yellow-700 font-medium">
                      ⚠️ Aucun expert sélectionné
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      Cliquez pour choisir un expert
                    </p>
                  </div>
                )}
                
                {/* Bouton Action */}
                <div className="mt-4 pt-3 border-t">
                  <div className="flex items-center justify-between text-sm text-blue-600 font-medium">
                    <span>
                      {!product.expert_id && product.current_step === 0 
                        ? 'Choisir un expert' 
                        : 'Voir le dossier'}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Carte Expanded - Sélection Expert */}
            {isExpanded && !product.expert_id && (
              <div className="mt-2">
                <ExpertSelectionCard
                  cpe={product}
                  onExpertValidated={() => {
                    setExpandedProduct(null);
                    onRefresh();
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

