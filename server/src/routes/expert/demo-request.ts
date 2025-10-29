import express, { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { ExpertNotificationService } from '../../services/expert-notification-service';

const router = express.Router();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Service de notifications
const expertNotificationService = new ExpertNotificationService();

// ============================================================================
// SCHEMA DE VALIDATION
// ============================================================================

const demoRequestSchema = z.object({
  first_name: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  last_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Format d\'email invalide'),
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  confirm_password: z.string().optional(), // Not needed in backend validation
  company_name: z.string().min(2, 'Le nom de l\'entreprise est requis'),
  siren: z.string().length(9, 'Le SIREN doit contenir exactement 9 chiffres').regex(/^\d{9}$/, 'Le SIREN ne doit contenir que des chiffres'),
  specializations: z.array(z.string()).min(1, 'Au moins une spécialisation est requise'),
  secteur_activite: z.array(z.string()).min(1, 'Au moins un secteur d\'activité est requis'),
  experience: z.string().min(1, 'L\'expérience est requise'),
  location: z.string().min(2, 'La localisation est requise'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  phone: z.string().min(10, 'Le numéro de téléphone est requis'),
  website: z.string().url('Format d\'URL invalide').optional().or(z.literal('')),
  linkedin: z.string().url('Format d\'URL LinkedIn invalide').optional().or(z.literal('')),
  languages: z.array(z.string()).min(1, 'Au moins une langue est requise'),
  compensation: z.number().min(0).max(100).optional(),
  max_clients: z.number().min(1).max(1000).optional(),
  certifications: z.array(z.string()).optional(),
  documents: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.string()
  })).optional().nullable()
});

type DemoRequestData = z.infer<typeof demoRequestSchema>;

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Envoyer une notification à l'admin via le service de notifications
 */
const sendAdminNotification = async (expertData: any) => {
  try {
    await expertNotificationService.notifyAdminOfDemoRequest({
      expert_id: expertData.id,
      expert_name: expertData.name,
      first_name: expertData.first_name,
      last_name: expertData.last_name,
      expert_email: expertData.email,
      company_name: expertData.company_name,
      siren: expertData.siren,
      phone: expertData.phone,
      location: expertData.location,
      experience: expertData.experience,
      specializations: expertData.specializations,
      secteur_activite: expertData.secteur_activite,
      languages: expertData.languages,
      website: expertData.website,
      linkedin: expertData.linkedin,
      compensation: expertData.compensation,
      max_clients: expertData.max_clients,
      description: expertData.description
    });

    console.log('✅ Notification admin envoyée via le service');
  } catch (error) {
    console.error('❌ Erreur notification admin:', error);
  }
};

/**
 * Créer une notification dans le dashboard admin
 */
const createAdminNotification = async (expertData: any) => {
  try {
    // Récupérer tous les admins
    const { data: admins, error: adminError } = await supabase
      .from('Admin')
      .select('auth_user_id');

    if (adminError || !admins) {
      console.error('❌ Erreur récupération admins:', adminError);
      return;
    }

    // Préparer le message avec les secteurs d'activité
    const secteurs = expertData.secteur_activite?.length > 0 
      ? ` - Secteurs: ${expertData.secteur_activite.join(', ')}` 
      : '';
    const specialisations = expertData.specializations?.length > 0 
      ? ` - Spécialisations: ${expertData.specializations.join(', ')}` 
      : '';

    // Créer une notification pour chaque admin
    for (const admin of admins) {
      await supabase
        .from('notification')
        .insert({
          user_id: admin.auth_user_id,
          user_type: 'admin',
          title: 'Nouvelle demande de démo expert',
          message: `${expertData.first_name} ${expertData.last_name} (${expertData.company_name}) souhaite rejoindre la plateforme${secteurs}${specialisations}`,
          notification_type: 'expert_demo_request',
          priority: 'high',
          action_url: `/admin/experts/${expertData.id}`,
          action_data: {
            expert_id: expertData.id,
            action: 'review_demo_request'
          }
        });
    }

    console.log('✅ Notifications admin créées');
  } catch (error) {
    console.error('❌ Erreur création notifications admin:', error);
  }
};

/**
 * Vérifier si l'email existe déjà
 */
const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('Expert')
      .select('id')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Erreur vérification email:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('❌ Erreur vérification email:', error);
    return false;
  }
};

// ============================================================================
// ROUTE PRINCIPALE
// ============================================================================

// POST /api/expert/demo-request - Créer une demande de démo
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('📝 Nouvelle demande de démo expert reçue');

    // Validation des données
    const validationResult = demoRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      console.error('❌ Validation échouée:', validationResult.error);
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: validationResult.error.errors
      });
    }

    const data = validationResult.data;

    // Vérifier si l'email existe déjà
    const emailExists = await checkEmailExists(data.email);
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: 'Un expert avec cet email existe déjà'
      });
    }

    // Hasher le mot de passe
    console.log('🔐 Hashage du mot de passe...');
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Préparer les données pour l'insertion
    const expertData = {
      ...data,
      // Concaténer first_name et last_name pour créer name (requis par la BDD)
      name: `${data.first_name} ${data.last_name}`.trim(),
      // Valeurs par défaut
      approval_status: 'pending',
      status: 'inactive',
      rating: 0,
      availability: 'disponible',
      // Nettoyer le SIREN (supprimer les espaces)
      siren: data.siren.replace(/\s/g, ''),
      // Gérer les champs optionnels
      website: data.website || null,
      linkedin: data.linkedin || null,
      compensation: data.compensation || 20,
      max_clients: data.max_clients || 100,
      certifications: data.certifications || [],
      documents: data.documents || null,
      // Mot de passe hashé
      password: hashedPassword,
      auth_user_id: null,
      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insérer l'expert en base
    const { data: newExpert, error: insertError } = await supabase
      .from('Expert')
      .insert(expertData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erreur insertion expert:', insertError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la demande'
      });
    }

    console.log('✅ Expert créé avec succès:', newExpert.id);

    // Envoyer notification admin par email
    await sendAdminNotification(newExpert);

    // Créer notification dans le dashboard admin
    await createAdminNotification(newExpert);

    // Log de l'action
    await supabase
      .from('AdminAuditLog')
      .insert({
        action: 'expert_demo_request_created',
        table_name: 'Expert',
        record_id: newExpert.id,
        new_values: newExpert,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        created_at: new Date().toISOString()
      });

    console.log('✅ Demande de démo traitée avec succès');

    return res.status(201).json({
      success: true,
      message: 'Demande de démo envoyée avec succès',
      data: {
        id: newExpert.id,
        name: newExpert.name,
        email: newExpert.email,
        company_name: newExpert.company_name
      }
    });

  } catch (error) {
    console.error('❌ Erreur traitement demande de démo:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// ============================================================================
// ROUTES ADDITIONNELLES
// ============================================================================

// GET /api/expert/demo-request/:id - Récupérer une demande de démo
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: expert, error } = await supabase
      .from('Expert')
      .select('*')
      .eq('id', id)
      .eq('approval_status', 'pending')
      .single();

    if (error || !expert) {
      return res.status(404).json({
        success: false,
        message: 'Demande de démo non trouvée'
      });
    }

    return res.json({
      success: true,
      data: expert
    });

  } catch (error) {
    console.error('❌ Erreur récupération demande de démo:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// PUT /api/expert/demo-request/:id - Mettre à jour une demande de démo
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validation des données de mise à jour
    const validationResult = demoRequestSchema.partial().safeParse(updateData);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: validationResult.error.errors
      });
    }

    const { data: expert, error } = await supabase
      .from('Expert')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('approval_status', 'pending')
      .select()
      .single();

    if (error || !expert) {
      return res.status(404).json({
        success: false,
        message: 'Demande de démo non trouvée'
      });
    }

    return res.json({
      success: true,
      message: 'Demande de démo mise à jour avec succès',
      data: expert
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour demande de démo:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// DELETE /api/expert/demo-request/:id - Supprimer une demande de démo
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('Expert')
      .delete()
      .eq('id', id)
      .eq('approval_status', 'pending');

    if (error) {
      return res.status(404).json({
        success: false,
        message: 'Demande de démo non trouvée'
      });
    }

    return res.json({
      success: true,
      message: 'Demande de démo supprimée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suppression demande de démo:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

export default router; 