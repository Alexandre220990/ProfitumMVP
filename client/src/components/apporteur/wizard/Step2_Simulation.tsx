import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, PlayCircle } from 'lucide-react';
import { EmbeddedSimulator } from '../EmbeddedSimulator';

interface Step2Props {
  prospectId: string;
  prospectData: any;
  onComplete: (results: any) => void;
  onSkip: () => void;
  onBack: () => void;
}

export function Step2_Simulation({ 
  prospectId, 
  prospectData, 
  onComplete, 
  onSkip, 
  onBack 
}: Step2Props) {
  
  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-semibold text-purple-900 mb-1">
          Étape 2 : Simulation d'éligibilité (Optionnelle)
        </h3>
        <p className="text-sm text-purple-700">
          Lancez le simulateur intelligent pour identifier automatiquement les produits éligibles 
          et obtenir des recommandations d'experts optimisées.
        </p>
      </div>

      {/* Simulateur */}
      <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Simulateur IA</h3>
            <p className="text-sm text-gray-600">
              Pour {prospectData.company_name || 'ce prospect'}
            </p>
          </div>
          <PlayCircle className="h-8 w-8 text-purple-600" />
        </div>

        <EmbeddedSimulator
          prospectId={prospectId}
          prospectData={{
            company_name: prospectData.company_name,
            timeline: prospectData.timeline,
            secteur_activite: prospectData.company_name
          }}
          prefilledAnswers={{}}
          onComplete={onComplete}
          onCancel={onSkip}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={onSkip}
          className="text-gray-600"
        >
          Passer cette étape
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

