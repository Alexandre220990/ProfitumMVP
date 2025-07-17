import { useMemo } from "react";
import { Audit } from "@/types/audit";

interface KPIData { 
  dossiersEnCours: number;
  gainsPotentiels: number;
  gainsObtenus: number;
  auditsFinalises: number;
  avancementGlobal: number; 
}

export function useKpiData(audits: Audit[]): KPIData { 
  return useMemo(() => {
    // Dossiers en cours : statut "en_cours" ou "non_démarré"
    const dossiersEnCours = audits.filter(a => 
      a.status === "en_cours" || a.status === "non_démarré"
    ).length;
    
    // Gains potentiels : somme de tous les audits
    const gainsPotentiels = audits.reduce((sum, audit) => sum + (audit.potential_gain || 0), 0);
    
    // Gains obtenus : audits avec statut "eligible" ou "termine"
    const gainsObtenus = audits.filter(a => 
      a.status === "eligible" || a.status === "termine"
    ).reduce((sum, audit) => sum + (audit.obtained_gain || 0), 0);
    
    // Audits finalisés : statut "eligible" ou "termine"
    const auditsFinalises = audits.filter(a => 
      a.status === "eligible" || a.status === "termine"
    ).length;
    
    // Avancement global : moyenne des progress des dossiers en cours
    const avancementGlobal = dossiersEnCours > 0
      ? audits.filter(a => 
          a.status === "en_cours" || a.status === "non_démarré"
        ).reduce((sum, audit) => sum + (audit.progress || 0), 0) / dossiersEnCours
      : 0;

    return {
      dossiersEnCours, 
      gainsPotentiels, 
      gainsObtenus, 
      auditsFinalises, 
      avancementGlobal 
    };
  }, [audits]);
} 