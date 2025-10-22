import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Users, AlertCircle } from 'lucide-react';
import { ProductWithManualExpertSelector } from '../ProductWithManualExpertSelector';
import { toast } from 'sonner';
import { config } from '@/config';

interface Step3Props {
  prospectId: string;
  simulationResults: any;
  selectedExperts: Record<string, string | null>;
  onUpdate: (experts: Record<string, string | null>) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export function Step3_ExpertSelection({
  prospectId,
  simulationResults,
  selectedExperts,
  onUpdate,
  onNext,
  onSkip,
  onBack
}: Step3Props) {
  
  const [saving, setSaving] = React.useState(false);
  
  const products = simulationResults?.eligible_products || [];
  const hasProducts = products.length > 0;
  
  const handleExpertSelection = (productId: string, expertId: string | null) => {
    const updated = { ...selectedExperts, [productId]: expertId };
    onUpdate(updated);
  };
  
  const handleSaveAndContinue = async () => {
    // Compter les experts sélectionnés
    const selectedCount = Object.values(selectedExperts).filter(id => id !== null).length;
    
    if (selectedCount === 0) {
      // Aucun expert sélectionné, juste passer à l'étape suivante
      onNext();
      return;
    }
    
    setSaving(true);
    
    try {
      // Sauvegarder les assignations via l'API
      const updates = Object.entries(selectedExperts)
        .filter(([_, expertId]) => expertId !== null)
        .map(([cpeId, expertId]) => ({
          product_id: cpeId,
          expert_id: expertId
        }));
      
      const response = await fetch(
        `${config.API_URL}/api/apporteur/prospects/${prospectId}/assign-experts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ expert_assignments: updates })
        }
      );
      
      if (!response.ok) {
        throw new Error('Erreur assignation experts');
      }
      
      const result = await response.json();
      toast.success(`${selectedCount} expert(s) assigné(s) avec succès !`);
      onNext();
      
    } catch (error) {
      console.error('❌ Erreur assignation:', error);
      toast.error('Erreur lors de l\'assignation des experts');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-1">
          Étape 3 : Sélection des experts (Optionnelle)
        </h3>
        <p className="text-sm text-blue-700">
          Pour chaque produit éligible, vous pouvez sélectionner un expert ou laisser le choix au client.
        </p>
      </div>

      {/* Contenu */}
      {!hasProducts ? (
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune simulation effectuée
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Vous devez d'abord effectuer une simulation pour identifier les produits éligibles.
          </p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retourner à la simulation
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-gray-700" />
            <h3 className="text-lg font-semibold">
              {products.length} produit(s) éligible(s)
            </h3>
          </div>
          
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              💡 Pour chaque produit, sélectionnez un expert ou laissez vide. 
              Le client pourra valider ou choisir lui-même sur son espace.
            </p>
          </div>

          {products.map((product: any) => (
            <ProductWithManualExpertSelector
              key={product.id}
              product={product}
              selectedExpertId={selectedExperts[product.id]}
              onExpertSelected={handleExpertSelection}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={saving}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onSkip}
            disabled={saving}
            className="text-gray-600"
          >
            Passer cette étape
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          
          <Button
            type="button"
            onClick={handleSaveAndContinue}
            disabled={saving || !hasProducts}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? 'Enregistrement...' : 'Valider et Continuer'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

