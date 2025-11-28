// Types pour le système d'import Excel avec mapping flexible

export type EntityType = 'client' | 'expert' | 'apporteur';
export type TransformationType = 'direct' | 'format' | 'lookup' | 'formula' | 'split';
export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface TransformationConfig {
  type: TransformationType;
  params?: {
    // Pour formatDate
    inputFormat?: string; // ex: "DD/MM/YYYY", "YYYY-MM-DD"
    
    // Pour formatPhone
    countryCode?: string; // ex: "+33"
    
    // Pour lookupExpert, lookupCabinet, lookupProduit
    lookupField?: string; // Champ à utiliser pour la recherche (ex: "name", "email")
    
    // Pour splitName
    separator?: string; // ex: " " (espace)
    
    // Pour parseNumber
    decimalSeparator?: string; // ex: ","
    thousandSeparator?: string; // ex: " "
    
    // Pour parseBoolean
    trueValues?: string[]; // ex: ["Oui", "OUI", "oui", "1", "true"]
    falseValues?: string[]; // ex: ["Non", "NON", "non", "0", "false"]
    
    // Pour formula
    formula?: string; // Expression à évaluer
  };
}

export interface MappingRule {
  excelColumn: string;
  databaseField: string;
  targetTable?: 'Client' | 'ClientProduitEligible' | 'RDV' | 'expertassignment';
  transformation?: TransformationConfig;
  isRequired: boolean;
  defaultValue?: any;
}

export interface MappingConfig {
  partnerName: string;
  entityType: EntityType;
  rules: MappingRule[];
  // Configurations pour les tables liées
  relatedTables?: {
    produits?: {
      enabled: boolean;
      rules: MappingRule[];
    };
    rdv?: {
      enabled: boolean;
      rules: MappingRule[];
    };
    expertAssignments?: {
      enabled: boolean;
      rules: MappingRule[];
    };
  };
}

export interface ImportOptions {
  skipDuplicates?: boolean; // Skip si email/SIREN existe déjà
  generatePasswords?: boolean; // Générer mots de passe automatiquement
  sendWelcomeEmails?: boolean; // Envoyer emails de bienvenue
  batchSize?: number; // Taille des batches pour import (défaut: 50)
  continueOnError?: boolean; // Continuer malgré erreurs
}

export interface ImportRowResult {
  rowIndex: number;
  success: boolean;
  entityId?: string;
  errors?: string[];
  warnings?: string[];
  data?: any; // Données transformées
}

export interface ImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  results: ImportRowResult[];
  duration?: number; // en millisecondes
}

export interface ImportHistory {
  id: string;
  templateId?: string;
  entityType: EntityType;
  fileName: string;
  fileSize?: number;
  totalRows: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  mappingConfig: MappingConfig;
  results?: ImportRowResult[];
  status: ImportStatus;
  createdBy?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface ImportTemplate {
  id: string;
  name: string;
  description?: string;
  entityType: EntityType;
  mappingConfig: MappingConfig;
  workflowConfig?: {
    defaultProductStatus?: string;
    defaultExpertId?: string;
    defaultCabinetId?: string;
    initialStep?: number;
    initialProgress?: number;
    productPatterns?: {
      productPattern?: string; // ex: "Produit_{index}"
      expertPattern?: string; // ex: "Expert_Produit_{index}"
      statutPattern?: string; // ex: "Statut_Produit_{index}"
      montantPattern?: string; // ex: "Montant_Produit_{index}"
    };
  };
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExcelFileData {
  columns: string[];
  rows: any[][];
  totalRows: number;
}

export interface PreviewData {
  columns: string[];
  sampleRows: any[][]; // Premières 10 lignes
  transformedRows: any[][]; // Après transformation
  validationErrors: Array<{
    rowIndex: number;
    field: string;
    error: string;
  }>;
}

