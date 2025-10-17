import { useRef, useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { post, get } from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calculator, FileSpreadsheet, FileType, Save, RefreshCw, TrendingUp, Euro, Clock, AlertCircle, CheckCircle, ArrowRight, FileText } from "lucide-react";
import { checkRecentSimulation } from "@/api/simulations";

// Types
interface Question { 
  id: number;
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
  importance: number
}

interface Simulation { 
  id: string;
  clientId: string;
  statut: string;
  createdAt: string;
  updatedAt: string 
}

interface ClientProduitEligible { 
  id: string;
  produitId: string;
  tauxFinal: number;
  montantFinal: number;
  dureeFinale: number;
  statut: string;
  produit: {
    id: string;
    nom: string;
    description: string;
    categorie: string; 
  };
}

interface ApiResponse<T> { 
  success: boolean;
  data: T;
  message?: string 
}

interface AnalyseResponse {
  products: ClientProduitEligible[];
}

export const UnifiedSimulator: React.FC = () => { 
  const { user } = useAuth();
  
  // États
  const [simulationId, setSimulationId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [eligibleProducts, setEligibleProducts] = useState<ClientProduitEligible[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialisation
  useEffect(() => { 
    if (!user?.id) return;
    
    const initSimulation = async () => {
      try {
        // Vérifier s'il y a une simulation récente
        const result = await checkRecentSimulation(user.id);
        if (result.exists && result.simulationId) {
          setSimulationId(String(result.simulationId));
          // Charger les réponses si besoin
          if (result.answers && result.answers.length > 0) {
            // Conversion de StoredAnswer[] en Record<number, string[]>
            const answersRecord: Record<number, string[]> = {};
            result.answers.forEach(ans => {
              if (!answersRecord[ans.questionId]) answersRecord[ans.questionId] = [];
              answersRecord[ans.questionId].push(ans.answer);
            });
            setAnswers(answersRecord);
          }
        } else {
          // Créer une nouvelle simulation
          const newSimResponse = await post<ApiResponse<Simulation>>("/api/simulations", {
            clientId: user.id,
            statut: "en_cours"
          });
          const newSimData = extractData(newSimResponse) as Simulation | null;
          if (newSimData && newSimData.id) {
            setSimulationId(newSimData.id);
          }
        }
      } catch (error) { 
        console.error("Erreur initialisation simulation: ", error);
        setError("Erreur lors de l'initialisation"); 
      }
    };

    initSimulation();
  }, [user?.id]);

  // Chargement des questions
  useEffect(() => { 
    const loadQuestions = async () => {
      try {
        const response = await get<ApiResponse<Question[]>>("/api/simulations/questions");
        const data = extractData(response);
        
        if (!data || !Array.isArray(data) || data.length === 0) {
          throw new Error("Aucune question disponible"); 
        }

        const validQuestions = data.filter(q => 
          q && 
          typeof q.id === 'number' && 
          typeof q.texte === 'string' && 
          typeof q.type === 'string'
        );

        if (validQuestions.length === 0) { 
          throw new Error("Format des questions invalide"); 
        }

        const sortedQuestions = [...validQuestions].sort((a, b) => a.ordre - b.ordre);
        setQuestions(sortedQuestions);
      } catch (error) { 
        console.error("Erreur chargement questions: ", error);
        setError("Impossible de charger les questions"); 
      } finally { 
        setIsLoading(false); 
      }
    };

    loadQuestions();
  }, []);

  // Auto-scroll
  useEffect(() => { 
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentStep]);

  // Gestion des réponses
  const handleAnswer = (value: string) => { 
    if (!questions[currentStep]) return;

    const question = questions[currentStep];
    const isMultiple = question.type === "choix_multiple";

    const updatedAnswers = isMultiple
      ? (answers[question.id] || []).includes(value)
        ? (answers[question.id] || []).filter((v: string) => v !== value)
        : [...(answers[question.id] || []), value]
      : [value];

    setAnswers((prev: Record<number, string[]>) => ({
      ...prev, 
      [question.id]: updatedAnswers 
    }));

    setCurrentInput('');
  };

  // Gestion de l'input numérique
  const handleNumberInput = (value: string) => { 
    setCurrentInput(value); 
  };

  const handleNumberSubmit = () => { 
    if (currentInput.trim()) {
      handleAnswer(currentInput.trim()); 
    }
  };

  // Navigation
  const nextStep = () => { 
    if (currentStep < questions.length - 1) {
      setCurrentStep((prev: number) => prev + 1); 
    }
  };

  const prevStep = () => { 
    if (currentStep > 0) {
      setCurrentStep((prev: number) => prev - 1); 
    }
  };

  // Soumission finale
  const handleSubmit = async () => { 
    if (!simulationId || !user?.id) return;

    setIsSubmitting(true);
    try {
      // Sauvegarder les réponses
      await post(`/api/simulations/${simulationId}/answers`, { answers: answers });

      // Terminer la simulation
      await post(`/api/simulations/${simulationId}/terminer`);

      // Analyser les réponses
      const response = await post<ApiResponse<AnalyseResponse>>(
        "/api/simulations/analyser-reponses",
        { answers: answers }
      );

      const analyseData = extractData(response) as AnalyseResponse | null;
      if (analyseData && analyseData.products) {
        setEligibleProducts(analyseData.products);
        setShowResults(true);

        toast.success(`${analyseData.products.length} produits éligibles trouvés`);
      }
    } catch (error) { 
      console.error("Erreur soumission simulation: ", error);
      toast.error("Erreur lors de la soumission");
    } finally { 
      setIsSubmitting(false); 
    }
  };

  // Exports
  const exportResults = async (format: 'xlsx' | 'pdf' | 'docx') => { 
    try {
      const response = await post(`/api/simulations/${simulationId}/export`, { 
        format, 
        products: eligibleProducts, 
        answers: answers 
      });

      // Télécharger le fichier
      const blob = new Blob([response.data as BlobPart], { 
        type: format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
             format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `simulation-${simulationId}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Fichier ${format.toUpperCase()} téléchargé`);
    } catch (error) { 
      console.error("Erreur export: ", error);
      toast.error("Erreur lors de l'export");
    }
  };

  // Nouvelle simulation
  const startNewSimulation = () => { 
    setShowResults(false);
    setAnswers({});
    setCurrentStep(0);
    setEligibleProducts([]);
    setError(null);
  };

  if (isLoading) { 
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du simulateur...</p>
        </div>
      </div>
    ); 
  }

  if (error) { 
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (showResults) { 
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="mb-8">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Simulation Terminée !
              </CardTitle>
              <p className="text-gray-600">
                Voici les produits éligibles pour votre entreprise
              </p>
            </CardHeader>
          </Card>

          {/* Résultats */}
          <div className="grid gap-6 mb-8">
            {eligibleProducts.map((product: ClientProduitEligible) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {product.produit.nom}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {product.produit.description}
                      </p>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-2">
                            <TrendingUp className="w-5 h-5 text-blue-500 mr-2" />
                            <span className="text-sm text-gray-500">Score</span>
                          </div>
                          <p className="text-lg font-semibold text-blue-600">
                            {product.tauxFinal ? `${(product.tauxFinal * 100).toFixed(0)}%` : 'N/A'}
                          </p>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-2">
                            <Euro className="w-5 h-5 text-green-500 mr-2" />
                            <span className="text-sm text-gray-500">Économies</span>
                          </div>
                          <p className="text-lg font-semibold text-green-600">
                            {product.montantFinal && product.montantFinal > 0 
                              ? `${product.montantFinal.toLocaleString('fr-FR')}€` 
                              : 'À estimer'}
                          </p>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-2">
                            <Clock className="w-5 h-5 text-purple-500 mr-2" />
                            <span className="text-sm text-gray-500">Durée</span>
                          </div>
                          <p className="text-lg font-semibold text-purple-600">
                            {product.dureeFinale || 12} mois
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Badge variant={product.statut === 'eligible' ? 'default' : 'secondary'}>
                      {product.statut === 'eligible' ? 'Éligible' : 'En attente'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={startNewSimulation} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Nouvelle simulation
            </Button>
            
            <Button onClick={() => exportResults('xlsx')}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            
            <Button onClick={() => exportResults('pdf')}>
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            
            <Button onClick={() => exportResults('docx')}>
              <FileType className="w-4 h-4 mr-2" />
              Export Word
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;
  const hasAnswer = currentQuestion && answers[currentQuestion.id]?.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Calculator className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Simulateur d'Éligibilité
            </CardTitle>
            <p className="text-gray-600">
              Répondez à quelques questions pour découvrir vos économies potentielles
            </p>
          </CardHeader>
        </Card>

        {/* Progression */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentStep + 1} sur {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        <Card ref={scrollRef}>
          <CardContent className="p-6">
            {currentQuestion && (
              <>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {currentQuestion.texte}
                </h2>
                
                {currentQuestion.description && (
                  <p className="text-gray-600 mb-6">{currentQuestion.description}</p>
                )}

                {/* Réponses selon le type */}
                {currentQuestion.type === 'choix_unique' && currentQuestion.options.choix && (
                  <div className="space-y-3">
                    {currentQuestion.options.choix.map((choice: string) => (
                      <Button
                        key={choice}
                        variant={answers[currentQuestion.id]?.includes(choice) ? "default" : "outline"}
                        onClick={() => handleAnswer(choice)}
                        className="w-full justify-start h-auto p-4"
                      >
                        {choice}
                      </Button>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'choix_multiple' && currentQuestion.options.choix && (
                  <div className="space-y-3">
                    {currentQuestion.options.choix.map((choice: string) => (
                      <Button
                        key={choice}
                        variant={answers[currentQuestion.id]?.includes(choice) ? "default" : "outline"}
                        onClick={() => handleAnswer(choice)}
                        className="w-full justify-start h-auto p-4"
                      >
                        {choice}
                      </Button>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'nombre' && (
                  <div className="space-y-4">
                    <Input
                      type="number"
                      value={currentInput}
                      onChange={(e) => handleNumberInput(e.target.value)}
                      placeholder={`Entrez un nombre${currentQuestion.options.unite ? ` en ${currentQuestion.options.unite}` : ''}`}
                      min={currentQuestion.options.min}
                      max={currentQuestion.options.max}
                      className="text-lg"
                    />
                    <Button 
                      onClick={handleNumberSubmit}
                      disabled={!currentInput.trim()}
                      className="w-full"
                    >
                      Valider
                    </Button>
                  </div>
                )}

                {currentQuestion.type === 'texte' && (
                  <div className="space-y-4">
                    <Input
                      type="text"
                      value={currentInput}
                      onChange={(e) => handleNumberInput(e.target.value)}
                      placeholder="Entrez votre réponse"
                      className="text-lg"
                    />
                    <Button 
                      onClick={handleNumberSubmit}
                      disabled={!currentInput.trim()}
                      className="w-full"
                    >
                      Valider
                    </Button>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                  >
                    Précédent
                  </Button>

                  {currentStep === questions.length - 1 ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={!hasAnswer || isSubmitting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Traitement...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Terminer la simulation
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={nextStep}
                      disabled={!hasAnswer}
                    >
                      Suivant
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sauvegarde automatique */}
        <div className="mt-4 text-center">
          <div className="flex items-center justify-center text-sm text-gray-500">
            <Save className="w-4 h-4 mr-2" />
            Sauvegarde automatique activée
          </div>
        </div>
      </div>
    </div>
  );
}; 