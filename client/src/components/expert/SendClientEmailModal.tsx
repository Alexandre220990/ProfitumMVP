import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Send, Mail, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { post } from '@/lib/api';

interface SendClientEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName?: string;
  clientCompany?: string;
  clientProduitId?: string;
  produitName?: string;
  onEmailSent?: () => void;
}

export default function SendClientEmailModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  clientCompany,
  clientProduitId,
  produitName,
  onEmailSent
}: SendClientEmailModalProps) {
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [expertMessage, setExpertMessage] = useState('');
  const [useAIEnrichment, setUseAIEnrichment] = useState(true);

  // Générer un sujet par défaut si vide
  useEffect(() => {
    if (isOpen && !subject && produitName) {
      setSubject(`Prise en charge de votre demande - ${produitName}`);
    }
  }, [isOpen, produitName, subject]);

  const handleSend = async () => {
    if (!subject.trim() || !expertMessage.trim()) {
      toast.error('Veuillez remplir le sujet et le message');
      return;
    }

    try {
      setLoading(true);

      const response = await post(`/api/expert/clients/${clientId}/send-email`, {
        subject: subject.trim(),
        expert_message: expertMessage.trim(),
        client_produit_id: clientProduitId || undefined,
        use_ai_enrichment: useAIEnrichment
      });

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de l\'envoi');
      }

      toast.success('Email envoyé avec succès au client');
      
      // Reset form
      setSubject('');
      setExpertMessage('');
      setUseAIEnrichment(true);
      
      onEmailSent?.();
      onClose();
    } catch (error: any) {
      console.error('Erreur envoi email:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi de l\'email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Envoyer un email au client
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
          {/* Sujet */}
          <div className="space-y-2">
            <Label htmlFor="subject">Sujet *</Label>
            <Input
              id="subject"
              placeholder="Ex: Prise en charge de votre demande - TICPE"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Message de l'expert */}
          <div className="space-y-2">
            <Label htmlFor="message">Votre message *</Label>
            <Textarea
              id="message"
              placeholder="Rédigez votre message personnalisé pour le client..."
              value={expertMessage}
              onChange={(e) => setExpertMessage(e.target.value)}
              rows={8}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              Ce message sera inclus dans l'email avec le template Profitum de mise en relation.
            </p>
          </div>

          {/* Option enrichissement IA */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <Label htmlFor="ai-enrichment" className="font-semibold text-blue-900">
                  Enrichissement IA
                </Label>
              </div>
              <p className="text-xs text-blue-700">
                Personnalisez automatiquement votre message selon les données du client et du produit
              </p>
            </div>
            <Switch
              id="ai-enrichment"
              checked={useAIEnrichment}
              onCheckedChange={setUseAIEnrichment}
            />
          </div>

          {/* Aperçu du template */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-2">Aperçu de l'email :</p>
            <div className="text-xs text-gray-600 space-y-1">
              <p>📧 Profitum est heureux de vous mettre en relation avec [Votre nom]...</p>
              <p>💬 Votre message apparaîtra ici</p>
              <p>💡 Le client pourra répondre directement à cet email</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleSend}
            disabled={loading || !subject.trim() || !expertMessage.trim()}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Envoyer l'email
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
