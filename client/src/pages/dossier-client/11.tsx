import React from "react";
import { 
  Building, Briefcase, FileText, ClipboardList, Eye, Download, 
  DollarSign, CheckCircle2, Calendar, Percent, MapPin, Users, Mail, Phone
} from "lucide-react";
import HeaderPartner from "@/components/HeaderPartner";

const DossierJulienMercier: React.FC = () => {
  const dossier = {
    clientName: "Julien Mercier",
    auditType: "Audit TICPE",
    closureDate: "01/02/2025",
    estimatedAmount: 7800,
    obtainedAmount: 5000,
    fiability: 64,
    status: "success",
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-50 min-h-screen">

      {/* Header Partner */}
      <HeaderPartner />

      {/* Espacement pour éviter que le header fixe ne cache le titre */}
      <div className="mt-24"></div>

      {/* Titre principal sous le header */}
      <h1 className="text-3xl font-bold text-gray-800 text-center">
        Suivi du dossier – {dossier.clientName}
      </h1>

      {/* Ligne de séparation */}
      <div className="border-b border-gray-300 my-4"></div>

      {/* Bandeau vert indiquant le succès */}
      <div className="relative bg-green-600 text-white p-3 shadow-md flex justify-center rounded-lg">
        <p className="font-semibold flex items-center">
          <CheckCircle2 className="w-5 h-5 mr-2" /> Dossier clôturé avec succès !
        </p>
      </div>

      {/* SECTION KPI - Présentation Synthétique */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-20">

        {/* Montant estimé */}
        <div className="bg-white shadow-lg rounded-xl p-6 flex flex-col items-center">
          <DollarSign className="w-10 h-10 text-gray-600 mb-2" />
          <p className="text-sm text-gray-500">Montant estimé</p>
          <p className="text-2xl font-bold text-gray-800">{dossier.estimatedAmount} €</p>
        </div>

        {/* Montant obtenu */}
        <div className="bg-blue-100 shadow-lg rounded-xl p-6 flex flex-col items-center">
          <DollarSign className="w-10 h-10 text-blue-600 mb-2" />
          <p className="text-sm text-gray-500">Montant obtenu</p>
          <p className="text-2xl font-bold text-blue-800">{dossier.obtainedAmount} €</p>
        </div>

        {/* Fiabilité */}
        <div className="bg-gray-100 shadow-lg rounded-xl p-6 flex flex-col items-center">
          <Percent className="w-10 h-10 text-gray-700 mb-2" />
          <p className="text-sm text-gray-500">Fiabilité</p>
          <p className="text-2xl font-bold text-gray-800">{dossier.fiability}%</p>
        </div>

        {/* Date de clôture */}
        <div className="bg-gray-100 shadow-lg rounded-xl p-6 flex flex-col items-center">
          <Calendar className="w-10 h-10 text-gray-700 mb-2" />
          <p className="text-sm text-gray-500">Date de clôture</p>
          <p className="text-2xl font-bold text-gray-800">{dossier.closureDate}</p>
        </div>
      </div>

      {/* SECTION DÉTAILS DU DOSSIER */}
      <section className="mt-10 bg-white shadow-lg rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-700 flex items-center">
          <ClipboardList className="w-5 h-5 mr-2" /> Détails du dossier
        </h2>

        {/* 🟢 Informations Générales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 bg-gray-100 p-4 rounded-lg">
          <p className="text-gray-600"><Building className="inline w-4 h-4 mr-2" /> <strong>Client :</strong> {dossier.clientName}</p>
          <p className="text-gray-600"><Briefcase className="inline w-4 h-4 mr-2" /> <strong>Entreprise :</strong> Transports Lambert</p>
          <p className="text-gray-600"><Users className="inline w-4 h-4 mr-2" /> <strong>Effectif :</strong> 45 salariés</p>
          <p className="text-gray-600"><MapPin className="inline w-4 h-4 mr-2" /> <strong>Adresse :</strong> 12 Rue des Routiers, 75015 Paris</p>
          <p className="text-gray-600"><Mail className="inline w-4 h-4 mr-2" /> <strong>Contact :</strong> paul.lambert@email.com</p>
          <p className="text-gray-600"><Phone className="inline w-4 h-4 mr-2" /> <strong>Téléphone :</strong> +33 6 45 78 12 34</p>
          <p className="text-gray-600"><FileText className="inline w-4 h-4 mr-2" /> <strong>Responsable du dossier :</strong> [Nom du consultant]</p>
        </div>

        {/* 🟠 Contexte & Objectifs */}
        <div className="mt-6 bg-gray-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center">
            <FileText className="w-5 h-5 mr-2" /> Contexte & Objectifs
          </h3>
          <p className="text-gray-600 mt-2"><strong>Problématique :</strong> Paul Lambert souhaite <u>optimiser la récupération de la TICPE</u> et s’assurer de la <u>conformité fiscale</u> sur les 3 dernières années.</p>
          <p className="mt-2 flex items-center text-gray-700 font-semibold">
            Objectifs principaux :
          </p>
          <ul className="list-disc list-inside ml-4 text-gray-600">
            <li>Vérification des montants remboursables</li>
            <li>Identification des optimisations possibles</li>
            <li>Sécurisation des déclarations pour éviter tout redressement</li>
            <li>Conseil sur les stratégies futures pour réduire les coûts</li>
          </ul>
        </div>

        {/* 🔵 Analyse des Données Client */}
        <div className="mt-6 bg-gray-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center">
            <ClipboardList className="w-5 h-5 mr-2" /> Analyse des Données Client
          </h3>
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
                    <Briefcase className="w-4 h-4 mr-2" /> Flotte de véhicules
                  </td>
                  <td className="p-3 border border-gray-200">12 camions (Euro 5 & Euro 6)</td>
                </tr>
                <tr>
                  <td className="p-3 border border-gray-200 flex items-center">
                    <FileText className="w-4 h-4 mr-2" /> Consommation annuelle
                  </td>
                  <td className="p-3 border border-gray-200">320 000 litres de gazole</td>
                </tr>
                <tr className="bg-gray-100">
                  <td className="p-3 border border-gray-200 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" /> Remboursement TICPE précédent
                  </td>
                  <td className="p-3 border border-gray-200">21 500 € (2023)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </section>

      {/* SECTION DOCUMENTS */}
      <section className="mt-6 bg-white shadow-lg rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-700 flex items-center">
          <FileText className="w-5 h-5 mr-2" /> Documents du dossier
        </h2>
        <div className="bg-gray-100 p-4 rounded-lg mt-2">
          <ul className="divide-y divide-gray-300">
            <li className="flex justify-between items-center py-2">
              <span className="flex items-center">
                <FileText className="w-4 h-4 mr-2 text-gray-600" /> Rapport Final d'Audit
              </span>
              <div className="flex space-x-2">
                <a href="#" className="text-blue-500 hover:text-blue-700 flex items-center">
                  <Eye className="w-4 h-4 mr-1" /> Visualiser
                </a>
                <a href="#" className="text-green-500 hover:text-green-700 flex items-center">
                  <Download className="w-4 h-4 mr-1" /> Télécharger
                </a>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Espacement pour éviter que le bandeau bas cache le contenu */}
      <div className="mb-24"></div>

    </div>
  );
};

export default DossierJulienMercier;
