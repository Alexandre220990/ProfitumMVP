/**
 * Modal expert pour demander des documents complémentaires
 * Interface simplifiée : input + bouton Ajouter → liste → Valider
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { post } from '@/lib/api';

interface ExpertDocumentRequestModalProps {
  dossierId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  preFilledDocuments?: Array<{name: string; reason: string}>; // ✅ Documents invalides pré-remplis
}

export default function ExpertDocumentRequestModal({
  dossierId,
  onSuccess,
  onCancel,
  preFilledDocuments = []
}: ExpertDocumentRequestModalProps) {
  const [currentInput, setCurrentInput] = useState('');
  const [documentsList, setDocumentsList] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Initialiser avec les documents pré-remplis
  useEffect(() => {
    if (preFilledDocuments && preFilledDocuments.length > 0) {
      const docNames = preFilledDocuments.map(d => 
        d.reason ? `${d.name} - ${d.reason}` : d.name
      );
      setDocumentsList(docNames);
    }
  }, [preFilledDocuments]);

  // Ajouter un document à la liste
  const handleAdd = () => {
    if (!currentInput.trim()) {
      toast.error('Veuillez saisir un nom de document');
      return;
    }

    if (documentsList.includes(currentInput.trim())) {
      toast.error('Ce document est déjà dans la liste');
      return;
    }

    setDocumentsList([...documentsList, currentInput.trim()]);
    setCurrentInput(''); // Vider l'input
  };

  // Retirer un document de la liste
  const handleRemove = (index: number) => {
    setDocumentsList(documentsList.filter((_, i) => i !== index));
  };

  // Envoyer la demande
  const handleSubmit = async () => {
    if (documentsList.length === 0) {
      toast.error('Veuillez ajouter au moins un document');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await post(`/api/expert/dossier/${dossierId}/request-documents`, {
        documents: documentsList,
        notes: null
      });

      if (response.success) {
        toast.success(`Demande envoyée ! ${documentsList.length} document(s) demandé(s) au client`);
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(response.message || 'Erreur lors de l\'envoi');
      }

    } catch (error: any) {
      console.error('❌ Erreur demande documents:', error);
      toast.error('Erreur lors de l\'envoi de la demande');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gérer la touche Entrée
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Card className="border-2 border-blue-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center gap-2 text-blue-900">
          📋 Documents manquants - Complément de dossier
          {preFilledDocuments.length > 0 && (
            <Badge className="bg-red-100 text-red-800 ml-2">
              {preFilledDocuments.length} invalide{preFilledDocuments.length > 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        
        {/* Input + Bouton Ajouter */}
        <div className="space-y-2">
          <p className="text-sm text-gray-600 font-medium">
            Saisissez le nom du document puis cliquez sur "Ajouter"
          </p>
          <div className="flex gap-2">
            <Input
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ex: KBIS de moins de 3 mois"
              className="flex-1"
              autoFocus
            />
            <Button
              onClick={handleAdd}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            💡 Astuce : Appuyez sur Entrée pour ajouter rapidement
          </p>
        </div>

        {/* Liste des documents */}
        {documentsList.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">
              Documents demandés ({documentsList.length})
            </p>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {documentsList.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </span>
                    <p className="text-gray-900 font-medium">{doc}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(index)}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500 text-sm">
              Aucun document dans la liste
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Ajoutez des documents en utilisant le champ ci-dessus
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Annuler
            </Button>
          )}
          
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || documentsList.length === 0}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Valider liste complémentaire
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

