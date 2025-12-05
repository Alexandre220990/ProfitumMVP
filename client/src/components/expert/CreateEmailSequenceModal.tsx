import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Plus, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { post } from '@/lib/api';

interface EmailStep {
  step_number: number;
  delay_days: number;
  subject: string;
  expert_message: string;
}

interface CreateEmailSequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName?: string;
  clientCompany?: string;
  clientProduitId?: string;
  produitName?: string;
  onSequenceCreated?: () => void;
}

export default function CreateEmailSequenceModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  clientCompany,
  clientProduitId,
  produitName,
  onSequenceCreated
}: CreateEmailSequenceModalProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [steps, setSteps] = useState<EmailStep[]>([
    {
      step_number: 1,
      delay_days: 0,
      subject: produitName ? `Prise en charge de votre demande - ${produitName}` : 'Prise en charge de votre demande',
      expert_message: ''
    }
  ]);

  // Initialiser la date de début (aujourd'hui)
  useEffect(() => {
    if (isOpen && !startDate) {
      const today = new Date();
      today.setHours(9, 0, 0, 0); // 9h du matin
      setStartDate(today.toISOString().slice(0, 16));
    }
  }, [isOpen, startDate]);

  const addStep = () => {
    const newStepNumber = steps.length + 1;
    setSteps([
      ...steps,
      {
        step_number: newStepNumber,
        delay_days: 3, // Délai par défaut de 3 jours
        subject: `Relance ${newStepNumber} - ${produitName || 'Votre demande'}`,
        expert_message: ''
      }
    ]);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) {
      toast.error('Vous devez avoir au moins un email dans la séquence');
      return;
    }
    const newSteps = steps.filter((_, i) => i !== index);
    // Réindexer les step_number
    newSteps.forEach((step, i) => {
      step.step_number = i + 1;
    });
    setSteps(newSteps);
  };

  const updateStep = (index: number, field: keyof EmailStep, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = {
      ...newSteps[index],
      [field]: value
    };
    setSteps(newSteps);
  };

  const handleCreate = async () => {
    // Validation
    if (!startDate) {
      toast.error('Veuillez sélectionner une date de début');
      return;
    }

    if (steps.some(step => !step.subject.trim() || !step.expert_message.trim())) {
      toast.error('Veuillez remplir le sujet et le message pour tous les emails');
      return;
    }

    try {
      setLoading(true);

      const response = await post(`/api/expert/clients/${clientId}/create-sequence`, {
        name: name.trim() || undefined,
        start_date: new Date(startDate).toISOString(),
        client_produit_id: clientProduitId || undefined,
        steps: steps.map(step => ({
          step_number: step.step_number,
          delay_days: step.delay_days,
          subject: step.subject.trim(),
          expert_message: step.expert_message.trim()
        }))
      });

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la création');
      }

      toast.success(`Séquence créée avec ${steps.length} email(s) programmé(s)`);
      
      // Reset form
      setName('');
      setStartDate('');
      setSteps([{
        step_number: 1,
        delay_days: 0,
        subject: produitName ? `Prise en charge de votre demande - ${produitName}` : 'Prise en charge de votre demande',
        expert_message: ''
      }]);
      
      onSequenceCreated?.();
      onClose();
    } catch (error: any) {
      console.error('Erreur création séquence:', error);
      toast.error(error.message || 'Erreur lors de la création de la séquence');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Créer une séquence d'emails
          </DialogTitle>
          <DialogDescription>
            {clientName && (
              <span className="block mt-2 font-semibold text-gray-700">
                Client: {clientName} {clientCompany && `(${clientCompany})`}
                {produitName && (
                  <span className="block text-sm font-normal text-gray-500 mt-1">
                    Produit: {produitName}
                  </span>
                )}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nom de la séquence */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la séquence (optionnel)</Label>
            <Input
              id="name"
              placeholder="Ex: Séquence de suivi TICPE"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Date de début */}
          <div className="space-y-2">
            <Label htmlFor="start-date">Date de début *</Label>
            <Input
              id="start-date"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* Liste des emails */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Emails de la séquence</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addStep}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un email
              </Button>
            </div>

            {steps.map((step, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Email {step.step_number}</Badge>
                    {index === 0 && (
                      <span className="text-xs text-gray-500">(Envoi immédiat)</span>
                    )}
                    {index > 0 && (
                      <span className="text-xs text-gray-500">
                        (+ {step.delay_days} jour{step.delay_days > 1 ? 's' : ''} après l'email précédent)
                      </span>
                    )}
                  </div>
                  {steps.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStep(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>

                {index > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor={`delay-${index}`}>Délai (jours) *</Label>
                    <Input
                      id={`delay-${index}`}
                      type="number"
                      min="1"
                      value={step.delay_days}
                      onChange={(e) => updateStep(index, 'delay_days', parseInt(e.target.value) || 1)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor={`subject-${index}`}>Sujet *</Label>
                  <Input
                    id={`subject-${index}`}
                    placeholder="Ex: Prise en charge de votre demande"
                    value={step.subject}
                    onChange={(e) => updateStep(index, 'subject', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`message-${index}`}>Votre message *</Label>
                  <Textarea
                    id={`message-${index}`}
                    placeholder="Rédigez votre message personnalisé..."
                    value={step.expert_message}
                    onChange={(e) => updateStep(index, 'expert_message', e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading || !startDate || steps.some(s => !s.subject.trim() || !s.expert_message.trim())}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Créer la séquence
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
