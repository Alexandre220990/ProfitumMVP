import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { 
  Shield, 
  FileText, 
  Check, 
  AlertCircle, 
  Eye,
  Download,
  Trash2,
  Plus,
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

interface FoncierUploadInlineProps {
  clientProduitId: string;
  onDocumentsUploaded: (documents: DocumentFile[]) => void;
  onStepComplete?: () => void;
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

export default function FoncierUploadInline({
  clientProduitId,
  onDocumentsUploaded,
  onStepComplete
}: FoncierUploadInlineProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
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

    // Vérifier l'authentification
    if (!user) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour uploader des documents",
        variant: "destructive"
      });
      return;
    }

    setUploadProgress(prev => ({ ...prev, [documentType]: 0 }));

    try {
      // Simuler la progression
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[documentType] || 0;
          if (current >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return { ...prev, [documentType]: current + 10 };
        });
      }, 200);

      // Convertir le fichier en base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const fileData = base64Data.split(',')[1];

        const response = await post('/api/documents/upload', {
          dossier_id: clientProduitId,
          document_type: documentType,
          file_data: fileData,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          category: 'eligibilite_foncier'
        });

        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [documentType]: 100 }));

        if (response.success) {
          const newDocument = response.data as DocumentFile;
          setUploadedDocuments(prev => [...prev, newDocument]);
          
          toast({
            title: "Document uploadé avec succès",
            description: `${file.name} a été uploadé pour ${documentType}`,
          });
        } else {
          throw new Error(response.message || 'Erreur lors de l\'upload');
        }
      };

      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Erreur upload:', error);
      toast({
        title: "Erreur lors de l'upload",
        description: "Le document n'a pas pu être uploadé. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  }, [clientProduitId, toast]);

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
        onStepComplete?.();
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
  const handleDeleteDocument = useCallback(async (documentId: string) => {
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

  // Voir un document
  const handleViewDocument = useCallback((document: DocumentFile) => {
    setSelectedDocument(document);
    setShowViewer(true);
  }, []);

  // Notifier le parent des documents uploadés
  useEffect(() => {
    onDocumentsUploaded(uploadedDocuments);
  }, [uploadedDocuments, onDocumentsUploaded]);

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Documents Foncier</h3>
          <p className="text-sm text-gray-600">
            {uploadedDocuments.length} document(s) uploadé(s) sur {REQUIRED_DOCUMENTS.length} requis
          </p>
        </div>
        {hasAllRequiredDocuments() && (
          <Button
            onClick={handleValidateEligibility}
            disabled={isValidating}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            {isValidating ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                Validation...
              </>
            ) : (
              <>
                <Check className="w-3 h-3 mr-1" />
                Valider
              </>
            )}
          </Button>
        )}
      </div>

      {/* Documents */}
      <div className="grid gap-3">
        {REQUIRED_DOCUMENTS.map((doc) => {
          const isUploaded = isDocumentUploaded(doc.type);
          const uploadedDoc = getUploadedDocument(doc.type);
          const progress = uploadProgress[doc.type] || 0;

          return (
            <Card key={doc.type} className={`${isUploaded ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <doc.icon className={`w-4 h-4 ${isUploaded ? 'text-green-600' : 'text-gray-600'}`} />
                    <div>
                      <h4 className={`font-medium ${isUploaded ? 'text-green-800' : 'text-gray-900'}`}>
                        {doc.label}
                      </h4>
                      <p className="text-xs text-gray-600">{doc.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isUploaded ? (
                      <>
                        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                          <Check className="w-3 h-3 mr-1" />
                          Uploadé
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument(uploadedDoc!)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Voir
                        </Button>
                                                 <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handleDeleteDocument(uploadedDoc!.id)}
                         >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Supprimer
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, doc.type)}
                          className="hidden"
                          id={`foncier-${doc.type}`}
                        />
                        <label
                          htmlFor={`foncier-${doc.type}`}
                          className="cursor-pointer"
                        >
                          <Button variant="outline" size="sm" asChild>
                            <span>
                              <Plus className="w-3 h-3 mr-1" />
                              Ajouter
                            </span>
                          </Button>
                        </label>
                        {doc.required && (
                          <Badge variant="destructive" className="text-xs">
                            Obligatoire
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Barre de progression */}
                {!isUploaded && progress > 0 && progress < 100 && (
                  <div className="mt-3">
                    <Progress value={progress} className="w-full h-1" />
                    <p className="text-xs text-gray-500 mt-1">Upload en cours...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Aide */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">Informations importantes :</p>
              <ul className="space-y-0.5">
                <li>• KBIS de moins de 3 mois requis</li>
                <li>• Fiche d'imposition foncier de l'année en cours</li>
                <li>• Si vous avez déjà un KBIS pour un autre produit, il sera réutilisé</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de visualisation */}
      {showViewer && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{selectedDocument.original_filename}</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowViewer(false)}
              >
                Fermer
              </Button>
            </div>
            <div className="bg-gray-100 rounded p-4 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Visualisation du document : {selectedDocument.original_filename}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => window.open(selectedDocument.file_path, '_blank')}
              >
                <Download className="w-3 h-3 mr-1" />
                Télécharger
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
