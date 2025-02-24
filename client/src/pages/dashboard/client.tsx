import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import HeaderClient from "@/components/HeaderClient";
import {
  FolderOpen,
  DollarSign,
  ClipboardCheck,
  BarChart3,
  Loader2,
  CheckCircle,
  Clock,
  FilePlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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

// 🔹 Données statiques des audits
const allAudits: Product[] = [
  { id: "dfs", name: "Déduction Forfaitaire Spécifique", description: "Optimisation des charges sociales.", status: "not_initiated", gainsPotentiels: 5000, etapeActuelle: 1, etapesTotal: 6 },
  { id: "foncier", name: "Audit Foncier", description: "Réduction des taxes foncières.", status: "not_initiated", gainsPotentiels: 12000, etapeActuelle: 1, etapesTotal: 6 },
  { id: "ticpe", name: "Audit TICPE", description: "Récupération de la taxe carburant.", status: "pending", gainsPotentiels: 15000, gainsRecuperes: 0, etapeActuelle: 3, etapesTotal: 6 },
  { id: "ursaff", name: "Audit URSSAF", description: "Vérification des cotisations sociales.", status: "pending", gainsPotentiels: 8000, gainsRecuperes: 0, etapeActuelle: 2, etapesTotal: 6 },
  { id: "msa", name: "Audit MSA", description: "Réduction des charges agricoles.", status: "completed", gainsPotentiels: 10000, gainsRecuperes: 9500, etapeActuelle: 6, etapesTotal: 6 },
];

// 🔹 Filtrer les audits par statut
const categorizeAudits = (status: Product["status"]) => allAudits.filter(audit => audit.status === status);

export default function DashboardClient() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"opportunities" | "pending" | "completed">("opportunities");

  // ✅ Données KPI
  const kpiData = {
    dossiersEnCours: categorizeAudits("pending").length,
    gainsPotentiels: allAudits.reduce((sum, audit) => sum + (audit.gainsPotentiels || 0), 0),
    gainsRecuperes: categorizeAudits("completed").reduce((sum, audit) => sum + (audit.gainsRecuperes || 0), 0),
    auditsFinalises: categorizeAudits("completed").length,
  };

  if (isLoading) {
    return (
      <div className="flex justify-center min-h-screen items-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center min-h-screen items-center">
        <p className="text-gray-500">Utilisateur non authentifié.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <HeaderClient />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <SectionTitle title="Suivi de vos Audits" subtitle="Suivi en temps réel de vos dossiers et gains" />

        {/* 🔥 KPI Minimaliste */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          {[
            { icon: FolderOpen, value: kpiData.dossiersEnCours, label: "Dossiers en cours", color: "text-blue-500" },
            { icon: DollarSign, value: `${kpiData.gainsPotentiels.toLocaleString()} €`, label: "Gains potentiels", color: "text-green-500" },
            { icon: ClipboardCheck, value: `${kpiData.gainsRecuperes.toLocaleString()} €`, label: "Gains récupérés", color: "text-green-600" },
            { icon: BarChart3, value: kpiData.auditsFinalises, label: "Audits finalisés", color: "text-indigo-500" },
          ].map(({ icon: Icon, value, label, color }) => (
            <KpiCard key={label} icon={Icon} value={value} label={label} color={color} />
          ))}
        </div>

        {/* 📂 Navigation minimaliste */}
        <div className="mt-8 flex justify-center space-x-4">
          {[
            { key: "opportunities", label: "📌 Opportunités", icon: FilePlus },
            { key: "pending", label: "⏳ En Cours", icon: Clock },
            { key: "completed", label: "✅ Terminés", icon: CheckCircle },
          ].map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              className={`px-6 flex items-center space-x-2 text-lg transition-all ${
                activeTab === key ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => setActiveTab(key as "opportunities" | "pending" | "completed")}
            >
              <Icon className="h-5 w-5" /> <span>{label}</span>
            </Button>
          ))}
        </div>

        {/* 📂 Tableau des audits */}
        <AuditTable activeTab={activeTab} />
      </div>
    </div>
  );
}

// ✅ Composant pour afficher un titre de section
function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-semibold text-gray-800">{title}</h1>
      <p className="text-gray-500 mt-2">{subtitle}</p>
    </div>
  );
}

// ✅ Composant pour afficher une carte KPI minimaliste
function KpiCard({ icon: Icon, value, label, color }: { icon: any; value: any; label: string; color: string }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center">
      <Icon className={`h-8 w-8 ${color}`} />
      <h3 className="text-xl font-semibold mt-2">{value}</h3>
      <p className="text-gray-600 text-sm">{label}</p>
    </div>
  );
}

// ✅ Composant pour afficher le tableau des audits minimaliste
function AuditTable({ activeTab }: { activeTab: "opportunities" | "pending" | "completed" }) {
  const audits = categorizeAudits(activeTab === "opportunities" ? "not_initiated" : activeTab);

  return (
    <Card className="shadow-lg rounded-lg mt-8">
      <CardHeader>
        <CardTitle className="text-gray-800 text-lg font-semibold">
          {activeTab === "opportunities" ? "Opportunités d'Audit" : activeTab === "pending" ? "Audits en Cours" : "Audits Terminés"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {audits.length > 0 ? (
          audits.map((audit) => (
            <div key={audit.id} className="flex justify-between items-center py-4 border-b">
              <p className="text-gray-700">{audit.name}</p>
              {audit.status !== "completed" && <Progress value={(audit.etapeActuelle! / audit.etapesTotal!) * 100} />}
            </div>
          ))
        ) : (
          <p className="text-gray-500">Aucun audit disponible.</p>
        )}
      </CardContent>
    </Card>
  );
}
