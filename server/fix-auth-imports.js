#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Correction automatique des imports d\'authentification...');

// Fonction pour corriger un fichier
function fixFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // Remplacer les imports problématiques
        const replacements = [
            {
                from: "import { authenticateToken } from '../middleware/auth';",
                to: "import { authenticateUser } from '../middleware/authenticate';"
            },
            {
                from: "import { authenticateToken } from '../../middleware/auth';",
                to: "import { authenticateUser } from '../../middleware/authenticate';"
            },
            {
                from: "import { authMiddleware } from '../middleware/auth';",
                to: "import { authenticateUser } from '../middleware/authenticate';"
            },
            {
                from: "import { authMiddleware } from '../../middleware/auth';",
                to: "import { authenticateUser } from '../../middleware/authenticate';"
            },
            {
                from: "import { requireAdmin } from '../middleware/auth';",
                to: "import { requireUserType } from '../middleware/authenticate';"
            },
            {
                from: "import { requireAdmin } from '../../middleware/auth';",
                to: "import { requireUserType } from '../../middleware/authenticate';"
            }
        ];
        
        replacements.forEach(replacement => {
            if (content.includes(replacement.from)) {
                content = content.replace(new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement.to);
                modified = true;
                console.log(`  ✅ Remplacé: ${replacement.from}`);
            }
        });
        
        // Remplacer les utilisations de authenticateToken par authenticateUser
        if (content.includes('authenticateToken')) {
            content = content.replace(/authenticateToken/g, 'authenticateUser');
            modified = true;
            console.log(`  ✅ Remplacé authenticateToken par authenticateUser`);
        }
        
        // Remplacer les utilisations de authMiddleware par authenticateUser
        if (content.includes('authMiddleware')) {
            content = content.replace(/authMiddleware/g, 'authenticateUser');
            modified = true;
            console.log(`  ✅ Remplacé authMiddleware par authenticateUser`);
        }
        
        // Remplacer requireAdmin par requireUserType('admin')
        if (content.includes('requireAdmin')) {
            content = content.replace(/requireAdmin/g, "requireUserType('admin')");
            modified = true;
            console.log(`  ✅ Remplacé requireAdmin par requireUserType('admin')`);
        }
        
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Fichier corrigé: ${filePath}`);
        }
        
    } catch (error) {
        console.error(`❌ Erreur lors de la correction de ${filePath}:`, error.message);
    }
}

// Fonction pour scanner récursivement un dossier
function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            scanDirectory(filePath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            fixFile(filePath);
        }
    });
}

// Démarrer la correction
const srcDir = path.join(__dirname, 'src');
console.log(`📁 Scan du répertoire: ${srcDir}`);

if (fs.existsSync(srcDir)) {
    scanDirectory(srcDir);
    console.log('🎉 Correction terminée !');
} else {
    console.error('❌ Répertoire src non trouvé');
} 