/**
 * 📁 UnifiedDocumentManager - Composant GED universel
 * 
 * Interface type Google Drive réutilisable
 * Fonctionne pour Client, Expert, Apporteur, Admin
 * 
 * Usage:
 * <UnifiedDocumentManager userType="client" />
 * <UnifiedDocumentManager userType="expert" />
 * <UnifiedDocumentManager userType="apporteur" />
 * <UnifiedDocumentManager userType="admin" />
 * 
 * Date: 2025-10-13
 * Version: 1.0
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  FileText,
  Upload,
  Download,
  Search,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  FolderOpen,
  Grid3x3,
  List,
  Star,
  Share2,
  ChevronRight,
  ChevronDown,
  FileIcon,
  MoreVertical,
  Check,
  X
} from 'lucide-react';
import { useDocuments, Document } from '@/hooks/use-documents';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// ============================================================================
// TYPES
// ============================================================================

interface UnifiedDocumentManagerProps {
  userType: 'client' | 'expert' | 'apporteur' | 'admin';
  className?: string;
}

type ViewMode = 'tree' | 'list' | 'grid';

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function UnifiedDocumentManager({ userType, className }: UnifiedDocumentManagerProps) {
  const {
    documents,
    stats,
    loading,
    uploading,
    uploadDocument,
    downloadDocument,
    validateDocument,
    rejectDocument,
    toggleFavorite,
    shareDocument,
    getPreviewUrl,
    formatFileSize,
    getFileIcon,
    organizeByFolder
  } = useDocuments(userType);
  
  // États locaux
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedFolder] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  // Dialogs
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showValidateDialog, setShowValidateDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  
  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProductId, setUploadProductId] = useState<string>('');
  const [uploadDocType, setUploadDocType] = useState('autre');
  
  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Share state
  const [shareEmail, setShareEmail] = useState('');
  const [shareCanDownload, setShareCanDownload] = useState(false);
  
  // Validate state
  const [validationNotes, setValidationNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  
  /**
   * Organiser documents en arborescence
   */
  const foldersWithDocs = useMemo(() => {
    return organizeByFolder(documents);
  }, [documents, organizeByFolder]);
  
  /**
   * Filtrer documents selon recherche et filtres
   */
  const filteredDocuments = useMemo(() => {
    let filtered = documents;
    
    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.document_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtre par status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(doc => doc.status === statusFilter);
    }
    
    // Filtre par dossier sélectionné
    if (selectedFolder) {
      if (userType === 'client') {
        filtered = filtered.filter(doc => 
          doc.ProduitEligible?.nom === selectedFolder
        );
      } else if (userType === 'expert' || userType === 'apporteur') {
        filtered = filtered.filter(doc => 
          (doc.Client?.company_name || doc.Client?.name) === selectedFolder
        );
      } else {
        filtered = filtered.filter(doc => doc.document_type === selectedFolder);
      }
    }
    
    return filtered;
  }, [documents, searchTerm, statusFilter, selectedFolder, userType]);
  
  /**
   * Toggle expansion dossier
   */
  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }, []);
  
  /**
   * Handle upload
   */
  const handleUpload = useCallback(async () => {
    if (!uploadFile) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }
    
    try {
      await uploadDocument({
        file: uploadFile,
        produit_id: uploadProductId || undefined,
        document_type: uploadDocType,
        metadata: {
          uploaded_from: 'web_app',
          user_type: userType
        }
      });
      
      // Reset form
      setUploadFile(null);
      setUploadProductId('');
      setUploadDocType('autre');
      setShowUploadDialog(false);
      
    } catch (error) {
      // Toast déjà affiché par le hook
    }
  }, [uploadFile, uploadProductId, uploadDocType, uploadDocument, userType]);
  
  /**
   * Handle preview
   */
  const handlePreview = useCallback(async (doc: Document) => {
    setSelectedDocument(doc);
    
    // Pour PDF, obtenir URL de preview
    if (doc.mime_type?.includes('pdf')) {
      const url = await getPreviewUrl(doc.id);
      setPreviewUrl(url);
    }
    
    setShowPreviewDialog(true);
  }, [getPreviewUrl]);
  
  /**
   * Handle validate
   */
  const handleValidate = useCallback(async () => {
    if (!selectedDocument) return;
    
    try {
      await validateDocument(selectedDocument.id, validationNotes);
      setShowValidateDialog(false);
      setValidationNotes('');
      setSelectedDocument(null);
    } catch (error) {
      // Toast déjà affiché
    }
  }, [selectedDocument, validationNotes, validateDocument]);
  
  /**
   * Handle reject
   */
  const handleReject = useCallback(async () => {
    if (!selectedDocument || !rejectReason) {
      toast.error('Veuillez indiquer une raison');
      return;
    }
    
    try {
      await rejectDocument(selectedDocument.id, rejectReason);
      setShowRejectDialog(false);
      setRejectReason('');
      setSelectedDocument(null);
    } catch (error) {
      // Toast déjà affiché
    }
  }, [selectedDocument, rejectReason, rejectDocument]);
  
  /**
   * Handle share
   */
  const handleShare = useCallback(async () => {
    if (!selectedDocument || !shareEmail) {
      toast.error('Veuillez entrer un email');
      return;
    }
    
    try {
      await shareDocument(selectedDocument.id, {
        email: shareEmail,
        can_download: shareCanDownload
      });
      
      setShowShareDialog(false);
      setShareEmail('');
      setShareCanDownload(false);
      setSelectedDocument(null);
    } catch (error) {
      // Toast déjà affiché
    }
  }, [selectedDocument, shareEmail, shareCanDownload, shareDocument]);
  
  /**
   * Obtenir badge status
   */
  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      validated: { label: 'Validé', className: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejeté', className: 'bg-red-100 text-red-800' }
    };
    
    const statusConfig = config[status as keyof typeof config] || config.pending;
    
    return (
      <Badge className={statusConfig.className}>
        {statusConfig.label}
      </Badge>
    );
  };
  
  /**
   * Permissions selon user type
   */
  const canValidate = userType === 'expert' || userType === 'admin';
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header avec stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">
            📁 {userType === 'client' ? 'Mes Documents' : 
                userType === 'expert' ? 'Documents Clients' :
                userType === 'apporteur' ? 'Documents Prospects' :
                'Gestion Documentaire'}
          </h2>
          <p className="text-slate-600 mt-1">
            {stats ? `${stats.total} document${stats.total > 1 ? 's' : ''} • ${stats.pending} en attente` : 'Chargement...'}
          </p>
        </div>
        
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Upload className="w-4 h-4 mr-2" />
              Uploader un document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>📤 Nouveau document</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Fichier</Label>
                <Input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                />
                {uploadFile && (
                  <p className="text-sm text-slate-500 mt-1">
                    {uploadFile.name} ({formatFileSize(uploadFile.size)})
                  </p>
                )}
              </div>
              
              <div>
                <Label>Type de document</Label>
                <Select value={uploadDocType} onValueChange={setUploadDocType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kbis">KBIS</SelectItem>
                    <SelectItem value="facture">Facture</SelectItem>
                    <SelectItem value="carte_grise">Carte grise</SelectItem>
                    <SelectItem value="fiche_paie">Fiche de paie</SelectItem>
                    <SelectItem value="taxe_fonciere">Taxe foncière</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleUpload} 
                  disabled={!uploadFile || uploading}
                  className="flex-1"
                >
                  {uploading ? 'Upload en cours...' : 'Uploader'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowUploadDialog(false)}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Stats rapides */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-800">{stats.total}</div>
                <div className="text-sm text-slate-600">Total</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-slate-600">En attente</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.validated}</div>
                <div className="text-sm text-slate-600">Validés</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-600">
                  {formatFileSize(stats.total_size || 0)}
                </div>
                <div className="text-sm text-slate-600">Stockage</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Barre de contrôles */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Rechercher un document..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Filtre status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="validated">Validés</SelectItem>
                <SelectItem value="rejected">Rejetés</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Mode d'affichage */}
            <div className="flex gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'tree' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('tree')}
              >
                <FolderOpen className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Contenu principal */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-600">Chargement des documents...</p>
            </div>
          ) : (
            <>
              {/* Vue Arborescence */}
              {viewMode === 'tree' && (
                <div className="space-y-2">
                  {foldersWithDocs.map(folder => (
                    <div key={folder.id} className="border rounded-lg">
                      {/* Dossier */}
                      <button
                        onClick={() => toggleFolder(folder.id)}
                        className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
                      >
                        {expandedFolders.has(folder.id) ? (
                          <ChevronDown className="w-5 h-5 text-slate-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-600" />
                        )}
                        <span className="text-2xl">{folder.icon}</span>
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-slate-800">{folder.name}</div>
                          <div className="text-sm text-slate-500">{folder.count} document{folder.count > 1 ? 's' : ''}</div>
                        </div>
                      </button>
                      
                      {/* Documents du dossier */}
                      <AnimatePresence>
                        {expandedFolders.has(folder.id) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t bg-slate-50/50"
                          >
                            <div className="p-4 space-y-2">
                              {folder.children?.map(doc => (
                                <DocumentRow
                                  key={doc.id}
                                  document={doc}
                                  onView={() => handlePreview(doc)}
                                  onDownload={() => downloadDocument(doc.id)}
                                  onDelete={() => {
                                    setSelectedDocument(doc);
                                    // Trigger delete dialog
                                  }}
                                  onValidate={canValidate ? () => {
                                    setSelectedDocument(doc);
                                    setShowValidateDialog(true);
                                  } : undefined}
                                  onReject={canValidate ? () => {
                                    setSelectedDocument(doc);
                                    setShowRejectDialog(true);
                                  } : undefined}
                                  onFavorite={() => toggleFavorite(doc.id)}
                                  onShare={() => {
                                    setSelectedDocument(doc);
                                    setShowShareDialog(true);
                                  }}
                                  formatFileSize={formatFileSize}
                                  getFileIcon={getFileIcon}
                                  getStatusBadge={getStatusBadge}
                                />
                              ))}
                              
                              {folder.children?.length === 0 && (
                                <div className="text-center py-8 text-slate-500">
                                  Aucun document dans ce dossier
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                  
                  {foldersWithDocs.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600 mb-2">Aucun document</p>
                      <Button onClick={() => setShowUploadDialog(true)}>
                        <Upload className="w-4 h-4 mr-2" />
                        Uploader votre premier document
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Vue Liste */}
              {viewMode === 'list' && (
                <div className="space-y-2">
                  {filteredDocuments.map(doc => (
                    <DocumentRow
                      key={doc.id}
                      document={doc}
                      onView={() => handlePreview(doc)}
                      onDownload={() => downloadDocument(doc.id)}
                      onDelete={() => setSelectedDocument(doc)}
                      onValidate={canValidate ? () => {
                        setSelectedDocument(doc);
                        setShowValidateDialog(true);
                      } : undefined}
                      onReject={canValidate ? () => {
                        setSelectedDocument(doc);
                        setShowRejectDialog(true);
                      } : undefined}
                      onFavorite={() => toggleFavorite(doc.id)}
                      onShare={() => {
                        setSelectedDocument(doc);
                        setShowShareDialog(true);
                      }}
                      formatFileSize={formatFileSize}
                      getFileIcon={getFileIcon}
                      getStatusBadge={getStatusBadge}
                    />
                  ))}
                </div>
              )}
              
              {/* Vue Grille */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredDocuments.map(doc => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      onView={() => handlePreview(doc)}
                      onDownload={() => downloadDocument(doc.id)}
                      formatFileSize={formatFileSize}
                      getFileIcon={getFileIcon}
                      getStatusBadge={getStatusBadge}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Dialog Preview */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>👁️ Aperçu - {selectedDocument?.filename}</DialogTitle>
          </DialogHeader>
          
          <div className="h-[70vh]">
            {selectedDocument?.mime_type?.includes('pdf') && previewUrl ? (
              <iframe
                src={`${previewUrl}#toolbar=0`}
                className="w-full h-full border rounded"
              />
            ) : selectedDocument?.mime_type?.includes('image') && previewUrl ? (
              <img
                src={previewUrl}
                alt={selectedDocument.filename}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <FileIcon className="w-16 h-16 mb-4" />
                <p>Aperçu non disponible pour ce type de fichier</p>
                <Button 
                  onClick={() => selectedDocument && downloadDocument(selectedDocument.id)}
                  className="mt-4"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger pour voir
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Dialog Validate */}
      {canValidate && (
        <Dialog open={showValidateDialog} onOpenChange={setShowValidateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>✅ Valider le document</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Document : <strong>{selectedDocument?.filename}</strong>
              </p>
              
              <div>
                <Label>Notes de validation (optionnel)</Label>
                <Textarea
                  value={validationNotes}
                  onChange={(e) => setValidationNotes(e.target.value)}
                  placeholder="Ex: Document conforme, validé pour traitement"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleValidate} className="flex-1">
                  <Check className="w-4 h-4 mr-2" />
                  Valider
                </Button>
                <Button variant="outline" onClick={() => setShowValidateDialog(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Dialog Reject */}
      {canValidate && (
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>❌ Rejeter le document</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Document : <strong>{selectedDocument?.filename}</strong>
              </p>
              
              <div>
                <Label>Raison du rejet *</Label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ex: Document illisible, informations manquantes..."
                  rows={3}
                  required
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleReject} 
                  variant="destructive" 
                  className="flex-1"
                  disabled={!rejectReason}
                >
                  <X className="w-4 h-4 mr-2" />
                  Rejeter
                </Button>
                <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Dialog Share */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>📤 Partager le document</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Document : <strong>{selectedDocument?.filename}</strong>
            </p>
            
            <div>
              <Label>Email du destinataire</Label>
              <Input
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="email@exemple.com"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="canDownload"
                checked={shareCanDownload}
                onChange={(e) => setShareCanDownload(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="canDownload">Autoriser le téléchargement</Label>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleShare} className="flex-1">
                <Share2 className="w-4 h-4 mr-2" />
                Partager
              </Button>
              <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// COMPOSANTS ENFANTS
// ============================================================================

interface DocumentRowProps {
  document: Document;
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onValidate?: () => void;
  onReject?: () => void;
  onFavorite: () => void;
  onShare: () => void;
  formatFileSize: (bytes: number) => string;
  getFileIcon: (mimeType: string) => string;
  getStatusBadge: (status: string) => JSX.Element;
}

function DocumentRow({
  document,
  onView,
  onDownload,
  onDelete,
  onValidate,
  onReject,
  onFavorite,
  onShare,
  formatFileSize,
  getFileIcon,
  getStatusBadge
}: DocumentRowProps) {
  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors group">
      {/* Icône */}
      <div className="text-3xl">{getFileIcon(document.mime_type || '')}</div>
      
      {/* Infos */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-slate-800 truncate">{document.filename}</div>
        <div className="text-sm text-slate-500 flex items-center gap-2">
          <span>{formatFileSize(document.file_size || 0)}</span>
          <span>•</span>
          <span>{document.document_type}</span>
          <span>•</span>
          <span>{new Date(document.created_at).toLocaleDateString('fr-FR')}</span>
        </div>
      </div>
      
      {/* Status */}
      <div>{getStatusBadge(document.status)}</div>
      
      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="sm" variant="ghost" onClick={onView}>
          <Eye className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onDownload}>
          <Download className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onFavorite}>
          <Star className="w-4 h-4" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onView}>
              <Eye className="w-4 h-4 mr-2" />
              Aperçu
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDownload}>
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Partager
            </DropdownMenuItem>
            
            {onValidate && document.status === 'pending' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onValidate}>
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Valider
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onReject}>
                  <XCircle className="w-4 h-4 mr-2 text-red-600" />
                  Rejeter
                </DropdownMenuItem>
              </>
            )}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

interface DocumentCardProps {
  document: Document;
  onView: () => void;
  onDownload: () => void;
  formatFileSize: (bytes: number) => string;
  getFileIcon: (mimeType: string) => string;
  getStatusBadge: (status: string) => JSX.Element;
}

function DocumentCard({
  document,
  onView,
  onDownload,
  formatFileSize,
  getFileIcon,
  getStatusBadge
}: DocumentCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardContent className="pt-6">
        <div className="text-center space-y-3">
          {/* Icône */}
          <div className="text-5xl mx-auto">
            {getFileIcon(document.mime_type || '')}
          </div>
          
          {/* Nom fichier */}
          <div className="font-medium text-slate-800 truncate px-2" title={document.filename}>
            {document.filename}
          </div>
          
          {/* Taille */}
          <div className="text-sm text-slate-500">
            {formatFileSize(document.file_size || 0)}
          </div>
          
          {/* Status */}
          <div>{getStatusBadge(document.status)}</div>
          
          {/* Actions (visible au hover) */}
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="outline" onClick={onView} className="flex-1">
              <Eye className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={onDownload} className="flex-1">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

