import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { get } from "@/lib/api";
import HeaderClient from "@/components/HeaderClient";
import { Download, RefreshCw, FileText, BarChart3, TrendingUp, DollarSign, ClipboardCheck, FolderOpen } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type ReportStatus = "Finalisé" | "En cours" | "Rejeté" | "En attente";

const STATUS_COLORS: Record<ReportStatus, string> = {
  Finalisé: "bg-green-500",
  "En cours": "bg-blue-500",
  Rejeté: "bg-red-500",
  "En attente": "bg-yellow-500",
};

interface Report {
  id: number;
  nom: string;
  date: string;
  status: ReportStatus;
  avancement: number;
  gainsPotentiels: number;
  gainsRecuperes: number;
}

// 🔹 Simule des données réalistes pour les KPI et les rapports
const generateMockReports = (): Report[] => [
  { id: 1, nom: "Audit TICPE", date: "2024-02-01", status: "En cours", avancement: 65, gainsPotentiels: 12000, gainsRecuperes: 0 },
  { id: 2, nom: "Audit URSSAF", date: "2024-01-15", status: "Finalisé", avancement: 100, gainsPotentiels: 8000, gainsRecuperes: 7500 },
  { id: 3, nom: "Audit Foncier", date: "2023-12-10", status: "Finalisé", avancement: 100, gainsPotentiels: 15000, gainsRecuperes: 14500 },
  { id: 4, nom: "Déduction Forfaitaire Spécifique", date: "2024-01-05", status: "En attente", avancement: 10, gainsPotentiels: 5000, gainsRecuperes: 0 },
];

export default function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>(generateMockReports()); // 🔹 Valeurs cohérentes
  const [loading, setLoading] = useState(false);

  // 🔹 Calcul des KPI à partir des rapports
  const kpiData = {
    dossiersEnCours: reports.filter((r) => r.status === "En cours").length,
    gainsPotentiels: reports.reduce((sum, r) => sum + r.gainsPotentiels, 0),
    gainsRecuperes: reports.reduce((sum, r) => sum + r.gainsRecuperes, 0),
    auditsFinalises: reports.filter((r) => r.status === "Finalisé").length,
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-16">
      <HeaderClient />
      <div className="max-w-6xl mx-auto px-6 py-24"> {/* 🔹 Espacement corrigé */}

        {/* 📊 TITRE PREMIUM */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-lg shadow-md text-white text-center">
          <h1 className="text-4xl font-bold">📊 Vos Rapports Premium</h1>
          <p className="text-lg opacity-80 mt-2">Analyse complète et suivi avancé de vos audits</p>
        </div>

        {/* 🔥 SECTION KPI */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
            <FolderOpen className="h-10 w-10 text-blue-500" />
            <h3 className="text-xl font-semibold mt-2">{kpiData.dossiersEnCours}</h3>
            <p className="text-gray-600">Dossiers en cours</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
            <DollarSign className="h-10 w-10 text-green-500" />
            <h3 className="text-xl font-semibold mt-2">{kpiData.gainsPotentiels.toLocaleString()} €</h3>
            <p className="text-gray-600">Gains potentiels</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
            <ClipboardCheck className="h-10 w-10 text-green-600" />
            <h3 className="text-xl font-semibold mt-2">{kpiData.gainsRecuperes.toLocaleString()} €</h3>
            <p className="text-gray-600">Gains récupérés</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
            <TrendingUp className="h-10 w-10 text-indigo-500" />
            <h3 className="text-xl font-semibold mt-2">{kpiData.auditsFinalises}</h3>
            <p className="text-gray-600">Audits finalisés</p>
          </div>
        </div>

        {/* 📂 TABLEAU DES AUDITS */}
        <div className="bg-white p-6 rounded-lg shadow-md mt-8">
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
            <BarChart3 className="h-6 w-6 text-blue-500 mr-2" /> Détails des Audits
          </h2>

          {loading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full border-collapse border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 text-left">
                    <th className="p-3">Nom</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Avancement</th>
                    <th className="p-3">Statut</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} className="border-t">
                      <td className="p-3">{report.nom}</td>
                      <td className="p-3">{new Date(report.date).toLocaleDateString()}</td>
                      <td className="p-3">
                        <Progress value={report.avancement} className="h-2 bg-gray-200" />
                        <p className="text-sm text-gray-500 mt-1">{report.avancement}%</p>
                      </td>
                      <td className="p-3">
                        <span className={`px-3 py-1 text-white text-xs font-bold rounded-full ${STATUS_COLORS[report.status]}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <Button className="bg-blue-600 text-white hover:bg-blue-700 flex items-center">
                          <Download className="mr-2 h-5 w-5" /> Télécharger
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
