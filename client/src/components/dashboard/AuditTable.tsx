import { Audit, AuditStatus } from '@/types/audit';
import { UserType } from '@/types/api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Link } from "react-router-dom";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useState, useMemo } from "react";

type SortableField = 
  | 'audit_type'
  | 'status'
  | 'current_step'
  | 'potential_gain'
  | 'obtained_gain'
  | 'reliability'
  | 'progress'
  | 'created_at'
  | 'updated_at';

interface SortConfig {
  field: SortableField;
  order: 'asc' | 'desc';
}

interface AuditTableProps {
  activeTab: "opportunities" | "pending" | "completed";
  allDossiers: Audit[];
  user: UserType;
  onNewSimulation: () => void;
  onViewDossier: (id: string, auditType?: string) => void;
  onViewAudit: (id: string) => void;
}

export function AuditTable({ 
  activeTab, 
  allDossiers, 
  user,
  onNewSimulation,
  onViewDossier,
  onViewAudit
}: AuditTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'created_at', order: 'desc' });
  const hasCompletedSimulation = localStorage.getItem(`hasCompletedSimulation_${user?.id}`);

  // Fonction de tri générique
  const sortData = (a: Audit, b: Audit, field: SortableField, order: 'asc' | 'desc'): number => {
    const multiplier = order === 'asc' ? 1 : -1;

    switch (field) {
      case 'created_at':
        return multiplier * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'updated_at':
        return multiplier * (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
      case 'audit_type':
        return multiplier * a.audit_type.localeCompare(b.audit_type);
      case 'status':
        const statusOrder: Record<AuditStatus, number> = {
          'non_démarré': 1,
          'en_cours': 2,
          'terminé': 3
        };
        return multiplier * ((statusOrder[a.status as AuditStatus] || 0) - (statusOrder[b.status as AuditStatus] || 0));
      case 'current_step':
        return multiplier * ((a.current_step || 0) - (b.current_step || 0));
      case 'potential_gain':
        return multiplier * ((a.potential_gain || 0) - (b.potential_gain || 0));
      case 'obtained_gain':
        return multiplier * ((a.obtained_gain || 0) - (b.obtained_gain || 0));
      case 'reliability':
        const reliabilityA = a.obtained_gain ? (a.obtained_gain / (a.potential_gain || 1)) : 0;
        const reliabilityB = b.obtained_gain ? (b.obtained_gain / (b.potential_gain || 1)) : 0;
        return multiplier * (reliabilityA - reliabilityB);
      case 'progress':
        return multiplier * ((a.progress || 0) - (b.progress || 0));
      default:
        return 0;
    }
  };

  // Gestion du tri
  const handleSort = (field: SortableField) => {
    setSortConfig(prevConfig => ({
      field,
      order: prevConfig.field === field && prevConfig.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Rendu de l'icône de tri
  const renderSortIcon = (field: SortableField) => {
    if (sortConfig.field !== field) return <ArrowUpDown className="w-4 h-4 ml-1" />;
    if (sortConfig.order === 'asc') return <ArrowUp className="w-4 h-4 ml-1" />;
    if (sortConfig.order === 'desc') return <ArrowDown className="w-4 h-4 ml-1" />;
    return <ArrowUpDown className="w-4 h-4 ml-1" />;
  };

  // Filtrage et tri des dossiers
  const dossiers = useMemo(() => {
    let filtered = allDossiers.filter(dossier => {
      if (activeTab === "opportunities") {
        // Afficher tous les audits dans l'onglet "opportunities"
        return true;
      }
      
      return activeTab === "pending" ? dossier.status === "en_cours" :
             activeTab === "completed" ? dossier.status === "terminé" : false;
    });

    if (sortConfig.order !== null) {
      filtered.sort((a, b) => sortData(a, b, sortConfig.field, sortConfig.order));
    }

    return filtered;
  }, [allDossiers, activeTab, sortConfig, hasCompletedSimulation, user.id]);

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
                  <th className="p-3 text-left cursor-pointer" onClick={() => handleSort('audit_type')}>
                    <div className="flex items-center">
                      Nom du dossier
                      {renderSortIcon('audit_type')}
                    </div>
                  </th>
                  <th className="p-3 text-left cursor-pointer" onClick={() => handleSort('status')}>
                    <div className="flex items-center">
                      Statut
                      {renderSortIcon('status')}
                    </div>
                  </th>
                  <th className="p-3 text-left cursor-pointer" onClick={() => handleSort('current_step')}>
                    <div className="flex items-center">
                      Étape en cours
                      {renderSortIcon('current_step')}
                    </div>
                  </th>
                  <th className="p-3 text-left cursor-pointer" onClick={() => handleSort('potential_gain')}>
                    <div className="flex items-center">
                      Gains Potentiels
                      {renderSortIcon('potential_gain')}
                    </div>
                  </th>
                  {activeTab === "completed" && (
                    <>
                      <th className="p-3 text-left cursor-pointer" onClick={() => handleSort('obtained_gain')}>
                        <div className="flex items-center">
                          Gains Obtenus
                          {renderSortIcon('obtained_gain')}
                        </div>
                      </th>
                      <th className="p-3 text-left cursor-pointer" onClick={() => handleSort('reliability')}>
                        <div className="flex items-center">
                          Fiabilité
                          {renderSortIcon('reliability')}
                        </div>
                      </th>
                    </>
                  )}
                  <th className="p-3 text-left cursor-pointer" onClick={() => handleSort('progress')}>
                    <div className="flex items-center">
                      Avancement
                      {renderSortIcon('progress')}
                    </div>
                  </th>
                  <th className="p-3 text-left cursor-pointer" onClick={() => handleSort('created_at')}>
                    <div className="flex items-center">
                      Créé le
                      {renderSortIcon('created_at')}
                    </div>
                  </th>
                  <th className="p-3 text-left cursor-pointer" onClick={() => handleSort('updated_at')}>
                    <div className="flex items-center">
                      Mis à jour
                      {renderSortIcon('updated_at')}
                    </div>
                  </th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {dossiers.map((dossier) => (
                  <tr
                    key={dossier.id}
                    className="border-b hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => {
                      console.log('🔍 Clic sur la ligne - onViewDossier appelé');
                      console.log('  - ID:', dossier.id);
                      console.log('  - Audit Type:', dossier.audit_type);
                      onViewDossier(dossier.id.toString(), dossier.audit_type);
                    }}
                  >
                    <td className="p-3 font-medium text-gray-900">
                      <span 
                        className="hover:underline cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDossier(dossier.id.toString(), dossier.audit_type);
                        }}
                      >
                        {dossier.audit_type}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium
                        ${dossier.status === "terminé" ? "bg-green-100 text-green-700" :
                          dossier.status === "en_cours" ? "bg-yellow-100 text-yellow-700" :
                            "bg-gray-100 text-gray-700"}`}>
                        {dossier.status === "terminé" ? "Terminé" : 
                         dossier.status === "en_cours" ? "En cours" : 
                         "Non démarré"}
                      </span>
                    </td>
                    <td className="p-3">{dossier.current_step}</td>
                    <td className="p-3 font-semibold text-red-600">
                      {dossier.potential_gain.toLocaleString()} €
                    </td>
                    {activeTab === "completed" && (
                      <>
                        <td className="p-3 font-semibold text-green-600">
                          {dossier.obtained_gain?.toLocaleString()} €
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-12">
                              <CircularProgressbar
                                value={((dossier.obtained_gain || 0) / dossier.potential_gain) * 100}
                                text={`${Math.round((dossier.obtained_gain || 0) / dossier.potential_gain * 100)}%`}
                                styles={buildStyles({
                                  textSize: '28px',
                                  pathColor: `${((dossier.obtained_gain || 0) / dossier.potential_gain) >= 1 ? '#10B981' : '#3B82F6'}`,
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
                    <td className="p-3 text-gray-500 text-sm">
                      {new Date(dossier.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-gray-500 text-sm">
                      {new Date(dossier.updated_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          console.log('🔍 Clic sur le bouton "Voir l\'audit" - onViewAudit appelé');
                          console.log('  - ID:', dossier.id);
                          e.preventDefault();
                          e.stopPropagation();
                          onViewAudit(dossier.id.toString());
                        }}
                      >
                        Voir l'audit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Aucun dossier disponible.</p>
            <Button 
              variant="default" 
              onClick={onNewSimulation}
              className="mx-auto"
            >
              Démarrer une simulation pour découvrir vos opportunités
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 