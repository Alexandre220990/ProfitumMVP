import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { config } from "@/config/env";
import { toast } from "sonner";
import { getSupabaseToken } from '@/lib/auth-helpers';
import {
  X,
  Sparkles,
  Send,
  Plus,
  Trash2,
  Loader2,
  Clock
} from "lucide-react";

interface EmailStep {
  stepNumber: number;
  delayDays: number;
  subject: string;
  body: string;
}

interface ReplyEmailModalProps {
  prospectId: string;
  prospectName: string;
  prospectEmail: string;
  emailReceivedId: string;
  emailReceivedContent: string;
  sentEmailsHistory: Array<{
    subject: string;
    body: string;
    sent_at: string;
  }>;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReplyEmailModal({
  prospectId,
  prospectName,
  prospectEmail,
  emailReceivedId,
  emailReceivedContent,
  sentEmailsHistory,
  onClose,
  onSuccess
}: ReplyEmailModalProps) {
  const [steps, setSteps] = useState<EmailStep[]>([
    {
      stepNumber: 1,
      delayDays: 0, // Réponse immédiate
      subject: `RE: ${sentEmailsHistory[0]?.subject || 'Votre demande'}`,
      body: ''
    }
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Générer la réponse avec IA
  const generateAIReply = async () => {
    if (!steps[0].subject) {
      toast.error('Veuillez renseigner un objet');
      return;
    }

    try {
      setIsGenerating(true);
      const token = await getSupabaseToken();

      // Construire le contexte pour l'IA
      const context = {
        prospect_name: prospectName,
        prospect_email: prospectEmail,
        sent_emails_history: sentEmailsHistory.map(e => ({
          subject: e.subject,
          body: e.body,
          sent_at: e.sent_at
        })),
        received_email: emailReceivedContent,
        num_steps: steps.length,
        steps: steps.map(s => ({
          step_number: s.stepNumber,
          delay_days: s.delayDays,
          subject: s.subject
        }))
      };

      const response = await fetch(`${config.API_URL}/api/prospects/generate-email-reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(context)
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

      toast.success('Réponse générée avec succès !');
    } catch (error: any) {
      console.error('Erreur génération IA:', error);
      toast.error(error.message || 'Erreur lors de la génération IA');
    } finally {
      setIsGenerating(false);
    }
  };

  // Envoyer la réponse
  const sendReply = async () => {
    // Validation
    if (steps.some(s => !s.subject || !s.body)) {
      toast.error('Tous les champs doivent être remplis');
      return;
    }

    try {
      setIsSending(true);
      const token = await getSupabaseToken();

      const response = await fetch(
        `${config.API_URL}/api/prospects/${prospectId}/send-reply/${emailReceivedId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            steps: steps.map(s => ({
              step_number: s.stepNumber,
              delay_days: s.delayDays,
              subject: s.subject,
              body: s.body
            }))
          })
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur envoi réponse');
      }

      toast.success(
        steps.length === 1
          ? 'Réponse envoyée avec succès !'
          : `Réponse envoyée et ${steps.length - 1} relance(s) programmée(s) !`
      );

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erreur envoi réponse:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi');
    } finally {
      setIsSending(false);
    }
  };

  // Ajouter une relance
  const addFollowUp = () => {
    const lastStep = steps[steps.length - 1];
    const newStep: EmailStep = {
      stepNumber: lastStep.stepNumber + 1,
      delayDays: lastStep.delayDays + 3, // 3 jours après la précédente
      subject: `RE: ${steps[0].subject}`,
      body: ''
    };
    setSteps([...steps, newStep]);
  };

  // Supprimer une relance
  const removeStep = (index: number) => {
    if (steps.length === 1) {
      toast.error('Vous devez garder au moins 1 email');
      return;
    }
    setSteps(steps.filter((_, i) => i !== index));
  };

  // Mettre à jour un step
  const updateStep = (index: number, field: keyof EmailStep, value: any) => {
    setSteps(steps.map((step, i) => 
      i === index ? { ...step, [field]: value } : step
    ));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="max-w-4xl w-full my-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Répondre à {prospectName}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{prospectEmail}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Actions principales */}
          <div className="flex gap-2">
            <Button
              onClick={generateAIReply}
              disabled={isGenerating || isSending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Générer par IA
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={addFollowUp}
              disabled={isGenerating || isSending}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une relance
            </Button>
          </div>

          {/* Contexte affiché */}
          <div className="bg-gray-50 rounded-lg p-4 border">
            <p className="text-sm font-medium mb-2">📧 Email reçu du prospect :</p>
            <div className="text-sm text-gray-700 max-h-32 overflow-y-auto bg-white p-3 rounded border">
              {emailReceivedContent.substring(0, 300)}
              {emailReceivedContent.length > 300 && '...'}
            </div>
            {sentEmailsHistory.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                💬 {sentEmailsHistory.length} email(s) envoyé(s) précédemment
              </p>
            )}
          </div>

          {/* Formulaire des emails */}
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={index} className="border rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={index === 0 ? "default" : "secondary"}>
                      {index === 0 ? (
                        <>
                          <Send className="h-3 w-3 mr-1" />
                          Réponse immédiate
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Relance {index} - {step.delayDays} jours après
                        </>
                      )}
                    </Badge>
                  </div>
                  {index > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStep(index)}
                      disabled={isGenerating || isSending}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>

                {index > 0 && (
                  <div className="mb-4">
                    <Label>Délai (jours après l'email précédent)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={step.delayDays}
                      onChange={(e) => updateStep(index, 'delayDays', parseInt(e.target.value))}
                      disabled={isGenerating || isSending}
                      className="w-32"
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <Label>Objet *</Label>
                    <Input
                      value={step.subject}
                      onChange={(e) => updateStep(index, 'subject', e.target.value)}
                      placeholder="Objet de l'email"
                      disabled={isGenerating || isSending}
                    />
                  </div>

                  <div>
                    <Label>Message *</Label>
                    <Textarea
                      value={step.body}
                      onChange={(e) => updateStep(index, 'body', e.target.value)}
                      placeholder="Contenu de l'email (HTML supporté)"
                      rows={10}
                      disabled={isGenerating || isSending}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      HTML supporté. Générez avec l'IA pour un contenu optimisé.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions finales */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isGenerating || isSending}
            >
              Annuler
            </Button>
            <Button
              onClick={sendReply}
              disabled={isGenerating || isSending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {steps.length === 1 
                    ? 'Envoyer la réponse' 
                    : `Envoyer + ${steps.length - 1} relance(s)`
                  }
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

