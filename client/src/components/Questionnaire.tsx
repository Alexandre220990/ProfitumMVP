import React, { useState, useCallback, useMemo } from "react";
import { ProgressBar } from "./ProgressBar";
import { Button } from "@/components/ui/button";
import { config } from "@/config/env";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowLeft, ArrowRight, Send } from "lucide-react";

// ✅ Définition du type pour une question
interface Question {
  id: number;
  text: string;
  options: string[];
}

// ✅ Définition du type pour les résultats
interface QuestionnaireResults {
  answers: string[];
  totalQuestions: number;
  completedQuestions: number;
  estimatedSavings: string;
  eligibleProducts: number;
}

// ✅ Définition des questions sous forme de tableau d'objets
const questions: Question[] = [
  { 
    id: 1, 
    text: "Quelle est la nature de votre activité ?", 
    options: ["Agriculture", "Transport / Logistique", "Industrie / Commerce", "Services", "Immobilier", "Création d'entreprise", "Autre"] 
  },
  { 
    id: 2, 
    text: "Quel est votre statut ?", 
    options: ["Travailleur indépendant", "Entreprise", "Profession libérale", "Créateur d'entreprise", "Particulier investisseur"] 
  },
  { 
    id: 3, 
    text: "Avez-vous des salariés ?", 
    options: ["Oui, salariés", "Oui, apprentis/stagiaires", "Non"] 
  },
  { 
    id: 4, 
    text: "Combien d'employés avez-vous ?", 
    options: ["Moins de 5", "5 à 20", "Plus de 20"] 
  },
  { 
    id: 5, 
    text: "Avez-vous des employés avec des contrats spécifiques ?", 
    options: ["Heures supp", "Extras", "Saisonniers", "Temporaire", "Déplacements fréquents", "Aucun"] 
  },
  { 
    id: 6, 
    text: "Utilisez-vous des véhicules professionnels ?", 
    options: ["Oui", "Non"] 
  },
  { 
    id: 7, 
    text: "Avez-vous des véhicules de +3,5T ?", 
    options: ["Oui", "Non"] 
  },
  { 
    id: 8, 
    text: "Payez-vous des taxes foncières sur vos locaux ?", 
    options: ["Oui", "Non", "Je ne sais pas"] 
  },
];

// Composant Resultats intégré
const Resultats: React.FC<{ answers: string[] }> = React.memo(({ answers }) => {
  const results = useMemo((): QuestionnaireResults => {
    const completedQuestions = answers.filter(answer => answer !== "").length;
    const totalQuestions = questions.length;
    
    // Calcul basique des économies potentielles basé sur les réponses
    let estimatedSavings = "€5,000 - €10,000";
    let eligibleProducts = 2;
    
    if (completedQuestions >= 6) {
      estimatedSavings = "€15,000 - €25,000";
      eligibleProducts = 4;
    } else if (completedQuestions >= 4) {
      estimatedSavings = "€10,000 - €15,000";
      eligibleProducts = 3;
    }
    
    return {
      answers,
      totalQuestions,
      completedQuestions,
      estimatedSavings,
      eligibleProducts
    };
  }, [answers]);

  return (
    <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-slate-800 mb-4">
          Résultats de votre questionnaire
        </h1>
        <p className="text-lg text-slate-600">
          Voici un aperçu des opportunités d'optimisation identifiées pour votre entreprise.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-emerald-800 mb-2">Économies potentielles</h3>
            <p className="text-3xl font-bold text-emerald-600">{results.estimatedSavings}</p>
            <p className="text-sm text-emerald-600">par an</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-800 mb-2">Produits éligibles</h3>
            <p className="text-3xl font-bold text-blue-600">{results.eligibleProducts}</p>
            <p className="text-sm text-blue-600">opportunités identifiées</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-slate-50 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Récapitulatif de vos réponses</h2>
        <div className="space-y-3">
          {questions.map((question, index) => (
            <div key={question.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-sm text-slate-600 flex-1">{question.text}</span>
              <span className="text-sm font-medium text-slate-800 ml-4">
                {answers[index] || "Non répondu"}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-slate-600 mb-6">
          Pour commencer votre démarche d'optimisation, contactez-nous ou consultez nos experts.
        </p>
        <div className="space-x-4">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3">
            Commencer maintenant
          </Button>
          <Button variant="outline" className="px-6 py-3">
            En savoir plus
          </Button>
        </div>
      </div>
    </div>
  );
});

Resultats.displayName = 'Resultats';

const Questionnaire: React.FC = React.memo(() => {
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(""));
  const [showResults, setShowResults] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");



  // ✅ Vérification si on peut avancer
  const canProceed = useMemo(() => {
    return answers[currentQuestion] !== "";
  }, [answers, currentQuestion]);

  // ✅ Fonction pour sélectionner une réponse optimisée
  const handleAnswer = useCallback((value: string) => {
    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentQuestion] = value;
      return newAnswers;
    });
  }, [currentQuestion]);

  // ✅ Fonction pour avancer dans les questions optimisée
  const handleNext = useCallback(() => {
    if (currentQuestion === questions.length - 1) {
      submitAnswers();
    } else {
      setCurrentQuestion(prev => prev + 1);
    }
  }, [currentQuestion]);

  // ✅ Fonction pour revenir en arrière optimisée
  const handlePrevious = useCallback(() => {
    setCurrentQuestion(prev => prev - 1);
  }, []);

  // ✅ Fonction pour soumettre les réponses optimisée
  const submitAnswers = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`${config.API_URL}/api/questionnaire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: 1, // Remplace `1` par l'ID réel de l'utilisateur
          answers 
        }),
      });

      if (response.ok) {
        setShowResults(true);
        setSuccessMessage("Vos réponses ont bien été enregistrées !");
      } else {
        setErrorMessage("Erreur lors de l'enregistrement des réponses.");
      }
    } catch (error) {
      setErrorMessage("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }, [answers]);

  // ✅ Gestionnaire de retour aux questions
  const handleBackToQuestions = useCallback(() => {
    setShowResults(false);
    setCurrentQuestion(0);
  }, []);

  if (showResults) {
    return (
      <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen flex flex-col items-center">
        <Resultats answers={answers} />
        <Button 
          onClick={handleBackToQuestions}
          variant="outline"
          className="mt-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Modifier mes réponses
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen flex flex-col items-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-800">
            Questionnaire d'éligibilité
          </CardTitle>
          <ProgressBar 
            current={currentQuestion + 1} 
            total={questions.length}
            className="mt-4"
          />
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-slate-800 mb-4">
              {questions[currentQuestion].text}
            </h2>

            <div className="space-y-3">
              {questions[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  className={`w-full text-left p-4 border rounded-lg transition-all duration-200 ${
                    answers[currentQuestion] === option 
                      ? "bg-blue-600 text-white border-blue-600 shadow-md" 
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-200">
            <Button 
              onClick={handlePrevious} 
              disabled={currentQuestion === 0}
              variant="outline"
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Précédent
            </Button>
            
            <Button 
              onClick={handleNext} 
              disabled={!canProceed || loading}
              className="flex items-center bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Send className="w-4 h-4 mr-2 animate-pulse" />
                  Envoi...
                </>
              ) : currentQuestion === questions.length - 1 ? (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Soumettre
                </>
              ) : (
                <>
                  Suivant
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errorMessage}</p>
            </div>
          )}
          
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-emerald-600 text-sm">{successMessage}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

Questionnaire.displayName = 'Questionnaire';

export default Questionnaire;
