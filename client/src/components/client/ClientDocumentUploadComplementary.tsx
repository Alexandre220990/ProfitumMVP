/**
 * Composant client pour uploader les documents complémentaires demandés par l'expert
 * Validation bloquée tant que tous les documents requis ne sont pas uploadés
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Check, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { config } from '@/config/env';

interface RequiredDocument {
  id: string;
  description: string;
  required: boolean;
  uploaded: boolean;
  uploaded_at?: string | null;
  document_id?: string | null;
  file?: File;
}

interface ClientDocumentUploadComplementaryProps {
  dossierId: string;
  requiredDocuments: RequiredDocument[];
  expertMessage?: string;
  onComplete?: () => void;
}

export default function ClientDocumentUploadComplementary({
  dossierId,
  requiredDocuments: initialDocs,
  expertMessage,
  onComplete
}: ClientDocumentUploadComplementaryProps) {
  const [documents, setDocuments] = useState<RequiredDocument[]>(initialDocs);
  const [isValidating, setIsValidating] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // Synchroniser avec les props
  useEffect(() => {
    setDocuments(initialDocs);
  }, [initialDocs]);

  // Calculer le nombre de documents uploadés
  const uploadedCount = documents.filter(doc => doc.uploaded).length;
  const requiredCount = documents.filter(doc => doc.required).length;
  const allRequiredUploaded = documents.every(doc => !doc.required || doc.uploaded);
  const progressPercentage = requiredCount > 0 ? Math.round((uploadedCount / requiredCount) * 100) : 0;

  // Upload d'un document
  const handleUploadDocument = async (docId: string, file: File) => {
    if (!file) return;

    try {
      setUploadingId(docId);

      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
      if (!token) {
        throw new Error('Token non trouvé');
      }

      // Créer FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dossier_id', dossierId);
      formData.append('document_type', 'document_complementaire');
      formData.append('category', 'document_complementaire');
      formData.append('description', documents.find(d => d.id === docId)?.description || '');

      // Upload le fichier
      const response = await fetch(`${config.API_URL}/api/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur upload');
      }

      const data = await response.json();

      if (data.success) {
        // Mettre à jour l'état local
        setDocuments(prev => prev.map(doc => 
          doc.id === docId 
            ? {
                ...doc,
                uploaded: true,
                uploaded_at: new Date().toISOString(),
                document_id: data.data.id,
                file: file
              }
            : doc
        ));

        toast.success('Document uploadé avec succès', {
          description: file.name
        });
      } else {
        throw new Error(data.message || 'Erreur inconnue');
      }

    } catch (error: any) {
      console.error('❌ Erreur upload document:', error);
      toast.error('Erreur lors de l\'upload', {
        description: error.message
      });
    } finally {
      setUploadingId(null);
    }
  };

  // Validation finale
  const handleValidate = async () => {
    if (!allRequiredUploaded) {
      toast.error('Veuillez uploader tous les documents obligatoires');
      return;
    }

    try {
      setIsValidating(true);

      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
      if (!token) {
        throw new Error('Token non trouvé');
      }

      const response = await fetch(`${config.API_URL}/api/client/dossier/${dossierId}/validate-complementary-documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur validation');
      }

      const data = await response.json();

      if (data.success) {
        toast.success('Documents validés avec succès !', {
          description: 'Votre expert va maintenant procéder à l\'audit'
        });

        if (onComplete) {
          onComplete();
        }
      } else {
        throw new Error(data.message || 'Erreur inconnue');
      }

    } catch (error: any) {
      console.error('❌ Erreur validation documents:', error);
      toast.error('Erreur lors de la validation', {
        description: error.message
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Message de l'expert */}
      {expertMessage && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">Message de votre expert :</span>
            <p className="mt-1 text-gray-700">{expertMessage}</p>
          </AlertDescription>
        </Alert>
      )}

      {/* Barre de progression */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Progression : {uploadedCount}/{requiredCount} documents obligatoires
              </span>
              <span className="text-sm font-bold text-gray-900">
                {progressPercentage}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Liste des documents */}
      <div className="space-y-4">
        {documents.map((doc, index) => (
          <Card key={doc.id} className={doc.uploaded ? 'border-green-300 bg-green-50/30' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Numéro + Description */}
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      doc.uploaded 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {doc.uploaded ? <Check className="h-5 w-5" /> : (index + 1)}
                    </div>

                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {doc.description}
                      </h4>
                      <div className="flex items-center gap-2">
                        {doc.required ? (
                          <Badge className="bg-orange-500 text-white text-xs">
                            Obligatoire
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Optionnel
                          </Badge>
                        )}

                        {doc.uploaded && (
                          <Badge className="bg-green-500 text-white text-xs flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Uploadé
                          </Badge>
                        )}
                      </div>

                      {/* Nom du fichier uploadé */}
                      {doc.uploaded && doc.file && (
                        <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {doc.file.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bouton upload */}
                <div>
                  {!doc.uploaded ? (
                    <div>
                      <input
                        type="file"
                        id={`file-${doc.id}`}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleUploadDocument(doc.id, file);
                          }
                        }}
                        disabled={uploadingId === doc.id}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`file-${doc.id}`)?.click()}
                        disabled={uploadingId === doc.id}
                      >
                        {uploadingId === doc.id ? (
                          <>
                            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                            Upload...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Choisir un fichier
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-600"
                      disabled
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bouton de validation */}
      <Card className={allRequiredUploaded ? 'border-green-300 bg-green-50' : 'border-gray-200'}>
        <CardContent className="p-6">
          {allRequiredUploaded ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">
                  ✅ Tous les documents obligatoires ont été uploadés
                </span>
              </div>

              <Button
                onClick={handleValidate}
                disabled={isValidating}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {isValidating ? (
                  <>
                    <div className="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Validation en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Valider les documents
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-orange-700">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">
                  ⚠️ Progression : {uploadedCount}/{requiredCount} documents obligatoires uploadés
                </span>
              </div>

              <Button
                disabled
                className="w-full"
                size="lg"
                variant="secondary"
              >
                <Upload className="h-5 w-5 mr-2" />
                Valider les documents (désactivé)
              </Button>

              <p className="text-xs text-gray-600 text-center">
                Le bouton sera activé quand tous les documents obligatoires seront uploadés
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

