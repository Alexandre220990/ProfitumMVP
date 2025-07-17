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

async function fixDocumentSystem() {
  console.log('🔧 Correction du système de documents...\n');

  try {
    // 1. Appliquer la fonction RPC corrigée
    console.log('1️⃣ Application de la fonction RPC corrigée...');
    
    const { error: rpcError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE OR REPLACE FUNCTION get_client_file_stats(client_uuid UUID)
        RETURNS TABLE (
            total_files INTEGER,
            total_size BIGINT,
            files_by_category JSONB,
            files_by_status JSONB,
            recent_uploads INTEGER
        ) AS $$
        BEGIN
            RETURN QUERY
            SELECT 
                COUNT(*)::INTEGER as total_files,
                COALESCE(SUM(file_size), 0) as total_size,
                COALESCE(
                    jsonb_object_agg(
                        category, 
                        COUNT(*)::INTEGER
                    ) FILTER (WHERE category IS NOT NULL),
                    '{}'::jsonb
                ) as files_by_category,
                COALESCE(
                    jsonb_object_agg(
                        status, 
                        COUNT(*)::INTEGER
                    ) FILTER (WHERE status IS NOT NULL),
                    '{}'::jsonb
                ) as files_by_status,
                COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days')::INTEGER as recent_uploads
            FROM "DocumentFile"
            WHERE client_id = client_uuid
            AND deleted_at IS NULL;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });

    if (rpcError) {
      console.log('⚠️  Erreur lors de l\'application de la fonction RPC (peut être normal si elle existe déjà)');
    } else {
      console.log('✅ Fonction RPC corrigée appliquée');
    }

    // 2. Créer les buckets de stockage
    console.log('\n2️⃣ Création des buckets de stockage...');
    
    const buckets = [
      'documents',
      'clients', 
      'audits',
      'chartes',
      'rapports'
    ];

    for (const bucketName of buckets) {
      try {
        const { data, error } = await supabase.storage.createBucket(bucketName, {
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
        });

        if (error) {
          if (error.message.includes('already exists')) {
            console.log(`✅ Bucket '${bucketName}' existe déjà`);
          } else {
            console.log(`❌ Erreur création bucket '${bucketName}':`, error.message);
          }
        } else {
          console.log(`✅ Bucket '${bucketName}' créé`);
        }
      } catch (error) {
        console.log(`❌ Erreur création bucket '${bucketName}':`, error.message);
      }
    }

    // 3. Insérer des données de test si la table est vide
    console.log('\n3️⃣ Vérification des données de test...');
    
    const { data: existingFiles, error: countError } = await supabase
      .from('DocumentFile')
      .select('id', { count: 'exact' });

    if (countError) {
      console.log('❌ Erreur lors du comptage des fichiers:', countError.message);
    } else if (existingFiles.length === 0) {
      console.log('📝 Insertion de données de test...');
      
      // Récupérer un client et un utilisateur pour les données de test
      const { data: clients } = await supabase
        .from('Client')
        .select('id')
        .limit(1);

      const { data: users } = await supabase.auth.admin.listUsers();
      
      if (clients && clients.length > 0 && users && users.users.length > 0) {
        const testData = [
          {
            client_id: clients[0].id,
            original_filename: 'charte-engagement-2025.pdf',
            stored_filename: 'charte_20250103_001.pdf',
            file_path: 'documents/clients/chartes/charte_20250103_001.pdf',
            file_size: 2048576,
            mime_type: 'application/pdf',
            category: 'charte',
            document_type: 'pdf',
            description: 'Charte d\'engagement pour l\'optimisation fiscale 2025',
            status: 'validated',
            uploaded_by: users.users[0].id
          },
          {
            client_id: clients[0].id,
            original_filename: 'rapport-audit-energetique.pdf',
            stored_filename: 'audit_energie_20250103_001.pdf',
            file_path: 'documents/clients/audits/audit_energie_20250103_001.pdf',
            file_size: 5120000,
            mime_type: 'application/pdf',
            category: 'audit',
            document_type: 'pdf',
            description: 'Rapport d\'audit énergétique complet',
            status: 'validated',
            uploaded_by: users.users[0].id
          },
          {
            client_id: clients[0].id,
            original_filename: 'guide-optimisation-fiscale.pdf',
            stored_filename: 'guide_fiscal_20250103_001.pdf',
            file_path: 'documents/guides/guide_fiscal_20250103_001.pdf',
            file_size: 1536000,
            mime_type: 'application/pdf',
            category: 'guide',
            document_type: 'pdf',
            description: 'Guide complet d\'optimisation fiscale',
            status: 'validated',
            uploaded_by: users.users[0].id
          }
        ];

        const { error: insertError } = await supabase
          .from('DocumentFile')
          .insert(testData);

        if (insertError) {
          console.log('❌ Erreur insertion données de test:', insertError.message);
        } else {
          console.log('✅ Données de test insérées');
        }
      } else {
        console.log('⚠️  Impossible d\'insérer des données de test: client ou utilisateur manquant');
      }
    } else {
      console.log(`✅ ${existingFiles.length} fichiers existent déjà`);
    }

    // 4. Test de la fonction RPC corrigée
    console.log('\n4️⃣ Test de la fonction RPC corrigée...');
    
    // Récupérer un client pour le test
    const { data: testClients } = await supabase
      .from('Client')
      .select('id')
      .limit(1);
    
    if (testClients && testClients.length > 0) {
              const { data: stats, error: statsError } = await supabase.rpc('get_client_file_stats', {
          client_uuid: testClients[0].id
        });

      if (statsError) {
        console.log('❌ Erreur test fonction RPC:', statsError.message);
      } else {
        console.log('✅ Fonction RPC fonctionne correctement');
        console.log('📊 Statistiques:', stats);
      }
    }

    console.log('\n✅ Correction du système de documents terminée !');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  }
}

fixDocumentSystem(); 