import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Building, Briefcase, Users, MapPin, Mail, Phone, FileText, 
  Search, Target, Truck, Fuel, DollarSign, AlertTriangle, 
  ClipboardList, MessageSquare, Eye, Download, 
  UserCheck, XCircle,
  Calendar
} from "lucide-react";
import HeaderPartner from "@/components/HeaderPartner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// Types de dossiers
type DossierStatus = "pending" | "accepted" | "rejected" | "in_progress" | "closed" | "success";

interface Document {
  name: string;
  url: string;
  type: string;
}

interface Dossier {
  id: number;
  status: DossierStatus;
  clientName: string;
  companyName: string;
  sector: string;
  employees: number;
  address: string;
  email: string;
  phone: string;
  auditType: string;
  creationDate: string;
  context?: string;
  objectives?: string[];
  fleetSize?: string;
  annualConsumption?: string;
  previousRefund?: string;
  documents: Document[];
  progression?: { étape: string; completed: boolean }[];
  comment?: string;
}

const ClientFile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(true);

  // Données statiques des dossiers
  const incomingRequests = [
    { 
      id: 1, 
      status: "pending" as DossierStatus,
      clientName: "Paul Lambert",
      companyName: "Transports Lambert",
      sector: "Transport routier de marchandises",
      employees: 45,
      address: "12 Rue des Routiers, 75015 Paris",
      email: "paul.lambert@email.com",
      phone: "+33 6 45 78 12 34",
      auditType: "Audit TICPE",
      creationDate: "01/03/2025",
      context: "Paul Lambert souhaite optimiser la récupération de la TICPE et s'assurer de la conformité fiscale sur les 3 dernières années.",
      objectives: [
        "Vérification des montants remboursables",
        "Identification des optimisations possibles",
        "Sécurisation des déclarations pour éviter tout redressement",
        "Conseil sur les stratégies futures pour réduire les coûts"
      ],
      fleetSize: "12 camions (Euro 5 & Euro 6)",
      annualConsumption: "320 000 litres de gazole",
      previousRefund: "21 500 € (2023)",
      documents: [
        { name: "Déclarations TICPE (2021-2023)", url: "#", type: "PDF" },
        { name: "Factures d'achats de carburant", url: "#", type: "PDF" },
        { name: "Justificatifs conformité environnementale", url: "#", type: "PDF" },
        { name: "Attestations d'usage (manquantes pour 2022)", url: "#", type: "PDF" }
      ],
      comment: "J'aimerais un suivi régulier et des conseils pour optimiser les futures demandes de remboursement."
    }
  ];

  const activeFiles = [
    {
      id: 6,
      status: "accepted" as DossierStatus,
      clientName: "Jean Dupont",
      companyName: "Dupont Transports",
      sector: "Transport routier",
      employees: 30,
      address: "15 Rue des Marchands, 69003 Lyon",
      email: "jean.dupont@email.com",
      phone: "+33 6 12 34 56 78",
      auditType: "Audit TICPE",
      creationDate: "10/01/2025",
      fleetSize: "8 camions (Euro 6)",
      annualConsumption: "180 000 litres de gazole",
      documents: [
        { name: "Déclarations TICPE (2024)", url: "#", type: "PDF" },
        { name: "Factures d'achats de carburant", url: "#", type: "PDF" },
        { name: "Justificatifs conformité environnementale", url: "#", type: "PDF" }
      ],
      progression: [
        { étape: "Réception du dossier", completed: true },
        { étape: "Analyse préliminaire", completed: true },
        { étape: "Demande de documents", completed: false },
        { étape: "Calcul des remboursements", completed: false }
      ]
    }
  ];

  useEffect(() => {
    // Simulation de la récupération des données
    const fetchDossier = () => {
      setLoading(true);
      // Recherche dans toutes les listes de dossiers
      const dossierFound = [...incomingRequests, ...activeFiles].find(d => d.id === Number(id));
      
      if (dossierFound) {
        setDossier(dossierFound);
      }
      setLoading(false);
    };

    fetchDossier();
  }, [id]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Chargement...</div>;
  }

  if (!dossier) {
    return <div className="flex justify-center items-center min-h-screen">Dossier non trouvé</div>;
  }

  const handleAccept = () => {
    console.log("Dossier accepté:", dossier.id);
    // Logique d'acceptation à implémenter
    navigate("/dashboard/partner");
  };

  const handleReject = () => {
    console.log("Dossier refusé:", dossier.id);
    // Logique de refus à implémenter
    navigate("/dashboard/partner");
  };

  const progressionPourcentage = dossier.progression
    ? (dossier.progression.filter(p => p.completed).length / dossier.progression.length) * 100
    : 0;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg relative">
      <div className="mt-20"></div>
      
      <HeaderPartner />

      {/* Bandeau de statut */}
      {dossier.status === "accepted" && (
        <div className="fixed top-0 left-0 w-full bg-green-600 text-white p-3 shadow-md flex justify-center">
          <p className="font-semibold flex items-center">
            <UserCheck className="w-5 h-5 mr-2" /> Dossier validé avec succès ✅
          </p>
        </div>
      )}

      {/* Titre */}
      <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <FileText className="w-6 h-6 mr-2" /> Dossier Client – {dossier.auditType}
      </h1>
      <p className="text-gray-600">
        📅 Date de création : {dossier.creationDate} | 
        Statut : {dossier.status === "accepted" ? "✅ Accepté" : dossier.status === "pending" ? "⏳ En attente" : "❌ Refusé"}
      </p>

      {/* 1. Informations Générales */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold text-gray-700 flex items-center">
          <Briefcase className="w-5 h-5 mr-2" /> 1. Informations Générales
        </h2>
        <div className="bg-gray-100 p-4 rounded-lg mt-2">
          <p><Building className="inline w-4 h-4 mr-2" /> <strong>Client :</strong> {dossier.clientName}</p>
          <p><Briefcase className="inline w-4 h-4 mr-2" /> <strong>Entreprise :</strong> {dossier.companyName}</p>
          <p><Truck className="inline w-4 h-4 mr-2" /> <strong>Secteur :</strong> {dossier.sector}</p>
          <p><Users className="inline w-4 h-4 mr-2" /> <strong>Effectif :</strong> {dossier.employees} salariés</p>
          <p><MapPin className="inline w-4 h-4 mr-2" /> <strong>Adresse :</strong> {dossier.address}</p>
          <p><Mail className="inline w-4 h-4 mr-2" /> <strong>Contact :</strong> {dossier.email}</p>
          <p><Phone className="inline w-4 h-4 mr-2" /> <strong>Téléphone :</strong> {dossier.phone}</p>
        </div>
      </section>

      {/* 2. Contexte & Objectifs - Uniquement pour les dossiers en attente */}
      {dossier.status === "pending" && dossier.context && (
        <section className="mt-6">
          <h2 className="text-xl font-semibold text-gray-700 flex items-center">
            <Search className="w-5 h-5 mr-2" /> 2. Contexte & Objectifs
          </h2>
          <div className="border-l-4 border-blue-500 bg-gray-100 p-4 rounded-lg mt-2">
            <p><strong>Problématique :</strong> {dossier.context}</p>
            {dossier.objectives && (
              <>
                <p className="mt-2 flex items-center">
                  <Target className="w-5 h-5 mr-2" /> <strong>Objectifs principaux :</strong>
                </p>
                <ul className="list-disc list-inside ml-4">
                  {dossier.objectives.map((objective, index) => (
                    <li key={index}>{objective}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>
      )}

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
              {dossier.fleetSize && (
                <tr className="bg-gray-100">
                  <td className="p-3 border border-gray-200 flex items-center">
                    <Truck className="w-4 h-4 mr-2" /> Flotte de véhicules
                  </td>
                  <td className="p-3 border border-gray-200">{dossier.fleetSize}</td>
                </tr>
              )}
              {dossier.annualConsumption && (
                <tr>
                  <td className="p-3 border border-gray-200 flex items-center">
                    <Fuel className="w-4 h-4 mr-2" /> Consommation annuelle
                  </td>
                  <td className="p-3 border border-gray-200">{dossier.annualConsumption}</td>
                </tr>
              )}
              {dossier.previousRefund && (
                <tr className="bg-gray-100">
                  <td className="p-3 border border-gray-200 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" /> Remboursement TICPE précédent
                  </td>
                  <td className="p-3 border border-gray-200">{dossier.previousRefund}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Documents */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold text-gray-700 flex items-center">
          <FileText className="w-5 h-5 mr-2" /> 4. Documents
        </h2>
        <div className="bg-gray-100 p-4 rounded-lg mt-2">
          <ul className="divide-y divide-gray-300">
            {dossier.documents.map((doc, index) => (
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

      {/* 5. Progression - Uniquement pour les dossiers acceptés */}
      {dossier.status === "accepted" && dossier.progression && (
        <section className="mt-6">
          <h2 className="text-xl font-semibold text-gray-700 flex items-center">
            <ClipboardList className="w-5 h-5 mr-2" /> 5. Progression
          </h2>
          <div className="bg-gray-100 p-4 rounded-lg mt-2">
            <Progress value={progressionPourcentage} className="mb-6 h-4 bg-gray-200 rounded-full" />
            <ul className="space-y-3">
              {dossier.progression.map((step, index) => (
                <li key={index} className="flex items-center space-x-3">
                  <div className={`w-5 h-5 rounded-full ${step.completed ? "bg-green-500" : "bg-gray-300"}`} />
                  <p className={`${step.completed ? "text-gray-900 font-semibold" : "text-gray-500"}`}>
                    {step.étape}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 6. Commentaire Client - Uniquement pour les dossiers en attente */}
      {dossier.status === "pending" && dossier.comment && (
        <section className="mt-6">
          <h2 className="text-xl font-semibold text-gray-700 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" /> 6. Commentaire du client
          </h2>
          <blockquote className="italic bg-gray-100 p-4 rounded-lg mt-2">
            "{dossier.comment}"
          </blockquote>
        </section>
      )}

      {/* Espacement pour éviter que le bandeau bas cache le contenu */}
      <div className="mb-24"></div>

      {/* Bandeau flottant bas pour les boutons - Uniquement pour les dossiers en attente */}
      {dossier.status === "pending" && (
        <div className="fixed bottom-0 left-0 w-full bg-white p-4 shadow-md flex justify-center space-x-4 border-t">
          <Button
            onClick={handleAccept}
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 flex items-center space-x-2 transition"
          >
            <UserCheck className="w-5 h-5" />
            <span>Accepter le dossier</span>
          </Button>
          <Button
            onClick={handleReject}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 flex items-center space-x-2 transition"
          >
            <XCircle className="w-5 h-5" />
            <span>Refuser le dossier</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default ClientFile;
