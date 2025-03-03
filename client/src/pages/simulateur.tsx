import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import HeaderClient from "@/components/HeaderClient";
import { Link } from "wouter";
import { ArrowLeftCircle, Building, Truck, DollarSign, BarChart3 } from "lucide-react";
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

const getIconForProduct = (productId: string) => {
  switch (productId) {
    case 'msa':
      return Building;
    case 'ticpe':
      return Truck;
    case 'dfs':
      return DollarSign;
    default:
      return BarChart3;
  }
};

const Simulateur = () => {
  const { user } = useAuth();
  const { userId } = useParams();
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [step, setStep] = useState(0);
  const [results, setResults] = useState<Product[] | null>(null);

  useEffect(() => {
    if (user?.id && userId && Number(user.id) === Number(userId)) {
      const storedAnswers = localStorage.getItem(`simulationAnswers_${user.id}`);
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

      const newAnswers = { ...prev, [questions[step].id]: updatedAnswers };
      localStorage.setItem(`simulationAnswers_${user?.id}`, JSON.stringify(newAnswers));
      return newAnswers;
    });
  };

  const handleNext = () => setStep((prev) => prev + 1);
  const handlePrevious = () => setStep((prev) => Math.max(0, prev - 1));

  const handleSubmit = () => {
    const matchedProducts = products.filter((product) => product.criteria(answers));
    setResults(matchedProducts);

    // Sauvegarder uniquement les produits éligibles avec l'id de l'utilisateur
    const auditProgress = matchedProducts.reduce((acc, product) => {
      acc[product.id] = 0;
      return acc;
    }, {} as Record<string, number>);

    localStorage.setItem(`auditProgress_${user?.id}`, JSON.stringify(auditProgress));
  };

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
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              Produits recommandés pour votre entreprise
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {results.map((product) => {
                const Icon = getIconForProduct(product.id);
                return (
                  <Card key={product.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="space-y-1 text-center bg-blue-50 p-6">
                      <div className="mx-auto bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                        <Icon className="h-8 w-8 text-blue-600" />
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900">
                        {product.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 flex flex-col flex-grow">
                      <CardDescription className="text-gray-600 text-sm mb-6">
                        {product.description}
                      </CardDescription>
                      <div className="mt-auto">
                        <Link href={`/produits/${product.id}/${user.id}`} className="block">
                          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                            Commencer le process
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-8 text-center">
              <Link href={`/dashboard/client/${userId}`}>
                <Button variant="outline" className="mx-auto">
                  Retour au tableau de bord
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Simulateur;