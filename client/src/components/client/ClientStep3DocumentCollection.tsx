/**
 * Composant Étape 3 : Collecte des documents
 * Affiche tous les documents (validés, rejetés, nouveaux demandés)
 * Design identique à la pré-éligibilité avec couleurs appropriées
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Check, 
  AlertCircle, 
  FileText, 
  CheckCircle2,
  XCircle,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { config } from '@/config/env';
import { get, post } from '@/lib/api';

interface Document {
  id: string;
  filename: string;
  original_filename?: string;
  storage_path: string;
  validation_status: 'pending' | 'validated' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  validated_at?: string;
  workflow_step?: string;
  document_type?: string;
  file_size?: number;
}

interface RequestedDocument {
  id: string;
  description: string;
  required: boolean;
  uploaded: boolean;
  document_id?: string | null;
}

interface DocumentRequest {
  id: string;
  message?: string;
  requested_documents: RequestedDocument[];
  status: string;
  created_at: string;
}

interface ClientStep3DocumentCollectionProps {
  dossierId: string;
  onComplete?: () => void;
}

export default function ClientStep3DocumentCollection({
  dossierId,
  onComplete
}: ClientStep3DocumentCollectionProps) {
  
  // États
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentRequest, setDocumentRequest] = useState<DocumentRequest | null>(null);
  const [requestedDocs, setRequestedDocs] = useState<RequestedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Charger les documents existants
  const loadDocuments = useCallback(async () => {
    try {
      const response: any = await get(`/api/client/dossier/${dossierId}/documents`);
      if (response.success) {
        setDocuments(response.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement documents:', error);
      toast.error('Erreur lors du chargement des documents');
    }
  }, [dossierId]);

  // Charger la demande de documents complémentaires
  const loadDocumentRequest = useCallback(async () => {
    try {
      const response: any = await get(`/api/client/dossier/${dossierId}/document-request`);
      if (response.success && response.data) {
        setDocumentRequest(response.data);
        setRequestedDocs(response.data.requested_documents || []);
      }
    } catch (error) {
      console.error('Erreur chargement demande documents:', error);
    }
  }, [dossierId]);

  // Charger les données au montage
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadDocuments(),
        loadDocumentRequest()
      ]);
      setLoading(false);
    };
    loadData();
  }, [loadDocuments, loadDocumentRequest]);

  // Séparer les documents par statut
  const validatedDocs = documents.filter(d => d.validation_status === 'validated');
  const rejectedDocs = documents.filter(d => d.validation_status === 'rejected');
  const pendingDocs = documents.filter(d => d.validation_status === 'pending');

  // Calculer le nombre de documents complétés
  const rejectedDocsCount = rejectedDocs.length;
  const rejectedDocsReuploaded = rejectedDocs.filter(d => {
    // Vérifier si un nouveau document pending existe pour remplacer celui-ci
    return pendingDocs.some(p => p.document_type === d.document_type);
  }).length;

  const requestedDocsCount = requestedDocs.filter(d => d.required).length;
  const requestedDocsUploaded = requestedDocs.filter(d => d.required && d.uploaded).length;

  const totalRequiredActions = rejectedDocsCount + requestedDocsCount;
  const totalCompletedActions = rejectedDocsReuploaded + requestedDocsUploaded;

  const allCompleted = totalRequiredActions === 0 || totalCompletedActions >= totalRequiredActions;
  const progressPercentage = totalRequiredActions > 0 
    ? Math.round((totalCompletedActions / totalRequiredActions) * 100) 
    : 100;

  // Upload d'un document pour remplacer un document rejeté
  const handleReuploadDocument = async (docId: string, file: File, documentType: string) => {
    if (!file) return;

    try {
      setUploadingId(docId);

      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
      if (!token) {
        throw new Error('Token non trouvé');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('dossier_id', dossierId);
      formData.append('document_type', documentType || 'document_complementaire');
      formData.append('category', 'document_complementaire');
      formData.append('description', `Remplacement : ${file.name}`);
      formData.append('parent_document_id', docId); // ✅ Lien vers document rejeté

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
        toast.success('Document re-uploadé avec succès', {
          description: file.name
        });
        await loadDocuments();
      } else {
        throw new Error(data.message || 'Erreur inconnue');
      }

    } catch (error: any) {
      console.error('❌ Erreur re-upload document:', error);
      toast.error('Erreur lors du re-upload', {
        description: error.message
      });
    } finally {
      setUploadingId(null);
    }
  };

  // Upload d'un nouveau document demandé
  const handleUploadRequestedDocument = async (docId: string, file: File, description: string) => {
    if (!file) return;

    try {
      setUploadingId(docId);

      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
      if (!token) {
        throw new Error('Token non trouvé');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('dossier_id', dossierId);
      formData.append('document_type', 'document_complementaire');
      formData.append('category', 'document_complementaire');
      formData.append('description', description);

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
        setRequestedDocs(prev => prev.map(doc => 
          doc.id === docId 
            ? {
                ...doc,
                uploaded: true,
                document_id: data.data.id
              }
            : doc
        ));

        toast.success('Document uploadé avec succès', {
          description: file.name
        });
        
        await loadDocuments();
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

  // Validation finale de l'étape
  const handleValidateStep = async () => {
    if (!allCompleted) {
      toast.error('Veuillez compléter tous les documents requis');
      return;
    }

    try {
      setIsValidating(true);

      const response = await post(`/api/client/dossier/${dossierId}/validate-step-3`, {});

      if (response.success) {
        toast.success('✅ Documents validés avec succès !', {
          description: 'Votre expert va maintenant procéder à l\'audit technique'
        });

        if (onComplete) {
          onComplete();
        }
      } else {
        throw new Error(response.message || 'Erreur validation');
      }

    } catch (error: any) {
      console.error('❌ Erreur validation étape:', error);
      toast.error('Erreur lors de la validation', {
        description: error.message
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Actualiser les données
  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([
      loadDocuments(),
      loadDocumentRequest()
    ]);
    setLoading(false);
    toast.success('Données actualisées');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec message */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-orange-900 mb-2">
                📄 Documents manquants
              </h3>
              <p className="text-orange-800 mb-2">
                L'expert a besoin de documents complémentaires pour constituer votre dossier.
              </p>
              {documentRequest?.message && (
                <div className="bg-white rounded-lg p-3 mb-3 border border-orange-200">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Message de l'expert :
                  </p>
                  <p className="text-sm text-gray-600">
                    {documentRequest.message}
                  </p>
                </div>
              )}
              <p className="text-sm text-orange-700">
                Merci de fournir les documents demandés ci-dessous.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Barre de progression */}
      {totalRequiredActions > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Progression : {totalCompletedActions}/{totalRequiredActions} actions complétées
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents validés (VERT) */}
      {validatedDocs.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            Documents validés ({validatedDocs.length})
          </h4>
          {validatedDocs.map((doc) => (
            <Card key={doc.id} className="border-green-300 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900">
                        {doc.original_filename || doc.filename}
                      </h5>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-green-600 text-white text-xs">
                          ✓ Validé
                        </Badge>
                        {doc.validated_at && (
                          <span className="text-xs text-gray-600">
                            Le {new Date(doc.validated_at).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                        {doc.file_size && (
                          <span className="text-xs text-gray-500">
                            {(doc.file_size / 1024).toFixed(0)} KB
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-green-300 hover:bg-green-100"
                      onClick={() => window.open(`${config.API_URL}/api/client/document/${doc.id}/view`, '_blank')}
                      title="Visualiser le document"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Voir
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`${config.API_URL}/api/client/document/${doc.id}/download`, '_blank')}
                      title="Télécharger le document"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Documents rejetés (ROUGE) */}
      {rejectedDocs.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600" />
            Documents rejetés - À remplacer ({rejectedDocs.length})
          </h4>
          {rejectedDocs.map((doc) => (
            <Card key={doc.id} className="border-red-300 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900 mb-1">
                        {doc.original_filename || doc.filename}
                      </h5>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="destructive" className="text-xs">
                          ✗ Rejeté
                        </Badge>
                        {doc.file_size && (
                          <span className="text-xs text-gray-500">
                            {(doc.file_size / 1024).toFixed(0)} KB
                          </span>
                        )}
                      </div>
                      {doc.rejection_reason && (
                        <div className="bg-white rounded-lg p-3 border border-red-200 mb-3">
                          <p className="text-xs font-medium text-red-900 mb-1">
                            Raison du rejet :
                          </p>
                          <p className="text-sm text-red-800">
                            {doc.rejection_reason}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-300 hover:bg-red-100 text-xs"
                          onClick={() => window.open(`${config.API_URL}/api/client/document/${doc.id}/view`, '_blank')}
                          title="Visualiser le document rejeté"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Voir l'ancien
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      id={`reupload-${doc.id}`}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleReuploadDocument(doc.id, file, doc.document_type || '');
                        }
                      }}
                      disabled={uploadingId === doc.id}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-300 hover:bg-red-100"
                      onClick={() => document.getElementById(`reupload-${doc.id}`)?.click()}
                      disabled={uploadingId === doc.id}
                    >
                      {uploadingId === doc.id ? (
                        <>
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                          Upload...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Remplacer
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Documents demandés (GRIS) */}
      {requestedDocs.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-600" />
            Nouveaux documents demandés ({requestedDocs.length})
          </h4>
          {requestedDocs.map((doc, index) => {
            // Trouver le document uploadé correspondant
            const uploadedDoc = doc.document_id ? documents.find(d => d.id === doc.document_id) : null;
            
            return (
              <Card 
                key={doc.id} 
                className={doc.uploaded ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        doc.uploaded 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-300 text-gray-700'
                      }`}>
                        {doc.uploaded ? <Check className="h-6 w-6" /> : (index + 1)}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900 mb-1">
                          {doc.description}
                        </h5>
                        <div className="flex items-center gap-2 mb-2">
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
                            <Badge className="bg-green-500 text-white text-xs">
                              ✓ Uploadé
                            </Badge>
                          )}
                        </div>
                        {doc.uploaded && uploadedDoc && (
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-green-300 hover:bg-green-100 text-xs"
                              onClick={() => window.open(`${config.API_URL}/api/client/document/${uploadedDoc.id}/view`, '_blank')}
                              title="Visualiser le document"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Voir
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`${config.API_URL}/api/client/document/${uploadedDoc.id}/download`, '_blank')}
                              title="Télécharger"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      {!doc.uploaded ? (
                        <>
                          <input
                            type="file"
                            id={`upload-${doc.id}`}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleUploadRequestedDocument(doc.id, file, doc.description);
                              }
                            }}
                            disabled={uploadingId === doc.id}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-400 hover:bg-gray-100"
                            onClick={() => document.getElementById(`upload-${doc.id}`)?.click()}
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
                                Choisir
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600"
                          disabled
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Bouton de validation finale */}
      <Card className={allCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200'}>
        <CardContent className="p-6">
          {allCompleted ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">
                  ✅ Tous les documents requis ont été fournis
                </span>
              </div>

              <Button
                onClick={handleValidateStep}
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
                    Valider l'étape 3
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-orange-700">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">
                  ⚠️ Progression : {totalCompletedActions}/{totalRequiredActions} actions complétées
                </span>
              </div>

              <Button
                disabled
                className="w-full"
                size="lg"
                variant="secondary"
              >
                <Upload className="h-5 w-5 mr-2" />
                Valider l'étape 3 (désactivé)
              </Button>

              <p className="text-xs text-gray-600 text-center">
                Le bouton sera activé quand tous les documents requis seront fournis
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

