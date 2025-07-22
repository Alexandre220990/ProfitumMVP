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
