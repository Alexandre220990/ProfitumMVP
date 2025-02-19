import { useState } from "react";
import { Button } from "@/components/ui/button";
import HeaderClient from "@/components/HeaderClient";
import { FolderOpen, DollarSign, ClipboardCheck, BarChart3, CheckCircle, Hourglass, FileSearch, ArrowRightCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Product {
  id: string;
  name: string;
  description: string;
  status: "not_initiated" | "pending" | "completed";
  gainsPotentiels?: number;
  gainsRecuperes?: number;
  etapeActuelle?: number;
  etapesTotal?: number;
}

// 🔹 Simule des données réalistes pour les audits
const allAudits: Product[] = [
  { id: "dfs", name: "Déduction Forfaitaire Spécifique", description: "Optimisation des charges sociales des contrats spéciaux.", status: "not_initiated", gainsPotentiels: 5000, etapeActuelle: 1, etapesTotal: 6 },
  { id: "foncier", name: "Audit Foncier", description: "Réduction des taxes foncières.", status: "not_initiated", gainsPotentiels: 12000, etapeActuelle: 1, etapesTotal: 6 },
  { id: "ticpe", name: "Audit TICPE", description: "Récupération de la taxe carburant.", status: "pending", gainsPotentiels: 15000, gainsRecuperes: 0, etapeActuelle: 3, etapesTotal: 6 },
  { id: "ursaff", name: "Audit URSSAF", description: "Vérification des cotisations sociales.", status: "pending", gainsPotentiels: 8000, gainsRecuperes: 0, etapeActuelle: 2, etapesTotal: 6 },
  { id: "msa", name: "Audit MSA", description: "Réduction des charges agricoles.", status: "completed", gainsPotentiels: 10000, gainsRecuperes: 9500, etapeActuelle: 6, etapesTotal: 6 },
];

// 🔹 Catégorisation des audits
const categorizeAudits = (status: Product["status"]) => allAudits.filter(audit => audit.status === status);

export default function DashboardClient() {
  const [activeTab, setActiveTab] = useState<"opportunities" | "pending" | "completed">("opportunities");

  // 🔹 Calcul des KPI
  const kpiData = {
    dossiersEnCours: categorizeAudits("pending").length,
    gainsPotentiels: allAudits.reduce((sum, audit) => sum + (audit.gainsPotentiels || 0), 0),
    gainsRecuperes: categorizeAudits("completed").reduce((sum, audit) => sum + (audit.gainsRecuperes || 0), 0),
    auditsFinalises: categorizeAudits("completed").length,
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-16">
      <HeaderClient />
      <div className="max-w-6xl mx-auto px-6 py-24"> {/* 🔹 Espacement corrigé */}

        {/* 📊 TITRE PREMIUM */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-lg shadow-md text-white text-center">
          <h1 className="text-4xl font-bold">📑 Suivi de vos Audits</h1>
          <p className="text-lg opacity-80 mt-2">Vue d’ensemble et suivi des gains</p>
        </div>

        {/* 🔥 SECTION KPI */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          {[
            { icon: FolderOpen, value: kpiData.dossiersEnCours, label: "Dossiers en cours", color: "text-blue-500" },
            { icon: DollarSign, value: kpiData.gainsPotentiels.toLocaleString(), label: "Gains potentiels", color: "text-green-500" },
            { icon: ClipboardCheck, value: kpiData.gainsRecuperes.toLocaleString(), label: "Gains récupérés", color: "text-green-600" },
            { icon: BarChart3, value: kpiData.auditsFinalises, label: "Audits finalisés", color: "text-indigo-500" },
          ].map(({ icon: Icon, value, label, color }) => (
            <div key={label} className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
              <Icon className={`h-10 w-10 ${color}`} />
              <h3 className="text-xl font-semibold mt-2">{value}</h3>
              <p className="text-gray-600">{label}</p>
            </div>
          ))}
        </div>

        {/* 📂 ONGLET DE NAVIGATION AMÉLIORÉ */}
        <div className="mt-8 flex justify-center space-x-4">
          {["opportunities", "pending", "completed"].map((tab) => (
            <Button
              key={tab}
              className={`px-6 text-lg transition-all ${
                activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => setActiveTab(tab as "opportunities" | "pending" | "completed")}
            >
              {tab === "opportunities" ? "📌 Opportunités" : tab === "pending" ? "⏳ En Cours" : "✅ Terminés"}
            </Button>
          ))}
        </div>

        {/* 📂 TABLEAU AMÉLIORÉ */}
        <Card className="shadow-xl rounded-lg mt-8">
          <CardHeader>
            <CardTitle>📜 {activeTab === "opportunities" ? "Opportunités d'Audit" : activeTab === "pending" ? "Audits en Cours" : "Audits Terminés"}</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full border-collapse border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-gray-100 text-gray-700 text-left">
                  <th className="p-3">Nom</th>
                  <th className="p-3">Gains Potentiels</th>
                  <th className="p-3 text-center">Progression</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {categorizeAudits(activeTab === "opportunities" ? "not_initiated" : activeTab === "pending" ? "pending" : "completed").map((audit) => (
                  <tr key={audit.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{audit.name}</td>
                    <td className="p-3">{audit.gainsPotentiels?.toLocaleString()} €</td>
                    <td className="p-3"><Progress value={(audit.etapeActuelle! / audit.etapesTotal!) * 100} /></td>
                    <td className="p-3 text-center">
                      <Button className="bg-blue-600 text-white flex items-center">
                        Accéder <ArrowRightCircle className="ml-2 h-5 w-5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
