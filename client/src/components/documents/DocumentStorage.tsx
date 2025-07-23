import { useEffect, useState, useCallback } from "react";
import { useDocumentStorage } from "@/hooks/use-document-storage";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress";
import { Upload, Trash2, Share2, Eye, Clock, Search, FileText, Calendar, Download, CheckCircle, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface DocumentStorageProps { 
  clientId: string;
  auditId?: string;
  onFileUploaded?: (fileId: string) => void;
  onFileDeleted?: (fileId: string) => void 
}

export default function DocumentStorage({ 
  clientId, 
  auditId, 
  onFileUploaded, 
  onFileDeleted 
}: DocumentStorageProps) { 
  const { user } = useAuth();
  const { loading, uploading, uploadFile, downloadFile, getClientFiles, validateFile, deleteFile, shareFile, getFileStats, formatFileSize, getFileIcon, getCategoryColor } = useDocumentStorage();

  // États locaux
  const [files, setFiles] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [filters, setFilters] = useState({ category: 'all', status: 'all', search: '' });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // États pour l'upload
  const [uploadData, setUploadData] = useState({ 
    file: null as File | null, 
    category: 'autre' as any, 
    description: '', 
    tags: [] as string[], 
    accessLevel: 'private' as any, 
    expiresAt: null as Date | null 
  });

  // États pour le partage
  const [shareData, setShareData] = useState({ 
    email: '', 
    view: true, 
    download: false, 
    expiresAt: null as Date | null | undefined 
  });

  // États pour la validation
  const [validationData, setValidationData] = useState({ 
    status: 'approved' as any, 
    comment: '' 
  });

  // Charger les fichiers au montage
  useEffect(() => { 
    loadFiles();
    loadStats(); 
  }, [clientId]);

  // Charger les fichiers avec useCallback pour éviter les rechargements constants
  const loadFiles = useCallback(async () => { 
    const response = await getClientFiles(clientId, {
      category: filters.category && filters.category !== 'all' ? filters.category : undefined, 
      status: filters.status && filters.status !== 'all' ? filters.status : undefined 
    });

    if (response.success && response.files) { 
      setFiles(response.files); 
    }
  }, [clientId, getClientFiles, filters.category, filters.status]);

  // Charger les statistiques avec useCallback pour éviter les rechargements constants
  const loadStats = useCallback(async () => { 
    const response = await getFileStats(clientId);
    if (response.success && response.stats) {
      setStats(response.stats); 
    }
  }, [clientId, getFileStats]);

  // Gérer l'upload de fichier
  const handleFileUpload = async () => { 
    if (!uploadData.file) return;

    const result = await uploadFile({
      file: uploadData.file, 
      clientId, 
      auditId, 
      category: uploadData.category, 
      description: uploadData.description, 
      tags: uploadData.tags, 
      accessLevel: uploadData.accessLevel, 
      expiresAt: uploadData.expiresAt || undefined 
    });

    if (result.success) { 
      setUploadDialogOpen(false);
      setUploadData({
        file: null, 
        category: 'autre', 
        description: '', 
        tags: [], 
        accessLevel: 'private', 
        expiresAt: null 
      });
      loadFiles();
      loadStats();
      onFileUploaded?.(result.fileId!);
    }
  };

  // Gérer le téléchargement
  const handleDownload = async (fileId: string) => { 
    await downloadFile(fileId); 
  };

  // Gérer la suppression
  const handleDelete = async (fileId: string) => { 
    const result = await deleteFile(fileId);
    if (result.success) {
      loadFiles();
      loadStats();
      onFileDeleted?.(fileId); 
    }
  };

  // Gérer le partage
  const handleShare = async () => { 
    if (!selectedFile || !shareData.email) return;

    const result = await shareFile(
      selectedFile.id, 
      shareData.email, 
      {
        view: shareData.view, 
        download: shareData.download 
      },
      shareData.expiresAt || undefined
    );

    if (result.success) { 
      setShareDialogOpen(false);
      setShareData({
        email: '', 
        view: true, 
        download: false, 
        expiresAt: null 
      });
    }
  };

  // Gérer la validation
  const handleValidation = async () => { 
    if (!selectedFile) return;

    const result = await validateFile(
      selectedFile.id, 
      validationData.status, 
      validationData.comment
    );

    if (result.success) {
      setValidationDialogOpen(false);
      setValidationData({
        status: 'approved', 
        comment: '' 
      });
      loadFiles();
    }
  };

  // Filtrer les fichiers
  const filteredFiles = files.filter(file => { 
    if (filters.search && !file.original_filename.toLowerCase().includes(filters.search.toLowerCase())) {
      return false; 
    }
    if (filters.category && filters.category !== 'all' && file.category !== filters.category) { 
      return false; 
    }
    if (filters.status && filters.status !== 'all' && file.status !== filters.status) { 
      return false; 
    }
    return true;
  });

  // Trier les fichiers
  const sortedFiles = [...filteredFiles].sort((a, b) => { 
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1; 
    } else { 
      return aValue < bValue ? 1 : -1; 
    }
  });

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Espace Documentaire
            </CardTitle>
            <Button onClick={() => setUploadDialogOpen(true)} disabled={uploading}>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Upload...' : 'Upload Fichier'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total_files}</div>
                <div className="text-sm text-gray-600">Fichiers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formatFileSize(stats.total_size)}</div>
                <div className="text-sm text-gray-600">Taille totale</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.recent_uploads}</div>
                <div className="text-sm text-gray-600">Uploads récents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Object.keys(stats.files_by_category).length}
                </div>
                <div className="text-sm text-gray-600">Catégories</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Nom du fichier..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="category">Catégorie</Label>
              <Select value={filters.category} onValueChange={(value: string) => setFilters(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
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
              <Label htmlFor="status">Statut</Label>
              <Select value={filters.status} onValueChange={(value: string) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
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

            <div>
              <Label htmlFor="sort">Tri</Label>
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value: string) => {
                const [field, order] = value.split('-');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at-desc">Plus récent</SelectItem>
                  <SelectItem value="created_at-asc">Plus ancien</SelectItem>
                  <SelectItem value="original_filename-asc">Nom A-Z</SelectItem>
                  <SelectItem value="original_filename-desc">Nom Z-A</SelectItem>
                  <SelectItem value="file_size-desc">Plus gros</SelectItem>
                  <SelectItem value="file_size-asc">Plus petit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des fichiers */}
      <Card>
        <CardHeader>
          <CardTitle>Fichiers ({sortedFiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : sortedFiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun fichier trouvé</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{getFileIcon(file.mime_type)}</div>
                    <div>
                      <div className="font-medium">{file.original_filename}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-4">
                        <span>{formatFileSize(file.file_size)}</span>
                        <Badge className={getCategoryColor(file.category)}>
                          {file.category}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(file.created_at).toLocaleDateString()}
                        </span>
                        {file.download_count > 0 && (
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {file.download_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Statut de validation */}
                    {file.validation_status === 'approved' && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    {file.validation_status === 'rejected' && (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    {file.validation_status === 'pending' && (
                      <Clock className="h-4 w-4 text-yellow-600" />
                    )}

                    {/* Actions */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file.id)}
                      title="Télécharger"
                    >
                      <Download className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(file);
                        setShareDialogOpen(true);
                      }}
                      title="Partager"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>

                    {['admin', 'expert'].includes(user?.type || '') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(file);
                          setValidationDialogOpen(true);
                        }}
                        title="Valider"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(file.id)}
                      title="Supprimer"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'upload */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload de fichier</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">Fichier</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setUploadData(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.csv,.zip,.rar"
              />
            </div>

            <div>
              <Label htmlFor="category">Catégorie</Label>
              <Select value={uploadData.category} onValueChange={(value: string) => setUploadData(prev => ({ ...prev, category: value }))}>
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
                value={uploadData.description}
                onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description du fichier..."
              />
            </div>

            <div>
              <Label htmlFor="accessLevel">Niveau d'accès</Label>
              <Select value={uploadData.accessLevel} onValueChange={(value: string) => setUploadData(prev => ({ ...prev, accessLevel: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Privé</SelectItem>
                  <SelectItem value="restricted">Restreint</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleFileUpload} disabled={!uploadData.file || uploading}>
                {uploading ? 'Upload...' : 'Upload'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de partage */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Partager le fichier</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="shareEmail">Email</Label>
              <Input
                id="shareEmail"
                type="email"
                value={shareData.email}
                onChange={(e) => setShareData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemple.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="view"
                  checked={shareData.view}
                  onCheckedChange={(checked: boolean) => setShareData(prev => ({ ...prev, view: checked }))}
                />
                <Label htmlFor="view">Autoriser la visualisation</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="download"
                  checked={shareData.download}
                  onCheckedChange={(checked: boolean) => setShareData(prev => ({ ...prev, download: checked }))}
                />
                <Label htmlFor="download">Autoriser le téléchargement</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleShare} disabled={!shareData.email}>
                Partager
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de validation */}
      <Dialog open={validationDialogOpen} onOpenChange={setValidationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Valider le fichier</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="validationStatus">Statut</Label>
              <Select value={validationData.status} onValueChange={(value: string) => setValidationData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approuvé</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                  <SelectItem value="requires_revision">Nécessite des révisions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="comment">Commentaire</Label>
              <Textarea
                id="comment"
                value={validationData.comment}
                onChange={(e) => setValidationData(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Commentaire de validation..."
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setValidationDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleValidation}>
                Valider
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 