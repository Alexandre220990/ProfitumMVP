/**
 * Composant d'affichage de facture Profitum + confirmation de réception remboursement
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Receipt, Download, CheckCircle, Loader2, DollarSign, Banknote, CreditCard, Shield } from 'lucide-react';
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
  showPaymentOptions?: boolean;
  ribDetails?: {
    iban: string;
    bic: string;
    holder: string;
    bank: string;
  };
}

export default function InvoiceDisplay({
  invoice,
  dossierId,
  onPaymentConfirmed,
  showConfirmPayment = true,
  showPaymentOptions = true,
  ribDetails = {
    iban: 'FR76 3000 4000 5000 6000 7000 189',
    bic: 'BNPAFRPP',
    holder: 'SAS PROFITUM',
    bank: 'BNP PARIBAS - Agence Paris Centrale'
  }
}: InvoiceDisplayProps) {
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [formData, setFormData] = useState({
    date_reception: new Date().toISOString().split('T')[0],
    montant_reel: invoice.amount
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBankTransferModal, setShowBankTransferModal] = useState(false);
  const [showOnlinePaymentModal, setShowOnlinePaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [onlinePaymentData, setOnlinePaymentData] = useState({
    cardholder: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  const montantHT = invoice.amount;
  const tva = invoice.metadata?.tva || (montantHT * 0.20);
  const montantTTC = invoice.metadata?.montant_ttc || (montantHT + tva);
  const amountToPay = montantTTC;

  const handleDownloadPDF = () => {
    // TODO: Implémenter téléchargement PDF une fois generatePDF() fait
    toast.info('Génération PDF en cours de développement');
  };

  const handleInitiatePayment = async (mode: 'virement' | 'en_ligne') => {
    setIsProcessingPayment(true);
    try {
      const response = await post(`/api/client/dossier/${dossierId}/confirm-payment-received`, {
        action: 'initiate',
        montant: amountToPay,
        mode
      });

      if (response.success) {
        toast.success(
          mode === 'virement'
            ? '✅ Virement initié ! Nous attendons la confirmation.'
            : '✅ Paiement en ligne validé !'
        );
        setShowBankTransferModal(false);
        setShowOnlinePaymentModal(false);
        setOnlinePaymentData({ cardholder: '', cardNumber: '', expiry: '', cvv: '' });
        if (onPaymentConfirmed) {
          onPaymentConfirmed();
        }
      } else {
        toast.error(response.message || 'Erreur lors de l’initiation du paiement');
      }
    } catch (error) {
      console.error('Erreur initiation paiement:', error);
      toast.error('Erreur lors de l’initiation du paiement');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!formData.date_reception || !formData.montant_reel) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await post(`/api/client/dossier/${dossierId}/confirm-payment-received`, {
        action: 'confirm',
        montant: formData.montant_reel,
        paiement_date: formData.date_reception
      });

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

          {showPaymentOptions && invoice.status !== 'paid' && (
            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium text-gray-800">
                Choisissez votre mode de paiement :
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <Button
                  variant="outline"
                  className="w-full h-full border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900"
                  onClick={() => {
                    setShowBankTransferModal(true);
                  }}
                >
                  <Banknote className="w-4 h-4 mr-2" />
                  Payer par virement bancaire
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-full border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900"
                  onClick={() => {
                    setShowOnlinePaymentModal(true);
                  }}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Payer en ligne (simulation)
                </Button>
              </div>
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

      {/* Modal virement bancaire */}
      <Dialog open={showBankTransferModal} onOpenChange={setShowBankTransferModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-blue-600" />
              Détails pour virement bancaire
            </DialogTitle>
            <DialogDescription>
              Utilisez les informations ci-dessous pour effectuer votre virement SEPA.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2 text-sm text-blue-900">
              <div className="flex justify-between">
                <span className="font-medium">Titulaire</span>
                <span>{ribDetails.holder}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Banque</span>
                <span>{ribDetails.bank}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">IBAN</span>
                <span className="font-mono">{ribDetails.iban}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">BIC</span>
                <span className="font-mono">{ribDetails.bic}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Montant</span>
                <span className="font-semibold">{amountToPay.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
              </div>
              <div className="text-xs">
                Merci d'indiquer la référence <strong>{invoice.invoice_number}</strong> dans le libellé du virement.
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
              Le traitement d'un virement peut prendre 24 à 48h. Vous serez notifié dès que le paiement sera enregistré.
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => handleInitiatePayment('virement')}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validation...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    J'ai initié le virement
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowBankTransferModal(false)}
                disabled={isProcessingPayment}
              >
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal paiement en ligne (simulation) */}
      <Dialog open={showOnlinePaymentModal} onOpenChange={setShowOnlinePaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-600" />
              Paiement en ligne (simulation)
            </DialogTitle>
            <DialogDescription>
              Saisissez les informations de votre carte pour simuler un paiement sécurisé.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-900">
              Montant à régler : <strong>{amountToPay.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</strong>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="cardholder">Titulaire de la carte</Label>
                <Input
                  id="cardholder"
                  value={onlinePaymentData.cardholder}
                  onChange={(e) =>
                    setOnlinePaymentData(prev => ({ ...prev, cardholder: e.target.value }))
                  }
                  placeholder="Ex: Jean Dupont"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Numéro de carte</Label>
                <Input
                  id="cardNumber"
                  value={onlinePaymentData.cardNumber}
                  onChange={(e) =>
                    setOnlinePaymentData(prev => ({ ...prev, cardNumber: e.target.value }))
                  }
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiration</Label>
                  <Input
                    id="expiry"
                    value={onlinePaymentData.expiry}
                    onChange={(e) =>
                      setOnlinePaymentData(prev => ({ ...prev, expiry: e.target.value }))
                    }
                    placeholder="MM/AA"
                    maxLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    value={onlinePaymentData.cvv}
                    onChange={(e) =>
                      setOnlinePaymentData(prev => ({ ...prev, cvv: e.target.value }))
                    }
                    placeholder="123"
                    maxLength={3}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                onClick={() => handleInitiatePayment('en_ligne')}
                disabled={isProcessingPayment || !onlinePaymentData.cardholder || !onlinePaymentData.cardNumber || !onlinePaymentData.expiry || !onlinePaymentData.cvv}
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Valider le paiement
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowOnlinePaymentModal(false)}
                disabled={isProcessingPayment}
              >
                Fermer
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Simulation : aucune donnée bancaire n'est transmise. Cette étape permet d'avancer le workflow.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

