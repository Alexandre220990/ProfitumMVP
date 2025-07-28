import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Clock, Calculator, Building2, Truck, Home, DollarSign, UserPlus, Check, Award, Target, Zap, ArrowRight, CheckCircle } from "lucide-react";
import { config } from "@/config/env";
import PublicHeader from '@/components/PublicHeader';

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

interface EligibilityResult { 
  produit_id: string;
  eligibility_score: number;
  estimated_savings: number;
  confidence_level: string;
  recommendations: string[] 
}

const SimulateurEligibilite = () => { 
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // États du simulateur
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [eligibilityResults, setEligibilityResults] = useState<EligibilityResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  
  // Nouveaux états pour la validation
  const [currentResponse, setCurrentResponse] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Tracking analytics
  const trackEvent = (eventName: string, data: Record<string, unknown> = {}) => { 
    try {
      // Google Analytics 4
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', eventName, {
          event_category: 'simulator', 
          event_label: 'eligibility_check', 
          value: (data.eligibility_score as number) || 0, 
          custom_parameters: {
            session_token: sessionToken, 
            products_count: (data.products_count as number) || 0, 
            total_savings: (data.total_savings as number) || 0 
          }
        });
      }

      // Mixpanel ou autre outil
      if (typeof window !== 'undefined' && (window as any).mixpanel) { 
        (window as any).mixpanel.track(eventName, {
          ...data, 
          session_token: sessionToken, 
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
          event: eventName, 
          session_token: sessionToken, 
          data: data 
        })
      }).catch(console.error);

    } catch (error) { 
      console.error('Erreur tracking: ', error); 
    }
  };

  // Gestion de la session et nettoyage
  useEffect(() => { 
    const handleBeforeUnload = () => {
      // Marquer la session comme abandonnée
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
        trackEvent('simulator_session_pause', {
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
    initializeSimulator(); 
  }, []);

  const initializeSimulator = async () => { 
    try {
      setSessionStartTime(Date.now()); // Initialiser le temps de session
      
      // Créer une session temporaire
      const sessionResponse = await fetch(`${config.API_URL}/api/simulator/session`, { 
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json' 
        }
      });
      
      if (sessionResponse.ok) { 
        const sessionData = await sessionResponse.json();
        setSessionToken(sessionData.session_token);
        
        // Tracking début de session
        trackEvent('simulator_session_start', {
          timestamp: new Date().toISOString() 
        });
        
        // Charger les questions
        await loadQuestions();
      }
    } catch (error) { 
      console.error('Erreur lors de l\'initialisation: ', error);
      toast({
        title: "Erreur", 
        description: "Impossible d'initialiser le simulateur", 
        variant: "destructive" 
      });
    }
  };

  const loadQuestions = async () => { 
    try {
      const response = await fetch(`${config.API_URL}/api/simulator/questions`);
      if (response.ok) { 
        const questionsData = await response.json();
        setQuestions(questionsData);
        setTotalSteps(questionsData.length);
        setCurrentQuestion(questionsData[0] || null);
        
        console.log(`📋 ${questionsData.length} questions chargées`);
      }
    } catch (error) { 
      console.error('Erreur lors du chargement des questions: ', error); 
    }
  };

  const handleResponse = async (response: string | number | string[] | null) => { 
    try {
      // Stocker la réponse temporairement
      setCurrentResponse(response);
      
      // Pour les questions à choix unique, on peut valider automatiquement
      if (currentQuestion?.question_type === 'choix_unique') {
        await validateAndProceed(response); 
      }
      // Pour les autres types, on attend que l'utilisateur clique sur "Valider"
      
    } catch (error) { 
      console.error('Erreur lors de la sauvegarde de la réponse: ', error);
      toast({
        title: "Erreur", 
        description: "Impossible de sauvegarder votre réponse", 
        variant: "destructive" 
      });
    }
  };

  const validateAndProceed = async (response: string | number | string[] | null) => { 
    if (!currentQuestion) return;
    
    try {
      setIsValidating(true);
      
      // Sauvegarder la réponse
      const saveResponse = await fetch(`${config.API_URL}/api/simulator/response`, { 
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          session_id: sessionToken, 
          question_id: currentQuestion.id, 
          response_value: response 
        })
      });

      if (saveResponse.ok) { 
        // Marquer comme validé
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

        // Attendre un peu pour montrer la validation
        await new Promise(resolve => setTimeout(resolve, 500));

        // Passer à la question suivante
        if (currentStep < totalSteps) { 
          const nextStep = currentStep + 1;
          setCurrentStep(nextStep);
          setCurrentQuestion(questions[nextStep - 1]); // -1 car l'index commence à 0
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
      toast({
        title: "Erreur", 
        description: "Impossible de valider votre réponse", 
        variant: "destructive" 
      });
    } finally { 
      setIsValidating(false); 
    }
  };

  const handleValidate = () => { 
    if (currentResponse !== null && currentResponse !== undefined && currentResponse !== '') {
      validateAndProceed(currentResponse); 
    } else { 
      toast({
        title: "Réponse manquante", 
        description: "Veuillez répondre à la question avant de valider", 
        variant: "destructive" 
      });
    }
  };

  const calculateResults = async () => { 
    try {
      const response = await fetch(`${config.API_URL}/api/simulator/calculate-eligibility`, { 
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          session_id: sessionToken 
        })
      });

      if (response.ok) { 
        const results = await response.json();
        setEligibilityResults(results.eligibility_results || []);
        setShowResults(true);
        
        // Tracking résultats
        trackEvent('simulator_completed', {
          total_questions: totalSteps,
          session_duration: Date.now() - sessionStartTime,
          results_count: results.eligibility_results?.length || 0,
          total_savings: results.eligibility_results?.reduce((sum: number, r: any) => sum + r.estimated_savings, 0) || 0
        });
      }
    } catch (error) { 
      console.error('Erreur lors du calcul des résultats: ', error);
      toast({
        title: "Erreur", 
        description: "Impossible de calculer vos résultats", 
        variant: "destructive" 
      });
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

  const handleInscription = () => { 
    // Tracking conversion
    trackEvent('simulator_conversion', {
      total_savings: eligibilityResults.reduce((sum, r) => sum + r.estimated_savings, 0),
      results_count: eligibilityResults.length
    });

    // Naviguer vers la page d'inscription existante avec les données
    navigate('/register-client', {
      state: {
        fromSimulator: true,
        sessionToken: sessionToken,
        eligibilityResults: eligibilityResults,
        extractedData: responses // Données extraites des réponses
      }
    });
  };

  const getProductIcon = (produitId: string) => { 
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      'TICPE': Truck, 
      'URSSAF': Building2,
      'DFS': DollarSign,
      'FONCIER': Home 
    };
    return icons[produitId] || DollarSign;
  };

  const getProductColor = (produitId: string) => { 
    const colors: Record<string, string> = {
      'TICPE': 'bg-blue-100 text-blue-800', 
      'URSSAF': 'bg-red-100 text-red-800', 
      'DFS': 'bg-teal-100 text-teal-800', 
      'FONCIER': 'bg-indigo-100 text-indigo-800' 
    };
    return colors[produitId] || 'bg-gray-100 text-gray-800';
  };

  const generatePersonalizedMessage = (result: EligibilityResult) => { 
    const messages = {
      high: {
        title: "🎯 Excellente éligibilité !",
        subtitle: "Vous êtes parfaitement positionné pour cette optimisation",
        urgency: "Action recommandée dans les 30 jours pour maximiser vos économies"
      },
      medium: {
        title: "✅ Bonne éligibilité",
        subtitle: "Cette optimisation peut vous apporter des économies significatives",
        urgency: "Action recommandée dans les 60 jours"
      },
      low: {
        title: "📋 Éligibilité limitée",
        subtitle: "Quelques ajustements pourraient améliorer votre éligibilité",
        urgency: "Consultez nos experts pour optimiser votre situation"
      }
    };

    if (result.eligibility_score >= 80) return messages.high;
    if (result.eligibility_score >= 50) return messages.medium;
    return messages.low;
  };

  const generateProductDetails = (result: EligibilityResult) => { 
    const baseSavings = result.estimated_savings || 0;
    const confidence = result.confidence_level || 'medium';
    
    return {
      savings: {
        min: Math.round(baseSavings * 0.8),
        max: Math.round(baseSavings * 1.2),
        average: Math.round(baseSavings)
      },
      confidence: confidence,
      processingTime: confidence === 'high' ? '2-3 semaines' : '3-4 semaines',
      successRate: confidence === 'high' ? '95%' : confidence === 'medium' ? '85%' : '70%'
    };
  };

  // Écran de bienvenue
  if (showWelcomeScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <PublicHeader />
        
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center space-y-8">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                <Calculator className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-slate-800">
                Simulateur d'Éligibilité
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Découvrez en 2 minutes vos opportunités d'optimisation fiscale et vos économies potentielles
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60">
                <div className="text-3xl font-bold text-green-600 mb-2">2 min</div>
                <div className="text-slate-600">Temps de simulation</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60">
                <div className="text-3xl font-bold text-green-600 mb-2">15 000€</div>
                <div className="text-slate-600">Gain moyen</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60">
                <div className="text-3xl font-bold text-green-600 mb-2">100%</div>
                <div className="text-slate-600">Gratuit</div>
              </div>
            </div>

            <Button 
              onClick={() => setShowWelcomeScreen(false)}
              className="group relative bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold px-10 py-4 text-lg rounded-full hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-blue-500/25"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"></div>
              <span className="relative flex items-center">
                <Calculator className="w-5 h-5 mr-3" />
                Commencer ma simulation
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Affichage des résultats
  if (showResults) {
    const totalSavings = eligibilityResults.reduce((sum, r) => sum + r.estimated_savings, 0);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <PublicHeader />
        
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center space-y-8">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                <Award className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-slate-800">
                Vos résultats
              </h1>
              <p className="text-xl text-slate-600">
                Voici vos opportunités d'optimisation identifiées
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl p-8 border-2 border-green-200">
              <div className="text-6xl font-bold text-green-600 mb-2">
                {totalSavings.toLocaleString('fr-FR')}€
              </div>
              <div className="text-xl text-green-700">
                d'économies potentielles identifiées
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eligibilityResults.map((result) => {
                const message = generatePersonalizedMessage(result);
                const details = generateProductDetails(result);
                const Icon = getProductIcon(result.produit_id);

                return (
                  <Card key={result.produit_id} className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-xl ${getProductColor(result.produit_id)}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800">{result.produit_id}</h3>
                            <p className="text-sm text-slate-600">Score: {result.eligibility_score}%</p>
                          </div>
                        </div>
                        <Badge 
                          variant={result.eligibility_score >= 70 ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {result.eligibility_score >= 70 ? 'Très éligible' : 'Éligible'}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-6 space-y-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 mb-2">
                          {result.estimated_savings.toLocaleString('fr-FR')}€
                        </div>
                        <p className="text-sm text-slate-600">
                          Économies estimées
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                          <h4 className="font-semibold text-slate-800 mb-2">{message.title}</h4>
                          <p className="text-sm text-slate-600">{message.subtitle}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-semibold text-slate-800">{details.savings.average}€</div>
                            <div className="text-slate-600">Gain moyen</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-slate-800">{details.successRate}</div>
                            <div className="text-slate-600">Taux de succès</div>
                          </div>
                        </div>

                        {/* Recommandations personnalisées */}
                        {result.recommendations && result.recommendations.length > 0 && (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
                            <h4 className="font-semibold text-slate-800 mb-4 flex items-center">
                              <Target className="w-5 h-5 mr-2 text-blue-600" />
                              Recommandations personnalisées :
                            </h4>
                            <ul className="space-y-3">
                              {result.recommendations.map((rec, index) => (
                                <li key={index} className="text-sm text-slate-700 flex items-start">
                                  <CheckCircle className="w-4 h-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Urgence */}
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-4 rounded-2xl">
                          <p className="text-sm text-yellow-800 font-medium flex items-center">
                            <Zap className="w-4 h-4 mr-2" />
                            {message.urgency}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Call-to-Action */}
            <div className="text-center space-y-8">
              <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-3xl p-10 border-2 border-blue-200/60 max-w-4xl mx-auto">
                <h3 className="text-3xl font-light text-blue-900 mb-6">
                  🎁 Offre spéciale simulation
                </h3>
                <p className="text-lg text-blue-700 mb-8 font-light max-w-2xl mx-auto">
                  Pour profiter de ces opportunités, créez votre compte gratuitement et accédez à nos experts certifiés.
                </p>
                
                <div className="grid md:grid-cols-3 gap-8 mb-8">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">100%</div>
                    <div className="text-sm text-blue-600 font-medium">Gratuit</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">24h</div>
                    <div className="text-sm text-blue-600 font-medium">Mise en relation</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">500+</div>
                    <div className="text-sm text-blue-600 font-medium">Experts certifiés</div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleInscription}
                  className="group relative bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-10 py-4 text-lg rounded-full hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-green-500/25"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"></div>
                  <span className="relative flex items-center">
                    <UserPlus className="w-5 h-5 mr-3" />
                    Créer mon compte gratuitement
                    <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Affichage des questions (quand showWelcomeScreen est false et showResults est false)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header de la page d'accueil */}
      <PublicHeader />
      {/* 🎯 BANDEAU FIXE - Simulateur d'Éligibilité */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-6 px-8 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <div className="bg-yellow-400/20 p-2 rounded-2xl">
              <Calculator className="w-8 h-8 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">🎯 Simulateur d'Éligibilité Fiscale</h2>
              <p className="text-blue-100 text-sm font-light">
                Découvrez vos opportunités d'optimisation en 2 minutes • 100% gratuit
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-8 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-300" />
              <span>Étape {currentStep} sur {totalSteps}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-300" />
              <span>2 min restantes</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-red-300" />
              <span>Gain moyen : 15 000€</span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENU PRINCIPAL DU SIMULATEUR */}
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
                    <p className="text-slate-600 font-light">Progression de votre analyse</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-sm font-semibold px-4 py-2">
                  {Math.round((currentStep / totalSteps) * 100)}% complété
                </Badge>
              </div>
              
              {/* Barre de progression */}
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

              {/* Bouton Valider - TOUJOURS présent sauf pour les questions à choix unique */}
              {currentQuestion.question_type !== 'choix_unique' && (
                <div className="flex justify-center pt-8">
                  <Button
                    onClick={handleValidate}
                    disabled={!currentResponse || isValidating}
                    className={`group relative px-10 py-4 text-lg font-semibold rounded-full transition-all duration-300 ${
                      isValidating 
                        ? 'bg-slate-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25'}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"></div>
                    <span className="relative flex items-center">
                      {isValidating ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Validation en cours...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5 mr-3" />
                          Valider ma réponse
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
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-600">Chargement des questions...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulateurEligibilite; 