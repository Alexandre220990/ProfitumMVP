/**
 * TYPES ET CONSTANTES POUR LES STATUTS ClientProduitEligible
 * 
 * Ce fichier définit tous les statuts possibles pour le cycle de vie d'un produit éligible.
 * La colonne 'statut' en base est de type TEXT (pas d'ENUM), donc flexible.
 */

// ============================================================================
// TYPE TYPESCRIPT POUR LES STATUTS
// ============================================================================

export type ClientProduitStatut = 
  // Phase 0 : Création et Initialisation
  | 'opportunité'              // Valeur par défaut en base (produit créé)
  | 'eligible'                 // Produit éligible suite à simulation
  
  // Phase 1 : Validation de l'Éligibilité
  | 'documents_uploaded'       // Client a uploadé les docs, en attente validation admin
  | 'eligible_confirmed'       // Alias de documents_uploaded (ancien nom)
  | 'eligibility_validated'    // Admin a validé la pré-éligibilité ✅
  | 'eligibility_rejected'     // Admin a rejeté la pré-éligibilité ❌
  
  // Phase 2 : Attribution Expert et Traitement
  | 'expert_assigned'          // Expert assigné au dossier
  | 'documents_collection'     // Collecte des documents complémentaires en cours
  | 'audit_in_progress'        // Audit technique en cours par l'expert
  | 'audit_completed'          // Audit terminé
  
  // Phase 3 : Validation et Remboursement
  | 'validation_pending'       // En attente validation finale
  | 'validated'                // Dossier validé, prêt pour demande de remboursement
  | 'refund_requested'         // Demande de remboursement soumise
  | 'refund_in_progress'       // Remboursement en cours de traitement
  | 'refund_completed'         // Remboursement effectué ✅
  
  // Statuts d'Exception
  | 'on_hold'                  // Dossier en pause (manque d'informations)
  | 'cancelled'                // Dossier annulé par le client
  | 'rejected'                 // Dossier rejeté définitivement
  | 'archived';                // Dossier archivé

// ============================================================================
// CONSTANTES POUR LES STATUTS
// ============================================================================

export const STATUTS_PHASE_0 = [
  'opportunité',
  'eligible'
] as const;

export const STATUTS_PHASE_1_ELIGIBILITE = [
  'documents_uploaded',
  'eligible_confirmed',
  'eligibility_validated',
  'eligibility_rejected'
] as const;

export const STATUTS_PHASE_2_TRAITEMENT = [
  'expert_assigned',
  'documents_collection',
  'audit_in_progress',
  'audit_completed'
] as const;

export const STATUTS_PHASE_3_REMBOURSEMENT = [
  'validation_pending',
  'validated',
  'refund_requested',
  'refund_in_progress',
  'refund_completed'
] as const;

export const STATUTS_EXCEPTION = [
  'on_hold',
  'cancelled',
  'rejected',
  'archived'
] as const;

// ============================================================================
// MAPPINGS STATUTS → LABELS ET COULEURS
// ============================================================================

export const STATUT_LABELS: Record<ClientProduitStatut, string> = {
  // Phase 0
  'opportunité': 'Opportunité',
  'eligible': 'Éligible',
  
  // Phase 1
  'documents_uploaded': 'Documents soumis',
  'eligible_confirmed': 'Documents soumis',
  'eligibility_validated': 'Pré-éligibilité validée',
  'eligibility_rejected': 'Pré-éligibilité rejetée',
  
  // Phase 2
  'expert_assigned': 'Expert assigné',
  'documents_collection': 'Collecte de documents',
  'audit_in_progress': 'Audit en cours',
  'audit_completed': 'Audit terminé',
  
  // Phase 3
  'validation_pending': 'En attente de validation',
  'validated': 'Validé',
  'refund_requested': 'Remboursement demandé',
  'refund_in_progress': 'Remboursement en cours',
  'refund_completed': 'Remboursement effectué',
  
  // Exception
  'on_hold': 'En attente',
  'cancelled': 'Annulé',
  'rejected': 'Rejeté',
  'archived': 'Archivé'
};

export const STATUT_COLORS: Record<ClientProduitStatut, string> = {
  // Phase 0 - Bleu
  'opportunité': 'bg-blue-100 text-blue-800 border-blue-300',
  'eligible': 'bg-blue-100 text-blue-800 border-blue-300',
  
  // Phase 1 - Éligibilité
  'documents_uploaded': 'bg-slate-100 text-slate-800 border-slate-300',
  'eligible_confirmed': 'bg-slate-100 text-slate-800 border-slate-300',
  'eligibility_validated': 'bg-green-100 text-green-800 border-green-300',
  'eligibility_rejected': 'bg-red-100 text-red-800 border-red-300',
  
  // Phase 2 - Traitement (Orange/Jaune)
  'expert_assigned': 'bg-amber-100 text-amber-800 border-amber-300',
  'documents_collection': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'audit_in_progress': 'bg-orange-100 text-orange-800 border-orange-300',
  'audit_completed': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  
  // Phase 3 - Remboursement (Vert)
  'validation_pending': 'bg-lime-100 text-lime-800 border-lime-300',
  'validated': 'bg-green-100 text-green-800 border-green-300',
  'refund_requested': 'bg-teal-100 text-teal-800 border-teal-300',
  'refund_in_progress': 'bg-cyan-100 text-cyan-800 border-cyan-300',
  'refund_completed': 'bg-green-200 text-green-900 border-green-400',
  
  // Exception (Gris/Rouge)
  'on_hold': 'bg-gray-100 text-gray-800 border-gray-300',
  'cancelled': 'bg-gray-200 text-gray-700 border-gray-400',
  'rejected': 'bg-red-100 text-red-800 border-red-300',
  'archived': 'bg-gray-100 text-gray-600 border-gray-300'
};

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Vérifier si un statut permet l'upload de documents d'éligibilité
 */
export function canUploadEligibilityDocuments(statut: ClientProduitStatut): boolean {
  return STATUTS_PHASE_0.includes(statut as any) || 
         statut === 'eligibility_rejected';
}

/**
 * Vérifier si un statut indique que l'éligibilité est en attente de validation
 */
export function isEligibilityPending(statut: ClientProduitStatut): boolean {
  return statut === 'documents_uploaded' || statut === 'eligible_confirmed';
}

/**
 * Vérifier si un statut indique que l'éligibilité est validée
 */
export function isEligibilityValidated(statut: ClientProduitStatut): boolean {
  return statut === 'eligibility_validated';
}

/**
 * Vérifier si un statut indique que l'éligibilité est rejetée
 */
export function isEligibilityRejected(statut: ClientProduitStatut): boolean {
  return statut === 'eligibility_rejected';
}

/**
 * Obtenir la phase du dossier selon le statut
 */
export function getPhaseFromStatut(statut: ClientProduitStatut): number {
  if (STATUTS_PHASE_0.includes(statut as any)) return 0;
  if (STATUTS_PHASE_1_ELIGIBILITE.includes(statut as any)) return 1;
  if (STATUTS_PHASE_2_TRAITEMENT.includes(statut as any)) return 2;
  if (STATUTS_PHASE_3_REMBOURSEMENT.includes(statut as any)) return 3;
  return -1; // Exception
}

/**
 * Obtenir l'étape du workflow (current_step) selon le statut
 */
export function getCurrentStepFromStatut(statut: ClientProduitStatut): number {
  switch (statut) {
    // Étape 1 : Confirmer l'éligibilité
    case 'opportunité':
    case 'eligible':
    case 'documents_uploaded':
    case 'eligible_confirmed':
    case 'eligibility_rejected':
      return 1;
    
    // Étape 2 : Sélection de l'expert
    case 'eligibility_validated':
      return 2;
    
    // Étape 3 : Collecte des documents
    case 'expert_assigned':
    case 'documents_collection':
      return 3;
    
    // Étape 4 : Audit technique
    case 'audit_in_progress':
    case 'audit_completed':
      return 4;
    
    // Étape 5 : Validation finale
    case 'validation_pending':
    case 'validated':
      return 5;
    
    // Étape 6 : Demande de remboursement
    case 'refund_requested':
    case 'refund_in_progress':
    case 'refund_completed':
      return 6;
    
    default:
      return 1;
  }
}

/**
 * Obtenir le progrès (%) selon le statut
 */
export function getProgressFromStatut(statut: ClientProduitStatut): number {
  switch (statut) {
    case 'opportunité':
    case 'eligible':
      return 5;
    
    case 'documents_uploaded':
    case 'eligible_confirmed':
      return 15;
    
    case 'eligibility_validated':
      return 25;
    
    case 'expert_assigned':
      return 35;
    
    case 'documents_collection':
      return 45;
    
    case 'audit_in_progress':
      return 55;
    
    case 'audit_completed':
      return 70;
    
    case 'validation_pending':
      return 80;
    
    case 'validated':
      return 85;
    
    case 'refund_requested':
      return 90;
    
    case 'refund_in_progress':
      return 95;
    
    case 'refund_completed':
      return 100;
    
    // Exceptions
    case 'eligibility_rejected':
    case 'rejected':
      return 0;
    
    case 'on_hold':
      return 50;
    
    case 'cancelled':
    case 'archived':
      return 0;
    
    default:
      return 10;
  }
}

