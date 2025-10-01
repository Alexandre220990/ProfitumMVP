import { useState, useCallback } from 'react';
import { DropzoneFallback } from '@/components/ui/dropzone-fallback';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { config } from '@/config/env';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  X, 
  Building2, 
  FolderOpen,
  Tag
} from 'lucide-react';


interface DocumentUploadProps {
  clientProduitId?: string;
  onUploadComplete?: (success: boolean) => void;
  showDossierSelector?: boolean;
  dossiers?: DossierInfo[];
  onDossierSelect?: (dossierId: string) => void;
  className?: string;
}

interface DocumentFile {
  id: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  document_type: string;
  status: string;
  created_at: string;
}

interface DossierInfo {
  id: string;
  product_name: string;
  status: string;
  created_at: string;
  documents_count: number;
}

interface UploadProgress {
  [key: string]: number;
}

export default function DocumentUpload({ 
  clientProduitId = '', 
  onUploadComplete, 
  showDossierSelector = false,
  dossiers = [],
  onDossierSelect,
  className = "" 
}: DocumentUploadProps) {
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [isUploading, setIsUploading] = useState(false);

  const [selectedDossier, setSelectedDossier] = useState<string>(clientProduitId);
  const [documentType, setDocumentType] = useState<string>('');
  const [documentCategory, setDocumentCategory] = useState<string>('');
  const [documentDescription, setDocumentDescription] = useState<string>('');

  // Types de documents disponibles
  const documentTypes = [
    { value: 'kbis', label: 'KBIS / Extrait Kbis', category: 'identity' },
    { value: 'immatriculation', label: 'Certificat d\'immatriculation', category: 'technical' },
    { value: 'facture', label: 'Facture', category: 'financial' },
    { value: 'devis', label: 'Devis', category: 'financial' },
    { value: 'contrat', label: 'Contrat', category: 'legal' },
    { value: 'attestation', label: 'Attestation', category: 'legal' },
    { value: 'bulletin_paie', label: 'Bulletin de paie', category: 'financial' },
    { value: 'declaration_urssaf', label: 'Déclaration URSSAF', category: 'financial' },
    { value: 'acte_propriete', label: 'Acte de propriété', category: 'legal' },
    { value: 'avis_imposition', label: 'Avis d\'imposition', category: 'financial' },
    { value: 'autre', label: 'Autre document', category: 'other' }
  ];

  const categories = [
    { value: 'identity', label: 'Identité' },
    { value: 'financial', label: 'Financier' },
    { value: 'legal', label: 'Juridique' },
    { value: 'technical', label: 'Technique' },
    { value: 'other', label: 'Autre' }
  ];

  // Configuration dropzone
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!selectedDossier && showDossierSelector) {
      toast.error("Veuillez sélectionner un dossier avant d'uploader des documents");
      return;
    }

    if (!documentType) {
      toast.error("Veuillez sélectionner le type de document");
      return;
    }

    setIsUploading(true);
    
    for (const file of acceptedFiles) {
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
        formData.append('dossier_id', selectedDossier);
        formData.append('document_type', documentType);
        formData.append('category', documentCategory || 'other');
        formData.append('description', documentDescription || `Document ${documentType}`);
        formData.append('user_type', 'client');

        // Upload vers l'API avec Supabase Storage
        const response = await fetch(`${config.API_URL}/api/documents/upload`, {
          method: 'POST',
          body: formData,
          credentials: 'include'
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
          original_filename: file.name,
          file_size: file.size,
          mime_type: file.type,
          document_type: documentType,
          status: 'uploaded',
          created_at: new Date().toISOString()
        };

        setUploadedDocuments(prev => [...prev, newDocument]);

        toast.success(`${file.name} uploadé avec succès`);

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

        toast.error(`Erreur lors de l'upload de ${file.name}`);
      }
    }

    setIsUploading(false);
    
    // Notifier le parent
    if (onUploadComplete) {
      onUploadComplete(true);
    }
  }, [selectedDossier, documentType, documentCategory, documentDescription, showDossierSelector, onUploadComplete, toast]);

  // Configuration accept pour les fichiers
  const acceptConfig = {
    'application/pdf': ['.pdf'],
    'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
  };

  const removeDocument = (documentId: string) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileText className="h-5 w-5" />;
    if (mimeType.includes('pdf')) return <FileText className="h-5 w-5" />;
    if (mimeType.includes('word')) return <FileText className="h-5 w-5" />;
    if (mimeType.includes('excel')) return <FileText className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  const handleDossierSelect = (dossierId: string) => {
    setSelectedDossier(dossierId);
    if (onDossierSelect) {
      onDossierSelect(dossierId);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Sélection de dossier */}
      {showDossierSelector && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FolderOpen className="h-5 w-5 mr-2" />
              Sélectionner un dossier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="dossier-select">Dossier</Label>
                <Select value={selectedDossier} onValueChange={handleDossierSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un dossier" />
                  </SelectTrigger>
                  <SelectContent>
                    {dossiers.map((dossier) => (
                      <SelectItem key={dossier.id} value={dossier.id}>
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4" />
                          <span>{dossier.product_name}</span>
                          <Badge variant="outline" className="ml-2">
                            {dossier.documents_count} docs
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration du document */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Tag className="h-5 w-5 mr-2" />
            Configuration du document
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="document-type">Type de document</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="document-category">Catégorie</Label>
              <Select value={documentCategory} onValueChange={setDocumentCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner la catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="document-description">Description (optionnel)</Label>
              <Input
                id="document-description"
                placeholder="Description du document..."
                value={documentDescription}
                onChange={(e) => setDocumentDescription(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zone d'upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Upload de documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DropzoneFallback
            onDrop={onDrop}
            accept={acceptConfig}
            maxSize={10 * 1024 * 1024} // 10MB
            maxFiles={10}
            disabled={isUploading}
          >
            <div className="mt-4">
              <p className="text-sm text-gray-400">
                PDF, Images, Word, Excel (max 10MB par fichier)
              </p>
            </div>
          </DropzoneFallback>
        </CardContent>
      </Card>

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

      {/* Documents uploadés */}
      {uploadedDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Documents uploadés ({uploadedDocuments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(doc.mime_type)}
                    <div>
                      <p className="font-medium text-sm">{doc.original_filename}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(doc.file_size)} • {doc.document_type} • {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Uploadé
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(doc.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={() => {
            setUploadedDocuments([]);
            setUploadProgress({});
            setDocumentType('');
            setDocumentCategory('');
            setDocumentDescription('');
          }}
        >
          Réinitialiser
        </Button>
        <Button
          onClick={() => onUploadComplete?.(true)}
          disabled={uploadedDocuments.length === 0 || isUploading}
        >
          Terminer
        </Button>
      </div>
    </div>
  );
}