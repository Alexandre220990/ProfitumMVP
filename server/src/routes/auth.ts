import express, { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';
import supabase from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware } from '../middleware/auth';
import { RequestWithUser, AuthUser, BaseUser, UserMetadata, RequestHandlerWithUser } from '../types/auth';
import { logger } from '../utils/logger';

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
const checkAuth: RequestHandler = async (req, res) => {
  try {
    const typedReq = req as RequestWithUser;
    if (!typedReq.user) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    const userId = typedReq.user.id;
    const userEmail = typedReq.user.email;
    const userType = typedReq.user.type;

    // Récupérer les données de l'utilisateur selon son type
    let userData = null;
    
    if (userType === 'client') {
      const { data: client, error: clientError } = await supabase
        .from('Client')
        .select('*')
        .eq('id', userId)
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
      const { data: expert, error: expertError } = await supabase
        .from('Expert')
        .select('*')
        .eq('id', userId)
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
        type: userType
      };
    }

    res.json({
      success: true,
      data: {
        user: userData
      }
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du token',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
};

router.get('/check', authMiddleware, checkAuth);

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
      const { data: client, error: clientError } = await supabase
        .from('Client')
        .select('*')
        .eq('id', userId)
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

    // Générer le token JWT
    const token = jwt.sign(
      { 
        id: userId, 
        email: userEmail, 
        type: userType 
      },
      process.env.SUPABASE_JWT_SECRET || 'votre_secret_jwt_super_securise',
      { expiresIn: '24h' }
    );

    console.log("✅ Connexion réussie:", { userId, email: userEmail, type: userType });

    res.json({
      success: true,
      data: {
        token,
        user: userDetails
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Route de connexion des clients
router.options('/client/login', (req, res) => {
  const origin = req.headers.origin;
  
  // Accepter explicitement l'origine de la requête pour les requêtes preflight OPTIONS
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    console.log(`🔑 OPTIONS preflight pour /client/login - Origine acceptée: ${origin}`);
  }
  
  res.status(204).end();
});

router.post('/client/login', async (req, res) => {
  // Traiter les headers CORS manuellement pour cette route spécifique
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    console.log(`🔑 POST /client/login - Origine acceptée: ${origin}`);
  }

  try {
    console.log('Tentative de connexion client avec:', { email: req.body.email });
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Email ou mot de passe manquant');
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    console.log('Recherche du client dans la base de données...');
    const { data: client, error } = await supabase
      .from('Client')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !client) {
      console.log('Client non trouvé:', email);
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    console.log('Client trouvé, vérification du mot de passe...');
    const validPassword = await bcrypt.compare(password, client.password);
    
    if (!validPassword) {
      console.log('Mot de passe incorrect pour:', email);
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    console.log('Mot de passe valide, génération du token...');
    const token = jwt.sign(
      { id: client.id, email: client.email, role: 'client' },
      process.env.JWT_SECRET || 'votre_secret_jwt_super_securise',
      { expiresIn: '24h' }
    );

    console.log('Connexion réussie pour:', email);
    res.json({
      success: true,
      data: {
        client: {
          id: client.id,
          name: client.name,
          email: client.email,
          type: 'client',
          company: client.company,
          phone: client.phone,
          revenuAnnuel: client.revenuAnnuel,
          secteurActivite: client.secteurActivite,
          nombreEmployes: client.nombreEmployes,
          ancienneteEntreprise: client.ancienneteEntreprise,
          besoinFinancement: client.besoinFinancement,
          typeProjet: client.typeProjet,
          simulationId: client.simulationId
        },
        token
      }
    });
  } catch (error) {
    console.error('Erreur détaillée lors de la connexion:', error);
    res.status(500).json({
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

// Route de vérification du token
const verifyToken: RequestHandler = async (req, res) => {
  try {
    const typedReq = req as RequestWithUser;
    if (!typedReq.user) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    const userId = typedReq.user.id;
    const userEmail = typedReq.user.email;
    const userMetadata = typedReq.user.user_metadata || {};

    // Vérifier d'abord dans la table Client
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select('*')
      .eq('id', userId)
      .single();

    // Si pas trouvé dans Client, vérifier dans Expert
    let userType: 'client' | 'expert' | 'admin' = typedReq.user.type;
    let userDetails = client;
    
    if (!client && userType === 'expert') {
      const { data: expert, error: expertError } = await supabase
        .from('Expert')
        .select('*')
        .eq('id', userId)
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
        name: userMetadata.username || userEmail.split('@')[0],
        type: userType
      };
    }

    res.json({
      success: true,
      data: {
        user: {
          id: userId,
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
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du token',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
};

router.get('/verify', authMiddleware, verifyToken);

// Route de vérification du token (alternative)
const verifyTokenAlt: RequestHandler = async (req, res) => {
  try {
    const typedReq = req as RequestWithUser;
    if (!typedReq.user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    return res.json({
      success: true,
      user: {
        id: typedReq.user.id,
        email: typedReq.user.email,
        type: typedReq.user.type,
        metadata: typedReq.user.user_metadata
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

router.get('/verify-token', authMiddleware, verifyTokenAlt);

// Endpoint pour créer un token Supabase à partir d'un email
router.post('/create-supabase-token', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    // Tentative de connexion avec Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      logger.error('Erreur de connexion Supabase:', error);
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    if (!data.user || !data.session) {
      return res.status(401).json({
        success: false,
        message: 'Connexion échouée'
      });
    }

    // Retourner le token d'accès Supabase
    return res.json({
      success: true,
      data: {
        token: data.session.access_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          type: data.user.user_metadata?.type || 'client'
        }
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la création du token Supabase:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Endpoint pour vérifier un token Supabase
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token requis'
      });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          type: user.user_metadata?.type || 'client'
        }
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la vérification du token:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

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
          nom: user_metadata.nom || email.split('@')[0],
          prenom: user_metadata.prenom || '',
          telephone: user_metadata.telephone || '',
          adresse: user_metadata.adresse || '',
          ville: user_metadata.ville || '',
          code_postal: user_metadata.code_postal || ''
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
          nom: user_metadata.nom || email.split('@')[0],
          prenom: user_metadata.prenom || '',
          telephone: user_metadata.telephone || '',
          specialite: user_metadata.specialite || '',
          numero_agrement: user_metadata.numero_agrement || ''
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

export default router; 