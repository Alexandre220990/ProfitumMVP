import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import HeaderClient from "@/components/HeaderClient";
import { FolderOpen, DollarSign, ClipboardCheck, BarChart3, ArrowRightCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

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
  { id: "dfs", name: "Déduction Forfaitaire Spécifique", description: "Optimisation des charges sociales.", status: "not_initiated", gainsPotentiels: 5000, etapeActuelle: 1, etapesTotal: 6 },
  { id: "foncier", name: "Audit Foncier", description: "Réduction des taxes foncières.", status: "not_initiated", gainsPotentiels: 12000, etapeActuelle: 1, etapesTotal: 6 },
  { id: "ticpe", name: "Audit TICPE", description: "Récupération de la taxe carburant.", status: "pending", gainsPotentiels: 15000, gainsRecuperes: 0, etapeActuelle: 3, etapesTotal: 6 },
  { id: "ursaff", name: "Audit URSSAF", description: "Vérification des cotisations sociales.", status: "pending", gainsPotentiels: 8000, gainsRecuperes: 0, etapeActuelle: 2, etapesTotal: 6 },
  { id: "msa", name: "Audit MSA", description: "Réduction des charges agricoles.", status: "completed", gainsPotentiels: 10000, gainsRecuperes: 9500, etapeActuelle: 6, etapesTotal: 6 },
];

// 🔹 Catégorisation des audits
const categorizeAudits = (status: Product["status"]) => allAudits.filter(audit => audit.status === status);

export default function DashboardClient() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"opportunities" | "pending" | "completed">("opportunities");

  // ✅ Gestion des KPI
  const kpiData = {
    dossiersEnCours: categorizeAudits("pending").length,
    gainsPotentiels: allAudits.reduce((sum, audit) => sum + (audit.gainsPotentiels || 0), 0),
    gainsRecuperes: categorizeAudits("completed").reduce((sum, audit) => sum + (audit.gainsRecuperes || 0), 0),
    auditsFinalises: categorizeAudits("completed").length,
  };

  // ✅ Affichage d'un écran de chargement si `user` est en cours de chargement
  if (isLoading) {
    return (
      <div className="flex justify-center min-h-screen items-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
      </div>
    );
  }

  // ✅ Si `user` est null, afficher un message
  if (!user) {
    return (
      <div className="flex justify-center min-h-screen items-center">
        <p className="text-gray-500">Utilisateur non authentifié.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-16">
      <HeaderClient />
      <div className="max-w-6xl mx-auto px-6 py-16"> 

        {/* 📊 TITRE PREMIUM */}
        <SectionTitle title="📑 Suivi de vos Audits" subtitle="Vue d’ensemble et suivi des gains" />

        {/* 🔥 SECTION KPI */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          {[
            { icon: FolderOpen, value: kpiData.dossiersEnCours, label: "Dossiers en cours", color: "text-blue-500" },
            { icon: DollarSign, value: kpiData.gainsPotentiels.toLocaleString(), label: "Gains potentiels", color: "text-green-500" },
            { icon: ClipboardCheck, value: kpiData.gainsRecuperes.toLocaleString(), label: "Gains récupérés", color: "text-green-600" },
            { icon: BarChart3, value: kpiData.auditsFinalises, label: "Audits finalisés", color: "text-indigo-500" },
          ].map(({ icon: Icon, value, label, color }) => (
            <KpiCard key={label} icon={Icon} value={value} label={label} color={color} />
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

        {/* 📂 TABLEAU */}
        <AuditTable activeTab={activeTab} />
      </div>
    </div>
  );
}

// ✅ Composant pour afficher un titre de section
function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-lg shadow-md text-white text-center">
      <h1 className="text-4xl font-bold">{title}</h1>
      <p className="text-lg opacity-80 mt-2">{subtitle}</p>
    </div>
  );
}

// ✅ Composant pour afficher une carte KPI
function KpiCard({ icon: Icon, value, label, color }: { icon: any; value: any; label: string; color: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
      <Icon className={`h-10 w-10 ${color}`} />
      <h3 className="text-xl font-semibold mt-2">{value}</h3>
      <p className="text-gray-600">{label}</p>
    </div>
  );
}

// ✅ Composant pour afficher le tableau des audits
function AuditTable({ activeTab }: { activeTab: "opportunities" | "pending" | "completed" }) {
  return (
    <Card className="shadow-xl rounded-lg mt-8">
      <CardHeader>
        <CardTitle>
          📜 {activeTab === "opportunities" ? "Opportunités d'Audit" : activeTab === "pending" ? "Audits en Cours" : "Audits Terminés"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-500">Aucun audit disponible.</p>
      </CardContent>
    </Card>
  );
}
