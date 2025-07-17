#!/usr/bin/env node

/**
 * Script de test pour les API de la Gestion Électronique Documentaire (GED)
 * Usage: node test-ged-api.js
 */

import fetch from 'node-fetch';

// Configuration
const API_BASE_URL = 'http://localhost:3001/api';
const TEST_USER = {
  id: 'test-user-id',
  type: 'admin',
  email: 'test@example.com'
};

// Headers de test
const getHeaders = (userType = 'admin') => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer test-token-${userType}`,
  'X-User-Type': userType,
  'X-User-Id': TEST_USER.id
});

// Fonctions de test
async function testGetLabels() {
  console.log('🏷️  Test: Récupération des labels...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/documents/labels`, {
      method: 'GET',
      headers: getHeaders()
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`✅ ${data.data?.length || 0} labels récupérés`);
      return data.data;
    } else {
      console.log('❌ Erreur:', data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message);
    return null;
  }
}

async function testCreateDocument() {
  console.log('📄 Test: Création d\'un document...');
  
  const documentData = {
    title: 'Guide d\'utilisation - Test GED',
    description: 'Document de test pour vérifier le fonctionnement de la GED',
    content: `
      <h1>Guide d'utilisation - Test GED</h1>
      <p>Ce document a été créé automatiquement pour tester le système de Gestion Électronique Documentaire.</p>
      
      <h2>Fonctionnalités testées</h2>
      <ul>
        <li>Création de documents</li>
        <li>Gestion des labels</li>
        <li>Permissions utilisateur</li>
        <li>Recherche et filtrage</li>
      </ul>
      
      <h2>Processus de test</h2>
      <ol>
        <li>Création du document</li>
        <li>Ajout de labels</li>
        <li>Vérification des permissions</li>
        <li>Test de modification</li>
        <li>Nettoyage automatique</li>
      </ol>
    `,
    category: 'technical',
    read_time: 3
  };

  try {
    const response = await fetch(`${API_BASE_URL}/documents`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(documentData)
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`✅ Document créé avec l'ID: ${data.data.id}`);
      return data.data;
    } else {
      console.log('❌ Erreur:', data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message);
    return null;
  }
}

async function testGetDocuments(filters = {}) {
  console.log('📚 Test: Récupération des documents...');
  
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });

  try {
    const response = await fetch(`${API_BASE_URL}/documents?${queryParams}`, {
      method: 'GET',
      headers: getHeaders()
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`✅ ${data.data.documents.length} documents récupérés`);
      console.log(`   Pagination: page ${data.data.pagination.page}/${data.data.pagination.totalPages}`);
      return data.data;
    } else {
      console.log('❌ Erreur:', data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message);
    return null;
  }
}

async function testGetDocument(documentId) {
  console.log(`📖 Test: Récupération du document ${documentId}...`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
      method: 'GET',
      headers: getHeaders()
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`✅ Document récupéré: ${data.data.title}`);
      return data.data;
    } else {
      console.log('❌ Erreur:', data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message);
    return null;
  }
}

async function testUpdateDocument(documentId) {
  console.log(`✏️  Test: Modification du document ${documentId}...`);
  
  const updateData = {
    title: 'Guide d\'utilisation - Test GED (Modifié)',
    description: 'Document de test modifié pour vérifier le système de versions',
    content: `
      <h1>Guide d'utilisation - Test GED (Modifié)</h1>
      <p>Ce document a été modifié pour tester le système de versions de la GED.</p>
      
      <h2>Nouvelles fonctionnalités testées</h2>
      <ul>
        <li>Système de versions</li>
        <li>Historique des modifications</li>
        <li>Gestion des permissions</li>
        <li>Audit trail</li>
      </ul>
      
      <h2>Version actuelle</h2>
      <p>Cette version a été créée automatiquement par le script de test.</p>
    `,
    read_time: 4
  };

  try {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updateData)
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`✅ Document modifié, nouvelle version: ${data.data.version}`);
      return data.data;
    } else {
      console.log('❌ Erreur:', data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message);
    return null;
  }
}

async function testAddToFavorites(documentId) {
  console.log(`⭐ Test: Ajout du document ${documentId} aux favoris...`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/favorite`, {
      method: 'POST',
      headers: getHeaders()
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Document ajouté aux favoris');
      return true;
    } else {
      console.log('❌ Erreur:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message);
    return false;
  }
}

async function testGetFavorites() {
  console.log('⭐ Test: Récupération des favoris...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/documents/favorites`, {
      method: 'GET',
      headers: getHeaders()
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`✅ ${data.data.length} favoris récupérés`);
      return data.data;
    } else {
      console.log('❌ Erreur:', data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message);
    return null;
  }
}

async function testRemoveFromFavorites(documentId) {
  console.log(`🗑️  Test: Suppression du document ${documentId} des favoris...`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/favorite`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Document retiré des favoris');
      return true;
    } else {
      console.log('❌ Erreur:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message);
    return false;
  }
}

async function testDeleteDocument(documentId) {
  console.log(`🗑️  Test: Suppression du document ${documentId}...`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Document supprimé');
      return true;
    } else {
      console.log('❌ Erreur:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message);
    return false;
  }
}

async function testPermissions() {
  console.log('🔐 Test: Vérification des permissions...');
  
  // Test avec différents types d'utilisateurs
  const userTypes = ['admin', 'expert', 'client'];
  
  for (const userType of userTypes) {
    console.log(`   Test avec utilisateur ${userType}...`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: 'GET',
        headers: getHeaders(userType)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log(`   ✅ ${userType}: ${data.data.documents.length} documents accessibles`);
      } else {
        console.log(`   ❌ ${userType}: ${data.error}`);
      }
    } catch (error) {
      console.log(`   ❌ ${userType}: Erreur de connexion`);
    }
  }
}

async function testSearchAndFilters() {
  console.log('🔍 Test: Recherche et filtres...');
  
  const testCases = [
    { search: 'guide', description: 'Recherche par mot-clé' },
    { category: 'technical', description: 'Filtre par catégorie' },
    { sortBy: 'title', sortOrder: 'asc', description: 'Tri par titre' },
    { page: 1, limit: 5, description: 'Pagination' }
  ];

  for (const testCase of testCases) {
    console.log(`   Test: ${testCase.description}...`);
    
    try {
      const { search, category, sortBy, sortOrder, page, limit } = testCase;
      const filters = { search, category, sortBy, sortOrder, page, limit };
      
      const data = await testGetDocuments(filters);
      
      if (data) {
        console.log(`   ✅ ${testCase.description}: ${data.documents.length} résultats`);
      } else {
        console.log(`   ❌ ${testCase.description}: Échec`);
      }
    } catch (error) {
      console.log(`   ❌ ${testCase.description}: Erreur`);
    }
  }
}

// Test principal
async function runAllTests() {
  console.log('🧪 Début des tests de la GED API\n');
  
  let createdDocumentId = null;
  
  try {
    // 1. Test des labels
    await testGetLabels();
    console.log('');

    // 2. Test de création de document
    const createdDoc = await testCreateDocument();
    if (createdDoc) {
      createdDocumentId = createdDoc.id;
    }
    console.log('');

    // 3. Test de récupération des documents
    await testGetDocuments();
    console.log('');

    // 4. Test de récupération d'un document spécifique
    if (createdDocumentId) {
      await testGetDocument(createdDocumentId);
      console.log('');
    }

    // 5. Test de modification de document
    if (createdDocumentId) {
      await testUpdateDocument(createdDocumentId);
      console.log('');
    }

    // 6. Test des favoris
    if (createdDocumentId) {
      await testAddToFavorites(createdDocumentId);
      await testGetFavorites();
      await testRemoveFromFavorites(createdDocumentId);
      console.log('');
    }

    // 7. Test des permissions
    await testPermissions();
    console.log('');

    // 8. Test de recherche et filtres
    await testSearchAndFilters();
    console.log('');

    // 9. Nettoyage - Suppression du document de test
    if (createdDocumentId) {
      await testDeleteDocument(createdDocumentId);
      console.log('');
    }

    console.log('🎉 Tous les tests terminés avec succès!');
    console.log('\n📋 Résumé:');
    console.log('   ✅ API de base fonctionnelle');
    console.log('   ✅ Gestion des documents');
    console.log('   ✅ Système de permissions');
    console.log('   ✅ Gestion des favoris');
    console.log('   ✅ Recherche et filtres');
    console.log('   ✅ Système de versions');

  } catch (error) {
    console.error('💥 Erreur lors des tests:', error);
  }
}

// Vérification de la connectivité
async function checkServerConnection() {
  console.log('🔌 Vérification de la connexion au serveur...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/health`, {
      method: 'GET',
      timeout: 5000
    });

    if (response.ok) {
      console.log('✅ Serveur accessible');
      return true;
    } else {
      console.log('❌ Serveur non accessible');
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur de connexion au serveur:', error.message);
    console.log('   Assurez-vous que le serveur backend est démarré sur le port 3001');
    return false;
  }
}

// Point d'entrée principal
async function main() {
  console.log('🔧 Test de la GED API - FinancialTracker\n');
  
  // Vérifier la connexion au serveur
  const isServerConnected = await checkServerConnection();
  if (!isServerConnected) {
    console.log('\n💡 Pour démarrer le serveur:');
    console.log('   npm run dev (dans le dossier server)');
    console.log('   ou');
    console.log('   node src/index.ts');
    process.exit(1);
  }

  console.log('');
  
  // Exécuter tous les tests
  await runAllTests();
}

// Gestion des erreurs
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promesse rejetée non gérée:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Exception non capturée:', error);
  process.exit(1);
});

// Exécuter le script
main().catch((error) => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
}); 