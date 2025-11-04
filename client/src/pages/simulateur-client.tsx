/**
 * SIMULATEUR CLIENT - Version pour clients CONNECTÉS uniquement
 * 
 * Différences avec /simulateur:
 * - Authentification REQUISE
 * - Token JWT envoyé automatiquement
 * - Simulation liée au client_id existant
 * - PAS de client temporaire
 * - PAS de formulaire d'inscription à la fin
 * - Retour au dashboard
 * - Mise à jour intelligente des produits existants
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Calculator, Check, ArrowRight, CheckCircle, User } from "lucide-react";
import { config } from "@/config/env";
import { useAuth } from '@/hooks/use-auth';

interface QuestionOptions {
  choix?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
  unite?: string;
}

interface ValidationRules {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
}

interface QuestionConditions {
  depends_on?: string;
  value?: any;
  operator?: 'equals' | 'not_equals' | 'greater_than' | 'less_than';
}

interface Question { 
  id: string;
  question_order: number;
  question_text: string;
  question_type: 'choix_unique' | 'choix_multiple' | 'nombre' | 'texte';
  description?: string;
  options: QuestionOptions;
  validation_rules: ValidationRules;
  importance: number;
  conditions: QuestionConditions;
  produits_cibles: string[];
  phase: number;
}

const SimulateurClient = () => { 
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // ✅ VÉRIFICATION AUTHENTIFICATION OBLIGATOIRE
  useEffect(() => {
    if (!user) {
      toast.error("Vous devez être connecté pour accéder au simulateur client");
      navigate('/connexion-client');
    }
  }, [user, navigate]);
  
  // États du simulateur
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [showResults, setShowResults] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  
  // Nouveaux états pour la validation
  const [currentResponse, setCurrentResponse] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  // États pour la mise à jour des produits
  const [isUpdatingExisting, setIsUpdatingExisting] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<{
    productsUpdated: number;
    productsCreated: number;
    productsProtected: number;
    totalSavings: number;
  } | null>(null);

  // Helper pour obtenir les headers avec token (TOUJOURS avec token)
  const getHeadersWithAuth = (): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.error('❌ Token JWT manquant!');
      toast.error("Token d'authentification manquant. Reconnectez-vous.");
      navigate('/connexion-client');
    }
    
    return headers;
  };

  // Tracking analytics
  const trackEvent = (eventName: string, data: Record<string, unknown> = {}) => { 
    try {
      if (!sessionToken) {
        console.log('⚠️ Tracking ignoré: sessionToken non disponible');
        return;
      }

      // Google Analytics 4
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', eventName, {
          event_category: 'simulator_client', 
          event_label: 'client_eligibility_update', 
          value: (data.eligibility_score as number) || 0, 
          custom_parameters: {
            session_token: sessionToken,
            client_id: user?.id,
            products_count: (data.products_count as number) || 0, 
            total_savings: (data.total_savings as number) || 0 
          }
        });
      }

      // Mixpanel
      if (typeof window !== 'undefined' && (window as any).mixpanel) { 
        (window as any).mixpanel.track(eventName, {
          ...data, 
          session_token: sessionToken,
          client_id: user?.id,
          authenticated: true,
          timestamp: new Date().toISOString() 
        });
      }

      // Tracking interne
      fetch(`${config.API_URL}/api/simulator/track`, { 
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          session_token: sessionToken, 
          event_type: eventName, 
          event_data: {...data, client_id: user?.id}
        })
      }).catch(console.error);

    } catch (error) { 
      console.error('Erreur tracking: ', error); 
    }
  };

  // Gestion de la session et nettoyage
  useEffect(() => { 
    const handleBeforeUnload = () => {
      if (sessionToken) {
        fetch(`${config.API_URL}/api/simulator/abandon`, { 
          method: 'POST', 
          headers: {
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({ 
            session_token: sessionToken, 
            reason: 'page_unload' 
          })
        }).catch(console.error);
      }
    };

    const handleVisibilityChange = () => { 
      if (document.visibilityState === 'hidden' && sessionToken) {
        trackEvent('simulator_client_session_pause', {
          current_step: currentStep, 
          total_steps: totalSteps, 
          progress: Math.round((currentStep / totalSteps) * 100) 
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => { 
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange); 
    };
  }, [sessionToken, currentStep, totalSteps]);

  // Initialisation du simulateur
  useEffect(() => { 
    if (user) {
      initializeSimulator(); 
    }
  }, [user]);

  const initializeSimulator = async () => { 
    try {
      console.log('🚀 Initialisation du simulateur CLIENT...', { user: user?.email });
      setSessionStartTime(Date.now());
      
      // Créer une session AVEC token (utilisateur authentifié)
      // Le serveur vérifiera automatiquement s'il y a une simulation en cours
      const sessionResponse = await fetch(`${config.API_URL}/api/simulator/session`, { 
        method: 'POST', 
        headers: getHeadersWithAuth(),
        body: JSON.stringify({
          client_data: {
            client_mode: true,
            created_at: new Date().toISOString()
          }
        })
      });
      
      if (sessionResponse.ok) { 
        const sessionData = await sessionResponse.json();
        setSessionToken(sessionData.session_token);
        
        console.log('✅ Session client:', {
          session_token: sessionData.session_token,
          authenticated: sessionData.authenticated,
          client_id: sessionData.client_id,
          in_progress: sessionData.in_progress,
          current_step: sessionData.current_step
        });
        
        if (!sessionData.authenticated) {
          console.error('❌ Session non authentifiée alors que le token a été envoyé!');
          toast.error("Erreur d'authentification. Reconnectez-vous.");
          navigate('/connexion-client');
          return;
        }
        
        // Charger les questions d'abord
        console.log('📋 Chargement des questions...');
        await loadQuestions();
        
        // Si simulation en cours, reprendre où on était
        if (sessionData.in_progress && sessionData.answers) {
          console.log('🔄 Reprise de la simulation en cours...');
          const answersObj = sessionData.answers || {};
          const answersCount = Object.keys(answersObj).length;
          
          // Restaurer les réponses
          setResponses(answersObj);
          
          // Aller à la prochaine question non répondue
          if (answersCount > 0) {
            setCurrentStep(answersCount + 1);
            toast.info(`Reprise de votre simulation à l'étape ${answersCount + 1}`);
          }
        } else {
          // Nouvelle simulation
          console.log('✨ Nouvelle simulation créée');
          toast.success("Simulation démarrée !");
        }
        
        // Tracking début de session client
        setTimeout(() => {
          trackEvent('simulator_client_session_start', {
            timestamp: new Date().toISOString(),
            client_id: sessionData.client_id,
            authenticated: true,
            in_progress: sessionData.in_progress || false
          });
        }, 100);
        
      } else {
        const errorData = await sessionResponse.json().catch(() => ({}));
        console.error('❌ Erreur création session:', sessionResponse.status, errorData);
        toast.error(errorData.error || "Impossible de créer la session");
      }
    } catch (error) { 
      console.error('Erreur lors de l\'initialisation: ', error);
      toast.error("Impossible d'initialiser le simulateur");
    }
  };

  const loadQuestions = async () => { 
    try {
      const response = await fetch(`${config.API_URL}/api/simulator/questions`);
      if (response.ok) { 
        const questionsData = await response.json();
        const questions = questionsData.questions || questionsData;
        
        setQuestions(questions);
        setTotalSteps(questions.length);
        setCurrentQuestion(questions[0] || null);
        
        console.log(`📋 ${questions.length} questions chargées`);
      } else {
        console.error('❌ Erreur API:', response.status, response.statusText);
      }
    } catch (error) { 
      console.error('Erreur lors du chargement des questions: ', error); 
    }
  };

  const handleResponse = async (response: string | number | string[] | null) => { 
    try {
      setCurrentResponse(response);
      
      // Auto-validation pour choix unique
      if (currentQuestion?.question_type === 'choix_unique') {
        await validateAndProceed(response); 
      }
    } catch (error) { 
      console.error('Erreur lors de la sauvegarde de la réponse: ', error);
      toast.error("Impossible de sauvegarder votre réponse");
    }
  };

  const validateAndProceed = async (response: string | number | string[] | null) => { 
    if (!currentQuestion) return;
    
    if (response === null || response === undefined || response === '') {
      toast.error("Veuillez répondre à la question avant de continuer");
      return;
    }
    
    try {
      setIsValidating(true);
      
      // Sauvegarder la réponse
      const saveResponse = await fetch(`${config.API_URL}/api/simulator/response`, { 
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          session_token: sessionToken, 
          responses: {
            [currentQuestion.id]: response
          }
        })
      });

      if (saveResponse.ok) { 
        setResponses(prev => ({
          ...prev, 
          [currentQuestion.id]: response 
        }));

        // Tracking
        trackEvent('question_validated', { 
          question_id: currentQuestion.id, 
          question_order: currentQuestion.question_order, 
          response_type: currentQuestion.question_type, 
          response_value: response 
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        // Passer à la question suivante
        if (currentStep < totalSteps) { 
          const nextStep = currentStep + 1;
          setCurrentStep(nextStep);
          setCurrentQuestion(questions[nextStep - 1]);
          setCurrentResponse(null);
        } else { 
          // Dernière question, calculer les résultats
          await calculateResults(); 
        }
      } else { 
        throw new Error('Erreur lors de la sauvegarde'); 
      }
    } catch (error) { 
      console.error('Erreur lors de la validation: ', error);
      toast.error("Impossible de valider votre réponse");
    } finally { 
      setIsValidating(false); 
    }
  };

  const handleValidate = () => { 
    if (currentResponse !== null && currentResponse !== undefined && currentResponse !== '') {
      validateAndProceed(currentResponse); 
    } else { 
      toast.error("Veuillez répondre à la question avant de valider");
    }
  };

  const [clientProduits, setClientProduits] = useState<any[]>([]);

  const calculateResults = async () => { 
    try {
      // MODE CLIENT - Mise à jour intelligente des produits
      console.log('👤 Calcul des résultats en mode client connecté...');
      setIsUpdatingExisting(true);
      
      const response = await fetch(`${config.API_URL}/api/client/simulation/update`, { 
        method: 'POST', 
        headers: getHeadersWithAuth(),
        credentials: 'include',
        body: JSON.stringify({ 
          responses: responses,
          simulationType: 'update'
        })
      });

      if (response.ok) { 
        const results = await response.json();
        console.log('🔍 Résultats client reçus:', results);
        
        if (results.success) {
          // Afficher les résultats de fusion
          setUpdateProgress({
            productsUpdated: results.data.productsUpdated,
            productsCreated: results.data.productsCreated,
            productsProtected: results.data.productsProtected,
            totalSavings: results.data.totalSavings
          });

          // Récupérer les ClientProduitEligible créés/mis à jour
          const produitsResponse = await fetch(
            `${config.API_URL}/api/client/produits-eligibles`,
            { 
              headers: getHeadersWithAuth(),
              credentials: 'include'
            }
          );

          if (produitsResponse.ok) {
            const produitsData = await produitsResponse.json();
            if (produitsData.success && produitsData.data) {
              setClientProduits(produitsData.data);
              console.log(`📦 ${produitsData.data.length} produits récupérés`);
            }
          }
          
          // Afficher les résultats
          setShowResults(true);
          
          // Tracking résultats client
          trackEvent('simulator_client_completed', {
            total_questions: totalSteps,
            session_duration: Date.now() - sessionStartTime,
            products_updated: results.data.productsUpdated,
            products_created: results.data.productsCreated,
            products_protected: results.data.productsProtected,
            total_savings: results.data.totalSavings
          });
          
          toast.success(`Simulation mise à jour ! ${results.data.productsCreated} nouveaux produits, ${results.data.productsUpdated} mis à jour, ${results.data.productsProtected} protégés`);
        } else {
          throw new Error(results.message || 'Erreur lors de la mise à jour');
        }
      } else {
        console.error('❌ Erreur mise à jour client:', response.status);
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) { 
      console.error('Erreur lors du calcul des résultats: ', error);
      toast.error("Impossible de calculer vos résultats");
    } finally {
      setIsUpdatingExisting(false);
    }
  };

  const handlePrevious = () => { 
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setCurrentQuestion(questions[prevStep - 1]);
      setCurrentResponse(responses[questions[prevStep - 1]?.id] || null);
    }
  };

  // Écran de bienvenue
  if (showWelcomeScreen) {
    return (
      <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100 -mx-4 sm:-mx-6 md:-mx-8 -my-6 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-8">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                <Calculator className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-slate-800">
                Mise à jour de votre simulation
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Actualisez vos opportunités d'optimisation avec vos nouvelles données
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center gap-2 text-blue-700">
                  <User className="w-5 h-5" />
                  <span className="font-medium">Mode client connecté</span>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  Vos produits existants seront mis à jour intelligemment
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60">
                <div className="text-3xl font-bold text-green-600 mb-2">2 min</div>
                <div className="text-slate-600">Temps de simulation</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60">
                <div className="text-3xl font-bold text-green-600 mb-2">Intelligent</div>
                <div className="text-slate-600">Mise à jour sélective</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60">
                <div className="text-3xl font-bold text-green-600 mb-2">Sécurisé</div>
                <div className="text-slate-600">Produits en cours protégés</div>
              </div>
            </div>

            <Button 
              onClick={() => setShowWelcomeScreen(false)}
              className="group relative bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold px-10 py-4 text-lg rounded-full hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-blue-500/25"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"></div>
              <span className="relative flex items-center">
                <Calculator className="w-5 h-5 mr-3" />
                Commencer la mise à jour
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </Button>

            <Button
              onClick={() => navigate('/dashboard/client')}
              variant="outline"
              className="ml-4"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Retour au dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Affichage des résultats
  if (showResults && updateProgress) {
    return (
      <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100 -mx-4 sm:-mx-6 md:-mx-8 -my-6 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-lg mb-6">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              Simulation mise à jour !
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Vos opportunités d'optimisation ont été actualisées intelligemment
            </p>
          </div>

          {/* Résultats de mise à jour */}
          <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-3xl p-10 border border-blue-200/60">
            <div className="text-center space-y-8 max-w-4xl mx-auto">
              {/* Statistiques */}
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl font-bold text-white">{updateProgress.productsCreated}</span>
                  </div>
                  <div className="text-sm font-medium text-blue-700">Nouveaux produits</div>
                </div>
                <div className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl font-bold text-white">{updateProgress.productsUpdated}</span>
                  </div>
                  <div className="text-sm font-medium text-blue-700">Produits mis à jour</div>
                </div>
                <div className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl font-bold text-white">{updateProgress.productsProtected}</span>
                  </div>
                  <div className="text-sm font-medium text-blue-700">Produits protégés</div>
                </div>
              </div>

              {/* Économies totales */}
              <div className="bg-white/50 rounded-2xl p-6">
                <div className="text-4xl font-bold text-emerald-600 mb-2">
                  {updateProgress.totalSavings.toLocaleString('fr-FR')}€
                </div>
                <div className="text-slate-600">Économies potentielles totales</div>
              </div>

              {/* CTA */}
              <button
                onClick={() => navigate('/dashboard/client')}
                className="group relative bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <span className="relative flex items-center justify-center">
                  Voir mon tableau de bord
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </button>
            </div>
          </div>

          {/* Liste des produits éligibles */}
          {clientProduits.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
                Vos produits éligibles
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto">
                {clientProduits.map((produit) => (
                  <Card 
                    key={produit.id}
                    className="h-[280px] flex flex-col bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                  >
                    <CardHeader className="pb-3">
                      <h3 className="font-semibold text-slate-800 text-sm line-clamp-2">
                        {produit.ProduitEligible?.nom || 'Produit'}
                      </h3>
                      <Badge 
                        variant={produit.statut === 'eligible' ? 'default' : 'secondary'}
                        className="w-fit"
                      >
                        {produit.statut}
                      </Badge>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between overflow-y-auto">
                      <div className="space-y-2">
                        <div className="text-2xl font-bold text-emerald-600">
                          {(produit.montantFinal || 0).toLocaleString('fr-FR')}€
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-3">
                          {produit.notes || produit.ProduitEligible?.notes_affichage}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Affichage des questions
  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100 -mx-4 sm:-mx-6 md:-mx-8 -my-6">
      {/* Bandeau */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-6 px-8 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <div className="bg-yellow-400/20 p-2 rounded-2xl">
              <Calculator className="w-8 h-8 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">🔄 Mise à jour de votre simulation</h2>
              <p className="text-blue-100 text-sm font-light">
                Actualisez vos opportunités • Mode client connecté
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-8 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-300" />
              <span>Étape {currentStep} sur {totalSteps}</span>
            </div>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-blue-300" />
              <span>{user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {currentQuestion ? (
          <Card className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-3xl shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-2xl">
                    <Calculator className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-800">
                      Question {currentStep} sur {totalSteps}
                    </h2>
                    <p className="text-slate-600 font-light">Mise à jour en cours</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-sm font-semibold px-4 py-2">
                  {Math.round((currentStep / totalSteps) * 100)}% complété
                </Badge>
              </div>
              
              <Progress value={(currentStep / totalSteps) * 100} className="h-3" />
            </CardHeader>
            
            <CardContent className="p-8 space-y-8">
              {/* Question */}
              <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">
                  {currentQuestion.question_text}
                </h3>
                
                {currentQuestion.description && (
                  <p className="text-slate-600 mb-4 italic font-light">
                    {currentQuestion.description}
                  </p>
                )}
              </div>

              {/* Options de réponse */}
              <div className="space-y-4">
                {currentQuestion.question_type === 'choix_unique' && currentQuestion.options?.choix && (
                  currentQuestion.options.choix.map((option: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleResponse(option)}
                      className={`w-full text-left p-6 border-2 rounded-2xl transition-all duration-300 group ${
                        currentResponse === option 
                          ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg' 
                          : 'border-slate-200 hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50'}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center transition-all duration-300 ${
                          currentResponse === option ? 'border-blue-500 bg-blue-500 scale-110' : 'border-slate-300 group-hover:border-blue-400'}`}>
                          {currentResponse === option && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <span className="font-medium text-slate-800 text-lg">{option}</span>
                      </div>
                    </button>
                  ))
                )}

                {currentQuestion.question_type === 'choix_multiple' && currentQuestion.options?.choix && (
                  <div className="space-y-4">
                    {currentQuestion.options.choix.map((option: string, index: number) => (
                      <label key={index} className="flex items-center space-x-4 p-6 border-2 border-slate-200 rounded-2xl hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-300 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="w-6 h-6 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
                          checked={Array.isArray(currentResponse) && currentResponse.includes(option)}
                          onChange={(e) => {
                            const currentResponses = Array.isArray(currentResponse) ? currentResponse : [];
                            if (e.target.checked) {
                              handleResponse([...currentResponses, option]); 
                            } else { 
                              handleResponse(currentResponses.filter((r: string) => r !== option)); 
                            }
                          }}
                        />
                        <span className="font-medium text-slate-800 text-lg">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {currentQuestion.question_type === 'nombre' && (
                  <div className="space-y-4">
                    <input
                      type="number"
                      placeholder={currentQuestion.options?.placeholder || "Entrez votre réponse"}
                      min={currentQuestion.options?.min}
                      max={currentQuestion.options?.max}
                      value={currentResponse || ''}
                      className="w-full p-6 border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg transition-all duration-300"
                      onChange={(e) => handleResponse(e.target.value ? parseInt(e.target.value) : null)}
                    />
                    {currentQuestion.options?.unite && (
                      <p className="text-sm text-slate-500 font-light">Unité : {currentQuestion.options.unite}</p>
                    )}
                  </div>
                )}

                {currentQuestion.question_type === 'texte' && (
                  <textarea
                    placeholder={currentQuestion.options?.placeholder || "Entrez votre réponse"}
                    value={currentResponse || ''}
                    className="w-full p-6 border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-[120px] text-lg transition-all duration-300"
                    onChange={(e) => handleResponse(e.target.value)}
                  />
                )}
              </div>

              {/* Bouton Valider */}
              {currentQuestion.question_type !== 'choix_unique' && (
                <div className="flex justify-center pt-8">
                  <Button
                    onClick={handleValidate}
                    disabled={!currentResponse || isValidating || isUpdatingExisting}
                    className={`group relative px-10 py-4 text-lg font-semibold rounded-full transition-all duration-300 ${
                      isValidating 
                        ? 'bg-slate-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25'}`}
                  >
                    <span className="relative flex items-center">
                      {isValidating || isUpdatingExisting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Mise à jour...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5 mr-3" />
                          Mettre à jour ma simulation
                          <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
                        </>
                      )}
                    </span>
                  </Button>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between items-center pt-8">
                <Button
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Précédent
                </Button>
                
                <div className="text-sm text-slate-500">
                  Question {currentStep} sur {totalSteps}
                </div>

                <Button
                  onClick={() => navigate('/dashboard/client')}
                  variant="ghost"
                  className="flex items-center space-x-2"
                >
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-600">Chargement de votre simulation...</p>
            <p className="text-sm text-slate-500 mt-2">
              Préparation de la mise à jour de vos produits éligibles
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulateurClient;

