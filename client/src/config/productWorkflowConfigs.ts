/**
 * CONFIGURATION DES WORKFLOWS PAR PRODUIT
 * 
 * Ce fichier centralise toute la configuration des workflows pour chaque produit :
 * - Documents requis
 * - Étapes spécifiques
 * - Labels et descriptions
 * - Types de documents acceptés
 */

import { 
  Fuel, 
  Users, 
  FileText, 
  Shield, 
  Zap, 
  Calculator,
  Home,
  Leaf,
  TrendingUp,
  Euro
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface DocumentRequirement {
  type: string;
  label: string;
  description: string;
  required: boolean;
  acceptedFormats: string[];
  maxSize?: number; // en MB
  canReuseFromOtherProduct?: boolean; // Si le document peut être réutilisé (ex: KBIS)
}

export interface WorkflowStep {
  id: number;
  name: string;
  description: string;
  icon: any;
  component: string;
}

export interface ProductWorkflowConfig {
  productKey: string;
  productName: string;
  productIcon: any;
  category: string;
  estimatedDuration: string; // Durée estimée du traitement
  requiredDocuments: DocumentRequirement[];
  workflowSteps: WorkflowStep[];
  specificInstructions?: string;
}

// ============================================================================
// DOCUMENTS STANDARDS RÉUTILISABLES
// ============================================================================

export const COMMON_DOCUMENTS = {
  kbis: {
    type: 'kbis',
    label: 'KBIS (moins de 3 mois)',
    description: 'Extrait KBIS de moins de 3 mois',
    required: true,
    acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSize: 10,
    canReuseFromOtherProduct: true
  },
  rib: {
    type: 'rib',
    label: 'RIB',
    description: 'Relevé d\'Identité Bancaire de l\'entreprise',
    required: true,
    acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSize: 5,
    canReuseFromOtherProduct: true
  },
  bilan_comptable: {
    type: 'bilan_comptable',
    label: 'Bilan comptable',
    description: 'Bilan comptable de l\'exercice N-1',
    required: false,
    acceptedFormats: ['application/pdf'],
    maxSize: 20,
    canReuseFromOtherProduct: true
  }
};

// ============================================================================
// ÉTAPES DE WORKFLOW STANDARDS
// ============================================================================

export const STANDARD_WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 1,
    name: 'Confirmer l\'éligibilité',
    description: 'Upload des documents justificatifs',
    icon: Shield,
    component: 'documents'
  },
  {
    id: 2,
    name: 'Sélection de l\'expert',
    description: 'Choisir l\'expert qui vous accompagnera',
    icon: Users,
    component: 'expert'
  },
  {
    id: 3,
    name: 'Collecte des documents',
    description: 'Rassemblement des documents complémentaires',
    icon: FileText,
    component: 'collection'
  },
  {
    id: 4,
    name: 'Audit technique',
    description: 'Analyse technique par l\'expert',
    icon: TrendingUp,
    component: 'audit'
  },
  {
    id: 5,
    name: 'Validation finale',
    description: 'Validation administrative',
    icon: Shield,
    component: 'validation'
  },
  {
    id: 6,
    name: 'Demande de remboursement',
    description: 'Soumission de la demande',
    icon: Euro,
    component: 'payment'
  }
];

// ============================================================================
// CONFIGURATIONS PAR PRODUIT
// ============================================================================

export const PRODUCT_CONFIGS: Record<string, ProductWorkflowConfig> = {
  // ===========================
  // TICPE
  // ===========================
  ticpe: {
    productKey: 'ticpe',
    productName: 'TICPE',
    productIcon: Fuel,
    category: 'Remboursement fiscal',
    estimatedDuration: '3-4 mois',
    requiredDocuments: [
      COMMON_DOCUMENTS.kbis,
      {
        type: 'immatriculation',
        label: 'Cartes grises des véhicules',
        description: 'Certificats d\'immatriculation de tous les véhicules professionnels',
        required: true,
        acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
        maxSize: 10,
        canReuseFromOtherProduct: false
      },
      {
        type: 'factures_carburant',
        label: 'Factures de carburant',
        description: 'Factures de carburant des 12 derniers mois',
        required: true,
        acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
        maxSize: 20,
        canReuseFromOtherProduct: false
      },
      COMMON_DOCUMENTS.rib
    ],
    workflowSteps: STANDARD_WORKFLOW_STEPS,
    specificInstructions: 'Assurez-vous que vos véhicules sont bien immatriculés comme véhicules professionnels et que vous disposez de toutes les factures de carburant.'
  },

  // ===========================
  // URSSAF
  // ===========================
  urssaf: {
    productKey: 'urssaf',
    productName: 'URSSAF',
    productIcon: Users,
    category: 'Optimisation sociale',
    estimatedDuration: '2-3 mois',
    requiredDocuments: [
      COMMON_DOCUMENTS.kbis,
      {
        type: 'fiches_paie',
        label: 'Fiches de paie',
        description: 'Fiches de paie des 12 derniers mois de tous les salariés',
        required: true,
        acceptedFormats: ['application/pdf'],
        maxSize: 30,
        canReuseFromOtherProduct: false
      },
      {
        type: 'dsn',
        label: 'Déclarations Sociales Nominatives (DSN)',
        description: 'DSN des 12 derniers mois',
        required: true,
        acceptedFormats: ['application/pdf', 'text/xml'],
        maxSize: 20,
        canReuseFromOtherProduct: false
      },
      {
        type: 'declarations_urssaf',
        label: 'Déclarations URSSAF',
        description: 'Relevés de cotisations URSSAF',
        required: true,
        acceptedFormats: ['application/pdf'],
        maxSize: 15,
        canReuseFromOtherProduct: false
      },
      COMMON_DOCUMENTS.rib
    ],
    workflowSteps: STANDARD_WORKFLOW_STEPS,
    specificInstructions: 'Préparez tous les documents sociaux de votre entreprise pour une analyse complète de vos cotisations.'
  },

  // ===========================
  // MSA (Mutualité Sociale Agricole)
  // ===========================
  msa: {
    productKey: 'msa',
    productName: 'MSA',
    productIcon: Leaf,
    category: 'Optimisation agricole',
    estimatedDuration: '2-3 mois',
    requiredDocuments: [
      COMMON_DOCUMENTS.kbis,
      {
        type: 'releves_msa',
        label: 'Relevés MSA',
        description: 'Relevés de cotisations MSA des 12 derniers mois',
        required: true,
        acceptedFormats: ['application/pdf'],
        maxSize: 20,
        canReuseFromOtherProduct: false
      },
      {
        type: 'declarations_sociales_agricoles',
        label: 'Déclarations sociales agricoles',
        description: 'Déclarations de revenus agricoles (formulaire 2042-C-PRO)',
        required: true,
        acceptedFormats: ['application/pdf'],
        maxSize: 15,
        canReuseFromOtherProduct: false
      },
      {
        type: 'justificatifs_activite_agricole',
        label: 'Justificatifs d\'activité agricole',
        description: 'Preuve d\'activité agricole (bail rural, titre de propriété, etc.)',
        required: true,
        acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
        maxSize: 10,
        canReuseFromOtherProduct: false
      },
      COMMON_DOCUMENTS.rib
    ],
    workflowSteps: STANDARD_WORKFLOW_STEPS,
    specificInstructions: 'Ce dispositif s\'adresse aux exploitants agricoles. Assurez-vous que votre activité est bien déclarée à la MSA.'
  },

  // ===========================
  // DFS (Déduction Forfaitaire Spécifique)
  // ===========================
  dfs: {
    productKey: 'dfs',
    productName: 'Déduction Forfaitaire Spécifique',
    productIcon: Calculator,
    category: 'Optimisation fiscale',
    estimatedDuration: '1-2 mois',
    requiredDocuments: [
      COMMON_DOCUMENTS.kbis,
      {
        type: 'bulletins_salaire_dfs',
        label: 'Bulletins de salaire',
        description: 'Bulletins de salaire des employés éligibles (secteurs restauration, BTP, hôtellerie, transport)',
        required: true,
        acceptedFormats: ['application/pdf'],
        maxSize: 30,
        canReuseFromOtherProduct: false
      },
      {
        type: 'contrats_travail',
        label: 'Contrats de travail',
        description: 'Contrats de travail des employés concernés',
        required: true,
        acceptedFormats: ['application/pdf'],
        maxSize: 20,
        canReuseFromOtherProduct: false
      },
      {
        type: 'justificatif_secteur_dfs',
        label: 'Justificatif d\'activité sectorielle',
        description: 'Preuve d\'appartenance à un secteur éligible (restauration, BTP, hôtellerie, transport)',
        required: true,
        acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
        maxSize: 10,
        canReuseFromOtherProduct: false
      },
      COMMON_DOCUMENTS.rib
    ],
    workflowSteps: STANDARD_WORKFLOW_STEPS,
    specificInstructions: 'La DFS s\'applique aux secteurs : restauration, BTP, hôtellerie et transport routier. Vérifiez votre éligibilité.'
  },

  // ===========================
  // FONCIER (Déficit Foncier)
  // ===========================
  foncier: {
    productKey: 'foncier',
    productName: 'Déficit Foncier',
    productIcon: Home,
    category: 'Optimisation fiscale',
    estimatedDuration: '2-4 mois',
    requiredDocuments: [
      {
        type: 'declaration_revenus_fonciers',
        label: 'Déclaration de revenus fonciers (2044)',
        description: 'Formulaire 2044 de la dernière année fiscale',
        required: true,
        acceptedFormats: ['application/pdf'],
        maxSize: 10,
        canReuseFromOtherProduct: false
      },
      {
        type: 'factures_travaux',
        label: 'Factures de travaux',
        description: 'Factures détaillées des travaux déductibles réalisés',
        required: true,
        acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
        maxSize: 50,
        canReuseFromOtherProduct: false
      },
      {
        type: 'justificatifs_propriete',
        label: 'Justificatifs de propriété',
        description: 'Acte de propriété ou attestation notariale',
        required: true,
        acceptedFormats: ['application/pdf'],
        maxSize: 15,
        canReuseFromOtherProduct: false
      },
      {
        type: 'avis_taxe_fonciere',
        label: 'Avis de taxe foncière',
        description: 'Avis de taxe foncière de l\'année concernée',
        required: true,
        acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
        maxSize: 5,
        canReuseFromOtherProduct: false
      },
      {
        type: 'baux_location',
        label: 'Baux de location',
        description: 'Contrats de location si le bien est loué',
        required: false,
        acceptedFormats: ['application/pdf'],
        maxSize: 10,
        canReuseFromOtherProduct: false
      }
    ],
    workflowSteps: STANDARD_WORKFLOW_STEPS,
    specificInstructions: 'Le déficit foncier permet de déduire les travaux de rénovation de vos revenus fonciers. Seuls les travaux déductibles sont pris en compte.'
  },

  // ===========================
  // ENERGIE / CEE (Certificats d'Économies d'Énergie)
  // ===========================
  energie: {
    productKey: 'energie',
    productName: 'Certificats d\'Économies d\'Énergie (CEE)',
    productIcon: Zap,
    category: 'Transition énergétique',
    estimatedDuration: '3-5 mois',
    requiredDocuments: [
      COMMON_DOCUMENTS.kbis,
      {
        type: 'factures_energie_edf',
        label: 'Factures EDF',
        description: 'Factures d\'électricité EDF des 12 derniers mois',
        required: true,
        acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
        maxSize: 30,
        canReuseFromOtherProduct: false
      },
      {
        type: 'factures_energie_gdf',
        label: 'Factures GDF/Engie',
        description: 'Factures de gaz GDF/Engie des 12 derniers mois',
        required: false,
        acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
        maxSize: 30,
        canReuseFromOtherProduct: false
      },
      {
        type: 'factures_energie_enedis',
        label: 'Factures Enedis',
        description: 'Factures Enedis (gestionnaire réseau) si applicable',
        required: false,
        acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
        maxSize: 30,
        canReuseFromOtherProduct: false
      },
      COMMON_DOCUMENTS.rib
    ],
    workflowSteps: STANDARD_WORKFLOW_STEPS,
    specificInstructions: 'Uploadez vos factures d\'énergie (EDF, GDF/Engie, Enedis) pour évaluer vos opportunités d\'économies d\'énergie et de récupération de CEE.'
  }
};

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Récupérer la configuration d'un produit
 */
export function getProductConfig(productKey: string): ProductWorkflowConfig | null {
  return PRODUCT_CONFIGS[productKey] || null;
}

/**
 * Vérifier si un document peut être réutilisé depuis un autre produit
 */
export function canReuseDocument(documentType: string): boolean {
  for (const config of Object.values(PRODUCT_CONFIGS)) {
    const doc = config.requiredDocuments.find(d => d.type === documentType);
    if (doc?.canReuseFromOtherProduct) {
      return true;
    }
  }
  return false;
}

/**
 * Obtenir tous les documents requis pour un produit
 */
export function getRequiredDocuments(productKey: string): DocumentRequirement[] {
  const config = getProductConfig(productKey);
  return config ? config.requiredDocuments.filter(d => d.required) : [];
}

/**
 * Obtenir tous les documents optionnels pour un produit
 */
export function getOptionalDocuments(productKey: string): DocumentRequirement[] {
  const config = getProductConfig(productKey);
  return config ? config.requiredDocuments.filter(d => !d.required) : [];
}

/**
 * Vérifier si tous les documents requis sont uploadés
 */
export function hasAllRequiredDocuments(
  productKey: string, 
  uploadedDocumentTypes: string[]
): boolean {
  const required = getRequiredDocuments(productKey);
  return required.every(doc => uploadedDocumentTypes.includes(doc.type));
}

