/**
 * ChatbotSimulator.tsx - V2
 * 
 * Composant de simulation de chatbot pour l'application Profitum.
 * Version 2 avec gestion de session, reprise après refresh, et gestion avancée des erreurs.
 * 
 * Améliorations apportées :
 * - Gestion des erreurs API avec react-hot-toast et typage des erreurs
 * - Skeleton loader pendant le chargement des questions
 * - Désactivation des inputs pendant les mutations
 * - Validation basique des réponses
 * - Retry intelligent pour les requêtes API
 * - Animations de transition pour les messages
 * - Sauvegarde de session dans localStorage
 * - Reprise de simulation existante
 * - Barre de progression
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Question, SimulationResult } from '../types/database';
import { ApiError, ApiErrorType, UpdateSessionPayload, StartSessionResponse } from '../types/chatbot';
import { useChatbotSession } from '../hooks/useChatbotSession';
import { ProgressBar } from './ProgressBar';
import { ProduitEligibleCard } from './ProduitEligibleCard';
import { fetchQuestions, sendAnswer } from '../api/simulations';
import { 
  startChatbotSession,
  updateChatbotSession,
  completeChatbotSession,
  getChatbotSession 
} from '../api/chatbot';
import '../styles/animations.css';

interface ChatbotSimulatorProps {
  clientId: string;
  onComplete: (result: SimulationResult) => void;
}

export const ChatbotSimulator: React.FC<ChatbotSimulatorProps> = ({ 
  clientId, 
  onComplete 
}) => {
  // État local
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  
  // Gestion de session
  const { 
    state, 
    addMessage, 
    addAnswer, 
    setCurrentQuestionIndex, 
    setSimulationId,
    clearSession 
  } = useChatbotSession(null);
  
  const { 
    simulationId, 
    currentQuestionIndex,
    messages
  } = state;

  // Récupération des questions
  const { 
    data: questions, 
    isLoading: isLoadingQuestions, 
    isError: isQuestionsError,
    error: questionsError
  } = useQuery<Question[], ApiError>({
    queryKey: ['questions'],
    queryFn: fetchQuestions,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Mutation pour démarrer une session
  const startSessionMutation = useMutation<StartSessionResponse, ApiError, void>({
    mutationFn: () => startChatbotSession(clientId),
    onSuccess: (response) => {
      if (response.success && response.data) {
        setSimulationId(response.data.id);
        setCurrentQuestionIndex(response.data.current_question_index);
        
        // Message de bienvenue
        addMessage({
          type: 'question',
          content: 'Bienvenue dans le simulateur de produits financiers'
        });
      }
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
    }
  });

  // Mutation pour mettre à jour la session
  const updateSessionMutation = useMutation({
    mutationFn: async () => {
      if (!simulationId) return;
      
      const payload: UpdateSessionPayload = {
        current_question_index: currentQuestionIndex,
        messages,
        answers: state.answers
      };
      
      await updateChatbotSession(simulationId, payload);
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error as ApiError);
      toast.error(errorMessage);
    }
  });

  // Mutation pour terminer la session
  const completeSessionMutation = useMutation({
    mutationFn: async (eligibleProducts: string[]) => {
      if (!simulationId) return;
      await completeChatbotSession(simulationId, { eligible_products: eligibleProducts });
    },
    onSuccess: () => {
      addMessage({
        type: 'question',
        content: 'Simulation terminée ! Voici vos résultats :'
      });
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error as ApiError);
      toast.error(errorMessage);
    }
  });

  // Vérification d'une simulation récente
  useEffect(() => {
    const checkExistingSimulation = async () => {
      try {
        setIsInitializing(true);

        if (!simulationId) {
          // Pas de session existante => on démarre une nouvelle
          await startSessionMutation.mutateAsync();
        } else {
          // Session existante détectée => on la récupère !
          const response = await getChatbotSession(simulationId);
          if (response.success && response.data) {
            // Restaurer l'état local à partir des données serveur
            setCurrentQuestionIndex(response.data.current_question_index);
            
            // Restaurer les messages
            if (response.data.messages && response.data.messages.length > 0) {
              response.data.messages.forEach((msg) => {
                addMessage({
                  type: msg.type,
                  content: msg.content
                });
              });
            }

            // Restaurer les réponses
            if (response.data.answers && response.data.answers.length > 0) {
              response.data.answers.forEach((ans) => {
                addAnswer(ans.questionId, ans.answer);
              });
            }

            toast.success('Session précédente restaurée avec succès');
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de la session existante:', error);
        toast.error('Impossible de reprendre votre session.');
        
        // On démarre une nouvelle session si la reprise échoue
        try {
          await startSessionMutation.mutateAsync();
          toast.success('Nouvelle session démarrée');
        } catch (startError) {
          console.error('Erreur lors du démarrage d\'une nouvelle session:', startError);
          toast.error('Impossible de démarrer une nouvelle session.');
        }
      } finally {
        setIsInitializing(false);
      }
    };
    
    checkExistingSimulation();
  }, [clientId, simulationId, setCurrentQuestionIndex, addMessage, addAnswer]);

  // Mise à jour de la session après chaque changement important
  useEffect(() => {
    if (simulationId && !isInitializing) {
      updateSessionMutation.mutate();
    }
  }, [currentQuestionIndex, messages, state.answers]);

  // Gestion des erreurs de chargement des questions
  useEffect(() => {
    if (isQuestionsError && questionsError) {
      const errorMessage = getErrorMessage(questionsError);
      toast.error(errorMessage);
    }
  }, [isQuestionsError, questionsError]);

  // Mutation pour envoyer une réponse
  const answerMutation = useMutation({
    mutationFn: async (answer: string) => {
      if (!questions || !Array.isArray(questions) || currentQuestionIndex >= questions.length) {
        throw new Error('Question invalide');
      }
      
      setIsSubmitting(true);
      const questionId = questions[currentQuestionIndex].id;
      
      // Sauvegarder la réponse localement
      addAnswer(questionId, answer);
      
      // Envoyer la réponse au serveur et obtenir les produits éligibles
      const response = await fetch(`/api/simulations/${simulationId}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId,
          answer,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de la réponse');
      }

      const result = await response.json();
      
      if (result.simulationComplete && result.result) {
        // Terminer la session avec les produits éligibles
        await completeSessionMutation.mutateAsync(
          result.result.produits.map(p => p.id.toString())
        );
        return result;
      }
      
      return result;
    },
    onSuccess: (data) => {
      if (data.simulationComplete && data.result) {
        // Stocker les résultats et notifier le parent
        setSimulationResult(data.result);
        onComplete(data.result);
        
        // Ajouter un message de fin
        addMessage({
          type: 'question',
          content: 'Simulation terminée ! Voici vos résultats :'
        });
      } else {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    },
    onError: (error: unknown) => {
      const apiError: ApiError = error instanceof Error 
        ? {
            type: ApiErrorType.UNKNOWN,
            message: error.message
          }
        : {
            type: ApiErrorType.UNKNOWN,
            message: 'Une erreur inattendue est survenue'
          };
      
      const errorMessage = getErrorMessage(apiError);
      toast.error(errorMessage);
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  // Validation basique de la réponse
  const validateAnswer = (answer: string): boolean => {
    if (!answer || answer.trim() === '') {
      toast.error('Veuillez fournir une réponse');
      return false;
    }
    return true;
  };

  // Gestionnaire de réponse
  const handleAnswer = (answer: string) => {
    if (!validateAnswer(answer)) return;
    
    // Ajouter la réponse aux messages
    addMessage({
      type: 'answer',
      content: answer
    });
    
    // Envoyer la réponse
    answerMutation.mutate(answer);
  };

  // Rendu de l'input selon le type de question
  const renderInput = () => {
    if (!questions || !Array.isArray(questions) || currentQuestionIndex >= questions.length) return null;
    const currentQuestion = questions[currentQuestionIndex];

    if (currentQuestion.type === 'multiple_choice' && currentQuestion.options) {
      return (
        <div className="flex flex-col gap-2">
          {currentQuestion.options.map((option: string, index: number) => (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              disabled={isSubmitting}
              className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      );
    }

    return (
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Votre réponse..."
          disabled={isSubmitting}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !isSubmitting) {
              const input = e.target as HTMLInputElement;
              handleAnswer(input.value);
              input.value = '';
            }
          }}
        />
        <button
          onClick={() => {
            const input = document.querySelector('input') as HTMLInputElement;
            handleAnswer(input.value);
            input.value = '';
          }}
          disabled={isSubmitting}
          className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Envoyer
        </button>
      </div>
    );
  };

  // Rendu des messages
  const renderMessages = () => {
    return (
      <div className="flex flex-col gap-2">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-2 rounded transition-all duration-300 transform animate-fade-in ${
              message.type === 'question'
                ? 'bg-gray-100'
                : 'bg-blue-100 self-end'
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>
    );
  };

  // Rendu de la question courante avec gestion des dépendances
  const renderCurrentQuestion = () => {
    if (!questions || !Array.isArray(questions) || currentQuestionIndex >= questions.length) return null;
    
    const currentQuestion = questions[currentQuestionIndex];

    // Vérifier si la question dépend d'une réponse précédente
    if (currentQuestion.dependsOn) {
      const answerForDependency = state.answers.find(
        (a) => a.questionId === currentQuestion.dependsOn?.questionId
      );

      if (!answerForDependency || answerForDependency.answer !== currentQuestion.dependsOn.expectedAnswer) {
        // Passer à la question suivante automatiquement
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        return null;
      }
    }
    
    return (
      <div className="bg-gray-100 p-4 rounded transition-all duration-300 transform animate-slide-in">
        {currentQuestion.texte}
      </div>
    );
  };

  // Rendu des résultats de la simulation
  const renderSimulationResults = (result: SimulationResult) => {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Produits financiers recommandés
        </h2>
        
        {result.produits.length === 0 ? (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-yellow-800">
              Aucun produit ne correspond exactement à vos critères pour le moment.
              Notre équipe peut étudier votre dossier plus en détail.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {result.produits.map((produit) => (
              <ProduitEligibleCard key={produit.id} produit={produit} />
            ))}
          </div>
        )}
        
        {result.score && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800">
              Score global de votre simulation : {result.score}/100
            </p>
          </div>
        )}
      </div>
    );
  };

  // Rendu de la barre de progression
  const renderProgressBar = () => {
    if (!questions || !Array.isArray(questions)) return null;
    
    return (
      <div className="mb-4">
        <ProgressBar 
          current={currentQuestionIndex} 
          total={questions.length} 
        />
      </div>
    );
  };

  // Rendu du skeleton loader
  const renderSkeletonLoader = () => {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="animate-pulse">
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  };

  // Rendu de l'écran d'erreur
  const renderErrorScreen = () => {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-red-500 text-xl mb-4">Une erreur est survenue</div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Réessayer
        </button>
      </div>
    );
  };

  // Rendu du bouton de réinitialisation
  const renderResetButton = () => {
    return (
      <div className="mt-4 text-center">
        <button
          onClick={() => {
            clearSession();
            window.location.reload();
          }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Recommencer une nouvelle simulation
        </button>
      </div>
    );
  };

  // Fonction utilitaire pour obtenir un message d'erreur
  const getErrorMessage = (error: ApiError): string => {
    switch (error.type) {
      case ApiErrorType.TIMEOUT:
        return 'Le serveur met trop de temps à répondre, veuillez patienter ou réessayer';
      case ApiErrorType.SERVER_ERROR:
        return 'Erreur serveur, nous travaillons à la résoudre';
      case ApiErrorType.VALIDATION_ERROR:
        return 'Données invalides, veuillez vérifier votre réponse';
      case ApiErrorType.NETWORK_ERROR:
        return 'Problème de connexion, vérifiez votre connexion internet';
      default:
        return 'Une erreur inattendue est survenue';
    }
  };

  // État de chargement initial
  if (isInitializing || isLoadingQuestions) {
    return renderSkeletonLoader();
  }

  // État d'erreur
  if (isQuestionsError) {
    return renderErrorScreen();
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {simulationResult ? (
        renderSimulationResults(simulationResult)
      ) : (
        <>
          {renderProgressBar()}
          {renderMessages()}
          {renderCurrentQuestion()}
          {!isSubmitting && renderInput()}
          {renderResetButton()}
        </>
      )}
    </div>
  );
}; 