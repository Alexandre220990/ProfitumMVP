import { Router } from 'express';
import { authMiddleware, requireExpert } from '../middleware/auth';
import { supabase } from '../lib/supabase';
import { Audit, Client, Expert } from '../types/database';
import { ApiResponse } from '../types/api';
import { PublicExpert } from '../types/expert';
import { createClient } from "@supabase/supabase-js";

/**
 * Interface pour la réponse formatée des audits
 */
interface AuditResponse {
  id: string;
  client_name: string;
  status: string;
  type: string;
  progress: number;
  potential_gain: number;
  obtained_gain?: number;
  created_at: string;
  updated_at: string;
}

const router = Router();

// Créer une connexion Supabase avec la clé de service
const supabaseService = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Appliquer le middleware d'authentification à toutes les routes (commenté pour permettre l'inscription publique)
// router.use(authMiddleware);
// router.use(requireExpert);

// Route publique pour l'inscription d'un expert (pas d'authentification requise)
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      company,
      siren,
      specializations,
      experience,
      location,
      description,
      card_number,
      card_expiry,
      card_cvc,
      abonnement
    } = req.body;

    console.log('📝 Inscription expert:', { name, email, company, siren });

    // Validation des données
    if (!name || !email || !password || !company || !siren) {
      return res.status(400).json({
        success: false,
        error: "Tous les champs obligatoires doivent être remplis"
      });
    }

    // 1. Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        company,
        siren,
        specializations,
        user_type: 'expert'
      }
    });

    if (authError) {
      console.error('❌ Erreur création utilisateur Supabase:', authError);
      return res.status(400).json({
        success: false,
        error: authError.message
      });
    }

    console.log('✅ Utilisateur créé dans Supabase Auth:', authData.user.id);

    // 2. Créer l'expert dans la table Expert
    const now = new Date().toISOString();
    const expertData = {
      id: authData.user.id, // Utiliser l'ID Supabase Auth
      email,
      password: '', // Ne pas stocker le mot de passe en clair
      name,
      company_name: company,
      siren,
      specializations: specializations || [],
      experience: experience || '',
      location: location || '',
      rating: 0,
      compensation: 0,
      description: description || '',
      status: 'active',
      disponibilites: null,
      certifications: null,
      card_number: card_number || null,
      card_expiry: card_expiry || null,
      card_cvc: card_cvc || null,
      abonnement: abonnement || 'basic',
      auth_id: authData.user.id,
      created_at: now,
      updated_at: now
    };

    const { data: expert, error: expertError } = await supabase
      .from('Expert')
      .insert([expertData])
      .select('*')
      .single();

    if (expertError) {
      console.error('❌ Erreur création expert dans la base:', expertError);
      // Supprimer l'utilisateur Supabase Auth en cas d'erreur
      await supabaseService.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({
        success: false,
        error: "Erreur lors de la création de l'expert"
      });
    }

    console.log('✅ Expert créé dans la base:', expert.id);

    // 3. Retourner les données de l'expert (sans mot de passe)
    const publicExpert: PublicExpert = {
      id: expert.id,
      name: expert.name,
      email: expert.email,
      company_name: expert.company_name,
      siren: expert.siren,
      specializations: expert.specializations,
      location: expert.location,
      rating: expert.rating,
      status: expert.status,
      description: expert.description,
      disponibilites: expert.disponibilites,
      certifications: expert.certifications,
      created_at: expert.created_at,
      updated_at: expert.updated_at
    };

    return res.json({
      success: true,
      data: publicExpert,
      message: "Expert inscrit avec succès"
    });

  } catch (error: any) {
    console.error("❌ Erreur lors de l'inscription de l'expert:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Une erreur est survenue lors de l'inscription"
    });
  }
});

// GET /api/experts
router.get('/', async (req, res) => {
  try {
    const { data: expertsData, error } = await supabase
      .from('Expert')
      .select(`
        id,
        name,
        email,
        company_name,
        siren,
        specializations,
        experience,
        location,
        rating,
        compensation,
        description,
        status,
        disponibilites,
        certifications,
        created_at,
        updated_at
      `)
      .eq('status', 'active')
      .order('name');

    if (error) throw error;

    // Conversion sûre des données en PublicExpert[]
    const experts: PublicExpert[] = expertsData.map(expert => ({
      id: expert.id,
      name: expert.name,
      email: expert.email,
      company_name: expert.company_name,
      siren: expert.siren,
      specializations: expert.specializations || [],
      experience: expert.experience,
      location: expert.location,
      rating: expert.rating,
      compensation: expert.compensation,
      description: expert.description,
      status: expert.status,
      disponibilites: expert.disponibilites,
      certifications: expert.certifications,
      created_at: expert.created_at,
      updated_at: expert.updated_at
    }));

    const response: ApiResponse<PublicExpert[]> = {
      success: true,
      data: experts
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching experts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching experts'
    });
  }
});

// GET /api/experts/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: expertData, error } = await supabase
      .from('Expert')
      .select(`
        id,
        name,
        email,
        company_name,
        siren,
        specializations,
        experience,
        location,
        rating,
        compensation,
        description,
        status,
        disponibilites,
        certifications,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!expertData) {
      return res.status(404).json({
        success: false,
        message: 'Expert non trouvé'
      });
    }

    // Conversion sûre des données en PublicExpert
    const expert: PublicExpert = {
      id: expertData.id,
      name: expertData.name,
      email: expertData.email,
      company_name: expertData.company_name,
      siren: expertData.siren,
      specializations: expertData.specializations || [],
      experience: expertData.experience,
      location: expertData.location,
      rating: expertData.rating,
      compensation: expertData.compensation,
      description: expertData.description,
      status: expertData.status,
      disponibilites: expertData.disponibilites,
      certifications: expertData.certifications,
      created_at: expertData.created_at,
      updated_at: expertData.updated_at
    };

    const response: ApiResponse<PublicExpert> = {
      success: true,
      data: expert
    };

    res.json(response);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'expert'
    });
  }
});

// GET /api/experts/:id/audits
router.get('/:id/audits', async (req, res) => {
  try {
    const { data: auditsData, error } = await supabase
      .from('audits')
      .select(`
        id,
        client_name,
        status,
        type,
        progress,
        potential_gain,
        obtained_gain,
        created_at,
        updated_at
      `)
      .eq('expert_id', req.params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Conversion sûre des données en AuditResponse[]
    const audits: AuditResponse[] = auditsData.map(audit => ({
      id: audit.id,
      client_name: audit.client_name,
      status: audit.status,
      type: audit.type,
      progress: audit.progress,
      potential_gain: audit.potential_gain,
      obtained_gain: audit.obtained_gain,
      created_at: audit.created_at,
      updated_at: audit.updated_at
    }));

    const response: ApiResponse<AuditResponse[]> = {
      success: true,
      data: audits
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching audits:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching audits'
    });
  }
});

export default router; 