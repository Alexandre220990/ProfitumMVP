/**
 * Formulaire expert pour demander des documents complémentaires
 * Formulaire dynamique : ajout/suppression de documents
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { config } from '@/config/env';
import { getSupabaseToken } from '@/lib/auth-helpers';

interface DocumentRequest {
  id: string;
  description: string;
  required: boolean;
}

interface ExpertDocumentRequestFormProps {
  dossierId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ExpertDocumentRequestForm({
  dossierId,
  onSuccess,
  onCancel
}: ExpertDocumentRequestFormProps) {
  const [documents, setDocuments] = useState<DocumentRequest[]>([
    { id: crypto.randomUUID(), description: '', required: true }
  ]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ajouter un document
  const handleAddDocument = () => {
    setDocuments([
      ...documents,
      { id: crypto.randomUUID(), description: '', required: true }
    ]);
  };

  // Supprimer un document
  const handleRemoveDocument = (id: string) => {
    if (documents.length <= 1) {
      toast.error('Au moins un document doit être demandé');
      return;
    }
    setDocuments(documents.filter(doc => doc.id !== id));
  };

  // Mettre à jour la description
  const handleUpdateDescription = (id: string, description: string) => {
    setDocuments(documents.map(doc => 
      doc.id === id ? { ...doc, description } : doc
    ));
  };

  // Mettre à jour required
  const handleUpdateRequired = (id: string, required: boolean) => {
    setDocuments(documents.map(doc => 
      doc.id === id ? { ...doc, required } : doc
    ));
  };

  // Envoyer la demande
  const handleSubmit = async () => {
    // Validation
    const emptyDocs = documents.filter(doc => !doc.description.trim());
    if (emptyDocs.length > 0) {
      toast.error('Veuillez remplir la description de tous les documents');
      return;
    }

    try {
      setIsSubmitting(true);

      const token = await getSupabaseToken();
      
      if (!token) {
        throw new Error('Token non trouvé');
      }

      const response = await fetch(`${config.API_URL}/api/expert/dossier/${dossierId}/request-documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documents: documents.map(doc => ({
            description: doc.description.trim(),
            required: doc.required
          })),
          message: message.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la demande');
      }

      const data = await response.json();

      if (data.success) {
        toast.success('Demande de documents envoyée au client', {
          description: `${documents.length} document(s) demandé(s)`
        });

        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(data.message || 'Erreur inconnue');
      }

    } catch (error: any) {
      console.error('❌ Erreur demande documents:', error);
      toast.error('Erreur lors de l\'envoi de la demande', {
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>📋 Demander des documents complémentaires</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Liste des documents */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Documents requis</Label>
          
          {documents.map((doc, index) => (
            <div key={doc.id} className="p-4 border border-gray-200 rounded-lg space-y-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Document {index + 1}</Label>
                {documents.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDocument(doc.id)}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div>
                <Label htmlFor={`desc-${doc.id}`} className="text-sm">
                  Description du document *
                </Label>
                <Input
                  id={`desc-${doc.id}`}
                  value={doc.description}
                  onChange={(e) => handleUpdateDescription(doc.id, e.target.value)}
                  placeholder="Ex: Bulletins de paie janvier-mars 2024"
                  className="mt-1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`req-${doc.id}`}
                  checked={doc.required}
                  onCheckedChange={(checked) => handleUpdateRequired(doc.id, checked as boolean)}
                />
                <Label 
                  htmlFor={`req-${doc.id}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  Document obligatoire
                </Label>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={handleAddDocument}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un document complémentaire
          </Button>
        </div>

        {/* Message optionnel */}
        <div>
          <Label htmlFor="message" className="text-base font-semibold">
            Message au client (optionnel)
          </Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ex: Bonjour, j'ai besoin de ces documents pour finaliser l'analyse de votre dossier."
            rows={4}
            className="mt-2"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
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
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Envoyer la demande au client
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

