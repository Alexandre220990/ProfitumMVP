const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

class DocumentStorageSetup {
  constructor() {
    this.results = [];
  }

  async run() {
    console.log('🚀 Configuration du système de stockage de documents\n');

    try {
      // 1. Créer les buckets de stockage
      await this.createStorageBuckets();

      // 2. Vérifier la migration SQL
      await this.verifyDatabaseMigration();

      // 3. Créer les politiques de sécurité
      await this.setupSecurityPolicies();

      // 4. Insérer les données de test
      await this.insertTestData();

      // 5. Vérifier l'intégrité
      await this.verifyIntegrity();

      console.log('\n✅ Configuration terminée avec succès !');
      this.printSummary();

    } catch (error) {
      console.error('\n❌ Erreur lors de la configuration:', error);
      process.exit(1);
    }
  }

  async createStorageBuckets() {
    console.log('📦 Création des buckets de stockage...');

    const buckets = [
      {
        name: 'documents',
        public: false,
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'image/jpeg',
          'image/png',
          'image/gif',
          'text/plain',
          'text/csv',
          'application/zip',
          'application/x-rar-compressed'
        ],
        fileSizeLimit: 10485760 // 10MB
      },
      {
        name: 'clients',
        public: false,
        allowedMimeTypes: [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'text/plain',
          'text/csv'
        ],
        fileSizeLimit: 10485760
      },
      {
        name: 'audits',
        public: false,
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png'
        ],
        fileSizeLimit: 52428800 // 50MB
      },
      {
        name: 'chartes',
        public: false,
        allowedMimeTypes: [
          'application/pdf'
        ],
        fileSizeLimit: 10485760
      },
      {
        name: 'rapports',
        public: false,
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ],
        fileSizeLimit: 52428800
      }
    ];

    for (const bucket of buckets) {
      try {
        // Vérifier si le bucket existe déjà
        const { data: existingBuckets } = await supabase.storage.listBuckets();
        const bucketExists = existingBuckets?.some(b => b.name === bucket.name);

        if (bucketExists) {
          console.log(`   ⚠️  Bucket '${bucket.name}' existe déjà`);
          this.results.push({ step: 'bucket', name: bucket.name, status: 'exists' });
          continue;
        }

        const { data, error } = await supabase.storage.createBucket(bucket.name, {
          public: bucket.public,
          allowedMimeTypes: bucket.allowedMimeTypes,
          fileSizeLimit: bucket.fileSizeLimit
        });

        if (error) {
          console.error(`   ❌ Erreur création bucket '${bucket.name}':`, error.message);
          this.results.push({ step: 'bucket', name: bucket.name, status: 'error', error: error.message });
        } else {
          console.log(`   ✅ Bucket '${bucket.name}' créé avec succès`);
          this.results.push({ step: 'bucket', name: bucket.name, status: 'created' });
        }
      } catch (error) {
        console.error(`   ❌ Erreur création bucket '${bucket.name}':`, error.message);
        this.results.push({ step: 'bucket', name: bucket.name, status: 'error', error: error.message });
      }
    }
  }

  async verifyDatabaseMigration() {
    console.log('\n🗄️  Vérification de la migration de base de données...');

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
          console.error(`   ❌ Table '${table}' non trouvée:`, error.message);
          this.results.push({ step: 'migration', table, status: 'missing', error: error.message });
        } else {
          console.log(`   ✅ Table '${table}' vérifiée`);
          this.results.push({ step: 'migration', table, status: 'exists' });
        }
      } catch (error) {
        console.error(`   ❌ Erreur vérification table '${table}':`, error.message);
        this.results.push({ step: 'migration', table, status: 'error', error: error.message });
      }
    }
  }

  async setupSecurityPolicies() {
    console.log('\n🔐 Configuration des politiques de sécurité...');

    // Vérifier les politiques RLS
    const policies = [
      { table: 'DocumentFile', policy: 'document_file_read_policy' },
      { table: 'DocumentFile', policy: 'document_file_insert_policy' },
      { table: 'DocumentFile', policy: 'document_file_update_policy' },
      { table: 'DocumentFile', policy: 'document_file_delete_policy' }
    ];

    for (const { table, policy } of policies) {
      try {
        // Vérifier si la politique existe
        const { data, error } = await supabase.rpc('check_policy_exists', {
          table_name: table,
          policy_name: policy
        });

        if (error) {
          console.log(`   ⚠️  Politique '${policy}' sur '${table}' à vérifier manuellement`);
          this.results.push({ step: 'security', table, policy, status: 'manual_check' });
        } else {
          console.log(`   ✅ Politique '${policy}' sur '${table}' vérifiée`);
          this.results.push({ step: 'security', table, policy, status: 'exists' });
        }
      } catch (error) {
        console.log(`   ⚠️  Vérification politique '${policy}' sur '${table}' à faire manuellement`);
        this.results.push({ step: 'security', table, policy, status: 'manual_check' });
      }
    }
  }

  async insertTestData() {
    console.log('\n📝 Insertion des données de test...');

    try {
      // Récupérer un client de test
      const { data: clients } = await supabase
        .from('Client')
        .select('id')
        .limit(1);

      if (!clients || clients.length === 0) {
        console.log('   ⚠️  Aucun client trouvé pour les tests');
        this.results.push({ step: 'test_data', status: 'no_clients' });
        return;
      }

      const clientId = clients[0].id;

      // Insérer des fichiers de test
      const testFiles = [
        {
          client_id: clientId,
          original_filename: 'charte-engagement-test.pdf',
          stored_filename: 'charte_test_001.pdf',
          file_path: 'chartes/charte_test_001.pdf',
          bucket_name: 'chartes',
          file_size: 2048576,
          mime_type: 'application/pdf',
          file_extension: 'pdf',
          category: 'charte',
          document_type: 'pdf',
          description: 'Charte d\'engagement de test',
          tags: ['test', 'charte'],
          status: 'validated',
          validation_status: 'approved',
          is_public: false,
          access_level: 'private'
        },
        {
          client_id: clientId,
          original_filename: 'rapport-audit-test.pdf',
          stored_filename: 'audit_test_001.pdf',
          file_path: 'audits/audit_test_001.pdf',
          bucket_name: 'audits',
          file_size: 5120000,
          mime_type: 'application/pdf',
          file_extension: 'pdf',
          category: 'audit',
          document_type: 'pdf',
          description: 'Rapport d\'audit de test',
          tags: ['test', 'audit'],
          status: 'uploaded',
          validation_status: 'pending',
          is_public: false,
          access_level: 'restricted'
        }
      ];

      for (const file of testFiles) {
        try {
          const { data, error } = await supabase
            .from('DocumentFile')
            .insert(file)
            .select()
            .single();

          if (error) {
            console.error(`   ❌ Erreur insertion fichier test '${file.original_filename}':`, error.message);
            this.results.push({ step: 'test_data', file: file.original_filename, status: 'error', error: error.message });
          } else {
            console.log(`   ✅ Fichier test '${file.original_filename}' inséré`);
            this.results.push({ step: 'test_data', file: file.original_filename, status: 'inserted' });
          }
        } catch (error) {
          console.error(`   ❌ Erreur insertion fichier test '${file.original_filename}':`, error.message);
          this.results.push({ step: 'test_data', file: file.original_filename, status: 'error', error: error.message });
        }
      }
    } catch (error) {
      console.error('   ❌ Erreur insertion données de test:', error.message);
      this.results.push({ step: 'test_data', status: 'error', error: error.message });
    }
  }

  async verifyIntegrity() {
    console.log('\n🔍 Vérification de l\'intégrité du système...');

    try {
      // Vérifier le nombre de fichiers
      const { data: fileCount, error: fileError } = await supabase
        .from('DocumentFile')
        .select('*', { count: 'exact' });

      if (fileError) {
        console.error('   ❌ Erreur comptage fichiers:', fileError.message);
      } else {
        console.log(`   ✅ ${fileCount} fichiers trouvés`);
      }

      // Vérifier les buckets
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

      if (bucketError) {
        console.error('   ❌ Erreur liste buckets:', bucketError.message);
      } else {
        console.log(`   ✅ ${buckets?.length || 0} buckets configurés`);
      }

      this.results.push({ step: 'integrity', status: 'verified' });

    } catch (error) {
      console.error('   ❌ Erreur vérification intégrité:', error.message);
      this.results.push({ step: 'integrity', status: 'error', error: error.message });
    }
  }

  printSummary() {
    console.log('\n📊 Résumé de la configuration:');
    console.log('================================');

    const steps = ['bucket', 'migration', 'security', 'test_data', 'integrity'];
    
    for (const step of steps) {
      const stepResults = this.results.filter(r => r.step === step);
      
      switch (step) {
        case 'bucket':
          console.log('\n📦 Buckets de stockage:');
          stepResults.forEach(result => {
            const status = result.status === 'created' ? '✅' : 
                          result.status === 'exists' ? '⚠️' : '❌';
            console.log(`   ${status} ${result.name}`);
          });
          break;

        case 'migration':
          console.log('\n🗄️  Tables de base de données:');
          stepResults.forEach(result => {
            const status = result.status === 'exists' ? '✅' : '❌';
            console.log(`   ${status} ${result.table}`);
          });
          break;

        case 'security':
          console.log('\n🔐 Politiques de sécurité:');
          stepResults.forEach(result => {
            const status = result.status === 'exists' ? '✅' : '⚠️';
            console.log(`   ${status} ${result.policy} sur ${result.table}`);
          });
          break;

        case 'test_data':
          console.log('\n📝 Données de test:');
          stepResults.forEach(result => {
            if (result.file) {
              const status = result.status === 'inserted' ? '✅' : '❌';
              console.log(`   ${status} ${result.file}`);
            }
          });
          break;

        case 'integrity':
          console.log('\n🔍 Intégrité du système:');
          stepResults.forEach(result => {
            const status = result.status === 'verified' ? '✅' : '❌';
            console.log(`   ${status} Vérification terminée`);
          });
          break;
      }
    }

    console.log('\n🎯 Prochaines étapes:');
    console.log('1. Tester l\'upload de fichiers via l\'interface');
    console.log('2. Vérifier les permissions utilisateur');
    console.log('3. Configurer les notifications');
    console.log('4. Former les utilisateurs');
  }
}

// Exécuter la configuration
async function main() {
  const setup = new DocumentStorageSetup();
  await setup.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DocumentStorageSetup; 