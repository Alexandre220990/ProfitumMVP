import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDocumentSections, DocumentFile } from '../hooks/use-document-sections';
import { useToast } from '../hooks/use-toast';
import HeaderClient from '@/components/HeaderClient';
import { 
  Download, 
  Eye, 
  Trash2, 
  FileText, 
  Image, 
  FileText as FilePdf, 
  Table,
  Video,
  Music,
  Archive,
  GraduationCap,
  Folder,
  Receipt,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Archive as ArchiveIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { debugAuth, forceRefreshSession } from '@/utils/debug-auth';

// Composant pour afficher une icône de fichier selon le type
const FileIcon = ({ mimeType, extension }: { mimeType?: string; extension?: string }) => {
  if (mimeType?.includes('pdf')) return <FilePdf className="h-5 w-5 text-red-500" />;
  if (mimeType?.includes('image')) return <Image className="h-5 w-5 text-green-500" />;
  if (mimeType?.includes('spreadsheet') || extension === 'xls' || extension === 'xlsx') {
    return <Table className="h-5 w-5 text-green-600" />;
  }
  if (mimeType?.includes('video')) return <Video className="h-5 w-5 text-purple-500" />;
  if (mimeType?.includes('audio')) return <Music className="h-5 w-5 text-blue-500" />;
  if (mimeType?.includes('zip') || mimeType?.includes('rar')) return <Archive className="h-5 w-5 text-orange-500" />;
  return <FileText className="h-5 w-5 text-gray-500" />;
};

// Composant pour afficher le statut d'un fichier
const FileStatus = ({ status }: { status?: string }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'validated':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', text: 'Validé' };
      case 'rejected':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', text: 'Rejeté' };
      case 'archived':
        return { icon: ArchiveIcon, color: 'text-gray-600', bg: 'bg-gray-50', text: 'Archivé' };
      case 'deleted':
        return { icon: Trash2, color: 'text-red-600', bg: 'bg-red-50', text: 'Supprimé' };
      default:
        return { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50', text: 'En attente' };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge variant="secondary" className={`${config.bg} ${config.color} border-0`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.text}
    </Badge>
  );
};

// Composant pour afficher un fichier
const FileCard = ({ file, onDownload, onView, onDelete }: {
  file: DocumentFile;
  onDownload: (file: DocumentFile) => void;
  onView: (file: DocumentFile) => void;
  onDelete: (file: DocumentFile) => void;
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <FileIcon mimeType={file.mime_type} extension={file.file_extension} />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{file.original_filename || 'Fichier sans nom'}</h4>
              <p className="text-xs text-gray-500 mt-1">
                {formatFileSize(file.file_size || 0)} • {file.file_extension?.toUpperCase() || 'N/A'}
              </p>
              {file.description && (
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{file.description}</p>
              )}
              <div className="flex items-center space-x-2 mt-2">
                <FileStatus status={file.status} />
                <span className="text-xs text-gray-400">
                  {file.created_at ? format(new Date(file.created_at), 'dd/MM/yyyy', { locale: fr }) : 'Date inconnue'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(file)}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownload(file)}
              className="h-8 w-8 p-0"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(file)}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Composant pour l'upload de fichiers
const UploadDialog = ({ 
  isOpen, 
  onClose, 
  onUpload 
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, description?: string) => void;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (file) {
      onUpload(file, description);
      setFile(null);
      setDescription('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Uploader un fichier</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Fichier</label>
            <Input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.csv,.zip,.rar"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description (optionnel)</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du fichier..."
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleUpload} disabled={!file}>
              Uploader
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Page principale des documents client
const DocumentsClientPage = () => {
  const { toast } = useToast();
  const [selectedSection, setSelectedSection] = useState<string>('formation');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const {
    sections,
    sectionsLoading,
    uploadToSection,
    useSectionFiles
  } = useDocumentSections();

  const {
    data: sectionFiles,
    isLoading: filesLoading,
    refetch: refetchFiles
  } = useSectionFiles(selectedSection, {
    status: statusFilter === 'all' ? undefined : statusFilter
  });

  // Gestion de l'upload
  const handleUpload = useCallback(async (file: File, description?: string) => {
    console.log('🔍 [DEBUG] handleUpload appelé:', { file: file.name, description, section: selectedSection });
    
    const result = await uploadToSection.mutateAsync({
      sectionName: selectedSection,
      file,
      description
    });

    console.log('🔍 [DEBUG] Résultat upload:', result);

    if (result.success) {
      console.log('✅ [DEBUG] Upload réussi, rafraîchissement des fichiers');
      refetchFiles();
    } else {
      console.log('❌ [DEBUG] Upload échoué:', result.error);
    }
  }, [selectedSection, uploadToSection, refetchFiles]);

  // Gestion du téléchargement
  const handleDownload = useCallback((file: DocumentFile) => {
    // Implémentation du téléchargement
    toast({
      title: 'Téléchargement',
      description: `Téléchargement de ${file.original_filename}...`,
    });
  }, [toast]);

  // Gestion de la visualisation
  const handleView = useCallback((file: DocumentFile) => {
    // Implémentation de la visualisation
    toast({
      title: 'Visualisation',
      description: `Ouverture de ${file.original_filename}...`,
    });
  }, [toast]);

  // Gestion de la suppression
  const handleDelete = useCallback((file: DocumentFile) => {
    // Implémentation de la suppression
    toast({
      title: 'Suppression',
      description: `Suppression de ${file.original_filename}...`,
    });
  }, [toast]);

  // Fonctions de débogage
  const handleDebugAuth = useCallback(() => {
    debugAuth();
  }, []);

  const handleForceRefresh = useCallback(async () => {
    await forceRefreshSession();
  }, []);

  // Filtrage des fichiers selon la recherche
  const filteredFiles = sectionFiles?.files?.filter(file =>
    (file.original_filename && file.original_filename.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (file.description && file.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  if (sectionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <HeaderClient />
        <div className="pt-20">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Chargement des sections...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <HeaderClient />
      <div className="pt-20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex gap-6">
            {/* Contenu principal (3/4) */}
            <div className="flex-1">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {sections?.find(s => s.name === selectedSection)?.display_name || 'Documents'}
                </h1>
                <p className="text-gray-600">
                  {sections?.find(s => s.name === selectedSection)?.description || 'Gérez vos documents'}
                </p>
              </div>

              {/* Barre d'outils */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher des fichiers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="uploaded">Uploadé</SelectItem>
                      <SelectItem value="validated">Validé</SelectItem>
                      <SelectItem value="rejected">Rejeté</SelectItem>
                      <SelectItem value="archived">Archivé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={handleDebugAuth} size="sm">
                    🔍 Debug Auth
                  </Button>
                  <Button variant="outline" onClick={handleForceRefresh} size="sm">
                    🔄 Refresh
                  </Button>
                  <Button onClick={() => setUploadDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un fichier
                  </Button>
                </div>
              </div>

              {/* Liste des fichiers */}
              {filesLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Chargement des fichiers...</p>
                  </div>
                </div>
              ) : filteredFiles.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun fichier trouvé</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm 
                        ? 'Aucun fichier ne correspond à votre recherche.'
                        : 'Commencez par ajouter votre premier fichier.'
                      }
                    </p>
                    <Button onClick={() => setUploadDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un fichier
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredFiles.map((file) => (
                    <FileCard
                      key={file.id}
                      file={file}
                      onDownload={handleDownload}
                      onView={handleView}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar avec onglets (1/4) */}
            <div className="w-80">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sections?.map((section) => (
                      <Button
                        key={section.name}
                        variant={selectedSection === section.name ? "default" : "ghost"}
                        className="w-full justify-start h-auto p-3"
                        onClick={() => setSelectedSection(section.name)}
                      >
                        <div className="flex items-center space-x-3 w-full">
                          <div 
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${section.color}20` }}
                          >
                            {section.icon === 'graduation-cap' && <GraduationCap className="h-4 w-4" style={{ color: section.color }} />}
                            {section.icon === 'folder' && <Folder className="h-4 w-4" style={{ color: section.color }} />}
                            {section.icon === 'file-text' && <FileText className="h-4 w-4" style={{ color: section.color }} />}
                            {section.icon === 'receipt' && <Receipt className="h-4 w-4" style={{ color: section.color }} />}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium">{section.display_name}</div>
                            {section.description && (
                              <div className="text-xs text-gray-500 truncate">{section.description}</div>
                            )}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog d'upload */}
      <UploadDialog
        isOpen={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  );
};

export default DocumentsClientPage; 