import { Router, Request, Response } from 'express';
import multer from 'multer';
import { supabase } from '../lib/supabase';
import { enhancedAuthMiddleware } from '../middleware/auth-enhanced';

const router = Router();

// Configuration multer pour l'upload de fichiers
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Vérifier les types de fichiers autorisés
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

// POST /api/documents/upload - Upload de documents vers Supabase Storage
router.post('/upload', enhancedAuthMiddleware, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    const { dossier_id, document_type, category, description, user_type } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    if (!dossier_id || !document_type || !category) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres manquants'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire du dossier
    const { data: dossier, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select('clientId, ProduitEligible(nom)')
      .eq('id', dossier_id)
      .single();

    if (dossierError || !dossier) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    if (dossier.clientId !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Déterminer le bucket selon le type d'utilisateur
    let bucketName: string;
    switch (user_type) {
      case 'client':
        bucketName = `client-${user.id}`;
        break;
      case 'expert':
        bucketName = 'expert-documents';
        break;
      case 'admin':
        bucketName = 'admin-documents';
        break;
      default:
        bucketName = 'documents';
    }

    // Créer le bucket si nécessaire
    await ensureBucketExists(bucketName);

    // Générer un nom de fichier unique
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const originalName = req.file.originalname;
    const extension = originalName.split('.').pop()?.toLowerCase() || 'bin';
    const storedFilename = `${category}_${timestamp}_${Math.random().toString(36).substr(2, 9)}.${extension}`;
    
    // Déterminer le chemin du fichier
    const filePath = `${dossier_id}/${document_type}/${storedFilename}`;

    // Upload vers Supabase Storage
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

    // Obtenir l'URL publique du fichier
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    // Enregistrer en base de données
    const { data: document, error: dbError } = await supabase
      .from('DocumentFile')
      .insert({
        client_id: user.id,
        original_filename: originalName,
        stored_filename: storedFilename,
        file_path: filePath,
        bucket_name: bucketName,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        file_extension: extension,
        category: category,
        document_type: document_type,
        description: description || `Document ${document_type} pour dossier TICPE`,
        status: 'uploaded',
        validation_status: 'pending',
        access_level: 'private',
        metadata: {
          dossier_id: dossier_id,
          product_type: 'TICPE',
          uploaded_by: user.id,
          upload_date: new Date().toISOString(),
          user_type: user_type
        }
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

    return res.json({
      success: true,
      message: 'Document uploadé avec succès',
      data: {
        ...document,
        public_url: urlData.publicUrl
      }
    });

  } catch (error) {
    console.error('❌ Erreur upload document:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/documents/:dossierId - Récupérer les documents d'un dossier
router.get('/:dossierId', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { dossierId } = req.params;
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    // Vérifier que l'utilisateur a accès au dossier
    const { data: dossier, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select('clientId')
      .eq('id', dossierId)
      .single();

    if (dossierError || !dossier) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    // Seul le client propriétaire ou un admin peut voir les documents
    if (dossier.clientId !== user.id && user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Récupérer les documents
    const { data: documents, error } = await supabase
      .from('DocumentFile')
      .select('*')
      .eq('metadata->>dossier_id', dossierId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération documents:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des documents'
      });
    }

    return res.json({
      success: true,
      data: documents || []
    });

  } catch (error) {
    console.error('❌ Erreur récupération documents:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/documents/client/:clientId - Récupérer tous les documents d'un client
router.get('/client/:clientId', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    // Vérifier que l'utilisateur accède à ses propres documents
    if (user.id !== clientId && user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Récupérer tous les documents du client
    const { data: documents, error } = await supabase
      .from('DocumentFile')
      .select(`
        *,
        ClientProduitEligible(
          id,
          ProduitEligible(nom)
        )
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération documents:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des documents'
      });
    }

    // Enrichir les données avec les informations de produit
    const enrichedDocuments = documents?.map(doc => ({
      ...doc,
      product_type: doc.ClientProduitEligible?.ProduitEligible?.nom || 'Inconnu',
      dossier_id: doc.ClientProduitEligible?.id
    })) || [];

    return res.json({
      success: true,
      data: {
        documents: enrichedDocuments,
        count: enrichedDocuments.length
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération documents client:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/documents/stats/:clientId - Récupérer les statistiques des documents d'un client
router.get('/stats/:clientId', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    // Vérifier que l'utilisateur accède à ses propres statistiques
    if (user.id !== clientId && user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Récupérer tous les documents du client
    const { data: documents, error } = await supabase
      .from('DocumentFile')
      .select('*')
      .eq('client_id', clientId);

    if (error) {
      console.error('❌ Erreur récupération documents pour stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques'
      });
    }

    // Calculer les statistiques
    const totalFiles = documents?.length || 0;
    const totalSize = documents?.reduce((sum, doc) => sum + (doc.file_size || 0), 0) || 0;
    
    // Documents récents (7 derniers jours)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUploads = documents?.filter(doc => 
      new Date(doc.created_at) > sevenDaysAgo
    ).length || 0;

    // Statistiques par catégorie
    const filesByCategory: Record<string, number> = {};
    documents?.forEach(doc => {
      const category = doc.category || 'Autre';
      filesByCategory[category] = (filesByCategory[category] || 0) + 1;
    });

    // Statistiques par statut
    const filesByStatus: Record<string, number> = {};
    documents?.forEach(doc => {
      const status = doc.status || 'uploaded';
      filesByStatus[status] = (filesByStatus[status] || 0) + 1;
    });

    // Statistiques par produit
    const filesByProduct: Record<string, number> = {};
    documents?.forEach(doc => {
      const product = doc.metadata?.product_type || 'Inconnu';
      filesByProduct[product] = (filesByProduct[product] || 0) + 1;
    });

    // Limite de stockage (100MB par défaut)
    const storageLimit = 100 * 1024 * 1024; // 100MB
    const storagePercentage = (totalSize / storageLimit) * 100;

    const stats = {
      total_files: totalFiles,
      total_size: totalSize,
      recent_uploads: recentUploads,
      files_by_category: filesByCategory,
      files_by_status: filesByStatus,
      files_by_product: filesByProduct,
      storage_usage: {
        used: totalSize,
        limit: storageLimit,
        percentage: Math.round(storagePercentage * 100) / 100
      }
    };

    return res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Erreur calcul statistiques:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/documents/:documentId/download - Télécharger un document
router.get('/:documentId/download', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    // Récupérer les informations du document
    const { data: document, error: docError } = await supabase
      .from('DocumentFile')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    // Vérifier les permissions
    if (document.client_id !== user.id && user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Télécharger le fichier depuis Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(document.bucket_name)
      .download(document.file_path);

    if (downloadError || !fileData) {
      console.error('❌ Erreur téléchargement fichier:', downloadError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du téléchargement'
      });
    }

    // Convertir en buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Mettre à jour le compteur de téléchargements
    await supabase
      .from('DocumentFile')
      .update({
        download_count: (document.download_count || 0) + 1,
        last_downloaded: new Date().toISOString()
      })
      .eq('id', documentId);

    // Envoyer le fichier
    res.setHeader('Content-Type', document.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${document.original_filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);

  } catch (error) {
    console.error('❌ Erreur téléchargement document:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// DELETE /api/documents/:documentId - Supprimer un document
router.delete('/:documentId', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    // Récupérer les informations du document
    const { data: document, error: docError } = await supabase
      .from('DocumentFile')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    // Vérifier les permissions
    if (document.client_id !== user.id && user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Supprimer le fichier de Supabase Storage
    const { error: storageError } = await supabase.storage
      .from(document.bucket_name)
      .remove([document.file_path]);

    if (storageError) {
      console.error('❌ Erreur suppression fichier storage:', storageError);
      // Continuer même si le fichier n'existe pas en storage
    }

    // Supprimer l'enregistrement de la base de données
    const { error: dbError } = await supabase
      .from('DocumentFile')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      console.error('❌ Erreur suppression document DB:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression'
      });
    }

    return res.json({
      success: true,
      message: 'Document supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suppression document:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Fonction utilitaire pour créer un bucket si nécessaire
async function ensureBucketExists(bucketName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage.getBucket(bucketName);
    
    if (error && error.message.includes('not found')) {
      // Créer le bucket
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
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
        fileSizeLimit: bucketName === 'admin-documents' ? 104857600 : // 100MB
                       bucketName === 'expert-documents' ? 52428800 : // 50MB
                       10485760 // 10MB pour les autres
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

export default router; 