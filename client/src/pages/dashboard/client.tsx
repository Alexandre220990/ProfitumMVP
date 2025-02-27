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
import { useLocation } from 'wouter';

interface Dossier {
  id: string;
  name: string;
  status: "pending" | "completed" | "not_initiated";
  progress: number;
  currentStep: string;
  potentialGain: number;
  obtainedGain?: number;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardClient() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"opportunities" | "pending" | "completed">("opportunities");

  const getAuditStatus = (auditType: string): "not_initiated" | "pending" | "completed" => {
    const progress = JSON.parse(localStorage.getItem('auditProgress') || '{}')[auditType];
    if (!progress) return "not_initiated";
    if (progress === 5) return "completed";
    return "pending";
  };

  // Fonction pour obtenir les données d'un audit depuis le localStorage
  const getAuditData = (auditType: string) => {
    const progress = JSON.parse(localStorage.getItem('auditProgress') || '{}')[auditType] || 0;
    const status = getAuditStatus(auditType);

    return {
      id: auditType,
      name: `Audit ${auditType.toUpperCase()}`,
      status,
      progress: progress * 20, // Convert steps (1-5) to percentage
      currentStep: status === "completed" ? "Terminé" : `Étape ${progress}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      potentialGain: getDefaultGain(auditType),
      obtainedGain: status === "completed" ? calculateObtainedGain(auditType) : undefined
    };
  };

  // Fonction helper pour obtenir un gain potentiel par défaut
  const getDefaultGain = (auditType: string): number => {
    const gains = {
      dfs: 15000,
      ticpe: 12000,
      msa: 8000,
      foncier: 10000,
      social: 5000
    };
    return gains[auditType as keyof typeof gains] || 5000;
  };

  // Fonction helper pour calculer les gains obtenus
  const calculateObtainedGain = (auditType: string): number => {
    const potential = getDefaultGain(auditType);
    // Simuler un gain obtenu entre 80% et 120% du potentiel
    return Math.round(potential * (0.8 + Math.random() * 0.4));
  };

  // Générer la liste des dossiers
  const allDossiers = ['dfs', 'ticpe', 'msa', 'foncier', 'social'].map(type => getAuditData(type));

  // 🔹 Filtrer les audits par statut
  const categorizeDossiers = (status: Dossier["status"]) => allDossiers.filter(dossier => dossier.status === status);

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
    gainsObtenus: allDossiers.filter(d => d.status === "completed").reduce((sum, dossier) => sum + (dossier.obtainedGain || 0), 0),
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
            {
              icon: DollarSign,
              component: (
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-red-500 font-medium">Potentiel:</span>
                    <span className="text-lg">{kpiData.gainsPotentiels.toLocaleString()} €</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-green-500 font-medium">Obtenus:</span>
                    <span className="text-lg">{kpiData.gainsObtenus.toLocaleString()} €</span>
                  </div>
                </div>
              ),
              label: "Gains",
              color: "text-green-500"
            },
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
          ].map(({ icon: Icon, value, component, label, color }) => (
            <KpiCard key={label} icon={Icon} value={value} component={component} label={label} color={color} />
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
        <AuditTable activeTab={activeTab} allDossiers={allDossiers} user={user}/>
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
function KpiCard({ icon: Icon, value, component, label, color }: { icon: any; value?: any; component?: any; label: string; color: string }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center">
      <Icon className={`h-8 w-8 ${color}`} />
      {component ? component : <h3 className="text-xl font-semibold mt-2">{value}</h3>}
      <p className="text-gray-600 text-sm">{label}</p>
    </div>
  );
}

export function AuditTable({ activeTab, allDossiers, user }: { activeTab: "opportunities" | "pending" | "completed"; allDossiers: Dossier[]; user: any }) {
  const dossiers = allDossiers.filter(dossier => activeTab === "opportunities" ? dossier.status === "not_initiated" : dossier.status === activeTab);

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
                  {activeTab === "completed" && (
                    <>
                      <th className="p-3 text-left">Gains Obtenus</th>
                      <th className="p-3 text-left">Fiabilité</th>
                    </>
                  )}
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
                      <Link href={`/produits/${dossier.id}/${user?.id}`} className="hover:underline">
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
                    <td className="p-3 font-semibold text-red-600">
                      {dossier.potentialGain.toLocaleString()} €
                    </td>
                    {activeTab === "completed" && (
                      <>
                        <td className="p-3 font-semibold text-green-600">
                          {dossier.obtainedGain?.toLocaleString()} €
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-12">
                              <CircularProgressbar
                                value={((dossier.obtainedGain || 0) / dossier.potentialGain) * 100}
                                text={`${Math.round((dossier.obtainedGain || 0) / dossier.potentialGain * 100)}%`}
                                styles={buildStyles({
                                  textSize: '28px',
                                  pathColor: `${((dossier.obtainedGain || 0) / dossier.potentialGain) >= 1 ? '#10B981' : '#3B82F6'}`,
                                  textColor: '#1E293B',
                                  trailColor: '#E5E7EB',
                                })}
                              />
                            </div>
                          </div>
                        </td>
                      </>
                    )}
                    <td className="p-3 text-center">
                      <div className="w-8 h-8 flex items-center justify-center">
                        <CircularProgressbar
                          value={dossier.progress}
                          strokeWidth={10}
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