import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  ArrowRight, 
  Play, 
  Loader2,
  HelpCircle
} from 'lucide-react';
import { config } from '@/config';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface Question {
  id: string; // UUID de QuestionnaireQuestion
  texte: string;
  type: 'choix_unique' | 'choix_multiple' | 'nombre' | 'texte';
  ordre: number;
  categorie: string;
  options: {
    choix?: string[];
    min?: number;
    max?: number;
    unite?: string;
  };
  description?: string;
}

interface EmbeddedSimulatorProps {
  prospectId?: string;
  prospectData?: {
    company_name?: string;
    budget_range?: string;
    timeline?: string;
    secteur_activite?: string;
  };
  prefilledAnswers?: Record<string, string | string[]>; // UUID keys
  onComplete: (results: any) => void; // Peut être answers OU ProspectSimulationResult
  onCancel?: () => void;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function EmbeddedSimulator({ 
  prospectId,
  prospectData,
  prefilledAnswers = {},
  onComplete,
  onCancel
}: EmbeddedSimulatorProps) {
  
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(prefilledAnswers || {});
  const [loading, setLoading] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  
  // Charger les questions
  useEffect(() => {
    loadQuestions();
  }, []);
  
  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.API_URL}/api/simulations/questions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Erreur chargement questions');
      
      const result = await response.json();
      const questionsData = result.data || [];
      
      setQuestions(questionsData.sort((a: Question, b: Question) => a.ordre - b.ordre));
    } catch (error) {
      console.error('Erreur chargement questions:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const currentQuestion = questions[currentStep];
  const progress = questions.length > 0 ? ((currentStep + 1) / questions.length) * 100 : 0;
  
  const handleAnswer = (value: string) => {
    if (!currentQuestion) return;
    
    const isMultiple = currentQuestion.type === 'choix_multiple';
    
    if (isMultiple) {
      const current = (answers[currentQuestion.id] as string[]) || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: updated }));
    } else {
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
    }
    
    setCurrentInput('');
  };
  
  const handleNext = async () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Dernière question - Soumettre au backend pour calcul
      await submitSimulation();
    }
  };
  
  /**
   * Soumettre la simulation au backend pour calcul de l'éligibilité
   */
  const submitSimulation = async () => {
    try {
      setLoading(true);
      console.log('🚀 Soumission de la simulation au backend...');
      
      // Si on n'a pas de prospectId, on ne peut pas créer la simulation
      if (!prospectId) {
        console.error('❌ Pas de prospectId - impossible de créer la simulation');
        onComplete(answers); // Fallback sur l'ancien comportement
        return;
      }
      
      const response = await fetch(`${config.API_URL}/api/apporteur/prospects/${prospectId}/simulation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answers: answers,
          prospect_data: prospectData
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Résultats de simulation reçus:', result);
      
      // Retourner les résultats complets au lieu des réponses brutes
      if (result.success && result.data) {
        onComplete(result.data);
      } else {
        throw new Error(result.message || 'Erreur lors du calcul');
      }
      
    } catch (error) {
      console.error('❌ Erreur soumission simulation:', error);
      toast.error('Erreur lors du calcul de l\'éligibilité');
      // Fallback sur l'ancien comportement en cas d'erreur
      onComplete(answers);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const canGoNext = () => {
    if (!currentQuestion) return false;
    const answer = answers[currentQuestion.id];
    if (!answer) return false;
    if (Array.isArray(answer)) return answer.length > 0;
    return answer.toString().length > 0;
  };
  
  // État initial : Présentation
  if (!started) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border-2 border-blue-300">
        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="flex items-center justify-center">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
              <Play className="h-10 w-10 text-white" />
            </div>
          </div>
          
          {/* Title */}
          <div>
            <h4 className="text-2xl font-bold text-gray-900 mb-2">
              Simulation Intelligente
            </h4>
            <p className="text-gray-700">
              pour {prospectData?.company_name || 'votre prospect'}
            </p>
          </div>
          
          {/* Bénéfices */}
          <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-3xl font-bold text-blue-600 mb-1">{questions.length || '8'}</div>
              <p className="text-sm text-gray-600">Questions courtes</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-3xl font-bold text-green-600 mb-1">~2min</div>
              <p className="text-sm text-gray-600">Temps estimé</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-3xl font-bold text-purple-600 mb-1">10</div>
              <p className="text-sm text-gray-600">Produits analysés</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-3xl font-bold text-orange-600 mb-1">Auto</div>
              <p className="text-sm text-gray-600">Experts recommandés</p>
            </div>
          </div>
          
          {/* Info pré-remplissage */}
          {Object.keys(prefilledAnswers).length > 0 && (
            <div className="bg-green-100 border border-green-300 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-green-900">
                <strong className="font-bold">{Object.keys(prefilledAnswers).length} question{Object.keys(prefilledAnswers).length > 1 ? 's' : ''}</strong> déjà pré-remplie{Object.keys(prefilledAnswers).length > 1 ? 's' : ''} avec les données du formulaire ! ✨
              </p>
            </div>
          )}
          
          {/* Bouton démarrer */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onCancel && (
              <Button 
                type="button"
                variant="outline" 
                onClick={onCancel}
                className="px-8"
              >
                Annuler
              </Button>
            )}
            <Button 
              type="button"
              onClick={() => setStarted(true)}
              disabled={loading}
              className="px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Chargement...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Démarrer la Simulation
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // État questionnaire
  if (!currentQuestion) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Chargement des questions...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-300">
      {/* Header avec progression */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-bold text-gray-900">
              Question {currentStep + 1}/{questions.length}
            </h4>
            {currentQuestion.categorie && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {currentQuestion.categorie}
              </span>
            )}
          </div>
          <span className="text-sm font-semibold text-blue-700">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      {/* Question */}
      <div className="bg-white rounded-lg p-6 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="text-2xl">💼</div>
          <div className="flex-1">
            <h5 className="text-lg font-bold text-gray-900 mb-2">
              {currentQuestion.texte}
            </h5>
            {currentQuestion.description && (
              <div className="flex items-start gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <HelpCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p>{currentQuestion.description}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Réponses */}
        <div className="space-y-3">
          {currentQuestion.type === 'choix_unique' || currentQuestion.type === 'choix_multiple' ? (
            currentQuestion.options.choix?.map((choix, index) => {
              const isSelected = Array.isArray(answers[currentQuestion.id])
                ? (answers[currentQuestion.id] as string[]).includes(choix)
                : answers[currentQuestion.id] === choix;
              
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleAnswer(choix)}
                  className={`
                    w-full p-4 rounded-lg text-left transition-all duration-200
                    ${isSelected
                      ? 'bg-blue-600 text-white border-2 border-blue-700 shadow-md'
                      : 'bg-gray-50 text-gray-900 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                      ${isSelected ? 'border-white bg-white' : 'border-gray-400'}
                    `}>
                      {isSelected && <div className="w-3 h-3 bg-blue-600 rounded-full" />}
                    </div>
                    <span className="font-medium">{choix}</span>
                  </div>
                </button>
              );
            })
          ) : currentQuestion.type === 'nombre' ? (
            <div>
              <Input
                type="number"
                min={currentQuestion.options.min}
                max={currentQuestion.options.max}
                value={answers[currentQuestion.id] || currentInput}
                onChange={(e) => {
                  setCurrentInput(e.target.value);
                  setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }));
                }}
                placeholder={`Entrez un nombre${currentQuestion.options.unite ? ` (${currentQuestion.options.unite})` : ''}`}
                className="text-lg p-4"
              />
            </div>
          ) : (
            <div>
              <Input
                type="text"
                value={answers[currentQuestion.id] || currentInput}
                onChange={(e) => {
                  setCurrentInput(e.target.value);
                  setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }));
                }}
                placeholder="Votre réponse..."
                className="text-lg p-4"
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Précédent
        </Button>
        
        <div className="text-sm text-gray-600">
          {Object.keys(answers).length} / {questions.length} réponses
        </div>
        
        <Button
          type="button"
          onClick={handleNext}
          disabled={!canGoNext() || loading}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Calcul en cours...
            </>
          ) : (
            <>
              {currentStep === questions.length - 1 ? 'Terminer' : 'Suivant'}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default EmbeddedSimulator;

