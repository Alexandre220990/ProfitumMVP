import { useSimulation } from "@/hooks/use-simulation";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function Simulateur() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    questions,
    currentStep,
    localAnswers,
    isLoading,
    showResults,
    eligibleProducts,
    handleSelect,
    handleSubmit,
  } = useSimulation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Résultats de votre simulation</h1>
        <div className="grid gap-6">
          {eligibleProducts.map((product) => (
            <Card key={product.id} className="p-6">
              <h2 className="text-2xl font-semibold mb-4">{product.produit.nom}</h2>
              <p className="text-gray-600 mb-4">{product.produit.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Taux</p>
                  <p className="text-lg font-medium">{product.tauxFinal}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Montant</p>
                  <p className="text-lg font-medium">{product.montantFinal}€</p>
                </div>
              </div>
            </Card>
          ))}
          <Button
            onClick={() => navigate(`/dashboard/${user?.id}`)}
            className="mt-6"
          >
            Voir mon tableau de bord
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  if (!currentQuestion) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold mb-4 text-red-600">
          Erreur : Aucune question disponible pour l'étape actuelle.
        </h2>
        <p>Il semble que les données de la simulation soient invalides ou incomplètes.</p>
        <Button onClick={() => window.location.reload()}>Recharger</Button>
      </div>
    );
  }

  // ✅ Vérification stricte : s'assurer que "options" est un objet avec "choix"
  const choix = Array.isArray(currentQuestion.options?.choix)
    ? currentQuestion.options?.choix
    : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <Progress value={progress} className="mb-8" />
      <Card className="p-6">
        
        <h2 className="text-2xl font-semibold mb-4">{currentQuestion.texte}</h2>
        {currentQuestion.description && (
          <p className="text-gray-600 mb-6">{currentQuestion.description}</p>
        )}
        <div className="grid gap-4">
          {choix.map((option: string) => (
            <Button
              key={option}
              variant={
                localAnswers[currentQuestion.id]?.includes(option)
                  ? "default"
                  : "outline"
              }
              onClick={() => handleSelect(option)}
              className="w-full"
            >
              {option}
            </Button>
          ))}
        </div>
        {currentStep === questions.length - 1 && (
          <Button
            onClick={handleSubmit}
            className="mt-6"
            disabled={!localAnswers[currentQuestion.id]?.length}
          >
            Terminer la simulation
          </Button>
        )}
      </Card>
    </div>
  );
}
