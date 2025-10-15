import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, BookOpen, Tag, Filter, SortAsc, SortDesc, ArrowLeft, Clock, Settings, Calendar, FileText, Download, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { DOCUMENTATION_DATA, searchDocuments } from "@/data/documentation";
import { useAuth } from "@/hooks/use-auth";

// Utilisation des données de documentation Supabase
const DOCUMENTATION_CATEGORIES_UI = [
  { id: 'business', name: 'Documentation métier', description: 'Guides fonctionnels pour chaque profil utilisateur', icon: '👥', color: 'bg-blue-500' },
  { id: 'technical', name: 'Documentation technique', description: 'Documentation technique et architecture', icon: '⚙️', color: 'bg-green-500' }
];

// Fonction pour organiser les documents par catégorie
const organizeDocumentsByCategory = () => {
  const businessDocs = DOCUMENTATION_DATA.filter(doc => doc.category === 'business');
  const technicalDocs = DOCUMENTATION_DATA.filter(doc => doc.category === 'technical');

  return {
    categories: DOCUMENTATION_CATEGORIES_UI.map(category => ({
      ...category,
      items: category.id === 'business' ? businessDocs : technicalDocs
    })),
    stats: {
      totalDocuments: DOCUMENTATION_DATA.length,
      categories: {
        business: businessDocs.length,
        technical: technicalDocs.length
      },
      lastUpdate: new Date()
    }
  };
};

interface DocumentationItem { id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  filePath: string;
  lastModified: Date;
  tags: string[];
  readTime: number }

interface DocumentationCategory { id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  items: DocumentationItem[] }

export default function DocumentationNewPage() {
  const { isLoading } = useAuth();
  const documentationData = organizeDocumentsByCategory();
  const [categories] = useState<DocumentationCategory[]>(documentationData.categories);
  const [stats] = useState(documentationData.stats);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DocumentationItem[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentationItem | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'readTime'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Afficher un loader pendant la vérification
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Fonction de recherche
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return; }

    setIsSearching(true);
    const results = searchDocuments(searchQuery);
    setSearchResults(results);
    setActiveTab('search');
    setIsSearching(false);
  };

  const handleDocumentClick = (document: DocumentationItem) => {
    setSelectedDocument(document);
  };

  // Fonction pour télécharger un document
  const handleDownload = async (doc: DocumentationItem) => {
    try {
      // Simuler le téléchargement
      const link = document.createElement('a');
      link.href = doc.filePath;
      link.download = `${doc.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('📥 Téléchargement démarré');
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  // Fonction pour supprimer un document
  const handleDelete = (doc: DocumentationItem) => {
    setSelectedDocument(doc);
    setShowDeleteDialog(true);
  };

  // Confirmer la suppression
  const confirmDelete = async () => {
    if (!selectedDocument) return;
    
    try {
      // Ici on ferait l'appel API pour supprimer
      console.log('Suppression du document:', selectedDocument.id);
      
      toast.success('🗑️ Document supprimé avec succès');
      setShowDeleteDialog(false);
      setSelectedDocument(null);
      
      // Recharger la liste des documents
      // fetchDocuments();
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // Fonction de tri
  const sortDocuments = (documents: DocumentationItem[]) => { return documents.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'readTime':
          comparison = a.readTime - b.readTime;
          break; }
      
      return sortOrder === 'asc' ? -comparison : comparison;
    });
  };

  // Filtrer et trier les documents
  const getFilteredAndSortedDocuments = () => { 
    let documents: DocumentationItem[] = [];
    
    if (selectedCategory === 'all') {
      categories.forEach(category => {
        documents.push(...category.items); 
      });
    } else { 
      const category = categories.find(cat => cat.id === selectedCategory);
      if (category) {
        documents = category.items; 
      }
    }
    
    return sortDocuments(documents);
  };

  // Utiliser la fonction pour afficher les documents filtrés
  const filteredDocuments = getFilteredAndSortedDocuments();


  const formatDate = (date: Date) => { return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getCategoryColor = (categoryId: string) => { const category = categories.find(cat => cat.id === categoryId);
    return category?.color || 'bg-gray-500'; };

  return (
    <div className="app-professional min-h-screen">
      <div className="container mx-auto p-6 space-y-6">
      { /* Header */ }
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📚 Documentation</h1>
          <p className="text-gray-600 mt-2">
            Centre de documentation et guides du projet FinancialTracker
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={ () => window.location.href = '/admin/admin-document-upload' } 
            className="flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Gestion GED</span>
          </Button>
          <Button onClick={ () => window.history.back() } variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>

      { /* Statistiques */ }
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold">{ stats.totalDocuments }</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Tag className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Catégories</p>
                <p className="text-2xl font-bold">{ categories.length }</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Temps de lecture</p>
                <p className="text-2xl font-bold">
                  { categories.reduce((total, cat) => 
                    total + cat.items.reduce((sum, item) => sum + item.readTime, 0), 0
                  ) } min
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Dernière mise à jour</p>
                <p className="text-2xl font-bold">{ formatDate(stats.lastUpdate).split(' ')[0] }</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      { /* Barre de recherche et filtres */ }
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher dans la documentation..."
                  value={ searchQuery }
                  onChange={ (e) => setSearchQuery(e.target.value) }
                  onKeyPress={ (e) => e.key === 'Enter' && handleSearch() }
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={ selectedCategory } onValueChange={ setSelectedCategory }>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  { categories.map(category => (
                    <SelectItem key={category.id } value={ category.id }>
                      { category.icon } { category.name }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={ sortBy } onValueChange={ (value: 'date' | 'title' | 'readTime') => setSortBy(value) }>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="title">Titre</SelectItem>
                  <SelectItem value="readTime">Temps</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={ () => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc') }
              >
                { sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" /> }
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      { /* Contenu principal */ }
      <Tabs value={ activeTab } onValueChange={ setActiveTab } className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="search">Recherche</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          { categories.map(category => (
            <Card key={category.id }>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-2xl">{ category.icon }</span>
                  <span>{ category.name }</span>
                  <Badge variant="secondary">{ category.items.length } document(s)</Badge>
                </CardTitle>
                <p className="text-gray-600">{ category.description }</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  { (selectedCategory === 'all' || selectedCategory === category.id ? filteredDocuments.filter(doc => doc.category === category.id) : []).map(item => (
                    <Card key={item.id } className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4" onClick={ () => handleDocumentClick(item) }>
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-lg">{ item.title }</h3>
                          <Badge variant="outline" className={ getCategoryColor(item.category) }>
                            { item.readTime } min
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{ item.description }</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{ formatDate(item.lastModified) }</span>
                          <div className="flex space-x-1">
                            { item.tags.slice(0, 2).map(tag => (
                              <Badge key={tag } variant="secondary" className="text-xs">
                                { tag }
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(item);
                            }}
                            className="flex-1"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Télécharger
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDocumentClick(item);
                            }}
                            className="flex-1"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Consulter
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          { isSearching ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map(item => (
                <Card key={item.id } className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4" onClick={ () => handleDocumentClick(item) }>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{ item.title }</h3>
                      <Badge variant="outline" className={ getCategoryColor(item.category) }>
                        { item.readTime } min
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{ item.description }</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{ formatDate(item.lastModified) }</span>
                      <div className="flex space-x-1">
                        { item.tags.slice(0, 2).map(tag => (
                          <Badge key={tag } variant="secondary" className="text-xs">
                            { tag }
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(item);
                        }}
                        className="flex-1"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Télécharger
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDocumentClick(item);
                        }}
                        className="flex-1"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Consulter
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun document trouvé pour "{ searchQuery }"</p>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>

      { /* Modal de document */ }
      <Dialog open={ !!selectedDocument } onOpenChange={ () => setSelectedDocument(null) }>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{ selectedDocument?.title }</span>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className={ getCategoryColor(selectedDocument?.category || '') }>
                  { selectedDocument?.readTime } min
                </Badge>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="prose prose-sm max-w-none">
              <div dangerouslySetInnerHTML={ { __html: selectedDocument?.content || '' }} />
            </div>
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Dernière modification : { selectedDocument ? formatDate(selectedDocument.lastModified) : '' }</span>
                <div className="flex space-x-2">
                  { selectedDocument?.tags.map(tag => (
                    <Badge key={tag } variant="secondary" className="text-xs">
                      { tag }
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Modale de confirmation de suppression */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Confirmer la suppression
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Êtes-vous sûr de vouloir supprimer le document 
              <strong> "{selectedDocument?.title}"</strong> ?
            </p>
            <p className="text-sm text-gray-500">
              Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
} 