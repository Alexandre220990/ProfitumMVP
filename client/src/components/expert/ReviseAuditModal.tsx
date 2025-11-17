/**
 * Modal pour créer une nouvelle proposition d'audit après un refus client
 * Permet de modifier le montant, les commentaires et négocier la commission
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Loader2, DollarSign, Percent, Edit, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { post, get } from '@/lib/api';
import { toast } from 'sonner';

interface ReviseAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossierId: string;
  currentMontant?: number;
  currentNotes?: string;
  rejectionReason?: string;
  onSuccess: () => void;
}

interface CommissionLimits {
  min: number | null;
  max: number;
  default: number;
}

export default function ReviseAuditModal({
  isOpen,
  onClose,
  dossierId,
  currentMontant = 0,
  currentNotes = '',
  rejectionReason = '',
  onSuccess
}: ReviseAuditModalProps) {
  const [montantFinal, setMontantFinal] = useState(currentMontant);
  const [notes, setNotes] = useState(currentNotes);
  const [clientFeePercentage, setClientFeePercentage] = useState<number | null>(null);
  const [commissionLimits, setCommissionLimits] = useState<CommissionLimits | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingLimits, setLoadingLimits] = useState(false);

  // Charger les limites de commission à l'ouverture
  useEffect(() => {
    if (isOpen && dossierId) {
      loadCommissionLimits();
    }
  }, [isOpen, dossierId]);

  const loadCommissionLimits = async () => {
    setLoadingLimits(true);
    try {
      // Récupérer les infos du dossier pour obtenir les limites
      const response = await get(`/api/expert/dossier/${dossierId}`);
      if (response.success && response.data) {
        const dossier = response.data as any;
        const expertInfo = Array.isArray(dossier.Expert) ? dossier.Expert[0] : dossier.Expert;
        const defaultFee = expertInfo?.client_fee_percentage ?? 0.30;
        
        // Récupérer le minimum depuis CabinetProduitEligible si disponible
        let minFee: number | null = null;
        if (expertInfo?.cabinet_id && dossier.ProduitEligible?.id) {
          // Le minimum sera récupéré côté backend lors de la validation
          // Pour l'instant, on utilise null (sera récupéré lors de la soumission)
          minFee = null;
        }

        setCommissionLimits({
          min: minFee,
          max: defaultFee,
          default: defaultFee
        });

        // Initialiser avec le default
        setClientFeePercentage(defaultFee * 100);
      }
    } catch (error) {
      console.error('Erreur chargement limites commission:', error);
    } finally {
      setLoadingLimits(false);
    }
  };

  const handleSubmit = async () => {
    if (!montantFinal || montantFinal <= 0) {
      toast.error('Le montant final est requis');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        montant_final: montantFinal,
        notes: notes.trim() || undefined
      };

      // Ajouter la commission négociée si différente du default
      if (clientFeePercentage !== null && commissionLimits) {
        const negotiatedDecimal = clientFeePercentage / 100;
        if (negotiatedDecimal !== commissionLimits.default) {
          payload.client_fee_percentage = negotiatedDecimal;
        }
      }

      const response = await post(`/api/expert/dossier/${dossierId}/update-audit`, payload);

      if (response.success) {
        toast.success('✅ Nouvelle proposition créée avec succès !');
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Erreur lors de la création de la nouvelle proposition');
      }
    } catch (error: any) {
      console.error('Erreur création nouvelle proposition:', error);
      toast.error(error.message || 'Erreur lors de la création');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeeChange = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setClientFeePercentage(null);
      return;
    }

    if (numValue < 0 || numValue > 100) {
      toast.error('Le pourcentage doit être entre 0 et 100%');
      return;
    }

    if (commissionLimits) {
      const decimalValue = numValue / 100;
      if (commissionLimits.min !== null && decimalValue < commissionLimits.min) {
        toast.error(`Le minimum autorisé est ${(commissionLimits.min * 100).toFixed(1)}%`);
        return;
      }
      if (decimalValue > commissionLimits.max) {
        toast.error(`Le maximum autorisé est ${(commissionLimits.max * 100).toFixed(1)}%`);
        return;
      }
    }

    setClientFeePercentage(numValue);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-blue-600" />
            Nouvelle proposition d'audit
          </DialogTitle>
          <DialogDescription>
            Modifiez le montant, les commentaires et négociez la commission si nécessaire
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Raison du refus */}
          {rejectionReason && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-900 mb-1">Raison du refus précédent :</p>
                    <p className="text-sm text-red-800">{rejectionReason}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Montant final */}
          <div>
            <Label htmlFor="montant-final" className="text-sm font-medium">
              Montant final (€) *
            </Label>
            <div className="relative mt-2">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="montant-final"
                type="number"
                min="0"
                step="0.01"
                value={montantFinal || ''}
                onChange={(e) => setMontantFinal(parseFloat(e.target.value) || 0)}
                className="pl-10"
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Commission négociée */}
          {!loadingLimits && commissionLimits && (
            <div>
              <Label htmlFor="commission" className="text-sm font-medium">
                Commission client (%)
                {commissionLimits.min !== null && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Min: {(commissionLimits.min * 100).toFixed(1)}%, Max: {(commissionLimits.max * 100).toFixed(1)}%)
                  </span>
                )}
                {commissionLimits.min === null && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Max: {(commissionLimits.max * 100).toFixed(1)}% - Négociation non autorisée)
                  </span>
                )}
              </Label>
              <div className="relative mt-2">
                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="commission"
                  type="number"
                  min={commissionLimits.min !== null ? commissionLimits.min * 100 : commissionLimits.max * 100}
                  max={commissionLimits.max * 100}
                  step="0.1"
                  value={clientFeePercentage !== null ? clientFeePercentage : commissionLimits.default * 100}
                  onChange={(e) => handleFeeChange(e.target.value)}
                  className="pl-10"
                  placeholder={`${(commissionLimits.default * 100).toFixed(1)}`}
                  disabled={isSubmitting || commissionLimits.min === null}
                />
              </div>
              {commissionLimits.min === null && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Aucun minimum défini par le propriétaire du cabinet. Vous devez utiliser le maximum.
                </p>
              )}
              {commissionLimits.min !== null && (
                <p className="text-xs text-gray-500 mt-1">
                  Vous pouvez négocier entre {(commissionLimits.min * 100).toFixed(1)}% et {(commissionLimits.max * 100).toFixed(1)}%
                </p>
              )}
            </div>
          )}

          {loadingLimits && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          )}

          {/* Commentaires */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium">
              Commentaires / Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2 min-h-[100px]"
              placeholder="Ajoutez des commentaires sur cette nouvelle proposition..."
              disabled={isSubmitting}
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !montantFinal || montantFinal <= 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Créer la nouvelle proposition
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

