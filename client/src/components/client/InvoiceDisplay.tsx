/**
 * Composant d'affichage de facture Profitum + confirmation de réception remboursement
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Receipt, Download, CheckCircle, Loader2, DollarSign } from 'lucide-react';
import { post } from '@/lib/api';
import { toast } from 'sonner';

interface InvoiceData {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  issue_date: string;
  due_date: string;
  montant_audit: number;
  taux_compensation_expert: number;
  pdf_storage_path?: string;
  metadata?: {
    montant_ttc?: number;
    tva?: number;
    commission_apporteur?: number;
  };
}

interface InvoiceDisplayProps {
  invoice: InvoiceData;
  dossierId: string;
  onPaymentConfirmed?: () => void;
  showConfirmPayment?: boolean;
}

export default function InvoiceDisplay({
  invoice,
  dossierId,
  onPaymentConfirmed,
  showConfirmPayment = true
}: InvoiceDisplayProps) {
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [formData, setFormData] = useState({
    date_reception: new Date().toISOString().split('T')[0],
    montant_reel: invoice.montant_audit
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const montantHT = invoice.amount;
  const tva = invoice.metadata?.tva || (montantHT * 0.20);
  const montantTTC = invoice.metadata?.montant_ttc || (montantHT + tva);

  const handleDownloadPDF = () => {
    // TODO: Implémenter téléchargement PDF une fois generatePDF() fait
    toast.info('Génération PDF en cours de développement');
  };

  const handleConfirmPayment = async () => {
    if (!formData.date_reception || !formData.montant_reel) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await post(`/api/client/dossier/${dossierId}/confirm-payment-received`, formData);

      if (response.success) {
        toast.success('🎉 Remboursement confirmé ! Dossier finalisé avec succès.');
        setShowConfirmModal(false);
        if (onPaymentConfirmed) {
          onPaymentConfirmed();
        }
      } else {
        toast.error(response.message || 'Erreur lors de la confirmation');
      }
    } catch (error) {
      console.error('Erreur confirmation paiement:', error);
      toast.error('Erreur lors de la confirmation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
        <CardContent className="p-6 space-y-4">
          {/* En-tête facture */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Receipt className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Facture Profitum
                </h3>
                <p className="text-sm text-gray-600">
                  {invoice.invoice_number}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={!invoice.pdf_storage_path}
            >
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>

          {/* Détails montants */}
          <div className="bg-white rounded-lg p-4 space-y-2 border border-amber-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Montant remboursement</span>
              <span className="font-medium text-gray-900">
                {invoice.montant_audit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Commission Profitum HT ({(invoice.taux_compensation_expert * 100).toFixed(0)}%)</span>
              <span className="font-medium text-gray-900">
                {montantHT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">TVA (20%)</span>
              <span className="font-medium text-gray-900">
                {tva.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </span>
            </div>
            <div className="h-px bg-amber-200 my-2" />
            <div className="flex justify-between">
              <span className="font-semibold text-gray-900">Total TTC</span>
              <span className="text-xl font-bold text-amber-700">
                {montantTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </span>
            </div>
          </div>

          {/* Dates */}
          <div className="flex justify-between text-xs text-gray-600">
            <span>Émise le {new Date(invoice.issue_date).toLocaleDateString('fr-FR')}</span>
            <span>Échéance : {new Date(invoice.due_date).toLocaleDateString('fr-FR')}</span>
          </div>

          {/* Bouton confirmation paiement */}
          {showConfirmPayment && invoice.status !== 'paid' && (
            <div className="pt-2">
              <Button
                onClick={() => setShowConfirmModal(true)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmer la réception du remboursement
              </Button>
            </div>
          )}

          {/* Statut payé */}
          {invoice.status === 'paid' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="text-sm font-medium text-green-900">
                ✅ Remboursement confirmé
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal confirmation paiement */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Confirmer la réception du remboursement
            </DialogTitle>
            <DialogDescription>
              Confirmez que vous avez bien reçu le remboursement de l'administration
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date_reception">
                Date de réception <span className="text-red-500">*</span>
              </Label>
              <Input
                id="date_reception"
                type="date"
                value={formData.date_reception}
                onChange={(e) => setFormData({ ...formData, date_reception: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="montant_reel">
                Montant réellement reçu <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="montant_reel"
                  type="number"
                  step="0.01"
                  value={formData.montant_reel}
                  onChange={(e) => setFormData({ ...formData, montant_reel: parseFloat(e.target.value) })}
                  required
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                ℹ️ En confirmant, vous déclarez avoir reçu le remboursement de l'administration.
                Votre dossier sera marqué comme <strong>complété</strong>.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleConfirmPayment}
                disabled={isSubmitting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Confirmation...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirmer la réception
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowConfirmModal(false)}
                variant="outline"
                disabled={isSubmitting}
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

