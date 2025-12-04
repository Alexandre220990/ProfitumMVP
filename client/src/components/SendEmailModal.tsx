import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, Send } from 'lucide-react';
import { toast } from 'sonner';
import { config } from '@/config/env';
import { getSupabaseToken } from '@/lib/auth-helpers';

interface SendEmailModalProps {
  prospectId: string;
  prospectName: string;
  prospectEmail: string;
  companyName: string | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SendEmailModal({
  prospectId,
  prospectName,
  prospectEmail,
  companyName,
  open,
  onClose,
  onSuccess
}: SendEmailModalProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [aiContext, setAiContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleClose = () => {
    if (!isGenerating && !isSending) {
      setSubject('');
      setBody('');
      setAiContext('');
      onClose();
    }
  };

  const generateWithAI = async () => {
    if (!aiContext.trim()) {
      toast.error('Veuillez fournir des instructions pour l\'IA');
      return;
    }

    try {
      setIsGenerating(true);
      const token = await getSupabaseToken();

      // Utiliser l'endpoint enrichi V4 pour bénéficier de LinkedIn, secteur, etc.
      const response = await fetch(`${config.API_URL}/api/prospects/generate-ai-email-v4`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prospects: [{
            email: prospectEmail,
            firstname: prospectName.split(' ')[0],
            lastname: prospectName.split(' ').slice(1).join(' '),
            company_name: companyName
          }],
          context: aiContext,
          forceReenrichment: false // Utiliser le cache si disponible
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur génération IA');
      }

      setSubject(result.data.subject || '');
      setBody(result.data.body || '');
      
      // Afficher les insights enrichis si disponibles
      if (result.data.prospect_insights) {
        const insights = result.data.prospect_insights;
        console.log('📊 Insights enrichis V4:', insights);
        toast.success(
          `✨ Email enrichi généré ! Score: ${result.data.meta?.score_personnalisation || '?'}/10 | ` +
          `Potentiel: ${insights.potentiel_economies || '?'}`
        );
      } else {
        toast.success('Email enrichi V4 généré avec succès !');
      }
    } catch (error: any) {
      console.error('Erreur génération IA:', error);
      toast.error(error.message || 'Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  const sendEmail = async () => {
    if (!subject.trim()) {
      toast.error('Veuillez renseigner un objet');
      return;
    }

    if (!body.trim()) {
      toast.error('Veuillez renseigner un message');
      return;
    }

    try {
      setIsSending(true);
      const token = await getSupabaseToken();

      const response = await fetch(`${config.API_URL}/api/prospects/${prospectId}/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: subject.trim(),
          body: body.trim(),
          step: 1
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de l\'envoi');
      }

      toast.success('Email envoyé avec succès !');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Erreur envoi email:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-600" />
            Envoyer un email à {prospectName}
          </DialogTitle>
          <DialogDescription>
            {companyName && `${companyName} • `}{prospectEmail}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contexte IA */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <Label className="text-sm font-semibold text-purple-900 mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Instructions pour l'IA (optionnel)
            </Label>
            <Textarea
              value={aiContext}
              onChange={(e) => setAiContext(e.target.value)}
              placeholder="Ex: Proposer un rendez-vous téléphonique pour discuter de nos solutions d'optimisation fiscale..."
              rows={3}
              disabled={isGenerating || isSending}
              className="bg-white"
            />
            <Button
              onClick={generateWithAI}
              disabled={isGenerating || isSending || !aiContext.trim()}
              className="mt-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Générer avec l'IA
                </>
              )}
            </Button>
          </div>

          {/* Formulaire email */}
          <div className="space-y-4">
            <div>
              <Label>Objet *</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Objet de l'email"
                disabled={isGenerating || isSending}
              />
            </div>

            <div>
              <Label>Message *</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Contenu de l'email (HTML supporté)"
                rows={12}
                disabled={isGenerating || isSending}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                HTML supporté. Utilisez l'IA pour un contenu optimisé et personnalisé.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={isGenerating || isSending}
            >
              Annuler
            </Button>
            <Button
              onClick={sendEmail}
              disabled={isGenerating || isSending || !subject.trim() || !body.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer maintenant
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

