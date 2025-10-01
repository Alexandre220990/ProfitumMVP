import { useEffect, useState } from "react";
import { useQuestionnaireLogic, QuestionnaireQuestion } from "../hooks/use-questionnaire-logic";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from 'sonner';

interface IntelligentQuestionnaireProps { 
  questions: QuestionnaireQuestion[];
  onComplete: (responses: Record<string, any>) => void;
  onQuestionChange?: (question: QuestionnaireQuestion) => void;
  initialResponses?: Record<string, any>;
  showProgress?: boolean;
  showNavigation?: boolean; 
}

export function IntelligentQuestionnaire({ 
  questions, 
  onComplete, 
  onQuestionChange, 
  initialResponses = {}, 
  showProgress = true,
  showNavigation = true
}: IntelligentQuestionnaireProps) { 
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    filteredQuestions, responses, updateResponse, isQuestionVisible, isQuestionRequired, getNextQuestion, progress, totalVisibleQuestions, answeredQuestions, isQuestionnaireComplete, getValidationErrors } = useQuestionnaireLogic({ questions, initialResponses });

  const currentQuestion = filteredQuestions[currentQuestionIndex];

  // Effet pour gérer les changements de questions visibles
  useEffect(() => { if (filteredQuestions.length === 0) return;

    // Si la question actuelle n'est plus visible, passer à la suivante
    if (currentQuestion && !isQuestionVisible(currentQuestion)) {
      const nextQuestion = getNextQuestion(currentQuestion.question_id);
      if (nextQuestion) {
        const nextIndex = filteredQuestions.findIndex(q => q.question_id === nextQuestion.question_id);
        setCurrentQuestionIndex(nextIndex); }
    }

    // Notifier le changement de question
    if (currentQuestion && onQuestionChange) { onQuestionChange(currentQuestion); }
  }, [filteredQuestions, currentQuestion, isQuestionVisible, getNextQuestion, onQuestionChange]);

  // Gérer la réponse à une question
  const handleResponse = (value: any) => { if (!currentQuestion) return;

    updateResponse(currentQuestion.question_id, value);
    
    // Auto-avancement pour certaines questions
    if (currentQuestion.question_type === 'choix_unique' && 
        currentQuestion.question_id === 'TICPE_003' && 
        value === 'Non') {
      // Si pas de véhicules, passer directement aux questions finales
      setTimeout(() => {
        const finalQuestions = filteredQuestions.filter(q => 
          q.phase === 6 || q.question_id === 'TICPE_016' || q.question_id === 'TICPE_017'
        );
        if (finalQuestions.length > 0) {
          const finalIndex = filteredQuestions.findIndex(q => q.question_id === finalQuestions[0].question_id);
          setCurrentQuestionIndex(finalIndex); }
      }, 500);
    }
  };

  // Passer à la question suivante
  const handleNext = () => { if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1); }
  };

  // Passer à la question précédente
  const handlePrevious = () => { if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1); }
  };

  // Terminer le questionnaire
  const handleComplete = async () => { const errors = getValidationErrors();
    if (errors.length > 0) {
      toast.error(`Validation requise: ${errors.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    try { await onComplete(responses); } catch (error) { toast.error("Impossible de terminer le questionnaire");
    } finally { setIsSubmitting(false); }
  };

  // Rendu d'une question selon son type
  const renderQuestion = (question: QuestionnaireQuestion) => { const currentValue = responses[question.question_id];

    switch (question.question_type) {
      case 'choix_unique':
        return (
          <div className="space-y-4">
            {question.options?.choix?.map((option: string, index: number) => (
              <label
                key={index}
                className="flex items-center space-x-4 p-4 border-2 border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 cursor-pointer"
              >
                <input
                  type="radio"
                  name={question.question_id}
                  value={option}
                  checked={currentValue === option}
                  onChange={(e) => handleResponse(e.target.value)}
                  className="w-5 h-5 text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span className="font-medium text-slate-800">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'choix_multiple':
        return (
          <div className="space-y-4">
            {question.options?.choix?.map((option: string, index: number) => (
              <label
                key={index}
                className="flex items-center space-x-4 p-4 border-2 border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 cursor-pointer"
              >
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(currentValue) && currentValue.includes(option)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(currentValue) ? currentValue : [];
                    if (e.target.checked) {
                      handleResponse([...currentValues, option]);
                    } else {
                      handleResponse(currentValues.filter(v => v !== option));
                    }
                  }}
                  className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="font-medium text-slate-800">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'nombre':
        return (
          <div className="space-y-4">
            <input
              type="number"
              value={ currentValue || '' }
              onChange={ (e) => handleResponse(parseFloat(e.target.value) || 0) }
              placeholder={ question.options?.placeholder || 'Entrez un nombre' }
              min={ question.options?.min }
              max={ question.options?.max }
              className="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            {question.options?.unite && (
              <span className="text-sm text-slate-600">Unité: {question.options.unite}</span>
            )}
          </div>
        );

      default: return (
          <input
            type="text"
            value={currentValue || ''}
            onChange={ (e) => handleResponse(e.target.value) }
            placeholder="Votre réponse..."
            className="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        ); }
  };

  if (!currentQuestion) { return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Aucune question disponible
            </h3>
            <p className="text-slate-600">
              Aucune question ne correspond à vos critères actuels.
            </p>
          </div>
        </CardContent>
      </Card>
    ); }

  return (<div className="w-full max-w-2xl mx-auto space-y-6">
      { /* Barre de progression */ }
      { showProgress && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">
                Progression: {Math.round(progress) }%
              </span>
              <span className="text-sm text-slate-600">
                { answeredQuestions }/{ totalVisibleQuestions } questions
              </span>
            </div>
            <Progress value={ progress } className="w-full" />
          </CardContent>
        </Card>
      )}

      { /* Question actuelle */ }
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-xl font-semibold text-slate-800">
              { currentQuestion.question_text }
            </span>
            { responses[currentQuestion.question_id] && (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) }
          </CardTitle>
          { currentQuestion.question_id.startsWith('TICPE_') && (
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                TICPE
              </span>
              <span className="text-sm text-slate-600">
                Phase {currentQuestion.phase }
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          { renderQuestion(currentQuestion) }
          
          { /* Indicateur de question requise */ }
          { isQuestionRequired(currentQuestion) && (
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <AlertCircle className="w-4 h-4" />
              <span>Cette question est obligatoire</span>
            </div>
          ) }
        </CardContent>
      </Card>

      { /* Navigation */ }
      { showNavigation && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious }
            disabled={ currentQuestionIndex === 0 }
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Précédent</span>
          </Button>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-600">
              { currentQuestionIndex + 1 } / { filteredQuestions.length }
            </span>
          </div>

          { currentQuestionIndex === filteredQuestions.length - 1 ? (
            <Button
              onClick={handleComplete }
              disabled={ !isQuestionnaireComplete || isSubmitting }
              className="flex items-center space-x-2"
            >
              { isSubmitting ? (
                <span>Termination...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Terminer</span>
                </>
              ) }
            </Button>
          ) : (
            <Button
              onClick={ handleNext }
              disabled={ !responses[currentQuestion.question_id] }
              className="flex items-center space-x-2"
            >
              <span>Suivant</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
} 