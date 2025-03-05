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
    { id: "secteur", question: "Quel est votre secteur d'activité ?", options: ["Agriculture", "Industrie", "Commerce", "BTP", "Transport", "Services", "Informatique", "Autre"], multiple: true },
    { id: "locaux", question: "Êtes-vous propriétaire de vos locaux professionnels ?", options: ["Oui", "Non, locataire", "Non, espace partagé/domicile"] },
      { id: "structure", question: "Quelle est la structure juridique de votre entreprise ?", options: ["SAS / SASU", "SARL / EURL", "EI / Micro-entreprise", "Association", "Autre"] },
      { id: "salariés", question: "Combien de salariés employez-vous ?", options: ["0 (dirigeant seul)", "1-5", "6-20", "21-50", "50+"] },
      { id: "chiffre", question: "Quel est votre chiffre d'affaires annuel moyen ?", options: ["Moins de 100 000 €", "Entre 100 000 et 500 000 €", "Entre 500 000 et 2 000 000 €", "Plus de 2 000 000 €"] },
      { id: "secteur", question: "À quelle catégorie d'activité appartient votre entreprise ?", options: ["Commerce", "Industrie", "Services", "BTP", "Santé", "Agriculture", "Autre"], multiple: true },
      { id: "tva", question: "Êtes-vous assujetti à la TVA ?", options: ["Oui", "Non", "Je ne sais pas"] },
      { id: "exonérations", question: "Votre entreprise bénéficie-t-elle d’aides ou exonérations sociales ?", options: ["Oui (exonérations ZFU, JEI, CIR, etc.)", "Non", "Je ne sais pas"] },
      { id: "audit", question: "Avez-vous déjà réalisé un audit social ou fiscal ?", options: ["Oui, récemment", "Oui, il y a plus de 2 ans", "Non"] },
      { id: "contrats", question: "Avez-vous des salariés en contrat aidé ou exonéré de charges ?", options: ["Oui", "Non", "Je ne sais pas"] },
      { id: "charges", question: "Quels sont vos principaux postes de dépenses ?", options: ["Salaires et charges sociales", "Loyers et charges locatives", "Matériel et équipements", "Prestations de services externes", "Transport et logistique", "Autres"], multiple: true },
      { id: "masse", question: "Quelle est votre masse salariale mensuelle estimée ?", options: ["Moins de 5 000 €", "Entre 5 000 et 20 000 €", "Entre 20 000 et 50 000 €", "Plus de 50 000 €"] },
      { id: "optimisation", question: "Souhaitez-vous optimiser vos cotisations sociales et fiscales ?", options: ["Oui", "Non", "Je ne sais pas"] },
      { id: "gestion", question: "Disposez-vous d’un service de gestion comptable ou RH interne ?", options: ["Oui", "Non, nous sous-traitons", "Non, tout est géré en interne par le dirigeant"] },
      { id: "subventions", question: "Pensez-vous que votre entreprise pourrait être éligible à des subventions ou exonérations ?", options: ["Oui", "Non", "Je ne sais pas"] },
      { id: "interet", question: "Quels sont les sujets d'optimisation qui vous intéressent ?", options: ["Réduction des charges sociales", "Récupération de cotisations payées en trop", "Exonérations fiscales", "Crédit d’impôt et aides publiques", "Financement et subventions", "Optimisation des contrats de travail"], multiple: true },
    { id: "carburant", question: "Utilisez-vous des véhicules pour votre activité ?", options: ["Oui, véhicules lourds", "Oui, véhicules légers", "Oui, les deux", "Non"] },
  ];

  const products: Product[] = [
    { 
      id: "urssaf", 
      name: "Audit des cotisations URSSAF et MSA", 
      description: "Vérification et réduction des cotisations sociales.", 
      icon: "🏢", 
      link: "/produits/urssaf", 
      criteria: (answers) => answers.audit?.includes("Oui, récemment") || answers.audit?.includes("Oui, il y a plus de 2 ans") 
    },
    { 
      id: "social", 
      name: "Réduction des charges sociales et exonérations employeurs", 
      description: "Audit des charges sociales et exonérations pour les employeurs.", 
      icon: "👥", 
      link: "/produits/social", 
      criteria: (answers) => answers.exonérations?.includes("Oui (exonérations ZFU, JEI, CIR, etc.)") || answers.contrats?.includes("Oui") 
    },
    { 
      id: "ticpe", 
      name: "Récupération de TICPE", 
      description: "Remboursement de la taxe intérieure sur les produits énergétiques.", 
      icon: "⛽", 
      link: "/produits/ticpe", 
      criteria: (answers) => answers.charges?.includes("Transport et logistique") 
    },
    { 
      id: "msa", 
      name: "Optimisation des cotisations MSA", 
      description: "Réduction des charges sociales agricoles.", 
      icon: "🌾", 
      link: "/produits/msa", 
      criteria: (answers) => answers.secteur?.includes("Agriculture") 
    },
    { 
      id: "foncier", 
      name: "Audit des taxes foncières et optimisation", 
      description: "Analyse et réduction des taxes foncières.", 
      icon: "🏠", 
      link: "/produits/foncier", 
      criteria: (answers) => answers.structure?.includes("SAS / SASU") || answers.structure?.includes("SARL / EURL") 
    },
    { 
      id: "audit_energetique", 
      name: "Audit énergétique", 
      description: "Optimisation des coûts énergétiques et éligibilité aux aides.", 
      icon: "⚡", 
      link: "/produits/audit-energetique", 
      criteria: (answers) => answers.charges?.includes("Matériel et équipements") || answers.charges?.includes("Loyers et charges locatives") 
    },
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