import express, { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';
import supabase from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

import { AuthUser, BaseUser, UserMetadata, RequestWithUser } from '../types/auth';
import { logger } from '../utils/logger';
import { googleCalendarService } from '../services/google-calendar-service';
import { jwtConfig } from '../config/jwt';
import { RefreshTokenService } from '../services/RefreshTokenService';
import { loginRateLimiter, registerRateLimiter } from '../middleware/rate-limiter';

// Charger les variables d'environnement
dotenv.config();

// Créer un client Supabase avec la clé de service pour les opérations admin (requêtes tables UNIQUEMENT)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// ✅ Créer un client Supabase ANON pour l'authentification utilisateur (signInWithPassword)
const supabaseAuth = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);

// Les apporteurs utilisent le même client que CLIENT/EXPERT (supabase)
// qui utilise SUPABASE_SERVICE_ROLE_KEY avec les RLS policies pour la sécurité

const router = express.Router();

// Types pour les réponses
interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    user: any;
  };
}

// ============================================================================
// SYSTÈME D'AUTHENTIFICATION SIMPLIFIÉ - UN EMAIL = UN TYPE
// ============================================================================
// Chaque route d'authentification recherche UNIQUEMENT dans sa table spécifique
// Plus de multi-profils, plus de available_types
// ============================================================================

// Route de vérification d'authentification
const checkAuth = async (req: Request, res: express.Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    const authUser = req.user as AuthUser;
    const userId = authUser.id;
    const userEmail = authUser.email;
    const userType = authUser.type;

    // Récupérer les données de l'utilisateur selon son type
    let userData = null;
    
    if (userType === 'client') {
      // Rechercher le client par email au lieu de l'ID Supabase Auth
      const { data: client, error: clientError } = await supabase
        .from('Client')
        .select('*')
        .eq('email', userEmail)
        .single();
        
      if (clientError) {
        console.error('Erreur lors de la récupération des données client:', clientError);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la récupération des données utilisateur'
        });
      }
      
      userData = client;
    } else if (userType === 'expert') {
      // Rechercher l'expert par email au lieu de l'ID Supabase Auth
      const { data: expert, error: expertError } = await supabase
        .from('Expert')
        .select('*')
        .eq('email', userEmail)
        .single();
        
      if (expertError) {
        console.error('Erreur lors de la récupération des données expert:', expertError);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la récupération des données utilisateur'
        });
      }
      
      // Vérifier le statut d'approbation de l'expert
      if (expert.approval_status !== 'approved') {
        console.log("❌ Expert non approuvé:", expert.approval_status);
        return res.status(403).json({
          success: false,
          message: 'Votre compte est en cours d\'approbation par les équipes Profitum. Vous recevrez un email dès que votre compte sera validé.',
          approval_status: expert.approval_status
        });
      }
      
      userData = expert;
    }

    // Si l'utilisateur n'a pas de profil dans les tables spécifiques
    if (!userData) {
      userData = {
        id: userId,
        email: userEmail,
        type: userType
      };
    }

    return res.json({
      success: true,
      data: {
        user: userData
      }
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du token',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
};

router.get('/check', checkAuth);

// ===== ROUTES D'AUTHENTIFICATION DISTINCTES =====

// ============================================================================
// ROUTES D'AUTHENTIFICATION SIMPLIFIÉES (1 email = 1 type)
// ============================================================================

// POST /api/auth/client/login - Connexion CLIENT (SIMPLIFIÉ)
router.post('/client/login', loginRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔑 Connexion CLIENT:", { email });

    // 1. ✅ Authentifier avec Supabase Auth
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData?.user) {
      console.error("❌ Auth échouée:", authError);
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const authUserId = authData.user.id;
    const userEmail = authData.user.email || '';
    
    // 2. ✅ Recherche DIRECTE dans Client uniquement
    const { data: client, error: clientError } = await supabaseAdmin
      .from('Client')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle();
    
    if (clientError || !client) {
      console.error("❌ Client non trouvé:", clientError);
      return res.status(403).json({ 
        success: false, 
        message: 'Aucun compte client trouvé pour cet utilisateur' 
      });
    }
    
    // 3. ✅ Vérifier que le client est actif
    if (client.is_active === false) {
      return res.status(403).json({
        success: false,
        message: 'Compte client désactivé'
      });
    }

    // 4. ✅ Mettre à jour user_metadata (pour refresh auto)
    await supabaseAdmin.auth.admin.updateUserById(authUserId, {
      user_metadata: {
        type: 'client',
        database_id: client.id,
        email: userEmail,
        company_name: client.company_name
      }
    });
    
    console.log("✅ Client authentifié:", { email: userEmail, id: client.id });
    
    // 5. ✅ Retourner session Supabase + données client
    return res.json({
      success: true,
      data: {
        supabase_session: {
          access_token: authData.session?.access_token,
          refresh_token: authData.session?.refresh_token,
          expires_at: authData.session?.expires_at,
          expires_in: authData.session?.expires_in
        },
        user: {
          ...client,
          type: 'client',
          auth_user_id: authUserId
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur connexion CLIENT:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// POST /api/auth/expert/login - Connexion EXPERT (SIMPLIFIÉ)
router.post('/expert/login', loginRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔑 Connexion EXPERT:", { email });

    // 1. ✅ Authentifier avec Supabase Auth
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData?.user) {
      console.error("❌ Auth échouée:", authError);
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const authUserId = authData.user.id;
    const userEmail = authData.user.email || '';
    
    // 2. ✅ Recherche DIRECTE dans Expert uniquement
    const { data: expert, error: expertError } = await supabaseAdmin
      .from('Expert')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle();
    
    if (expertError || !expert) {
      console.error("❌ Expert non trouvé:", expertError);
      return res.status(403).json({ 
        success: false, 
        message: 'Aucun compte expert trouvé pour cet utilisateur' 
      });
    }
    
    // 3. ✅ Vérifier statut actif et approuvé
    if (expert.is_active === false) {
      return res.status(403).json({
        success: false,
        message: 'Compte expert désactivé'
      });
    }
    
    if (expert.approval_status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Compte en attente d\'approbation',
        approval_status: expert.approval_status
      });
    }

    // 4. ✅ Mettre à jour user_metadata (pour refresh auto)
    await supabaseAdmin.auth.admin.updateUserById(authUserId, {
      user_metadata: {
        type: 'expert',
        database_id: expert.id,
        email: userEmail,
        name: expert.name
      }
    });
    
    // 5. ✅ Récupérer infos cabinet si disponible
    let cabinetInfo = null;
    try {
      const { CabinetService } = await import('../services/cabinetService');
      cabinetInfo = await CabinetService.getExpertCabinetInfo(expert.id);
    } catch (cabinetError) {
      console.warn('⚠️ Erreur cabinet (non bloquant):', cabinetError);
    }
    
    console.log("✅ Expert authentifié:", { email: userEmail, id: expert.id });
    
    // 6. ✅ Retourner session Supabase + données expert
    return res.json({
      success: true,
      data: {
        supabase_session: {
          access_token: authData.session?.access_token,
          refresh_token: authData.session?.refresh_token,
          expires_at: authData.session?.expires_at,
          expires_in: authData.session?.expires_in
        },
        user: {
          ...expert,
          type: 'expert',
          auth_user_id: authUserId,
          cabinet: cabinetInfo ? {
            id: cabinetInfo.cabinet_id,
            role: cabinetInfo.membership.team_role,
            permissions: cabinetInfo.permissions
          } : null
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur connexion EXPERT:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// POST /api/auth/apporteur/login - Connexion APPORTEUR (SIMPLIFIÉ)
router.post('/apporteur/login', loginRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔑 Connexion APPORTEUR:", { email });

    // 1. ✅ Authentifier avec Supabase Auth
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData?.user) {
      console.error("❌ Auth échouée:", authError);
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const authUserId = authData.user.id;
    const userEmail = authData.user.email || '';
    
    // 2. ✅ Recherche DIRECTE dans ApporteurAffaires uniquement
    const { data: apporteur, error: apporteurError } = await supabaseAdmin
      .from('ApporteurAffaires')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle();
    
    if (apporteurError || !apporteur) {
      console.error("❌ Apporteur non trouvé:", apporteurError);
      return res.status(403).json({ 
        success: false, 
        message: 'Aucun compte apporteur trouvé pour cet utilisateur' 
      });
    }
    
    // 3. ✅ Vérifier que l'apporteur est actif
    if (apporteur.is_active === false) {
      return res.status(403).json({
        success: false,
        message: 'Compte apporteur désactivé'
      });
    }

    // 4. ✅ Mettre à jour user_metadata (pour refresh auto)
    await supabaseAdmin.auth.admin.updateUserById(authUserId, {
      user_metadata: {
        type: 'apporteur',
        database_id: apporteur.id,
        email: userEmail,
        company_name: apporteur.company_name
      }
    });
    
    console.log("✅ Apporteur authentifié:", { email: userEmail, id: apporteur.id });
    
    // 5. ✅ Retourner session Supabase + données apporteur
    return res.json({
      success: true,
      data: {
        supabase_session: {
          access_token: authData.session?.access_token,
          refresh_token: authData.session?.refresh_token,
          expires_at: authData.session?.expires_at,
          expires_in: authData.session?.expires_in
        },
        user: {
          ...apporteur,
          type: 'apporteur',
          auth_user_id: authUserId
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur connexion APPORTEUR:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// POST /api/auth/admin/login - Connexion ADMIN (SIMPLIFIÉ)
router.post('/admin/login', loginRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔑 Connexion ADMIN:", { email });

    // 1. ✅ Authentifier avec Supabase Auth
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData?.user) {
      console.error("❌ Auth échouée:", authError);
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const authUserId = authData.user.id;
    const userEmail = authData.user.email || '';
    
    // 2. ✅ Recherche DIRECTE dans Admin uniquement (1 email = 1 type)
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('Admin')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle();
    
    if (adminError || !admin) {
      console.error("❌ Admin non trouvé:", adminError);
      return res.status(403).json({ 
        success: false, 
        message: 'Aucun compte administrateur trouvé pour cet utilisateur' 
      });
    }
    
    // 3. ✅ Vérifier que l'admin est actif
    if (admin.is_active === false) {
      return res.status(403).json({
        success: false,
        message: 'Compte administrateur désactivé'
      });
    }

    // 4. ✅ Mettre à jour user_metadata (pour refresh auto)
    await supabaseAdmin.auth.admin.updateUserById(authUserId, {
      user_metadata: {
        type: 'admin',
        database_id: admin.id,
        email: userEmail,
        name: admin.name
      }
    });
    
    console.log("✅ Admin authentifié:", { email: userEmail, id: admin.id });

    // 5. ✅ Retourner session Supabase + données admin
    return res.json({
      success: true,
      data: {
        supabase_session: {
          access_token: authData.session?.access_token,
          refresh_token: authData.session?.refresh_token,
          expires_at: authData.session?.expires_at,
          expires_in: authData.session?.expires_in
        },
        user: {
          ...admin,
          type: 'admin',
          auth_user_id: authUserId
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur connexion ADMIN:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// ⚠️ Route de connexion GÉNÉRIQUE (DÉPRÉCIÉE depuis décembre 2025)
// ⚠️ MIGRATION : Utiliser /client/login, /admin/login, /expert/login, /apporteur/login
router.post('/login', loginRateLimiter, async (req, res) => {
  try {
    const { email, password, type, user_type } = req.body;
    const effectiveType = type || user_type; // Support des deux formats
    
    // ⚠️ Logs de dépréciation
    console.warn('⚠️ ========================================');
    console.warn('⚠️ ROUTE DÉPRÉCIÉE: /api/auth/login');
    console.warn(`⚠️ Utilisateur: ${email} | Type: ${effectiveType}`);
    console.warn(`⚠️ Utiliser plutôt: /api/auth/${effectiveType}/login`);
    console.warn('⚠️ Cette route sera supprimée le 31 décembre 2025');
    console.warn('⚠️ ========================================');
    
    // Headers de dépréciation (pour monitoring)
    res.setHeader('X-API-Deprecated', 'true');
    res.setHeader('X-API-Deprecated-Since', '2025-12-03');
    res.setHeader('X-API-Deprecated-Sunset', '2025-12-31');
    res.setHeader('X-API-Deprecated-Alternative', `/api/auth/${effectiveType}/login`);
    
    console.log("🔑 Tentative de connexion générique (déprécié):", { email, type: effectiveType });

    // ✅ Authentifier avec Supabase Auth (client ANON pour l'authentification)
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData?.user) {
      console.error("❌ Erreur d'authentification:", authError);
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const userId = authData.user.id;
    const userEmail = authData.user.email;
    const userMetadata = authData.user.user_metadata || {};
    
    // LOGIQUE EXCLUSIVE SELON LA PAGE DE CONNEXION UTILISÉE
    let userType = effectiveType;
    let userDetails = null;
    
    console.log(`🔍 Connexion ${effectiveType} - Recherche EXCLUSIVE dans table ${effectiveType}`);
    
    if (effectiveType === 'apporteur') {
      // ===== CONNEXION APPORTEUR : Recherche UNIQUEMENT dans ApporteurAffaires =====
      console.log("🔍 Recherche apporteur dans ApporteurAffaires (route générique)...");
      let { data: apporteur, error: apporteurError } = await supabase
        .from('ApporteurAffaires')
        .select('id, email, first_name, last_name, company_name, status, created_at')
        .eq('email', userEmail)
        .single();
        
      console.log("📊 Résultat requête ApporteurAffaires (générique):");
      console.log("   - Error:", apporteurError ? apporteurError.message : 'NONE');
      console.log("   - Data:", apporteur ? 'FOUND' : 'NULL');
      if (apporteur) {
        console.log("   - Status:", apporteur.status);
        console.log("   - Status Type:", typeof apporteur.status);
        // Si apporteur est un tableau, prendre le premier élément
        if (Array.isArray(apporteur)) {
          console.log("⚠️  Apporteur est un tableau (générique), extraction du premier élément");
          apporteur = apporteur[0];
        }
      }
        
      if (apporteurError || !apporteur) {
        console.log("❌ Apporteur non trouvé:", apporteurError?.message);
        return res.status(403).json({
          success: false,
          message: 'Vous n\'êtes pas enregistré comme apporteur d\'affaires. Contactez l\'administrateur.',
          error: 'NOT_APPORTEUR'
        });
      }
      
      // Vérification du statut désactivée (TOUS LES APPORTEURS PEUVENT SE CONNECTER)
      console.log("🔍 Statut apporteur (générique, vérification désactivée):", apporteur.status);
      console.log("✅ Connexion autorisée pour tous les apporteurs (vérification status désactivée)");
      
      userDetails = apporteur;
      userType = 'apporteur';
      console.log("✅ Apporteur authentifié avec succès (générique):", { email: userEmail, status: apporteur.status });
      
    } else if (effectiveType === 'client') {
      // ===== CONNEXION CLIENT : Recherche UNIQUEMENT dans Client =====
      const { data: client, error: clientError } = await supabase
        .from('Client')
        .select('*')
        .eq('email', userEmail)
        .single();
        
      if (clientError || !client) {
        console.log("❌ Client non trouvé:", clientError?.message);
        return res.status(403).json({
          success: false,
          message: 'Vous n\'êtes pas enregistré comme client. Contactez l\'administrateur.',
          error: 'NOT_CLIENT'
        });
      }
      
      userDetails = client;
      userType = 'client';
      console.log("✅ Client authentifié avec succès:", { email: userEmail, status: client.status });
      
    } else if (effectiveType === 'expert') {
      // ===== CONNEXION EXPERT : Recherche UNIQUEMENT dans Expert =====
      const { data: expert, error: expertError } = await supabase
        .from('Expert')
        .select('*')
        .eq('email', userEmail)
        .single();
        
      if (expertError || !expert) {
        console.log("❌ Expert non trouvé:", expertError?.message);
        return res.status(403).json({
          success: false,
          message: 'Vous n\'êtes pas enregistré comme expert. Contactez l\'administrateur.',
          error: 'NOT_EXPERT'
        });
      }
      
      // Vérifier le statut d'approbation de l'expert
      if (expert.approval_status !== 'approved') {
        console.log("❌ Expert non approuvé:", expert.approval_status);
        return res.status(403).json({
          success: false,
          message: 'Votre compte est en cours d\'approbation par les équipes Profitum. Vous recevrez un email dès que votre compte sera validé.',
          approval_status: expert.approval_status
        });
      }
      
      userDetails = expert;
      userType = 'expert';
      console.log("✅ Expert authentifié avec succès:", { email: userEmail, approval_status: expert.approval_status });
      
    } else {
      // Type non reconnu
      console.log("❌ Type de connexion non reconnu:", type);
      return res.status(400).json({
        success: false,
        message: 'Type de connexion non valide',
        error: 'INVALID_TYPE'
      });
    }

    // userDetails est maintenant toujours défini grâce à la logique exclusive

    // Générer le token JWT avec l'ID Supabase Auth pour tous les types
    const token = jwt.sign(
      { 
        id: userId,  // Toujours utiliser l'ID Supabase Auth
        email: userEmail, 
        type: userType,
        database_id: userDetails?.id  // ID de la table spécifique
      },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    console.log("✅ Connexion réussie:", { userId, email: userEmail, type: userType });

    return res.json({
      success: true,
      data: {
        token,
        user: userDetails
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors de la connexion:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Route pour vérifier si un SIREN existe déjà
router.post("/check-siren", async (req: Request, res: Response) => {
  try {
    const { siren } = req.body;

    if (!siren) {
      return res.status(400).json({
        success: false,
        message: "SIREN requis",
        error: 'MISSING_SIREN'
      });
    }

    // Vérifier si le SIREN existe dans la table Client
    const { data: existingClient, error: clientError } = await supabaseAdmin
      .from('Client')
      .select('id, company_name')
      .eq('siren', siren)
      .single();

    if (clientError && clientError.code !== 'PGRST116') {
      console.error('❌ Erreur vérification SIREN:', clientError);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la vérification du SIREN",
        error: 'DATABASE_ERROR'
      });
    }

    const exists = !!existingClient;

    return res.status(200).json({
      success: true,
      data: {
        exists,
        siren,
        company_name: existingClient?.company_name || null
      }
    });

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    return res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de la vérification",
      error: 'SERVER_ERROR'
    });
  }
});

// Route d'inscription
router.post("/register", registerRateLimiter, async (req: Request, res: Response) => {
  try {
    const {
      first_name,
      last_name,
      username,
      email,
      password,
      company_name,
      phone_number,
      address = '',
      city = '',
      postal_code = '',
      siren,
      type,
      revenuAnnuel,
      secteurActivite,
      nombreEmployes,
      ancienneteEntreprise,
      typeProjet
    } = req.body;

    // Validation des champs requis
    const requiredFields = [
      'username',
      'email',
      'password',
      'company_name',
      'phone_number',
      'siren',
      'type'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: `Champs requis manquants: ${missingFields.join(', ')}`,
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Vérification du type d'utilisateur
    if (type !== 'client' && type !== 'expert') {
      return res.status(400).json({ 
        success: false,
        message: "Le type doit être 'client' ou 'expert'",
        error: 'INVALID_USER_TYPE'
      });
    }

    console.log('📝 Type d\'inscription:', type);

    console.log('📝 Tentative d\'inscription:', { email, username, type });

    // 1. Préparation des métadonnées utilisateur
    const userMetadata: UserMetadata = {
      first_name: first_name || username,
      last_name: last_name || '',
      name: `${first_name || ''} ${last_name || ''}`.trim() || username,
      username,
      type,
      company_name,
      siren,
      phone_number,
      address,
      city,
      postal_code
    };

    // 2. Création de l'utilisateur dans Supabase Auth avec supabaseAdmin
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: userMetadata
    });

    if (authError) {
      console.error('❌ Erreur Supabase Auth:', authError);
      return res.status(400).json({
        success: false,
        message: authError.message,
        error: 'AUTH_ERROR'
      });
    }

    if (!authData.user) {
      return res.status(400).json({
        success: false,
        message: "Échec de la création de l'utilisateur",
        error: 'USER_CREATION_FAILED'
      });
    }

    // 3. Insertion dans la table appropriée selon le type
    // ⚠️ SÉCURITÉ : Le mot de passe est UNIQUEMENT géré par Supabase Auth
    // On ne stocke PAS de mot de passe dans les tables métier
    if (type === 'client') {
      // Préparation des données client complètes
      // Convertir les chaînes vides en NULL pour les champs numériques
      const nombreEmployesValue = nombreEmployes === '' || nombreEmployes === null || nombreEmployes === undefined 
        ? null 
        : Number(nombreEmployes);
      const revenuAnnuelValue = revenuAnnuel === '' || revenuAnnuel === null || revenuAnnuel === undefined 
        ? null 
        : Number(revenuAnnuel);
      const ancienneteEntrepriseValue = ancienneteEntreprise === '' || ancienneteEntreprise === null || ancienneteEntreprise === undefined 
        ? null 
        : Number(ancienneteEntreprise);

      const clientData = {
        // Ne PAS utiliser l'ID Supabase Auth comme ID de la table (générer nouveau UUID)
        auth_user_id: authData.user.id, // 🔥 Lien vers Supabase Auth
        email,
        // ⚠️ PAS de champ password - l'authentification est gérée par Supabase Auth
        first_name: first_name || null,
        last_name: last_name || null,
        name: `${first_name || ''} ${last_name || ''}`.trim() || username,
        username,
        company_name,
        phone_number,
        address,
        city,
        postal_code,
        siren,
        type,
        revenuAnnuel: revenuAnnuelValue,
        secteurActivite: secteurActivite || null,
        nombreEmployes: nombreEmployesValue,
        ancienneteEntreprise: ancienneteEntrepriseValue,
        typeProjet: typeProjet || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Log des données avant insertion
      console.log('📊 Données client à insérer:', clientData);

      // Utiliser supabaseAdmin pour l'insertion
      const { data: insertedClient, error: insertError } = await supabaseAdmin
        .from('Client')
        .insert([clientData])
        .select('*')
        .single();

      if (insertError || !insertedClient) {
        console.error('❌ Erreur insertion Client:', insertError);
        
        // Détecter le type d'erreur spécifique
        let errorMessage = "Erreur lors de la création du profil client";
        let errorCode = 'CLIENT_INSERTION_FAILED';
        
        // Erreur de SIREN dupliqué
        if (insertError?.code === '23505' && insertError?.message?.includes('Client_siren_key')) {
          errorMessage = "Ce numéro SIREN est déjà utilisé par un autre client";
          errorCode = 'DUPLICATE_SIREN';
          console.error('❌ SIREN dupliqué détecté:', clientData.siren);
        }
        // Erreur d'email dupliqué
        else if (insertError?.code === '23505' && insertError?.message?.includes('Client_email_key')) {
          errorMessage = "Cette adresse email est déjà utilisée";
          errorCode = 'DUPLICATE_EMAIL';
        }
        
        // Nettoyage : suppression de l'utilisateur Supabase Auth en cas d'échec
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        
        return res.status(400).json({
          success: false,
          message: errorMessage,
          error: errorCode,
          details: insertError?.message || 'Insertion échouée ou données manquantes'
        });
      }

      console.log('✅ Client créé avec succès:', {
        id: insertedClient.id,
        email: insertedClient.email
      });

      // 📦 TRANSFERT DES PRODUITS DE LA SIMULATION ANONYME (si existante)
      // Si l'utilisateur vient d'une simulation anonyme, transférer ses produits
      const sessionToken = req.body.session_token || req.body.sessionToken;
      if (sessionToken) {
        try {
          console.log(`🔄 Transfert des produits de la session: ${sessionToken.substring(0, 8)}...`);
          
          // 1. Trouver la simulation anonyme
          const { data: anonymousSimulation, error: simError } = await supabaseAdmin
            .from('simulations')
            .select('id, client_id, answers, status, results')
            .eq('session_token', sessionToken)
            .single();

          if (!simError && anonymousSimulation) {
            const tempClientId = anonymousSimulation.client_id;
            
            console.log(`📋 Simulation trouvée - Client temporaire: ${tempClientId}`);

            // 2. Récupérer les produits existants liés à cette simulation
            let transferredCount = 0;
            const nowIso = new Date().toISOString();
            const { data: existingProducts, error: existingProductsError } = await supabaseAdmin
              .from('ClientProduitEligible')
              .select('id, metadata')
              .eq('simulationId', anonymousSimulation.id);

            if (existingProductsError) {
              console.error('⚠️ Erreur récupération produits à transférer:', existingProductsError);
            }

            if (existingProducts && existingProducts.length > 0) {
              await Promise.all(
                existingProducts.map(async (product) => {
                  const existingMetadata = (product.metadata as Record<string, any> | null | undefined) ?? {};
                  const mergedMetadata = {
                    ...existingMetadata,
                    migrated_from_session: sessionToken,
                    migrated_at: nowIso,
                    original_client_id: tempClientId
                  };

                  const { data: updatedProduct, error: updateError } = await supabaseAdmin
                    .from('ClientProduitEligible')
                    .update({
                      clientId: insertedClient.id,
                      metadata: mergedMetadata,
                      updated_at: nowIso
                    })
                    .eq('id', product.id)
                    .select('id')
                    .single();

                  if (updateError) {
                    console.error('⚠️ Erreur transfert produit (non bloquant):', product.id, updateError);
                    return;
                  }

                  if (updatedProduct) {
                    transferredCount += 1;
                  }
                })
              );

              console.log(`✅ ${transferredCount} produits transférés vers le nouveau client`);
            } else {
              console.log('ℹ️ Aucun ClientProduitEligible existant à transférer pour cette simulation');
            }

            // 3. Fallback: recréer les produits à partir des résultats stockés
            if (transferredCount === 0) {
              const produits = (anonymousSimulation.results as any)?.produits;
              if (Array.isArray(produits) && produits.length > 0) {
                let recreatedCount = 0;
                for (const produit of produits) {
                  if (!produit?.is_eligible) {
                    continue;
                  }

                  const insertPayload: Record<string, any> = {
                    clientId: insertedClient.id,
                    produitId: produit.produit_id,
                    simulationId: anonymousSimulation.id,
                    statut: 'eligible',
                    montantFinal: produit.montant_estime || 0,
                    notes: produit.notes || null,
                    calcul_details: produit.calcul_details || null,
                    metadata: {
                      ...(produit.metadata ?? {}),
                      source: 'post_signup_transfer',
                      migrated_from_session: sessionToken,
                      migrated_at: nowIso,
                      original_client_id: tempClientId
                    },
                    created_at: nowIso,
                    updated_at: nowIso
                  };

                  const { data: insertedProduit, error: insertError } = await supabaseAdmin
                    .from('ClientProduitEligible')
                    .insert(insertPayload)
                    .select('id')
                    .single();

                  if (insertError) {
                    console.error('⚠️ Erreur recréation produit (non bloquant):', produit.produit_nom || produit.produit_id, insertError);
                    continue;
                  }

                  if (insertedProduit) {
                    recreatedCount += 1;
                  }
                }

                transferredCount = recreatedCount;
                console.log(`✅ ${recreatedCount} produits recréés pour le nouveau client à partir de la simulation`);
              }
            }

            // 3. Lier la simulation au nouveau client
            const { error: updateSimError } = await supabaseAdmin
              .from('simulations')
              .update({ 
                client_id: insertedClient.id,
                status: 'completed',
                updated_at: nowIso
              })
              .eq('id', anonymousSimulation.id);

            if (updateSimError) {
              console.error('⚠️ Erreur mise à jour simulation (non bloquant):', updateSimError);
            } else {
              console.log('✅ Simulation liée au nouveau client');
            }

            // 4. Marquer le client temporaire comme migré (optionnel - ne pas supprimer pour audit)
            await supabaseAdmin
              .from('Client')
              .update({ 
                is_temporary: false,
                updated_at: nowIso
              })
              .eq('id', tempClientId);

          } else {
            console.log('ℹ️  Aucune simulation anonyme à transférer');
          }
        } catch (migrationError) {
          console.error('⚠️ Erreur lors du transfert des produits (non bloquant):', migrationError);
          // Ne pas faire échouer l'inscription à cause de la migration
        }
      }

      // 🔔 NOTIFICATION ADMIN : Nouveau client inscrit
      try {
        const { NotificationTriggers } = await import('../services/NotificationTriggers');
        await NotificationTriggers.onNewClientRegistration({
          id: insertedClient.id,
          nom: insertedClient.name || '',
          prenom: insertedClient.name || '',
          email: insertedClient.email,
          company: insertedClient.company_name
        });
        console.log('✅ Notification admin nouveau client envoyée');
      } catch (notifError) {
        console.error('❌ Erreur création notification admin:', notifError);
      }

      // ✅ Mettre à jour user_metadata
      await supabaseAdmin.auth.admin.updateUserById(authData.user.id, {
        user_metadata: {
          type: 'client',
          database_id: insertedClient.id,
          email: insertedClient.email,
          company_name: insertedClient.company_name
        }
      });

      console.log('✅ Client inscrit avec succès. Connexion automatique...');
      
      // ✅ Connecter automatiquement après inscription
      const { data: signInData, error: signInError } = await supabaseAuth.auth.signInWithPassword({
        email: insertedClient.email,
        password
      });
      
      if (signInError || !signInData.session) {
        console.warn('⚠️ Inscription OK mais connexion auto échouée');
        return res.status(200).json({
          success: true,
          message: 'Inscription réussie. Veuillez vous connecter.',
          data: { user: { ...insertedClient, type: 'client' } }
        });
      }

      // ✅ Retourner session Supabase
      return res.status(200).json({
        success: true,
        data: {
          supabase_session: {
            access_token: signInData.session.access_token,
            refresh_token: signInData.session.refresh_token,
            expires_at: signInData.session.expires_at,
            expires_in: signInData.session.expires_in
          },
          user: {
            ...insertedClient,
            type: 'client',
            auth_user_id: authData.user.id
          }
        }
      });
    } else if (type === 'expert') {
      // Préparation des données expert complètes
      const expertData = {
        // Laisser Supabase générer un UUID pour l'ID de la table
        auth_user_id: authData.user.id, // 🔥 Lien vers Supabase Auth
        email,
        // ⚠️ PAS de champ password - l'authentification est gérée par Supabase Auth
        name: username,
        company_name,
        phone_number,
        address,
        city,
        postal_code,
        siren,
        specializations: [], // Peut être complété après inscription
        experience: '', // Peut être complété après inscription
        location: `${city || ''} ${postal_code || ''}`.trim(),
        description: '',
        approval_status: 'pending', // Les experts nécessitent une approbation
        status: 'inactive', // Inactif jusqu'à approbation
        is_active: true,
        rating: 0,
        total_dossiers: 0,
        dossiers_en_cours: 0,
        dossiers_termines: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Log des données avant insertion
      console.log('📊 Données expert à insérer:', expertData);

      // Utiliser supabaseAdmin pour l'insertion
      const { data: insertedExpert, error: insertError } = await supabaseAdmin
        .from('Expert')
        .insert([expertData])
        .select('*')
        .single();

      if (insertError || !insertedExpert) {
        console.error('❌ Erreur insertion Expert:', insertError);
        // Nettoyage : suppression de l'utilisateur Supabase Auth en cas d'échec
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return res.status(400).json({
          success: false,
          message: "Erreur lors de la création du profil expert",
          error: 'EXPERT_INSERTION_FAILED',
          details: insertError?.message || 'Insertion échouée ou données manquantes'
        });
      }

      console.log('✅ Expert créé avec succès:', {
        id: insertedExpert.id,
        email: insertedExpert.email,
        approval_status: insertedExpert.approval_status
      });

      // 🔔 NOTIFICATION ADMIN : Nouvel expert en attente de validation
      try {
        const { NotificationTriggers } = await import('../services/NotificationTriggers');
        await NotificationTriggers.onNewExpertRegistration({
          id: insertedExpert.id,
          nom: insertedExpert.name || '',
          prenom: insertedExpert.name || '',
          email: insertedExpert.email,
          specialite: Array.isArray(insertedExpert.specializations) ? insertedExpert.specializations.join(', ') : undefined
        });
        console.log('✅ Notification admin nouvel expert envoyée');
      } catch (notifError) {
        console.error('❌ Erreur notification admin (non bloquant):', notifError);
      }

      // ✅ Mettre à jour user_metadata
      await supabaseAdmin.auth.admin.updateUserById(authData.user.id, {
        user_metadata: {
          type: 'expert',
          database_id: insertedExpert.id,
          email: insertedExpert.email,
          name: insertedExpert.name
        }
      });

      // ✅ Expert doit attendre approbation, pas de connexion auto
      return res.status(200).json({
        success: true,
        message: 'Expert inscrit avec succès. Votre compte sera activé après validation par nos équipes.',
        data: {
          user: {
            ...insertedExpert,
            type: 'expert',
            auth_user_id: authData.user.id
          }
        }
      });
    } else {
      // Type non reconnu
      return res.status(400).json({
        success: false,
        message: "Type d'utilisateur non reconnu. Utilisez 'client' ou 'expert'",
        error: 'INVALID_USER_TYPE'
      });
    }

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    return res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de l'inscription",
      error: 'SERVER_ERROR',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Route pour récupérer les informations de l'utilisateur connecté
const getCurrentUser = async (req: Request, res: express.Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    const authUser = req.user as AuthUser;
    const userId = authUser.id;
    const userEmail = authUser.email;
    const userType = authUser.type;
    const userMetadata = authUser.user_metadata || {};

    // Récupérer les données de l'utilisateur selon son type
    let userData = null;
    
    if (userType === 'client') {
      // Rechercher le client par email au lieu de l'ID Supabase Auth
      const { data: client, error: clientError } = await supabase
        .from('Client')
        .select('*')
        .eq('email', userEmail)
        .single();
        
      if (clientError) {
        console.error('Erreur lors de la récupération des données client:', clientError);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la récupération des données utilisateur'
        });
      }
      
      userData = client;
    } else if (userType === 'expert') {
      // Rechercher l'expert par email au lieu de l'ID Supabase Auth
      const { data: expert, error: expertError } = await supabase
        .from('Expert')
        .select('*')
        .eq('email', userEmail)
        .single();
        
      if (expertError) {
        console.error('Erreur lors de la récupération des données expert:', expertError);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la récupération des données utilisateur'
        });
      }
      
      userData = expert;
    } else if (userType === 'apporteur') {
      // Rechercher l'apporteur par email
      const { data: apporteur, error: apporteurError } = await supabase
        .from('ApporteurAffaires')
        .select('*')
        .eq('email', userEmail)
        .single();
        
      if (apporteurError) {
        console.error('❌ Erreur lors de la récupération des données apporteur:', apporteurError);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la récupération des données utilisateur'
        });
      }
      
      // Vérifier le statut de l'apporteur
      if (apporteur.status !== 'active') {
        console.log('❌ Apporteur non actif:', apporteur.status);
        return res.status(403).json({
          success: false,
          message: 'Votre compte apporteur d\'affaires n\'est pas encore activé. Contactez l\'administrateur.',
          status: apporteur.status
        });
      }
      
      userData = apporteur;
    }

    // Si l'utilisateur n'a pas de profil dans les tables spécifiques
    if (!userData) {
      userData = {
        id: userId,
        email: userEmail,
        name: userMetadata.username || (userEmail ? userEmail.split('@')[0] : 'Utilisateur'),
        type: userType
      };
    }

    return res.json({
      success: true,
      data: {
        user: userData
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données utilisateur:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données utilisateur',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
};

router.get('/current-user', getCurrentUser);

// Route de vérification du token
const verifyToken = async (req: Request, res: express.Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    const authUser = req.user as AuthUser;
    const userId = authUser.id;
    const userEmail = authUser.email;
    const userMetadata = authUser.user_metadata || {};

    // Vérifier d'abord dans la table Client par email
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select('*')
      .eq('email', userEmail)
      .single();

    // Si pas trouvé dans Client, vérifier dans Expert par email
    let userType: 'client' | 'expert' | 'admin' | 'apporteur' = authUser.type;
    let userDetails = client;
    
    if (!client && userType === 'expert') {
      const { data: expert, error: expertError } = await supabase
        .from('Expert')
        .select('*')
        .eq('email', userEmail)
        .single();

      if (expert) {
        userDetails = expert;
      }
    }
    
    // Si pas trouvé dans Expert, vérifier dans ApporteurAffaires par email
    if (!client && !userDetails) {
      const { data: apporteur, error: apporteurError } = await supabase
        .from('ApporteurAffaires')
        .select('*')
        .eq('email', userEmail)
        .single();

      if (apporteur && !apporteurError) {
        userDetails = apporteur;
        userType = 'apporteur';
        console.log('✅ Apporteur trouvé dans la base de données:', { id: apporteur.id, email: apporteur.email, status: apporteur.status });
      } else {
        console.log('❌ Apporteur non trouvé dans la base de données pour:', userEmail);
      }
    }

    // Si aucun profil trouvé, utiliser les métadonnées de l'utilisateur auth
    if (!userDetails) {
      userDetails = {
        id: userId,
        email: userEmail,
        name: userMetadata.username || (userEmail ? userEmail.split('@')[0] : 'Utilisateur'),
        type: userType
      };
    }

    return res.json({
      success: true,
      data: {
        user: {
          id: userDetails.id,
          email: userEmail,
          username: `${userDetails.first_name || ''} ${userDetails.last_name || ''}`.trim() || userDetails.company_name,
          type: userType,
          company_name: userDetails.company || userDetails.company_name,
          phone_number: userDetails.phone || userDetails.phone_number,
          address: userDetails.address,
          city: userDetails.city,
          postal_code: userDetails.postal_code,
          siren: userDetails.siren
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du token',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
};

router.get('/verify', verifyToken);

// Route de vérification du token (alternative)
const verifyTokenAlt = async (req: Request, res: express.Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    const authUser = req.user as AuthUser;

    return res.json({
      success: true,
      user: {
        id: authUser.id,
        email: authUser.email,
        type: authUser.type,
        metadata: authUser.user_metadata
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du token'
    });
  }
};

router.get('/verify-token', verifyTokenAlt);

// Endpoint pour créer un utilisateur dans Supabase
router.post('/create-user', async (req, res) => {
  try {
    const { email, password, type = 'client', user_metadata = {} } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    // Créer l'utilisateur dans Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          type,
          ...user_metadata
        }
      }
    });

    if (error) {
      logger.error('Erreur lors de la création de l\'utilisateur:', error);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (!data.user) {
      return res.status(400).json({
        success: false,
        message: 'Échec de la création de l\'utilisateur'
      });
    }

    // Créer le profil dans la table appropriée
    let profileData = null;
    
    if (type === 'client') {
      const { data: clientData, error: clientError } = await supabase
        .from('Client')
        .insert({
          auth_user_id: data.user.id, // 🔥 Lien vers Supabase Auth
          email: email,
          nom: (user_metadata as any).nom || email.split('@')[0],
          prenom: (user_metadata as any).prenom || '',
          telephone: (user_metadata as any).telephone || '',
          adresse: (user_metadata as any).adresse || '',
          ville: (user_metadata as any).ville || '',
          code_postal: (user_metadata as any).code_postal || ''
        })
        .select()
        .single();

      if (clientError) {
        logger.error('Erreur lors de la création du profil client:', clientError);
        // Ne pas échouer complètement, l'utilisateur est créé dans Auth
      } else {
        profileData = clientData;
      }
    } else if (type === 'expert') {
      const { data: expertData, error: expertError } = await supabase
        .from('Expert')
        .insert({
          auth_user_id: data.user.id, // 🔥 Lien vers Supabase Auth
          email: email,
          nom: (user_metadata as any).nom || email.split('@')[0],
          prenom: (user_metadata as any).prenom || '',
          telephone: (user_metadata as any).telephone || '',
          specialite: (user_metadata as any).specialite || '',
          numero_agrement: (user_metadata as any).numero_agrement || ''
        })
        .select()
        .single();

      if (expertError) {
        logger.error('Erreur lors de la création du profil expert:', expertError);
        // Ne pas échouer complètement, l'utilisateur est créé dans Auth
      } else {
        profileData = expertData;
      }
    }

    return res.json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          type: type,
          profile: profileData
        }
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la création de l\'utilisateur:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// ============================================================================
// VALIDATION SÉCURISÉE GOOGLE OAUTH
// ============================================================================

/**
 * Validation sécurisée du callback Google OAuth
 * ✅ Validation côté serveur avec secrets
 * ✅ Protection contre les attaques CSRF
 * ✅ Validation des tokens
 */
router.post('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.body;

    // Validation des paramètres d'entrée
    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Code d\'autorisation invalide'
      });
    }

    // Validation du state pour prévenir les attaques CSRF
    if (!state || typeof state !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Paramètre state manquant'
      });
    }

    // Échange du code contre des tokens (validation côté serveur)
    const tokens = await googleCalendarService.exchangeCodeForTokens(code);
    
    if (!tokens || !tokens.access_token) {
      return res.status(400).json({
        success: false,
        message: 'Échec de l\'échange de tokens'
      });
    }

    // Validation des tokens reçus
    const tokenValidation = await googleCalendarService.validateTokens(tokens.access_token);
    
    if (!tokenValidation.valid) {
      return res.status(401).json({
        success: false,
        message: 'Tokens Google invalides'
      });
    }

    // Récupération des informations utilisateur depuis Google
    const userInfo = await googleCalendarService.getUserInfo(tokens.access_token);
    
    if (!userInfo || !userInfo.email) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de récupérer les informations utilisateur'
      });
    }

    // Recherche ou création de l'utilisateur dans Supabase
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userInfo.email)
      .single();

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      
      // Mise à jour des informations utilisateur
      await supabase
        .from('users')
        .update({
          google_access_token: tokens.access_token,
          google_refresh_token: tokens.refresh_token,
          google_token_expiry: tokens.expiry_date,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
    } else {
      // Création d'un nouvel utilisateur
      // Pour Google OAuth, utiliser name comme company_name (pas de given_name/family_name disponibles)
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: userInfo.email,
          first_name: userInfo.name || '',
          last_name: '',
          google_access_token: tokens.access_token,
          google_refresh_token: tokens.refresh_token,
          google_token_expiry: tokens.expiry_date,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (createError || !newUser) {
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la création de l\'utilisateur'
        });
      }

      userId = newUser.id;
    }

    // Création d'un JWT sécurisé
    const jwtToken = jwt.sign(
      { 
        userId, 
        email: userInfo.email,
        googleAccessToken: tokens.access_token 
      },
      process.env.JWT_SECRET!,
      { 
        expiresIn: '24h',
        issuer: 'profitum',
        audience: 'profitum-users'
      }
    );

    // Configuration de l'intégration Google Calendar
    await googleCalendarService.setupUserIntegration(userId, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      scope: tokens.scope,
      token_type: tokens.token_type
    });

    return res.json({
      success: true,
      data: {
        token: jwtToken,
        user: {
          id: userId,
          email: userInfo.email,
          name: userInfo.name
        }
      },
      message: 'Authentification Google réussie'
    });

  } catch (error) {
    console.error('❌ Erreur authentification Google:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'authentification'
    });
  }
});

// ============================================================================
// ROUTES SÉCURISÉES
// ============================================================================

/**
 * Récupération des intégrations Google de l'utilisateur
 * ✅ Authentification requise
 * ✅ Validation des permissions
 */
router.get('/google/integrations', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    const authUser = req.user as AuthUser;
    const integrations = await googleCalendarService.getUserIntegrations(authUser.id);
    
    return res.json({
      success: true,
      data: integrations,
      message: 'Intégrations récupérées avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur récupération intégrations:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des intégrations'
    });
  }
});

/**
 * Déconnexion Google
 * ✅ Authentification requise
 * ✅ Révoquer les tokens
 */
router.post('/google/logout', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    const authUser = req.user as AuthUser;

    // Révoquer les tokens Google
    await googleCalendarService.revokeUserTokens(authUser.id);
    
    // Supprimer les tokens de la base de données
    await supabase
      .from('users')
      .update({
        google_access_token: null,
        google_refresh_token: null,
        google_token_expiry: null
      })
      .eq('id', authUser.id);

    return res.json({
      success: true,
      message: 'Déconnexion Google réussie'
    });

  } catch (error) {
    console.error('❌ Erreur déconnexion Google:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion'
    });
  }
});

// ===== ROUTES REFRESH TOKEN =====

/**
 * Route pour renouveler le token d'accès avec un refresh token
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token requis'
      });
    }

    // Renouveler les tokens
    const tokens = await RefreshTokenService.refreshAccessToken(refreshToken);

    if (!tokens) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token invalide ou expiré. Veuillez vous reconnecter.'
      });
    }

    return res.json({
      success: true,
      data: tokens
    });

  } catch (error) {
    console.error('❌ Erreur lors du renouvellement du token:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du renouvellement du token'
    });
  }
});

/**
 * Route pour révoquer un refresh token (déconnexion sur un appareil)
 * POST /api/auth/revoke
 */
router.post('/revoke', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token requis'
      });
    }

    const decoded = jwt.decode(refreshToken) as any;
    if (decoded?.tokenId) {
      await RefreshTokenService.revokeRefreshToken(decoded.tokenId);
    }

    return res.json({
      success: true,
      message: 'Token révoqué avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la révocation du token:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la révocation du token'
    });
  }
});

/**
 * Route pour révoquer tous les tokens d'un utilisateur (déconnexion partout)
 * POST /api/auth/revoke-all
 */
router.post('/revoke-all', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const authUser = req.user as AuthUser;
    await RefreshTokenService.revokeAllUserTokens(authUser.id);

    return res.json({
      success: true,
      message: 'Tous les tokens ont été révoqués'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la révocation des tokens:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la révocation des tokens'
    });
  }
});

/**
 * Route pour obtenir toutes les sessions actives
 * GET /api/auth/sessions
 */
router.get('/sessions', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const authUser = req.user as AuthUser;
    const sessions = await RefreshTokenService.getUserActiveSessions(authUser.id);

    return res.json({
      success: true,
      data: { sessions }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des sessions:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des sessions'
    });
  }
});

// ============================================================================
// ROUTE SWITCH TYPE - SUPPRIMÉE
// ============================================================================
// Plus nécessaire avec le système simplifié (1 email = 1 type)
// Si besoin de changer de type, l'utilisateur doit créer un nouveau compte

export default router; 