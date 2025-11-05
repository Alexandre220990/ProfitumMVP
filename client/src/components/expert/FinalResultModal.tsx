/**
 * Modal pour saisir le résultat final de l'administration
 * + Génération automatique de la facture Profitum
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileCheck, Loader2, Receipt, DollarSign, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { post } from '@/lib/api';
import { toast } from 'sonner';

interface FinalResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossierId: string;
  clientName?: string;
  montantDemande?: number;
  onResultRecorded: () => void;
}

export default function FinalResultModal({
  isOpen,
  onClose,
  dossierId,
  clientName,
  montantDemande = 0,
  onResultRecorded
}: FinalResultModalProps) {
  
  const [formData, setFormData] = useState({
    decision: 'accepte' as 'accepte' | 'partiel' | 'refuse',
    montant_reel_accorde: montantDemande,
    date_retour: new Date().toISOString().split('T')[0],
    motif_difference: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const difference = formData.montant_reel_accorde - montantDemande;
  const pourcentageEcart = montantDemande > 0 
    ? ((difference / montantDemande) * 100).toFixed(1) 
    : '0';

  const handleSubmit = async () => {
    // Validation
    if (!formData.decision || !formData.montant_reel_accorde || !formData.date_retour) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.decision === 'partiel' && Math.abs(difference) > 0 && !formData.motif_difference.trim()) {
      toast.error('Veuillez indiquer le motif de la différence de montant');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await post(`/api/expert/dossier/${dossierId}/record-final-result`, formData);

      if (response.success) {
        // Vérifier si une facture a été générée
        if (response.data?.facture) {
          toast.success(
            `✅ Résultat enregistré ! 🧾 Facture ${response.data.facture.invoice_number} générée automatiquement`,
            { duration: 6000 }
          );
        } else {
          toast.success('✅ Résultat final enregistré avec succès');
        }
        onResultRecorded();
        onClose();
        // Reset form
        setFormData({
          decision: 'accepte',
          montant_reel_accorde: montantDemande,
          date_retour: new Date().toISOString().split('T')[0],
          motif_difference: ''
        });
      } else {
        toast.error(response.message || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Erreur enregistrement résultat:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-green-600" />
            Saisir le résultat final de l'administration
          </DialogTitle>
          <DialogDescription>
            {clientName && `Dossier de ${clientName} - `}
            Enregistrez la décision de l'administration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Montant demandé (référence) */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium">Montant demandé</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {montantDemande.toLocaleString('fr-FR')} €
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          {/* Décision administration */}
          <div className="space-y-2">
            <Label htmlFor="decision">
              Décision de l'administration <span className="text-red-500">*</span>
            </Label>
            <select
              id="decision"
              className="w-full border border-gray-300 rounded-md p-2"
              value={formData.decision}
              onChange={(e) => setFormData({ ...formData, decision: e.target.value as any })}
              required
            >
              <option value="accepte">✅ Acceptée (montant total accordé)</option>
              <option value="partiel">⚠️ Partiellement acceptée (montant différent)</option>
              <option value="refuse">❌ Refusée</option>
            </select>
          </div>

          {/* Montant réel accordé */}
          <div className="space-y-2">
            <Label htmlFor="montant_reel_accorde">
              Montant réellement accordé <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="montant_reel_accorde"
                type="number"
                step="0.01"
                min="0"
                value={formData.montant_reel_accorde}
                onChange={(e) => setFormData({ ...formData, montant_reel_accorde: parseFloat(e.target.value) || 0 })}
                required
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
            </div>
            
            {/* Affichage écart */}
            {difference !== 0 && (
              <div className={`text-sm p-2 rounded-md ${
                difference > 0 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {difference > 0 ? '📈' : '📉'} Écart : {difference > 0 ? '+' : ''}{difference.toLocaleString('fr-FR')} € 
                ({difference > 0 ? '+' : ''}{pourcentageEcart}%)
              </div>
            )}
          </div>

          {/* Date de retour */}
          <div className="space-y-2">
            <Label htmlFor="date_retour">
              Date de réception du retour <span className="text-red-500">*</span>
            </Label>
            <Input
              id="date_retour"
              type="date"
              value={formData.date_retour}
              onChange={(e) => setFormData({ ...formData, date_retour: e.target.value })}
              required
            />
          </div>

          {/* Motif différence (si partiel ou refusé) */}
          {(formData.decision === 'partiel' || formData.decision === 'refuse' || Math.abs(difference) > 0) && (
            <div className="space-y-2">
              <Label htmlFor="motif_difference">
                {formData.decision === 'refuse' ? 'Motif du refus' : 'Motif de la différence'}
                {(formData.decision === 'partiel' || Math.abs(difference) > 0) && <span className="text-red-500"> *</span>}
              </Label>
              <Textarea
                id="motif_difference"
                rows={3}
                placeholder="Expliquez la raison de la différence ou du refus..."
                value={formData.motif_difference}
                onChange={(e) => setFormData({ ...formData, motif_difference: e.target.value })}
                required={formData.decision === 'partiel' || Math.abs(difference) > 0}
              />
            </div>
          )}

          {/* Info génération facture */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Receipt className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900 mb-1">
                    🧾 Génération automatique de la facture Profitum
                  </p>
                  <p className="text-xs text-amber-800">
                    En enregistrant ce résultat, une <strong>facture Profitum sera générée automatiquement</strong> basée sur le montant réel accordé.
                    Le client, l'apporteur et vous serez notifiés.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warning si refusé */}
          {formData.decision === 'refuse' && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-900 mb-1">
                      ⚠️ Demande refusée
                    </p>
                    <p className="text-xs text-red-800">
                      Le client sera notifié du refus. Aucune facture ne sera générée.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Boutons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`flex-1 ${
                formData.decision === 'accepte' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : formData.decision === 'partiel'
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4 mr-2" />
                  Enregistrer et générer la facture
                </>
              )}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isSubmitting}
            >
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

