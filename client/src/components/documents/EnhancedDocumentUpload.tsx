import React, { useState, useCallback, useRef } from 'react';
import { Upload, Image, FileText, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedDocumentStorage, EnhancedUploadRequest } from '@/hooks/use-enhanced-document-storage';

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

interface EnhancedDocumentUploadProps {
  clientId?: string;
  expertId?: string;
  auditId?: string;
  onUploadComplete?: (fileId: string) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  maxFileSize?: number; // en bytes
  allowedTypes?: string[];
  defaultCategory?: string;
  showAdvancedOptions?: boolean;
}

export const EnhancedDocumentUpload: React.FC<EnhancedDocumentUploadProps> = ({ 
  clientId, 
  expertId, 
  auditId, 
  onUploadComplete, 
  onUploadError, 
  maxFiles = 5, 
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowedTypes = ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  defaultCategory = 'autre',
  showAdvancedOptions = false
}) => {
  const { toast } = useToast();
  const { uploadFile, uploading, formatFileSize, getFileIcon, getCategoryColor } = useEnhancedDocumentStorage();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(showAdvancedOptions);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // États pour les options avancées
  const [uploadOptions, setUploadOptions] = useState({
    category: defaultCategory,
    description: '',
    tags: [] as string[],
    accessLevel: 'private' as 'public' | 'private' | 'restricted' | 'confidential',
    expiresAt: null as Date | null
  });

  const validateFile = (file: File): string | null => {
    // Vérifier la taille
    if (file.size > maxFileSize) {
      return `Le fichier "${file.name}" dépasse la taille maximale autorisée (${formatFileSize(maxFileSize)})`;
    }

    // Vérifier le type
    const isValidType = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isValidType) {
      return `Le type de fichier "${file.type}" n'est pas autorisé`;
    }

    return null;
  };

  const handleFileUpload = async (files: FileList) => {
    const fileArray = Array.from(files);

    // Vérifier le nombre de fichiers
    if (fileArray.length > maxFiles) {
      toast({
        title: "Trop de fichiers",
        description: `Vous ne pouvez uploader que ${maxFiles} fichiers maximum`,
        variant: "destructive"
      });
      return;
    }

    // Valider chaque fichier
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        toast({
          title: "Fichier invalide",
          description: error,
          variant: "destructive"
        });
        continue;
      }

      const uploadingFile: UploadingFile = {
        id: `upload_${Date.now()}_${Math.random()}`,
        file,
        progress: 0,
        status: 'uploading'
      };

      setUploadingFiles(prev => [...prev, uploadingFile]);

      try {
        // Simuler la progression
        const progressInterval = setInterval(() => {
          setUploadingFiles(prev => 
            prev.map(f => 
              f.id === uploadingFile.id 
                ? { ...f, progress: Math.min(f.progress + 10, 90) }
                : f
            )
          );
        }, 100);

        // Préparer la requête d'upload
        const uploadRequest: EnhancedUploadRequest = {
          file,
          clientId,
          expertId,
          auditId,
          category: uploadOptions.category as any,
          description: uploadOptions.description || undefined,
          tags: uploadOptions.tags.length > 0 ? uploadOptions.tags : undefined,
          accessLevel: uploadOptions.accessLevel,
          expiresAt: uploadOptions.expiresAt || undefined
        };

        // Upload réel
        const result = await uploadFile(uploadRequest);

        clearInterval(progressInterval);

        if (result.success && result.fileId) {
          setUploadingFiles(prev => 
            prev.map(f => 
              f.id === uploadingFile.id 
                ? { ...f, progress: 100, status: 'success' }
                : f
            )
          );

          onUploadComplete?.(result.fileId);

          toast({
            title: "Upload réussi",
            description: `"${file.name}" a été uploadé avec succès`
          });

          // Retirer le fichier après 2 secondes
          setTimeout(() => {
            setUploadingFiles(prev => prev.filter(f => f.id !== uploadingFile.id));
          }, 2000);

        } else {
          setUploadingFiles(prev => 
            prev.map(f => 
              f.id === uploadingFile.id 
                ? { ...f, status: 'error', error: result.error }
                : f
            )
          );

          onUploadError?.(result.error || 'Erreur lors de l\'upload');
        }

      } catch (error) {
        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === uploadingFile.id 
              ? { ...f, status: 'error', error: 'Erreur inattendue' }
              : f
          )
        );

        onUploadError?.('Erreur inattendue lors de l\'upload');
      }
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  };

  const removeUploadingFile = (fileId: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const addTag = (tag: string) => {
    if (tag && !uploadOptions.tags.includes(tag)) {
      setUploadOptions(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setUploadOptions(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <div className="space-y-4">
      {/* Zone de drop */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center">
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">
              Glissez-déposez vos fichiers ici ou
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Upload en cours...
                </>
              ) : (
                'Sélectionner des fichiers'
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={allowedTypes.join(', ')}
              onChange={handleFileInputChange}
              className="hidden"
              disabled={uploading}
            />
            <div className="mt-2 text-xs text-muted-foreground">
              <p>Types autorisés: PDF, Images, Documents</p>
              <p>Taille max: {formatFileSize(maxFileSize)}</p>
              <p>Maximum {maxFiles} fichiers</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Options avancées */}
      {showAdvanced && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Select 
                  value={uploadOptions.category} 
                  onValueChange={(value) => setUploadOptions(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="charte">Charte</SelectItem>
                    <SelectItem value="rapport">Rapport</SelectItem>
                    <SelectItem value="audit">Audit</SelectItem>
                    <SelectItem value="simulation">Simulation</SelectItem>
                    <SelectItem value="guide">Guide</SelectItem>
                    <SelectItem value="facture">Facture</SelectItem>
                    <SelectItem value="contrat">Contrat</SelectItem>
                    <SelectItem value="certificat">Certificat</SelectItem>
                    <SelectItem value="formulaire">Formulaire</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={uploadOptions.description}
                  onChange={(e) => setUploadOptions(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description du document..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="accessLevel">Niveau d'accès</Label>
                <Select 
                  value={uploadOptions.accessLevel} 
                  onValueChange={(value: any) => setUploadOptions(prev => ({ ...prev, accessLevel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Privé</SelectItem>
                    <SelectItem value="restricted">Restreint</SelectItem>
                    <SelectItem value="confidential">Confidentiel</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {uploadOptions.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ajouter un tag..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        addTag(input.value);
                        input.value = '';
                      }
                    }}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Ajouter un tag..."]') as HTMLInputElement;
                      if (input?.value) {
                        addTag(input.value);
                        input.value = '';
                      }
                    }}
                  >
                    Ajouter
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bouton pour afficher/masquer les options avancées */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full"
      >
        {showAdvanced ? 'Masquer' : 'Afficher'} les options avancées
      </Button>

      {/* Liste des fichiers en cours d'upload */}
      {uploadingFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Fichiers en cours d'upload</h4>
            <div className="space-y-3">
              {uploadingFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getFileIcon(file.file.type)}</span>
                    <div>
                      <p className="text-sm font-medium">{file.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.file.size)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {file.status === 'uploading' && (
                      <>
                        <Progress value={file.progress} className="w-20" />
                        <span className="text-xs text-muted-foreground">{file.progress}%</span>
                      </>
                    )}
                    
                    {file.status === 'success' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    
                    {file.status === 'error' && (
                      <div className="flex items-center space-x-1">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-xs text-red-500">{file.error}</span>
                      </div>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUploadingFile(file.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 