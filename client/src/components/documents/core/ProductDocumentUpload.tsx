import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { 
  Upload, 
  CheckCircle, 
  X, 
  Eye, 
  AlertCircle,
  LucideIcon
} from 'lucide-react';
import { config } from '@/config/env';

// ============================================================================
// TYPES
// ============================================================================

export interface RequiredDocument {
  type: string;
  label: string;
  description: string;
  icon: LucideIcon;
  required: boolean;
}

export interface ProductDocumentUploadProps {
  clientProduitId: string;
  productName: string; // Ex: "TICPE", "URSSAF", "Foncier"
  productCategory: string; // Ex: "eligibilite_ticpe", "eligibilite_urssaf"
  requiredDocuments: RequiredDocument[];
  infoMessage?: string; // Message d'information personnalisé
  onDocumentsUploaded?: (documents: DocumentFile[]) => void;
  onStepComplete?: () => void;
}

export interface DocumentFile {
  id: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  document_type: string;
  status: string;
  created_at: string;
  file_url?: string;
}

interface UploadProgress {
  [key: string]: number;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function ProductDocumentUpload({
  clientProduitId,
  productName,
  productCategory,
  requiredDocuments,
  infoMessage,
  onDocumentsUploaded,
  onStepComplete
}: ProductDocumentUploadProps) {
  const { user } = useAuth();
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentFile | null>(null);

  // ============================================================================
  // LOGIQUE DE VALIDATION
  // ============================================================================

  const hasAllRequiredDocuments = useCallback(() => {
    const uploadedTypes = uploadedDocuments.map(doc => doc.document_type);
    return requiredDocuments.every(doc => 
      doc.required ? uploadedTypes.includes(doc.type) : true
    );
  }, [uploadedDocuments, requiredDocuments]);

  const isDocumentUploaded = useCallback((documentType: string) => {
    return uploadedDocuments.some(doc => doc.document_type === documentType);
  }, [uploadedDocuments]);

  const getUploadedDocument = useCallback((documentType: string) => {
    return uploadedDocuments.find(doc => doc.document_type === documentType);
  }, [uploadedDocuments]);

  // ============================================================================
  // UPLOAD DE FICHIER
  // ============================================================================

  const handleFileUpload = useCallback(async (
    event: React.ChangeEvent<HTMLInputElement>, 
    documentType: string,
    documentLabel: string
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input pour permettre le re-upload du même fichier
    event.target.value = '';

    // Vérifier l'authentification
    if (!user) {
      toast.error("Vous devez être connecté pour uploader des documents");
      return;
    }

    setIsUploading(true);
    const fileId = `${file.name}-${Date.now()}`;
    
    try {
      // Démarrer le progress
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      // Simuler le progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[fileId] || 0;
          if (current >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return { ...prev, [fileId]: current + 10 };
        });
      }, 100);

      // Préparer les données du fichier
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dossier_id', clientProduitId);
      formData.append('document_type', documentType);
      formData.append('category', productCategory);
      formData.append('description', `Document ${documentLabel} pour ${productName}`);
      formData.append('user_type', user?.type || 'client');

      // Upload vers l'API avec authentification par token
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
      if (!token) {
        clearInterval(progressInterval);
        console.error('❌ Token manquant dans localStorage');
        toast.error("Token d'authentification manquant. Veuillez vous reconnecter.");
        return;
      }
      
      console.log('📤 Upload document:', { 
        productName, 
        documentType, 
        documentLabel,
        fileSize: file.size,
        fileName: file.name
      });
      
      const response = await fetch(`${config.API_URL}/api/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      console.log('📡 Réponse upload:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur upload:', errorText);
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erreur lors de l\'upload');
      }

      // Finaliser le progress
      setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));

      // Ajouter le document à la liste
      const newDocument: DocumentFile = {
        id: result.data.id,
        original_filename: result.data.original_filename || result.data.title || file.name,
        file_size: result.data.file_size || file.size,
        mime_type: result.data.mime_type || file.type,
        document_type: documentType,
        status: result.data.status || 'uploaded',
        created_at: result.data.created_at || new Date().toISOString(),
        file_url: result.data.public_url
      };

      setUploadedDocuments(prev => [...prev, newDocument]);

      toast.success(`${documentLabel} uploadé avec succès`);

      // Nettoyer le progress après un délai
      setTimeout(() => {
        setUploadProgress(prev => {
          const { [fileId]: removed, ...rest } = prev;
          return rest;
        });
      }, 2000);

    } catch (error) {
      console.error('❌ Erreur upload:', error);
      
      // Marquer comme erreur
      setUploadProgress(prev => ({ ...prev, [fileId]: -1 }));

      toast.error(error instanceof Error ? error.message : `Erreur lors de l'upload de ${file.name}`);
    } finally {
      setIsUploading(false);
    }
  }, [clientProduitId, user, productName, productCategory]);

  // ============================================================================
  // SUPPRESSION DE DOCUMENT
  // ============================================================================

  const removeDocument = useCallback(async (documentId: string, documentLabel: string) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
      if (!token) {
        toast.error("Token d'authentification manquant");
        return;
      }

      console.log('🗑️ Suppression document:', documentId);

      const response = await fetch(`${config.API_URL}/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }

      // Supprimer de la liste locale
      setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      toast.success(`${documentLabel} supprimé avec succès`);
    } catch (error) {
      console.error('❌ Erreur suppression document:', error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression du document");
    }
  }, []);

  // ============================================================================
  // VISUALISATION DE DOCUMENT
  // ============================================================================

  const viewDocument = useCallback(async (document: DocumentFile) => {
    try {
      // Obtenir l'URL signée depuis le backend
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
      if (!token) {
        toast.error("Non authentifié");
        return;
      }

      console.log('📥 Récupération URL signée pour document:', document.id);
      
      const response = await fetch(`${config.API_URL}/api/documents/${document.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la récupération du document');
      }

      const result = await response.json();
      
      if (result.success && result.data.download_url) {
        // Ouvrir l'URL signée dans un nouvel onglet
        window.open(result.data.download_url, '_blank');
        toast.success('Document ouvert');
      } else {
        throw new Error('URL de téléchargement non disponible');
      }
    } catch (error) {
      console.error('❌ Erreur visualisation document:', error);
      toast.error(error instanceof Error ? error.message : "Impossible d'ouvrir le document");
    }
  }, []);

  // ============================================================================
  // VALIDATION DE L'ÉTAPE
  // ============================================================================

  const handleValidateStep = useCallback(async () => {
    if (!hasAllRequiredDocuments()) {
      toast.error("Veuillez uploader tous les documents requis");
      return;
    }

    try {
      setIsValidating(true);

      // Notifier le parent des documents uploadés
      if (onDocumentsUploaded) {
        onDocumentsUploaded(uploadedDocuments);
      }

      // Mettre à jour le statut du dossier
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
      console.log('🔑 Token disponible:', token ? `OUI (${token.substring(0, 20)}...)` : 'NON');
      console.log('🔍 LocalStorage keys:', Object.keys(localStorage));
      
      if (token) {
        console.log('📤 Appel PUT /produits-eligibles avec:', {
          url: `${config.API_URL}/api/client/produits-eligibles/${clientProduitId}`,
          body: {
            statut: 'eligible_confirmed',
            notes: `Documents d'éligibilité ${productName} validés par le client`,
            current_step: 2,
            progress: 25
          }
        });

        const updateResponse = await fetch(`${config.API_URL}/api/client/produits-eligibles/${clientProduitId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            statut: 'eligible_confirmed',
            notes: `Documents d'éligibilité ${productName} validés par le client`,
            current_step: 2,
            progress: 25
          }),
        });

        console.log('📥 Réponse:', updateResponse.status, updateResponse.statusText);

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json().catch(() => ({}));
          console.error('❌ Erreur mise à jour statut dossier:', {
            status: updateResponse.status,
            statusText: updateResponse.statusText,
            error: errorData
          });
        } else {
          console.log('✅ Mise à jour réussie');
        }
      } else {
        console.error('❌ Pas de token trouvé - impossible de mettre à jour le dossier');
      }

      toast.success("Vos documents ont été validés avec succès");

      if (onStepComplete) {
        onStepComplete();
      }

    } catch (error) {
      console.error('❌ Erreur validation étape:', error);
      toast.error("Erreur lors de la validation de l'étape");
    } finally {
      setIsValidating(false);
    }
  }, [hasAllRequiredDocuments, uploadedDocuments, clientProduitId, productName, onDocumentsUploaded, onStepComplete]);

  // ============================================================================
  // CHARGEMENT DES DOCUMENTS EXISTANTS
  // ============================================================================

  useEffect(() => {
    const loadExistingDocuments = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
        
        if (!token) {
          console.warn('⚠️ Pas de token - impossible de charger les documents existants');
          return;
        }

        console.log('📥 Chargement documents existants pour:', clientProduitId);

        const response = await fetch(`${config.API_URL}/api/documents?produit_id=${clientProduitId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            // Mapper les données au format attendu
            const mappedDocs = result.data.map((doc: any) => ({
              id: doc.id,
              original_filename: doc.filename,
              file_size: doc.file_size,
              mime_type: doc.mime_type,
              document_type: doc.document_type,
              status: doc.status,
              created_at: doc.created_at,
              file_url: doc.public_url || doc.metadata?.public_url
            }));
            setUploadedDocuments(mappedDocs);
            console.log('✅ Documents chargés:', mappedDocs.length);
          }
        }
      } catch (error) {
        console.error('❌ Erreur chargement documents existants:', error);
      }
    };

    if (clientProduitId) {
      loadExistingDocuments();
    }
  }, [clientProduitId]);

  // ============================================================================
  // RENDU
  // ============================================================================

  return (
    <div className="space-y-4">
      {/* Documents requis - Design compact */}
      <div className="space-y-3">
        {requiredDocuments.map((doc) => {
          const Icon = doc.icon;
          const isUploaded = isDocumentUploaded(doc.type);
          const uploadedDoc = getUploadedDocument(doc.type);

          return (
            <div key={doc.type} className={`flex items-center justify-between p-3 rounded-lg border ${
              isUploaded ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center gap-3 flex-1">
                <Icon className="w-4 h-4 text-blue-600" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">{doc.label}</span>
                    {doc.required && <Badge variant="destructive" className="text-xs">Requis</Badge>}
                    {isUploaded && <CheckCircle className="w-4 h-4 text-green-600" />}
                  </div>
                  <p className="text-xs text-gray-600">{doc.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isUploaded ? (
                  <>
                    <input
                      type="file"
                      id={`file-${doc.type}`}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, doc.type, doc.label)}
                    />
                    <label htmlFor={`file-${doc.type}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isUploading}
                        className="cursor-pointer"
                        asChild
                      >
                        <span>
                          {isUploading ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600" />
                          ) : (
                            <>
                              <Upload className="w-3 h-3 mr-1" />
                              Upload
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                    {/* Affichage du progress */}
                    {Object.keys(uploadProgress).length > 0 && (
                      <div className="text-xs text-blue-600">
                        {Object.values(uploadProgress)[0]}%
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <span className="text-xs text-gray-500 truncate max-w-[150px]" title={uploadedDoc?.original_filename}>
                      {uploadedDoc?.original_filename}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => viewDocument(uploadedDoc!)}
                      title="Visualiser"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeDocument(uploadedDoc!.id, doc.label)}
                      title="Supprimer"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bouton de validation */}
      {hasAllRequiredDocuments() && (
        <div className="flex justify-center pt-2">
          <Button
            onClick={handleValidateStep}
            disabled={isValidating}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            {isValidating ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                Validation...
              </>
            ) : (
              <>
                <CheckCircle className="w-3 h-3 mr-2" />
                Valider l'étape
              </>
            )}
          </Button>
        </div>
      )}

      {/* Informations importantes */}
      {infoMessage && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <span className="font-medium">Important :</span> {infoMessage}
            </div>
          </div>
        </div>
      )}

      {/* Modal de visualisation de document */}
      {showViewer && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowViewer(false)}>
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {selectedDocument.original_filename}
              </h3>
              <button
                onClick={() => setShowViewer(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="overflow-auto max-h-[70vh]">
              {selectedDocument.mime_type?.startsWith('image/') ? (
                <img 
                  src={selectedDocument.file_url} 
                  alt={selectedDocument.original_filename}
                  className="max-w-full h-auto"
                />
              ) : (
                <iframe
                  src={selectedDocument.file_url}
                  title={selectedDocument.original_filename}
                  className="w-full h-[70vh] border-0"
                />
              )}
            </div>
            
            <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
              <span>Taille: {(selectedDocument.file_size / 1024 / 1024).toFixed(2)} MB</span>
              <span>Type: {selectedDocument.mime_type}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

