import express from 'express';
import multer from 'multer';
import { EnhancedDocumentStorageService } from '../services/enhanced-document-storage-service';
import { AuthUser } from '../types/auth';
import { enhancedAuthMiddleware } from '../middleware/auth-enhanced';

const router = express.Router();
const documentStorageService = new EnhancedDocumentStorageService();

// Configuration multer pour l'upload de fichiers
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Types de fichiers autorisés
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

// ===== ROUTES D'UPLOAD =====

/**
 * POST /api/enhanced-client-documents/upload
 * Upload un fichier pour un client
 */
router.post('/upload', enhancedAuthMiddleware, upload.single('file'), async (req, res) => {
  try {
    const user = (req as any).user as AuthUser;
    const { clientId, expertId, auditId, category, description, tags, accessLevel, expiresAt } = req.body;
    const file = (req as any).file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'La catégorie est requise'
      });
    }

    // Déterminer le type d'utilisateur et l'ID approprié
    let userType: 'client' | 'expert' | 'admin';
    let targetId: string;

    if (user.type === 'admin') {
      userType = 'admin';
      targetId = user.id;
    } else if (user.type === 'expert') {
      userType = 'expert';
      targetId = expertId || user.id;
    } else {
      userType = 'client';
      targetId = clientId || user.id;
    }

    // Vérifier les permissions
    if (user.type === 'client' && clientId && clientId !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez uploader que vos propres documents'
      });
    }

    const uploadResponse = await documentStorageService.uploadFile({
      file: file.buffer,
      client_id: userType === 'client' ? targetId : undefined,
      expert_id: userType === 'expert' ? targetId : undefined,
      audit_id: auditId,
      category: category as any,
      description,
      tags: tags ? JSON.parse(tags) : [],
      access_level: accessLevel as any,
      expires_at: expiresAt ? new Date(expiresAt) : undefined,
      uploaded_by: user.id,
      user_type: userType
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
      data: {
        id: uploadResponse.file_id,
        file_path: uploadResponse.file_path,
        metadata: uploadResponse.metadata
      }
    });

  } catch (error) {
    console.error('Erreur upload fichier:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload du fichier'
    });
  }
});

// ===== ROUTES DE TÉLÉCHARGEMENT =====

/**
 * GET /api/enhanced-client-documents/download/:fileId
 * Télécharger un fichier
 */
router.get('/download/:fileId', enhancedAuthMiddleware, async (req, res) => {
  try {
    const user = (req as any).user as AuthUser;
    const { fileId } = req.params;

    const downloadResponse = await documentStorageService.downloadFile(
      fileId, 
      user.id, 
      user.type
    );

    if (!downloadResponse.success) {
      return res.status(404).json({
        success: false,
        message: downloadResponse.error
      });
    }

    // Envoyer le fichier
    res.setHeader('Content-Type', downloadResponse.metadata?.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadResponse.metadata?.original_filename || 'download'}"`);
    return res.send(downloadResponse.file_data);

  } catch (error) {
    console.error('Erreur téléchargement:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement'
    });
  }
});

// ===== ROUTES DE LISTAGE =====

/**
 * GET /api/enhanced-client-documents/client/:clientId
 * Lister les fichiers d'un client
 */
router.get('/client/:clientId', enhancedAuthMiddleware, async (req, res) => {
  try {
    const user = (req as any).user as AuthUser;
    const { clientId } = req.params;
    const { category, status, limit, offset } = req.query;

    // Vérifier les permissions
    if (user.type !== 'admin' && user.type !== 'expert' && user.id !== clientId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const listResponse = await documentStorageService.listClientFiles(
      clientId,
      user.id,
      user.type,
      {
        category: category as string,
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      }
    );

    if (!listResponse.success) {
      return res.status(500).json({
        success: false,
        message: listResponse.error
      });
    }

    return res.json({
      success: true,
      data: {
        files: listResponse.files,
        total: listResponse.total
      }
    });

  } catch (error) {
    console.error('Erreur listage fichiers:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du listage des fichiers'
    });
  }
});

/**
 * GET /api/enhanced-client-documents/expert/:expertId
 * Lister les fichiers d'un expert
 */
router.get('/expert/:expertId', enhancedAuthMiddleware, async (req, res) => {
  try {
    const user = (req as any).user as AuthUser;
    const { expertId } = req.params;
    const { category, status, limit, offset } = req.query;

    // Vérifier les permissions
    if (user.type !== 'admin' && user.id !== expertId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const listResponse = await documentStorageService.listExpertFiles(
      expertId,
      user.id,
      user.type,
      {
        category: category as string,
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      }
    );

    if (!listResponse.success) {
      return res.status(500).json({
        success: false,
        message: listResponse.error
      });
    }

    return res.json({
      success: true,
      data: {
        files: listResponse.files,
        total: listResponse.total
      }
    });

  } catch (error) {
    console.error('Erreur listage fichiers expert:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du listage des fichiers'
    });
  }
});

// ===== ROUTES DE VALIDATION =====

/**
 * POST /api/enhanced-client-documents/validate/:fileId
 * Valider un fichier
 */
router.post('/validate/:fileId', enhancedAuthMiddleware, async (req, res) => {
  try {
    const user = (req as any).user as AuthUser;
    const { fileId } = req.params;
    const { status, comment } = req.body;

    if (!status || !['approved', 'rejected', 'requires_revision'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut de validation invalide'
      });
    }

    // Seuls les admins et experts peuvent valider
    if (user.type !== 'admin' && user.type !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les admins et experts peuvent valider les documents'
      });
    }

    const success = await documentStorageService.validateFile(
      fileId,
      user.id,
      user.type,
      status as any,
      comment
    );

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la validation'
      });
    }

    return res.json({
      success: true,
      message: 'Document validé avec succès'
    });

  } catch (error) {
    console.error('Erreur validation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation'
    });
  }
});

// ===== ROUTES DE SUPPRESSION =====

/**
 * DELETE /api/enhanced-client-documents/:fileId
 * Supprimer un fichier
 */
router.delete('/:fileId', enhancedAuthMiddleware, async (req, res) => {
  try {
    const user = (req as any).user as AuthUser;
    const { fileId } = req.params;

    const success = await documentStorageService.deleteFile(
      fileId,
      user.id,
      user.type
    );

    if (!success) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas les permissions pour supprimer ce fichier'
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
});

// ===== ROUTES DE PARTAGE =====

/**
 * POST /api/enhanced-client-documents/share/:fileId
 * Partager un fichier
 */
router.post('/share/:fileId', enhancedAuthMiddleware, async (req, res) => {
  try {
    const user = (req as any).user as AuthUser;
    const { fileId } = req.params;
    const { email, permissions, expiresAt } = req.body;

    if (!email || !permissions) {
      return res.status(400).json({
        success: false,
        message: 'Email et permissions requis'
      });
    }

    const shareResponse = await documentStorageService.shareFile(
      fileId,
      user.id,
      email,
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
        share_token: shareResponse.shareToken
      }
    });

  } catch (error) {
    console.error('Erreur partage:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du partage'
    });
  }
});

// ===== ROUTES DE STATISTIQUES =====

/**
 * GET /api/enhanced-client-documents/stats/:clientId
 * Obtenir les statistiques des fichiers d'un client
 */
router.get('/stats/:clientId', enhancedAuthMiddleware, async (req, res) => {
  try {
    const user = (req as any).user as AuthUser;
    const { clientId } = req.params;

    // Vérifier les permissions
    if (user.type !== 'admin' && user.type !== 'expert' && user.id !== clientId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

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
      message: 'Erreur lors du calcul des statistiques'
    });
  }
});

export default router; 