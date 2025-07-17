// Test d'upload direct vers Supabase
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTU5NzI5NywiZXhwIjoyMDU1MTczMjk3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CLIENT_ID = '25274ba6-67e6-4151-901c-74851fe2d82a';
const BUCKET_NAME = `client-${CLIENT_ID}`;

async function testSupabaseUpload() {
  console.log('🧪 Test d\'upload direct vers Supabase...\n');

  try {
    // 1. Vérifier le bucket
    console.log('1️⃣ Vérification du bucket...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erreur buckets:', bucketsError);
      return;
    }

    const bucketExists = buckets.some(bucket => bucket.name === BUCKET_NAME);
    console.log(`Bucket '${BUCKET_NAME}' existe: ${bucketExists ? '✅ Oui' : '❌ Non'}`);

    if (!bucketExists) {
      console.log('Création du bucket...');
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: false,
        allowedMimeTypes: ['application/pdf'],
        fileSizeLimit: 10485760
      });

      if (createError) {
        console.error('❌ Erreur création bucket:', createError);
        return;
      }
      console.log('✅ Bucket créé');
    }

    // 2. Lire le fichier PDF
    console.log('\n2️⃣ Lecture du fichier PDF...');
    const pdfPath = path.join(process.cwd(), 'attached_assets', 'guide-utilisateur-client.pdf');
    
    if (!fs.existsSync(pdfPath)) {
      console.error('❌ Fichier PDF non trouvé:', pdfPath);
      return;
    }

    const fileBuffer = fs.readFileSync(pdfPath);
    console.log('✅ Fichier lu, taille:', fileBuffer.length, 'bytes');

    // 3. Upload vers Supabase
    console.log('\n3️⃣ Upload vers Supabase...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const storedFilename = `guide_${timestamp}_${Math.random().toString(36).substr(2, 9)}.pdf`;
    const filePathInBucket = `guide/${storedFilename}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePathInBucket, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/pdf'
      });

    if (uploadError) {
      console.error('❌ Erreur upload:', uploadError);
      return;
    }

    console.log('✅ Upload réussi');
    console.log('📁 Fichier uploadé:', filePathInBucket);

    // 4. Enregistrer en base de données
    console.log('\n4️⃣ Enregistrement en base de données...');
    const { data: dbData, error: dbError } = await supabase
      .from('DocumentFile')
      .insert({
        client_id: CLIENT_ID,
        original_filename: 'guide-utilisateur-client.pdf',
        stored_filename: storedFilename,
        file_path: filePathInBucket,
        bucket_name: BUCKET_NAME,
        file_size: fileBuffer.length,
        mime_type: 'application/pdf',
        file_extension: 'pdf',
        category: 'guide',
        document_type: 'pdf',
        description: 'Guide utilisateur client complet et moderne',
        tags: ['guide', 'utilisateur', 'pdf', 'complet'],
        status: 'uploaded',
        validation_status: 'pending',
        is_public: false,
        access_level: 'private',
        uploaded_by: CLIENT_ID
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Erreur base de données:', dbError);
      // Nettoyer le fichier
      await supabase.storage.from(BUCKET_NAME).remove([filePathInBucket]);
      return;
    }

    console.log('✅ Enregistrement réussi');
    console.log('📊 ID du document:', dbData.id);

    // 5. Vérifier la visibilité
    console.log('\n5️⃣ Vérification de la visibilité...');
    const { data: files, error: filesError } = await supabase
      .from('DocumentFile')
      .select('*')
      .eq('client_id', CLIENT_ID)
      .is('deleted_at', null);

    if (filesError) {
      console.error('❌ Erreur récupération:', filesError);
    } else {
      console.log(`✅ ${files.length} document(s) trouvé(s)`);
      files.forEach(file => {
        console.log(`  - ${file.original_filename} (${file.category}) - ${file.id}`);
      });
    }

    console.log('\n🎉 Test réussi ! Le document est maintenant visible pour le client.');

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testSupabaseUpload(); 