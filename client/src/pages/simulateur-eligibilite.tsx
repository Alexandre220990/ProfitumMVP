import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Clock, Calculator, Building2, Truck, Home, DollarSign, Check, Target, Zap, ArrowRight, CheckCircle, User } from "lucide-react";
import { config } from "@/config/env";
import PublicHeader from '@/components/PublicHeader';
import HeaderClient from '@/components/HeaderClient';
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

interface EligibilityResult { 
  produit_id: string;
  eligibility_score: number;
  estimated_savings: number;
  confidence_level: string;
  recommendations: string[] 
}

const SimulateurEligibilite = () => { 
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  // Détecter le mode client connecté
  const isClientMode = searchParams.get('mode') === 'client' && user;
  
  // Redirection si mode client sans authentification
  useEffect(() => {
    if (searchParams.get('mode') === 'client' && !user) {
      toast.error("Vous devez être connecté pour accéder au mode client");
      navigate('/connexion-client');
    }
  }, [searchParams, user, navigate]);
  
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
  
  // États pour le mode client
  const [isUpdatingExisting, setIsUpdatingExisting] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<{
    productsUpdated: number;
    productsCreated: number;
    productsProtected: number;
    totalSavings: number;
  } | null>(null);

  // Tracking analytics
  const trackEvent = (eventName: string, data: Record<string, unknown> = {}) => { 
    try {
      // Ne tracker que si on a un sessionToken
      if (!sessionToken) {
        console.log('⚠️ Tracking ignoré: sessionToken non disponible');
        return;
      }

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
          session_token: sessionToken, 
          event_type: eventName, 
          event_data: data 
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
      console.log('🚀 Initialisation du simulateur...', { isClientMode });
      setSessionStartTime(Date.now()); // Initialiser le temps de session
      
      if (isClientMode) {
        // Mode client connecté - pas besoin de session temporaire
        console.log('👤 Mode client connecté détecté');
        setSessionToken(`client_${user?.id}_${Date.now()}`);
        
        // Tracking début de session client
        setTimeout(() => {
          trackEvent('simulator_client_session_start', {
            timestamp: new Date().toISOString(),
            client_id: user?.id
          });
        }, 100);
        
        // Charger les questions
        console.log('📋 Chargement des questions...');
        await loadQuestions();
      } else {
        // Mode public - créer une session temporaire
        const sessionResponse = await fetch(`${config.API_URL}/api/simulator/session`, { 
          method: 'POST', 
          headers: {
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
            client_data: {
              // Données temporaires qui seront migrées plus tard
              temp_id: `temp_${Date.now()}`,
              created_at: new Date().toISOString()
            }
          })
        });
        
        if (sessionResponse.ok) { 
          const sessionData = await sessionResponse.json();
          setSessionToken(sessionData.session_token);
          console.log('✅ Session créée:', sessionData.session_token);
          
          // Tracking début de session (après avoir défini sessionToken)
          setTimeout(() => {
            trackEvent('simulator_session_start', {
              timestamp: new Date().toISOString() 
            });
          }, 100);
          
          // Charger les questions
          console.log('📋 Chargement des questions...');
          await loadQuestions();
        } else {
          console.error('❌ Erreur création session:', sessionResponse.status);
        }
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
        
        // L'API retourne {success: true, questions: [...]}
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
      // Stocker la réponse temporairement
      setCurrentResponse(response);
      
      // Pour les questions à choix unique, on peut valider automatiquement
      if (currentQuestion?.question_type === 'choix_unique') {
        await validateAndProceed(response); 
      }
      // Pour les autres types, on attend que l'utilisateur clique sur "Valider"
      
    } catch (error) { 
      console.error('Erreur lors de la sauvegarde de la réponse: ', error);
      toast.error("Impossible de sauvegarder votre réponse");
    }
  };

  const validateAndProceed = async (response: string | number | string[] | null) => { 
    if (!currentQuestion) return;
    
    // Validation des données avant envoi
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

  const calculateResults = async () => { 
    try {
      if (isClientMode) {
        // Mode client connecté - utiliser la nouvelle API
        console.log('👤 Calcul des résultats en mode client...');
        setIsUpdatingExisting(true);
        
        const response = await fetch(`${config.API_URL}/api/client/simulation/update`, { 
          method: 'POST', 
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
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
            
            // Simuler des résultats d'éligibilité pour l'affichage
            const mockResults = [
              {
                produit_id: 'ticpe',
                eligibility_score: 85,
                estimated_savings: results.data.totalSavings,
                confidence_level: 'high',
                recommendations: ['Produits mis à jour avec succès']
              }
            ];
            
            setEligibilityResults(mockResults);
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
            
            toast.success(`Simulation mise à jour ! ${results.data.productsCreated} nouveaux produits créés, ${results.data.productsUpdated} produits mis à jour${results.data.productsProtected > 0 ? `, ${results.data.productsProtected} produits protégés` : ''}`);
          } else {
            throw new Error(results.message || 'Erreur lors de la mise à jour');
          }
        } else {
          console.error('❌ Erreur mise à jour client:', response.status, response.statusText);
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Erreur lors de la mise à jour de la simulation');
        }
      } else {
        // Mode public - utiliser l'API existante
        const response = await fetch(`${config.API_URL}/api/simulator/calculate-eligibility`, { 
          method: 'POST', 
          headers: {
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({ 
            session_token: sessionToken 
          })
        });

        if (response.ok) { 
          const results = await response.json();
          console.log('🔍 Résultats reçus du backend:', results);
          
          // Le backend retourne {success: true, eligibility_results: [...]}
          const eligibilityResults = results.eligibility_results || results || [];
          setEligibilityResults(eligibilityResults);
          setShowResults(true);
          
          console.log('✅ Résultats d\'éligibilité:', eligibilityResults);
          
          // Tracking résultats
          const resultsArray = Array.isArray(eligibilityResults) ? eligibilityResults : [];
          trackEvent('simulator_completed', {
            total_questions: totalSteps,
            session_duration: Date.now() - sessionStartTime,
            results_count: resultsArray.length,
            total_savings: resultsArray.reduce((sum: number, r: any) => sum + (r.estimated_savings || 0), 0)
          });
        } else {
          console.error('❌ Erreur calcul éligibilité:', response.status, response.statusText);
        }
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

  const handleInscription = () => { 
    // Tracking conversion
    const resultsArray = Array.isArray(eligibilityResults) ? eligibilityResults : [];
    trackEvent('simulator_conversion', {
      total_savings: resultsArray.reduce((sum, r) => sum + (r.estimated_savings || 0), 0),
      results_count: resultsArray.length
    });

    // Naviguer vers la page d'inscription existante avec les données
    navigate('/inscription-simulateur', {
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
        {isClientMode ? <HeaderClient /> : <PublicHeader />}
        
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center space-y-8">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                <Calculator className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-slate-800">
                {isClientMode ? 'Mise à jour de votre simulation' : 'Simulateur d\'Éligibilité'}
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                {isClientMode 
                  ? 'Actualisez vos opportunités d\'optimisation avec vos nouvelles données'
                  : 'Découvrez en 2 minutes vos opportunités d\'optimisation fiscale et vos économies potentielles'
                }
              </p>
              
              {isClientMode && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                  <div className="flex items-center gap-2 text-blue-700">
                    <User className="w-5 h-5" />
                    <span className="font-medium">Mode client connecté</span>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    Vos produits existants seront mis à jour intelligemment
                  </p>
                </div>
              )}
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
    const resultsArray = Array.isArray(eligibilityResults) ? eligibilityResults : [];
    const totalSavings = resultsArray.reduce((sum, r) => sum + (r.estimated_savings || 0), 0);
    const highEligibilityCount = resultsArray.filter(r => (r.eligibility_score || 0) >= 70).length;
    const eligibleProductsCount = resultsArray.filter(r => (r.estimated_savings || 0) > 0).length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <PublicHeader />
        
        {/* Header Section - Compact et élégant */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-lg mb-6">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              Vos résultats d'éligibilité
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Analyse personnalisée de vos opportunités d'optimisation fiscale et financière
            </p>
          </div>

          {/* Hero Results - Impact visuel modéré */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/60 shadow-xl mb-12">
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <div className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {totalSavings.toLocaleString('fr-FR')}€
                </div>
                <div className="text-lg text-slate-600 font-medium">
                  d'économies potentielles identifiées
                </div>
              </div>
              
              {/* Métriques clés en grille */}
              <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-800">{eligibleProductsCount}</div>
                  <div className="text-sm text-slate-600">Produits éligibles</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-800">{highEligibilityCount}</div>
                  <div className="text-sm text-slate-600">Très éligibles</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-800">95%</div>
                  <div className="text-sm text-slate-600">Taux de succès</div>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid - Layout moderne */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {resultsArray.map((result) => {
              const message = generatePersonalizedMessage(result);
              const details = generateProductDetails(result);
              const Icon = getProductIcon(result.produit_id);
              const isHighEligibility = (result.eligibility_score || 0) >= 70;
              const hasSavings = (result.estimated_savings || 0) > 0;

              return (
                <div 
                  key={result.produit_id} 
                  className={`group relative bg-white/90 backdrop-blur-sm border border-white/60 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                    hasSavings ? 'hover:border-emerald-200' : 'hover:border-slate-200'
                  }`}
                >
                  {/* Header de la card */}
                  <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-xl transition-colors duration-300 ${
                          hasSavings 
                            ? 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800 text-lg">{result.produit_id}</h3>
                          <p className="text-sm text-slate-500">
                            Score: {result.eligibility_score || 0}%
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isHighEligibility 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isHighEligibility ? 'Très éligible' : 'Éligible'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Contenu principal */}
                  <div className="p-6 space-y-6">
                    {/* Montant principal */}
                    <div className="text-center">
                      <div className={`text-3xl font-bold mb-2 ${
                        hasSavings ? 'text-emerald-600' : 'text-slate-400'
                      }`}>
                        {(result.estimated_savings || 0).toLocaleString('fr-FR')}€
                      </div>
                      <p className="text-sm text-slate-600">
                        Économies estimées
                      </p>
                    </div>

                    {/* Message personnalisé */}
                    <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4">
                      <h4 className="font-semibold text-slate-800 mb-2 text-sm">
                        {message.title}
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {message.subtitle}
                      </p>
                    </div>

                    {/* Métriques détaillées */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <div className="font-semibold text-slate-800 text-sm">
                          {details.savings.average}€
                        </div>
                        <div className="text-xs text-slate-600">Gain moyen</div>
                      </div>
                      <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <div className="font-semibold text-slate-800 text-sm">
                          {details.successRate}
                        </div>
                        <div className="text-xs text-slate-600">Taux de succès</div>
                      </div>
                    </div>

                    {/* Recommandations */}
                    {result.recommendations && result.recommendations.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-slate-800 text-sm flex items-center">
                          <Target className="w-4 h-4 mr-2 text-emerald-600" />
                          Recommandations
                        </h4>
                        <ul className="space-y-2">
                          {result.recommendations.slice(0, 2).map((rec, index) => (
                            <li key={index} className="text-sm text-slate-700 flex items-start">
                              <CheckCircle className="w-3 h-3 text-emerald-500 mr-2 mt-1 flex-shrink-0" />
                              <span className="leading-relaxed">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Urgence */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-3 border-amber-400 p-3 rounded-xl">
                      <p className="text-xs text-amber-800 font-medium flex items-center">
                        <Zap className="w-3 h-3 mr-2" />
                        {message.urgency}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA Section - Conversion optimisée */}
          {isClientMode && updateProgress ? (
            // Affichage des résultats de mise à jour pour le mode client
            <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-3xl p-10 border border-blue-200/60">
              <div className="text-center space-y-8 max-w-4xl mx-auto">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-blue-900">
                    ✅ Simulation mise à jour avec succès !
                  </h3>
                  <p className="text-lg text-blue-700 font-light max-w-2xl mx-auto leading-relaxed">
                    Vos opportunités d'optimisation ont été actualisées intelligemment. 
                    Les produits en cours de traitement ont été préservés.
                  </p>
                </div>
                
                {/* Statistiques de mise à jour */}
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center group">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <span className="text-2xl font-bold text-white">{updateProgress.productsCreated}</span>
                    </div>
                    <div className="text-sm font-medium text-blue-700">Nouveaux produits</div>
                    <div className="text-xs text-blue-600 mt-1">Créés</div>
                  </div>
                  <div className="text-center group">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <span className="text-2xl font-bold text-white">{updateProgress.productsUpdated}</span>
                    </div>
                    <div className="text-sm font-medium text-blue-700">Produits mis à jour</div>
                    <div className="text-xs text-blue-600 mt-1">Actualisés</div>
                  </div>
                  <div className="text-center group">
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <span className="text-2xl font-bold text-white">{updateProgress.productsProtected}</span>
                    </div>
                    <div className="text-sm font-medium text-blue-700">Produits protégés</div>
                    <div className="text-xs text-blue-600 mt-1">En cours</div>
                  </div>
                </div>

                {/* Bouton d'action principal */}
                <div className="pt-4">
                  <button
                    onClick={() => navigate('/dashboard/client')}
                    className="group relative bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <span className="relative flex items-center justify-center">
                      Voir mon tableau de bord
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </button>
                  <p className="text-sm text-blue-600 mt-4 font-medium">
                    💰 Économies totales : {updateProgress?.totalSavings?.toLocaleString('fr-FR') || '0'}€ • ✅ Mise à jour sécurisée
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Affichage normal pour le mode public
            <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-3xl p-10 border border-blue-200/60">
              <div className="text-center space-y-8 max-w-4xl mx-auto">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-blue-900">
                    🎁 Offre spéciale simulation
                  </h3>
                  <p className="text-lg text-blue-700 font-light max-w-2xl mx-auto leading-relaxed">
                    Transformez ces opportunités en économies réelles. Créez votre compte gratuitement 
                    et accédez à nos experts certifiés pour maximiser vos gains.
                  </p>
                </div>
              
                {/* Avantages en grille */}
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center group">
                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <span className="text-2xl font-bold text-white">100%</span>
                    </div>
                    <div className="text-sm font-medium text-blue-700">Gratuit</div>
                    <div className="text-xs text-blue-600 mt-1">Aucun engagement</div>
                  </div>
                  <div className="text-center group">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <span className="text-2xl font-bold text-white">24h</span>
                    </div>
                    <div className="text-sm font-medium text-blue-700">Mise en relation</div>
                    <div className="text-xs text-blue-600 mt-1">Expert dédié</div>
                  </div>
                  <div className="text-center group">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <span className="text-2xl font-bold text-white">500+</span>
                    </div>
                    <div className="text-sm font-medium text-blue-700">Experts certifiés</div>
                    <div className="text-xs text-blue-600 mt-1">Sélectionnés</div>
                  </div>
                </div>

                {/* Bouton d'action principal */}
                <div className="pt-4">
                  <button
                    onClick={handleInscription}
                    className="group relative bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <span className="relative flex items-center justify-center">
                      Créer mon compte gratuitement
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </button>
                  <p className="text-sm text-blue-600 mt-4 font-medium">
                    💰 Inscription gratuite • 💰 Économies immédiates • 💰 Satisfaction garantie
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Affichage des questions (quand showWelcomeScreen est false et showResults est false)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header de la page d'accueil */}
      {isClientMode ? <HeaderClient /> : <PublicHeader />}
      {/* 🎯 BANDEAU FIXE - Simulateur d'Éligibilité */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-6 px-8 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <div className="bg-yellow-400/20 p-2 rounded-2xl">
              <Calculator className="w-8 h-8 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {isClientMode ? '🔄 Mise à jour de votre simulation' : '🎯 Simulateur d\'Éligibilité Fiscale'}
              </h2>
              <p className="text-blue-100 text-sm font-light">
                {isClientMode 
                  ? 'Actualisez vos opportunités avec vos nouvelles données • Mode client connecté'
                  : 'Découvrez vos opportunités d\'optimisation en 2 minutes • 100% gratuit'
                }
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
                {isClientMode && (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-blue-300" />
                    <span>Mode client connecté</span>
                  </div>
                )}
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
                    disabled={!currentResponse || isValidating || isUpdatingExisting}
                    className={`group relative px-10 py-4 text-lg font-semibold rounded-full transition-all duration-300 ${
                      isValidating 
                        ? 'bg-slate-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25'}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"></div>
                    <span className="relative flex items-center">
                      {isValidating || isUpdatingExisting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          {isClientMode ? 'Mise à jour...' : 'Validation en cours...'}
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5 mr-3" />
                          {isClientMode ? 'Mettre à jour ma simulation' : 'Valider ma réponse'}
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
            <p className="text-slate-600">
              {isClientMode ? 'Chargement de votre simulation...' : 'Chargement des questions...'}
            </p>
            {isClientMode && (
              <p className="text-sm text-slate-500 mt-2">
                Préparation de la mise à jour de vos produits éligibles
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulateurEligibilite; 