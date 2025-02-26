import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import HeaderClient from "@/components/HeaderClient";
import {
  FolderOpen,
  DollarSign,
  ClipboardCheck,
  BarChart3,
  CheckCircle,
  Clock,
  FilePlus,
  Loader2,
  PiggyBank,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

interface Dossier {
  id: string;
  name: string;
  status: "pending" | "completed" | "not_initiated";
  progress: number;
  currentStep: string;
  potentialGain: number;
  createdAt: string;
  updatedAt: string;
}

// 🔹 Données statiques des audits
const allDossiers: Dossier[] = [
  { id: "dfs", name: "DFS", status: "not_initiated", potentialGain: 5000, currentStep: "Analyse préliminaire", progress: 0, createdAt: "2024-01-12", updatedAt: "2024-02-15" },
  { id: "foncier", name: "Foncier", status: "not_initiated", potentialGain: 12000, currentStep: "Vérification des documents", progress: 0, createdAt: "2024-02-05", updatedAt: "2024-02-20" },
  { id: "ticpe", name: "Audit TICPE", status: "pending", potentialGain: 15000, currentStep: "Validation des pièces justificatives", progress: 50, createdAt: "2024-01-20", updatedAt: "2024-02-18" },
  { id: "ursaff", name: "Audit URSSAF", status: "pending", potentialGain: 8000, currentStep: "Analyse des cotisations", progress: 30, createdAt: "2024-01-28", updatedAt: "2024-02-19" },
  { id: "msa", name: "Audit MSA", status: "completed", potentialGain: 10000, currentStep: "Terminé", progress: 100, createdAt: "2024-01-15", updatedAt: "2024-02-17" },
  { id: "courtier-energie", name: "Courtier énergétique", status: "completed", potentialGain: 2500, currentStep: "Terminé", progress: 100, createdAt: "2025-01-15", updatedAt: "2025-02-17" },
];

// 🔹 Filtrer les audits par statut
const categorizeDossiers = (status: Dossier["status"]) => allDossiers.filter(dossier => dossier.status === status);

export default function DashboardClient() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"opportunities" | "pending" | "completed">("opportunities");

  // 🔹 Récupérer tous les audits en cours
  const auditsEnCours = categorizeDossiers("pending");

  // 🔹 Calcul de l'avancement moyen des audits en cours
  const avancementGlobal = auditsEnCours.length > 0
    ? auditsEnCours.reduce((sum, audit) => sum + audit.progress, 0) / auditsEnCours.length
    : 0;
  
  // ✅ Données KPI
  const kpiData = {
    dossiersEnCours: categorizeDossiers("pending").length,
    gainsPotentiels: allDossiers.reduce((sum, dossier) => sum + dossier.potentialGain, 0),
    auditsFinalises: categorizeDossiers("completed").length,
      avancementGlobal,
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
            { icon: PiggyBank, value: kpiData.auditsFinalises, label: "Audits finalisés", color: "text-indigo-500" },
            { 
              icon: BarChart3, 
              value: (
                <div className="w-16 h-16">
                  <CircularProgressbar 
                    value={kpiData.avancementGlobal} 
                    text={`${kpiData.avancementGlobal.toFixed(0)}%`} 
                    styles={buildStyles({
                      textColor: "#1E293B",
                      pathColor: kpiData.avancementGlobal === 100 ? "#10B981" : "#3B82F6",
                      trailColor: "#E5E7EB",
                      textSize: "20px",
                    })} 
                  />
                </div>
              ), 
              label: "Avancement global", 
              color: "text-purple-500" 
            }
          ].map(({ icon: Icon, value, label, color }) => (
            <KpiCard key={label} icon={Icon} value={value} label={label} color={color} />
          ))}
        </div>

        {/* 📂 Navigation minimaliste */}
        <div className="mt-8 flex justify-center space-x-4">
          {[
            { key: "opportunities", label: "Opportunités", icon: FilePlus },
            { key: "pending", label: "En Cours", icon: Clock },
            { key: "completed", label: "Terminés", icon: CheckCircle },
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

  export function AuditTable({ activeTab }: { activeTab: "opportunities" | "pending" | "completed" }) {
    const dossiers = categorizeDossiers(activeTab === "opportunities" ? "not_initiated" : activeTab);

  return (
    <Card className="shadow-lg rounded-lg mt-8">
      <CardHeader>
        <CardTitle className="text-gray-800 text-lg font-semibold">Mes Dossiers</CardTitle>
      </CardHeader>
      <CardContent>
        {dossiers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-800 text-sm font-semibold">
                  <th className="p-3 text-left">Nom du dossier</th>
                  <th className="p-3 text-left">Statut</th>
                  <th className="p-3 text-left">Étape en cours</th>
                  <th className="p-3 text-left">Gains Potentiels</th>
                  <th className="p-3 text-left">Avancement</th>
                  <th className="p-3 text-left">Créé le</th>
                  <th className="p-3 text-left">Mis à jour</th>
                </tr>
              </thead>
              <tbody>
                {dossiers.map((dossier) => (
                  <tr
                    key={dossier.id}
                    className="border-b hover:bg-gray-50 transition cursor-pointer"
                  >
                    <td className="p-3 font-medium text-gray-900">
                      <Link href={`/produits/${dossier.id}`} className="hover:underline">
                        {dossier.name}
                      </Link>
                    </td>
                    <td className="p-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium 
                        ${dossier.status === "completed" ? "bg-green-100 text-green-700" : 
                          dossier.status === "pending" ? "bg-yellow-100 text-yellow-700" : 
                          "bg-gray-100 text-gray-700"}`}>
                        {dossier.status === "completed" ? "Terminé" : dossier.status === "pending" ? "En cours" : "Non initié"}
                      </span>
                    </td>
                    <td className="p-3">{dossier.currentStep}</td>
                    <td className="p-3 font-semibold text-green-600">
                      {dossier.potentialGain.toLocaleString()} €
                    </td>
                    <td className="p-3 text-center">
                      <div className="w-8 h-8 flex items-center justify-center"> {/* ✅ Réduction du cercle */}
                        <CircularProgressbar 
                          value={dossier.progress}  
                          strokeWidth={10}  // ✅ Augmenté pour rester lisible malgré la petite taille
                          styles={buildStyles({
                            pathColor: dossier.progress === 100 ? "#10B981" : "#3B82F6",
                            trailColor: "#E5E7EB",
                            textColor: "#1E293B",
                            textSize: "32px",
                          })}
                        />
                      </div>
                    </td>
                    <td className="p-3 text-gray-500 text-sm">{new Date(dossier.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 text-gray-500 text-sm">{new Date(dossier.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">Aucun dossier disponible.</p>
        )}
      </CardContent>
    </Card>
  );
}
