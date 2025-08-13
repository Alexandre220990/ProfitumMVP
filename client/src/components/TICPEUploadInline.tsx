import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  CheckCircle, 
  X, 
  Eye, 
  AlertCircle,
  Shield,
  Car,
  Fuel
} from 'lucide-react';
import { config } from '@/config/env';

interface TICPEUploadInlineProps {
  clientProduitId: string;
  onDocumentsUploaded: (documents: DocumentFile[]) => void;
  onStepComplete: () => void;
}

interface DocumentFile {
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

// Types de documents requis pour TICPE
const REQUIRED_DOCUMENTS = [
  {
    type: 'kbis',
    label: 'Extrait KBIS',
    description: 'Extrait Kbis de votre entreprise (moins de 3 mois)',
    icon: Shield,
    required: true
  },
  {
    type: 'immatriculation',
    label: 'Certificat d\'immatriculation',
    description: 'Certificat d\'immatriculation de moins de 6 mois d\'au moins 1 véhicule',
    icon: Car,
    required: true
  },
  {
    type: 'facture_carburant',
    label: 'Facture de carburant',
    description: 'Facture de carburant trimestrielle ou annuelle',
    icon: Fuel,
    required: true
  }
];

export default function TICPEUploadInline({
  clientProduitId,
  onDocumentsUploaded,
  onStepComplete
}: TICPEUploadInlineProps) {
  const { toast } = useToast();
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentFile | null>(null);

  // Vérifier si tous les documents requis sont uploadés
  const hasAllRequiredDocuments = useCallback(() => {
    const uploadedTypes = uploadedDocuments.map(doc => doc.document_type);
    return REQUIRED_DOCUMENTS.every(doc => 
      doc.required ? uploadedTypes.includes(doc.type) : true
    );
  }, [uploadedDocuments]);

  // Vérifier si un document spécifique est uploadé
  const isDocumentUploaded = useCallback((documentType: string) => {
    return uploadedDocuments.some(doc => doc.document_type === documentType);
  }, [uploadedDocuments]);

  // Obtenir le document uploadé
  const getUploadedDocument = useCallback((documentType: string) => {
    return uploadedDocuments.find(doc => doc.document_type === documentType);
  }, [uploadedDocuments]);

  // Gérer la sélection et upload de fichier
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
      formData.append('category', 'eligibilite_ticpe');
      formData.append('description', `Document ${documentType} pour éligibilité TICPE`);
      formData.append('user_type', 'client');

      // Upload vers l'API
      const response = await fetch(`${config.API_URL}/api/documents/upload`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erreur lors de l\'upload');
      }

      // Finaliser le progress
      setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));

      // Ajouter le document à la liste
      const newDocument: DocumentFile = {
        id: result.data.id,
        original_filename: result.data.title,
        file_size: file.size,
        mime_type: file.type,
        document_type: documentType,
        status: 'uploaded',
        created_at: result.data.created_at,
        file_url: result.data.public_url
      };

      setUploadedDocuments(prev => [...prev, newDocument]);

      toast({
        title: "Succès",
        description: `${file.name} uploadé avec succès`
      });

      // Nettoyer le progress après un délai
      setTimeout(() => {
        setUploadProgress(prev => {
          const { [fileId]: removed, ...rest } = prev;
          return rest;
        });
      }, 2000);

    } catch (error) {
      console.error('Erreur upload:', error);
      
      // Marquer comme erreur
      setUploadProgress(prev => ({ ...prev, [fileId]: -1 }));

      toast({
        title: "Erreur",
        description: `Erreur lors de l'upload de ${file.name}`,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  }, [clientProduitId, toast]);

  // Supprimer un document
  const removeDocument = useCallback(async (documentId: string) => {
    try {
      // Appel API pour supprimer le document
      const response = await fetch(`${config.API_URL}/api/documents/${documentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      // Supprimer de la liste locale
      setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      toast({
        title: "Document supprimé",
        description: "Le document a été supprimé avec succès"
      });
    } catch (error) {
      console.error('Erreur suppression document:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression du document",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Visualiser un document
  const viewDocument = useCallback((document: DocumentFile) => {
    if (document.file_url) {
      setSelectedDocument(document);
      setShowViewer(true);
    } else {
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir le document",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Valider l'étape
  const handleValidateStep = useCallback(async () => {
    if (!hasAllRequiredDocuments()) {
      toast({
        title: "Documents manquants",
        description: "Veuillez uploader tous les documents requis",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsValidating(true);

      // Notifier le parent des documents uploadés
      onDocumentsUploaded(uploadedDocuments);

      // Mettre à jour le statut du dossier vers eligible_confirmed
      const updateResponse = await fetch(`${config.API_URL}/api/client/produits-eligibles/${clientProduitId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          statut: 'eligible_confirmed',
          notes: 'Documents d\'éligibilité validés par le client',
          current_step: 2,
          progress: 25
        })
      });

      if (!updateResponse.ok) {
        console.error('Erreur mise à jour statut dossier:', updateResponse.status);
      }

      toast({
        title: "Étape validée",
        description: "Vos documents ont été validés avec succès"
      });

      onStepComplete();

    } catch (error) {
      console.error('Erreur validation étape:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la validation de l'étape",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  }, [hasAllRequiredDocuments, uploadedDocuments, clientProduitId, onDocumentsUploaded, onStepComplete, toast]);

  // Charger les documents existants au montage du composant
  useEffect(() => {
    const loadExistingDocuments = async () => {
      try {
        const response = await fetch(`${config.API_URL}/api/documents/${clientProduitId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setUploadedDocuments(result.data);
          }
        }
      } catch (error) {
        console.error('Erreur chargement documents existants:', error);
      }
    };

    if (clientProduitId) {
      loadExistingDocuments();
    }
  }, [clientProduitId]);

  return (
    <div className="space-y-4">
      {/* Documents requis - Design compact */}
      <div className="space-y-3">
        {REQUIRED_DOCUMENTS.map((doc) => {
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
                      onChange={(e) => handleFileUpload(e, doc.type)}
                    />
                    <label htmlFor={`file-${doc.type}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isUploading}
                        className="cursor-pointer"
                      >
                        {isUploading ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600" />
                        ) : (
                          <>
                            <Upload className="w-3 h-3 mr-1" />
                            Upload
                          </>
                        )}
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
                    <span className="text-xs text-gray-500">
                      {uploadedDoc?.original_filename}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => viewDocument(uploadedDoc!)}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeDocument(uploadedDoc!.id)}
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

      {/* Informations importantes - Version compacte */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800">
            <span className="font-medium">Important :</span> KBIS {'<'} 3 mois, Immatriculation {'<'} 6 mois, Facture récente. Documents vérifiés par notre équipe.
          </div>
        </div>
      </div>

      {/* Modal de visualisation de document */}
      {showViewer && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {selectedDocument.original_filename}
              </h3>
              <button
                onClick={() => setShowViewer(false)}
                className="text-gray-500 hover:text-gray-700"
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
