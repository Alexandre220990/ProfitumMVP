/**
 * Modal pour marquer un dossier comme soumis à l'administration
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizonal, Loader2 } from 'lucide-react';
import { post } from '@/lib/api';
import { toast } from 'sonner';

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossierId: string;
  clientName?: string;
  onSubmitted: () => void;
}

export default function SubmissionModal({
  isOpen,
  onClose,
  dossierId,
  clientName,
  onSubmitted
}: SubmissionModalProps) {
  
  const [formData, setFormData] = useState({
    submission_date: new Date().toISOString().split('T')[0],
    reference: '',
    organisme: 'DGFIP', // Valeur par défaut
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!formData.submission_date || !formData.reference || !formData.organisme) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await post(`/api/expert/dossier/${dossierId}/mark-as-submitted`, formData);

      if (response.success) {
        toast.success('✅ Dossier marqué comme soumis !');
        onSubmitted();
        onClose();
        // Reset form
        setFormData({
          submission_date: new Date().toISOString().split('T')[0],
          reference: '',
          organisme: 'DGFIP',
          notes: ''
        });
      } else {
        toast.error(response.message || 'Erreur lors de la soumission');
      }
    } catch (error) {
      console.error('Erreur soumission:', error);
      toast.error('Erreur lors de la soumission');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SendHorizonal className="w-5 h-5 text-blue-600" />
            Marquer comme soumis à l'administration
          </DialogTitle>
          <DialogDescription>
            {clientName && `Dossier de ${clientName} - `}
            Enregistrez les informations de soumission du dossier
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date de soumission */}
          <div className="space-y-2">
            <Label htmlFor="submission_date">
              Date de soumission <span className="text-red-500">*</span>
            </Label>
            <Input
              id="submission_date"
              type="date"
              value={formData.submission_date}
              onChange={(e) => setFormData({ ...formData, submission_date: e.target.value })}
              required
            />
          </div>

          {/* Référence dossier */}
          <div className="space-y-2">
            <Label htmlFor="reference">
              Numéro de référence / dossier <span className="text-red-500">*</span>
            </Label>
            <Input
              id="reference"
              type="text"
              placeholder="Ex: 2025-FR-DFS-123456"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              required
            />
            <p className="text-xs text-gray-500">
              Référence du dossier attribuée par l'administration
            </p>
          </div>

          {/* Organisme */}
          <div className="space-y-2">
            <Label htmlFor="organisme">
              Organisme destinataire <span className="text-red-500">*</span>
            </Label>
            <select
              id="organisme"
              className="w-full border border-gray-300 rounded-md p-2"
              value={formData.organisme}
              onChange={(e) => setFormData({ ...formData, organisme: e.target.value })}
              required
            >
              <option value="DGFIP">DGFIP (Direction Générale des Finances Publiques)</option>
              <option value="DDFIP">DDFIP (Direction Départementale)</option>
              <option value="URSSAF">URSSAF</option>
              <option value="MSA">MSA</option>
              <option value="ADEME">ADEME</option>
              <option value="Autre">Autre organisme</option>
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes complémentaires (optionnel)
            </Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Informations complémentaires sur la soumission..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Info délai */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-900 font-medium mb-1">
              ℹ️ Information importante
            </p>
            <p className="text-xs text-blue-800">
              Le délai d'instruction moyen est de <strong>6 à 12 mois</strong> après soumission du dossier.
              Le client sera notifié automatiquement.
            </p>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <SendHorizonal className="w-4 h-4 mr-2" />
                  Confirmer la soumission
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

