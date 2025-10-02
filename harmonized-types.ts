// ============================================================================
// TYPES HARMONISÉS POUR LES APPORTEURS D'AFFAIRES
// ============================================================================

// Types d'entreprise harmonisés
export type CompanyType = 
  | 'independant'           // Indépendant / Freelance
  | 'auto_entrepreneur'     // Auto-entrepreneur
  | 'entreprise_individuelle' // Entreprise individuelle (EI)
  | 'sarl'                  // SARL
  | 'sas'                   // SAS
  | 'sa'                    // SA
  | 'agence'                // Agence commerciale
  | 'call_center'           // Centre d'appel
  | 'partenaire'            // Partenaire commercial
  | 'salarie';              // Salarié d'entreprise

// Statuts d'apporteur
export type ApporteurStatus = 
  | 'candidature'           // Candidature en attente
  | 'active'                // Actif
  | 'inactive'              // Inactif
  | 'suspended'             // Suspendu
  | 'rejected';             // Rejeté

// Interface pour les données d'inscription
export interface ApporteurRegistrationData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_name: string;
  company_type: CompanyType;
  siren?: string;
  password: string;
  confirm_password?: string; // Optionnel car pas toujours fourni par l'admin
}

// Interface pour les données d'apporteur
export interface ApporteurData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_name: string;
  company_type: CompanyType;
  siren?: string;
  commission_rate: number;
  status: ApporteurStatus;
  created_at: string;
  prospects_count?: number;
}

// Mapping des types d'entreprise pour l'affichage
export const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  independant: 'Indépendant',
  auto_entrepreneur: 'Auto-entrepreneur',
  entreprise_individuelle: 'Entreprise individuelle',
  sarl: 'SARL',
  sas: 'SAS',
  sa: 'SA',
  agence: 'Agence commerciale',
  call_center: 'Centre d\'appel',
  partenaire: 'Partenaire commercial',
  salarie: 'Salarié d\'entreprise'
};

// Mapping des statuts pour l'affichage
export const STATUS_LABELS: Record<ApporteurStatus, string> = {
  candidature: 'Candidature',
  active: 'Actif',
  inactive: 'Inactif',
  suspended: 'Suspendu',
  rejected: 'Rejeté'
};

// Fonction de mapping pour les anciens types du frontend
export const mapFrontendCompanyType = (frontendType: string): CompanyType => {
  const mapping: Record<string, CompanyType> = {
    'Entreprise individuelle': 'entreprise_individuelle',
    'SARL': 'sarl',
    'SAS': 'sas',
    'SA': 'sa',
    'EURL': 'entreprise_individuelle', // EURL est une forme d'EI
    'Auto-entrepreneur': 'auto_entrepreneur',
    'Autre': 'independant'
  };
  
  return mapping[frontendType] || 'independant';
};
