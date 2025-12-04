import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  FileText, 
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
import { getSupabaseToken } from '@/lib/auth-helpers';

interface TICPEUploadStepProps {
  clientProduitId: string;
  onStepComplete: () => void;
  onDocumentsUploaded: (documents: DocumentFile[]) => void;
}

interface DocumentFile {
  id: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  document_type: string;
  status: 'uploaded' | 'pending' | 'error';
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

export default function TICPEUploadStep({
  clientProduitId,
  onStepComplete,
  onDocumentsUploaded
}: TICPEUploadStepProps) {
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');

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

  // Gérer la sélection de fichier
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedDocumentType(documentType);
    }
  }, []);

  // Upload du fichier
  const handleUpload = useCallback(async () => {
    if (!selectedFile || !selectedDocumentType) {
      toast.error("Veuillez sélectionner un fichier et un type de document");
      return;
    }

    setIsUploading(true);
    const fileId = `${selectedFile.name}-${Date.now()}`;
    
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
      formData.append('file', selectedFile);
      formData.append('dossier_id', clientProduitId);
      formData.append('document_type', selectedDocumentType);
      formData.append('category', 'eligibilite_ticpe');
      formData.append('description', `Document ${selectedDocumentType} pour éligibilité TICPE`);
      formData.append('user_type', 'client');

      // Upload vers l'API
      const response = await fetch(`${config.API_URL}/api/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getSupabaseToken()}`
        },
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
        original_filename: selectedFile.name,
        file_size: selectedFile.size,
        mime_type: selectedFile.type,
        document_type: selectedDocumentType,
        status: 'uploaded',
        created_at: new Date().toISOString(),
        file_url: result.data.file_url
      };

      setUploadedDocuments(prev => [...prev, newDocument]);

      toast.success(`${selectedFile.name} uploadé avec succès`);

      // Nettoyer
      setSelectedFile(null);
      setSelectedDocumentType('');

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

      toast.error(`Erreur lors de l'upload de ${selectedFile.name}`);
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, selectedDocumentType, clientProduitId, toast]);

  // Supprimer un document
  const removeDocument = useCallback((documentId: string) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
    toast.success("Le document a été supprimé de la liste");
  }, [toast]);

  // Visualiser un document
  const viewDocument = useCallback((document: DocumentFile) => {
    if (document.file_url) {
      window.open(document.file_url, '_blank');
    } else {
      toast.error("Impossible d'ouvrir le document");
    }
  }, [toast]);

  // Valider l'étape
  const handleValidateStep = useCallback(async () => {
    if (!hasAllRequiredDocuments()) {
      toast.error("Veuillez uploader tous les documents requis");
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
          'Authorization': `Bearer ${await getSupabaseToken()}`,
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

      // Envoyer la notification à l'admin
      const response = await fetch(`${config.API_URL}/api/notifications/admin/document-validation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getSupabaseToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_produit_id: clientProduitId,
          documents: uploadedDocuments.map(doc => ({
            id: doc.id,
            type: doc.document_type,
            filename: doc.original_filename
          })),
          product_type: 'TICPE',
          step: 'eligibilite'
        })
      });

      if (response.ok) {
        toast.success("Vos documents ont été envoyés pour validation par l'administrateur");

        // Appeler le callback de complétion
        onStepComplete();
      } else {
        throw new Error('Erreur lors de l\'envoi de la notification');
      }

    } catch (error) {
      console.error('Erreur validation étape:', error);
      toast.error("Erreur lors de la validation de l'étape");
    } finally {
      setIsValidating(false);
    }
  }, [hasAllRequiredDocuments, uploadedDocuments, clientProduitId, onDocumentsUploaded, onStepComplete, toast]);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Confirmer votre éligibilité TICPE
        </h3>
        <p className="text-gray-600">
          Uploadez les documents requis pour valider votre éligibilité au remboursement TICPE
        </p>
      </div>

      {/* Documents requis */}
      <div className="grid gap-4">
        {REQUIRED_DOCUMENTS.map((doc) => {
          const Icon = doc.icon;
          const isUploaded = isDocumentUploaded(doc.type);
          const uploadedDoc = getUploadedDocument(doc.type);

          return (
            <Card key={doc.type} className={`${isUploaded ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-blue-600" />
                    <span>{doc.label}</span>
                    {doc.required && <Badge variant="destructive" className="text-xs">Requis</Badge>}
                  </div>
                  {isUploaded && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </CardTitle>
                <p className="text-sm text-gray-600">{doc.description}</p>
              </CardHeader>
              <CardContent>
                {!isUploaded ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        id={`file-${doc.type}`}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileSelect(e, doc.type)}
                      />
                      <label
                        htmlFor={`file-${doc.type}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                          <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            Cliquez pour sélectionner un fichier
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            PDF, Word, Images acceptés
                          </p>
                        </div>
                      </label>
                    </div>
                    
                    {selectedFile && selectedDocumentType === doc.type && (
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-700 flex-1">
                          {selectedFile.name}
                        </span>
                        <Button
                          size="sm"
                          onClick={handleUpload}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Upload...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-700">
                        {uploadedDoc?.original_filename}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {uploadedDoc?.file_size ? (uploadedDoc.file_size / 1024 / 1024).toFixed(2) : '0'} MB
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewDocument(uploadedDoc!)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeDocument(uploadedDoc!.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Progress des uploads */}
      {Object.keys(uploadProgress).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Progression des uploads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(uploadProgress).map(([fileId, progress]) => (
                <div key={fileId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{fileId}</span>
                    <span className="text-sm text-gray-500">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  {progress === -1 && (
                    <p className="text-sm text-red-600">Erreur lors de l'upload</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bouton de validation */}
      {hasAllRequiredDocuments() && (
        <div className="text-center">
          <Button
            onClick={handleValidateStep}
            disabled={isValidating}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
          >
            {isValidating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Validation en cours...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Valider l'étape
              </>
            )}
          </Button>
          <p className="text-sm text-gray-500 mt-2">
            Vos documents seront envoyés à l'administrateur pour validation
          </p>
        </div>
      )}

      {/* Aide */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Informations importantes</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• L'extrait KBIS doit être de moins de 3 mois</li>
                <li>• Le certificat d'immatriculation doit être de moins de 6 mois</li>
                <li>• La facture de carburant doit être récente (trimestrielle ou annuelle)</li>
                <li>• Tous les documents seront vérifiés par notre équipe administrative</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
