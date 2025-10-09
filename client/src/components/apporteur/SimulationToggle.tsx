import { Zap, List, Sparkles, CheckCircle, TrendingUp, Users, Euro } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface SimulationToggleProps {
  mode: 'simulation' | 'manual';
  onModeChange: (mode: 'simulation' | 'manual') => void;
  disabled?: boolean;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function SimulationToggle({ mode, onModeChange, disabled = false }: SimulationToggleProps) {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-blue-600" />
          Identification des Produits Éligibles
        </h3>
        <p className="text-gray-600">
          Comment souhaitez-vous identifier les besoins de ce prospect ?
        </p>
      </div>
      
      {/* Toggle Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option Simulation */}
        <button
          type="button"
          onClick={() => !disabled && onModeChange('simulation')}
          disabled={disabled}
          className={`
            relative p-6 rounded-xl font-semibold transition-all duration-300 text-left
            ${mode === 'simulation'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50 scale-[1.02]'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {/* Badge Recommandé */}
          {mode === 'simulation' && (
            <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              ⚡ RECOMMANDÉ
            </div>
          )}
          
          <div className="flex items-start gap-3 mb-4">
            <Zap className={`h-6 w-6 flex-shrink-0 ${mode === 'simulation' ? 'text-white' : 'text-blue-600'}`} />
            <div className="flex-1">
              <h4 className="text-lg font-bold mb-1">Simulation Intelligente</h4>
              <p className={`text-sm ${mode === 'simulation' ? 'text-blue-100' : 'text-gray-600'}`}>
                Questionnaire court adaptatif
              </p>
            </div>
          </div>
          
          {/* Avantages */}
          <div className="space-y-2 pl-9">
            <div className="flex items-center gap-2">
              <CheckCircle className={`h-4 w-4 ${mode === 'simulation' ? 'text-green-300' : 'text-green-600'}`} />
              <span className={`text-sm ${mode === 'simulation' ? 'text-blue-50' : 'text-gray-700'}`}>
                5-8 questions pré-remplies
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-4 w-4 ${mode === 'simulation' ? 'text-green-300' : 'text-green-600'}`} />
              <span className={`text-sm ${mode === 'simulation' ? 'text-blue-50' : 'text-gray-700'}`}>
                Identification automatique précise
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className={`h-4 w-4 ${mode === 'simulation' ? 'text-green-300' : 'text-green-600'}`} />
              <span className={`text-sm ${mode === 'simulation' ? 'text-blue-50' : 'text-gray-700'}`}>
                Experts adaptés par produit
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Euro className={`h-4 w-4 ${mode === 'simulation' ? 'text-green-300' : 'text-green-600'}`} />
              <span className={`text-sm ${mode === 'simulation' ? 'text-blue-50' : 'text-gray-700'}`}>
                Économies estimées
              </span>
            </div>
          </div>
        </button>
        
        {/* Option Manuelle */}
        <button
          type="button"
          onClick={() => !disabled && onModeChange('manual')}
          disabled={disabled}
          className={`
            p-6 rounded-xl font-semibold transition-all duration-300 text-left
            ${mode === 'manual'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50 scale-[1.02]'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="flex items-start gap-3 mb-4">
            <List className={`h-6 w-6 flex-shrink-0 ${mode === 'manual' ? 'text-white' : 'text-gray-600'}`} />
            <div className="flex-1">
              <h4 className="text-lg font-bold mb-1">Sélection Manuelle</h4>
              <p className={`text-sm ${mode === 'manual' ? 'text-blue-100' : 'text-gray-600'}`}>
                Choisir manuellement les produits
              </p>
            </div>
          </div>
          
          {/* Avantages */}
          <div className="space-y-2 pl-9">
            <div className="flex items-center gap-2">
              <CheckCircle className={`h-4 w-4 ${mode === 'manual' ? 'text-green-300' : 'text-gray-500'}`} />
              <span className={`text-sm ${mode === 'manual' ? 'text-blue-50' : 'text-gray-700'}`}>
                Plus rapide si besoins connus
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`h-4 w-4 ${mode === 'manual' ? 'text-green-300' : 'text-gray-500'}`} />
              <span className={`text-sm ${mode === 'manual' ? 'text-blue-50' : 'text-gray-700'}`}>
                Contrôle total de la sélection
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`h-4 w-4 ${mode === 'manual' ? 'text-green-300' : 'text-gray-500'}`} />
              <span className={`text-sm ${mode === 'manual' ? 'text-blue-50' : 'text-gray-700'}`}>
                Liste complète des 10 produits
              </span>
            </div>
          </div>
        </button>
      </div>
      
      {/* Info supplémentaire selon mode */}
      <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
        <p className="text-sm text-blue-900">
          {mode === 'simulation' ? (
            <>
              <strong>💡 Astuce :</strong> Les données déjà saisies (budget, secteur, timeline) 
              seront automatiquement pré-remplies dans le questionnaire.
            </>
          ) : (
            <>
              <strong>💡 Astuce :</strong> Le système recommandera automatiquement 
              un expert pour chaque produit sélectionné.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default SimulationToggle;

