import express, { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateUser } from '../middleware/authenticate';
import { AuthUser } from '../types/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { DocumentStorageService } from '../services/document-storage-service';
import multer from 'multer';
import path from 'path';

// Types pour l'authentification et l'upload

const router = express.Router();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration Multer pour l'upload de fichiers
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = [
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
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  }
});

// Instance du service de stockage
const documentStorageService = new DocumentStorageService();

// ===== ROUTES PRINCIPALES =====

/**
 * GET /api/client-documents/test
 * Endpoint de test pour vérifier le routage
 */
router.get('/test', (req: Request, res: Response) => {
  console.log('🧪 Endpoint de test client-documents appelé');
  return res.json({
    success: true,
    message: 'Endpoint client-documents fonctionne',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/client-documents/client/:clientId
 * Récupérer tous les documents d'un client
 */
router.get('/client/:clientId', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const { clientId } = req.params;
  const user = (req as any).user as AuthUser;
  
  console.log('🔍 Endpoint client-documents appelé avec:', { clientId, user: user?.id, userType: user?.type });

  // Vérifier que l'utilisateur a accès à ce client
  if (user.type !== 'admin' && user.id !== clientId) {
    console.log('❌ Accès refusé:', { userType: user.type, userId: user.id, requestedClientId: clientId });
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé à ce client'
    });
  }

  try {
    // Récupérer les vrais documents du client
    const { data: files, error: filesError } = await supabase
      .from('DocumentFile')
      .select('*')
      .eq('client_id', clientId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (filesError) {
      console.error('❌ Erreur récupération fichiers:', filesError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des fichiers'
      });
    }

    // Récupérer les audits du client
    const { data: audits, error: auditsError } = await supabase
      .from('Audit')
      .select('*')
      .eq('clientId', clientId);

    if (auditsError) {
      console.error('❌ Erreur récupération audits:', auditsError);
    }

    // Récupérer les simulations du client
    const { data: simulations, error: simulationsError } = await supabase
      .from('Simulation')
      .select('*')
      .eq('clientId', clientId); // ✅ CORRIGÉ : 'clientId' au lieu de 'client_id'

    if (simulationsError) {
      console.error('❌ Erreur récupération simulations:', simulationsError);
    }

    // Récupérer les chartes signées
    const { data: chartes, error: chartesError } = await supabase
      .from('client_charte_signature')
      .select(`
        *,
        ProduitEligible(*)
      `)
      .eq('client_id', clientId);

    if (chartesError) {
      console.error('❌ Erreur récupération chartes:', chartesError);
    }

    // Calculer les statistiques
    const totalFiles = files?.length || 0;
    const totalAudits = audits?.length || 0;
    const auditsEnCours = audits?.filter(a => a.status === 'en_cours').length || 0;
    const totalSimulations = simulations?.length || 0;
    const totalChartes = chartes?.length || 0;
    const chartesSignees = chartes?.length || 0;

    // Calculer les gains potentiels (somme des montants des audits)
    const gainsPotentiels = audits?.reduce((sum, audit) => sum + (audit.montant || 0), 0) || 0;

    // Calculer les statistiques par catégorie
    const filesByCategory: { [key: string]: number } = {};
    files?.forEach(file => {
      filesByCategory[file.category] = (filesByCategory[file.category] || 0) + 1;
    });

    // Calculer les statistiques par statut
    const filesByStatus: { [key: string]: number } = {};
    files?.forEach(file => {
      filesByStatus[file.status] = (filesByStatus[file.status] || 0) + 1;
    });

    // Calculer la taille totale
    const totalSize = files?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0;

    // Documents récents (7 derniers jours)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUploads = files?.filter(file => new Date(file.created_at) > sevenDaysAgo).length || 0;

    const realData = {
      success: true,
      data: {
        files: files || [],
        chartes: chartes || [],
        audits: audits || [],
        simulations: simulations || [],
        guides: [], // À implémenter si nécessaire
        stats: {
          totalDocuments: totalFiles,
          totalChartes: totalChartes,
          chartesSignees: chartesSignees,
          totalAudits: totalAudits,
          auditsEnCours: auditsEnCours,
          totalSimulations: totalSimulations,
          simulationsCompletees: totalSimulations, // À affiner selon le statut
          totalGuides: 0,
          gainsPotentiels: gainsPotentiels,
          total_files: totalFiles,
          total_size: totalSize,
          files_by_category: filesByCategory,
          files_by_status: filesByStatus,
          recent_uploads: recentUploads
        }
      }
    };

    console.log('✅ Données réelles envoyées:', {
      totalFiles,
      totalAudits,
      totalSimulations,
      totalChartes,
      gainsPotentiels
    });
    return res.json(realData);

  } catch (error) {
    console.error('❌ Erreur récupération documents client:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des documents'
    });
  }
}));

/**
 * POST /api/client-documents/upload
 * Upload un fichier pour un client
 */
router.post('/upload', authenticateUser, upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user as AuthUser;
  const { clientId, auditId, category, description, tags, accessLevel, expiresAt } = req.body;
  const file = (req as any).file;

  if (!file) {
    return res.status(400).json({
      success: false,
      message: 'Aucun fichier fourni'
    });
  }

  if (!clientId || !category) {
    return res.status(400).json({
      success: false,
      message: 'clientId et category sont requis'
    });
  }

  // Vérifier que l'utilisateur a le droit d'uploader pour ce client
  if (user.type !== 'admin' && user.id !== clientId) {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé à ce client'
    });
  }

  try {
    const uploadResponse = await documentStorageService.uploadFile({
      file: file.buffer,
      client_id: clientId,
      audit_id: auditId,
      category: category as any,
      description,
      tags: tags ? JSON.parse(tags) : [],
      access_level: accessLevel as any,
      expires_at: expiresAt ? new Date(expiresAt) : undefined,
      uploaded_by: user.id
    });

    if (!uploadResponse.success) {
      return res.status(500).json({
        success: false,
        message: uploadResponse.error
      });
    }

    return res.json({
      success: true,
      message: 'Fichier uploadé avec succès',
      data: uploadResponse.metadata
    });

  } catch (error) {
    console.error('Erreur upload fichier:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload du fichier'
    });
  }
}));

/**
 * GET /api/client-documents/download/:fileId
 * Télécharger un fichier
 */
router.get('/download/:fileId', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const user = req.user as AuthUser;

  try {
    const downloadResponse = await documentStorageService.downloadFile(fileId, user.id);

    if (!downloadResponse.success) {
      return res.status(404).json({
        success: false,
        message: downloadResponse.error
      });
    }

    // Rediriger vers l'URL signée
    return res.redirect(downloadResponse.file_url!);

  } catch (error) {
    console.error('Erreur téléchargement:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement'
    });
  }
}));

/**
 * PUT /api/client-documents/validate/:fileId
 * Valider un fichier
 */
router.put('/validate/:fileId', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const { status, comment } = req.body;
  const user = req.user as AuthUser;

  if (!status || !['approved', 'rejected', 'requires_revision'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Status invalide'
    });
  }

  // Seuls les admins et experts peuvent valider
  if (!['admin', 'expert'].includes(user.type)) {
    return res.status(403).json({
      success: false,
      message: 'Permission insuffisante'
    });
  }

  try {
    const success = await documentStorageService.validateFile(fileId, user.id, status as any, comment);

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la validation'
      });
    }

    return res.json({
      success: true,
      message: 'Fichier validé avec succès'
    });

  } catch (error) {
    console.error('Erreur validation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation'
    });
  }
}));

/**
 * DELETE /api/client-documents/:fileId
 * Supprimer un fichier
 */
router.delete('/:fileId', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const user = req.user as AuthUser;

  try {
    const success = await documentStorageService.deleteFile(fileId, user.id);

    if (!success) {
      return res.status(403).json({
        success: false,
        message: 'Permission refusée ou fichier non trouvé'
      });
    }

    return res.json({
      success: true,
      message: 'Fichier supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
    });
  }
}));

/**
 * POST /api/client-documents/share/:fileId
 * Partager un fichier
 */
router.post('/share/:fileId', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const { sharedWithEmail, permissions, expiresAt } = req.body;
  const user = req.user as AuthUser;

  if (!sharedWithEmail || !permissions) {
    return res.status(400).json({
      success: false,
      message: 'sharedWithEmail et permissions sont requis'
    });
  }

  try {
    const shareResponse = await documentStorageService.shareFile(
      fileId,
      user.id,
      sharedWithEmail,
      permissions,
      expiresAt ? new Date(expiresAt) : undefined
    );

    if (!shareResponse.success) {
      return res.status(500).json({
        success: false,
        message: shareResponse.error
      });
    }

    return res.json({
      success: true,
      message: 'Fichier partagé avec succès',
      data: {
        shareToken: shareResponse.shareToken
      }
    });

  } catch (error) {
    console.error('Erreur partage:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du partage'
    });
  }
}));

/**
 * GET /api/client-documents/stats/:clientId
 * Obtenir les statistiques de fichiers d'un client
 */
router.get('/stats/:clientId', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const { clientId } = req.params;
  const user = req.user as AuthUser;

  // Vérifier que l'utilisateur a accès à ce client
  if (user.type !== 'admin' && user.id !== clientId) {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé à ce client'
    });
  }

  try {
    const statsResponse = await documentStorageService.getClientFileStats(clientId);

    if (!statsResponse.success) {
      return res.status(500).json({
        success: false,
        message: statsResponse.error
      });
    }

    return res.json({
      success: true,
      data: statsResponse.stats
    });

  } catch (error) {
    console.error('Erreur statistiques:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
}));

/**
 * GET /api/client-documents/shared/:shareToken
 * Accéder à un fichier partagé (sans authentification)
 */
router.get('/shared/:shareToken', asyncHandler(async (req: Request, res: Response) => {
  const { shareToken } = req.params;

  try {
    // Récupérer les informations du partage
    const { data: shareData, error: shareError } = await supabase
      .from('DocumentFileShare')
      .select(`
        *,
        DocumentFile(*)
      `)
      .eq('share_token', shareToken)
      .eq('is_active', true)
      .single();

    if (shareError || !shareData) {
      return res.status(404).json({
        success: false,
        message: 'Lien de partage invalide ou expiré'
      });
    }

    // Vérifier l'expiration
    if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
      return res.status(410).json({
        success: false,
        message: 'Lien de partage expiré'
      });
    }

    // Vérifier la limite de téléchargements
    if (shareData.download_limit && shareData.download_count >= shareData.download_limit) {
      return res.status(410).json({
        success: false,
        message: 'Limite de téléchargements atteinte'
      });
    }

    // Générer l'URL de téléchargement
    const { data: urlData, error: urlError } = await supabase.storage
      .from(shareData.DocumentFile.bucket_name)
      .createSignedUrl(shareData.DocumentFile.file_path, 3600);

    if (urlError) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération du lien de téléchargement'
      });
    }

    // Incrémenter le compteur de téléchargements
    await supabase
      .from('DocumentFileShare')
      .update({
        download_count: shareData.download_count + 1
      })
      .eq('id', shareData.id);

    return res.json({
      success: true,
      data: {
        file: shareData.DocumentFile,
        downloadUrl: urlData.signedUrl,
        permissions: shareData.permissions
      }
    });

  } catch (error) {
    console.error('Erreur accès fichier partagé:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'accès au fichier partagé'
    });
  }
}));

export default router; 