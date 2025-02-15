import React from "react";
import { Button } from "@/components/ui/button";

// ✅ Définition des types TypeScript
interface ResultatsProps {
  answers: string[];
}

export default function Resultats({ answers }: ResultatsProps): JSX.Element {
  // ✅ Fonction pour déterminer les services recommandés
  const determineServices = (): string[] => {
    const services: string[] = [];

    if (answers.includes("Agriculture")) services.push("Audit MSA, exonérations agricoles");
    if (answers.includes("Transport / Logistique") || answers.includes("Oui, véhicules +3,5T")) services.push("Audit TICPE, récupération taxes carburant");
    if (answers.includes("Propriétaire") || answers.includes("Oui, taxes foncières")) services.push("Audit foncier, réduction des taxes");
    if (answers.includes("Oui, salariés") || answers.includes("URSSAF")) services.push("Audit URSSAF, exonérations sociales");

    return services;
  };

  const servicesList = determineServices();

  return (
    <div className="w-full max-w-lg bg-white p-6 rounded-lg shadow-md text-center">
      <h2 className="text-xl font-semibold mb-4">Services recommandés :</h2>

      {servicesList.length > 0 ? (
        <ul className="list-disc pl-6 text-left">
          {servicesList.map((service, index) => (
            <li key={index} className="mb-2 text-gray-700">{service}</li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">Aucun service spécifique recommandé en fonction de vos réponses.</p>
      )}

      {/* ✅ Ajout d'une animation hover + meilleure disposition du bouton */}
      <Button className="mt-6 w-full bg-blue-600 text-white hover:bg-blue-700 transition-all">
        Demander un devis
      </Button>
    </div>
  );
}
