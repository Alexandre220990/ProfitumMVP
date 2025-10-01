import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { get, post } from "@/lib/api";
import { toast } from "sonner";
import { checkRecentSimulation } from "@/api/simulations";
import { Question } from "@/types/simulation";
import { ClientProduitEligible } from "@/types/simulation";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface Simulation {
  id: string;
  clientId: string;
  dateCreation: string;
  statut: "en_cours" | "terminee";
  Answers: Record<number, string[]>;
  score?: number;
  tempsCompletion?: number;
  CheminParcouru?: Record<string, any>;
}

interface ProductsResponse {
  products: ClientProduitEligible[];
}

export const useSimulation = () => {
  const { user } = useAuth();
  const [simulationId, setSimulationId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [localAnswers, setLocalAnswers] = useState<Record<number, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<ClientProduitEligible[]>([]);

  const extractData = <T>(response: ApiResponse<T>): T | null => {
    return response.success ? response.data : null;
  };

  // Fonction pour récupérer ou créer une simulation
  const getOrCreateSimulation = async (clientId: string): Promise<Simulation | null> => {
    try {
      const result = await checkRecentSimulation(clientId);
      if (result.exists && result.simulationId) {
        // Charger la simulation existante
        return {
          id: String(result.simulationId),
          clientId,
          dateCreation: new Date().toISOString(),
          statut: "en_cours",
          Answers: {}
        } as Simulation;
      }
      // Créer une nouvelle simulation si aucune n'existe
      const newSimResponse = await post<ApiResponse<Simulation>>("/api/simulations", { clientId, statut: "en_cours" });
      const newSimData = extractData(newSimResponse);
      return newSimData as Simulation | null;
    } catch (error) {
      console.error("Erreur lors de la récupération/création de la simulation: ", error);
      return null;
    }
  };

  // Initialisation
  useEffect(() => {
    const initSimulation = async () => {
      if (!user?.id) return;
      
      const urlParams = new URLSearchParams(window.location.search);
      const simulationIdFromUrl = urlParams.get("simulationId");

      if (simulationIdFromUrl) {
        setSimulationId(simulationIdFromUrl);
        try {
          const response = await get<ApiResponse<Record<number, string[]>>>(
            `/api/simulations/${simulationIdFromUrl}/answers`
          );
          const data = extractData(response);
          if (data) {
            setLocalAnswers(data as unknown as Record<number, string[]>);
          }
        } catch (error) {
          console.error("Erreur chargement réponses: ", error);
        }
      } else {
        const sim = await getOrCreateSimulation(user.id);
        if (sim?.id) {
          setSimulationId(String(sim.id));
          const newUrl = `/simulateur?simulationId=${sim.id}`;
          if (window.location.search !== `?simulationId=${sim.id}`) {
            window.history.pushState({}, "", newUrl);
          }
        }
      }
    };

    initSimulation();
  }, [user?.id]);

  // Chargement des questions
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await get<ApiResponse<Question[]>>("/api/questions");
        const data = extractData(response);
        
        console.log("Questions reçues: ", data);
        
        if (!data || !Array.isArray(data) || data.length === 0) {
          throw new Error("Questions vides ou invalides");
        }

        // Vérifier que chaque question a les propriétés requises
        const validQuestions = data.filter(q => 
          q && 
          typeof q.id === 'number' && 
          typeof q.texte === 'string' && 
          typeof q.type === 'string' &&
          q.options?.choix && Array.isArray(q.options.choix)
        );

        if (validQuestions.length === 0) {
          throw new Error("Format des questions invalide");
        }

        const sortedQuestions = [...validQuestions].sort((a: Question, b: Question) => a.ordre - b.ordre);
        setQuestions(sortedQuestions);
      } catch (error) {
        console.error("Erreur chargement questions: ", error);
        toast.error("Impossible de charger les questions");
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, []);

  // Sauvegarde locale des réponses
  useEffect(() => {
    if (Object.keys(localAnswers).length > 0 && simulationId) {
      localStorage.setItem(
        `simulation_${simulationId}_answers`,
        JSON.stringify(localAnswers)
      );
    }
  }, [localAnswers, simulationId]);

  // Chargement des réponses sauvegardées
  useEffect(() => {
    if (simulationId) {
      const saved = localStorage.getItem(`simulation_${simulationId}_answers`);
      if (saved) {
        try {
          setLocalAnswers(JSON.parse(saved));
        } catch (error) {
          console.error("Erreur parse réponses localStorage", error);
        }
      }
    }
  }, [simulationId]);

  // Gestion des réponses
  const handleSelect = async (value: string) => {
    if (!simulationId || !questions[currentStep]) return;

    const question = questions[currentStep];
    const currentAnswers = localAnswers[question.id] || [];
    
    // Gestion des réponses multiples
    let newAnswers: string[];
    if (question.type === "choix_multiple") {
      if (currentAnswers.includes(value)) {
        newAnswers = currentAnswers.filter(answer => answer !== value);
      } else {
        newAnswers = [...currentAnswers, value];
      }
    } else {
      newAnswers = [value];
    }

    setLocalAnswers(prev => ({
      ...prev,
      [question.id]: newAnswers
    }));

    // Sauvegarder sur le serveur
    try {
      await post(`/api/simulations/${simulationId}/answers`, {
        questionId: question.id,
        answers: newAnswers
      });
    } catch (error) {
      console.error("Erreur sauvegarde réponse: ", error);
    }
  };

  const handleSubmit = async () => {
    if (!simulationId || !user?.id) return;

    try {
      const response = await post<ProductsResponse>(`/api/simulations/${simulationId}/submit`, {
        clientId: user.id
      });

      if (response.success && response.data) {
        setProducts(response.data.products);
        toast.success(`${response.data.products.length} produits éligibles trouvés`);
      }
    } catch (error) {
      console.error("Erreur soumission simulation: ", error);
      toast.error("Impossible de terminer la simulation");
    }
  };

  const nextStep = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetSimulation = () => {
    setCurrentStep(0);
    setLocalAnswers({});
    setProducts([]);
    if (simulationId) {
      localStorage.removeItem(`simulation_${simulationId}_answers`);
    }
  };

  return {
    simulationId,
    questions,
    currentStep,
    localAnswers,
    isLoading,
    products,
    handleSelect,
    handleSubmit,
    nextStep,
    prevStep,
    resetSimulation,
    isLastStep: currentStep === questions.length - 1,
    isFirstStep: currentStep === 0,
    progress: questions.length > 0 ? ((currentStep + 1) / questions.length) * 100 : 0
  };
}; 