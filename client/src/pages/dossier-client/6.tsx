import React, { useState } from "react";
import { 
  Building, Briefcase, Users, MapPin, Mail, Phone, FileText, 
  Search, Target, Truck, Fuel, DollarSign, AlertTriangle, 
  ClipboardList, MessageSquare, Eye, Download, 
  UserCheck, XCircle 
} from "lucide-react";
import HeaderPartner from "@/components/HeaderPartner";

const ClientFile: React.FC = () => {
  const [status, setStatus] = useState<"accepted">("accepted"); // Dossier accepté

  const documents = [
    { name: "Déclarations TICPE (2024)", url: "#", type: "PDF" },
    { name: "Factures d’achats de carburant", url: "#", type: "PDF" },
    { name: "Justificatifs conformité environnementale", url: "#", type: "PDF" },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg relative">

      {/* Espacement pour éviter que le bandeau cache le titre */}
      <div className="mt-20"></div>

      {/* Header Partner */}
      <HeaderPartner />

      {/* Bandeau flottant expert (accepté) */}
      <div className="fixed top-0 left-0 w-full bg-green-600 text-white p-3 shadow-md flex justify-center">
        <p className="font-semibold flex items-center">
          <UserCheck className="w-5 h-5 mr-2" /> Dossier validé avec succès ✅
        </p>
      </div>

      {/* Titre */}
      <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <FileText className="w-6 h-6 mr-2" /> Dossier Client – Audit TICPE
      </h1>
      <p className="text-gray-600">📅 Date de création : 10/01/2025 | Statut : ✅ Accepté par l'expert</p>

      {/* 1. Informations Générales */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold text-gray-700 flex items-center">
          <Briefcase className="w-5 h-5 mr-2" /> 1. Informations Générales
        </h2>
        <div className="bg-gray-100 p-4 rounded-lg mt-2">
          <p><Building className="inline w-4 h-4 mr-2" /> <strong>Client :</strong> Jean Dupont</p>
          <p><Briefcase className="inline w-4 h-4 mr-2" /> <strong>Entreprise :</strong> Dupont Transports</p>
          <p><Truck className="inline w-4 h-4 mr-2" /> <strong>Secteur :</strong> Transport routier</p>
          <p><Users className="inline w-4 h-4 mr-2" /> <strong>Effectif :</strong> 30 salariés</p>
          <p><MapPin className="inline w-4 h-4 mr-2" /> <strong>Adresse :</strong> 15 Rue des Marchands, 69003 Lyon</p>
          <p><Mail className="inline w-4 h-4 mr-2" /> <strong>Contact :</strong> jean.dupont@email.com</p>
          <p><Phone className="inline w-4 h-4 mr-2" /> <strong>Téléphone :</strong> +33 6 12 34 56 78</p>
          <p><FileText className="inline w-4 h-4 mr-2" /> <strong>Responsable du dossier :</strong> [Nom du consultant]</p>
        </div>
      </section>

      {/* 2. Contexte & Objectifs */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold text-gray-700 flex items-center">
          <Search className="w-5 h-5 mr-2" /> 2. Contexte & Objectifs
        </h2>
        <div className="border-l-4 border-blue-500 bg-gray-100 p-4 rounded-lg mt-2">
          <p><strong>Problématique :</strong> Jean Dupont souhaite <u>optimiser la récupération de la TICPE</u> et vérifier la <u>conformité des remboursements</u> des 3 dernières années.</p>
          <p className="mt-2 flex items-center">
            <Target className="w-5 h-5 mr-2" /> <strong>Objectifs principaux :</strong>
          </p>
          <ul className="list-disc list-inside ml-4">
            <li>Analyse des remboursements précédents</li>
            <li>Correction des éventuelles erreurs de déclaration</li>
            <li>Conseils pour optimiser les remboursements futurs</li>
          </ul>
        </div>
      </section>

      {/* 3. Analyse des Données Client */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold text-gray-700 flex items-center">
          <ClipboardList className="w-5 h-5 mr-2" /> 3. Analyse des Données Client
        </h2>
        <div className="overflow-x-auto mt-2">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-blue-500 text-white text-left">
                <th className="p-3">Élément</th>
                <th className="p-3">Détail</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-gray-100">
                <td className="p-3 border border-gray-200 flex items-center">
                  <Truck className="w-4 h-4 mr-2" /> Flotte de véhicules
                </td>
                <td className="p-3 border border-gray-200">8 camions (Euro 6)</td>
              </tr>
              <tr>
                <td className="p-3 border border-gray-200 flex items-center">
                  <Fuel className="w-4 h-4 mr-2" /> Consommation annuelle
                </td>
                <td className="p-3 border border-gray-200">180 000 litres de gazole</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section Documents */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold text-gray-700 flex items-center">
          <FileText className="w-5 h-5 mr-2" /> 4. Documents
        </h2>
        <div className="bg-gray-100 p-4 rounded-lg mt-2">
          <ul className="divide-y divide-gray-300">
            {documents.map((doc, index) => (
              <li key={index} className="flex justify-between items-center py-2">
                <span className="flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-gray-600" /> {doc.name}
                </span>
                <div className="flex space-x-2">
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 flex items-center">
                    <Eye className="w-4 h-4 mr-1" /> Visualiser
                  </a>
                  <a href={doc.url} download className="text-green-500 hover:text-green-700 flex items-center">
                    <Download className="w-4 h-4 mr-1" /> Télécharger
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Espacement pour éviter que le bandeau bas cache le contenu */}
      <div className="mb-24"></div>

    </div>
  );
};

export default ClientFile;
