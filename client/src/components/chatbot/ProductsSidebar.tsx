import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Star, TrendingUp } from "lucide-react";

interface Product {
  id: string;
  nom: string;
  description: string;
  priority?: 'high' | 'medium' | 'low';
  gainPotentiel?: number;
  score?: number;
  reasons?: string[];
}

interface ProductsSidebarProps {
  products: Product[];
  clientProfile?: {
    secteur?: string;
    nombreEmployes?: number;
  };
  onProductClick: (product: Product) => void;
}

export const ProductsSidebar: React.FC<ProductsSidebarProps> = ({
  products,
  clientProfile,
  onProductClick
}) => {
  if (products.length === 0) {
    return (
      <div className="w-80 bg-gray-50 border-l border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          🎯 Produits Éligibles
        </h3>
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-2">💼</div>
          <p className="text-sm">
            Répondez aux questions pour découvrir vos produits éligibles
          </p>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'high': return <Star className="w-3 h-3" />;
      case 'medium': return <TrendingUp className="w-3 h-3" />;
      default: return null;
    }
  };

  const getPriorityLabel = (priority?: string) => {
    switch (priority) {
      case 'high': return 'Priorité élevée';
      case 'medium': return 'Recommandé';
      case 'low': return 'À considérer';
      default: return 'Éligible';
    }
  };

  return (
    <div className="w-80 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          🎯 Produits Éligibles
        </h3>
        {clientProfile?.secteur && (
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary" className="text-xs">
              {clientProfile.secteur}
            </Badge>
            {clientProfile.nombreEmployes && (
              <Badge variant="outline" className="text-xs">
                {clientProfile.nombreEmployes} employé{clientProfile.nombreEmployes > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        )}
        <p className="text-sm text-gray-600">
          {products.length} produit{products.length > 1 ? 's' : ''} adapté{products.length > 1 ? 's' : ''} à votre profil
        </p>
      </div>

      <div className="space-y-3">
        {products.map((product) => (
          <Card 
            key={product.id} 
            className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-blue-300"
            onClick={() => onProductClick(product)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-sm font-medium text-gray-900 leading-tight">
                    {product.nom}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge 
                      className={`text-xs flex items-center gap-1 ${getPriorityColor(product.priority)}`}
                    >
                      {getPriorityIcon(product.priority)}
                      {getPriorityLabel(product.priority)}
                    </Badge>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-xs text-gray-600 line-clamp-2">
                {product.description}
              </CardDescription>
              
              {product.gainPotentiel && (
                <div className="mt-2 p-2 bg-green-50 rounded-md border border-green-200">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium text-green-800">💰 Gain potentiel :</span>
                    <span className="text-xs font-bold text-green-900">
                      {product.gainPotentiel.toLocaleString()}€
                    </span>
                  </div>
                </div>
              )}
              
              {product.score && (
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-xs text-gray-500">Score :</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full" 
                      style={{width: `${Math.min(product.score, 100)}%`}}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600">{product.score}%</span>
                </div>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-3 text-xs h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onProductClick(product);
                }}
              >
                En savoir plus
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-sm font-medium text-blue-800">Conseil</span>
        </div>
        <p className="text-xs text-blue-700">
          Les produits affichés sont basés sur votre profil. Pour des recommandations plus précises, 
          partagez plus de détails sur votre situation.
        </p>
      </div>
    </div>
  );
}; 