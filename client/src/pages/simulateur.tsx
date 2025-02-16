import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";
import { HelpDialog } from "@/components/HelpDialog";
import { helpContent } from "@/lib/help-content";

const questions = [
  {
    id: 1,
    text: "Quel est votre secteur d'activité ?",
    options: ["Agriculture", "Transport / Logistique", "Industrie / Commerce", "Services", "Autre"],
  },
  {
    id: 2,
    text: "Êtes-vous propriétaire ou locataire de vos locaux professionnels ?",
    options: ["Propriétaire", "Locataire"],
  },
  {
    id: 3,
    text: "Avez-vous des salariés ?",
    options: ["Oui", "Non"],
  },
  {
    id: 4,
    text: "Utilisez-vous des véhicules professionnels utilisant du carburant ?",
    options: ["Oui", "Non"],
  },
  {
    id: 5,
    text: "Avez-vous déjà payé des taxes foncières sur vos locaux ?",
    options: ["Oui", "Non", "Je ne sais pas"],
  },
  {
    id: 6,
    text: "Êtes-vous affilié à la MSA (Mutualité Sociale Agricole) ?",
    options: ["Oui", "Non"],
  },
  {
    id: 7,
    text: "Êtes-vous assujetti aux cotisations URSSAF ?",
    options: ["Oui", "Non", "Je ne sais pas"],
  },
  {
    id: 8,
    text: "Avez-vous perçu des aides fiscales ou exonérations spécifiques liées à votre activité ?",
    options: ["Oui", "Non", "Je ne sais pas"],
  },
];

type AuditType = "MSA" | "TICPE" | "Foncier" | "URSSAF" | "DFS";

const determineEligibleAudits = (answers: string[]): AuditType[] => {
  const eligibleAudits = new Set<AuditType>();

  const sector = answers[0];
  const isOwner = answers[1] === "Propriétaire";
  const hasEmployees = answers[2] === "Oui";
  const usesVehicles = answers[3] === "Oui";
  const paysPropertyTax = answers[4] === "Oui";
  const hasMSA = answers[5] === "Oui";
  const hasURSSAF = answers[6] === "Oui";
  const hasAids = answers[7] === "Oui";

  if (sector === "Agriculture" || hasMSA || hasAids) {
    eligibleAudits.add("MSA");
  }

  if (usesVehicles || sector === "Transport / Logistique") {
    eligibleAudits.add("TICPE");
  }

  if (isOwner || paysPropertyTax) {
    eligibleAudits.add("Foncier");
  }

  if (hasEmployees || hasURSSAF) {
    eligibleAudits.add("URSSAF");
  }

  if (sector === "Agriculture" || hasAids) {
    eligibleAudits.add("DFS");
  }

  return Array.from(eligibleAudits);
};

const auditDescriptions = {
  energy: "Optimisation de vos dépenses énergétiques TICPE et identification des sources d'économies potentielles.",
  social: "Analyse et optimisation de vos charges sociales et cotisations URSSAF.",
  property: "Évaluation et réduction de vos taxes foncières et charges immobilières.",
  msa: "Analyse complète des cotisations MSA et optimisation des charges agricoles.",
  dfs: "Dispositifs de Fiscalité Spécifique : analyse et optimisation des aides fiscales sectorielles.",
};

export default function Simulation() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(""));
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion === questions.length - 1) {
      const eligible = determineEligibleAudits(answers);
      localStorage.setItem('eligibleAudits', JSON.stringify(eligible));
      setShowResults(true);
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentQuestion(currentQuestion - 1);
  };

  const eligibleAudits = determineEligibleAudits(answers);
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (showResults) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {eligibleAudits.length > 0
                  ? "Voici le résultat préliminaire, vous êtes éligible aux audits suivants :"
                  : "Selon vos réponses, vous n'êtes pas éligible aux audits pour le moment."}
              </CardTitle>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {eligibleAudits.includes("TICPE") && (
              <Card className="flex flex-col h-full">
                <CardContent className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-semibold mb-4">Audit Énergétique</h3>
                  <p className="text-gray-600 mb-6 flex-grow">{auditDescriptions.energy}</p>
                  <Link href="/audit/energy">
                    <Button className="w-full">Accéder à l'audit</Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {eligibleAudits.includes("URSSAF") && (
              <Card className="flex flex-col h-full">
                <CardContent className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-semibold mb-4">Audit Social</h3>
                  <p className="text-gray-600 mb-6 flex-grow">{auditDescriptions.social}</p>
                  <Link href="/audit/social">
                    <Button className="w-full">Accéder à l'audit</Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {eligibleAudits.includes("Foncier") && (
              <Card className="flex flex-col h-full">
                <CardContent className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-semibold mb-4">Audit Foncier</h3>
                  <p className="text-gray-600 mb-6 flex-grow">{auditDescriptions.property}</p>
                  <Link href="/audit/property">
                    <Button className="w-full">Accéder à l'audit</Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {eligibleAudits.includes("MSA") && (
              <Card className="flex flex-col h-full">
                <CardContent className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-semibold mb-4">Audit MSA</h3>
                  <p className="text-gray-600 mb-6 flex-grow">{auditDescriptions.msa}</p>
                  <Link href="/audit/msa">
                    <Button className="w-full">Accéder à l'audit</Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {eligibleAudits.includes("DFS") && (
              <Card className="flex flex-col h-full">
                <CardContent className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-semibold mb-4">Audit DFS</h3>
                  <p className="text-gray-600 mb-6 flex-grow">{auditDescriptions.dfs}</p>
                  <Link href="/audit/dfs">
                    <Button className="w-full">Accéder à l'audit</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="mt-6">
            <Link href="/">
              <Button variant="outline">Retour au tableau de bord</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">Question {currentQuestion + 1} sur {questions.length}</span>
            <span className="text-sm font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{questions[currentQuestion].text}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <RadioGroup
                value={answers[currentQuestion]}
                onValueChange={handleAnswer}
                className="space-y-4"
              >
                {questions[currentQuestion].options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>

              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Précédent
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!answers[currentQuestion]}
                >
                  {currentQuestion === questions.length - 1 ? "Voir les résultats" : "Suivant"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}