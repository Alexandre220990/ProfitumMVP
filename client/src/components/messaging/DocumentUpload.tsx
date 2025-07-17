import React, { useState, useCallback, useRef } from 'react';
import { Upload, Image, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useMessagingDocumentIntegration, MessageAttachment } from '@/services/messaging-document-integration';

interface DocumentUploadProps {
  conversationId: string;
  clientId: string;
  onUploadComplete: (attachment: MessageAttachment) => void;
  onUploadError: (error: string) => void;
  maxFiles?: number;
  maxFileSize?: number; // en bytes
  allowedTypes?: string[];
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ 
  conversationId, 
  clientId, 
  onUploadComplete, 
  onUploadError, 
  maxFiles = 5, 
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowedTypes = ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] 
}) => {
  const { toast } = useToast();
  const { uploadAttachment } = useMessagingDocumentIntegration();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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

        // Upload réel
        const result = await uploadAttachment(file, conversationId, clientId);

        clearInterval(progressInterval);

        if (result.success && result.attachment) {
          setUploadingFiles(prev => 
            prev.map(f => 
              f.id === uploadingFile.id 
                ? { ...f, progress: 100, status: 'success' }
                : f
            )
          );

          onUploadComplete(result.attachment);

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

          onUploadError(result.error || 'Erreur lors de l\'upload');
        }

      } catch (error) {
        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === uploadingFile.id 
              ? { ...f, status: 'error', error: 'Erreur inattendue' }
              : f
          )
        );

        onUploadError('Erreur inattendue lors de l\'upload');
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
            >
              Sélectionner des fichiers
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={allowedTypes.join(', ')}
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="mt-2 text-xs text-muted-foreground">
              <p>Types autorisés: PDF, Images, Documents</p>
              <p>Taille max: {formatFileSize(maxFileSize)}</p>
              <p>Maximum {maxFiles} fichiers</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fichiers en cours d'upload */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Fichiers en cours d'upload</h4>
          {uploadingFiles.map((uploadingFile) => (
            <Card key={uploadingFile.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                      {getFileIcon(uploadingFile.file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {uploadingFile.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(uploadingFile.file.size)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {uploadingFile.status === 'uploading' && (
                      <div className="w-20">
                        <Progress value={uploadingFile.progress} className="h-2" />
                      </div>
                    )}
                    
                    {uploadingFile.status === 'success' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    
                    {uploadingFile.status === 'error' && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUploadingFile(uploadingFile.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {uploadingFile.error && (
                  <p className="text-xs text-red-500 mt-2">
                    {uploadingFile.error}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentUpload; 