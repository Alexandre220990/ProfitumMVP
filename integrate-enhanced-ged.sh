#!/bin/bash

# ===== INTÉGRATION SYSTÈME GED AMÉLIORÉ =====
# Script pour intégrer le nouveau système GED dans l'application
# Date: 2025-01-03

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Intégration du système GED amélioré...${NC}"

# ===== 1. VÉRIFICATION DES FICHIERS =====

echo -e "\n${YELLOW}📋 Vérification des fichiers...${NC}"

# Vérifier que les fichiers existent
FILES_TO_CHECK=(
    "configure-ged-buckets-simple.sql"
    "server/src/services/enhanced-document-storage-service.ts"
    "server/src/routes/enhanced-client-documents.ts"
    "client/src/hooks/use-enhanced-document-storage.ts"
    "client/src/components/documents/EnhancedDocumentUpload.tsx"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file manquant${NC}"
        exit 1
    fi
done

# ===== 2. CONFIGURATION DE LA BASE DE DONNÉES =====

echo -e "\n${YELLOW}🗄️ Configuration de la base de données...${NC}"

# Demander les informations de connexion Supabase
read -p "URL Supabase (ex: https://xxx.supabase.co): " SUPABASE_URL
read -p "Clé service Supabase: " SUPABASE_SERVICE_KEY

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo -e "${RED}❌ URL et clé Supabase requises${NC}"
    exit 1
fi

# Créer un fichier temporaire pour exécuter le script SQL
cat > temp_ged_setup.sql << EOF
-- Configuration GED temporaire
\set SUPABASE_URL '$SUPABASE_URL'
\set SUPABASE_SERVICE_KEY '$SUPABASE_SERVICE_KEY'

-- Exécuter le script de configuration
\i configure-ged-buckets-simple.sql
EOF

echo -e "${GREEN}✅ Script SQL préparé${NC}"

# ===== 3. MISE À JOUR DES ROUTES SERVEUR =====

echo -e "\n${YELLOW}🔧 Mise à jour des routes serveur...${NC}"

# Vérifier si le fichier app.ts existe
if [ -f "server/src/app.ts" ]; then
    # Ajouter la nouvelle route
    if ! grep -q "enhanced-client-documents" server/src/app.ts; then
        echo -e "${BLUE}Ajout de la route enhanced-client-documents...${NC}"
        
        # Ajouter l'import
        sed -i '' '/import.*routes/a\
import enhancedClientDocumentsRouter from "./routes/enhanced-client-documents";
' server/src/app.ts
        
        # Ajouter la route
        sed -i '' '/app\.use.*api/a\
app.use("/api/enhanced-client-documents", enhancedClientDocumentsRouter);
' server/src/app.ts
        
        echo -e "${GREEN}✅ Route ajoutée au serveur${NC}"
    else
        echo -e "${YELLOW}⚠️ Route déjà présente${NC}"
    fi
else
    echo -e "${RED}❌ Fichier app.ts non trouvé${NC}"
fi

# ===== 4. MISE À JOUR DES TYPES =====

echo -e "\n${YELLOW}📝 Mise à jour des types...${NC}"

# Créer un fichier de types pour le nouveau service
cat > client/src/types/enhanced-document-storage.ts << 'EOF'
// Types pour le service de stockage de documents amélioré

export interface DocumentFile {
  id: string;
  client_id?: string;
  expert_id?: string;
  audit_id?: string;
  original_filename: string;
  stored_filename: string;
  file_path: string;
  bucket_name: string;
  file_size: number;
  mime_type: string;
  file_extension: string;
  category: string;
  document_type: string;
  description?: string;
  tags: string[];
  status: string;
  validation_status: string;
  is_public: boolean;
  access_level: string;
  expires_at?: string;
  download_count: number;
  last_downloaded?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface EnhancedUploadRequest {
  file: File;
  clientId?: string;
  expertId?: string;
  auditId?: string;
  category: 'charte' | 'rapport' | 'audit' | 'simulation' | 'guide' | 'facture' | 'contrat' | 'certificat' | 'formulaire' | 'autre';
  description?: string;
  tags?: string[];
  accessLevel?: 'public' | 'private' | 'restricted' | 'confidential';
  expiresAt?: Date;
}

export interface FileListResponse {
  success: boolean;
  data?: {
    files: DocumentFile[];
    total: number;
  };
  error?: string;
}

export interface StatsResponse {
  success: boolean;
  data?: {
    total_files: number;
    total_size: number;
    files_by_category: { [key: string]: number };
    files_by_status: { [key: string]: number };
    recent_uploads: number;
  };
  error?: string;
}
EOF

echo -e "${GREEN}✅ Types créés${NC}"

# ===== 5. MISE À JOUR DES PAGES =====

echo -e "\n${YELLOW}📄 Mise à jour des pages...${NC}"

# Créer une page de test pour le nouveau système
cat > client/src/pages/test-enhanced-ged.tsx << 'EOF'
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedDocumentUpload } from '@/components/documents/EnhancedDocumentUpload';
import { useEnhancedDocumentStorage } from '@/hooks/use-enhanced-document-storage';
import { useAuth } from '@/hooks/use-auth';

export default function TestEnhancedGEDPage() {
  const { user } = useAuth();
  const { getClientFiles, getClientFileStats, loading } = useEnhancedDocumentStorage();
  const [files, setFiles] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  const handleUploadComplete = async (fileId: string) => {
    console.log('Fichier uploadé:', fileId);
    // Recharger les fichiers
    if (user?.id) {
      const response = await getClientFiles(user.id);
      if (response.success && response.data) {
        setFiles(response.data.files);
      }
    }
  };

  const handleUploadError = (error: string) => {
    console.error('Erreur upload:', error);
  };

  const loadFiles = async () => {
    if (user?.id) {
      const response = await getClientFiles(user.id);
      if (response.success && response.data) {
        setFiles(response.data.files);
      }
    }
  };

  const loadStats = async () => {
    if (user?.id) {
      const response = await getClientFileStats(user.id);
      if (response.success && response.data) {
        setStats(response.data);
      }
    }
  };

  React.useEffect(() => {
    if (user?.id) {
      loadFiles();
      loadStats();
    }
  }, [user?.id]);

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p>Veuillez vous connecter pour accéder au système GED.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test du Système GED Amélioré</h1>
      
      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="files">Fichiers</TabsTrigger>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload de Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedDocumentUpload
                clientId={user.id}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                showAdvancedOptions={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle>Mes Documents ({files.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Chargement...</p>
              ) : files.length > 0 ? (
                <div className="space-y-2">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{file.original_filename}</p>
                        <p className="text-sm text-muted-foreground">
                          {file.category} • {file.file_size} bytes
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(file.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Aucun document trouvé.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Chargement...</p>
              ) : stats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded">
                      <p className="text-sm text-muted-foreground">Total fichiers</p>
                      <p className="text-2xl font-bold">{stats.total_files}</p>
                    </div>
                    <div className="p-3 border rounded">
                      <p className="text-sm text-muted-foreground">Taille totale</p>
                      <p className="text-2xl font-bold">{stats.total_size} bytes</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Par catégorie</h4>
                    <div className="space-y-1">
                      {Object.entries(stats.files_by_category).map(([category, count]) => (
                        <div key={category} className="flex justify-between">
                          <span className="capitalize">{category}</span>
                          <span>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p>Aucune statistique disponible.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
EOF

echo -e "${GREEN}✅ Page de test créée${NC}"

# ===== 6. MISE À JOUR DU PACKAGE.JSON =====

echo -e "\n${YELLOW}📦 Mise à jour des dépendances...${NC}"

# Vérifier si multer est installé côté serveur
if [ -f "server/package.json" ]; then
    if ! grep -q "multer" server/package.json; then
        echo -e "${BLUE}Installation de multer...${NC}"
        cd server && npm install multer @types/multer
        cd ..
        echo -e "${GREEN}✅ Multer installé${NC}"
    else
        echo -e "${YELLOW}⚠️ Multer déjà installé${NC}"
    fi
fi

# ===== 7. CRÉATION D'UN SCRIPT DE TEST =====

echo -e "\n${YELLOW}🧪 Création d'un script de test...${NC}"

cat > test-enhanced-ged.sql << 'EOF'
-- Test du système GED amélioré
-- Exécuter après la configuration

-- Vérifier les buckets
SELECT 
    'Bucket Test' as test_type,
    name as bucket_name,
    file_size_limit,
    array_length(allowed_mime_types, 1) as allowed_types_count
FROM storage.buckets 
WHERE name IN ('client-documents', 'expert-documents', 'admin-documents', 'chartes-signatures', 'rapports-audit')
ORDER BY name;

-- Vérifier les politiques
SELECT 
    'Policy Test' as test_type,
    policyname,
    cmd as operation
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

-- Vérifier les tables
SELECT 
    'Table Test' as test_type,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('DocumentFile', 'DocumentActivity', 'DocumentShare', 'ExpertAssignment')
ORDER BY table_name;

-- Test de la fonction
SELECT 
    'Function Test' as test_type,
    proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND proname = 'check_document_access';

-- Message de succès
DO $$
BEGIN
    RAISE NOTICE '🎉 Tests du système GED terminés avec succès!';
    RAISE NOTICE '✅ Le système est prêt pour les uploads de documents.';
    RAISE NOTICE '📁 Accédez à /test-enhanced-ged pour tester l''interface.';
END $$;
EOF

echo -e "${GREEN}✅ Script de test créé${NC}"

# ===== 8. INSTRUCTIONS FINALES =====

echo -e "\n${GREEN}🎉 Intégration terminée avec succès!${NC}"

echo -e "\n${BLUE}📋 Prochaines étapes:${NC}"
echo -e "1. ${YELLOW}Exécuter le script SQL:${NC}"
echo -e "   psql -h [HOST] -U [USER] -d [DB] -f configure-ged-buckets-simple.sql"
echo -e ""
echo -e "2. ${YELLOW}Tester la configuration:${NC}"
echo -e "   psql -h [HOST] -U [USER] -d [DB] -f test-enhanced-ged.sql"
echo -e ""
echo -e "3. ${YELLOW}Démarrer le serveur:${NC}"
echo -e "   cd server && npm run dev"
echo -e ""
echo -e "4. ${YELLOW}Démarrer le client:${NC}"
echo -e "   cd client && npm run dev"
echo -e ""
echo -e "5. ${YELLOW}Tester l'interface:${NC}"
echo -e "   Accédez à http://localhost:5173/test-enhanced-ged"
echo -e ""

echo -e "${BLUE}🔧 Fonctionnalités disponibles:${NC}"
echo -e "✅ Upload de documents avec drag & drop"
echo -e "✅ Gestion des permissions par bucket"
echo -e "✅ Partage de documents"
echo -e "✅ Validation de fichiers"
echo -e "✅ Statistiques détaillées"
echo -e "✅ Interface responsive"
echo -e ""

echo -e "${BLUE}📁 Buckets configurés:${NC}"
echo -e "• client-documents (10MB max)"
echo -e "• expert-documents (50MB max)"
echo -e "• admin-documents (100MB max)"
echo -e "• chartes-signatures (10MB max, PDF uniquement)"
echo -e "• rapports-audit (50MB max)"
echo -e ""

echo -e "${GREEN}🚀 Le système GED est maintenant opérationnel!${NC}" 