import { useState, useEffect } from 'react';
import { useGED } from '@/hooks/use-ged';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Search, 
  FileText, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  Share2,
  Tag,
  Calendar,
  User,
  Clock,
  BookOpen,
  Settings,
  FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface DocumentManagerProps {
  className?: string;
}

export function DocumentManager({ className }: DocumentManagerProps) {
  const { documents, labels, loading, loadDocuments, loadLabels, createDocument, updateDocument, deleteDocument } = useGED();
  const { toast } = useToast();

  // États locaux
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    search: '',
    labels: [] as string[]
  });
  const [sortBy, setSortBy] = useState('last_modified');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // États pour la création/édition
  const [documentData, setDocumentData] = useState({
    title: '',
    description: '',
    content: '',
    category: 'business' as 'business' | 'technical',
    labels: [] as string[],
    read_time: 5
  });

  // Charger les données au montage
  useEffect(() => {
    loadDocuments();
    loadLabels();
  }, [loadDocuments, loadLabels]);

  // Gérer la création d'un document
  const handleCreateDocument = async () => {
    try {
      await createDocument(documentData);
      setShowCreateDialog(false);
      setDocumentData({
        title: '',
        description: '',
        content: '',
        category: 'business',
        labels: [],
        read_time: 5
      });
      loadDocuments();
      toast({
        title: 'Succès',
        description: 'Document créé avec succès'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors de la création du document'
      });
    }
  };

  // Gérer la modification d'un document
  const handleUpdateDocument = async () => {
    if (!selectedDocument) return;

    try {
      await updateDocument(selectedDocument.id, documentData);
      setShowEditDialog(false);
      setSelectedDocument(null);
      loadDocuments();
      toast({
        title: 'Succès',
        description: 'Document modifié avec succès'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors de la modification du document'
      });
    }
  };

  // Gérer la suppression d'un document
  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;

    try {
      await deleteDocument(documentId);
      loadDocuments();
      toast({
        title: 'Succès',
        description: 'Document supprimé avec succès'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors de la suppression du document'
      });
    }
  };

  // Filtrer les documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCategory = filters.category === 'all' || doc.category === filters.category;
    const matchesLabels = filters.labels.length === 0 || 
                         filters.labels.some(label => doc.labels?.some((l: any) => l.name === label));
    
    return matchesSearch && matchesCategory && matchesLabels;
  });

  // Trier les documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    const aValue = a[sortBy as keyof typeof a];
    const bValue = b[sortBy as keyof typeof b];
    
    // Gérer les valeurs undefined
    if (aValue === undefined && bValue === undefined) return 0;
    if (aValue === undefined) return 1;
    if (bValue === undefined) return -1;
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Formater la date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Obtenir la couleur de catégorie
  const getCategoryColor = (category: string) => {
    return category === 'business' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };

  if (loading && documents.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-96", className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion Documentaire</h1>
          <p className="text-gray-600">Gérez tous les documents de la plateforme</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <FolderOpen className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
          </Button>
          
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Document
          </Button>
        </div>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher des documents..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes les catégories</option>
              <option value="business">Métier</option>
              <option value="technical">Technique</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="last_modified">Dernière modification</option>
              <option value="title">Titre</option>
              <option value="created_at">Date de création</option>
              <option value="read_time">Temps de lecture</option>
            </select>
            
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold">{documents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Documents Métier</p>
                <p className="text-2xl font-bold">
                  {documents.filter(d => d.category === 'business').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Documents Techniques</p>
                <p className="text-2xl font-bold">
                  {documents.filter(d => d.category === 'technical').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Tag className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Labels Utilisés</p>
                <p className="text-2xl font-bold">{labels.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des documents */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedDocuments.map((document) => (
            <Card key={document.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{document.title}</CardTitle>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                      {document.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedDocument(document);
                        setDocumentData({
                          title: document.title,
                          description: document.description || '',
                          content: document.content,
                          category: document.category,
                          labels: document.labels?.map((l: any) => l.name) || [],
                          read_time: document.read_time
                        });
                        setShowEditDialog(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDocument(document.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Catégorie et labels */}
                  <div className="flex items-center space-x-2">
                    <Badge className={getCategoryColor(document.category)}>
                      {document.category === 'business' ? 'Métier' : 'Technique'}
                    </Badge>
                    
                    {document.labels?.map((label: any) => (
                      <Badge key={label.id} variant="outline" style={{ backgroundColor: label.color + '20', color: label.color }}>
                        {label.name}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Métadonnées */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{document.read_time} min</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(document.last_modified)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>v{document.version}</span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-2 border-t">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-3 w-3 mr-1" />
                      Voir
                    </Button>
                    
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="h-3 w-3 mr-1" />
                      Télécharger
                    </Button>
                    
                    <Button variant="outline" size="sm">
                      <Share2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="divide-y">
                {sortedDocuments.map((document) => (
                  <div key={document.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <FileText className="h-8 w-8 text-blue-600" />
                        
                        <div className="flex-1">
                          <h3 className="font-medium">{document.title}</h3>
                          <p className="text-sm text-gray-600 line-clamp-1">
                            {document.description}
                          </p>
                          
                          <div className="flex items-center space-x-4 mt-2">
                            <Badge className={getCategoryColor(document.category)}>
                              {document.category === 'business' ? 'Métier' : 'Technique'}
                            </Badge>
                            
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>{document.read_time} min</span>
                            </div>
                            
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(document.last_modified)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDocument(document);
                            setDocumentData({
                              title: document.title,
                              description: document.description || '',
                              content: document.content,
                              category: document.category,
                              labels: document.labels?.map((l: any) => l.name) || [],
                              read_time: document.read_time
                            });
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(document.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Dialog de création */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Nouveau Document</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre</label>
                <Input
                  value={documentData.title}
                  onChange={(e) => setDocumentData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Titre du document"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  value={documentData.description}
                  onChange={(e) => setDocumentData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description du document"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Catégorie</label>
                <select
                  value={documentData.category}
                  onChange={(e) => setDocumentData(prev => ({ ...prev, category: e.target.value as 'business' | 'technical' }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="business">Métier</option>
                  <option value="technical">Technique</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Contenu</label>
                <textarea
                  value={documentData.content}
                  onChange={(e) => setDocumentData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Contenu du document (Markdown supporté)"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={10}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Temps de lecture (minutes)</label>
                <Input
                  type="number"
                  value={documentData.read_time}
                  onChange={(e) => setDocumentData(prev => ({ ...prev, read_time: parseInt(e.target.value) }))}
                  min="1"
                  max="60"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateDocument}>
                Créer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog d'édition */}
      {showEditDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Modifier le Document</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre</label>
                <Input
                  value={documentData.title}
                  onChange={(e) => setDocumentData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Titre du document"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  value={documentData.description}
                  onChange={(e) => setDocumentData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description du document"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Catégorie</label>
                <select
                  value={documentData.category}
                  onChange={(e) => setDocumentData(prev => ({ ...prev, category: e.target.value as 'business' | 'technical' }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="business">Métier</option>
                  <option value="technical">Technique</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Contenu</label>
                <textarea
                  value={documentData.content}
                  onChange={(e) => setDocumentData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Contenu du document (Markdown supporté)"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={10}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Temps de lecture (minutes)</label>
                <Input
                  type="number"
                  value={documentData.read_time}
                  onChange={(e) => setDocumentData(prev => ({ ...prev, read_time: parseInt(e.target.value) }))}
                  min="1"
                  max="60"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateDocument}>
                Modifier
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 