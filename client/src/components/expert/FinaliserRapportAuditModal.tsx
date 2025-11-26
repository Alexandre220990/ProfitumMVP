/**
 * Modal pour finaliser le rapport d'audit
 * Permet de saisir le montant final, le rapport détaillé, négocier la commission et joindre des documents
 */

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, DollarSign, Percent, FileCheck, Upload, X, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { post, get } from '@/lib/api';
import { toast } from 'sonner';

interface FinaliserRapportAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossierId: string;
  currentMontant?: number;
  onSuccess: () => void;
}

interface CommissionLimits {
  min: number | null;
  max: number;
  default: number;
}

interface UploadedDocument {
  id: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  description?: string;
}

export default function FinaliserRapportAuditModal({
  isOpen,
  onClose,
  dossierId,
  currentMontant = 0,
  onSuccess
}: FinaliserRapportAuditModalProps) {
  const [montantFinal, setMontantFinal] = useState(currentMontant);
  const [rapportDetaille, setRapportDetaille] = useState('');
  const [notes, setNotes] = useState('');
  const [clientFeePercentage, setClientFeePercentage] = useState<number | null>(null);
  const [commissionLimits, setCommissionLimits] = useState<CommissionLimits | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingLimits, setLoadingLimits] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger les limites de commission à l'ouverture
  useEffect(() => {
    if (isOpen && dossierId) {
      loadCommissionLimits();
      // Réinitialiser les champs
      setMontantFinal(currentMontant);
      setRapportDetaille('');
      setNotes('');
      setUploadedDocuments([]);
    }
  }, [isOpen, dossierId, currentMontant]);

  const loadCommissionLimits = async () => {
    setLoadingLimits(true);
    try {
      const response = await get(`/api/expert/dossier/${dossierId}`);
      if (response.success && response.data) {
        const dossier = response.data as any;
        const expertInfo = Array.isArray(dossier.Expert) ? dossier.Expert[0] : dossier.Expert;
        const defaultFee = expertInfo?.client_fee_percentage ?? 0.30;
        
        setCommissionLimits({
          min: null, // Sera récupéré côté backend
          max: defaultFee,
          default: defaultFee
        });

        setClientFeePercentage(defaultFee * 100);
      }
    } catch (error) {
      console.error('Erreur chargement limites commission:', error);
    } finally {
      setLoadingLimits(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingDocuments(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('dossier_id', dossierId);
        formData.append('category', 'audit_rapport');

        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });

        const result = await response.json();
        if (result.success) {
          return {
            id: result.data?.id || `temp-${Date.now()}-${Math.random()}`,
            file_name: file.name,
            file_url: result.url || result.data?.url,
            file_size: file.size,
            description: ''
          };
        } else {
          throw new Error(result.message || 'Erreur upload');
        }
      });

      const uploaded = await Promise.all(uploadPromises);
      setUploadedDocuments(prev => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} document(s) uploadé(s) avec succès`);
    } catch (error: any) {
      console.error('Erreur upload documents:', error);
      toast.error(error.message || 'Erreur lors de l\'upload des documents');
    } finally {
      setUploadingDocuments(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeDocument = (index: number) => {
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!montantFinal || montantFinal <= 0) {
      toast.error('Le montant final est requis');
      return;
    }

    if (!rapportDetaille.trim()) {
      toast.error('Le rapport d\'audit détaillé est requis');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        montant_final: montantFinal,
        rapport_detaille: rapportDetaille.trim(),
        notes: notes.trim() || undefined
      };

      // Ajouter la commission négociée si différente du default
      if (clientFeePercentage !== null && commissionLimits) {
        const negotiatedDecimal = clientFeePercentage / 100;
        if (negotiatedDecimal !== commissionLimits.default) {
          payload.client_fee_percentage = negotiatedDecimal;
        }
      }

      // Ajouter les documents uploadés
      if (uploadedDocuments.length > 0) {
        payload.audit_documents = uploadedDocuments.map(doc => ({
          file_name: doc.file_name,
          file_url: doc.file_url,
          file_size: doc.file_size,
          description: doc.description
        }));
      }

      const response = await post(`/api/expert/dossier/${dossierId}/complete-audit`, payload);

      if (response.success) {
        toast.success('✅ Rapport d\'audit finalisé avec succès !');
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Erreur lors de la finalisation du rapport');
      }
    } catch (error: any) {
      console.error('Erreur finalisation rapport:', error);
      toast.error(error.message || 'Erreur lors de la finalisation');
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-600" />
            Finaliser le rapport d'audit
          </DialogTitle>
          <DialogDescription>
            Saisissez le montant final, rédigez le rapport détaillé et joignez les documents nécessaires
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
            <p className="text-xs text-gray-500 mt-1">
              Montant récupérable pour le client après audit technique
            </p>
          </div>

          {/* Rapport d'audit détaillé */}
          <div>
            <Label htmlFor="rapport-detaille" className="text-sm font-medium">
              Rapport d'audit détaillé *
            </Label>
            <Textarea
              id="rapport-detaille"
              value={rapportDetaille}
              onChange={(e) => setRapportDetaille(e.target.value)}
              className="mt-2 min-h-[200px]"
              placeholder="Rédigez votre rapport d'audit détaillé. Ce rapport sera transmis au client et visible par l'admin..."
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              Ce rapport est un élément important transmis au client et visible par l'admin
            </p>
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

          {/* Notes (distinctes du rapport) */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes internes (optionnel)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2 min-h-[100px]"
              placeholder="Notes internes (non visibles par le client)..."
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              Ces notes sont distinctes du rapport d'audit et ne seront pas transmises au client
            </p>
          </div>

          {/* Upload de documents */}
          <div>
            <Label className="text-sm font-medium">
              Documents du rapport (optionnel)
            </Label>
            <div className="mt-2 space-y-3">
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                  disabled={isSubmitting || uploadingDocuments}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting || uploadingDocuments}
                  className="flex items-center gap-2"
                >
                  {uploadingDocuments ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Upload en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Joindre des documents
                    </>
                  )}
                </Button>
              </div>

              {/* Liste des documents uploadés */}
              {uploadedDocuments.length > 0 && (
                <div className="space-y-2">
                  {uploadedDocuments.map((doc, index) => (
                    <Card key={doc.id} className="p-3">
                      <CardContent className="p-0 flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {doc.file_name}
                            </p>
                            {doc.file_size && (
                              <p className="text-xs text-gray-500">
                                {(doc.file_size / 1024).toFixed(2)} KB
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument(index)}
                          disabled={isSubmitting}
                          className="ml-2"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Documents spécifiques au rapport d'audit (analyses, justificatifs, etc.)
            </p>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !montantFinal || montantFinal <= 0 || !rapportDetaille.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Finalisation...
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4 mr-2" />
                  Finaliser le rapport
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

