import React, { useState } from "react";
import { 
  Building, Briefcase, Users, MapPin, Mail, Phone, FileText, 
  Search, Target, Truck, Fuel, DollarSign, AlertTriangle, 
  ClipboardList, MessageSquare, Eye, Download, 
  UserCheck, XCircle 
} from "lucide-react";
import HeaderPartner from "@/components/HeaderPartner";

const ClientFile: React.FC = () => {
  const [status, setStatus] = useState<"rejected">("rejected"); // Dossier rejeté

  const documents = [
    { name: "Déclarations TICPE (incomplet)", url: "#", type: "PDF" },
    { name: "Factures partielles", url: "#", type: "PDF" },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg relative">
      {/* Espacement pour éviter que le bandeau cache le titre */}
      <div className="mt-20"></div>

      {/* Header Partner */}
      <HeaderPartner />

      {/* Bandeau flottant expert (rejeté) */}
      <div className="fixed top-0 left-0 w-full bg-red-600 text-white p-3 shadow-md flex justify-center">
        <p className="font-semibold flex items-center">
          <XCircle className="w-5 h-5 mr-2" /> Dossier refusé ❌
        </p>
      </div>

      {/* Titre */}
      <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <FileText className="w-6 h-6 mr-2" /> Dossier Client – Audit MSA
      </h1>
      <p className="text-gray-600">📅 Date de création : 20/01/2025 | Statut : ❌ Refusé par l'expert</p>

      {/* 1. Informations Générales */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold text-gray-700 flex items-center">
          <Briefcase className="w-5 h-5 mr-2" /> 1. Informations Générales
        </h2>
        <div className="bg-gray-100 p-4 rounded-lg mt-2">
          <p><Building className="inline w-4 h-4 mr-2" /> <strong>Client :</strong> Michel Durand</p>
          <p><Briefcase className="inline w-4 h-4 mr-2" /> <strong>Entreprise :</strong> Durand & Fils</p>
          <p><Truck className="inline w-4 h-4 mr-2" /> <strong>Secteur :</strong> Agriculture</p>
          <p><Users className="inline w-4 h-4 mr-2" /> <strong>Effectif :</strong> 5 salariés</p>
          <p><MapPin className="inline w-4 h-4 mr-2" /> <strong>Adresse :</strong> 8 Route des Champs, 31000 Toulouse</p>
          <p><Mail className="inline w-4 h-4 mr-2" /> <strong>Contact :</strong> michel.durand@email.com</p>
          <p><Phone className="inline w-4 h-4 mr-2" /> <strong>Téléphone :</strong> +33 6 11 22 33 44</p>
        </div>
      </section>

      {/* 2. Motif du refus */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold text-red-700 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" /> Motif du refus
        </h2>
        <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-lg mt-2">
          <p><strong>Raison :</strong> Dossier hors périmètre d'intervention</p>
          <ul className="list-disc list-inside mt-2 text-red-700">
            <li>L'activité ne correspond pas aux critères d'éligibilité</li>
            <li>Documentation incomplète pour l'analyse</li>
            <li>Période de déclaration dépassée</li>
          </ul>
        </div>
      </section>

      {/* Section Documents */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold text-gray-700 flex items-center">
          <FileText className="w-5 h-5 mr-2" /> Documents fournis
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

      {/* Commentaire Expert */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold text-gray-700 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2" /> Commentaire de l'expert
        </h2>
        <blockquote className="italic bg-gray-100 p-4 rounded-lg mt-2">
          "Après analyse approfondie, ce dossier ne correspond pas à notre périmètre d'intervention. Les activités agricoles relèvent d'un autre type d'audit et nécessitent une expertise spécifique."
        </blockquote>
      </section>

      {/* Espacement pour éviter que le bandeau bas cache le contenu */}
      <div className="mb-24"></div>
    </div>
  );
};

export default ClientFile;
