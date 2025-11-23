/**
 * Composant Étape 3 : Collecte des documents
 * Affiche tous les documents (validés, rejetés, nouveaux demandés)
 * Design identique à la pré-éligibilité avec couleurs appropriées
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  AlertCircle, 
  FileText, 
  CheckCircle2,
  Eye,
  RefreshCw,
  Trash2
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
  shared_document_id?: string;
  shared_document_version?: number;
  metadata?: Record<string, any> | null;
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
  // ✅ Note : Le backend filtre déjà les documents pour ne retourner que les versions actives
  // Si un document rejeté apparaît dans cette liste, c'est qu'il n'a PAS été remplacé par un document valide
  const rejectedDocs = documents.filter(d => d.validation_status === 'rejected');

  // Vérifier si chaque document rejeté a un remplacement valide (pending ou validated)
  // Le backend devrait déjà filtrer cela, mais on double-vérifie côté frontend pour sécurité
  const unresolvedRejectedDocs = rejectedDocs.filter(rejectedDoc => {
    // Chercher un remplacement valide pour ce document rejeté
    const hasValidReplacement = documents.some(doc => 
      doc.parent_document_id === rejectedDoc.id && 
      doc.validation_status !== 'rejected' // Le remplacement doit être pending ou validated
    );
    return !hasValidReplacement; // Garder seulement ceux qui n'ont PAS de remplacement valide
  });

  const unresolvedRejectedDocsCount = unresolvedRejectedDocs.length; // Documents rejetés NON remplacés par un document valide

  const requestedDocsCount = requestedDocs.filter(d => d.required).length;
  const requestedDocsUploaded = requestedDocs.filter(d => d.required && d.uploaded).length;

  // ✅ Calculer les actions restantes (pas les complétées, car on ne connaît pas l'historique)
  const missingRequestedDocs = requestedDocsCount - requestedDocsUploaded;
  const totalRemainingActions = unresolvedRejectedDocsCount + missingRequestedDocs;
  
  // Pour la barre de progression : calculer sur ce qu'on connaît (docs demandés uniquement)
  const totalRequiredActions = requestedDocsCount + unresolvedRejectedDocsCount;
  const totalCompletedActions = requestedDocsUploaded + 0; // Les docs rejetés ne comptent pas tant qu'ils ne sont pas remplacés
  
  const allCompleted = totalRemainingActions === 0;
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

  // Supprimer un document
  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
      if (!token) {
        toast.error('Session expirée, veuillez vous reconnecter');
        return;
      }

      const response = await fetch(`${config.API_URL}/api/documents/${docId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la suppression');
      }

      toast.success('Document supprimé avec succès');
      await loadDocuments();
      await loadDocumentRequest();
    } catch (error: any) {
      console.error('❌ Erreur suppression document:', error);
      toast.error('Erreur lors de la suppression', {
        description: error.message
      });
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

  // Visualiser un document (avec authentification)
  const handleViewDocument = async (doc: Document) => {
    try {
      toast.info('Ouverture du document...');

      // Récupérer le token d'authentification
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
      if (!token) {
        console.error('❌ Aucun token trouvé dans localStorage');
        toast.error('Session expirée, veuillez vous reconnecter');
        return;
      }

      console.log('👁️ Visualisation document:', {
        id: doc.id,
        filename: doc.filename
      });

      // Récupérer le document via une requête authentifiée
      const response = await fetch(
        `${config.API_URL}/api/client/document/${doc.id}/view`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      // Créer un blob à partir de la réponse
      const blob = await response.blob();
      
      // Créer une URL temporaire pour le blob
      const blobUrl = URL.createObjectURL(blob);
      
      // Ouvrir dans un nouvel onglet
      const newWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');
      
      if (!newWindow) {
        toast.error('Popup bloquée - Veuillez autoriser les popups');
        URL.revokeObjectURL(blobUrl);
        return;
      }

      // Nettoyer l'URL après 1 minute
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 60000);
      
      toast.success('Document ouvert dans un nouvel onglet');
    } catch (error: any) {
      console.error('Erreur visualisation document:', error);
      toast.error('Erreur lors de l\'ouverture du document', {
        description: error.message
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600">Chargement des documents...</p>
        </div>
      </div>
    );
  }

  // Organiser les documents pour l'affichage
  // Grouper les remplacements avec leurs parents pour un affichage cohérent
  const documentMap = new Map<string, Document>();
  const replacementMap = new Map<string, Document[]>(); // parent_id -> [replacements]
  
  documents.forEach(doc => {
    if (doc.parent_document_id) {
      // C'est un remplacement
      if (!replacementMap.has(doc.parent_document_id)) {
        replacementMap.set(doc.parent_document_id, []);
      }
      replacementMap.get(doc.parent_document_id)!.push(doc);
    } else {
      // C'est un document original
      documentMap.set(doc.id, doc);
    }
  });

  // Créer la liste d'affichage : documents originaux + leurs remplacements (si existants)
  // Si un document a un remplacement valide, on affiche le remplacement au lieu de l'original
  const displayDocuments: Document[] = [];
  
  documentMap.forEach((originalDoc, originalId) => {
    const replacements = replacementMap.get(originalId) || [];
    const validReplacements = replacements.filter(r => r.validation_status !== 'rejected');
    
    if (validReplacements.length > 0) {
      // Afficher le remplacement valide le plus récent au lieu de l'original
      const latestReplacement = validReplacements.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      displayDocuments.push(latestReplacement);
    } else {
      // Pas de remplacement valide : afficher l'original
      // (même s'il est rejeté, car c'est le document qui bloque)
      displayDocuments.push(originalDoc);
    }
  });

  // Ajouter les remplacements orphelins (cas où le parent n'existe plus dans la liste)
  replacementMap.forEach((replacements, parentId) => {
    if (!documentMap.has(parentId)) {
      // Le parent n'est plus dans la liste (filtré par le backend), afficher le remplacement le plus récent
      const validReplacements = replacements.filter(r => r.validation_status !== 'rejected');
      if (validReplacements.length > 0) {
        const latestReplacement = validReplacements.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        displayDocuments.push(latestReplacement);
      }
    }
  });

  // Trier par date de création décroissante (plus récents en premier)
  displayDocuments.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Fusionner tous les documents + les documents demandés non uploadés
  const allItems: Array<{
    type: 'document' | 'requested';
    data: Document | RequestedDocument;
  }> = [
    ...displayDocuments.map(doc => ({ type: 'document' as const, data: doc })),
    ...requestedDocs
      .filter(req => !req.uploaded)
      .map(req => ({ type: 'requested' as const, data: req }))
  ];

  return (
    <div className="space-y-4">
      {/* En-tête avec message expert si présent */}
      {documentRequest?.message && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900 mb-1">
            💬 Message de l'expert :
          </p>
          <p className="text-sm text-blue-800">
            {documentRequest.message}
          </p>
        </div>
      )}

      {/* Barre de progression compacte */}
      {totalRemainingActions > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {totalRemainingActions === 1 ? '1 action restante' : `${totalRemainingActions} actions restantes`}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <Progress value={progressPercentage} className="h-1.5" />
        </div>
      )}

      {/* Liste unifiée de tous les documents */}
      {allItems.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <FileText className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Aucun document</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allItems.map((item, index) => {
            if (item.type === 'document') {
              const doc = item.data as Document;
              const isValidated = doc.validation_status === 'validated';
              const isRejected = doc.validation_status === 'rejected';
              const sharedOrigin = doc.metadata?.shared_document_origin as {
                dossier_id?: string;
                document_id?: string;
              } | undefined;
              const isShared = Boolean(sharedOrigin);
              
              return (
                <div
                  key={`doc-${doc.id}`}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-sm ${
                    isValidated ? 'bg-green-50 border-green-200' :
                    isRejected ? 'bg-red-50 border-red-200' :
                    'bg-white border-gray-200'
                  }`}
                >
                  {/* Icône document */}
                  <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                    isValidated ? 'bg-green-500' :
                    isRejected ? 'bg-red-500' :
                    'bg-gray-400'
                  }`}>
                    <FileText className="w-5 h-5 text-white" />
                  </div>

                  {/* Infos document */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {doc.filename}
                      </p>
                      {isValidated && (
                        <Badge className="bg-green-600 text-white text-xs px-2 py-0">
                          ✓ Validé
                        </Badge>
                      )}
                      {isValidated && isShared && (
                        <Badge className="text-xs px-2 py-0 bg-blue-100 text-blue-700 border border-blue-200">
                          Réutilisé automatiquement
                        </Badge>
                      )}
                      {isRejected && (
                        <Badge variant="destructive" className="text-xs px-2 py-0">
                          ✗ Rejeté
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {doc.original_filename && (
                        <>
                          <span className="font-normal">{doc.original_filename}</span>
                          <span>•</span>
                        </>
                      )}
                      {doc.file_size && (
                        <span>{(doc.file_size / 1024).toFixed(0)} KB</span>
                      )}
                      {doc.created_at && (
                        <>
                          <span>•</span>
                          <span>{new Date(doc.created_at).toLocaleDateString('fr-FR')}</span>
                        </>
                      )}
                    </div>
                    {/* Raison du rejet */}
                    {isRejected && doc.rejection_reason && (
                      <div className="mt-2 text-xs text-red-700 bg-white rounded px-2 py-1 border border-red-200">
                        <span className="font-medium">Raison : </span>
                        {doc.rejection_reason}
                      </div>
                    )}
                    {isValidated && isShared && (
                      <div className="mt-2 text-xs text-blue-700 bg-blue-50 rounded px-2 py-1 border border-blue-200">
                        Document validé sur un autre dossier et synchronisé automatiquement.
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isValidated && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDocument(doc)}
                        className="h-8 px-3"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Voir
                      </Button>
                    )}
                    {!isValidated && !isRejected && (
                      /* Documents pending : Visualiser + Effacer */
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDocument(doc)}
                          className="h-8 px-3"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="h-8 px-3 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Effacer
                        </Button>
                      </>
                    )}
                    {isRejected && (
                      <>
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
                          onClick={() => document.getElementById(`reupload-${doc.id}`)?.click()}
                          disabled={uploadingId === doc.id}
                          className="h-8 px-3 border-red-300 hover:bg-red-100"
                        >
                          {uploadingId === doc.id ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                              Upload...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-1" />
                              Remplacer
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            } else {
              // Document demandé non uploadé
              const req = item.data as RequestedDocument;
              
              return (
                <div
                  key={`req-${req.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-orange-200 bg-orange-50 transition-all hover:shadow-sm"
                >
                  {/* Icône numéro */}
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>

                  {/* Infos document demandé */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-sm text-gray-900">
                        {req.description}
                      </p>
                      {req.required && (
                        <Badge className="bg-orange-500 text-white text-xs px-2 py-0">
                          Obligatoire
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Document à fournir
                    </p>
                  </div>

                  {/* Action upload */}
                  <div>
                    <input
                      type="file"
                      id={`upload-req-${req.id}`}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleUploadRequestedDocument(req.id, file, req.description);
                        }
                      }}
                      disabled={uploadingId === req.id}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById(`upload-req-${req.id}`)?.click()}
                      disabled={uploadingId === req.id}
                      className="h-8 px-3 border-orange-300 hover:bg-orange-100"
                    >
                      {uploadingId === req.id ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                          Upload...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-1" />
                          Uploader
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}

      {/* Bouton de validation finale */}
      {allCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">
              ✅ Tous les documents requis ont été fournis
            </span>
          </div>

          <Button
            onClick={handleValidateStep}
            disabled={isValidating}
            className="bg-green-600 hover:bg-green-700"
          >
            {isValidating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Validation...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Valider l'étape
              </>
            )}
          </Button>
        </div>
      )}

      {!allCompleted && totalRemainingActions > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center gap-2 text-orange-700">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-medium">
            ⚠️ {totalRemainingActions === 1 ? '1 action restante' : `${totalRemainingActions} actions restantes`} - Complétez tous les documents pour valider l'étape
          </span>
        </div>
      )}
    </div>
  );
}

