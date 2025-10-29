/**
 * Route publique d'upload de fichiers
 * Utilisée pour les uploads avant authentification (ex: demande expert)
 */

import express, { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';

const router: Router = express.Router();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration multer pour upload mémoire
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  }
});

/**
 * Sanitize filename
 */
function sanitizeFilename(filename: string): string {
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * POST /api/upload - Upload public de fichiers
 * Utilisé pour les uploads avant authentification
 */
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const { folder = 'public-uploads' } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    console.log('📤 Upload public - Fichier:', file.originalname, 'Taille:', file.size);

    // Sanitize filename
    const sanitizedFilename = sanitizeFilename(file.originalname);
    const timestamp = Date.now();
    const storagePath = `${folder}/${timestamp}-${sanitizedFilename}`;

    console.log('📁 Upload vers bucket public-files:', storagePath);

    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('public-files')
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload Storage error:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Erreur upload',
        details: uploadError.message
      });
    }

    console.log('✅ Fichier uploadé vers Storage');

    // Obtenir l'URL publique
    const { data: publicUrlData } = supabase.storage
      .from('public-files')
      .getPublicUrl(storagePath);

    return res.json({
      success: true,
      url: publicUrlData.publicUrl,
      path: storagePath,
      filename: sanitizedFilename
    });

  } catch (error) {
    console.error('❌ Erreur upload public:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload'
    });
  }
});

export default router;

