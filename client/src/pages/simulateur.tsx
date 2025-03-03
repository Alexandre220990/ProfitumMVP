import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import HeaderClient from "@/components/HeaderClient";
import { Link } from "wouter";
import { ArrowLeftCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface Question {
  id: string;
  question: string;
  options: string[];
  multiple?: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  icon: string;
  link: string;
  criteria: (answers: Record<string, string[]>) => boolean;
}

const Simulateur = () => {
  const { user } = useAuth();
  const { userId } = useParams();
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [step, setStep] = useState(0);
  const [results, setResults] = useState<Product[] | null>(null);

  useEffect(() => {
    // Ne chargez les réponses que si l'utilisateur actuel correspond à userId
    if (user?.id && userId && Number(user.id) === Number(userId)) {
      const storedAnswers = localStorage.getItem(`simulationAnswers_${userId}`);
      if (storedAnswers) {
        setAnswers(JSON.parse(storedAnswers));
      }
    }
  }, [user, userId]);

  const questions: Question[] = [
    { id: "taille", question: "Quelle est la taille de votre entreprise ?", options: ["Indépendant", "1-5 salariés", "6-10 salariés", "11-50 salariés", "+50 salariés"] },
    { id: "secteur", question: "Quel est votre secteur d'activité ?", options: ["Agriculture", "Industrie", "Commerce", "BTP", "Transport", "Services", "Informatique", "Autre"], multiple: true },
    { id: "locaux", question: "Êtes-vous propriétaire de vos locaux professionnels ?", options: ["Oui", "Non, locataire", "Non, espace partagé/domicile"] },
    { id: "carburant", question: "Utilisez-vous des véhicules pour votre activité ?", options: ["Oui, véhicules lourds", "Oui, véhicules légers", "Oui, les deux", "Non"] },
  ];

  const products: Product[] = [
    { id: "msa", name: "Optimisation MSA", description: "Réduction des charges sociales agricoles.", icon: "🌾", link: "/produits/msa", criteria: (answers) => answers.secteur?.includes("Agriculture") },
    { id: "ticpe", name: "Récupération TICPE", description: "Remboursement de taxes sur le carburant.", icon: "⛽", link: "/produits/ticpe", criteria: (answers) => answers.carburant?.some((val) => val.startsWith("Oui")) },
  ];

  const handleSelect = (answer: string) => {
    const isMultiple = questions[step].multiple;
    setAnswers((prev) => {
      const currentAnswers = prev[questions[step].id] || [];
      const updatedAnswers = isMultiple
        ? currentAnswers.includes(answer)
          ? currentAnswers.filter(a => a !== answer)
          : [...currentAnswers, answer]
        : [answer];

      // Sauvegarder avec l'ID de l'utilisateur
      const newAnswers = { ...prev, [questions[step].id]: updatedAnswers };
      localStorage.setItem(`simulationAnswers_${userId}`, JSON.stringify(newAnswers));
      return newAnswers;
    });
  };

  const handleNext = () => setStep((prev) => prev + 1);
  const handlePrevious = () => setStep((prev) => Math.max(0, prev - 1));

  const handleSubmit = () => {
    const matchedProducts = products.filter((product) => product.criteria(answers));
    setResults(matchedProducts);
    // Sauvegarder les résultats avec l'ID de l'utilisateur
    localStorage.setItem(`eligible_products_${userId}`, JSON.stringify(matchedProducts));
    localStorage.setItem(`auditProgress_${userId}`, "true");
  };

  // Vérifier si l'utilisateur est authentifié et correspond à userId
  if (!user || !userId || Number(user.id) !== Number(userId)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">Accès non autorisé. Veuillez vous connecter avec le bon compte.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
      <HeaderClient />
      <div className="max-w-5xl mx-auto p-10 mt-20">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-6">🚀 Simulateur d'Optimisation</h1>

        {results === null ? (
          <Card className="p-8 shadow-xl bg-white rounded-xl">
            {step < questions.length ? (
              <>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">{questions[step].question}</h2>
                <div className="grid grid-cols-2 gap-6">
                  {questions[step].options.map((option) => (
                    <Button 
                      key={option} 
                      variant={answers[questions[step].id]?.includes(option) ? "default" : "outline"} 
                      onClick={() => handleSelect(option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
                <div className="mt-6 flex justify-between">
                  {step > 0 && <Button variant="ghost" onClick={handlePrevious}>← Retour</Button>}
                  <Button onClick={handleNext} disabled={!answers[questions[step].id]?.length}>Suivant →</Button>
                </div>
              </>
            ) : <Button onClick={handleSubmit}>Voir mes résultats</Button>}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {results.map((product) => (
              <Card key={product.id} className="p-6 border border-gray-200 rounded-xl shadow-xl bg-white hover:shadow-2xl transition-all text-center">
                <CardHeader>
                  <span className="text-5xl">{product.icon}</span>
                  <h3 className="text-xl font-bold mt-3">{product.name}</h3>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Simulateur;