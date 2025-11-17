/**
 * Modal de validation d'audit avec affichage des conditions de commission
 * Affiche les estimations HT/TVA/TTC pour Profitum
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, DollarSign, FileText, Loader2, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { get, post } from '@/lib/api';
import { toast } from 'sonner';

interface AuditValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossierId: string;
  onValidated: () => void;
}

interface CommissionInfo {
  expert_name: string;
  client_fee_percentage: number;
  client_fee_percent: string;
  profitum_fee_percentage: number;
  profitum_fee_percent: string;
  montant_remboursement: number;
  expert_total_fee: number;
  profitum_total_fee: number;
  estimation_ht: number;
  estimation_tva: number;
  estimation_ttc: number;
}

export default function AuditValidationModal({
  isOpen,
  onClose,
  dossierId,
  onValidated
}: AuditValidationModalProps) {
  
  const [commissionInfo, setCommissionInfo] = useState<CommissionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Charger les infos de commission à l'ouverture
  useEffect(() => {
    if (isOpen && !commissionInfo) {
      loadCommissionInfo();
    }
  }, [isOpen]);

  const loadCommissionInfo = async () => {
    setIsLoading(true);
    try {
      const response = await get(`/api/client/dossier/${dossierId}/audit-commission-info`);
      
      if (response.success && response.data) {
        setCommissionInfo(response.data as CommissionInfo);
        console.log('💰 Infos commission chargées:', response.data);
      } else {
        toast.error('Erreur de chargement des informations');
        onClose();
      }
    } catch (error) {
      console.error('Erreur chargement commission:', error);
      toast.error('Erreur de chargement');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateAudit = async () => {
    setIsValidating(true);
    try {
      const response = await post(`/api/client/dossier/${dossierId}/validate-audit`, {
        action: 'accept'
      });

      if (response.success) {
        toast.success('✅ Audit validé avec succès !');
        onValidated();
        onClose();
      } else {
        toast.error(response.message || 'Erreur lors de la validation');
      }
    } catch (error) {
      console.error('Erreur validation audit:', error);
      toast.error('Erreur lors de la validation');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRejectAudit = async () => {
    if (!rejectReason.trim()) {
      toast.error('Veuillez indiquer la raison du refus');
      return;
    }

    setIsRejecting(true);
    try {
      const response = await post(`/api/client/dossier/${dossierId}/validate-audit`, {
        action: 'reject',
        reason: rejectReason.trim()
      });

      if (response.success) {
        toast.success('Audit refusé. L\'expert a été notifié et pourra proposer une nouvelle version.');
        setShowRejectDialog(false);
        setRejectReason('');
        onValidated();
        onClose();
      } else {
        toast.error(response.message || 'Erreur lors du refus');
      }
    } catch (error) {
      console.error('Erreur refus audit:', error);
      toast.error('Erreur lors du refus');
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Validation de l'audit
          </DialogTitle>
          <DialogDescription>
            Confirmez votre acceptation de l'audit et des conditions de rémunération Profitum
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : commissionInfo ? (
          <div className="space-y-6">
            
            {/* Récapitulatif expert */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Expert accompagnateur</p>
                    <p className="text-lg font-semibold text-blue-800">{commissionInfo.expert_name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Montant du remboursement */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Montant du remboursement</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {commissionInfo.montant_remboursement.toLocaleString('fr-FR')} €
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            {/* Conditions de commission WATERFALL */}
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-900 mb-2">
                      💼 Modèle de rémunération (Waterfall)
                    </h3>
                    <p className="text-sm text-amber-800 mb-3">
                      En validant cet audit, vous acceptez le modèle de commission suivant :
                    </p>

                    {/* WATERFALL VISUEL */}
                    <div className="space-y-2 bg-white rounded-lg p-3 border border-amber-200">
                      {/* Étape 1 */}
                      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                        <span className="text-lg">1️⃣</span>
                        <div className="flex-1">
                          <p className="text-xs text-gray-600">Vous payez à l'expert</p>
                          <p className="font-semibold text-gray-900">
                            {commissionInfo.expert_total_fee.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € 
                            <span className="text-xs text-gray-600 ml-1">({commissionInfo.client_fee_percent}%)</span>
                          </p>
                        </div>
                      </div>

                      {/* Flèche */}
                      <div className="flex justify-center">
                        <div className="text-gray-400">↓</div>
                      </div>

                      {/* Étape 2 */}
                      <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                        <span className="text-lg">2️⃣</span>
                        <div className="flex-1">
                          <p className="text-xs text-gray-600">Expert paie à Profitum</p>
                          <p className="font-semibold text-gray-900">
                            {commissionInfo.profitum_total_fee.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € 
                            <span className="text-xs text-gray-600 ml-1">({commissionInfo.profitum_fee_percent}%)</span>
                          </p>
                        </div>
                      </div>

                      <div className="h-px bg-amber-300 my-2" />

                      {/* Facture Profitum */}
                      <div className="bg-amber-50 p-2 rounded">
                        <p className="text-xs text-gray-600 mb-1">Facture Profitum (estimation)</p>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-700">HT</span>
                          <span className="font-semibold">{commissionInfo.estimation_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-700">TVA (20%)</span>
                          <span className="font-semibold">{commissionInfo.estimation_tva.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-amber-300 mt-1">
                          <span className="font-semibold text-gray-900">TTC</span>
                          <span className="text-lg font-bold text-amber-700">
                            {commissionInfo.estimation_ttc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-blue-100 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-900 font-medium">
                        ℹ️ Important
                      </p>
                      <p className="text-xs text-blue-800 mt-1">
                        Ces montants sont <strong>indicatifs</strong> et basés sur le montant estimé.<br />
                        La facture finale sera calculée sur le <strong>montant RÉEL</strong> reçu de l'administration.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline info */}
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 mb-2">📋 Prochaines étapes</h4>
                <ol className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-blue-600">1.</span>
                    <span>Vous validez l'audit et acceptez les conditions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-blue-600">2.</span>
                    <span>Votre expert soumet le dossier à l'administration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-blue-600">3.</span>
                    <span>Délai d'instruction : 6 à 12 mois</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-blue-600">4.</span>
                    <span>Réception du remboursement sur votre compte</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-blue-600">5.</span>
                    <span><strong>Génération automatique de la facture Profitum</strong></span>
                  </li>
                </ol>
              </CardContent>
            </Card>

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleValidateAudit}
                disabled={isValidating || isRejecting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validation...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accepter et valider l'audit
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowRejectDialog(true)}
                variant="outline"
                disabled={isValidating || isRejecting}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-2" />
                Refuser
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                disabled={isValidating || isRejecting}
              >
                Annuler
              </Button>
            </div>

            <p className="text-xs text-center text-gray-500 italic">
              En cliquant sur "Accepter et valider l'audit", vous confirmez avoir pris connaissance des conditions de rémunération Profitum.
            </p>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">
            Aucune information disponible
          </div>
        )}
      </DialogContent>

      {/* Dialog de refus */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <X className="w-5 h-5" />
              Refuser l'audit
            </DialogTitle>
            <DialogDescription>
              Veuillez indiquer la raison de votre refus. L'expert sera notifié et pourra proposer une nouvelle version.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reject-reason" className="text-sm font-medium">
                Raison du refus *
              </Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex: Le montant proposé est insuffisant, les conditions de commission ne sont pas acceptables..."
                className="mt-2 min-h-[100px]"
                disabled={isRejecting}
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              onClick={() => {
                setShowRejectDialog(false);
                setRejectReason('');
              }}
              variant="outline"
              disabled={isRejecting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleRejectAudit}
              disabled={isRejecting || !rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRejecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Confirmer le refus
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

