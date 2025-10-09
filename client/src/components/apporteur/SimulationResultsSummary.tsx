import React from 'react';
import { Trophy, CheckCircle, AlertTriangle, XCircle, Euro, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// ============================================================================
// TYPES
// ============================================================================

interface SimulationResultsSummaryProps {
  summary: {
    highly_eligible: number; // score >= 80
    eligible: number; // score 60-79
    to_confirm: number; // score 40-59
    not_eligible: number; // score < 40
  };
  totalSavings: number;
  prospectName: string;
  onReset?: () => void;
  onValidate?: () => void;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function SimulationResultsSummary({ 
  summary, 
  totalSavings, 
  prospectName,
  onReset,
  onValidate 
}: SimulationResultsSummaryProps) {
  
  const totalProducts = summary.highly_eligible + summary.eligible + summary.to_confirm + summary.not_eligible;
  const eligibleProducts = summary.highly_eligible + summary.eligible;
  
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-300 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
          <Check className="h-7 w-7 text-white" />
        </div>
        <div className="text-center">
          <h3 className="text-2xl font-bold text-green-900">
            Simulation Terminée !
          </h3>
          <p className="text-green-700">
            Résultats pour {prospectName}
          </p>
        </div>
      </div>
      
      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {/* Hautement éligible */}
        <Card className="p-4 bg-gradient-to-br from-green-100 to-green-50 border-green-300">
          <div className="flex flex-col items-center text-center">
            <Trophy className="h-8 w-8 text-green-600 mb-2" />
            <div className="text-3xl font-bold text-green-900">{summary.highly_eligible}</div>
            <div className="text-xs text-green-700 font-semibold">Hautement éligible</div>
            <div className="text-[10px] text-green-600 mt-1">Score ≥ 80%</div>
          </div>
        </Card>
        
        {/* Éligible */}
        <Card className="p-4 bg-gradient-to-br from-blue-100 to-blue-50 border-blue-300">
          <div className="flex flex-col items-center text-center">
            <CheckCircle className="h-8 w-8 text-blue-600 mb-2" />
            <div className="text-3xl font-bold text-blue-900">{summary.eligible}</div>
            <div className="text-xs text-blue-700 font-semibold">Éligible</div>
            <div className="text-[10px] text-blue-600 mt-1">Score 60-79%</div>
          </div>
        </Card>
        
        {/* À confirmer */}
        <Card className="p-4 bg-gradient-to-br from-orange-100 to-orange-50 border-orange-300">
          <div className="flex flex-col items-center text-center">
            <AlertTriangle className="h-8 w-8 text-orange-600 mb-2" />
            <div className="text-3xl font-bold text-orange-900">{summary.to_confirm}</div>
            <div className="text-xs text-orange-700 font-semibold">À confirmer</div>
            <div className="text-[10px] text-orange-600 mt-1">Score 40-59%</div>
          </div>
        </Card>
        
        {/* Non éligible */}
        <Card className="p-4 bg-gradient-to-br from-gray-100 to-gray-50 border-gray-300">
          <div className="flex flex-col items-center text-center">
            <XCircle className="h-8 w-8 text-gray-500 mb-2" />
            <div className="text-3xl font-bold text-gray-700">{summary.not_eligible}</div>
            <div className="text-xs text-gray-600 font-semibold">Non éligible</div>
            <div className="text-[10px] text-gray-500 mt-1">Score &lt; 40%</div>
          </div>
        </Card>
      </div>
      
      {/* Économies totales */}
      <div className="bg-white rounded-lg p-5 mb-6 border-2 border-green-400 shadow-md">
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <Euro className="h-6 w-6 text-white" />
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 font-medium">Économies Potentielles Totales</div>
            <div className="text-3xl font-bold text-green-600">
              ~{totalSavings.toLocaleString('fr-FR')} €
            </div>
            <div className="text-xs text-gray-500">Basé sur {eligibleProducts} produit{eligibleProducts > 1 ? 's' : ''} éligible{eligibleProducts > 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>
      
      {/* Résumé textuel */}
      <div className="bg-green-100 rounded-lg p-4 mb-6 border border-green-300">
        <p className="text-center text-green-900">
          <strong className="font-bold">{eligibleProducts} produit{eligibleProducts > 1 ? 's' : ''}</strong> identifié{eligibleProducts > 1 ? 's' : ''} 
          {summary.to_confirm > 0 && (
            <> + <strong className="font-bold text-orange-700">{summary.to_confirm}</strong> à confirmer</>
          )}
          {' '}sur {totalProducts} analysés
        </p>
      </div>
      
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onReset && (
          <Button 
            type="button"
            variant="outline" 
            onClick={onReset}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refaire la Simulation
          </Button>
        )}
        {onValidate && (
          <Button 
            type="button"
            onClick={onValidate}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 flex items-center justify-center gap-2"
          >
            <Check className="h-4 w-4" />
            Valider ces Résultats
          </Button>
        )}
      </div>
    </div>
  );
}

export default SimulationResultsSummary;

