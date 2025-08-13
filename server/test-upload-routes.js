// ============================================================================
// TEST DES ROUTES UPLOAD DOCUMENTS TICPE
// ============================================================================

const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTc2OTg0OSwiZXhwIjoyMDU3MzQ1ODQ5fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'text/csv'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  }
});

// Fonction de test d'authentification simulée
const mockAuthMiddleware = (req, res, next) => {
  // Simuler un utilisateur authentifié
  req.user = {
    id: 'test-user-id',
    email: 'test@example.com',
    type: 'client',
    database_id: 'test-database-id'
  };
  next();
};

// Fonction pour créer un bucket si nécessaire
async function ensureBucketExists(bucketName) {
  try {
    const { data, error } = await supabase.storage.getBucket(bucketName);
    
    if (error && error.message.includes('not found')) {
      console.log(`🔧 Création du bucket: ${bucketName}`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: false,
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'image/jpeg',
          'image/png',
          'image/gif',
          'text/plain',
          'text/csv'
        ],
        fileSizeLimit: 10485760 // 10MB
      });

      if (createError) {
        console.error('❌ Erreur création bucket:', createError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Erreur vérification bucket:', error);
    return false;
  }
}

// Route de test d'upload
const testUploadRoute = async (req, res) => {
  console.log('🧪 Test route upload appelée');
  
  try {
    const user = req.user;
    console.log('👤 Utilisateur:', user);

    const { dossier_id, document_type, category, description, user_type } = req.body;
    console.log('📋 Paramètres:', { dossier_id, document_type, category, description, user_type });
    
    if (!req.file) {
      console.log('❌ Aucun fichier fourni');
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    console.log('📁 Fichier reçu:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    if (!dossier_id || !document_type || !category) {
      console.log('❌ Paramètres manquants');
      return res.status(400).json({
        success: false,
        message: 'Paramètres manquants'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire du dossier
    console.log('🔍 Vérification dossier...');
    const { data: dossier, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select('clientId, ProduitEligible(nom)')
      .eq('id', dossier_id)
      .single();

    if (dossierError || !dossier) {
      console.log('❌ Dossier non trouvé:', dossierError);
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    console.log('✅ Dossier trouvé:', dossier);

    // Utiliser l'ID de la base de données métier
    const userDatabaseId = user.database_id || user.id;
    
    if (dossier.clientId !== userDatabaseId) {
      console.log('❌ Accès refusé:', { 
        dossierClientId: dossier.clientId, 
        userId: userDatabaseId
      });
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Déterminer le bucket
    let bucketName = `client-${userDatabaseId}`;
    console.log('🪣 Bucket:', bucketName);

    // Créer le bucket si nécessaire
    const bucketCreated = await ensureBucketExists(bucketName);
    if (!bucketCreated) {
      console.log('❌ Erreur création bucket');
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du bucket'
      });
    }

    // Générer un nom de fichier unique
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const originalName = req.file.originalname;
    const extension = originalName.split('.').pop()?.toLowerCase() || 'bin';
    const storedFilename = `${category}_${timestamp}_${Math.random().toString(36).substr(2, 9)}.${extension}`;
    const filePath = `${dossier_id}/${document_type}/${storedFilename}`;
    
    console.log('📄 Chemin fichier:', filePath);

    // Upload vers Supabase Storage
    console.log('📤 Upload vers Supabase Storage...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Erreur upload Supabase:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'upload du fichier'
      });
    }

    console.log('✅ Upload Supabase réussi:', uploadData);

    // Obtenir l'URL publique du fichier
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    // Enregistrer en base de données GED
    console.log('💾 Enregistrement en base de données...');
    const { data: document, error: dbError } = await supabase
      .from('GEDDocument')
      .insert({
        title: originalName,
        description: description || `Document ${document_type} pour dossier TICPE`,
        content: `dossier_id:${dossier_id}`,
        category: category,
        file_path: filePath,
        created_by: userDatabaseId,
        is_active: true,
        version: 1
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Erreur enregistrement DB:', dbError);
      // Supprimer le fichier uploadé en cas d'erreur DB
      await supabase.storage.from(bucketName).remove([filePath]);
      
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'enregistrement du document'
      });
    }

    console.log('✅ Document enregistré en DB:', document);

    // Réponse de succès
    res.json({
      success: true,
      data: {
        id: document.id,
        title: document.title,
        file_path: filePath,
        public_url: urlData.publicUrl,
        created_at: document.created_at
      }
    });

  } catch (error) {
    console.error('❌ Erreur générale:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Configuration Express
const app = express();
app.use(express.json());

// Route de test
app.post('/test-upload', mockAuthMiddleware, upload.single('file'), testUploadRoute);

// Route de santé
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Démarrage du serveur de test
const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🧪 Serveur de test démarré sur le port ${PORT}`);
  console.log(`📝 Test upload: POST http://localhost:${PORT}/test-upload`);
  console.log(`💚 Santé: GET http://localhost:${PORT}/health`);
});

module.exports = { testUploadRoute, ensureBucketExists };
