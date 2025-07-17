import { useCallback, useMemo, useState } from "react";

export interface QuestionResponse { question_id: string;
  response_value: any;
  question_order: number }

export interface QuestionCondition { depends_on?: {
    question_id: string;
    answer: string | string[];
    operator?: '=' | '!=' | 'in' | 'not_in'; };
}

export interface QuestionnaireQuestion { question_id: string;
  question_order: number;
  question_text: string;
  question_type: string;
  options?: any;
  validation_rules?: any;
  conditions?: QuestionCondition;
  produits_cibles: string[];
  phase: number }

export interface UseQuestionnaireLogicProps { questions: QuestionnaireQuestion[];
  initialResponses?: Record<string, any>;
}

export interface UseQuestionnaireLogicReturn { // Questions filtrées selon les conditions
  filteredQuestions: QuestionnaireQuestion[];
  
  // Réponses actuelles
  responses: Record<string, any>;
  
  // Fonctions de gestion
  addResponse: (questionId: string, value: any) => void;
  updateResponse: (questionId: string, value: any) => void;
  removeResponse: (questionId: string) => void;
  
  // Validation des conditions
  isQuestionVisible: (question: QuestionnaireQuestion) => boolean;
  isQuestionRequired: (question: QuestionnaireQuestion) => boolean;
  
  // Navigation conditionnelle
  getNextQuestion: (currentQuestionId: string) => QuestionnaireQuestion | null;
  getPreviousQuestion: (currentQuestionId: string) => QuestionnaireQuestion | null;
  
  // État du questionnaire
  progress: number;
  totalVisibleQuestions: number;
  answeredQuestions: number;
  
  // Validation globale
  isQuestionnaireComplete: boolean;
  getValidationErrors: () => string[];
}

export function useQuestionnaireLogic({ questions, initialResponses = {} }: UseQuestionnaireLogicProps): UseQuestionnaireLogicReturn {
  const [responses, setResponses] = useState<Record<string, any>>(initialResponses);

  // Fonction pour évaluer une condition
  const evaluateCondition = useCallback((condition: QuestionCondition): boolean => {
    if (!condition.depends_on) return true;

    const { question_id, answer, operator = '=' } = condition.depends_on;
    const responseValue = responses[question_id];

    if (responseValue === undefined) return false;

    switch (operator) {
      case '=':
        return responseValue === answer;
      case '!=':
        return responseValue !== answer;
      case 'in':
        return Array.isArray(answer) && answer.includes(responseValue);
      case 'not_in':
        return Array.isArray(answer) && !answer.includes(responseValue);
      default:
        return responseValue === answer;
    }
  }, [responses]);

  // Questions filtrées selon les conditions
  const filteredQuestions = useMemo(() => {
    return questions.filter(question => {
      if (!question.conditions) return true;
      return evaluateCondition(question.conditions);
    }).sort((a, b) => a.question_order - b.question_order);
  }, [questions, evaluateCondition]);

  // Vérifier si une question est visible
  const isQuestionVisible = useCallback((question: QuestionnaireQuestion): boolean => {
    if (!question.conditions) return true;
    return evaluateCondition(question.conditions);
  }, [evaluateCondition]);

  // Vérifier si une question est requise
  const isQuestionRequired = useCallback((question: QuestionnaireQuestion): boolean => {
    if (!question.validation_rules) return false;
    return question.validation_rules.required === true;
  }, []);

  // Ajouter une réponse
  const addResponse = useCallback((questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev, [questionId]: value
    }));
  }, []);

  // Mettre à jour une réponse
  const updateResponse = useCallback((questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev, [questionId]: value
    }));
  }, []);

  // Supprimer une réponse
  const removeResponse = useCallback((questionId: string) => {
    setResponses(prev => {
      const newResponses = { ...prev };
      delete newResponses[questionId];
      return newResponses;
    });
  }, []);

  // Obtenir la question suivante
  const getNextQuestion = useCallback((currentQuestionId: string): QuestionnaireQuestion | null => {
    const currentIndex = filteredQuestions.findIndex(q => q.question_id === currentQuestionId);
    if (currentIndex === -1 || currentIndex === filteredQuestions.length - 1) {
      return null;
    }
    return filteredQuestions[currentIndex + 1];
  }, [filteredQuestions]);

  // Obtenir la question précédente
  const getPreviousQuestion = useCallback((currentQuestionId: string): QuestionnaireQuestion | null => {
    const currentIndex = filteredQuestions.findIndex(q => q.question_id === currentQuestionId);
    if (currentIndex <= 0) {
      return null;
    }
    return filteredQuestions[currentIndex - 1];
  }, [filteredQuestions]);

  // Calculer le progrès
  const progress = useMemo(() => {
    const requiredQuestions = filteredQuestions.filter(q => isQuestionRequired(q));
    const answeredRequired = requiredQuestions.filter(q =>
      responses[q.question_id] !== undefined &&
      responses[q.question_id] !== null &&
      responses[q.question_id] !== ''
    );
    return requiredQuestions.length > 0 ? (answeredRequired.length / requiredQuestions.length) * 100 : 0;
  }, [filteredQuestions, responses, isQuestionRequired]);

  // Statistiques
  const totalVisibleQuestions = filteredQuestions.length;
  const answeredQuestions = Object.keys(responses).length;

  // Vérifier si le questionnaire est complet
  const isQuestionnaireComplete = useMemo(() => {
    const requiredQuestions = filteredQuestions.filter(q => isQuestionRequired(q));
    return requiredQuestions.every(q =>
      responses[q.question_id] !== undefined &&
      responses[q.question_id] !== null &&
      responses[q.question_id] !== ''
    );
  }, [filteredQuestions, responses, isQuestionRequired]);

  // Obtenir les erreurs de validation
  const getValidationErrors = useCallback((): string[] => {
    const errors: string[] = [];
    
    filteredQuestions.forEach(question => {
      if (isQuestionRequired(question)) {
        const response = responses[question.question_id];
        if (response === undefined || response === null || response === '') {
          errors.push(`Question "${question.question_text}" est requise`);
        }
      }
    });

    return errors;
  }, [filteredQuestions, responses, isQuestionRequired]);

  return {
    filteredQuestions,
    responses,
    addResponse,
    updateResponse,
    removeResponse,
    isQuestionVisible,
    isQuestionRequired,
    getNextQuestion,
    getPreviousQuestion,
    progress,
    totalVisibleQuestions,
    answeredQuestions,
    isQuestionnaireComplete,
    getValidationErrors
  };
} 