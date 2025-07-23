import express, { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticateUser } from '../middleware/authenticate';
import { AuthUser } from '../types/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { unifiedDocumentService, DocumentEvents } from '../services/unified-document-service';
import { rateLimit } from 'express-rate-limit';
import crypto from 'crypto';

const router = express.Router();

// ============================================================================
// ROUTES DOCUMENTAIRES UNIFIÉES AVEC SÉCURITÉ MAXIMALE
// ============================================================================
// Inspiré par Bruce Schneier - Security Engineering
// Chiffrement, audit, validation stricte

// Configuration Multer sécurisée
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 5 // Max 5 fichiers par requête
  },
  fileFilter: (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Validation stricte des types MIME
    const allowedMimeTypes = [
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

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Type de fichier non autorisé: ${file.mimetype}`));
    }
  }
});

// Rate limiting sécurisé
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 uploads par IP
  message: 'Trop de tentatives d\'upload. Réessayez plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
});

const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Max 50 téléchargements par IP
  message: 'Trop de tentatives de téléchargement. Réessayez plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware de validation des données
const validateUploadRequest = (req: Request, res: Response, next: Function): void => {
  const { category, accessLevel } = req.body;
  
  // Validation de la catégorie
  const allowedCategories = [
    'charte', 'rapport', 'audit', 'simulation', 'guide', 
    'facture', 'contrat', 'certificat', 'formulaire', 'autre'
  ];
  
  if (!category || !allowedCategories.includes(category)) {
    res.status(400).json({
      success: false,
      message: 'Catégorie invalide'
    });
    return;
  }

  // Validation du niveau d'accès
  const allowedAccessLevels = ['public', 'private', 'restricted', 'confidential'];
  if (accessLevel && !allowedAccessLevels.includes(accessLevel)) {
    res.status(400).json({
      success: false,
      message: 'Niveau d\'accès invalide'
    });
    return;
  }

  next();
};

// Middleware de chiffrement des données sensibles
const encryptSensitiveData = (req: Request, res: Response, next: Function): void => {
  // Chiffrement AES-256-GCM pour les données sensibles
  if (req.body.description && req.body.accessLevel === 'confidential') {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    
    let encrypted = cipher.update(req.body.description, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    req.body.description = encrypted;
    req.body.encryption_iv = iv.toString('hex');
  }
  
  next();
};

// ===== ROUTES SÉCURISÉES =====

/**
 * POST /api/unified-documents/upload
 * Upload sécurisé de fichiers
 */
router.post('/upload', 
  authenticateUser,
  uploadLimiter,
  upload.single('file'),
  validateUploadRequest,
  encryptSensitiveData,
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user as AuthUser;
    const file = (req as any).file;
    const { 
      category, 
      description, 
      tags, 
      accessLevel, 
      expiresAt,
      clientId,
      expertId,
      auditId
    } = req.body;

    // Validation du fichier
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    // Vérification des permissions selon le type d'utilisateur
    if (user.type === 'client' && clientId && clientId !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez uploader que vos propres documents'
      });
    }

    if (user.type === 'expert' && expertId && expertId !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez uploader que vos propres documents'
      });
    }

    try {
      const uploadResponse = await unifiedDocumentService.uploadFile({
        file: file.buffer,
        userId: user.id,
        userType: user.type as 'client' | 'expert' | 'admin',
        category,
        description,
        tags: tags ? JSON.parse(tags) : [],
        accessLevel: accessLevel as any,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        clientId: user.type === 'client' ? user.id : clientId,
        expertId: user.type === 'expert' ? user.id : expertId,
        auditId
      });

      if (!uploadResponse.success) {
        return res.status(500).json({
          success: false,
          message: uploadResponse.error
        });
      }

      // Audit log
      console.log(`🔒 AUDIT: Upload fichier ${uploadResponse.fileId} par ${user.id} (${user.type})`);

      return res.json({
        success: true,
        message: 'Fichier uploadé avec succès',
        data: uploadResponse.metadata
      });

    } catch (error) {
      console.error('Erreur upload:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'upload du fichier'
      });
    }
  })
);

/**
 * GET /api/unified-documents/list
 * Liste sécurisée des fichiers
 */
router.get('/list', 
  authenticateUser,
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user as AuthUser;
    const { category, status, search, accessLevel } = req.query;

    try {
      const files = await unifiedDocumentService.listFiles(user.id, user.type, {
        category: category as string,
        status: status as string,
        search: search as string,
        accessLevel: accessLevel as string
      });

      // Audit log
      console.log(`🔒 AUDIT: Liste fichiers consultée par ${user.id} (${user.type})`);

      return res.json({
        success: true,
        data: files
      });

    } catch (error) {
      console.error('Erreur listage:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du listage des fichiers'
      });
    }
  })
);

/**
 * GET /api/unified-documents/download/:fileId
 * Téléchargement sécurisé
 */
router.get('/download/:fileId', 
  authenticateUser,
  downloadLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user as AuthUser;
    const { fileId } = req.params;

    try {
      const downloadResponse = await unifiedDocumentService.downloadFile(
        fileId, 
        user.id, 
        user.type
      );

      if (!downloadResponse.success) {
        return res.status(403).json({
          success: false,
          message: downloadResponse.error
        });
      }

      // Audit log
      console.log(`🔒 AUDIT: Téléchargement fichier ${fileId} par ${user.id} (${user.type})`);

      return res.json({
        success: true,
        url: downloadResponse.url
      });

    } catch (error) {
      console.error('Erreur téléchargement:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du téléchargement'
      });
    }
  })
);

/**
 * DELETE /api/unified-documents/delete/:fileId
 * Suppression sécurisée
 */
router.delete('/delete/:fileId', 
  authenticateUser,
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user as AuthUser;
    const { fileId } = req.params;

    try {
      const deleteResponse = await unifiedDocumentService.deleteFile(
        fileId, 
        user.id, 
        user.type
      );

      if (!deleteResponse.success) {
        return res.status(403).json({
          success: false,
          message: deleteResponse.error
        });
      }

      // Audit log
      console.log(`🔒 AUDIT: Suppression fichier ${fileId} par ${user.id} (${user.type})`);

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
  })
);

/**
 * POST /api/unified-documents/share/:fileId
 * Partage sécurisé
 */
router.post('/share/:fileId', 
  authenticateUser,
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user as AuthUser;
    const { fileId } = req.params;
    const { email, canDownload, expiresAt } = req.body;

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email invalide'
      });
    }

    try {
      const shareResponse = await unifiedDocumentService.shareFile(fileId, {
        email,
        canDownload: Boolean(canDownload),
        expiresAt: expiresAt ? new Date(expiresAt) : undefined
      });

      if (!shareResponse.success) {
        return res.status(500).json({
          success: false,
          message: shareResponse.error
        });
      }

      // Audit log
      console.log(`🔒 AUDIT: Partage fichier ${fileId} avec ${email} par ${user.id} (${user.type})`);

      return res.json({
        success: true,
        message: 'Fichier partagé avec succès',
        data: {
          shareUrl: shareResponse.shareUrl
        }
      });

    } catch (error) {
      console.error('Erreur partage:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du partage'
      });
    }
  })
);

/**
 * POST /api/unified-documents/validate/:fileId
 * Validation sécurisée (admin/expert uniquement)
 */
router.post('/validate/:fileId', 
  authenticateUser,
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user as AuthUser;
    const { fileId } = req.params;
    const { status, comment } = req.body;

    // Vérification des permissions
    if (user.type !== 'admin' && user.type !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Permission refusée'
      });
    }

    // Validation du statut
    const allowedStatuses = ['approved', 'rejected', 'requires_revision'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }

    try {
      const validateResponse = await unifiedDocumentService.validateFile(fileId, {
        status: status as any,
        comment,
        validatedBy: user.id
      });

      if (!validateResponse.success) {
        return res.status(500).json({
          success: false,
          message: validateResponse.error
        });
      }

      // Audit log
      console.log(`🔒 AUDIT: Validation fichier ${fileId} par ${user.id} (${user.type}) - ${status}`);

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
  })
);

/**
 * GET /api/unified-documents/stats/:userId
 * Statistiques sécurisées
 */
router.get('/stats/:userId', 
  authenticateUser,
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user as AuthUser;
    const { userId } = req.params;

    // Vérification des permissions
    if (user.type !== 'admin' && user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Permission refusée'
      });
    }

    try {
      const stats = await unifiedDocumentService.getStats(userId);

      // Audit log
      console.log(`🔒 AUDIT: Statistiques consultées pour ${userId} par ${user.id} (${user.type})`);

      return res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Erreur statistiques:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques'
      });
    }
  })
);

// ===== ÉVÉNEMENTS EN TEMPS RÉEL =====

// Écoute des événements du service
unifiedDocumentService.on(DocumentEvents.FILE_UPLOADED, (file) => {
  console.log(`📁 Événement: Fichier uploadé - ${file.original_filename}`);
  // Ici on pourrait envoyer des notifications WebSocket
});

unifiedDocumentService.on(DocumentEvents.FILE_DELETED, (fileId) => {
  console.log(`🗑️ Événement: Fichier supprimé - ${fileId}`);
  // Ici on pourrait envoyer des notifications WebSocket
});

unifiedDocumentService.on(DocumentEvents.ERROR_OCCURRED, (error) => {
  console.error(`❌ Événement: Erreur - ${error.message}`);
  // Ici on pourrait envoyer des alertes
});

export default router; 