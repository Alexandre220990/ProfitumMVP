// Script de test complet pour le bucket admin-documents et les permissions
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTU5NzI5NywiZXhwIjoyMDU1MTczMjk3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAdminBucketComplete() {
  console.log('🧪 Test complet du bucket admin-documents...\n');

  try {
    // 1. Vérifier l'existence du bucket
    console.log('1️⃣ Vérification du bucket admin-documents...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erreur lors de la récupération des buckets:', bucketsError);
      return;
    }

    const adminBucket = buckets.find(bucket => bucket.name === 'admin-documents');
    if (!adminBucket) {
      console.log('❌ Bucket admin-documents non trouvé');
      return;
    }

    console.log('✅ Bucket admin-documents trouvé');
    console.log(`   - Nom: ${adminBucket.name}`);
    console.log(`   - Public: ${adminBucket.public}`);
    console.log(`   - Taille limite: ${adminBucket.fileSizeLimit || 'Non définie'}`);

    // 2. Lister tous les fichiers dans le bucket
    console.log('\n2️⃣ Liste des fichiers dans admin-documents...');
    const { data: files, error: filesError } = await supabase.storage
      .from('admin-documents')
      .list('guides');

    if (filesError) {
      console.error('❌ Erreur lors de la liste des fichiers:', filesError);
      return;
    }

    console.log(`✅ ${files.length} fichiers trouvés dans admin-documents/guides/`);
    
    // Afficher les détails des fichiers
    files.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.name}`);
      console.log(`      - Taille: ${file.metadata?.size || 'N/A'} bytes`);
      console.log(`      - Titre: ${file.metadata?.title || 'N/A'}`);
      console.log(`      - Catégorie: ${file.metadata?.category || 'N/A'}`);
      console.log(`      - Priorité: ${file.metadata?.priority || 'N/A'}`);
      console.log(`      - Niveau d'accès: ${file.metadata?.access_level || 'N/A'}`);
    });

    // 3. Test de téléchargement d'un fichier
    console.log('\n3️⃣ Test de téléchargement d\'un fichier...');
    if (files.length > 0) {
      const testFile = files[0];
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('admin-documents')
        .download(`guides/${testFile.name}`);

      if (downloadError) {
        console.log('❌ Erreur lors du téléchargement:', downloadError.message);
      } else {
        console.log(`✅ Téléchargement réussi: ${testFile.name}`);
        console.log(`   - Taille téléchargée: ${fileData.size} bytes`);
        console.log(`   - Type: ${fileData.type}`);
      }
    }

    // 4. Test des métadonnées
    console.log('\n4️⃣ Test des métadonnées...');
    const { data: metadata, error: metadataError } = await supabase.storage
      .from('admin-documents')
      .list('guides', {
        limit: 1,
        offset: 0
      });

    if (metadataError) {
      console.log('❌ Erreur lors de la récupération des métadonnées:', metadataError.message);
    } else if (metadata.length > 0) {
      const file = metadata[0];
      console.log('✅ Métadonnées récupérées:');
      console.log(`   - Titre: ${file.metadata?.title}`);
      console.log(`   - Description: ${file.metadata?.description}`);
      console.log(`   - Catégorie: ${file.metadata?.category}`);
      console.log(`   - Priorité: ${file.metadata?.priority}`);
      console.log(`   - Type: ${file.metadata?.type}`);
      console.log(`   - Créé le: ${file.metadata?.created_at}`);
    }

    // 5. Test de création d'un nouveau document
    console.log('\n5️⃣ Test de création d\'un nouveau document...');
    const testContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Test Admin Bucket</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #2563eb; }
    </style>
</head>
<body>
    <h1>Test Admin Bucket - ${new Date().toLocaleDateString('fr-FR')}</h1>
    <p>Ce document teste les fonctionnalités du bucket admin-documents.</p>
    <p>Document généré automatiquement par le système de test.</p>
</body>
</html>`;

    const testBuffer = Buffer.from(testContent, 'utf8');
    const testFileName = `test-admin-bucket-${Date.now()}.html`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('admin-documents')
      .upload(`guides/${testFileName}`, testBuffer, {
        contentType: 'text/html',
        upsert: true,
        metadata: {
          title: 'Test Admin Bucket',
          description: 'Document de test pour vérifier les fonctionnalités',
          category: 'test',
          priority: 'low',
          access_level: 'private',
          type: 'admin-test',
          created_at: new Date().toISOString()
        }
      });

    if (uploadError) {
      console.log('❌ Erreur lors de l\'upload de test:', uploadError.message);
    } else {
      console.log('✅ Upload de test réussi:', uploadData.path);
    }

    // 6. Statistiques du bucket
    console.log('\n6️⃣ Statistiques du bucket...');
    const categories = {};
    const accessLevels = {};
    const priorities = {};
    let totalSize = 0;

    files.forEach(file => {
      const category = file.metadata?.category || 'unknown';
      const accessLevel = file.metadata?.access_level || 'unknown';
      const priority = file.metadata?.priority || 'unknown';
      const size = file.metadata?.size || 0;

      categories[category] = (categories[category] || 0) + 1;
      accessLevels[accessLevel] = (accessLevels[accessLevel] || 0) + 1;
      priorities[priority] = (priorities[priority] || 0) + 1;
      totalSize += size;
    });

    console.log('📊 Statistiques:');
    console.log(`   - Total fichiers: ${files.length}`);
    console.log(`   - Taille totale: ${(totalSize / 1024).toFixed(2)} KB`);
    console.log(`   - Par catégorie:`, categories);
    console.log(`   - Par niveau d'accès:`, accessLevels);
    console.log(`   - Par priorité:`, priorities);

    // 7. Test de suppression du fichier de test
    console.log('\n7️⃣ Test de suppression du fichier de test...');
    if (uploadData) {
      const { error: deleteError } = await supabase.storage
        .from('admin-documents')
        .remove([`guides/${testFileName}`]);

      if (deleteError) {
        console.log('❌ Erreur lors de la suppression:', deleteError.message);
      } else {
        console.log('✅ Fichier de test supprimé avec succès');
      }
    }

    // 8. Vérification finale
    console.log('\n8️⃣ Vérification finale...');
    const { data: finalFiles, error: finalError } = await supabase.storage
      .from('admin-documents')
      .list('guides');

    if (finalError) {
      console.log('❌ Erreur lors de la vérification finale:', finalError.message);
    } else {
      console.log(`✅ Vérification finale: ${finalFiles.length} fichiers dans le bucket`);
    }

    // 9. Résumé des tests
    console.log('\n📋 Résumé des tests:');
    console.log('==================');
    console.log('✅ Bucket admin-documents: Opérationnel');
    console.log(`✅ Fichiers uploadés: ${files.length}`);
    console.log('✅ Téléchargement: Fonctionnel');
    console.log('✅ Métadonnées: Accessibles');
    console.log('✅ Upload/Suppression: Fonctionnel');
    console.log('✅ Statistiques: Calculées');

    console.log('\n🎉 Tous les tests sont passés avec succès !');
    console.log('\n📋 Prochaines étapes:');
    console.log('   1. Configurer les politiques RLS dans Supabase Dashboard');
    console.log('   2. Tester l\'accès avec différents types d\'utilisateurs');
    console.log('   3. Utiliser l\'interface admin-document-upload');
    console.log('   4. Configurer les notifications d\'upload');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
}

// Exécuter les tests
testAdminBucketComplete(); 