/**
 * EligibilityValidationStatus
 * 
 * Composant d'affichage du statut de validation d'éligibilité
 * - En attente de validation admin (gris/orange)
 * - Validé par admin (vert)
 * - Rejeté par admin (rouge)
 */

import { CheckCircle, Clock, XCircle, Edit, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClientProduitEligible {
  id: string;
  statut: string;
  metadata?: {
    eligibility_validation?: {
      status: 'validated' | 'rejected';
      validated_by?: string;
      validated_by_email?: string;
      validated_at?: string;
      notes?: string;
    };
  };
}

interface EligibilityValidationStatusProps {
  clientProduit: ClientProduitEligible;
  onModifyDocuments?: () => void;
  className?: string;
}

export default function EligibilityValidationStatus({ 
  clientProduit, 
  onModifyDocuments,
  className = "" 
}: EligibilityValidationStatusProps) {
  
  const validationInfo = clientProduit.metadata?.eligibility_validation;

  // ============================================================================
  // ÉTAT 1 : ÉLIGIBILITÉ VALIDÉE PAR ADMIN ✅ (VERT)
  // ============================================================================
  if (clientProduit.statut === 'eligibility_validated') {
    return (
      <div className={`bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-5 shadow-sm ${className}`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-green-900 font-bold text-xl mb-1">
              ✅ Pré-éligibilité confirmée
            </h3>
            <p className="text-green-800 text-sm leading-relaxed">
              Félicitations ! Votre dossier a été validé par nos équipes le{' '}
              {validationInfo?.validated_at ? 
                new Date(validationInfo.validated_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                }) 
                : 'récemment'
              }.
              Vous pouvez maintenant passer à l'étape suivante.
            </p>
            {validationInfo?.notes && (
              <div className="mt-3 bg-green-100 border border-green-200 rounded-lg p-3">
                <p className="text-green-900 text-sm font-medium">Note de validation :</p>
                <p className="text-green-800 text-sm mt-1">{validationInfo.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // ÉTAT 0 : STATUT INITIAL - Prêt pour upload de documents (BLEU CLAIR)
  // ============================================================================
  if (clientProduit.statut === 'eligible' || clientProduit.statut === 'opportunité') {
    return (
      <div className={`bg-gradient-to-r from-blue-50 to-sky-50 border-2 border-blue-300 rounded-xl p-5 shadow-sm ${className}`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Upload className="w-7 h-7 text-blue-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-blue-900 font-bold text-xl mb-1">
              📋 Produit éligible
            </h3>
            <p className="text-blue-800 text-sm leading-relaxed">
              Votre produit est éligible ! Pour confirmer votre pré-éligibilité, veuillez uploader les documents requis ci-dessous, puis cliquez sur "Valider l'étape".
            </p>
            <div className="bg-blue-100 border border-blue-200 rounded-lg p-3 mt-3">
              <p className="text-blue-900 text-xs font-semibold">
                ℹ️ Documents nécessaires : KBIS, Certificat d'immatriculation, Facture de carburant
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // ÉTAT 2 : EN ATTENTE DE VALIDATION ADMIN ⏳ (GRIS/ARDOISE)
  // ============================================================================
  if (clientProduit.statut === 'documents_uploaded' || clientProduit.statut === 'eligible_confirmed') {
    return (
      <div className={`bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-300 rounded-xl p-5 shadow-sm ${className}`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
              <Clock className="w-7 h-7 text-slate-600 animate-pulse" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-slate-900 font-bold text-xl mb-1">
              ⏳ En attente de validation par nos équipes
            </h3>
            <p className="text-slate-700 text-sm leading-relaxed mb-3">
              Vos documents d'éligibilité ont bien été transmis à nos équipes. 
              Nous vérifions actuellement votre dossier.
            </p>
            <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 mb-3">
              <p className="text-slate-900 text-xs font-semibold mb-1">
                📋 Délai habituel de traitement
              </p>
              <p className="text-slate-700 text-xs">
                Vous recevrez une notification sous <strong>24 à 48 heures ouvrées</strong>.
              </p>
            </div>
            {onModifyDocuments && (
              <Button 
                variant="outline" 
                size="sm" 
                className="border-slate-300 text-slate-700 hover:bg-slate-100"
                onClick={onModifyDocuments}
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier ou ajouter des documents
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // ÉTAT 3 : ÉLIGIBILITÉ REJETÉE PAR ADMIN ❌ (ROUGE)
  // ============================================================================
  if (clientProduit.statut === 'eligibility_rejected') {
    return (
      <div className={`bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 rounded-xl p-5 shadow-sm ${className}`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-7 h-7 text-red-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-red-900 font-bold text-xl mb-1">
              ❌ Éligibilité non confirmée
            </h3>
            <p className="text-red-800 text-sm leading-relaxed mb-3">
              Votre dossier n'a pas pu être validé en l'état. 
              Merci de compléter ou corriger vos documents.
            </p>
            {validationInfo?.notes && (
              <div className="bg-red-100 border border-red-200 rounded-lg p-3 mb-3">
                <p className="text-red-900 text-sm font-semibold mb-1">Raison du refus :</p>
                <p className="text-red-800 text-sm">{validationInfo.notes}</p>
              </div>
            )}
            {onModifyDocuments && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={onModifyDocuments}
              >
                <Upload className="w-4 h-4 mr-2" />
                Mettre à jour les documents
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Aucun affichage pour les autres statuts
  return null;
}

