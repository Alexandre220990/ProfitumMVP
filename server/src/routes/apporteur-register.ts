import express from 'express';
import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '../services/EmailService';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Mapping des types d'entreprise du frontend vers la base de données
const mapCompanyType = (frontendType: string): string => {
  const mapping: Record<string, string> = {
    'Indépendant': 'independant',
    'Expert': 'expert',
    'Call Center': 'call_center',
    'Société Commerciale': 'societe_commerciale'
  };
  
  return mapping[frontendType] || 'independant';
};

// Configuration multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/cv/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `cv-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF, DOC et DOCX sont acceptés'));
    }
  }
});

// ===== INSCRIPTION APPORTEUR =====
router.post('/register', upload.single('cv_file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      company_name,
      company_type,
      sector,
      siren,
      motivation_letter,
      sponsor_code
    } = req.body;

    // Validation des données
    if (!first_name || !last_name || !email || !phone || !company_name || !company_type || !sector || !motivation_letter) {
      res.status(400).json({ 
        success: false, 
        error: 'Tous les champs obligatoires doivent être remplis' 
      });
      return;
    }

    // Vérifier si l'email existe déjà (candidature ou apporteur actif)
    const { data: existingUser, error: userError } = await supabase
      .from('ApporteurAffaires')
      .select('id, email, status')
      .eq('email', email)
      .single();

    if (existingUser) {
      res.status(400).json({ 
        success: false, 
        error: 'Un compte avec cet email existe déjà' 
      });
      return;
    }

    // Vérifier le code de parrainage si fourni
    let sponsor_id = null;
    if (sponsor_code) {
      const { data: sponsor, error: sponsorError } = await supabase
        .from('ApporteurAffaires')
        .select('id')
        .eq('affiliation_code', sponsor_code)
        .eq('status', 'active')
        .single();

      if (sponsor) {
        sponsor_id = sponsor.id;
      }
      // Note: On ne rejette pas si le code n'est pas valide, on l'ignore simplement
    }

    // Créer le dossier d'upload s'il n'existe pas
    const fs = require('fs');
    const uploadDir = 'uploads/cv';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Générer un code d'affiliation unique
    const affiliation_code = `AFF${Date.now().toString().slice(-6)}`;

    // Insérer la candidature dans ApporteurAffaires avec statut 'candidature'
    const candidatureData = {
      id: uuidv4(),
      first_name,
      last_name,
      email,
      phone,
      company_name,
      company_type: mapCompanyType(company_type), // Mapper le type d'entreprise
      sector,
      siren: siren || null,
      motivation_letter,
      cv_file_path: req.file ? req.file.path : null,
      sponsor_code: sponsor_code || null,
      sponsor_id,
      status: 'candidature',
      candidature_created_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: candidature, error: candidatureError } = await supabase
      .from('ApporteurAffaires')
      .insert(candidatureData)
      .select()
      .single();

    if (candidatureError) {
      console.error('Erreur création candidature:', candidatureError);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la création de la candidature' 
      });
      return;
    }

    // Envoyer email de confirmation au candidat
    try {
      await EmailService.sendApporteurCandidatureConfirmation(email, first_name, last_name);
    } catch (emailError) {
      console.error('Erreur envoi email confirmation:', emailError);
      // Ne pas faire échouer l'inscription si l'email échoue
    }

    // Notifier les admins
    try {
      await EmailService.notifyAdminNewCandidature(candidature.id, first_name, last_name, company_name);
    } catch (emailError) {
      console.error('Erreur notification admin:', emailError);
      // Ne pas faire échouer l'inscription si la notification échoue
    }

    res.status(201).json({
      success: true,
      message: 'Candidature soumise avec succès',
      data: {
        candidature_id: candidature.id,
        status: 'pending',
        next_steps: 'Votre candidature sera examinée par notre équipe dans les 48h'
      }
    });

  } catch (error) {
    console.error('Erreur inscription apporteur:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de l\'inscription' 
    });
  }
});

// ===== VÉRIFICATION CODE DE PARRAINAGE =====
router.get('/verify-sponsor/:code', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    const { data: sponsor, error } = await supabase
      .from('ApporteurAffaires')
      .select('id, first_name, last_name, company_name')
      .eq('affiliation_code', code)
      .eq('status', 'active')
      .single();

    if (error || !sponsor) {
      res.json({
        success: false,
        message: 'Code de parrainage invalide'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        sponsor_name: `${sponsor.first_name} ${sponsor.last_name}`,
        company_name: sponsor.company_name
      }
    });

  } catch (error) {
    console.error('Erreur vérification code parrainage:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la vérification du code' 
    });
  }
});

export default router;
