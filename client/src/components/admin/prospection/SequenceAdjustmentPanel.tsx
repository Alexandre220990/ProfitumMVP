/**
 * Panneau d'affichage des ajustements automatiques de séquence
 * Montre les recommandations IA sur le nombre d'emails optimal
 */

import React from 'react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  CheckCircle2,
  Info,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface SequenceAdjustmentPanelProps {
  adjustment: {
    adjusted: boolean;
    original_num?: number;
    new_num?: number;
    change?: number;
    rationale?: string;
  };
  sequence: {
    steps: any[];
    meta: {
      nombre_emails: number;
      timing_strategy: string;
      enrichment_completeness: number;
      potentiel_total: number;
    };
  };
  onAccept?: () => void;
  onReject?: () => void;
}

export const SequenceAdjustmentPanel: React.FC<SequenceAdjustmentPanelProps> = ({
  adjustment,
  sequence,
  onAccept,
  onReject
}) => {
  const { adjusted, original_num, new_num, change, rationale } = adjustment;

  // Pas d'ajustement
  if (!adjusted || change === 0) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-900">Configuration optimale</AlertTitle>
        <AlertDescription className="text-green-700">
          Le nombre d'emails recommandé par l'IA ({sequence.meta.nombre_emails}) correspond à votre configuration.
          Aucun ajustement nécessaire.
        </AlertDescription>
      </Alert>
    );
  }

  // Ajustement effectué
  const changeValue = change || 0;
  const isIncrease = changeValue > 0;
  const icon = isIncrease ? (
    <TrendingUp className="h-6 w-6 text-blue-600" />
  ) : (
    <TrendingDown className="h-6 w-6 text-orange-600" />
  );

  return (
    <div className="space-y-4">
      <Alert className={`border-2 ${isIncrease ? 'border-blue-200 bg-blue-50' : 'border-orange-200 bg-orange-50'}`}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="font-bold">
          Ajustement automatique détecté
        </AlertTitle>
        <AlertDescription>
          L'IA recommande un ajustement du nombre d'emails pour optimiser les résultats.
        </AlertDescription>
      </Alert>

      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {icon}
            <span>
              {isIncrease ? 'Augmentation' : 'Réduction'} recommandée
            </span>
          </CardTitle>
          <CardDescription>
            Analyse contextuelle automatique basée sur : timing, attractivité du prospect, période
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Visualisation de l'ajustement */}
          <div className="flex items-center justify-center gap-4 p-6 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Configuration initiale</div>
              <div className="text-4xl font-bold text-gray-400">{original_num}</div>
              <div className="text-xs text-gray-500 mt-1">emails</div>
            </div>

            <div className="flex flex-col items-center">
              {isIncrease ? (
                <ArrowUp className="h-8 w-8 text-blue-600 animate-bounce" />
              ) : (
                <ArrowDown className="h-8 w-8 text-orange-600 animate-bounce" />
              )}
              <Badge variant={isIncrease ? "default" : "secondary"} className="mt-2">
                {changeValue > 0 && '+'}{changeValue}
              </Badge>
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Recommandation IA</div>
              <div className={`text-4xl font-bold ${isIncrease ? 'text-blue-600' : 'text-orange-600'}`}>
                {new_num}
              </div>
              <div className="text-xs text-gray-500 mt-1">emails</div>
            </div>
          </div>

          {/* Rationale */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold text-gray-900 mb-2">
                  Justification de l'ajustement
                </div>
                <div className="text-sm text-gray-700 leading-relaxed">
                  {rationale}
                </div>
              </div>
            </div>
          </div>

          {/* Métriques de contexte */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Stratégie timing</div>
              <div className="text-sm font-semibold text-purple-700">
                {sequence.meta.timing_strategy.split('_').join(' ')}
              </div>
            </div>

            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Potentiel détecté</div>
              <div className="text-sm font-semibold text-green-700">
                {(sequence.meta.potentiel_total / 1000).toFixed(0)}k€/an
              </div>
            </div>

            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Complétude données</div>
              <div className="text-sm font-semibold text-blue-700">
                {sequence.meta.enrichment_completeness}%
              </div>
            </div>
          </div>

          {/* Actions (si callbacks fournis) */}
          {(onAccept || onReject) && (
            <div className="flex gap-3 pt-4 border-t">
              {onAccept && (
                <Button 
                  onClick={onAccept} 
                  className="flex-1"
                  variant="default"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Accepter la recommandation
                </Button>
              )}
              {onReject && (
                <Button 
                  onClick={onReject} 
                  className="flex-1"
                  variant="outline"
                >
                  Garder la configuration initiale
                </Button>
              )}
            </div>
          )}

          {/* Note informative */}
          <div className="text-xs text-gray-500 text-center bg-gray-100 p-3 rounded">
            <Info className="h-3 w-3 inline mr-1" />
            Cette recommandation est basée sur l'analyse contextuelle automatique (timing, période, attractivité).
            La séquence a déjà été générée avec le nombre optimal recommandé.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SequenceAdjustmentPanel;

