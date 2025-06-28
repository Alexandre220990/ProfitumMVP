import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { post, get } from "@/lib/api";
import { Question, Simulation, ClientProduitEligible } from "@/types/simulation";
import { extractData } from "@/lib/api-helpers";

// Types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface RecentSimulationResponse {
  recentSimulation: Simulation | null;
}

interface ProductsResponse {
  products: ClientProduitEligible[];
}

export const useSimulation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // États
  const [simulationId, setSimulationId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [localAnswers, setLocalAnswers] = useState<Record<number, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [eligibleProducts, setEligibleProducts] = useState<ClientProduitEligible[]>([]);

  // Fonction pour récupérer ou créer une simulation
  const getOrCreateSimulation = async (clientId: string): Promise<Simulation | null> => {
    try {
      const response = await get<ApiResponse<RecentSimulationResponse>>(
        `/api/simulations/check-recent/${clientId}`
      );
      
      const data = extractData(response);
      if (data && 'recentSimulation' in data) {
        return data.recentSimulation as Simulation | null;
      }
      
      // Créer une nouvelle simulation si aucune n'existe
      const newSimResponse = await post<ApiResponse<Simulation>>("/api/simulations", {
        clientId,
        statut: "en_cours"
      });
      
      const newSimData = extractData(newSimResponse);
      return newSimData as Simulation | null;
    } catch (error) {
      console.error("Erreur lors de la récupération/création de la simulation:", error);
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
          console.error("Erreur chargement réponses:", error);
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
        
        console.log("Questions reçues:", data);
        
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
        console.error("Erreur chargement questions:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les questions",
          variant: "destructive",
        });
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
    const isMultiple = question.type === "choix_multiple";

    const updatedAnswers = isMultiple
      ? (localAnswers[question.id] || []).includes(value)
        ? (localAnswers[question.id] || []).filter((v) => v !== value)
        : [...(localAnswers[question.id] || []), value]
      : [value];

    setLocalAnswers((prev) => ({
      ...prev,
      [question.id]: updatedAnswers,
    }));

    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  // Soumission finale
  const handleSubmit = async () => {
    if (!simulationId || !user?.id) return;

    try {
      // 1. Enregistrer les réponses
      await post(`/api/simulations/${simulationId}/answers`, {
        answers: localAnswers,
      });

      // 2. Terminer la simulation
      await post(`/api/simulations/${simulationId}/terminer`);

      // 3. Analyser les réponses et obtenir les produits éligibles
      const response = await post<ApiResponse<ProductsResponse>>(
        "/api/simulations/analyser-reponses",
        {
          answers: localAnswers,
        }
      );

      const data = extractData(response);
      if (data && 'products' in data) {
        setEligibleProducts(data.products as ClientProduitEligible[]);
        setShowResults(true);
      } else {
        toast({
          title: "Erreur",
          description: "Analyse des réponses impossible",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur soumission simulation:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la soumission",
        variant: "destructive",
      });
    }
  };

  return {
    questions,
    currentStep,
    localAnswers,
    isLoading,
    showResults,
    eligibleProducts,
    handleSelect,
    handleSubmit,
  };
}; 