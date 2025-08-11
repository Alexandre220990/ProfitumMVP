import express from 'express';
import multer from 'multer';
import { EnhancedDocumentStorageService } from '../services/enhanced-document-storage-service';
import { AuthUser } from '../types/auth';
import { enhancedAuthMiddleware, AuthenticatedRequest } from '../middleware/auth-enhanced';

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
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }
    
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
      targetId = user.database_id;
    } else if (user.type === 'expert') {
      userType = 'expert';
      targetId = expertId || user.database_id;
    } else {
      userType = 'client';
      targetId = clientId || user.database_id;
    }

    // Vérifier les permissions
    if (user.type === 'client' && clientId && clientId !== user.database_id) {
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
      uploaded_by: user.database_id,
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
        file_id: uploadResponse.file_id,
        file_url: uploadResponse.file_path
      }
    });

  } catch (error) {
    console.error('Erreur upload:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload'
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
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }
    
    const { fileId } = req.params;

    const downloadResponse = await documentStorageService.downloadFile(
      fileId,
      user.database_id,
      user.type
    );

    if (!downloadResponse.success) {
      return res.status(404).json({
        success: false,
        message: downloadResponse.error
      });
    }

    // Définir les headers pour le téléchargement
    res.setHeader('Content-Type', downloadResponse.metadata?.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadResponse.metadata?.original_filename || 'download'}"`);
    res.setHeader('Content-Length', (downloadResponse.file_data?.length || 0).toString());

    // Envoyer le fichier
    return res.send(downloadResponse.file_data || Buffer.alloc(0));

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
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }
    
    const { clientId } = req.params;
    const { category, status, limit, offset } = req.query;

    // Vérifier les permissions
    if (user.type !== 'admin' && user.type !== 'expert' && user.database_id !== clientId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const listResponse = await documentStorageService.listClientFiles(
      clientId,
      user.database_id,
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
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }
    
    const { expertId } = req.params;
    const { category, status, limit, offset } = req.query;

    // Vérifier les permissions
    if (user.type !== 'admin' && user.database_id !== expertId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const listResponse = await documentStorageService.listExpertFiles(
      expertId,
      user.database_id,
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
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }
    
    const { fileId } = req.params;
    const { status, comment } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Le statut est requis'
      });
    }

    const validateResponse = await documentStorageService.validateFile(
      fileId,
      user.database_id,
      status,
      comment
    );

    if (!validateResponse) {
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
});

// ===== ROUTES DE SUPPRESSION =====

/**
 * DELETE /api/enhanced-client-documents/:fileId
 * Supprimer un fichier
 */
router.delete('/:fileId', enhancedAuthMiddleware, async (req, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }
    
    const { fileId } = req.params;

    const deleteResponse = await documentStorageService.deleteFile(
      fileId,
      user.database_id,
      user.type
    );

    if (!deleteResponse) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression'
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
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }
    
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
      user.database_id,
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
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }
    
    const { clientId } = req.params;

    // Vérifier les permissions
    if (user.type !== 'admin' && user.type !== 'expert' && user.database_id !== clientId) {
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

// ===== ENDPOINT DE TEST =====

// Route de test d'authentification supprimée - l'authentification est gérée par le middleware enhancedAuthMiddleware

// ===== NOUVELLES ROUTES POUR LES SECTIONS =====

/**
 * GET /api/enhanced-client-documents/sections
 * Récupérer toutes les sections disponibles
 */
router.get('/sections', enhancedAuthMiddleware, async (req: any, res) => {
  console.log('🔍 [DEBUG] Endpoint /sections appelé');
  console.log('🔍 [DEBUG] User:', req.user);
  
  try {
    const user = req.user as AuthUser;
    
    console.log('🔍 [DEBUG] Appel getDocumentSections avec:', {
      user_id: user.id,
      user_type: user.user_metadata?.type || 'client'
    });
    
    const sectionsResponse = await documentStorageService.getDocumentSections({
      user_id: user.id,
      user_type: user.user_metadata?.type || 'client'
    });

    console.log('🔍 [DEBUG] Réponse getDocumentSections:', sectionsResponse);

    if (!sectionsResponse.success) {
      console.error('❌ [DEBUG] Erreur getDocumentSections:', sectionsResponse.error);
      return res.status(500).json({
        success: false,
        message: sectionsResponse.error
      });
    }

    console.log('✅ [DEBUG] Sections récupérées avec succès:', sectionsResponse.sections?.length);
    return res.json({
      success: true,
      sections: sectionsResponse.sections
    });

  } catch (error) {
    console.error('❌ [DEBUG] Erreur récupération sections:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des sections'
    });
  }
});

/**
 * GET /api/enhanced-client-documents/sections/:sectionName/files
 * Récupérer les fichiers d'une section spécifique
 */
router.get('/sections/:sectionName/files', enhancedAuthMiddleware, async (req: any, res) => {
  console.log('🔍 [DEBUG] Endpoint /sections/:sectionName/files appelé');
  console.log('🔍 [DEBUG] Section:', req.params.sectionName);
  console.log('🔍 [DEBUG] Query:', req.query);
  
  try {
    const user = req.user as AuthUser;
    const { sectionName } = req.params;
    const { status, limit, offset } = req.query;

    console.log('🔍 [DEBUG] Appel getSectionFiles avec:', {
      section_name: sectionName,
      user_id: user.id,
      user_type: user.user_metadata?.type || 'client',
      filters: { status, limit, offset }
    });

    const filesResponse = await documentStorageService.getSectionFiles({
      section_name: sectionName,
      user_id: user.id,
      user_type: user.user_metadata?.type || 'client',
      filters: {
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      }
    });

    console.log('🔍 [DEBUG] Réponse getSectionFiles:', filesResponse);

    if (!filesResponse.success) {
      console.error('❌ [DEBUG] Erreur getSectionFiles:', filesResponse.error);
      return res.status(500).json({
        success: false,
        message: filesResponse.error
      });
    }

    console.log('✅ [DEBUG] Fichiers récupérés avec succès:', filesResponse.files?.length);
    return res.json({
      success: true,
      files: filesResponse.files,
      total: filesResponse.total
    });

  } catch (error) {
    console.error('❌ [DEBUG] Erreur récupération fichiers section:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des fichiers de la section'
    });
  }
});

/**
 * POST /api/enhanced-client-documents/sections/:sectionName/upload
 * Upload un fichier dans une section spécifique
 */
router.post('/sections/:sectionName/upload', enhancedAuthMiddleware, upload.single('file'), async (req: any, res) => {
  console.log('🔍 [DEBUG] Endpoint /sections/:sectionName/upload appelé');
  console.log('🔍 [DEBUG] Section:', req.params.sectionName);
  console.log('🔍 [DEBUG] File:', req.file);
  console.log('🔍 [DEBUG] Body:', req.body);
  
  try {
    const user = req.user as AuthUser;
    const { sectionName } = req.params;
    const file = req.file;
    
    if (!file) {
      console.error('❌ [DEBUG] Aucun fichier fourni');
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    const {
      clientId,
      expertId,
      auditId,
      description,
      tags,
      accessLevel = 'private',
      expiresAt
    } = req.body;

    // Déterminer l'ID cible selon le type d'utilisateur
    let targetId: string;
    let userType: string;
    
    const userTypeFromMetadata = user.user_metadata?.type || 'client';
    
    if (userTypeFromMetadata === 'client') {
      targetId = user.id;
      userType = 'client';
    } else if (userTypeFromMetadata === 'expert') {
      targetId = user.id;
      userType = 'expert';
    } else {
      targetId = user.id;
      userType = 'admin';
    }

    console.log('🔍 [DEBUG] Appel uploadFileToSection avec:', {
      section_name: sectionName,
      file_size: file.size,
      user_type: userType,
      target_id: targetId
    });

    const uploadResponse = await documentStorageService.uploadFileToSection({
      file: file.buffer,
      section_name: sectionName,
      client_id: userType === 'client' ? targetId : undefined,
      expert_id: userType === 'expert' ? targetId : undefined,
      audit_id: auditId,
      category: 'autre', // Sera déterminé par la section
      description,
      tags: tags ? JSON.parse(tags) : [],
      access_level: accessLevel as any,
      expires_at: expiresAt ? new Date(expiresAt) : undefined,
      uploaded_by: user.id,
      user_type: userType as 'client' | 'expert' | 'admin'
    });

    console.log('🔍 [DEBUG] Réponse uploadFileToSection:', uploadResponse);

    if (!uploadResponse.success) {
      console.error('❌ [DEBUG] Erreur uploadFileToSection:', uploadResponse.error);
      return res.status(500).json({
        success: false,
        message: uploadResponse.error
      });
    }

    console.log('✅ [DEBUG] Upload réussi, file_id:', uploadResponse.file_id);
    return res.json({
      success: true,
      message: 'Fichier uploadé avec succès',
      data: {
        file_id: uploadResponse.file_id,
        file_path: uploadResponse.file_path
      }
    });

  } catch (error) {
    console.error('❌ [DEBUG] Erreur upload section:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload du fichier'
    });
  }
});

export default router; 