import express, { Router, Request, Response } from 'express';
import { authenticateUser } from '../middleware/authenticate';
import { AuthUser } from '../types/auth';
import { googleCalendarService, GoogleCalendarIntegration } from '../services/google-calendar-service';
import { asyncHandler } from '../utils/asyncHandler';
import { rateLimit } from 'express-rate-limit';
import Joi from 'joi';
import { supabase } from '../lib/supabase';

const router = express.Router();

// ============================================================================
// RATE LIMITING ET SÉCURITÉ
// ============================================================================

const googleCalendarLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requêtes par fenêtre
  message: {
    success: false,
    message: 'Trop de requêtes Google Calendar, veuillez réessayer plus tard'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================================
// VALIDATION DES DONNÉES
// ============================================================================

const connectIntegrationSchema = Joi.object({
  google_account_email: Joi.string().email().required(),
  calendar_id: Joi.string().default('primary'),
  is_primary: Joi.boolean().default(false),
  sync_enabled: Joi.boolean().default(true),
  sync_direction: Joi.string().valid('import', 'export', 'bidirectional').default('bidirectional')
});

const updateIntegrationSchema = Joi.object({
  calendar_id: Joi.string(),
  is_primary: Joi.boolean(),
  sync_enabled: Joi.boolean(),
  sync_direction: Joi.string().valid('import', 'export', 'bidirectional'),
  error_message: Joi.string().allow('', null)
});

const validateConnectIntegration = (req: Request, res: Response, next: Function) => {
  const { error } = connectIntegrationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides pour la connexion',
      errors: error.details.map(detail => detail.message)
    });
  }
  next();
};

const validateUpdateIntegration = (req: Request, res: Response, next: Function) => {
  const { error } = updateIntegrationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides pour la mise à jour',
      errors: error.details.map(detail => detail.message)
    });
  }
  next();
};

// ============================================================================
// ROUTES D'AUTHENTIFICATION OAUTH2
// ============================================================================

/**
 * GET /api/google-calendar/auth/url - Générer l'URL d'autorisation Google
 */
router.get('/auth/url', authenticateUser, googleCalendarLimiter, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthUser;
  const { state } = req.query;

  try {
    // Générer l'URL d'autorisation avec l'état utilisateur
    const authUrl = googleCalendarService.generateAuthUrl(
      state ? `${state}_${authUser.id}` : authUser.id
    );

    return res.json({
      success: true,
      data: {
        authUrl,
        state: state || authUser.id
      },
      message: 'URL d\'autorisation générée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur génération URL auth:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

/**
 * GET /api/google-calendar/auth/callback - Callback OAuth2 Google
 */
router.get('/auth/callback', asyncHandler(async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  if (error) {
    console.error('❌ Erreur OAuth2 Google:', error);
    return res.redirect(`${process.env.CLIENT_URL}/google-calendar/error?error=${error}`);
  }

  if (!code) {
    return res.redirect(`${process.env.CLIENT_URL}/google-calendar/error?error=no_code`);
  }

  try {
    // Extraire l'ID utilisateur de l'état
    const userId = state?.toString().split('_')[1] || state?.toString();
    
    if (!userId) {
      return res.redirect(`${process.env.CLIENT_URL}/google-calendar/error?error=invalid_state`);
    }

    // Échanger le code contre des tokens
    const tokens = await googleCalendarService.exchangeCodeForTokens(code.toString());

    // Récupérer les informations du compte Google
    const oauth2Client = googleCalendarService['getOAuth2Client'](tokens.access_token);
    const calendar = require('googleapis').calendar({ version: 'v3', auth: oauth2Client });
    
    const profileResponse = await calendar.calendarList.list();
    const primaryCalendar = profileResponse.data.items?.find((cal: any) => cal.primary);
    const googleAccountEmail = primaryCalendar?.id || 'primary';

    // Rediriger vers le client avec les tokens
    const redirectUrl = `${process.env.CLIENT_URL}/google-calendar/connect?` +
      `tokens=${encodeURIComponent(JSON.stringify(tokens))}&` +
      `google_account_email=${encodeURIComponent(googleAccountEmail)}&` +
      `user_id=${encodeURIComponent(userId)}`;

    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('❌ Erreur callback OAuth2:', error);
    return res.redirect(`${process.env.CLIENT_URL}/google-calendar/error?error=token_exchange_failed`);
  }
}));

// ============================================================================
// ROUTES DE GESTION DES INTÉGRATIONS
// ============================================================================

/**
 * POST /api/google-calendar/connect - Connecter un compte Google Calendar
 */
router.post('/connect', authenticateUser, googleCalendarLimiter, validateConnectIntegration, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthUser;
  const { 
    google_account_email, 
    calendar_id, 
    is_primary, 
    sync_enabled, 
    sync_direction,
    tokens 
  } = req.body;

  try {
    // Vérifier si l'intégration existe déjà
    const existingIntegrations = await googleCalendarService.getUserIntegrations(authUser.id);
    const existingIntegration = existingIntegrations.find(
      integration => integration.google_account_email === google_account_email
    );

    if (existingIntegration) {
      return res.status(409).json({
        success: false,
        message: 'Cette adresse Google est déjà connectée'
      });
    }

    // Décoder les tokens si fournis
    let accessToken: string;
    let refreshToken: string;
    let tokenExpiresAt: string;

    if (tokens) {
      const decodedTokens = JSON.parse(decodeURIComponent(tokens));
      accessToken = decodedTokens.access_token;
      refreshToken = decodedTokens.refresh_token;
      tokenExpiresAt = new Date(decodedTokens.expiry_date).toISOString();
    } else {
      return res.status(400).json({
        success: false,
        message: 'Tokens d\'authentification requis'
      });
    }

    // Créer l'intégration
    const integrationData: Omit<GoogleCalendarIntegration, 'id' | 'created_at' | 'updated_at'> = {
      user_id: authUser.id,
      user_type: authUser.type as 'client' | 'expert' | 'admin',
      google_account_email,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_expires_at: tokenExpiresAt,
      calendar_id: calendar_id || 'primary',
      is_primary: is_primary || false,
      sync_enabled: sync_enabled !== false,
      sync_direction: sync_direction || 'bidirectional',
      sync_status: 'idle'
    };

    const integrationId = await googleCalendarService.saveIntegration(integrationData);

    // Si c'est l'intégration primaire, désactiver les autres
    if (is_primary) {
      for (const integration of existingIntegrations) {
        if (integration.is_primary) {
          await googleCalendarService.updateIntegration(integration.id, { is_primary: false });
        }
      }
    }

    // Log de l'activité
    await logGoogleCalendarActivity(
      authUser.id,
      authUser.type,
      'connect_integration',
      'integration',
      integrationId,
      { googleAccountEmail: google_account_email }
    );

    return res.status(201).json({
      success: true,
      data: { integrationId },
      message: 'Compte Google Calendar connecté avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur connexion Google Calendar:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

/**
 * GET /api/google-calendar/integrations - Lister les intégrations de l'utilisateur
 */
router.get('/integrations', authenticateUser, googleCalendarLimiter, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthUser;

  try {
    const integrations = await googleCalendarService.getUserIntegrations(authUser.id);

    return res.json({
      success: true,
      data: integrations,
      message: 'Intégrations récupérées avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur récupération intégrations:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

/**
 * GET /api/google-calendar/integrations/:id - Récupérer une intégration spécifique
 */
router.get('/integrations/:id', authenticateUser, googleCalendarLimiter, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthUser;
  const { id } = req.params;

  try {
    const { data: integration, error } = await supabase
      .from('GoogleCalendarIntegration')
      .select('*')
      .eq('id', id)
      .eq('user_id', authUser.id)
      .single();

    if (error || !integration) {
      return res.status(404).json({ success: false, message: 'Intégration non trouvée' });
    }

    res.json({
      success: true,
      data: integration,
      message: 'Intégration récupérée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur récupération intégration:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

/**
 * PUT /api/google-calendar/integrations/:id - Mettre à jour une intégration
 */
router.put('/integrations/:id', authenticateUser, googleCalendarLimiter, validateUpdateIntegration, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthUser;
  const { id } = req.params;
  const updates = req.body;

  try {
    // Vérifier que l'intégration appartient à l'utilisateur
    const { data: existingIntegration, error: fetchError } = await supabase
      .from('GoogleCalendarIntegration')
      .select('*')
      .eq('id', id)
      .eq('user_id', authUser.id)
      .single();

    if (fetchError || !existingIntegration) {
      return res.status(404).json({ success: false, message: 'Intégration non trouvée' });
    }

    // Mettre à jour l'intégration
    const success = await googleCalendarService.updateIntegration(id, updates);

    if (!success) {
      return res.status(500).json({ success: false, message: 'Erreur mise à jour' });
    }

    // Si c'est maintenant l'intégration primaire, désactiver les autres
    if (updates.is_primary) {
      const { data: otherIntegrations } = await supabase
        .from('GoogleCalendarIntegration')
        .select('id')
        .eq('user_id', authUser.id)
        .eq('is_primary', true)
        .neq('id', id);

      for (const integration of otherIntegrations || []) {
        await googleCalendarService.updateIntegration(integration.id, { is_primary: false });
      }
    }

    // Log de l'activité
    await logGoogleCalendarActivity(
      authUser.id,
      authUser.type,
      'update_integration',
      'integration',
      id,
      updates
    );

    return res.json({
      success: true,
      message: 'Intégration mise à jour avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour intégration:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

/**
 * DELETE /api/google-calendar/integrations/:id - Supprimer une intégration
 */
router.delete('/integrations/:id', authenticateUser, googleCalendarLimiter, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthUser;
  const { id } = req.params;

  try {
    // Vérifier que l'intégration appartient à l'utilisateur
    const { data: existingIntegration, error: fetchError } = await supabase
      .from('GoogleCalendarIntegration')
      .select('*')
      .eq('id', id)
      .eq('user_id', authUser.id)
      .single();

    if (fetchError || !existingIntegration) {
      return res.status(404).json({ success: false, message: 'Intégration non trouvée' });
    }

    // Supprimer l'intégration
    const success = await googleCalendarService.deleteIntegration(id);

    if (!success) {
      return res.status(500).json({ success: false, message: 'Erreur suppression' });
    }

    // Log de l'activité
    await logGoogleCalendarActivity(
      authUser.id,
      authUser.type,
      'delete_integration',
      'integration',
      id,
      { googleAccountEmail: existingIntegration.google_account_email }
    );

    return res.json({
      success: true,
      message: 'Intégration supprimée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur suppression intégration:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

// ============================================================================
// ROUTES DE GESTION DES CALENDRERS
// ============================================================================

/**
 * GET /api/google-calendar/calendars - Lister les calendriers Google disponibles
 */
router.get('/calendars', authenticateUser, googleCalendarLimiter, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthUser;
  const { integration_id } = req.query;

  if (!integration_id) {
    return res.status(400).json({ success: false, message: 'ID d\'intégration requis' });
  }

  try {
    // Récupérer l'intégration
    const { data: integration, error: fetchError } = await supabase
      .from('GoogleCalendarIntegration')
      .select('*')
      .eq('id', integration_id)
      .eq('user_id', authUser.id)
      .single();

    if (fetchError || !integration) {
      return res.status(404).json({ success: false, message: 'Intégration non trouvée' });
    }

    // Vérifier si le token est expiré
    if (googleCalendarService.isTokenExpired(new Date(integration.token_expires_at).getTime())) {
      // Rafraîchir le token
      const newTokens = await googleCalendarService.refreshTokens(integration.refresh_token);
      await googleCalendarService.updateIntegration(integration_id as string, {
        access_token: newTokens.access_token,
        token_expires_at: new Date(newTokens.expiry_date).toISOString()
      });
      integration.access_token = newTokens.access_token;
    }

    // Lister les calendriers
    const calendars = await googleCalendarService.listCalendars(integration.access_token);

    return res.json({
      success: true,
      data: calendars,
      message: 'Calendriers récupérés avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur récupération calendriers:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

/**
 * GET /api/google-calendar/free-busy - Obtenir la disponibilité
 */
router.get('/free-busy', authenticateUser, googleCalendarLimiter, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthUser;
  const { integration_id, calendar_ids, time_min, time_max } = req.query;

  if (!integration_id || !calendar_ids || !time_min || !time_max) {
    return res.status(400).json({ 
      success: false, 
      message: 'integration_id, calendar_ids, time_min et time_max sont requis' 
    });
  }

  try {
    // Récupérer l'intégration
    const { data: integration, error: fetchError } = await supabase
      .from('GoogleCalendarIntegration')
      .select('*')
      .eq('id', integration_id)
      .eq('user_id', authUser.id)
      .single();

    if (fetchError || !integration) {
      return res.status(404).json({ success: false, message: 'Intégration non trouvée' });
    }

    // Vérifier si le token est expiré
    if (googleCalendarService.isTokenExpired(new Date(integration.token_expires_at).getTime())) {
      const newTokens = await googleCalendarService.refreshTokens(integration.refresh_token);
      await googleCalendarService.updateIntegration(integration_id as string, {
        access_token: newTokens.access_token,
        token_expires_at: new Date(newTokens.expiry_date).toISOString()
      });
      integration.access_token = newTokens.access_token;
    }

    // Obtenir la disponibilité
    const calendarIds = (calendar_ids as string).split(',');
    const timeMin = new Date(time_min as string);
    const timeMax = new Date(time_max as string);

    const freeBusy = await googleCalendarService.getFreeBusy(
      integration.access_token,
      calendarIds,
      timeMin,
      timeMax
    );

    return res.json({
      success: true,
      data: freeBusy,
      message: 'Disponibilité récupérée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur récupération disponibilité:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

// ============================================================================
// ROUTES DE SYNCHRONISATION
// ============================================================================

/**
 * POST /api/google-calendar/sync - Déclencher une synchronisation
 */
router.post('/sync', authenticateUser, googleCalendarLimiter, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthUser;
  const { integration_id, sync_type = 'full' } = req.body;

  if (!integration_id) {
    return res.status(400).json({ success: false, message: 'ID d\'intégration requis' });
  }

  try {
    // Récupérer l'intégration
    const { data: integration, error: fetchError } = await supabase
      .from('GoogleCalendarIntegration')
      .select('*')
      .eq('id', integration_id)
      .eq('user_id', authUser.id)
      .single();

    if (fetchError || !integration) {
      return res.status(404).json({ success: false, message: 'Intégration non trouvée' });
    }

    // Vérifier si la synchronisation est activée
    if (!integration.sync_enabled) {
      return res.status(400).json({ success: false, message: 'Synchronisation désactivée' });
    }

    // Mettre à jour le statut de synchronisation
    await googleCalendarService.updateIntegration(integration_id, {
      sync_status: 'syncing',
      last_sync_at: new Date().toISOString()
    });

    // TODO: Implémenter la logique de synchronisation complète
    // Pour l'instant, on simule une synchronisation
    setTimeout(async () => {
      await googleCalendarService.updateIntegration(integration_id, {
        sync_status: 'idle'
      });
    }, 2000);

    return res.json({
      success: true,
      message: 'Synchronisation démarrée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur synchronisation:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

async function logGoogleCalendarActivity(
  userId: string,
  userType: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details: any
): Promise<void> {
  try {
    await supabase
      .from('CalendarActivityLog')
      .insert({
        user_id: userId,
        user_type: userType,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('❌ Erreur log activité Google Calendar:', error);
  }
}

export default router; 