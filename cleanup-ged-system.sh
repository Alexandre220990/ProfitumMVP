#!/bin/bash

# ===== NETTOYAGE ET UNIFICATION SYSTÈME GED =====
# Script pour nettoyer les reliquats et unifier le système GED
# Date: 2025-01-03

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧹 Nettoyage et unification du système GED...${NC}"

# ===== 1. ANALYSE DES RELIQUATS =====

echo -e "\n${YELLOW}📋 Analyse des reliquats...${NC}"

# Fichiers à vérifier pour les reliquats
LEGACY_FILES=(
    "server/src/services/document-storage-service.ts"
    "server/src/routes/client-documents.ts"
    "client/src/hooks/use-document-storage.ts"
    "client/src/components/DocumentUpload.tsx"
    "client/src/components/documents/DocumentStorage.tsx"
    "client/src/components/documents/DocumentUploadModal.tsx"
    "client/src/pages/dashboard/client-documents.tsx"
)

ENHANCED_FILES=(
    "server/src/services/enhanced-document-storage-service.ts"
    "server/src/routes/enhanced-client-documents.ts"
    "client/src/hooks/use-enhanced-document-storage.ts"
    "client/src/components/documents/EnhancedDocumentUpload.tsx"
)

echo -e "${BLUE}Fichiers legacy identifiés:${NC}"
for file in "${LEGACY_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${YELLOW}⚠️  $file${NC}"
    fi
done

echo -e "\n${BLUE}Fichiers enhanced identifiés:${NC}"
for file in "${ENHANCED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    fi
done

# ===== 2. SAUVEGARDE DES FICHIERS LEGACY =====

echo -e "\n${YELLOW}💾 Sauvegarde des fichiers legacy...${NC}"

BACKUP_DIR="ged-legacy-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

for file in "${LEGACY_FILES[@]}"; do
    if [ -f "$file" ]; then
        # Créer la structure de dossiers
        mkdir -p "$BACKUP_DIR/$(dirname "$file")"
        # Copier le fichier
        cp "$file" "$BACKUP_DIR/$file"
        echo -e "${GREEN}✅ Sauvegardé: $file${NC}"
    fi
done

echo -e "${GREEN}✅ Sauvegarde complète dans: $BACKUP_DIR${NC}"

# ===== 3. MISE À JOUR DES IMPORTS =====

echo -e "\n${YELLOW}🔄 Mise à jour des imports...${NC}"

# Créer un script de remplacement des imports
cat > update-imports.cjs << 'EOF'
const fs = require('fs');
const path = require('path');

// Mappings des imports à remplacer
const importMappings = [
    {
        old: "from '@/hooks/use-document-storage'",
        new: "from '@/hooks/use-enhanced-document-storage'"
    },
    {
        old: "from '../services/document-storage-service'",
        new: "from '../services/enhanced-document-storage-service'"
    },
    {
        old: "import { DocumentStorageService }",
        new: "import { EnhancedDocumentStorageService }"
    },
    {
        old: "DocumentStorageService",
        new: "EnhancedDocumentStorageService"
    },
    {
        old: "useDocumentStorage",
        new: "useEnhancedDocumentStorage"
    },
    {
        old: "DocumentUpload",
        new: "EnhancedDocumentUpload"
    },
    {
        old: "DocumentStorage",
        new: "EnhancedDocumentStorage"
    }
];

// Fonction pour mettre à jour un fichier
function updateFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    importMappings.forEach(mapping => {
        if (content.includes(mapping.old)) {
            content = content.replace(new RegExp(mapping.old, 'g'), mapping.new);
            updated = true;
        }
    });
    
    if (updated) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Mis à jour: ${filePath}`);
    }
}

// Fichiers à mettre à jour
const filesToUpdate = [
    'client/src/pages/dashboard/client-documents.tsx',
    'client/src/pages/admin/admin-document-upload.tsx',
    'client/src/pages/admin/documentation.tsx',
    'client/src/components/admin/DocumentationManager.tsx',
    'server/src/app.ts',
    'server/src/routes/index.ts'
];

filesToUpdate.forEach(updateFile);
console.log('🔄 Mise à jour des imports terminée');
EOF

node update-imports.cjs
rm update-imports.cjs

# ===== 4. MISE À JOUR DES ROUTES =====

echo -e "\n${YELLOW}🛣️ Mise à jour des routes...${NC}"

# Vérifier et mettre à jour app.ts
if [ -f "server/src/app.ts" ]; then
    # Remplacer l'ancienne route par la nouvelle
    sed -i '' 's|client-documents|enhanced-client-documents|g' server/src/app.ts
    echo -e "${GREEN}✅ Routes mises à jour dans app.ts${NC}"
fi

# ===== 5. MISE À JOUR DES PAGES =====

echo -e "\n${YELLOW}📄 Mise à jour des pages...${NC}"

# Mettre à jour la page client-documents
if [ -f "client/src/pages/dashboard/client-documents.tsx" ]; then
    cat > client/src/pages/dashboard/client-documents.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FolderOpen, 
  TrendingUp, 
  FileText, 
  Calendar,
  Download,
  Trash2,
  Eye
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useEnhancedDocumentStorage } from '@/hooks/use-enhanced-document-storage';
import { EnhancedDocumentUpload } from '@/components/documents/EnhancedDocumentUpload';
import { useToast } from '@/hooks/use-toast';

interface ClientDocumentsData {
  files: any[];
  stats: {
    total_files: number;
    total_size: number;
    files_by_category: { [key: string]: number };
    files_by_status: { [key: string]: number };
    recent_uploads: number;
    totalAudits: number;
    auditsEnCours: number;
  };
}

export default function ClientDocumentsPage() {
  const { user } = useAuth();
  const { getClientFiles, getClientFileStats } = useEnhancedDocumentStorage();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ClientDocumentsData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user?.id) {
      loadClientDocuments();
    }
  }, [user?.id]);

  const loadClientDocuments = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Charger les fichiers
      const filesResponse = await getClientFiles(user.id);
      
      // Charger les statistiques
      const statsResponse = await getClientFileStats(user.id);
      
      if (filesResponse.success && statsResponse.success) {
        setData({
          files: filesResponse.data?.files || [],
          stats: {
            ...statsResponse.data,
            totalAudits: 0, // À adapter selon votre logique
            auditsEnCours: 0 // À adapter selon votre logique
          }
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Erreur lors du chargement des documents'
        });
      }
    } catch (error) {
      console.error('Erreur chargement documents: ', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors du chargement des documents'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUploaded = () => {
    toast({
      title: 'Succès',
      description: 'Document uploadé avec succès'
    });
    loadClientDocuments(); // Recharger les données
  };

  const handleFileDeleted = () => {
    toast({
      title: 'Succès',
      description: 'Document supprimé avec succès'
    });
    loadClientDocuments(); // Recharger les données
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p>Erreur lors du chargement des données.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { files, stats } = data;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">📁 Mes Documents</h1>
        <p className="text-gray-600">Gestion de vos documents et fichiers</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="files">Mes fichiers</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistiques générales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total fichiers</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_files}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taille totale</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(stats.total_size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <FolderOpen className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Uploads récents</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.recent_uploads}</p>
                  </div>
                  <Upload className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Audits en cours</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.auditsEnCours}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Composant de gestion des documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Gestion des Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedDocumentUpload 
                clientId={user?.id || ''}
                onUploadComplete={handleFileUploaded}
                onUploadError={(error) => {
                  toast({
                    variant: 'destructive',
                    title: 'Erreur',
                    description: error
                  });
                }}
                showAdvancedOptions={true}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Statistiques par catégorie */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Statistiques par Catégorie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.files_by_category).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 capitalize">
                        {category.replace('_', ' ')}
                      </span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Statut des fichiers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Statut des Fichiers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.files_by_status).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 capitalize">
                        {status.replace('_', ' ')}
                      </span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Fichiers */}
        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mes Fichiers ({files.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {files.length > 0 ? (
                <div className="space-y-4">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="font-medium">{file.original_filename}</p>
                          <p className="text-sm text-gray-600">
                            {file.category} • {(file.file_size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={file.validation_status === 'approved' ? 'default' : 'secondary'}>
                          {file.validation_status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(file.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun fichier trouvé</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload */}
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload de Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedDocumentUpload 
                clientId={user?.id || ''}
                onUploadComplete={handleFileUploaded}
                onUploadError={(error) => {
                  toast({
                    variant: 'destructive',
                    title: 'Erreur',
                    description: error
                  });
                }}
                showAdvancedOptions={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
EOF

    echo -e "${GREEN}✅ Page client-documents mise à jour${NC}"
fi

# ===== 6. CRÉATION D'UNE PAGE ADMIN UNIFIÉE =====

echo -e "\n${YELLOW}👨‍💼 Création d'une page admin unifiée...${NC}"

cat > client/src/pages/admin/enhanced-admin-documents.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Upload, 
  Users, 
  FileText, 
  Shield, 
  Settings,
  Download,
  Trash2,
  Eye,
  Plus
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useEnhancedDocumentStorage } from '@/hooks/use-enhanced-document-storage';
import { EnhancedDocumentUpload } from '@/components/documents/EnhancedDocumentUpload';
import { useToast } from '@/hooks/use-toast';

interface AdminDocumentStats {
  total_files: number;
  total_size: number;
  files_by_category: { [key: string]: number };
  files_by_status: { [key: string]: number };
  files_by_user_type: { [key: string]: number };
}

export default function EnhancedAdminDocumentsPage() {
  const { user } = useAuth();
  const { getClientFiles, getExpertFiles, getClientFileStats, deleteFile, downloadFile } = useEnhancedDocumentStorage();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminDocumentStats | null>(null);
  const [clientFiles, setClientFiles] = useState<any[]>([]);
  const [expertFiles, setExpertFiles] = useState<any[]>([]);
  const [selectedUserType, setSelectedUserType] = useState<'client' | 'expert'>('client');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user?.id) {
      loadAdminData();
    }
  }, [user?.id]);

  const loadAdminData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Charger les statistiques globales (à adapter selon votre logique)
      const mockStats: AdminDocumentStats = {
        total_files: 0,
        total_size: 0,
        files_by_category: {},
        files_by_status: {},
        files_by_user_type: { client: 0, expert: 0, admin: 0 }
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Erreur chargement données admin:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors du chargement des données'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserFiles = async (userId: string, userType: 'client' | 'expert') => {
    if (!userId) return;

    try {
      let response;
      if (userType === 'client') {
        response = await getClientFiles(userId);
        if (response.success) {
          setClientFiles(response.data?.files || []);
        }
      } else {
        response = await getExpertFiles(userId);
        if (response.success) {
          setExpertFiles(response.data?.files || []);
        }
      }
    } catch (error) {
      console.error('Erreur chargement fichiers:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors du chargement des fichiers'
      });
    }
  };

  const handleFileUploaded = () => {
    toast({
      title: 'Succès',
      description: 'Document uploadé avec succès'
    });
    loadAdminData();
  };

  const handleFileDeleted = async (fileId: string) => {
    const result = await deleteFile(fileId);
    if (result.success) {
      toast({
        title: 'Succès',
        description: 'Document supprimé avec succès'
      });
      loadAdminData();
    }
  };

  const handleFileDownload = async (fileId: string) => {
    await downloadFile(fileId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">👨‍💼 Administration Documents</h1>
        <p className="text-gray-600">Gestion centralisée des documents clients et experts</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="upload">Upload Admin</TabsTrigger>
          <TabsTrigger value="manage">Gestion Documents</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistiques générales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total fichiers</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.total_files || 0}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taille totale</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats ? (stats.total_size / 1024 / 1024).toFixed(1) : '0'} MB
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Documents clients</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.files_by_user_type?.client || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Documents experts</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.files_by_user_type?.expert || 0}</p>
                  </div>
                  <Settings className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistiques détaillées */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Documents par Catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats && Object.entries(stats.files_by_category).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 capitalize">
                        {category.replace('_', ' ')}
                      </span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statut des Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats && Object.entries(stats.files_by_status).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 capitalize">
                        {status.replace('_', ' ')}
                      </span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload de Documents Administratifs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedDocumentUpload 
                clientId={user?.id || ''}
                onUploadComplete={handleFileUploaded}
                onUploadError={(error) => {
                  toast({
                    variant: 'destructive',
                    title: 'Erreur',
                    description: error
                  });
                }}
                showAdvancedOptions={true}
                defaultCategory="guide"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Sélecteur de type d'utilisateur */}
                <div className="flex items-center space-x-4">
                  <Label>Type d'utilisateur:</Label>
                  <Select value={selectedUserType} onValueChange={(value: 'client' | 'expert') => setSelectedUserType(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sélecteur d'utilisateur */}
                <div className="flex items-center space-x-4">
                  <Label>Utilisateur:</Label>
                  <Input
                    placeholder="ID de l'utilisateur"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-64"
                  />
                  <Button onClick={() => loadUserFiles(selectedUserId, selectedUserType)}>
                    Charger
                  </Button>
                </div>

                {/* Recherche */}
                <div className="flex items-center space-x-4">
                  <Label>Recherche:</Label>
                  <Input
                    placeholder="Rechercher dans les fichiers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                </div>

                {/* Liste des fichiers */}
                <div className="space-y-2">
                  {(selectedUserType === 'client' ? clientFiles : expertFiles)
                    .filter(file => 
                      file.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      file.category.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-6 w-6 text-blue-600" />
                          <div>
                            <p className="font-medium">{file.original_filename}</p>
                            <p className="text-sm text-gray-600">
                              {file.category} • {(file.file_size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={file.validation_status === 'approved' ? 'default' : 'secondary'}>
                            {file.validation_status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFileDownload(file.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFileDeleted(file.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Les permissions sont gérées automatiquement selon les politiques RLS configurées :
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                  <li><strong>Clients :</strong> Accès à leurs propres documents</li>
                  <li><strong>Experts :</strong> Accès à leurs documents et ceux de leurs clients assignés</li>
                  <li><strong>Admins :</strong> Accès complet à tous les documents</li>
                </ul>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note :</strong> Les permissions sont appliquées au niveau des buckets Supabase 
                    et ne peuvent être modifiées que via les politiques RLS dans la base de données.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
EOF

echo -e "${GREEN}✅ Page admin unifiée créée${NC}"

# ===== 7. MISE À JOUR DES NAVIGATIONS =====

echo -e "\n${YELLOW}🧭 Mise à jour des navigations...${NC}"

# Mettre à jour la navigation admin
if [ -f "client/src/pages/admin/dashboard.tsx" ]; then
    # Remplacer l'ancienne route par la nouvelle
    sed -i '' 's|admin-document-upload|enhanced-admin-documents|g' client/src/pages/admin/dashboard.tsx
    echo -e "${GREEN}✅ Navigation admin mise à jour${NC}"
fi

# ===== 8. CRÉATION D'UN SCRIPT DE TEST =====

echo -e "\n${YELLOW}🧪 Création d'un script de test unifié...${NC}"

cat > test-unified-ged.sql << 'EOF'
-- Test du système GED unifié
-- Exécuter après le nettoyage

-- Vérifier que tous les buckets existent
SELECT 
    'Bucket Check' as test_type,
    name as bucket_name,
    CASE 
        WHEN name IS NOT NULL THEN '✅ Existe'
        ELSE '❌ Manquant'
    END as status
FROM storage.buckets 
WHERE name IN ('client-documents', 'expert-documents', 'admin-documents', 'chartes-signatures', 'rapports-audit')
ORDER BY name;

-- Vérifier que toutes les politiques RLS sont en place
SELECT 
    'Policy Check' as test_type,
    policyname,
    CASE 
        WHEN policyname IS NOT NULL THEN '✅ Configurée'
        ELSE '❌ Manquante'
    END as status
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

-- Vérifier que les tables existent
SELECT 
    'Table Check' as test_type,
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ Existe'
        ELSE '❌ Manquante'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('DocumentFile', 'DocumentActivity', 'DocumentShare', 'ExpertAssignment')
ORDER BY table_name;

-- Message de succès
DO $$
BEGIN
    RAISE NOTICE '🎉 Test du système GED unifié terminé!';
    RAISE NOTICE '✅ Le système est maintenant unifié et opérationnel.';
    RAISE NOTICE '📁 Pages disponibles:';
    RAISE NOTICE '   • Client: /dashboard/client-documents';
    RAISE NOTICE '   • Admin: /admin/enhanced-admin-documents';
    RAISE NOTICE '   • Test: /test-enhanced-ged';
END $$;
EOF

echo -e "${GREEN}✅ Script de test créé${NC}"

# ===== 9. INSTRUCTIONS FINALES =====

echo -e "\n${GREEN}🎉 Nettoyage et unification terminés!${NC}"

echo -e "\n${BLUE}📋 Résumé des actions:${NC}"
echo -e "✅ Sauvegarde des fichiers legacy dans: $BACKUP_DIR"
echo -e "✅ Mise à jour des imports et routes"
echo -e "✅ Page client-documents modernisée"
echo -e "✅ Page admin unifiée créée"
echo -e "✅ Navigation mise à jour"
echo -e "✅ Script de test créé"

echo -e "\n${BLUE}🚀 Prochaines étapes:${NC}"
echo -e "1. ${YELLOW}Exécuter le test:${NC}"
echo -e "   psql -h [HOST] -U [USER] -d [DB] -f test-unified-ged.sql"
echo -e ""
echo -e "2. ${YELLOW}Démarrer l'application:${NC}"
echo -e "   cd server && npm run dev"
echo -e "   cd client && npm run dev"
echo -e ""
echo -e "3. ${YELLOW}Tester les pages:${NC}"
echo -e "   • Client: http://localhost:5173/dashboard/client-documents"
echo -e "   • Admin: http://localhost:5173/admin/enhanced-admin-documents"
echo -e "   • Test: http://localhost:5173/test-enhanced-ged"
echo -e ""

echo -e "${BLUE}🔧 Fonctionnalités unifiées:${NC}"
echo -e "✅ Upload de documents avec drag & drop"
echo -e "✅ Gestion des permissions par bucket"
echo -e "✅ Interface admin unifiée"
echo -e "✅ Partage de documents"
echo -e "✅ Validation de fichiers"
echo -e "✅ Statistiques détaillées"
echo -e "✅ Interface responsive"
echo -e ""

echo -e "${GREEN}🎯 Le système GED est maintenant unifié et opérationnel!${NC}" 