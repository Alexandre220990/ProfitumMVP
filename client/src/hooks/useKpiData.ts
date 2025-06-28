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
    const dossiersEnCours = audits.filter(a => a.status === "pending").length;
    const gainsPotentiels = audits.reduce((sum, audit) => sum + (audit.potential_gain || 0), 0);
    const gainsObtenus = audits.filter(a => a.status === "completed").reduce((sum, audit) => sum + (audit.obtained_gain || 0), 0);
    const auditsFinalises = audits.filter(a => a.status === "completed").length;
    
    const avancementGlobal = dossiersEnCours > 0
      ? audits.filter(a => a.status === "pending").reduce((sum, audit) => sum + (audit.progress || 0), 0) / dossiersEnCours
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