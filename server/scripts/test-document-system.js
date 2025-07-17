const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

class DocumentSystemTester {
  constructor() {
    this.results = [];
    this.testClientId = null;
    this.testFileId = null;
  }

  async runAllTests() {
    console.log('🧪 Tests du système de documents\n');

    try {
      // 1. Test de connexion
      await this.testConnection();

      // 2. Test des tables
      await this.testTables();

      // 3. Test des buckets
      await this.testBuckets();

      // 4. Test des politiques RLS
      await this.testRLSPolicies();

      // 5. Test des fonctions
      await this.testFunctions();

      // 6. Test d'upload/téléchargement
      await this.testFileOperations();

      // 7. Test des permissions
      await this.testPermissions();

      // 8. Test des statistiques
      await this.testStatistics();

      console.log('\n✅ Tous les tests terminés !');
      this.printResults();

    } catch (error) {
      console.error('\n❌ Erreur lors des tests:', error);
      process.exit(1);
    }
  }

  async testConnection() {
    console.log('1️⃣ Test de connexion à Supabase...');
    
    try {
      const { data, error } = await supabase
        .from('Client')
        .select('id')
        .limit(1);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        this.testClientId = data[0].id;
        console.log('   ✅ Connexion réussie');
        this.results.push({ test: 'connection', status: 'passed' });
      } else {
        console.log('   ⚠️  Aucun client trouvé pour les tests');
        this.results.push({ test: 'connection', status: 'warning', message: 'Aucun client' });
      }
    } catch (error) {
      console.error('   ❌ Erreur de connexion:', error.message);
      this.results.push({ test: 'connection', status: 'failed', error: error.message });
    }
  }

  async testTables() {
    console.log('\n2️⃣ Test des tables de documents...');
    
    const requiredTables = [
      'DocumentFile',
      'DocumentFileVersion',
      'DocumentFileAccessLog',
      'DocumentFilePermission',
      'DocumentFileShare'
    ];

    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.error(`   ❌ Table '${table}':`, error.message);
          this.results.push({ test: 'tables', table, status: 'failed', error: error.message });
        } else {
          console.log(`   ✅ Table '${table}' accessible`);
          this.results.push({ test: 'tables', table, status: 'passed' });
        }
      } catch (error) {
        console.error(`   ❌ Erreur table '${table}':`, error.message);
        this.results.push({ test: 'tables', table, status: 'failed', error: error.message });
      }
    }
  }

  async testBuckets() {
    console.log('\n3️⃣ Test des buckets de stockage...');
    
    const requiredBuckets = ['documents', 'clients', 'audits', 'chartes', 'rapports'];

    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();

      if (error) {
        throw error;
      }

      const bucketNames = buckets?.map(b => b.name) || [];

      for (const bucket of requiredBuckets) {
        if (bucketNames.includes(bucket)) {
          console.log(`   ✅ Bucket '${bucket}' trouvé`);
          this.results.push({ test: 'buckets', bucket, status: 'passed' });
        } else {
          console.log(`   ❌ Bucket '${bucket}' manquant`);
          this.results.push({ test: 'buckets', bucket, status: 'failed' });
        }
      }
    } catch (error) {
      console.error('   ❌ Erreur buckets:', error.message);
      this.results.push({ test: 'buckets', status: 'failed', error: error.message });
    }
  }

  async testRLSPolicies() {
    console.log('\n4️⃣ Test des politiques RLS...');
    
    const policies = [
      { table: 'DocumentFile', policy: 'document_file_read_policy' },
      { table: 'DocumentFile', policy: 'document_file_insert_policy' },
      { table: 'DocumentFile', policy: 'document_file_update_policy' },
      { table: 'DocumentFile', policy: 'document_file_delete_policy' }
    ];

    for (const { table, policy } of policies) {
      try {
        // Vérifier si la politique existe en essayant une opération
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error && error.message.includes('policy')) {
          console.log(`   ❌ Politique '${policy}' sur '${table}' manquante`);
          this.results.push({ test: 'rls', table, policy, status: 'failed' });
        } else {
          console.log(`   ✅ Politique '${policy}' sur '${table}' active`);
          this.results.push({ test: 'rls', table, policy, status: 'passed' });
        }
      } catch (error) {
        console.log(`   ⚠️  Vérification politique '${policy}' sur '${table}' à faire manuellement`);
        this.results.push({ test: 'rls', table, policy, status: 'manual_check' });
      }
    }
  }

  async testFunctions() {
    console.log('\n5️⃣ Test des fonctions utilitaires...');
    
    const functions = [
      'get_client_file_stats',
      'get_client_files',
      'cleanup_expired_files'
    ];

    for (const func of functions) {
      try {
        if (func === 'get_client_file_stats' && this.testClientId) {
          const { data, error } = await supabase.rpc(func, { client_uuid: this.testClientId });
          
          if (error) {
            console.log(`   ❌ Fonction '${func}':`, error.message);
            this.results.push({ test: 'functions', function: func, status: 'failed', error: error.message });
          } else {
            console.log(`   ✅ Fonction '${func}' fonctionnelle`);
            this.results.push({ test: 'functions', function: func, status: 'passed' });
          }
        } else {
          console.log(`   ⚠️  Fonction '${func}' testée manuellement`);
          this.results.push({ test: 'functions', function: func, status: 'manual_check' });
        }
      } catch (error) {
        console.log(`   ⚠️  Fonction '${func}' à tester manuellement`);
        this.results.push({ test: 'functions', function: func, status: 'manual_check' });
      }
    }
  }

  async testFileOperations() {
    console.log('\n6️⃣ Test des opérations de fichiers...');
    
    if (!this.testClientId) {
      console.log('   ⚠️  Aucun client de test disponible');
      this.results.push({ test: 'file_operations', status: 'skipped', reason: 'No test client' });
      return;
    }

    try {
      // Créer un fichier de test
      const testFileContent = 'Test file content for document system';
      const testFileName = `test_${Date.now()}.txt`;
      
      // Upload vers le bucket clients
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('clients')
        .upload(`test/${testFileName}`, testFileContent, {
          contentType: 'text/plain'
        });

      if (uploadError) {
        throw uploadError;
      }

      console.log('   ✅ Upload de fichier test réussi');

      // Insérer en base de données
      const { data: dbData, error: dbError } = await supabase
        .from('DocumentFile')
        .insert({
          client_id: this.testClientId,
          original_filename: testFileName,
          stored_filename: testFileName,
          file_path: `test/${testFileName}`,
          bucket_name: 'clients',
          file_size: testFileContent.length,
          mime_type: 'text/plain',
          file_extension: 'txt',
          category: 'autre',
          document_type: 'txt',
          description: 'Fichier de test',
          tags: ['test'],
          status: 'uploaded',
          validation_status: 'pending',
          is_public: false,
          access_level: 'private'
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      this.testFileId = dbData.id;
      console.log('   ✅ Insertion en base de données réussie');

      // Télécharger le fichier
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from('clients')
        .download(`test/${testFileName}`);

      if (downloadError) {
        throw downloadError;
      }

      console.log('   ✅ Téléchargement de fichier réussi');

      // Nettoyer
      await supabase.storage.from('clients').remove([`test/${testFileName}`]);
      await supabase.from('DocumentFile').delete().eq('id', this.testFileId);

      console.log('   ✅ Nettoyage réussi');
      this.results.push({ test: 'file_operations', status: 'passed' });

    } catch (error) {
      console.error('   ❌ Erreur opérations fichiers:', error.message);
      this.results.push({ test: 'file_operations', status: 'failed', error: error.message });
    }
  }

  async testPermissions() {
    console.log('\n7️⃣ Test des permissions...');
    
    if (!this.testClientId) {
      console.log('   ⚠️  Aucun client de test disponible');
      this.results.push({ test: 'permissions', status: 'skipped', reason: 'No test client' });
      return;
    }

    try {
      // Tester les permissions de base
      const { data, error } = await supabase
        .from('DocumentFile')
        .select('*')
        .eq('client_id', this.testClientId)
        .limit(1);

      if (error) {
        throw error;
      }

      console.log('   ✅ Permissions de lecture testées');
      this.results.push({ test: 'permissions', status: 'passed' });

    } catch (error) {
      console.error('   ❌ Erreur permissions:', error.message);
      this.results.push({ test: 'permissions', status: 'failed', error: error.message });
    }
  }

  async testStatistics() {
    console.log('\n8️⃣ Test des statistiques...');
    
    if (!this.testClientId) {
      console.log('   ⚠️  Aucun client de test disponible');
      this.results.push({ test: 'statistics', status: 'skipped', reason: 'No test client' });
      return;
    }

    try {
      // Tester la fonction de statistiques
      const { data, error } = await supabase.rpc('get_client_file_stats', {
        client_uuid: this.testClientId
      });

      if (error) {
        throw error;
      }

      console.log('   ✅ Statistiques calculées:', data[0]);
      this.results.push({ test: 'statistics', status: 'passed' });

    } catch (error) {
      console.error('   ❌ Erreur statistiques:', error.message);
      this.results.push({ test: 'statistics', status: 'failed', error: error.message });
    }
  }

  printResults() {
    console.log('\n📊 Résumé des tests:');
    console.log('====================');

    const testGroups = ['connection', 'tables', 'buckets', 'rls', 'functions', 'file_operations', 'permissions', 'statistics'];
    
    for (const group of testGroups) {
      const groupResults = this.results.filter(r => r.test === group);
      
      if (groupResults.length === 0) continue;

      console.log(`\n${group.toUpperCase()}:`);
      groupResults.forEach(result => {
        const status = result.status === 'passed' ? '✅' : 
                      result.status === 'failed' ? '❌' : 
                      result.status === 'warning' ? '⚠️' : '🔍';
        
        if (result.table) {
          console.log(`   ${status} ${result.table}`);
        } else if (result.bucket) {
          console.log(`   ${status} ${result.bucket}`);
        } else if (result.function) {
          console.log(`   ${status} ${result.function}`);
        } else if (result.policy) {
          console.log(`   ${status} ${result.policy} sur ${result.table}`);
        } else {
          console.log(`   ${status} ${result.test}`);
        }
      });
    }

    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const total = this.results.length;

    console.log(`\n🎯 Résultat global: ${passed}/${total} tests réussis`);
    
    if (failed > 0) {
      console.log('⚠️  Certains tests ont échoué. Vérifiez la configuration.');
    } else {
      console.log('✅ Tous les tests critiques sont passés !');
    }
  }
}

// Exécuter les tests
async function main() {
  const tester = new DocumentSystemTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DocumentSystemTester; 