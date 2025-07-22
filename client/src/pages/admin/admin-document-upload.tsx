import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileText, 
  BookOpen, 
  Settings, 
  Shield, 
  Eye,
  Clock,
  Download,
  Trash2,
  Edit,
  Target,
  RefreshCw,
  X,
  Search,
  ExternalLink,
  ArrowLeft,
  Users,
  Plus
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import AdvancedTargetSelector, { Target as TargetType } from "@/components/admin/AdvancedTargetSelector";
import api from '@/lib/api';

interface AdminDocument {
  id?: string;
  title: string;
  description?: string;
  category: 'guide' | 'documentation' | 'procedure' | 'security' | 'compliance';
  file_path?: string;
  original_filename?: string;
  file_size?: number;
  mime_type?: string;
  access_level: 'public' | 'private' | 'restricted' | 'confidential';
  targets?: TargetType[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface GuideTemplate {
  id: string;
  title: string;
  description: string;
  category: 'guide' | 'documentation' | 'procedure' | 'security' | 'compliance';
  file_path: string;
  priority: 'high' | 'medium' | 'low';
  last_updated: string;
  status: 'ready' | 'needs_update' | 'outdated';
}

export default function AdminEnhancedDocumentUploadPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Partial<AdminDocument>>({});
  const [selectedTargets, setSelectedTargets] = useState<TargetType[]>([]);
  const [documentAccessLevel, setDocumentAccessLevel] = useState<'public' | 'private' | 'restricted' | 'confidential'>('private');
  const [activeTab, setActiveTab] = useState('upload');
  const [loading, setLoading] = useState(true);
  
  // États pour la prévisualisation et recherche
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<AdminDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState<AdminDocument[]>([]);

  // Templates de guides disponibles
  const guideTemplates: GuideTemplate[] = [
    {
      id: 'ged-admin',
      title: 'Guide GED Admin Améliorée',
      description: 'Guide complet de la Gestion Électronique Documentaire admin avec ciblage avancé',
      category: 'guide',
      file_path: 'GUIDE-GED-ADMIN-AMELIORE.md',
      priority: 'high',
      last_updated: '2025-01-15',
      status: 'ready'
    },
    {
      id: 'calendar-advanced',
      title: 'Guide Calendrier Avancé',
      description: 'Utilisation avancée du système de calendrier et gestion des événements',
      category: 'guide',
      file_path: 'GUIDE-CALENDRIER-AVANCE.md',
      priority: 'high',
      last_updated: '2025-01-10',
      status: 'ready'
    },
    {
      id: 'workflows-business',
      title: 'Guide Workflows Business',
      description: 'Gestion des workflows métier et processus automatisés',
      category: 'procedure',
      file_path: 'GUIDE-UTILISATION-WORKFLOWS.md',
      priority: 'high',
      last_updated: '2025-01-12',
      status: 'ready'
    },
    {
      id: 'ticpe-integration',
      title: 'Guide Intégration TICPE Conditionnelle',
      description: 'Intégration et configuration du système TICPE conditionnel',
      category: 'guide',
      file_path: 'GUIDE-INTEGRATION-TICPE-CONDITIONNELLE.md',
      priority: 'medium',
      last_updated: '2025-01-08',
      status: 'ready'
    },
    {
      id: 'compliance-installation',
      title: 'Guide Installation Compliance',
      description: 'Installation et configuration du système de compliance',
      category: 'compliance',
      file_path: 'GUIDE-INSTALLATION-COMPLIANCE.md',
      priority: 'high',
      last_updated: '2025-01-05',
      status: 'ready'
    },
    {
      id: 'document-verification',
      title: 'Guide Vérification Documentaire',
      description: 'Processus de vérification et validation documentaire',
      category: 'procedure',
      file_path: 'GUIDE-VERIFICATION-DOCUMENTAIRE.md',
      priority: 'medium',
      last_updated: '2025-01-03',
      status: 'ready'
    },
    {
      id: 'notification-fusion',
      title: 'Guide Fusion Notifications',
      description: 'Fusion et unification du système de notifications',
      category: 'guide',
      file_path: 'GUIDE-FUSION-NOTIFICATIONS.md',
      priority: 'medium',
      last_updated: '2025-01-02',
      status: 'ready'
    },
    {
      id: 'nomenclature-unification',
      title: 'Guide Unification Nomenclature',
      description: 'Standardisation et unification des nomenclatures',
      category: 'guide',
      file_path: 'GUIDE-UNIFICATION-NOMENCLATURE.md',
      priority: 'low',
      last_updated: '2024-12-30',
      status: 'needs_update'
    },
    {
      id: 'database-complete',
      title: 'Documentation Base de Données Complète',
      description: 'Documentation complète de la structure de base de données',
      category: 'documentation',
      file_path: 'DOCUMENTATION-BASE-DONNEES-COMPLETE.md',
      priority: 'high',
      last_updated: '2025-01-14',
      status: 'ready'
    },
    {
      id: 'supabase-tables',
      title: 'Documentation Tables Supabase',
      description: 'Structure détaillée des tables Supabase',
      category: 'documentation',
      file_path: 'DOCUMENTATION-TABLES-SUPABASE.md',
      priority: 'medium',
      last_updated: '2025-01-10',
      status: 'ready'
    },
    {
      id: 'migration-session',
      title: 'Documentation Migration Session',
      description: 'Processus de migration des sessions utilisateur',
      category: 'documentation',
      file_path: 'DOCUMENTATION-MIGRATION-SESSION.md',
      priority: 'medium',
      last_updated: '2025-01-08',
      status: 'ready'
    },
    {
      id: 'ticpe-simulator',
      title: 'Guide Simulateur TICPE',
      description: 'Utilisation du simulateur TICPE avancé',
      category: 'guide',
      file_path: 'server/docs/GUIDE_SIMULATEUR_TICPE.md',
      priority: 'high',
      last_updated: '2025-01-12',
      status: 'ready'
    },
    {
      id: 'ticpe-complete',
      title: 'Documentation TICPE Complète',
      description: 'Documentation complète du système TICPE',
      category: 'documentation',
      file_path: 'server/docs/DOCUMENTATION_TICPE_COMPLETE.md',
      priority: 'high',
      last_updated: '2025-01-10',
      status: 'ready'
    },
    {
      id: 'dashboard-usage',
      title: 'Guide Utilisation Dashboard',
      description: 'Guide complet d\'utilisation des dashboards',
      category: 'guide',
      file_path: 'server/docs/GUIDE_UTILISATION_DASHBOARD.md',
      priority: 'medium',
      last_updated: '2025-01-05',
      status: 'ready'
    },
    {
      id: 'operational-procedures',
      title: 'Procédures Opérationnelles',
      description: 'Procédures opérationnelles et bonnes pratiques',
      category: 'procedure',
      file_path: 'server/docs/OPERATIONAL_PROCEDURES.md',
      priority: 'high',
      last_updated: '2025-01-15',
      status: 'ready'
    }
  ];

  // State pour la gestion des métadonnées par fichier
  const [fileMetadata, setFileMetadata] = useState<{
    title: string;
    description: string;
    category: 'guide' | 'documentation' | 'procedure' | 'security' | 'compliance';
    access_level: 'public' | 'private' | 'restricted' | 'confidential';
  }[]>([]);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/documents');
      if (response.data.success) {
        setDocuments(response.data.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: GuideTemplate) => {
    setEditingDocument({
      title: template.title,
      description: template.description,
      category: template.category,
      access_level: 'private'
    });
    setDocumentAccessLevel('private');
    setSelectedTargets([]);
    setShowUploadDialog(true);
  };

  const updateFileMetadata = (index: number, key: string, value: any) => {
    setFileMetadata(prev => prev.map((meta, i) => 
      i === index ? { ...meta, [key]: value } : meta
    ));
  };

  const uploadDocument = async () => {
    if (!selectedFiles.length || !fileMetadata.length) {
      alert('Veuillez sélectionner un fichier et remplir les métadonnées');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Upload en séquence pour chaque fichier
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const metadata = fileMetadata[i];
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', metadata.title);
        formData.append('description', metadata.description || '');
        formData.append('category', metadata.category);
        formData.append('access_level', metadata.access_level);
        formData.append('targets', JSON.stringify(selectedTargets));
        formData.append('is_active', 'true');

        const response = await api.post('/admin/documents/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            setUploadProgress(progress);
          },
        });

        if (response.data.success) {
          console.log(`Fichier ${i + 1}/${selectedFiles.length} uploadé avec succès`);
        } else {
          throw new Error(`Erreur lors de l'upload du fichier ${file.name}`);
        }
      }

      alert('Tous les fichiers ont été uploadés avec succès !');
      setShowUploadDialog(false);
      setEditingDocument({});
      setSelectedFiles([]);
      setFileMetadata([]);
      setSelectedTargets([]);
      setDocumentAccessLevel('private');
      loadDocuments();
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      alert('Erreur lors de l\'upload du document');
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      try {
        await api.delete(`/admin/documents/${documentId}`);
        loadDocuments();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  // Fonction pour ouvrir la prévisualisation
  const handlePreviewDocument = (document: AdminDocument) => {
    setPreviewDocument(document);
    setShowPreviewDialog(true);
  };

  // Fonction pour fermer la prévisualisation
  const handleClosePreview = () => {
    setShowPreviewDialog(false);
    setPreviewDocument(null);
  };

  // Fonction pour modifier un document existant
  const handleEditDocument = (document: AdminDocument) => {
    setEditingDocument(document);
    setSelectedTargets(document.targets || []);
    setDocumentAccessLevel(document.access_level || 'private');
    setSelectedFiles([]);
    setFileMetadata([]);
    setShowUploadDialog(true);
  };

  // Fonction pour sauvegarder les modifications d'un document
  const saveDocumentChanges = async () => {
    if (!editingDocument.id) {
      alert('Document non trouvé');
      return;
    }

    try {
      setUploading(true);
      
      const updateData: Partial<AdminDocument> = {
        title: editingDocument.title,
        description: editingDocument.description,
        category: editingDocument.category,
        access_level: documentAccessLevel,
        targets: selectedTargets,
        is_active: editingDocument.is_active
      };

      // Si un nouveau fichier est sélectionné, l'uploader
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        formData.append('file', selectedFiles[0]);
        formData.append('title', editingDocument.title || '');
        formData.append('description', editingDocument.description || '');
        formData.append('category', editingDocument.category || 'guide');
        formData.append('access_level', documentAccessLevel);
        formData.append('targets', JSON.stringify(selectedTargets));
        formData.append('is_active', 'true');

        await api.put(`/admin/documents/${editingDocument.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Sinon, mettre à jour seulement les métadonnées
        await api.put(`/admin/documents/${editingDocument.id}`, updateData);
      }

      alert('Document modifié avec succès !');
      setShowUploadDialog(false);
      setEditingDocument({});
      setSelectedFiles([]);
      setFileMetadata([]);
      setSelectedTargets([]);
      setDocumentAccessLevel('private');
      loadDocuments();
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      alert('Erreur lors de la modification du document');
    } finally {
      setUploading(false);
    }
  };

  // Fonction pour filtrer les documents selon la recherche
  const filterDocuments = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredDocuments(documents);
      return;
    }
    
    const filtered = documents.filter(doc => 
      doc.title.toLowerCase().includes(query.toLowerCase()) ||
      doc.description?.toLowerCase().includes(query.toLowerCase()) ||
      doc.original_filename?.toLowerCase().includes(query.toLowerCase()) ||
      doc.category.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredDocuments(filtered);
  };

  // Effet pour filtrer les documents quand la recherche change
  useEffect(() => {
    filterDocuments(searchQuery);
  }, [documents, searchQuery]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'needs_update': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'outdated': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'guide': return <BookOpen className="w-4 h-4" />;
      case 'documentation': return <FileText className="w-4 h-4" />;
      case 'procedure': return <Settings className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
      case 'compliance': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement de l'espace admin...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-professional min-h-screen">
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📚 Upload Documents Admin</h1>
          <p className="text-gray-600 mt-2">
            Gestion des guides et documentation pour l'administration
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.history.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Documents Admin</p>
                <p className="text-2xl font-bold">{documents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Guides Disponibles</p>
                <p className="text-2xl font-bold">{guideTemplates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Prêts à Upload</p>
                <p className="text-2xl font-bold">{guideTemplates.filter(g => g.status === 'ready').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Rôle</p>
                <p className="text-2xl font-bold capitalize">{user?.type || 'Admin'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets principaux */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Manuel
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Guides Prêts
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Documents Existants
          </TabsTrigger>
        </TabsList>

        {/* Onglet Upload Manuel */}
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload de Document
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Zone de drag & drop */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
                  onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
                  onDrop={e => {
                    e.preventDefault();
                    setDragActive(false);
                    const files = Array.from(e.dataTransfer.files);
                    setSelectedFiles(prev => [...prev, ...files]);
                    setFileMetadata(prev => [...prev, ...files.map(f => ({
                      title: f.name.replace(/\.[^/.]+$/, ''),
                      description: '',
                      category: 'guide' as const,
                      access_level: 'private' as const
                    }))]);
                  }}
                >
                  <p className="text-gray-600 mb-2">Glissez-déposez un ou plusieurs fichiers ici</p>
                  <Button asChild variant="outline">
                    <label>
                      <Upload className="w-4 h-4 mr-2" />
                      Sélectionner des fichiers
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={e => {
                          if (e.target.files) {
                            const files = Array.from(e.target.files);
                            setSelectedFiles(prev => [...prev, ...files]);
                            setFileMetadata(prev => [...prev, ...files.map(f => ({
                              title: f.name.replace(/\.[^/.]+$/, ''),
                              description: '',
                              category: 'guide' as const,
                              access_level: 'private' as const
                            }))]);
                          }
                        }}
                      />
                    </label>
                  </Button>
                </div>

                {/* Liste des fichiers sélectionnés */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-semibold text-sm mb-2">Fichiers sélectionnés :</h4>
                    <ul className="space-y-1">
                      {selectedFiles.map((file, idx) => (
                        <li key={file.name + idx} className="flex items-center gap-2 bg-white rounded px-3 py-2 border">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <span className="flex-1 truncate">{file.name}</span>
                          <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          <Button size="icon" variant="ghost" onClick={() => {
                            setSelectedFiles(selectedFiles.filter((_, i) => i !== idx));
                            setFileMetadata(fileMetadata.filter((_, i) => i !== idx));
                          }}>
                            <X className="w-4 h-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Formulaire de métadonnées (pour chaque fichier) */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm">Configuration des métadonnées :</h4>
                    {selectedFiles.map((file, idx) => (
                      <Card key={file.name + idx} className="p-4">
                        <div className="flex items-center gap-3 mb-4">
                          <FileText className="w-6 h-6 text-blue-500" />
                          <div className="flex-1">
                            <h5 className="font-medium">{file.name}</h5>
                            <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`title-${idx}`}>Titre *</Label>
                            <Input
                              id={`title-${idx}`}
                              value={fileMetadata[idx]?.title || file.name.replace(/\.[^/.]+$/, '')}
                              onChange={(e) => updateFileMetadata(idx, 'title', e.target.value)}
                              placeholder="Titre du document"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`category-${idx}`}>Catégorie *</Label>
                            <Select 
                              value={fileMetadata[idx]?.category || 'guide'} 
                              onValueChange={(value: string) => updateFileMetadata(idx, 'category', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="guide">Guide</SelectItem>
                                <SelectItem value="documentation">Documentation</SelectItem>
                                <SelectItem value="procedure">Procédure</SelectItem>
                                <SelectItem value="security">Sécurité</SelectItem>
                                <SelectItem value="compliance">Conformité</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <Label htmlFor={`description-${idx}`}>Description</Label>
                          <Textarea
                            id={`description-${idx}`}
                            value={fileMetadata[idx]?.description || ''}
                            onChange={(e) => updateFileMetadata(idx, 'description', e.target.value)}
                            placeholder="Description du document"
                            rows={2}
                          />
                        </div>
                        
                        <div className="mt-4">
                          <Label htmlFor={`access-${idx}`}>Niveau d'accès</Label>
                          <Select 
                            value={fileMetadata[idx]?.access_level || 'private'} 
                            onValueChange={(value: string) => updateFileMetadata(idx, 'access_level', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">Public</SelectItem>
                              <SelectItem value="private">Privé</SelectItem>
                              <SelectItem value="restricted">Restreint</SelectItem>
                              <SelectItem value="confidential">Confidentiel</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                <Button 
                  onClick={() => setShowUploadDialog(true)}
                  disabled={!selectedFiles.length || !fileMetadata.length}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Configurer et Uploader
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Guides Prêts */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Guides et Documentation Prêts</h2>
            <Button onClick={loadDocuments} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guideTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(template.category)}
                      <Badge variant="outline" className={getPriorityColor(template.priority)}>
                        {template.priority}
                      </Badge>
                    </div>
                    <Badge variant="outline" className={getStatusColor(template.status)}>
                      {template.status === 'ready' ? 'Prêt' : template.status === 'needs_update' ? 'Mise à jour' : 'Obsolète'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold text-lg mb-2">{template.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>Mis à jour: {new Date(template.last_updated).toLocaleDateString('fr-FR')}</span>
                    <span className="capitalize">{template.category}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleTemplateSelect(template)}
                      className="flex-1"
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Upload
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Onglet Documents Existants */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Documents Admin Existants</h2>
            <Button onClick={loadDocuments} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>

          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher dans les documents (titre, description, nom de fichier, catégorie)..."
              value={searchQuery}
              onChange={(e) => filterDocuments(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => filterDocuments('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Statistiques de recherche */}
          {searchQuery && (
            <div className="text-sm text-gray-600">
              {filteredDocuments.length} document(s) trouvé(s) sur {documents.length} total
            </div>
          )}

          {filteredDocuments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchQuery 
                    ? `Aucun document trouvé pour "${searchQuery}"`
                    : 'Aucun document admin uploadé pour le moment'
                  }
                </p>
                {!searchQuery && (
                  <Button onClick={() => setActiveTab('templates')} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Uploader un guide
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((document) => (
                <Card key={document.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(document.category)}
                        <Badge variant="outline" className="capitalize">
                          {document.category}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreviewDocument(document)}
                          title="Prévisualiser"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditDocument(document)}
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(document.file_path, '_blank')}
                          title="Télécharger"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDocument(document.id!)}
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold text-lg mb-2">{document.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {document.description || 'Aucune description'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>{document.created_at ? new Date(document.created_at).toLocaleDateString('fr-FR') : 'N/A'}</span>
                      </div>
                      {document.file_size && (
                        <span>{(document.file_size / 1024 / 1024).toFixed(1)} MB</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de configuration et upload */}
      {showUploadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingDocument.id ? 'Modifier le Document' : 'Configuration et Upload'}
              </h2>
              <Button variant="ghost" onClick={() => setShowUploadDialog(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Informations du fichier */}
              {editingDocument.id ? (
                // Mode modification
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Document à modifier</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <FileText className="w-8 h-8 text-blue-500" />
                      <div>
                        <div className="font-medium">{editingDocument.title}</div>
                        <div className="text-sm text-gray-500">
                          {editingDocument.original_filename} • {editingDocument.file_size ? `${(editingDocument.file_size / 1024 / 1024).toFixed(1)} MB` : 'Taille inconnue'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Option pour remplacer le fichier */}
                    <div className="mt-4">
                      <Label htmlFor="replace-file">Remplacer le fichier (optionnel)</Label>
                      <Input
                        id="replace-file"
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.md"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedFiles([file]);
                            setFileMetadata([{
                              title: editingDocument.title || file.name.replace(/\.[^/.]+$/, ''),
                              description: editingDocument.description || '',
                              category: editingDocument.category || 'guide',
                              access_level: editingDocument.access_level || 'private'
                            }]);
                          }
                        }}
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                // Mode upload
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Fichiers sélectionnés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-lg">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <FileText className="w-8 h-8 text-blue-500" />
                          <div>
                            <div className="font-medium">{file.name}</div>
                            <div className="text-sm text-gray-500">
                              {file.size ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : 'Taille inconnue'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Formulaire de métadonnées pour modification */}
              {editingDocument.id && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Métadonnées du document</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-title">Titre *</Label>
                        <Input
                          id="edit-title"
                          value={editingDocument.title || ''}
                          onChange={(e) => setEditingDocument({...editingDocument, title: e.target.value})}
                          placeholder="Titre du document"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-category">Catégorie *</Label>
                        <Select 
                          value={editingDocument.category || 'guide'} 
                          onValueChange={(value: any) => 
                            setEditingDocument({...editingDocument, category: value})
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="guide">Guide</SelectItem>
                            <SelectItem value="documentation">Documentation</SelectItem>
                            <SelectItem value="procedure">Procédure</SelectItem>
                            <SelectItem value="security">Sécurité</SelectItem>
                            <SelectItem value="compliance">Conformité</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        value={editingDocument.description || ''}
                        onChange={(e) => setEditingDocument({...editingDocument, description: e.target.value})}
                        placeholder="Description du document"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Ciblage avancé */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Ciblage et permissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AdvancedTargetSelector
                    selectedTargets={selectedTargets}
                    onTargetsChange={setSelectedTargets}
                    accessLevel={documentAccessLevel}
                    onAccessLevelChange={setDocumentAccessLevel}
                  />
                </CardContent>
              </Card>

              {/* Progress bar */}
              {uploading && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Upload en cours...</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-sm text-gray-600 mt-2">{uploadProgress}% terminé</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                Annuler
              </Button>
              <Button 
                onClick={editingDocument.id ? saveDocumentChanges : uploadDocument}
                disabled={uploading || (editingDocument.id ? !editingDocument.title : (!selectedFiles.length || !fileMetadata.length))}
                className="flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {editingDocument.id ? 'Modification en cours...' : 'Upload en cours...'}
                  </>
                ) : (
                  <>
                    {editingDocument.id ? <Edit className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                    {editingDocument.id ? 'Modifier' : 'Uploader'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog de prévisualisation */}
      {showPreviewDialog && previewDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] mx-4 flex flex-col">
            {/* Header du modal */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                {getCategoryIcon(previewDocument.category)}
                <div>
                  <h2 className="text-xl font-semibold">{previewDocument.title}</h2>
                  <p className="text-sm text-gray-600">
                    {previewDocument.description || 'Aucune description'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(previewDocument.file_path, '_blank')}
                  title="Ouvrir dans un nouvel onglet"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Nouvel onglet
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(previewDocument.file_path, '_blank')}
                  title="Télécharger"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger
                </Button>
                <Button variant="ghost" onClick={handleClosePreview}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Contenu du modal */}
            <div className="flex-1 p-6">
              <div className="w-full h-full border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                {previewDocument.mime_type === 'application/pdf' || previewDocument.file_path?.endsWith('.pdf') ? (
                  <embed
                    src={previewDocument.file_path}
                    type="application/pdf"
                    className="w-full h-full min-h-[60vh]"
                  />
                ) : (
                  <iframe
                    src={previewDocument.file_path}
                    className="w-full h-full min-h-[60vh]"
                    title={previewDocument.title}
                    sandbox="allow-same-origin allow-scripts allow-forms"
                  />
                )}
              </div>
            </div>

            {/* Footer du modal */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-4">
                  <span>Catégorie: <Badge variant="outline" className="capitalize">{previewDocument.category}</Badge></span>
                  <span>Accès: <Badge variant="outline" className="capitalize">{previewDocument.access_level}</Badge></span>
                  {previewDocument.file_size && (
                    <span>Taille: {(previewDocument.file_size / 1024 / 1024).toFixed(1)} MB</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    Créé le {previewDocument.created_at ? new Date(previewDocument.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
} 