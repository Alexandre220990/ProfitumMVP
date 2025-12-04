import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { config } from '@/config';
import { toast } from 'sonner';
import { getSupabaseToken } from '@/lib/auth-helpers';

interface Step5Props {
  prospectId: string;
  prospectEmail: string;
  emailOption: 'none' | 'exchange' | 'presentation';
  onUpdate: (option: 'none' | 'exchange' | 'presentation') => void;
  onFinish: () => void;
  onBack: () => void;
}

export function Step5_EmailOption({
  prospectId,
  prospectEmail,
  emailOption,
  onUpdate,
  onFinish,
  onBack
}: Step5Props) {
  
  const [sending, setSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const handleFinish = async () => {
    if (emailOption === 'none') {
      // Pas d'email, finir directement
      toast.success('✅ Prospect créé avec succès !');
      onFinish();
      return;
    }
    
    setSending(true);
    
    try {
      const token = await getSupabaseToken();
      const response = await fetch(
        `${config.API_URL}/api/apporteur/prospects/${prospectId}/send-credentials`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ emailType: emailOption })
        }
      );
      
      const result = await response.json();
      
      if (result.success) {
        setEmailSent(true);
        toast.success(`Email envoyé à ${prospectEmail} !`);
        
        // Attendre 2 secondes puis fermer
        setTimeout(() => {
          onFinish();
        }, 2000);
      } else {
        toast.warning(`Prospect créé mais erreur d'envoi: ${result.message}`);
        setTimeout(() => {
          onFinish();
        }, 3000);
      }
      
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      toast.error('Erreur lors de l\'envoi de l\'email');
    } finally {
      setSending(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-semibold text-purple-900 mb-1">
          Étape 5 : Comment poursuivre les échanges ?
        </h3>
        <p className="text-sm text-purple-700">
          Un compte a été automatiquement créé pour le prospect avec un mot de passe provisoire. 
          Choisissez si vous souhaitez lui envoyer les identifiants par email.
        </p>
      </div>

      {/* Options d'email */}
      <div className="space-y-3">
        {/* Option 1: Pas d'email */}
        <label
          className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
            emailOption === 'none'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <input
            type="radio"
            name="emailOption"
            value="none"
            checked={emailOption === 'none'}
            onChange={(e) => onUpdate(e.target.value as any)}
            className="mt-1 mr-3"
          />
          <div className="flex-1">
            <div className="font-semibold text-gray-900">Ne pas envoyer d'email maintenant</div>
            <div className="text-sm text-gray-600 mt-1">
              Le compte sera créé mais aucun email ne sera envoyé. 
              Vous pourrez communiquer les identifiants vous-même.
            </div>
          </div>
        </label>

        {/* Option 2: Email Échange concluant */}
        <label
          className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
            emailOption === 'exchange'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <input
            type="radio"
            name="emailOption"
            value="exchange"
            checked={emailOption === 'exchange'}
            onChange={(e) => onUpdate(e.target.value as any)}
            className="mt-1 mr-3"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="font-semibold text-gray-900">Email "Échange concluant"</div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                Recommandé
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Pour un prospect avec qui vous avez eu un échange positif. 
              Ton chaleureux et engageant.
            </div>
            <div className="text-xs text-gray-500 mt-2 italic">
              "Suite à notre échange, nous sommes ravis de vous accompagner..."
            </div>
          </div>
        </label>

        {/* Option 3: Email Présentation */}
        <label
          className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
            emailOption === 'presentation'
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <input
            type="radio"
            name="emailOption"
            value="presentation"
            checked={emailOption === 'presentation'}
            onChange={(e) => onUpdate(e.target.value as any)}
            className="mt-1 mr-3"
          />
          <div className="flex-1">
            <div className="font-semibold text-gray-900">Email "Présentation Profitum"</div>
            <div className="text-sm text-gray-600 mt-1">
              Pour un premier contact. Invitation à découvrir la plateforme sans engagement.
            </div>
            <div className="text-xs text-gray-500 mt-2 italic">
              "Découvrez Profitum, votre partenaire d'optimisation..."
            </div>
          </div>
        </label>
      </div>

      {/* Note de sécurité */}
      {emailOption !== 'none' && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <strong>Note de sécurité :</strong> Le mot de passe provisoire sera envoyé 
              uniquement par email au prospect et supprimé de notre système après l'envoi.
            </div>
          </div>
        </div>
      )}

      {/* Message de succès */}
      {emailSent && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-800">
              Email envoyé avec succès à <strong>{prospectEmail}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={sending || emailSent}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <Button
          type="button"
          onClick={handleFinish}
          disabled={sending || emailSent}
          className="bg-green-600 hover:bg-green-700"
        >
          {sending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              Envoi en cours...
            </>
          ) : emailSent ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Terminé !
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              {emailOption === 'none' ? 'Terminer' : 'Envoyer et Terminer'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

