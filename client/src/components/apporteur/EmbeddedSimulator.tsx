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
      
      // ✅ Utiliser la route publique /api/simulator/questions
      // au lieu de /api/simulations/questions (route protégée)
      const response = await fetch(`${config.API_URL}/api/simulator/questions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // La route /api/simulator/questions retourne { success: true, questions: [...] }
      // au lieu de { success: true, data: [...] }
      const questionsData = result.questions || result.data || [];
      
      if (questionsData.length === 0) {
        console.warn('⚠️ Aucune question chargée depuis l\'API');
        toast.error('Aucune question disponible pour le simulateur');
        return;
      }
      
      console.log(`✅ ${questionsData.length} questions chargées depuis /api/simulator/questions`);
      setQuestions(questionsData.sort((a: Question, b: Question) => a.ordre - b.ordre));
      
    } catch (error) {
      console.error('❌ Erreur chargement questions:', error);
      toast.error(`Impossible de charger les questions: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const currentQuestion = questions[currentStep];
  const progress = questions.length > 0 ? ((currentStep + 1) / questions.length) * 100 : 0;
  
  const handleAnswer = (value: string) => {
    if (!currentQuestion) return;
    
    const isMultiple = currentQuestion.type === 'choix_multiple';
    const isChoixUnique = currentQuestion.type === 'choix_unique';
    
    if (isMultiple) {
      // Choix multiple : juste enregistrer (pas d'avancement auto)
      const current = (answers[currentQuestion.id] as string[]) || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: updated }));
    } else {
      // Choix unique ou autre : enregistrer la réponse
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
      
      // ✅ AVANCEMENT AUTOMATIQUE pour choix unique
      if (isChoixUnique) {
        setTimeout(() => {
          handleNext();
        }, 300); // Petit délai pour voir la sélection
      }
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
      
      // ✅ VALIDATION 1 : Vérifier que prospectId existe
      if (!prospectId) {
        console.error('❌ Pas de prospectId - impossible de créer la simulation');
        toast.error('Erreur : Le prospect doit être créé avant de lancer la simulation');
        throw new Error('prospectId manquant');
      }
      
      // ✅ VALIDATION 2 : Vérifier qu'il y a des réponses
      const answersCount = Object.keys(answers).length;
      if (answersCount === 0) {
        console.error('❌ Aucune réponse fournie');
        toast.error('Veuillez répondre à au moins une question');
        throw new Error('Aucune réponse');
      }
      
      console.log(`📝 Envoi de ${answersCount} réponse(s) pour le prospect ${prospectId}`);
      
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
      
      // ✅ GESTION ERREURS HTTP DÉTAILLÉE
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        
        if (response.status === 401) {
          toast.error('Session expirée. Veuillez vous reconnecter.');
          throw new Error('Non authentifié (401)');
        } else if (response.status === 403) {
          toast.error('Accès refusé. Vous n\'avez pas les droits nécessaires.');
          throw new Error('Accès refusé (403)');
        } else if (response.status === 404) {
          toast.error('Prospect non trouvé. Veuillez créer le prospect d\'abord.');
          throw new Error('Prospect non trouvé (404)');
        } else if (response.status >= 500) {
          toast.error('Erreur serveur. Veuillez réessayer dans quelques instants.');
          throw new Error(`Erreur serveur (${response.status})`);
        } else {
          const errorMsg = errorData?.message || `Erreur ${response.status}`;
          toast.error(`Erreur : ${errorMsg}`);
          throw new Error(errorMsg);
        }
      }
      
      const result = await response.json();
      console.log('✅ Résultats de simulation reçus:', result);
      
      // ✅ VALIDATION 3 : Vérifier la structure de la réponse
      if (!result.success) {
        toast.error(result.message || 'Erreur lors du calcul d\'éligibilité');
        throw new Error(result.message || 'Réponse success: false');
      }
      
      if (!result.data) {
        toast.error('Aucune donnée retournée par le serveur');
        throw new Error('result.data est vide');
      }
      
      // ✅ VALIDATION 4 : Vérifier les produits éligibles
      const eligibleCount = result.data.eligible_products?.length || 0;
      
      if (eligibleCount === 0) {
        console.warn('⚠️ Aucun produit éligible identifié pour ce prospect');
        toast.warning('Aucun produit éligible identifié. Vous pouvez continuer en mode manuel.');
      } else {
        console.log(`✅ ${eligibleCount} produit(s) éligible(s) identifié(s)`);
        const totalSavings = result.data.total_savings || 0;
        toast.success(`${eligibleCount} produit(s) éligible(s) ! Économies estimées : ${totalSavings.toLocaleString()}€`);
      }
      
      // ✅ Retourner les résultats complets
      onComplete(result.data);
      
    } catch (error) {
      console.error('❌ Erreur soumission simulation:', error);
      
      // ✅ NE PAS faire de fallback silencieux - laisser l'utilisateur décider
      // L'erreur a déjà été affichée via toast, ne pas rappeler onComplete
      
      // Si vous voulez quand même offrir un fallback, décommenter :
      // if (onCancel) onCancel();
      
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
          {/* Indicateur pour choix unique */}
          {currentQuestion.type === 'choix_unique' && (
            <p className="text-xs text-blue-600 font-medium mb-2">
              ⚡ Cliquez sur votre choix pour avancer automatiquement
            </p>
          )}
          
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
                💡 Entrez votre réponse puis cliquez sur "Suivant" pour valider
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
                💡 Entrez votre réponse puis cliquez sur "Suivant" pour valider
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

