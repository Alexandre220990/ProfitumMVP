/**
 * Composant regroupant les actions expert sur un dossier
 * - Soumettre à l'administration
 * - Saisir résultat final
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SendHorizonal, FileCheck } from 'lucide-react';
import SubmissionModal from './SubmissionModal';
import FinalResultModal from './FinalResultModal';

interface ExpertDossierActionsProps {
  dossierId: string;
  clientName?: string;
  montantDemande?: number;
  statut: string;
  onActionCompleted: () => void;
  className?: string;
}

export default function ExpertDossierActions({
  dossierId,
  clientName,
  montantDemande = 0,
  statut,
  onActionCompleted,
  className = ''
}: ExpertDossierActionsProps) {
  
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showFinalResultModal, setShowFinalResultModal] = useState(false);

  // Déterminer les actions disponibles selon le statut
  const canSubmit = ['validation_pending', 'validated', 'audit_completed'].includes(statut);
  const canRecordResult = statut === 'implementation_in_progress';

  // Si aucune action disponible, ne rien afficher
  if (!canSubmit && !canRecordResult) {
    return null;
  }

  return (
    <>
      <Card className={`border-blue-200 ${className}`}>
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Actions expert</h3>
            <p className="text-sm text-gray-600">
              Gérez les étapes administratives du dossier
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {/* Bouton: Marquer comme soumis */}
            {canSubmit && (
              <Button
                onClick={() => setShowSubmissionModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <SendHorizonal className="w-4 h-4 mr-2" />
                🛠️ Lancer la mise en œuvre administration
              </Button>
            )}

            {/* Bouton: Saisir résultat final */}
            {canRecordResult && (
              <Button
                onClick={() => setShowFinalResultModal(true)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <FileCheck className="w-4 h-4 mr-2" />
                📋 Saisir le résultat final (+ Facture auto)
              </Button>
            )}
          </div>

          {canSubmit && (
            <p className="text-xs text-gray-500 italic">
              💡 La soumission informera automatiquement le client du dépôt de son dossier
            </p>
          )}

          {canRecordResult && (
            <p className="text-xs text-gray-500 italic">
              🧾 La saisie du résultat génèrera automatiquement la facture Profitum
            </p>
          )}
        </CardContent>
      </Card>

      {/* Modaux */}
      <SubmissionModal
        isOpen={showSubmissionModal}
        onClose={() => setShowSubmissionModal(false)}
        dossierId={dossierId}
        clientName={clientName}
        onSubmitted={() => {
          setShowSubmissionModal(false);
          onActionCompleted();
        }}
      />

      <FinalResultModal
        isOpen={showFinalResultModal}
        onClose={() => setShowFinalResultModal(false)}
        dossierId={dossierId}
        clientName={clientName}
        montantDemande={montantDemande}
        onResultRecorded={() => {
          setShowFinalResultModal(false);
          onActionCompleted();
        }}
      />
    </>
  );
}

