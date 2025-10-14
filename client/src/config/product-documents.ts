/**
 * Configuration des documents requis par produit
 * Fichier centralisé pour gérer tous les types de documents
 */

import { Shield, Car, Fuel, FileText, Building2, Calculator, Users, Landmark } from 'lucide-react';
import type { RequiredDocument } from '@/components/ProductDocumentUpload';

// ============================================================================
// TICPE (Taxe Intérieure de Consommation sur les Produits Énergétiques)
// ============================================================================

export const TICPE_DOCUMENTS: RequiredDocument[] = [
  {
    type: 'kbis',
    label: 'Extrait KBIS',
    description: 'Extrait Kbis de votre entreprise (moins de 3 mois)',
    icon: Shield,
    required: true
  },
  {
    type: 'immatriculation',
    label: 'Certificat d\'immatriculation',
    description: 'Certificat d\'immatriculation de moins de 6 mois d\'au moins 1 véhicule',
    icon: Car,
    required: true
  },
  {
    type: 'facture_carburant',
    label: 'Facture de carburant',
    description: 'Facture de carburant trimestrielle ou annuelle',
    icon: Fuel,
    required: true
  }
];

export const TICPE_INFO_MESSAGE = "KBIS < 3 mois, Immatriculation < 6 mois, Facture récente. Documents vérifiés par notre équipe.";

// ============================================================================
// URSSAF (Remboursements cotisations sociales)
// ============================================================================

export const URSSAF_DOCUMENTS: RequiredDocument[] = [
  {
    type: 'kbis',
    label: 'Extrait KBIS',
    description: 'Extrait Kbis de votre entreprise (moins de 3 mois)',
    icon: Shield,
    required: true
  },
  {
    type: 'attestation_urssaf',
    label: 'Attestation URSSAF',
    description: 'Attestation de vigilance URSSAF en cours de validité',
    icon: FileText,
    required: true
  },
  {
    type: 'bilan_comptable',
    label: 'Bilan comptable',
    description: 'Dernier bilan comptable complet',
    icon: Calculator,
    required: true
  },
  {
    type: 'declaration_sociale',
    label: 'Déclaration sociale',
    description: 'Dernière déclaration sociale nominative (DSN)',
    icon: Users,
    required: false
  }
];

export const URSSAF_INFO_MESSAGE = "Tous les documents doivent être récents (< 3 mois). L'attestation URSSAF doit être en cours de validité.";

// ============================================================================
// FONCIER (Taxe Foncière)
// ============================================================================

export const FONCIER_DOCUMENTS: RequiredDocument[] = [
  {
    type: 'kbis',
    label: 'Extrait KBIS',
    description: 'Extrait Kbis de votre entreprise (moins de 3 mois)',
    icon: Shield,
    required: true
  },
  {
    type: 'taxe_fonciere',
    label: 'Avis de taxe foncière',
    description: 'Dernier avis de taxe foncière',
    icon: Landmark,
    required: true
  },
  {
    type: 'titre_propriete',
    label: 'Titre de propriété',
    description: 'Acte de propriété ou bail commercial',
    icon: Building2,
    required: true
  },
  {
    type: 'plan_cadastral',
    label: 'Plan cadastral',
    description: 'Plan cadastral du bien immobilier',
    icon: FileText,
    required: false
  }
];

export const FONCIER_INFO_MESSAGE = "Fournir les documents relatifs à tous les biens immobiliers de l'entreprise. Avis de taxe < 12 mois.";

// ============================================================================
// CIR (Crédit Impôt Recherche)
// ============================================================================

export const CIR_DOCUMENTS: RequiredDocument[] = [
  {
    type: 'kbis',
    label: 'Extrait KBIS',
    description: 'Extrait Kbis de votre entreprise (moins de 3 mois)',
    icon: Shield,
    required: true
  },
  {
    type: 'descriptif_projet',
    label: 'Descriptif du projet R&D',
    description: 'Description technique détaillée des travaux de recherche',
    icon: FileText,
    required: true
  },
  {
    type: 'justificatifs_depenses',
    label: 'Justificatifs de dépenses',
    description: 'Factures et justificatifs des dépenses de R&D',
    icon: Calculator,
    required: true
  },
  {
    type: 'cv_chercheurs',
    label: 'CV des chercheurs',
    description: 'CV du personnel de recherche impliqué',
    icon: Users,
    required: false
  }
];

export const CIR_INFO_MESSAGE = "Projet R&D justifié techniquement. Documentation scientifique complète requise.";

// ============================================================================
// HELPER : Récupérer la configuration par type de produit
// ============================================================================

export interface ProductDocumentConfig {
  documents: RequiredDocument[];
  category: string;
  infoMessage: string;
}

export function getProductDocumentConfig(productName: string): ProductDocumentConfig {
  const normalizedName = productName.toLowerCase();
  
  if (normalizedName.includes('ticpe')) {
    return {
      documents: TICPE_DOCUMENTS,
      category: 'eligibilite_ticpe',
      infoMessage: TICPE_INFO_MESSAGE
    };
  }
  
  if (normalizedName.includes('urssaf')) {
    return {
      documents: URSSAF_DOCUMENTS,
      category: 'eligibilite_urssaf',
      infoMessage: URSSAF_INFO_MESSAGE
    };
  }
  
  if (normalizedName.includes('foncier')) {
    return {
      documents: FONCIER_DOCUMENTS,
      category: 'eligibilite_foncier',
      infoMessage: FONCIER_INFO_MESSAGE
    };
  }
  
  if (normalizedName.includes('cir') || normalizedName.includes('crédit impôt recherche')) {
    return {
      documents: CIR_DOCUMENTS,
      category: 'eligibilite_cir',
      infoMessage: CIR_INFO_MESSAGE
    };
  }
  
  // Configuration par défaut
  return {
    documents: [
      {
        type: 'kbis',
        label: 'Extrait KBIS',
        description: 'Extrait Kbis de votre entreprise (moins de 3 mois)',
        icon: Shield,
        required: true
      },
      {
        type: 'documents_justificatifs',
        label: 'Documents justificatifs',
        description: 'Documents nécessaires pour votre dossier',
        icon: FileText,
        required: true
      }
    ],
    category: 'eligibilite_generale',
    infoMessage: 'Documents récents (< 3 mois) requis. Vérification par notre équipe.'
  };
}

