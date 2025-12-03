import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Calendar, Plus, Trash2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { config } from '@/config/env';

interface ScheduleSequenceModalProps {
  prospectId: string;
  prospectName: string;
  prospectEmail: string;
  companyName: string | null;
  siren: string | null;
  nafCode: string | null;
  nafLabel: string | null;
  enrichmentStatus: string;
  enrichmentData: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SequenceStep {
  id: string;
  stepNumber: number;
  delayDays: number;
  subject: string;
  body: string;
}

export default function ScheduleSequenceModal({
  prospectId,
  prospectName,
  prospectEmail,
  companyName,
  siren,
  nafCode,
  nafLabel,
  enrichmentStatus,
  enrichmentData,
  open,
  onClose,
  onSuccess
}: ScheduleSequenceModalProps) {
  const [steps, setSteps] = useState<SequenceStep[]>([
    {
      id: '1',
      stepNumber: 1,
      delayDays: 0,
      subject: '',
      body: ''
    }
  ]);
  const [aiContext, setAiContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  const handleClose = () => {
    if (!isGenerating && !isScheduling) {
      setSteps([{
        id: '1',
        stepNumber: 1,
        delayDays: 0,
        subject: '',
        body: ''
      }]);
      setAiContext('');
      onClose();
    }
  };

  const addStep = () => {
    const newStepNumber = steps.length + 1;
    setSteps([
      ...steps,
      {
        id: Date.now().toString(),
        stepNumber: newStepNumber,
        delayDays: newStepNumber === 2 ? 3 : 7, // 3 jours pour la 1ère relance, 7 pour les suivantes
        subject: '',
        body: ''
      }
    ]);
  };

  const removeStep = (id: string) => {
    if (steps.length === 1) {
      toast.error('Vous devez avoir au moins un email dans la séquence');
      return;
    }
    const newSteps = steps.filter(s => s.id !== id);
    // Renumeroter les étapes
    newSteps.forEach((step, index) => {
      step.stepNumber = index + 1;
    });
    setSteps(newSteps);
  };

  const updateStep = (id: string, field: keyof SequenceStep, value: any) => {
    setSteps(steps.map(step => 
      step.id === id ? { ...step, [field]: value } : step
    ));
  };

  const generateWithAI = async () => {
    try {
      setIsGenerating(true);
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');

      // Préparer les informations du prospect
      const prospectInfo = {
        id: prospectId,
        company_name: companyName,
        siren: siren,
        firstname: prospectName.split(' ')[0],
        lastname: prospectName.split(' ').slice(1).join(' '),
        email: prospectEmail,
        naf_code: nafCode,
        naf_label: nafLabel,
        enrichment_status: enrichmentStatus,
        enrichment_data: enrichmentData
      };

      // Préparer les étapes avec leurs délais
      const stepsConfig = steps.map(step => ({
        stepNumber: step.stepNumber,
        delayDays: step.delayDays
      }));

      const response = await fetch(`${config.API_URL}/api/prospects/generate-ai-sequence-v2`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prospectInfo,
          steps: stepsConfig,
          context: aiContext.trim() || undefined,
          forceReenrichment: false
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur génération IA');
      }

      // Mettre à jour les steps avec le contenu généré
      const generatedSteps = result.data.steps || [];
      setSteps(steps.map((step, index) => ({
        ...step,
        subject: generatedSteps[index]?.subject || step.subject,
        body: generatedSteps[index]?.body || step.body
      })));

      toast.success('Séquence générée avec succès !');
    } catch (error: any) {
      console.error('Erreur génération IA:', error);
      toast.error(error.message || 'Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  const scheduleSequence = async () => {
    // Validation
    for (const step of steps) {
      if (!step.subject.trim()) {
        toast.error(`L'email ${step.stepNumber} doit avoir un objet`);
        return;
      }
      if (!step.body.trim()) {
        toast.error(`L'email ${step.stepNumber} doit avoir un message`);
        return;
      }
    }

    try {
      setIsScheduling(true);
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');

      // Calculer les dates d'envoi
      const now = new Date();
      const scheduledEmails = steps.map((step, index) => {
        const scheduledDate = new Date(now);
        
        // Calculer le délai cumulé
        let cumulativeDays = 0;
        for (let i = 0; i <= index; i++) {
          cumulativeDays += steps[i].delayDays;
        }
        
        scheduledDate.setDate(scheduledDate.getDate() + cumulativeDays);
        
        return {
          step: step.stepNumber,
          subject: step.subject.trim(),
          body: step.body.trim(),
          delay_days: step.delayDays,
          scheduled_for: scheduledDate.toISOString()
        };
      });

      const response = await fetch(`${config.API_URL}/api/prospects/${prospectId}/schedule-custom-sequence`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: prospectEmail,
          scheduled_emails: scheduledEmails
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la programmation');
      }

      toast.success(`Séquence programmée : ${steps.length} email${steps.length > 1 ? 's' : ''} planifié${steps.length > 1 ? 's' : ''} !`);
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Erreur programmation séquence:', error);
      toast.error(error.message || 'Erreur lors de la programmation');
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[90vw] lg:max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-base sm:text-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
              <span className="line-clamp-2">Programmer une séquence pour {prospectName}</span>
            </div>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm break-all">
            {companyName && <span className="block sm:inline">{companyName} {prospectEmail && '• '}</span>}
            <span className="block sm:inline">{prospectEmail}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Contexte IA */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3 sm:p-4">
            <Label className="text-xs sm:text-sm font-semibold text-purple-900 mb-2 flex items-center gap-2">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>Instructions pour l'IA (optionnel)</span>
            </Label>
            <Textarea
              value={aiContext}
              onChange={(e) => setAiContext(e.target.value)}
              placeholder="Ex: Séquence de prospection pour présenter nos solutions d'optimisation fiscale et sociale, avec un ton professionnel mais chaleureux..."
              rows={3}
              disabled={isGenerating || isScheduling}
              className="bg-white text-xs sm:text-sm"
            />
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 sm:justify-between mt-3">
              <Button
                onClick={addStep}
                variant="outline"
                size="sm"
                disabled={isGenerating || isScheduling || steps.length >= 5}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                <Plus className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">Ajouter un email</span>
              </Button>
              <Button
                onClick={generateWithAI}
                disabled={isGenerating || isScheduling || steps.length === 0}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-xs sm:text-sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin flex-shrink-0" />
                    <span className="truncate">Génération en cours...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Générer la séquence avec l'IA</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Étapes de la séquence */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
              <Label className="text-sm sm:text-base font-semibold">Emails de la séquence ({steps.length})</Label>
              {steps.length < 5 && (
                <p className="text-xs text-gray-500">Maximum 5 emails</p>
              )}
            </div>

            {steps.map((step) => (
              <div key={step.id} className="border rounded-lg p-3 sm:p-4 bg-white shadow-sm">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                    <Badge variant="outline" className="bg-purple-50 text-xs flex-shrink-0">
                      <Mail className="h-3 w-3 mr-1" />
                      Email {step.stepNumber}
                    </Badge>
                    {step.stepNumber === 1 && (
                      <Badge className="bg-green-100 text-green-800 text-xs flex-shrink-0">
                        Premier contact
                      </Badge>
                    )}
                    {step.stepNumber > 1 && (
                      <Badge className="bg-blue-100 text-blue-800 text-xs flex-shrink-0">
                        Relance
                      </Badge>
                    )}
                  </div>
                  {steps.length > 1 && (
                    <Button
                      onClick={() => removeStep(step.id)}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0 ml-2"
                      disabled={isGenerating || isScheduling}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {step.stepNumber > 1 && (
                  <div className="mb-3 sm:mb-4">
                    <Label className="text-xs sm:text-sm">Délai (jours après l'email précédent)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={step.delayDays}
                      onChange={(e) => updateStep(step.id, 'delayDays', parseInt(e.target.value) || 1)}
                      disabled={isGenerating || isScheduling}
                      className="w-full sm:w-32 mt-1 text-xs sm:text-sm"
                    />
                  </div>
                )}

                {step.stepNumber === 1 && (
                  <div className="mb-3 sm:mb-4 text-xs text-gray-600 bg-blue-50 rounded p-2">
                    📅 Cet email sera envoyé immédiatement après la programmation
                  </div>
                )}

                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <Label className="text-xs sm:text-sm">Objet *</Label>
                    <Input
                      value={step.subject}
                      onChange={(e) => updateStep(step.id, 'subject', e.target.value)}
                      placeholder="Objet de l'email"
                      disabled={isGenerating || isScheduling}
                      className="mt-1 text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs sm:text-sm">Message *</Label>
                    <Textarea
                      value={step.body}
                      onChange={(e) => updateStep(step.id, 'body', e.target.value)}
                      placeholder="Contenu de l'email (HTML supporté)"
                      rows={6}
                      disabled={isGenerating || isScheduling}
                      className="font-mono text-xs sm:text-sm mt-1 leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Résumé */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm font-semibold text-blue-900 mb-2 flex items-center gap-1">
              <span>📋</span>
              <span>Résumé de la séquence</span>
            </p>
            <ul className="text-xs text-blue-800 space-y-1 sm:space-y-1.5">
              {steps.map((step, index) => {
                const cumulativeDays = steps.slice(0, index + 1).reduce((sum, s) => sum + s.delayDays, 0);
                const scheduledDate = new Date();
                scheduledDate.setDate(scheduledDate.getDate() + cumulativeDays);
                
                return (
                  <li key={step.id} className="break-words">
                    <strong className="font-semibold">Email {step.stepNumber}</strong> : 
                    <span className="inline-block ml-1">{step.subject || '(à définir)'}</span>
                    <span className="block sm:inline sm:ml-1">— 
                    {cumulativeDays === 0 ? ' Envoi immédiat' : ` Dans ${cumulativeDays} jour${cumulativeDays > 1 ? 's' : ''}`}
                    {' '}({scheduledDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })})</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end pt-3 sm:pt-4 border-t">
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={isGenerating || isScheduling}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              Annuler
            </Button>
            <Button
              onClick={scheduleSequence}
              disabled={isGenerating || isScheduling}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm"
            >
              {isScheduling ? (
                <>
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin flex-shrink-0" />
                  <span className="truncate">Programmation en cours...</span>
                </>
              ) : (
                <>
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Programmer la séquence ({steps.length} email{steps.length > 1 ? 's' : ''})</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

