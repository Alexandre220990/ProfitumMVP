import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  ArrowRight, 
  Play, 
  Loader2,
  HelpCircle,
  CheckCircle
} from 'lucide-react';
import { config } from '@/config';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface Question {
  id: string; // UUID de QuestionnaireQuestion
  question_id?: string; // TICPE_001, DFS_001, etc.
  question_text: string;
  question_type: 'choix_unique' | 'choix_multiple' | 'nombre' | 'texte';
  question_order: number;
  section: string;
  options: {
    choix?: string[];
    min?: number;
    max?: number;
    unite?: string;
  };
  description?: string;
  validation_rules?: Record<string, any>;
  conditions?: Record<string, any>;
  importance?: number;
  produits_cibles?: string[];
}

interface ClientEmbeddedSimulatorProps {
  clientData?: {
    company_name?: string;
    secteurActivite?: string;
    nombreEmployes?: string;
    revenuAnnuel?: string;
  };
  prefilledAnswers?: Record<string, string | string[]>;
  onComplete: (answers: Record<string, string | string[]>) => void;
  onCancel?: () => void;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function ClientEmbeddedSimulator({ 
  clientData,
  prefilledAnswers = {},
  onComplete,
  onCancel
}: ClientEmbeddedSimulatorProps) {
  
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]); // Toutes les questions chargées
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(prefilledAnswers || {});
  const [loading, setLoading] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  
  // Charger les questions au montage
  useEffect(() => {
    loadQuestions();
  }, []);
  
  // Recalculer les questions visibles quand les réponses changent
  useEffect(() => {
    if (allQuestions.length > 0) {
      updateVisibleQuestions();
    }
  }, [answers, allQuestions]);
  
  const loadQuestions = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${config.API_URL}/api/simulator/questions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }
      
      const result = await response.json();
      const questionsData = result.questions || result.data || [];
      
      if (questionsData.length === 0) {
        toast.error('Aucune question disponible');
        return;
      }
      
      const sorted = questionsData.sort((a: Question, b: Question) => a.question_order - b.question_order);
      console.log(`✅ ${sorted.length} questions chargées`);
      
      setAllQuestions(sorted);
      // Initialiser avec les questions visibles
      setQuestions(getVisibleQuestions(sorted, {}));
      
    } catch (error) {
      console.error('❌ Erreur chargement questions:', error);
      toast.error(`Impossible de charger les questions: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Déterminer si une question est visible selon les conditions
   */
  const isQuestionVisible = (question: Question, currentAnswers: Record<string, string | string[]>): boolean => {
    if (!question.conditions || Object.keys(question.conditions).length === 0) {
      return true; // Pas de conditions = toujours visible
    }
    
    const { depends_on, value, operator } = question.conditions;
    
    if (!depends_on) return true;
    
    // Trouver la réponse à la question dépendante
    const dependentAnswer = currentAnswers[depends_on];
    
    if (!dependentAnswer) return false; // Question dépendante pas répondue
    
    // Évaluer la condition
    switch (operator) {
      case 'equals':
        return dependentAnswer === value;
      case 'not_equals':
        return dependentAnswer !== value;
      case 'includes':
        if (Array.isArray(dependentAnswer)) {
          return dependentAnswer.includes(value);
        }
        return dependentAnswer === value;
      default:
        return true;
    }
  };
  
  /**
   * Obtenir la liste des questions visibles selon les réponses actuelles
   */
  const getVisibleQuestions = (allQs: Question[], currentAnswers: Record<string, string | string[]>): Question[] => {
    return allQs.filter(q => isQuestionVisible(q, currentAnswers));
  };
  
  /**
   * Mettre à jour les questions visibles
   */
  const updateVisibleQuestions = () => {
    const visible = getVisibleQuestions(allQuestions, answers);
    setQuestions(visible);
    
    // Ajuster currentStep si la question actuelle n'est plus visible
    if (currentStep >= visible.length && visible.length > 0) {
      setCurrentStep(visible.length - 1);
    }
  };
  
  const currentQuestion = questions[currentStep];
  const progress = questions.length > 0 ? ((currentStep + 1) / questions.length) * 100 : 0;
  
  const handleAnswer = (value: string) => {
    if (!currentQuestion) return;
    
    const isMultiple = currentQuestion.question_type === 'choix_multiple';
    const isChoixUnique = currentQuestion.question_type === 'choix_unique';
    
    if (isMultiple) {
      // Choix multiple : toggle la valeur
      const current = (answers[currentQuestion.id] as string[]) || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: updated }));
    } else {
      // Choix unique : enregistrer et avancer
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
      
      if (isChoixUnique) {
        setTimeout(() => {
          handleNext();
        }, 300);
      }
    }
    
    setCurrentInput('');
  };
  
  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Dernière question - Retourner les réponses
      finishSimulation();
    }
  };
  
  const finishSimulation = () => {
    const answersCount = Object.keys(answers).length;
    
    if (answersCount === 0) {
      toast.error('Veuillez répondre à au moins une question');
      return;
    }
    
    console.log(`✅ Simulation terminée : ${answersCount} réponse(s)`);
    toast.success('Simulation terminée !');
    
    // Retourner les réponses au parent
    onComplete(answers);
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
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-8 border-2 border-purple-300">
        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="flex items-center justify-center">
            <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center">
              <Play className="h-10 w-10 text-white" />
            </div>
          </div>
          
          {/* Title */}
          <div>
            <h4 className="text-2xl font-bold text-gray-900 mb-2">
              Simulation d'Éligibilité
            </h4>
            <p className="text-gray-700">
              pour {clientData?.company_name || 'ce client'}
            </p>
          </div>
          
          {/* Bénéfices */}
          <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-3xl font-bold text-purple-600 mb-1">8-12</div>
              <p className="text-sm text-gray-600">Questions</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-3xl font-bold text-green-600 mb-1">~3min</div>
              <p className="text-sm text-gray-600">Temps estimé</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-3xl font-bold text-blue-600 mb-1">10+</div>
              <p className="text-sm text-gray-600">Produits analysés</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-3xl font-bold text-orange-600 mb-1">Auto</div>
              <p className="text-sm text-gray-600">Calcul intelligent</p>
            </div>
          </div>
          
          {/* Info */}
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-blue-900">
              Les produits éligibles seront calculés automatiquement selon les réponses fournies 🎯
            </p>
          </div>
          
          {/* Boutons */}
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
              disabled={loading || allQuestions.length === 0}
              className="px-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
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
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
        <p className="text-gray-600">Chargement des questions...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-300">
      {/* Header avec progression */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-bold text-gray-900">
              Question {currentStep + 1}/{questions.length}
            </h4>
            {currentQuestion.section && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                {currentQuestion.section}
              </span>
            )}
          </div>
          <span className="text-sm font-semibold text-purple-700">
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
              {currentQuestion.question_text}
            </h5>
            {currentQuestion.description && (
              <div className="flex items-start gap-2 text-sm text-gray-600 bg-purple-50 p-3 rounded-lg">
                <HelpCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <p>{currentQuestion.description}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Réponses */}
        <div className="space-y-3">
          {currentQuestion.question_type === 'choix_unique' && (
            <p className="text-xs text-purple-600 font-medium mb-2">
              ⚡ Cliquez sur votre choix pour avancer automatiquement
            </p>
          )}
          
          {currentQuestion.question_type === 'choix_unique' || currentQuestion.question_type === 'choix_multiple' ? (
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
                      ? 'bg-purple-600 text-white border-2 border-purple-700 shadow-md'
                      : 'bg-gray-50 text-gray-900 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                      ${isSelected ? 'border-white bg-white' : 'border-gray-400'}
                    `}>
                      {isSelected && <div className="w-3 h-3 bg-purple-600 rounded-full" />}
                    </div>
                    <span className="font-medium">{choix}</span>
                  </div>
                </button>
              );
            })
          ) : currentQuestion.question_type === 'nombre' ? (
            <div className="space-y-2">
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
              <p className="text-xs text-gray-500 italic">
                💡 Entrez votre réponse puis cliquez sur "Suivant"
              </p>
            </div>
          ) : (
            <div className="space-y-2">
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
              <p className="text-xs text-gray-500 italic">
                💡 Entrez votre réponse puis cliquez sur "Suivant"
              </p>
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
          {Object.keys(answers).length} réponse{Object.keys(answers).length > 1 ? 's' : ''}
        </div>
        
        <Button
          type="button"
          onClick={handleNext}
          disabled={!canGoNext() || loading}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600"
        >
          {currentStep === questions.length - 1 ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Terminer
            </>
          ) : (
            <>
              Suivant
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default ClientEmbeddedSimulator;

