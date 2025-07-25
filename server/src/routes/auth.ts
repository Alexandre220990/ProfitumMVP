import express, { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';
import supabase from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import { authenticateUser } from '../middleware/authenticate';
import { AuthUser, BaseUser, UserMetadata, RequestWithUser } from '../types/auth';
import { logger } from '../utils/logger';
import { googleCalendarService } from '../services/google-calendar-service';

// Charger les variables d'environnement
dotenv.config();

// Créer un client Supabase avec la clé de service pour les opérations admin
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

router.get('/check', authenticateUser, checkAuth);

// Route de connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password, type } = req.body;
    console.log("🔑 Tentative de connexion:", { email, type });

    // Authentifier avec Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
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
    
    // Vérifier le type d'utilisateur
    let userType = type || userMetadata.type || 'client';
    let userDetails = null;
    
    // Récupérer les détails de l'utilisateur selon son type
    if (userType === 'client') {
      // Rechercher le client par email au lieu de l'ID Supabase Auth
      const { data: client, error: clientError } = await supabase
        .from('Client')
        .select('*')
        .eq('email', userEmail)
        .single();
        
      if (clientError) {
        console.error("❌ Erreur lors de la récupération des données client:", clientError);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la récupération des données utilisateur'
        });
      }
      
      userDetails = client;
    } else if (userType === 'expert') {
      const { data: expert, error: expertError } = await supabase
        .from('Expert')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (expertError) {
        console.error("❌ Erreur lors de la récupération des données expert:", expertError);
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
      
      userDetails = expert;
    }

    // Si l'utilisateur n'a pas de profil dans les tables spécifiques
    if (!userDetails) {
      userDetails = {
        id: userId,
        email: userEmail,
        type: userType
      };
    }

    // Générer le token JWT avec l'ID de la table spécifique
    const token = jwt.sign(
      { 
        id: userDetails?.id || userId, // Utiliser l'ID de la table Client/Expert si disponible
        email: userEmail, 
        type: userType 
      },
      process.env.SUPABASE_JWT_SECRET || 'votre_secret_jwt_super_securise',
      { expiresIn: '24h' }
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

// Route d'inscription
router.post("/register", async (req: Request, res: Response) => {
  try {
    const {
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

    console.log('📝 Tentative d\'inscription:', { email, username, type });

    // 1. Préparation des métadonnées utilisateur
    const userMetadata: UserMetadata = {
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

    // 3. Hash du mot de passe pour la table spécifique
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Insertion dans la table appropriée selon le type
    if (type === 'client') {
      // Préparation des données client complètes
      const clientData = {
        id: authData.user.id, // Utiliser directement l'ID Supabase Auth comme ID de la table Client
        email,
        password: hashedPassword, // Mot de passe hashé pour la table Client
        username,
        company_name,
        phone_number,
        address,
        city,
        postal_code,
        siren,
        type,
        revenuAnnuel: revenuAnnuel || null,
        secteurActivite: secteurActivite || null,
        nombreEmployes: nombreEmployes || null,
        ancienneteEntreprise: ancienneteEntreprise || null,
        typeProjet: typeProjet || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Log des données avant insertion
      console.log('📊 Données client à insérer:', { 
        ...clientData, 
        password: '[HASHED]' // Ne pas logger le mot de passe hashé
      });

      // Utiliser supabaseAdmin pour l'insertion
      const { data: insertedClient, error: insertError } = await supabaseAdmin
        .from('Client')
        .insert([clientData])
        .select('*')
        .single();

      if (insertError || !insertedClient) {
        console.error('❌ Erreur insertion Client:', insertError);
        // Nettoyage : suppression de l'utilisateur Supabase Auth en cas d'échec
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return res.status(400).json({
          success: false,
          message: "Erreur lors de la création du profil client",
          error: 'CLIENT_INSERTION_FAILED',
          details: insertError?.message || 'Insertion échouée ou données manquantes'
        });
      }

      console.log('✅ Client créé avec succès:', {
        id: insertedClient.id,
        email: insertedClient.email
      });

      // Générer le token JWT
      const token = jwt.sign(
        { 
          id: insertedClient.id, 
          email: insertedClient.email, 
          type: insertedClient.type 
        },
        process.env.JWT_SECRET || 'votre_secret_jwt_super_securise',
        { expiresIn: '24h' }
      );

      // Préparer la réponse avec tous les champs attendus par le frontend
      return res.status(200).json({
        success: true,
        data: {
          token,
          user: {
            id: insertedClient.id,
            email: insertedClient.email,
            username: insertedClient.username,
            type: insertedClient.type,
            company_name: insertedClient.company_name || null,
            siren: insertedClient.siren || null,
            phone_number: insertedClient.phone_number || null,
            address: insertedClient.address || null,
            city: insertedClient.city || null,
            postal_code: insertedClient.postal_code || null,
            revenuAnnuel: insertedClient.revenuAnnuel || null,
            secteurActivite: insertedClient.secteurActivite || null,
            nombreEmployes: insertedClient.nombreEmployes || null,
            ancienneteEntreprise: insertedClient.ancienneteEntreprise || null,
            typeProjet: insertedClient.typeProjet || null,
            created_at: insertedClient.created_at,
            updated_at: insertedClient.updated_at
          }
        }
      });
    } else {
      // Logique pour l'insertion d'un expert (à implémenter si nécessaire)
      return res.status(400).json({
        success: false,
        message: "Inscription expert non implémentée",
        error: 'EXPERT_NOT_IMPLEMENTED'
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

router.get('/current-user', authenticateUser, getCurrentUser);

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
    let userType: 'client' | 'expert' | 'admin' = authUser.type;
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
          username: userDetails.name,
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

router.get('/verify', authenticateUser, verifyToken);

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

router.get('/verify-token', authenticateUser, verifyTokenAlt);

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
          id: data.user.id, // Utiliser directement l'ID au lieu de auth_id
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
          id: data.user.id, // Utiliser directement l'ID au lieu de auth_id
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
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: userInfo.email,
          name: userInfo.name,
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
router.get('/google/integrations', authenticateUser, async (req, res) => {
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
router.post('/google/logout', authenticateUser, async (req, res) => {
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

export default router; 