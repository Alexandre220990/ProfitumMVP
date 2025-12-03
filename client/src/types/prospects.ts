// Types pour le système de prospection - Frontend

// Structure des données d'enrichissement
export interface ProspectEnrichmentData {
  // Secteur d'activité
  secteur_activite: {
    description: string;
    tendances_profitum: string; // Comment ce secteur bénéficie de Profitum
  };
  
  // Actualités de l'entreprise
  actualites_entreprise: {
    recentes: string[]; // Liste des actualités récentes
    pertinence_profitum: string; // En quoi ces actualités créent des opportunités
  };
  
  // Signaux opérationnels détectés
  signaux_operationnels: {
    recrutements_en_cours: boolean;
    locaux_physiques: boolean;
    parc_vehicules_lourds: boolean; // Camions +7.5t
    consommation_gaz_importante: boolean;
    details?: string; // Détails supplémentaires si disponibles
  };
  
  // Profil d'éligibilité aux produits Profitum
  profil_eligibilite: {
    ticpe: {
      eligible: boolean;
      raison: string;
      potentiel_economie?: string; // Estimation si possible
    };
    cee: {
      eligible: boolean;
      raison: string;
      potentiel_economie?: string;
    };
    optimisation_sociale: {
      eligible: boolean;
      raison: string;
      potentiel_economie?: string;
    };
    autres?: Record<string, {
      eligible: boolean;
      raison: string;
      potentiel_economie?: string;
    }>;
  };
  
  // Résumé stratégique
  resume_strategique: string; // Synthèse en 2-3 phrases des opportunités principales
  
  // Métadonnées
  enriched_at: string; // ISO timestamp
  enrichment_version: string; // Version du prompt d'enrichissement utilisé
}

