import React, { useState } from "react";
import ProgressBar from "./ProgressBar";
import Resultats from "@/components/Resultats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ✅ Définition du type pour une question
type Question = {
  id: number;
  text: string;
  options: string[];
};

// ✅ Définition des questions sous forme de tableau d'objets
const questions: Question[] = [
  { id: 1, text: "Quelle est la nature de votre activité ?", options: ["Agriculture", "Transport / Logistique", "Industrie / Commerce", "Services", "Immobilier", "Création d’entreprise", "Autre"] },
  { id: 2, text: "Quel est votre statut ?", options: ["Travailleur indépendant", "Entreprise", "Profession libérale", "Créateur d’entreprise", "Particulier investisseur"] },
  { id: 3, text: "Avez-vous des salariés ?", options: ["Oui, salariés", "Oui, apprentis/stagiaires", "Non"] },
  { id: 4, text: "Combien d'employés avez-vous ?", options: ["Moins de 5", "5 à 20", "Plus de 20"] },
  { id: 5, text: "Avez-vous des employés avec des contrats spécifiques ?", options: ["Heures supp", "Extras", "Saisonniers", "Temporaire", "Déplacements fréquents", "Aucun"] },
  { id: 6, text: "Utilisez-vous des véhicules professionnels ?", options: ["Oui", "Non"] },
  { id: 7, text: "Avez-vous des véhicules de +3,5T ?", options: ["Oui", "Non"] },
  { id: 8, text: "Payez-vous des taxes foncières sur vos locaux ?", options: ["Oui", "Non", "Je ne sais pas"] },
];

export default function Questionnaire(): JSX.Element {
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(""));
  const [showResults, setShowResults] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // ✅ Fonction pour sélectionner une réponse
  const handleAnswer = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);
  };

  // ✅ Fonction pour avancer dans les questions
  const handleNext = () => {
    if (currentQuestion === questions.length - 1) {
      submitAnswers();
    } else {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  // ✅ Fonction pour revenir en arrière
  const handlePrevious = () => {
    setCurrentQuestion((prev) => prev - 1);
  };

  // ✅ Fonction pour soumettre les réponses
  const submitAnswers = async () => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: 1, answers }), // Remplace `1` par l'ID réel de l'utilisateur
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
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen flex flex-col items-center">
      {!showResults ? (
        <div className="w-full max-w-lg bg-white p-6 rounded-lg shadow-md">
          <ProgressBar progress={((currentQuestion + 1) / questions.length) * 100} />
          <h2 className="text-lg font-semibold mb-4">{questions[currentQuestion].text}</h2>

          {/* ✅ Liste des options */}
          <div className="space-y-2">
            {questions[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                className={`block w-full text-left p-3 border rounded-md ${
                  answers[currentQuestion] === option ? "bg-blue-500 text-white" : "hover:bg-gray-200"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {/* ✅ Boutons de navigation */}
          <div className="flex justify-between mt-4">
            <Button onClick={handlePrevious} disabled={currentQuestion === 0} className="p-2 border rounded-md disabled:opacity-50">
              Précédent
            </Button>
            <Button onClick={handleNext} className="p-2 border rounded-md" disabled={loading}>
              {loading ? "Envoi..." : currentQuestion === questions.length - 1 ? "Soumettre" : "Suivant"}
            </Button>
          </div>

          {/* ✅ Messages d'erreur ou de succès */}
          {errorMessage && <p className="text-red-500 mt-4">{errorMessage}</p>}
          {successMessage && <p className="text-green-500 mt-4">{successMessage}</p>}
        </div>
      ) : (
        <Resultats answers={answers} />
      )}
    </div>
  );
}
