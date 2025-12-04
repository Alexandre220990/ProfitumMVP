import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { config } from "@/config/env";
import { getSupabaseToken } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, Eye, FileText, Tag, User, Calendar } from "lucide-react";

interface Document { 
  id: string;
  title: string;
  content: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  author: string;
  tags: string[] 
}

interface DocumentStats { 
  total: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>; 
}

const DocumentationManager: React.FC = () => { 
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // État pour le modal d'édition/création
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [formData, setFormData] = useState({
    title: '', 
    category: '', 
    content: '', 
    status: 'draft' as 'draft' | 'published' | 'archived' 
  });

  // Catégories disponibles
  const categories = [
    'Migration',
    'Planification', 
    'Utilisation',
    'Technique',
    'Sécurité',
    'Maintenance',
    'Support'
  ];

  // Charger les documents
  const loadDocuments = async () => { 
    try {
      setLoading(true);
      const response = await fetch(`${config.API_URL}/api/admin/documents`, {
        headers: {
          'Authorization': `Bearer ${await getSupabaseToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) { 
        const data = await response.json();
        setDocuments(data.documents || []); 
      }
    } catch (error) { 
      console.error('Erreur chargement documents: ', error); 
    } finally { 
      setLoading(false); 
    }
  };

  // Charger les statistiques
  const loadStats = async () => { 
    try {
      const response = await fetch(`${config.API_URL}/api/admin/documents/stats`, {
        headers: {
          'Authorization': `Bearer ${await getSupabaseToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) { 
        const data = await response.json();
        setStats(data.stats); 
      }
    } catch (error) { 
      console.error('Erreur chargement stats: ', error); 
    }
  };

  // Rechercher des documents
  const searchDocuments = async () => { 
    if (!searchQuery.trim()) {
      loadDocuments();
      return; 
    }

    try { 
      const response = await fetch(`/api/admin/documents/search/${encodeURIComponent(searchQuery)}`, { 
        headers: {
          'Authorization': `Bearer ${await getSupabaseToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) { 
        const data = await response.json();
        setDocuments(data.documents || []); 
      }
    } catch (error) { 
      console.error('Erreur recherche: ', error); 
    }
  };

  // Créer/Modifier un document
  const saveDocument = async () => { 
    try {
      const url = editingDocument 
        ? `/api/admin/documents/${editingDocument.id}`
        : '/api/admin/documents';
      
      const method = editingDocument ? 'PUT' : 'POST';
      
      const response = await fetch(url, { 
        method, 
        headers: {
          'Authorization': `Bearer ${await getSupabaseToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) { 
        setIsModalOpen(false);
        setEditingDocument(null);
        setFormData({ title: '', category: '', content: '', status: 'draft' });
        loadDocuments();
        loadStats();
      }
    } catch (error) { 
      console.error('Erreur sauvegarde document: ', error);
    }
  };

  // Supprimer un document
  const deleteDocument = async (id: string) => { 
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return; 
    }

    try { 
      const response = await fetch(`/api/admin/documents/${id}`, { 
        method: 'DELETE', 
        headers: {
          'Authorization': `Bearer ${await getSupabaseToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) { 
        loadDocuments();
        loadStats(); 
      }
    } catch (error) { 
      console.error('Erreur suppression document: ', error); 
    }
  };

  // Ouvrir le modal d'édition
  const openEditModal = (document: Document) => { 
    setEditingDocument(document);
    setFormData({
      title: document.title, 
      category: document.category, 
      content: document.content, 
      status: document.status 
    });
    setIsModalOpen(true);
  };

  // Ouvrir le modal de création
  const openCreateModal = () => { 
    setEditingDocument(null);
    setFormData({ 
      title: '', 
      category: '', 
      content: '', 
      status: 'draft' 
    });
    setIsModalOpen(true);
  };

  // Filtrer les documents
  const filteredDocuments = documents.filter(doc => { 
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus;
    return matchesCategory && matchesStatus; 
  });

  useEffect(() => { 
    loadDocuments();
    loadStats(); 
  }, []);

  useEffect(() => { 
    const timeoutId = setTimeout(searchDocuments, 500);
    return () => clearTimeout(timeoutId); 
  }, [searchQuery]);

  if (loading) { 
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Chargement de la documentation...</div>
      </div>
    ); 
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion Documentaire</h1>
          <p className="text-muted-foreground">
            Gérez toute la documentation du projet FinancialTracker
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Document
        </Button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Documents</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <Card key={status}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Tag className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground capitalize">{status}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher dans les documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="published">Publié</SelectItem>
                <SelectItem value="archived">Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des documents */}
      <div className="grid gap-4">
        {filteredDocuments.map((document) => (
          <Card key={document.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold">{document.title}</h3>
                    <Badge variant={document.status === 'published' ? 'default' : 'secondary'}>
                      {document.status === 'published' ? 'Publié' : 
                       document.status === 'draft' ? 'Brouillon' : 'Archivé'}
                    </Badge>
                    <Badge variant="outline">{document.category}</Badge>
                  </div>
                  <p className="text-muted-foreground mb-4 line-clamp-3">
                    {document.content.substring(0, 200)}...
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{document.author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(document.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText className="w-4 h-4" />
                      <span>v1.0</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(document)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/api/admin/documents/${document.id}`, '_blank')}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteDocument(document.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun document trouvé</h3>
            <p className="text-muted-foreground">
              {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'Aucun document ne correspond à vos critères de recherche.'
                : 'Commencez par créer votre premier document.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal d'édition/création */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDocument ? 'Modifier le document' : 'Nouveau document'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Titre du document"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select value={formData.category} onValueChange={(value: string) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select value={formData.status} onValueChange={(value: string) => setFormData({...formData, status: value as 'draft' | 'published' | 'archived'})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="published">Publié</SelectItem>
                    <SelectItem value="archived">Archivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Contenu</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                placeholder="Contenu du document..."
                rows={10}
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={saveDocument}>
                {editingDocument ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentationManager; 