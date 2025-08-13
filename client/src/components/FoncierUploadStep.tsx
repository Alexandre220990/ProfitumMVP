import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { 
  Shield, 
  FileText, 
  Upload, 
  Check, 
  AlertCircle, 
  Eye,
  Download,
  Trash2,
  Home
} from 'lucide-react';
import { post } from '@/lib/api';

interface DocumentFile {
  id: string;
  original_filename: string;
  document_type: string;
  status: string;
  file_path?: string;
  created_at: string;
}

interface FoncierUploadStepProps {
  clientProduitId: string;
  onStepComplete: () => void;
  onDocumentsUploaded: (documents: DocumentFile[]) => void;
}

interface UploadProgress {
  [key: string]: number;
}

// Types de documents requis pour Foncier
const REQUIRED_DOCUMENTS = [
  {
    type: 'kbis',
    label: 'Extrait KBIS',
    description: 'Extrait Kbis de votre entreprise (moins de 3 mois)',
    icon: Shield,
    required: true
  },
  {
    type: 'fiche_imposition_foncier',
    label: 'Fiche imposition foncier',
    description: 'Fiche d\'imposition foncier professionnel (année en cours)',
    icon: Home,
    required: true
  }
];

export default function FoncierUploadStep({
  clientProduitId,
  onStepComplete,
  onDocumentsUploaded
}: FoncierUploadStepProps) {
  const { toast } = useToast();
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
    if (!selectedFile || !selectedDocumentType) return;

    setIsUploading(true);
    setUploadProgress(prev => ({ ...prev, [selectedDocumentType]: 0 }));

    try {
      // Simuler la progression
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[selectedDocumentType] || 0;
          if (current >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return { ...prev, [selectedDocumentType]: current + 10 };
        });
      }, 200);

      // Convertir le fichier en base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const fileData = base64Data.split(',')[1];

        const response = await post('/api/documents/upload', {
          dossier_id: clientProduitId,
          document_type: selectedDocumentType,
          file_data: fileData,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
          category: 'eligibilite_foncier'
        });

        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [selectedDocumentType]: 100 }));

        if (response.success) {
          const newDocument = response.data;
          setUploadedDocuments(prev => [...prev, newDocument]);
          
          toast({
            title: "Document uploadé avec succès",
            description: `${selectedFile.name} a été uploadé pour ${selectedDocumentType}`,
          });

          // Réinitialiser la sélection
          setSelectedFile(null);
          setSelectedDocumentType('');
        } else {
          throw new Error(response.message || 'Erreur lors de l\'upload');
        }
      };

      reader.readAsDataURL(selectedFile);

    } catch (error) {
      console.error('Erreur upload:', error);
      toast({
        title: "Erreur lors de l'upload",
        description: "Le document n'a pas pu être uploadé. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, selectedDocumentType, clientProduitId, toast]);

  // Valider l'éligibilité
  const handleValidateEligibility = useCallback(async () => {
    if (!hasAllRequiredDocuments()) return;

    setIsValidating(true);
    try {
      const response = await post('/api/dossier/validate-eligibility', {
        dossier_id: clientProduitId,
        product_type: 'FONCIER'
      });

      if (response.success) {
        toast({
          title: "Éligibilité validée",
          description: "Votre dossier Foncier a été validé avec succès !",
        });
        onStepComplete();
      } else {
        throw new Error(response.message || 'Erreur lors de la validation');
      }
    } catch (error) {
      console.error('Erreur validation:', error);
      toast({
        title: "Erreur lors de la validation",
        description: "L'éligibilité n'a pas pu être validée. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  }, [hasAllRequiredDocuments, clientProduitId, toast, onStepComplete]);

  // Supprimer un document
  const handleDeleteDocument = useCallback(async (documentId: string, documentType: string) => {
    try {
      const response = await post('/api/documents/delete', {
        document_id: documentId
      });

      if (response.success) {
        setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
        toast({
          title: "Document supprimé",
          description: "Le document a été supprimé avec succès.",
        });
      } else {
        throw new Error(response.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast({
        title: "Erreur lors de la suppression",
        description: "Le document n'a pas pu être supprimé.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Notifier le parent des documents uploadés
  useEffect(() => {
    onDocumentsUploaded(uploadedDocuments);
  }, [uploadedDocuments, onDocumentsUploaded]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Documents requis pour Foncier
        </h2>
        <p className="text-gray-600">
          Veuillez fournir les documents suivants pour valider votre éligibilité Foncier
        </p>
      </div>

      {/* Documents requis */}
      <div className="grid gap-4">
        {REQUIRED_DOCUMENTS.map((doc) => {
          const isUploaded = isDocumentUploaded(doc.type);
          const uploadedDoc = getUploadedDocument(doc.type);
          const progress = uploadProgress[doc.type] || 0;

          return (
            <Card key={doc.type} className={`${isUploaded ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <doc.icon className={`w-5 h-5 ${isUploaded ? 'text-green-600' : 'text-gray-600'}`} />
                  <span className={isUploaded ? 'text-green-800' : 'text-gray-900'}>
                    {doc.label}
                  </span>
                  {isUploaded && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Check className="w-3 h-3 mr-1" />
                      Uploadé
                    </Badge>
                  )}
                  {doc.required && (
                    <Badge variant="destructive" className="ml-auto">
                      Obligatoire
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{doc.description}</p>

                {isUploaded ? (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">{uploadedDoc?.original_filename}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(uploadedDoc?.file_path, '_blank')}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Voir
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDocument(uploadedDoc!.id, doc.type)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileSelect(e, doc.type)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    
                    {selectedFile && selectedDocumentType === doc.type && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>{selectedFile.name}</span>
                          <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <Progress value={progress} className="w-full" />
                        <Button
                          onClick={handleUpload}
                          disabled={isUploading}
                          className="w-full"
                        >
                          {isUploading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Upload en cours...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Uploader
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Validation */}
      {hasAllRequiredDocuments() && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-green-900">Tous les documents requis sont uploadés</h4>
                  <p className="text-sm text-green-700">Vous pouvez maintenant valider votre éligibilité Foncier</p>
                </div>
              </div>
              <Button
                onClick={handleValidateEligibility}
                disabled={isValidating}
                className="bg-green-600 hover:bg-green-700"
              >
                {isValidating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Validation en cours...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Valider l'éligibilité Foncier
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
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
                <li>• La fiche d'imposition foncier doit être de l'année en cours</li>
                <li>• Tous les documents seront vérifiés par notre équipe administrative</li>
                <li>• Si vous avez déjà un KBIS pour un autre produit, il sera automatiquement réutilisé</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
