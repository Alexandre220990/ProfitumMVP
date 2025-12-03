import { Audit, AuditStatus } from "@/types/audit";
import { UserType } from "@/types/api";
import { Button } from "@/components/ui/button";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useState, useMemo, useCallback, memo } from "react";

type SortableField = 
  | 'audit_type'
  | 'status'
  | 'current_step'
  | 'potential_gain'
  | 'obtained_gain'
  | 'reliability'
  | 'updated_at'
  | 'created_at';

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
}

// Configuration statique pour les statuts
const STATUS_CONFIG = {
  'terminé': { label: 'Terminé', className: 'bg-green-100 text-green-700' },
  'en_cours': { label: 'En cours', className: 'bg-yellow-100 text-yellow-700' },
  'non_démarré': { label: 'Non démarré', className: 'bg-gray-100 text-gray-700' }
} as const;

// Ordre des statuts pour le tri
const STATUS_ORDER: Record<AuditStatus, number> = {
  'non_démarré': 1, 
  'en_cours': 2, 
  'terminé': 3 
};

// Composant mémorisé pour l'en-tête de colonne
const SortableHeader = memo<{
  field: SortableField;
  children: React.ReactNode;
  currentSort: SortConfig;
  onSort: (field: SortableField) => void;
}>(({ field, children, currentSort, onSort }) => {
  const renderSortIcon = useCallback(() => {
    if (currentSort.field !== field) return <ArrowUpDown className="w-4 h-4 ml-1" />;
    if (currentSort.order === 'asc') return <ArrowUp className="w-4 h-4 ml-1" />;
    if (currentSort.order === 'desc') return <ArrowDown className="w-4 h-4 ml-1" />;
    return <ArrowUpDown className="w-4 h-4 ml-1" />;
  }, [field, currentSort]);

  return (
    <th className="p-3 text-left cursor-pointer" onClick={() => onSort(field)}>
      <div className="flex items-center">
        {children}
        {renderSortIcon()}
      </div>
    </th>
  );
});

SortableHeader.displayName = 'SortableHeader';

// Composant mémorisé pour la ligne d'audit
const AuditRow = memo<{
  dossier: Audit;
  activeTab: "opportunities" | "pending" | "completed";
  onViewDossier: (id: string, auditType?: string) => void;
}>(({ dossier, activeTab, onViewDossier }) => {
  const handleRowClick = useCallback(() => {
    console.log('🔍 Clic sur la ligne - onViewDossier appelé');
    console.log('  - ID: ', dossier.id);
    console.log('  - Audit Type: ', dossier.audit_type);
    onViewDossier(dossier.id.toString(), dossier.audit_type);
  }, [dossier.id, dossier.audit_type, onViewDossier]);

  const handleNameClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDossier(dossier.id.toString(), dossier.audit_type);
  }, [dossier.id, dossier.audit_type, onViewDossier]);



  const statusConfig = STATUS_CONFIG[dossier.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG['non_démarré'];
  const reliabilityPercentage = dossier.obtained_gain ? Math.round((dossier.obtained_gain / dossier.potential_gain) * 100) : 0;
  const reliabilityColor = (dossier.obtained_gain || 0) / dossier.potential_gain >= 1 ? '#10B981' : '#3B82F6';

  return (
    <tr
      key={dossier.id}
      className="border-b hover:bg-gray-50 transition cursor-pointer"
      onClick={handleRowClick}
    >
      <td className="p-2 font-medium text-gray-900">
        <span 
          className="hover:underline cursor-pointer"
          onClick={handleNameClick}
        >
          {dossier.audit_type}
        </span>
      </td>
      <td className="p-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.className}`}>
          {statusConfig.label}
        </span>
      </td>
      <td className="p-2">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">
            {dossier.step_display || `${dossier.current_step || 0}/${dossier.total_steps || 10}`}
          </div>
          <div className="flex-1 w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min(100, dossier.progress || 0)}%` 
              }}
            />
          </div>
        </div>
      </td>
      <td className="p-2 font-semibold text-red-600 text-sm">
        {dossier.potential_gain.toLocaleString()} €
      </td>
      {activeTab === "completed" && (
        <>
          <td className="p-2 font-semibold text-green-600 text-sm">
            {dossier.obtained_gain?.toLocaleString()} €
          </td>
          <td className="p-2">
            <div className="flex items-center gap-1">
              <div className="w-8 h-8">
                <CircularProgressbar
                  value={reliabilityPercentage}
                  text={`${reliabilityPercentage}%`}
                  styles={buildStyles({
                    textSize: '20px',
                    pathColor: reliabilityColor,
                    textColor: '#1E293B',
                    trailColor: '#E5E7EB'
                  })}
                />
              </div>
            </div>
          </td>
        </>
      )}
      <td className="p-2 text-gray-500 text-xs">
        {new Date(dossier.updated_at).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })}
      </td>
      <td className="p-2">
        <div className="text-sm">
          {dossier.expert ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xs font-medium">
                  {dossier.expert.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-gray-700 font-medium">{dossier.expert.name}</span>
            </div>
          ) : (
            <span className="text-gray-400 italic">En attente</span>
          )}
        </div>
      </td>
    </tr>
  );
});

AuditRow.displayName = 'AuditRow';

// Composant mémorisé pour la carte d'audit (Mobile/Tablette)
const AuditRowCard = memo<{
  dossier: Audit;
  activeTab: "opportunities" | "pending" | "completed";
  onViewDossier: (id: string, auditType?: string) => void;
}>(({ dossier, activeTab, onViewDossier }) => {
  const handleCardClick = useCallback(() => {
    onViewDossier(dossier.id.toString(), dossier.audit_type);
  }, [dossier.id, dossier.audit_type, onViewDossier]);

  const statusConfig = STATUS_CONFIG[dossier.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG['non_démarré'];
  const reliabilityPercentage = dossier.obtained_gain ? Math.round((dossier.obtained_gain / dossier.potential_gain) * 100) : 0;
  const reliabilityColor = (dossier.obtained_gain || 0) / dossier.potential_gain >= 1 ? '#10B981' : '#3B82F6';

  return (
    <div
      onClick={handleCardClick}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 truncate">
            {dossier.audit_type}
          </h3>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusConfig.className}`}>
            {statusConfig.label}
          </span>
        </div>
        {dossier.expert && (
          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xs font-medium">
                {dossier.expert.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-gray-600">Étape</span>
          <span className="font-medium">{dossier.step_display || `${dossier.current_step || 0}/${dossier.total_steps || 10}`}</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
            style={{ 
              width: `${Math.min(100, dossier.progress || 0)}%` 
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-600 mb-1">Gains Potentiels</p>
          <p className="text-sm sm:text-base font-semibold text-red-600">
            {dossier.potential_gain.toLocaleString()} €
          </p>
        </div>
        {activeTab === "completed" && dossier.obtained_gain && (
          <div>
            <p className="text-xs text-gray-600 mb-1">Gains Obtenus</p>
            <p className="text-sm sm:text-base font-semibold text-green-600">
              {dossier.obtained_gain.toLocaleString()} €
            </p>
          </div>
        )}
      </div>

      {activeTab === "completed" && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-600">Fiabilité</span>
          <div className="w-12 h-12">
            <CircularProgressbar
              value={reliabilityPercentage}
              text={`${reliabilityPercentage}%`}
              styles={buildStyles({
                textSize: '16px',
                pathColor: reliabilityColor,
                textColor: '#1E293B',
                trailColor: '#E5E7EB'
              })}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          {new Date(dossier.updated_at).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })}
        </span>
        {!dossier.expert && (
          <span className="text-xs text-gray-400 italic">En attente</span>
        )}
      </div>
    </div>
  );
});

AuditRowCard.displayName = 'AuditRowCard';

// Fonction de tri optimisée
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
      return multiplier * ((STATUS_ORDER[a.status as AuditStatus] || 0) - (STATUS_ORDER[b.status as AuditStatus] || 0));
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
    default:
      return 0;
  }
};

export const AuditTable = memo<AuditTableProps>(({ 
  activeTab, 
  allDossiers, 
  user, 
  onNewSimulation, 
  onViewDossier 
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'created_at', order: 'desc' });
  const hasCompletedSimulation = localStorage.getItem(`hasCompletedSimulation_${user?.id}`);

  // Gestion du tri mémorisée
  const handleSort = useCallback((field: SortableField) => {
    setSortConfig((prevConfig: SortConfig) => ({
      field,
      order: prevConfig.field === field && prevConfig.order === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Filtrage et tri des dossiers mémorisé
  const dossiers = useMemo(() => {
    let filtered = allDossiers.filter(dossier => {
      if (activeTab === "opportunities") {
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

  // Callbacks mémorisés pour les actions
  const handleViewDossier = useCallback((id: string, auditType?: string) => {
    onViewDossier(id, auditType);
  }, [onViewDossier]);

  return (
    <div className="overflow-x-auto">
      {dossiers.length > 0 ? (
        <>
          {/* Tableau Desktop */}
          <div className="hidden lg:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-700 text-sm font-medium border-b">
                  <SortableHeader field="audit_type" currentSort={sortConfig} onSort={handleSort}>
                    Nom du dossier
                  </SortableHeader>
                  <SortableHeader field="status" currentSort={sortConfig} onSort={handleSort}>
                    Statut
                  </SortableHeader>
                  <SortableHeader field="current_step" currentSort={sortConfig} onSort={handleSort}>
                    Étape
                  </SortableHeader>
                  <SortableHeader field="potential_gain" currentSort={sortConfig} onSort={handleSort}>
                    Gains Potentiels
                  </SortableHeader>
                  {activeTab === "completed" && (
                    <>
                      <SortableHeader field="obtained_gain" currentSort={sortConfig} onSort={handleSort}>
                        Gains Obtenus
                      </SortableHeader>
                      <SortableHeader field="reliability" currentSort={sortConfig} onSort={handleSort}>
                        Fiabilité
                      </SortableHeader>
                    </>
                  )}
                  <SortableHeader field="updated_at" currentSort={sortConfig} onSort={handleSort}>
                    Dernière activité
                  </SortableHeader>
                  <th className="p-2 text-left text-xs">Expert assigné</th>
                </tr>
              </thead>
              <tbody>
                {dossiers.map((dossier) => (
                  <AuditRow
                    key={dossier.id}
                    dossier={dossier}
                    activeTab={activeTab}
                    onViewDossier={handleViewDossier}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Cartes Mobile/Tablette */}
          <div className="lg:hidden space-y-3">
            {dossiers.map((dossier) => (
              <AuditRowCard
                key={dossier.id}
                dossier={dossier}
                activeTab={activeTab}
                onViewDossier={handleViewDossier}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-6 sm:py-8">
          <p className="text-sm sm:text-base text-gray-500 mb-4">Aucun dossier disponible.</p>
          <Button 
            variant="default" 
            onClick={onNewSimulation}
            className="mx-auto text-sm sm:text-base"
          >
            Démarrer une simulation pour découvrir vos opportunités
          </Button>
        </div>
      )}
    </div>
  );
});

AuditTable.displayName = 'AuditTable'; 