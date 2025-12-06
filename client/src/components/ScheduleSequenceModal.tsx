import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Calendar, Plus, Trash2, Mail, Eye, Code, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { config } from '@/config/env';
import { getSupabaseToken } from '@/lib/auth-helpers';

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
  const [previewMode, setPreviewMode] = useState<Record<string, boolean>>({});

  const togglePreview = (stepId: string) => {
    setPreviewMode(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

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
      const token = await getSupabaseToken();

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
      const token = await getSupabaseToken();

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
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[90vw] lg:max-w-6xl xl:max-w-7xl max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
          <DialogTitle className="flex items-center gap-3 text-xl lg:text-2xl">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">Programmer une séquence d'emails</div>
              <DialogDescription className="mt-1.5 text-sm text-gray-600 font-normal">
                {prospectName && (
                  <>
                    <span className="font-medium">{prospectName}</span>
                    {companyName && <span className="mx-2">•</span>}
                  </>
                )}
                {companyName && <span>{companyName}</span>}
                {prospectEmail && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="text-gray-500">{prospectEmail}</span>
                  </>
                )}
              </DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Contexte IA */}
          <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 border-2 border-purple-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-md">
                <Sparkles className="h-4 w-4" />
              </div>
              <Label className="text-base font-semibold text-purple-900">
                Instructions pour l'IA (optionnel)
              </Label>
            </div>
            <Textarea
              value={aiContext}
              onChange={(e) => setAiContext(e.target.value)}
              placeholder="Ex: Séquence de prospection pour présenter nos solutions d'optimisation fiscale et sociale, avec un ton professionnel mais chaleureux..."
              rows={3}
              disabled={isGenerating || isScheduling}
              className="bg-white text-sm border-gray-300 focus:border-purple-400 focus:ring-purple-400 rounded-lg resize-none"
            />
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 mt-4">
              <Button
                onClick={addStep}
                variant="outline"
                size="default"
                disabled={isGenerating || isScheduling || steps.length >= 5}
                className="lg:w-auto border-gray-300 hover:bg-gray-50 hover:border-gray-400"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span>Ajouter un email</span>
              </Button>
              <Button
                onClick={generateWithAI}
                disabled={isGenerating || isScheduling || steps.length === 0}
                className="lg:flex-1 lg:max-w-xs bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span>Génération en cours...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    <span>Générer la séquence avec l'IA</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Étapes de la séquence */}
          <div className="space-y-4 lg:space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-gray-200">
              <Label className="text-lg font-bold text-gray-900">
                Emails de la séquence 
                <span className="ml-2 text-purple-600">({steps.length})</span>
              </Label>
              {steps.length < 5 && (
                <p className="text-sm text-gray-500">Maximum 5 emails</p>
              )}
            </div>

            <div className="grid gap-4 lg:gap-5">
              {steps.map((step, index) => (
                <div key={step.id} className="border-2 rounded-xl p-5 lg:p-6 bg-white shadow-md hover:shadow-lg transition-shadow border-gray-200">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                      <Badge variant="outline" className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-300 text-purple-700 px-3 py-1 text-sm font-medium">
                        <Mail className="h-3.5 w-3.5 mr-1.5" />
                        Email {step.stepNumber}
                      </Badge>
                      {step.stepNumber === 1 && (
                        <Badge className="bg-green-500 text-white px-3 py-1 text-sm font-medium shadow-sm">
                          Premier contact
                        </Badge>
                      )}
                      {step.stepNumber > 1 && (
                        <Badge className="bg-blue-500 text-white px-3 py-1 text-sm font-medium shadow-sm">
                          Relance {step.stepNumber - 1}
                        </Badge>
                      )}
                    </div>
                    {steps.length > 1 && (
                      <Button
                        onClick={() => removeStep(step.id)}
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        disabled={isGenerating || isScheduling}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {step.stepNumber > 1 && (
                    <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <Label className="text-sm font-semibold text-blue-900 mb-2 block">
                        Délai après l'email précédent
                      </Label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          min="1"
                          max="30"
                          value={step.delayDays}
                          onChange={(e) => updateStep(step.id, 'delayDays', parseInt(e.target.value) || 1)}
                          disabled={isGenerating || isScheduling}
                          className="w-24 text-sm border-gray-300 focus:border-blue-400 focus:ring-blue-400"
                        />
                        <span className="text-sm text-gray-600">jour{step.delayDays > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  )}

                  {step.stepNumber === 1 && (
                    <div className="mb-5 text-sm text-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="font-medium">Cet email sera envoyé immédiatement après la programmation</span>
                    </div>
                  )}

                  <div className="space-y-5">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Objet de l'email *
                      </Label>
                      <Input
                        value={step.subject}
                        onChange={(e) => updateStep(step.id, 'subject', e.target.value)}
                        placeholder="Ex: Découvrez nos solutions d'optimisation fiscale"
                        disabled={isGenerating || isScheduling}
                        className="text-sm border-gray-300 focus:border-purple-400 focus:ring-purple-400 h-11"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-semibold text-gray-700">
                          Message de l'email *
                        </Label>
                        {step.body && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePreview(step.id)}
                            className="h-8 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          >
                            {previewMode[step.id] ? (
                              <>
                                <Code className="h-3.5 w-3.5 mr-1.5" />
                                Éditer le code
                              </>
                            ) : (
                              <>
                                <Eye className="h-3.5 w-3.5 mr-1.5" />
                                Prévisualiser
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      {previewMode[step.id] && step.body ? (
                        <div className="border-2 border-gray-200 rounded-lg p-5 bg-gray-50 min-h-[200px] max-h-[400px] overflow-y-auto shadow-inner">
                          <div 
                            className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: step.body }}
                          />
                        </div>
                      ) : (
                        <Textarea
                          value={step.body}
                          onChange={(e) => updateStep(step.id, 'body', e.target.value)}
                          placeholder="Contenu de l'email (HTML supporté)..."
                          rows={8}
                          disabled={isGenerating || isScheduling}
                          className="font-mono text-sm leading-relaxed border-gray-300 focus:border-purple-400 focus:ring-purple-400 resize-none"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Résumé */}
          <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500 text-white shadow-md">
                <span className="text-lg">📋</span>
              </div>
              <p className="text-base font-bold text-blue-900">
                Résumé de la séquence
              </p>
            </div>
            <ul className="space-y-3">
              {steps.map((step, index) => {
                const cumulativeDays = steps.slice(0, index + 1).reduce((sum, s) => sum + s.delayDays, 0);
                const scheduledDate = new Date();
                scheduledDate.setDate(scheduledDate.getDate() + cumulativeDays);
                
                return (
                  <li key={step.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100 shadow-sm">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm font-bold flex-shrink-0 mt-0.5">
                      {step.stepNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <strong className="font-semibold text-gray-900 block mb-1">
                            {step.subject || '(Objet à définir)'}
                          </strong>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            {cumulativeDays === 0 ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                                <Calendar className="h-3.5 w-3.5" />
                                Envoi immédiat
                              </span>
                            ) : (
                              <>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                                  <Clock className="h-3.5 w-3.5" />
                                  Dans {cumulativeDays} jour{cumulativeDays > 1 ? 's' : ''}
                                </span>
                                <span className="text-gray-500">
                                  ({scheduledDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'short' })})
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end px-6 py-4 border-t bg-gray-50 rounded-b-lg">
          <Button
            onClick={handleClose}
            variant="outline"
            disabled={isGenerating || isScheduling}
            className="w-full sm:w-auto border-gray-300 hover:bg-gray-100"
          >
            Annuler
          </Button>
          <Button
            onClick={scheduleSequence}
            disabled={isGenerating || isScheduling}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all px-6"
          >
            {isScheduling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span>Programmation en cours...</span>
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                <span>Programmer la séquence ({steps.length} email{steps.length > 1 ? 's' : ''})</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

