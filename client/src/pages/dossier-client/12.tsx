import React from "react";
import { 
  Building, Briefcase, FileText, ClipboardList, Eye, Download, 
  DollarSign, CheckCircle2, Calendar, Percent, MapPin, Users, Mail, Phone
} from "lucide-react";
import HeaderPartner from "@/components/HeaderPartner";

const DossierCelineLeroy: React.FC = () => {
  const dossier = {
    clientName: "Céline Leroy",
    auditType: "Audit TICPE",
    closureDate: "28/01/2025",
    estimatedAmount: 3000,
    obtainedAmount: 4000,
    fiability: 67,
    status: "success",
    comments: "Audit concluant avec optimisation fiscale réalisée, récupération supérieure aux prévisions."
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
          <p className="text-gray-600"><Briefcase className="inline w-4 h-4 mr-2" /> <strong>Entreprise :</strong> Entreprise Leroy Transports</p>
          <p className="text-gray-600"><Users className="inline w-4 h-4 mr-2" /> <strong>Effectif :</strong> 30 salariés</p>
          <p className="text-gray-600"><MapPin className="inline w-4 h-4 mr-2" /> <strong>Adresse :</strong> 45 Avenue des Champs, 75008 Paris</p>
          <p className="text-gray-600"><Mail className="inline w-4 h-4 mr-2" /> <strong>Contact :</strong> celine.leroy@email.com</p>
          <p className="text-gray-600"><Phone className="inline w-4 h-4 mr-2" /> <strong>Téléphone :</strong> +33 6 78 12 34 56</p>
          <p className="text-gray-600"><FileText className="inline w-4 h-4 mr-2" /> <strong>Responsable du dossier :</strong> [Nom du consultant]</p>
        </div>

        {/* 🔵 Commentaires */}
        <div className="mt-6 bg-gray-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center">
            <FileText className="w-5 h-5 mr-2" /> Commentaires
          </h3>
          <p className="italic text-gray-600 mt-2">{dossier.comments}</p>
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

export default DossierCelineLeroy;
