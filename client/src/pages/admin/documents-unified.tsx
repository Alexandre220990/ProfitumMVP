import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Upload,
  Download,
  BarChart3,
  Search,
  Filter,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  FolderOpen,
  Grid3x3,
  List,
  BookOpen,
  Settings,
  TrendingUp,
  Users,
  Clock,
  Star
} from 'lucide-react';
import { config } from '@/config';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface ProcessDocument {
  id: string;
  client_id: string;
  produit_id?: string;
  document_type: string;
  workflow_step?: string;
  filename: string;
  storage_path: string;
  bucket_name: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by?: string;
  uploaded_by_type?: string;
  status: 'pending' | 'validated' | 'rejected';
  validated_by?: string;
  validated_at?: string;
  validation_notes?: string;
  created_at: string;
  Client?: {
    id: string;
    name?: string;
    company_name?: string;
    email: string;
  };
  ProduitEligible?: {
    id: string;
    nom: string;
    categorie: string;
  };
}

interface Documentation {
  id: string;
  title: string;
  description?: string;
  content: string;
  category: string;
  slug?: string;
  tags?: string[];
  is_published: boolean;
  is_featured: boolean;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
  published_at?: string;
}

interface DocumentStats {
  process_clients: {
    total: number;
    pending: number;
    validated: number;
    uploads_this_month: number;
    by_type: Record<string, number>;
  };
  documentation_app: {
    total: number;
    published: number;
    drafts: number;
    total_views: number;
    by_category: Record<string, number>;
  };
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function DocumentsUnified() {
  const [activeTab, setActiveTab] = useState('process');
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch(`${config.API_URL}/api/admin/documents/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setStats(result.data || null);
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                Gestion Documentaire
              </h1>
              <p className="text-gray-600">Pilotez tous vos documents en un seul endroit</p>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Système Actif
            </Badge>
          </div>

          {/* KPI Rapides */}
          {!loading && stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6"
            >
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Docs Process</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.process_clients?.total || 0}
                      </p>
                    </div>
                    <FolderOpen className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Uploads ce mois</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.process_clients?.uploads_this_month || 0}
                      </p>
                    </div>
                    <Upload className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Documentation</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.documentation_app?.published || 0}
                      </p>
                    </div>
                    <BookOpen className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Vues totales</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.documentation_app?.total_views || 0}
                      </p>
                    </div>
                    <Eye className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>

        {/* Tabs Principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white shadow-md p-1">
              <TabsTrigger value="process" className="gap-2">
                <FolderOpen className="w-4 h-4" />
                Docs Process Clients
              </TabsTrigger>
              <TabsTrigger value="documentation" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Documentation App
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Statistiques
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Documents Process Clients */}
            <TabsContent value="process">
              <DocumentsProcessTab onStatsUpdate={loadStats} />
            </TabsContent>

            {/* Tab 2: Documentation App */}
            <TabsContent value="documentation">
              <DocumentationAppTab onStatsUpdate={loadStats} />
            </TabsContent>

            {/* Tab 3: Statistiques */}
            <TabsContent value="stats">
              <DocumentsStatsTab stats={stats} loading={loading} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================================
// TAB 1: DOCUMENTS PROCESS CLIENTS
// ============================================================================

function DocumentsProcessTab({ onStatsUpdate }: { onStatsUpdate: () => void }) {
  const [documents, setDocuments] = useState<ProcessDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'tree'>('tree');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadDocuments();
  }, [statusFilter]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(
        `${config.API_URL}/api/admin/documents/process?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        setDocuments(result.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement documents:', error);
      toast.error('Erreur chargement documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: ProcessDocument) => {
    try {
      const response = await fetch(
        `${config.API_URL}/api/admin/documents/process/${doc.id}/download`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        window.open(result.data.url, '_blank');
        toast.success(`Téléchargement de ${doc.filename}`);
      }
    } catch (error) {
      toast.error('Erreur téléchargement');
    }
  };

  const handleValidate = async (docId: string, status: 'validated' | 'rejected') => {
    try {
      const notes = status === 'rejected' 
        ? prompt('Raison du rejet:') 
        : null;

      const response = await fetch(
        `${config.API_URL}/api/admin/documents/process/${docId}/validate`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status, validation_notes: notes })
        }
      );

      if (response.ok) {
        toast.success(status === 'validated' ? 'Document validé' : 'Document rejeté');
        loadDocuments();
        onStatsUpdate();
      }
    } catch (error) {
      toast.error('Erreur validation');
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Supprimer ce document ?')) return;

    try {
      const response = await fetch(
        `${config.API_URL}/api/admin/documents/process/${docId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        toast.success('Document supprimé');
        loadDocuments();
        onStatsUpdate();
      }
    } catch (error) {
      toast.error('Erreur suppression');
    }
  };

  // Grouper par client pour vue arborescence
  const groupedByClient = documents.reduce((acc, doc) => {
    const clientKey = doc.Client?.company_name || doc.Client?.name || doc.Client?.email || 'Sans client';
    if (!acc[clientKey]) acc[clientKey] = [];
    acc[clientKey].push(doc);
    return acc;
  }, {} as Record<string, ProcessDocument[]>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validated': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-600" />
            Documents Process Clients
          </CardTitle>
          
          <div className="flex items-center gap-3">
            {/* Sélecteur de vue */}
            <div className="flex gap-2 bg-white p-1 rounded-lg shadow-sm">
              <Button
                size="sm"
                variant={viewMode === 'tree' ? 'default' : 'ghost'}
                onClick={() => setViewMode('tree')}
              >
                <FolderOpen className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
            </div>

            <Button className="bg-blue-600 hover:bg-blue-700">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="validated">Validés</option>
            <option value="rejected">Rejetés</option>
          </select>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Aucun document trouvé</p>
          </div>
        ) : viewMode === 'tree' ? (
          /* Vue Arborescence */
          <div className="space-y-4">
            {Object.entries(groupedByClient).map(([clientName, docs]) => (
              <motion.div
                key={clientName}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="border rounded-lg p-4 bg-white"
              >
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  {clientName}
                  <Badge variant="outline">{docs.length} docs</Badge>
                </h3>
                <div className="space-y-2 ml-6">
                  {docs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{doc.filename}</p>
                          <p className="text-sm text-gray-600">
                            {doc.ProduitEligible?.nom || 'Produit non spécifié'} • {doc.document_type}
                          </p>
                        </div>
                        <Badge className={getStatusColor(doc.status)}>
                          {doc.status === 'validated' ? 'Validé' : doc.status === 'rejected' ? 'Rejeté' : 'En attente'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleDownload(doc)}>
                          <Download className="w-4 h-4" />
                        </Button>
                        {doc.status === 'pending' && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => handleValidate(doc.id, 'validated')}>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleValidate(doc.id, 'rejected')}>
                              <XCircle className="w-4 h-4 text-red-600" />
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(doc.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        ) : viewMode === 'list' ? (
          /* Vue Liste */
          <div className="space-y-2">
            {documents.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4 flex-1">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{doc.filename}</p>
                    <p className="text-sm text-gray-600">
                      {doc.Client?.company_name || doc.Client?.name} • {doc.ProduitEligible?.nom}
                    </p>
                  </div>
                  <Badge className={getStatusColor(doc.status)}>
                    {doc.status}
                  </Badge>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleDownload(doc)}>
                      <Download className="w-4 h-4" />
                    </Button>
                    {doc.status === 'pending' && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => handleValidate(doc.id, 'validated')}>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleValidate(doc.id, 'rejected')}>
                          <XCircle className="w-4 h-4 text-red-600" />
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(doc.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Vue Grille */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="h-full border-0 shadow-md hover:shadow-xl transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <FileText className="w-8 h-8 text-blue-500" />
                      <Badge className={getStatusColor(doc.status)}>
                        {doc.status}
                      </Badge>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2 truncate">{doc.filename}</h4>
                    <p className="text-sm text-gray-600 mb-1">{doc.Client?.company_name || doc.Client?.name}</p>
                    <p className="text-sm text-gray-500">{doc.ProduitEligible?.nom}</p>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDownload(doc)}>
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(doc.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// TAB 2: DOCUMENTATION APP
// ============================================================================

function DocumentationAppTab({ onStatsUpdate }: { onStatsUpdate: () => void }) {
  const [docs, setDocs] = useState<Documentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.API_URL}/api/admin/documentation`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setDocs(result.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement documentation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-600" />
            Documentation App
          </CardTitle>
          <div className="flex gap-2">
            <div className="flex gap-1 bg-white p-1 rounded-lg">
              <Button size="sm" variant={viewMode === 'list' ? 'default' : 'ghost'} onClick={() => setViewMode('list')}>
                <List className="w-4 h-4" />
              </Button>
              <Button size="sm" variant={viewMode === 'grid' ? 'default' : 'ghost'} onClick={() => setViewMode('grid')}>
                <Grid3x3 className="w-4 h-4" />
              </Button>
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Upload className="w-4 h-4 mr-2" />
              Nouveau
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Aucune documentation</p>
            <Button className="mt-4">Créer la première</Button>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-3">
            {docs.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4 flex-1">
                  <BookOpen className="w-5 h-5 text-purple-500" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{doc.title}</p>
                    <p className="text-sm text-gray-600">{doc.category}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={doc.is_published ? 'default' : 'outline'}>
                      {doc.is_published ? 'Publié' : 'Brouillon'}
                    </Badge>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {doc.view_count}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {docs.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.03 }}
              >
                <Card className="h-full">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <BookOpen className="w-8 h-8 text-purple-500" />
                      <Badge variant={doc.is_published ? 'default' : 'outline'}>
                        {doc.is_published ? 'Publié' : 'Brouillon'}
                      </Badge>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">{doc.title}</h4>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{doc.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{doc.category}</span>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {doc.view_count}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// TAB 3: STATISTIQUES
// ============================================================================

function DocumentsStatsTab({ stats, loading }: { stats: DocumentStats | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Stats Process Clients */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-600" />
            Documents Process Clients
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-3xl font-bold text-blue-600">{stats?.process_clients?.total || 0}</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600">En attente</p>
              <p className="text-3xl font-bold text-yellow-600">{stats?.process_clients?.pending || 0}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Validés</p>
              <p className="text-3xl font-bold text-green-600">{stats?.process_clients?.validated || 0}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Ce mois</p>
              <p className="text-3xl font-bold text-purple-600">{stats?.process_clients?.uploads_this_month || 0}</p>
            </div>
          </div>

          {stats?.process_clients?.by_type && (
            <div>
              <h4 className="font-bold text-gray-900 mb-3">Par type de document</h4>
              <div className="space-y-2">
                {Object.entries(stats.process_clients.by_type).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{type}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Documentation App */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-600" />
            Documentation App
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-3xl font-bold text-purple-600">{stats?.documentation_app?.total || 0}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Publiés</p>
              <p className="text-3xl font-bold text-green-600">{stats?.documentation_app?.published || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Brouillons</p>
              <p className="text-3xl font-bold text-gray-600">{stats?.documentation_app?.drafts || 0}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600">Vues</p>
              <p className="text-3xl font-bold text-orange-600">{stats?.documentation_app?.total_views || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

