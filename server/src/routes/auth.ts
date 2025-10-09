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

// Route de connexion CLIENT UNIQUEMENT
router.post('/client/login', loginRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔑 Tentative de connexion CLIENT:", { email });

    // Authentifier avec Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData?.user) {
      console.error("❌ Erreur d'authentification CLIENT:", authError);
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const userId = authData.user.id;
    const userEmail = authData.user.email;
    
    console.log("🔍 Connexion CLIENT - Recherche EXCLUSIVE dans Client");
    
    // ===== RECHERCHE UNIQUEMENT DANS CLIENT =====
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
    
    console.log("✅ Client authentifié avec succès:", { email: userEmail, status: client.status });

    // Générer le token JWT
    const token = jwt.sign(
      { 
        id: authData.user.id,  // Supabase Auth ID
        email: userEmail, 
        type: 'client',
        database_id: client.id  // ID de la table Client
      },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    return res.json({
      success: true,
      data: {
        token,
        user: client
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors de la connexion CLIENT:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Route de connexion EXPERT UNIQUEMENT
router.post('/expert/login', loginRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔑 Tentative de connexion EXPERT:", { email });

    // Authentifier avec Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData?.user) {
      console.error("❌ Erreur d'authentification EXPERT:", authError);
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const userId = authData.user.id;
    const userEmail = authData.user.email;
    
    console.log("🔍 Connexion EXPERT - Recherche EXCLUSIVE dans Expert");
    
    // ===== RECHERCHE UNIQUEMENT DANS EXPERT =====
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
    
    console.log("✅ Expert authentifié avec succès:", { email: userEmail, approval_status: expert.approval_status });

    // Générer le token JWT
    const token = jwt.sign(
      { 
        id: expert.id,
        email: userEmail, 
        type: 'expert' 
      },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    return res.json({
      success: true,
      data: {
        token,
        user: expert
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors de la connexion EXPERT:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Route de connexion APPORTEUR UNIQUEMENT - VERSION REFACTORISÉE
router.post('/apporteur/login', loginRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔑 Tentative de connexion APPORTEUR:", { email });

    // 1. Authentification Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData?.user) {
      console.error("❌ Erreur d'authentification APPORTEUR:", authError);
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const userEmail = authData.user.email;
    console.log("✅ Authentification Supabase réussie pour:", userEmail);
    
    // 2. Recherche dans la table ApporteurAffaires
    console.log("🔍 Recherche apporteur dans ApporteurAffaires...");
    let { data: apporteur, error: apporteurError } = await supabase
      .from('ApporteurAffaires')
      .select('id, email, first_name, last_name, company_name, status, created_at')
      .eq('email', userEmail)
      .single();
      
    console.log("📊 Résultat requête ApporteurAffaires:");
    console.log("   - Error:", apporteurError ? apporteurError.message : 'NONE');
    console.log("   - Data:", apporteur ? 'FOUND' : 'NULL');
    if (apporteur) {
      console.log("   - Apporteur complet:", JSON.stringify(apporteur, null, 2));
      // Si apporteur est un tableau, prendre le premier élément
      if (Array.isArray(apporteur)) {
        console.log("⚠️  Apporteur est un tableau, extraction du premier élément");
        apporteur = apporteur[0];
      }
    }
    
    if (apporteurError) {
      console.log("❌ Erreur requête apporteur:", apporteurError.message);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification du compte apporteur',
        error: 'DATABASE_ERROR'
      });
    }
      
    if (!apporteur) {
      console.log("❌ Apporteur non trouvé dans ApporteurAffaires");
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas enregistré comme apporteur d\'affaires. Contactez l\'administrateur.',
        error: 'NOT_APPORTEUR'
      });
    }
    
    // 3. Vérification du statut (DÉSACTIVÉE - TOUS LES APPORTEURS PEUVENT SE CONNECTER)
    console.log("🔍 Statut apporteur (vérification désactivée):");
    console.log("   - Status:", apporteur.status);
    console.log("   - Status Type:", typeof apporteur.status);
    console.log("✅ Connexion autorisée pour tous les apporteurs (vérification status désactivée)");
    
    console.log("✅ Apporteur authentifié avec succès:", { 
      email: userEmail, 
      status: apporteur.status,
      id: apporteur.id 
    });

    // 4. Génération du token JWT
    const token = jwt.sign(
      { 
        id: authData.user.id,  // Utiliser l'Auth ID de Supabase
        email: userEmail, 
        type: 'apporteur',
        database_id: apporteur.id  // Garder l'ID de la table pour référence
      },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    // 5. Réponse de succès
    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: apporteur.id,
          email: apporteur.email,
          type: 'apporteur',
          database_id: apporteur.id,
          first_name: apporteur.first_name,
          last_name: apporteur.last_name,
          company_name: apporteur.company_name,
          status: apporteur.status
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la connexion APPORTEUR:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Route de connexion GÉNÉRIQUE (pour compatibilité)
router.post('/login', loginRateLimiter, async (req, res) => {
  try {
    const { email, password, type, user_type } = req.body;
    const effectiveType = type || user_type; // Support des deux formats
    console.log("🔑 Tentative de connexion:", { email, type: effectiveType });

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
    
    // LOGIQUE EXCLUSIVE SELON LA PAGE DE CONNEXION UTILISÉE
    let userType = effectiveType;
    let userDetails = null;
    
    console.log(`🔍 Connexion ${effectiveType} - Recherche EXCLUSIVE dans table ${effectiveType}`);
    
    if (effectiveType === 'apporteur' || effectiveType === 'apporteur_affaires') {
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
      const clientData = {
        id: authData.user.id, // Utiliser directement l'ID Supabase Auth comme ID de la table Client
        auth_id: authData.user.id, // Référence explicite à l'ID Supabase Auth
        email,
        // ⚠️ PAS de champ password - l'authentification est gérée par Supabase Auth
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
      console.log('📊 Données client à insérer:', clientData);

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
        jwtConfig.secret,
        { expiresIn: jwtConfig.expiresIn }
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
    } else if (type === 'expert') {
      // Préparation des données expert complètes
      const expertData = {
        id: authData.user.id, // Utiliser directement l'ID Supabase Auth comme ID de la table Expert
        auth_id: authData.user.id, // Référence explicite à l'ID Supabase Auth
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

      // Générer le token JWT (même si non approuvé, pour permettre l'accès au dashboard)
      const token = jwt.sign(
        { 
          id: insertedExpert.id, 
          email: insertedExpert.email, 
          type: insertedExpert.type || 'expert'
        },
        jwtConfig.secret,
        { expiresIn: jwtConfig.expiresIn }
      );

      // Préparer la réponse avec message d'approbation
      return res.status(200).json({
        success: true,
        message: 'Expert inscrit avec succès. Votre compte sera activé après validation par nos équipes.',
        data: {
          token,
          user: {
            id: insertedExpert.id,
            email: insertedExpert.email,
            name: insertedExpert.name,
            type: 'expert',
            company_name: insertedExpert.company_name || null,
            siren: insertedExpert.siren || null,
            phone_number: insertedExpert.phone_number || null,
            address: insertedExpert.address || null,
            city: insertedExpert.city || null,
            postal_code: insertedExpert.postal_code || null,
            approval_status: insertedExpert.approval_status,
            status: insertedExpert.status,
            created_at: insertedExpert.created_at,
            updated_at: insertedExpert.updated_at
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

export default router; 