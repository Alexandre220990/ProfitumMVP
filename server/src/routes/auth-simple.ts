import express, { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { supabaseAuthMiddleware, AuthenticatedRequest } from '../middleware/supabase-auth-simple';

dotenv.config();

/**
 * ✅ ROUTES D'AUTHENTIFICATION SIMPLIFIÉES - SUPABASE NATIVE
 * 
 * Architecture :
 * 1. Frontend authentifie DIRECTEMENT avec Supabase (supabase.auth.signInWithPassword)
 * 2. Backend sert uniquement à récupérer le profil utilisateur (GET /api/auth/me)
 * 
 * Avantages :
 * ✅ Moins d'étapes
 * ✅ Session auto-gérée par Supabase SDK
 * ✅ Refresh automatique
 * ✅ Plus simple à maintenir
 */

const router = express.Router();

// Créer un client Supabase avec la clé SERVICE_ROLE pour lire les données des tables
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

/**
 * 🔍 GET /api/auth/me
 * Récupère le profil utilisateur complet basé sur le token Supabase
 */
router.get('/me', supabaseAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;
    
    console.log('📋 [/api/auth/me] Récupération profil pour:', {
      userId: user.id,
      email: user.email,
      type: user.type
    });

    // Récupérer les données complètes depuis la table appropriée selon le type
    let profileData = null;
    let tableName = '';

    switch (user.type) {
      case 'client':
        tableName = 'Client';
        const { data: client, error: clientError } = await supabaseAdmin
          .from('Client')
          .select('*')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        
        if (clientError) {
          console.error('❌ Erreur récupération client:', clientError);
        } else if (client) {
          profileData = {
            ...client,
            type: 'client',
            auth_user_id: user.id
          };
        }
        break;

      case 'expert':
        tableName = 'Expert';
        const { data: expert, error: expertError } = await supabaseAdmin
          .from('Expert')
          .select('*')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        
        if (expertError) {
          console.error('❌ Erreur récupération expert:', expertError);
        } else if (expert) {
          // Vérifier le statut d'approbation
          if (expert.approval_status !== 'approved') {
            console.log('⚠️ Expert non approuvé:', expert.approval_status);
            return res.status(403).json({
              success: false,
              message: 'Votre compte est en cours d\'approbation par les équipes Profitum. Vous recevrez un email dès que votre compte sera validé.',
              approval_status: expert.approval_status
            });
          }
          
          profileData = {
            ...expert,
            type: 'expert',
            auth_user_id: user.id
          };
        }
        break;

      case 'admin':
        tableName = 'Admin';
        const { data: admin, error: adminError } = await supabaseAdmin
          .from('Admin')
          .select('*')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        
        if (adminError) {
          console.error('❌ Erreur récupération admin:', adminError);
        } else if (admin) {
          profileData = {
            ...admin,
            type: 'admin',
            auth_user_id: user.id
          };
        }
        break;

      case 'apporteur':
        tableName = 'Apporteur';
        const { data: apporteur, error: apporteurError } = await supabaseAdmin
          .from('Apporteur')
          .select('*')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        
        if (apporteurError) {
          console.error('❌ Erreur récupération apporteur:', apporteurError);
        } else if (apporteur) {
          profileData = {
            ...apporteur,
            type: 'apporteur',
            auth_user_id: user.id
          };
        }
        break;
    }

    // Si aucun profil trouvé dans les tables, créer un profil minimal
    if (!profileData) {
      console.log('⚠️ Aucun profil trouvé dans la table', tableName, '- Création profil minimal');
      profileData = {
        id: user.id,
        email: user.email,
        type: user.type,
        auth_user_id: user.id,
        username: user.user_metadata?.username || user.email?.split('@')[0],
        ...user.user_metadata
      };
    }

    console.log('✅ Profil récupéré avec succès pour:', user.email);

    return res.json({
      success: true,
      data: {
        user: profileData
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération du profil:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil utilisateur',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * 🔍 GET /api/auth/check (alias de /me pour compatibilité)
 */
router.get('/check', supabaseAuthMiddleware, async (req: Request, res: Response, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;
    
    console.log('📋 [/api/auth/check] Récupération profil pour:', {
      userId: user.id,
      email: user.email,
      type: user.type
    });

    // Récupérer les données complètes depuis la table appropriée selon le type
    let profileData = null;
    let tableName = '';

    switch (user.type) {
      case 'client':
        tableName = 'Client';
        const { data: client, error: clientError } = await supabaseAdmin
          .from('Client')
          .select('*')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        
        if (clientError) {
          console.error('❌ Erreur récupération client:', clientError);
        } else if (client) {
          profileData = {
            ...client,
            type: 'client',
            auth_user_id: user.id
          };
        }
        break;

      case 'expert':
        tableName = 'Expert';
        const { data: expert, error: expertError } = await supabaseAdmin
          .from('Expert')
          .select('*')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        
        if (expertError) {
          console.error('❌ Erreur récupération expert:', expertError);
        } else if (expert) {
          // Vérifier le statut d'approbation
          if (expert.approval_status !== 'approved') {
            console.log('⚠️ Expert non approuvé:', expert.approval_status);
            return res.status(403).json({
              success: false,
              message: 'Votre compte est en cours d\'approbation par les équipes Profitum.',
              approval_status: expert.approval_status
            });
          }
          
          profileData = {
            ...expert,
            type: 'expert',
            auth_user_id: user.id
          };
        }
        break;

      case 'admin':
        tableName = 'Admin';
        const { data: admin, error: adminError } = await supabaseAdmin
          .from('Admin')
          .select('*')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        
        if (adminError) {
          console.error('❌ Erreur récupération admin:', adminError);
        } else if (admin) {
          profileData = {
            ...admin,
            type: 'admin',
            auth_user_id: user.id
          };
        }
        break;

      case 'apporteur':
        tableName = 'Apporteur';
        const { data: apporteur, error: apporteurError } = await supabaseAdmin
          .from('Apporteur')
          .select('*')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        
        if (apporteurError) {
          console.error('❌ Erreur récupération apporteur:', apporteurError);
        } else if (apporteur) {
          profileData = {
            ...apporteur,
            type: 'apporteur',
            auth_user_id: user.id
          };
        }
        break;
    }

    // Si aucun profil trouvé dans les tables, créer un profil minimal
    if (!profileData) {
      console.log('⚠️ Aucun profil trouvé dans la table', tableName, '- Création profil minimal');
      profileData = {
        id: user.id,
        email: user.email,
        type: user.type,
        auth_user_id: user.id,
        username: user.user_metadata?.username || user.email?.split('@')[0],
        ...user.user_metadata
      };
    }

    console.log('✅ Profil récupéré avec succès pour:', user.email);

    return res.json({
      success: true,
      data: {
        user: profileData
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération du profil:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil utilisateur',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * 🔄 POST /api/auth/refresh
 * Endpoint pour forcer un refresh de token (optionnel, géré automatiquement par Supabase)
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token requis'
      });
    }

    // Note: Le refresh est normalement géré automatiquement par le SDK Supabase côté client
    // Cette route est fournie pour les cas où un refresh manuel est nécessaire
    
    return res.json({
      success: true,
      message: 'Le refresh de token est géré automatiquement par Supabase SDK côté client'
    });

  } catch (error) {
    console.error('❌ Erreur refresh:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du refresh'
    });
  }
});

export default router;

