// Script pour créer le bucket admin-documents et configurer les permissions
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTU5NzI5NywiZXhwIjoyMDU1MTczMjk3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminBucket() {
  console.log('🔄 Création du bucket admin-documents...\n');

  try {
    // 1. Vérifier les buckets existants
    console.log('1️⃣ Vérification des buckets existants...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erreur lors de la récupération des buckets:', bucketsError);
      return;
    }

    console.log('📁 Buckets existants:');
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });

    // 2. Vérifier si admin-documents existe déjà
    const adminBucketExists = buckets.some(bucket => bucket.name === 'admin-documents');
    
    if (adminBucketExists) {
      console.log('✅ Bucket admin-documents existe déjà');
    } else {
      console.log('📦 Création du bucket admin-documents...');
      
      // Note: La création de bucket via l'API client n'est pas supportée
      // Il faut le créer manuellement dans l'interface Supabase
      console.log('⚠️  Création manuelle requise dans l\'interface Supabase');
      console.log('   - Aller dans Storage > New bucket');
      console.log('   - Nom: admin-documents');
      console.log('   - Public: false');
      console.log('   - File size limit: 50MB');
      console.log('   - Allowed MIME types: application/pdf,text/html,text/plain');
    }

    // 3. Test avec le bucket documents existant
    console.log('\n2️⃣ Test avec le bucket documents existant...');
    
    const testContent = '<html><body><h1>Test Admin Bucket</h1><p>Test de création de bucket admin.</p></body></html>';
    const testBuffer = Buffer.from(testContent, 'utf8');
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(`admin/test-admin-bucket-${Date.now()}.html`, testBuffer, {
        contentType: 'text/html',
        upsert: true,
        metadata: {
          title: 'Test Admin Bucket',
          description: 'Test de création de bucket admin',
          category: 'test',
          type: 'admin'
        }
      });

    if (uploadError) {
      console.log('❌ Erreur upload test:', uploadError.message);
    } else {
      console.log('✅ Upload test réussi dans documents:', uploadData.path);
    }

    // 4. Lister les fichiers dans documents
    console.log('\n3️⃣ Liste des fichiers dans documents...');
    const { data: files, error: filesError } = await supabase.storage
      .from('documents')
      .list('admin');

    if (filesError) {
      console.log('❌ Erreur liste fichiers:', filesError.message);
    } else {
      console.log(`✅ ${files.length} fichiers dans documents/admin:`);
      files.forEach(file => {
        console.log(`   - ${file.name} (${file.metadata?.size || 'N/A'} bytes)`);
      });
    }

    // 5. Configuration recommandée
    console.log('\n📋 Configuration recommandée:');
    console.log('============================');
    console.log('1. Créer le bucket admin-documents dans Supabase Dashboard');
    console.log('2. Configurer les permissions RLS (Row Level Security)');
    console.log('3. Définir les politiques d\'accès admin uniquement');
    console.log('4. Tester l\'upload avec un fichier de test');
    console.log('5. Configurer les métadonnées personnalisées');

    // 6. Politiques RLS recommandées
    console.log('\n🔐 Politiques RLS recommandées:');
    console.log('==============================');
    console.log(`
-- Politique pour permettre aux admins de lire tous les documents
CREATE POLICY "Admins can read all admin documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'admin-documents' AND 
  auth.jwt() ->> 'role' = 'authenticated' AND
  auth.jwt() ->> 'user_metadata' ->> 'type' = 'admin'
);

-- Politique pour permettre aux admins d'uploader des documents
CREATE POLICY "Admins can upload admin documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'admin-documents' AND 
  auth.jwt() ->> 'role' = 'authenticated' AND
  auth.jwt() ->> 'user_metadata' ->> 'type' = 'admin'
);

-- Politique pour permettre aux admins de modifier leurs documents
CREATE POLICY "Admins can update admin documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'admin-documents' AND 
  auth.jwt() ->> 'role' = 'authenticated' AND
  auth.jwt() ->> 'user_metadata' ->> 'type' = 'admin'
);

-- Politique pour permettre aux admins de supprimer leurs documents
CREATE POLICY "Admins can delete admin documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'admin-documents' AND 
  auth.jwt() ->> 'role' = 'authenticated' AND
  auth.jwt() ->> 'user_metadata' ->> 'type' = 'admin'
);
    `);

  } catch (error) {
    console.error('❌ Erreur lors de la création du bucket:', error);
  }
}

createAdminBucket(); 