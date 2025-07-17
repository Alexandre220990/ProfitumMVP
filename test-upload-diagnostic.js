// Script de diagnostic pour l'upload de documents
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTU5NzI5NywiZXhwIjoyMDU1MTczMjk3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CLIENT_ID = '25274ba6-67e6-4151-901c-74851fe2d82a';
const BUCKET_NAME = `client-${CLIENT_ID}`;

async function diagnoseUpload() {
  console.log('🔍 Diagnostic de l\'upload de documents...\n');

  try {
    // 1. Vérifier si le bucket existe
    console.log('1️⃣ Vérification du bucket client...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erreur récupération buckets:', bucketsError);
      return;
    }

    const bucketExists = buckets.some(bucket => bucket.name === BUCKET_NAME);
    console.log(`Bucket '${BUCKET_NAME}' existe: ${bucketExists ? '✅ Oui' : '❌ Non'}`);

    // 2. Créer le bucket s'il n'existe pas
    if (!bucketExists) {
      console.log('\n2️⃣ Création du bucket client...');
      const { data: newBucket, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
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

      if (createError) {
        console.error('❌ Erreur création bucket:', createError);
        return;
      }
      console.log('✅ Bucket créé avec succès');
    }

    // 3. Tester l'upload direct vers Supabase
    console.log('\n3️⃣ Test d\'upload direct vers Supabase...');
    const filePath = path.join(process.cwd(), 'attached_assets', 'guide-utilisateur-client.txt');
    
    if (!fs.existsSync(filePath)) {
      console.error('❌ Fichier non trouvé:', filePath);
      return;
    }

    const fileContent = fs.readFileSync(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const storedFilename = `guide_${timestamp}_${Math.random().toString(36).substr(2, 9)}.txt`;
    const filePathInBucket = `guide/${storedFilename}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePathInBucket, fileContent, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Erreur upload direct:', uploadError);
      return;
    }

    console.log('✅ Upload direct réussi');
    console.log('📁 Fichier uploadé:', filePathInBucket);

    // 4. Tester l'enregistrement en base de données
    console.log('\n4️⃣ Test d\'enregistrement en base de données...');
    const { data: dbData, error: dbError } = await supabase
      .from('DocumentFile')
      .insert({
        client_id: CLIENT_ID,
        original_filename: 'guide-utilisateur-client.txt',
        stored_filename: storedFilename,
        file_path: filePathInBucket,
        bucket_name: BUCKET_NAME,
        file_size: fileContent.length,
        mime_type: 'text/plain',
        file_extension: 'txt',
        category: 'guide',
        document_type: 'txt',
        description: 'Guide utilisateur client complet et moderne',
        tags: ['guide', 'utilisateur', 'txt', 'complet'],
        status: 'uploaded',
        validation_status: 'pending',
        is_public: false,
        access_level: 'client',
        uploaded_by: CLIENT_ID
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Erreur base de données:', dbError);
      // Nettoyer le fichier uploadé
      await supabase.storage.from(BUCKET_NAME).remove([filePathInBucket]);
      return;
    }

    console.log('✅ Enregistrement en base réussi');
    console.log('📊 ID du document:', dbData.id);

    // 5. Vérifier que le document est visible
    console.log('\n5️⃣ Vérification de la visibilité...');
    const { data: files, error: filesError } = await supabase
      .from('DocumentFile')
      .select('*')
      .eq('client_id', CLIENT_ID)
      .is('deleted_at', null);

    if (filesError) {
      console.error('❌ Erreur récupération fichiers:', filesError);
    } else {
      console.log(`✅ ${files.length} document(s) trouvé(s) pour le client`);
      files.forEach(file => {
        console.log(`  - ${file.original_filename} (${file.category})`);
      });
    }

    console.log('\n🎉 Diagnostic terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  }
}

diagnoseUpload(); 