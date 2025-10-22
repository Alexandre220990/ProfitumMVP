import express, { Router, Request, Response } from 'express';

import { AuthUser } from '../types/auth';
import { collaborativeEventsService } from '../services/collaborative-events-service';
import { asyncHandler } from '../utils/asyncHandler';
import { rateLimit } from 'express-rate-limit';
import { supabase } from '../lib/supabase';
// @ts-ignore
import Joi from 'joi';

const router = express.Router();

// ============================================================================
// RATE LIMITING ET SÉCURITÉ
// ============================================================================

const collaborativeEventsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par fenêtre
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer plus tard'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================================
// VALIDATION DES DONNÉES
// ============================================================================

const createEventSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().greater(Joi.ref('start_date')).required(),
  type: Joi.string().valid('appointment', 'deadline', 'meeting', 'task', 'reminder').required(),
  location: Joi.string().max(500).optional(),
  is_online: Joi.boolean().default(false),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  organizer: Joi.object({
    user_id: Joi.string().uuid().required(),
    user_type: Joi.string().valid('client', 'expert', 'admin').required(),
    email: Joi.string().email().required(),
    name: Joi.string().required()
  }).required(),
  participants: Joi.array().items(Joi.object({
    user_id: Joi.string().uuid().required(),
    user_type: Joi.string().valid('client', 'expert', 'admin').required(),
    email: Joi.string().email().required(),
    name: Joi.string().required(),
    status: Joi.string().valid('pending', 'accepted', 'declined', 'tentative').default('pending')
  })).min(1).required(),
  meeting_details: Joi.object({
    platform: Joi.string().valid('google_meet', 'zoom', 'teams', 'other').optional(),
    meeting_url: Joi.string().uri().optional(),
    meeting_id: Joi.string().optional(),
    password: Joi.string().optional(),
    dial_in_numbers: Joi.array().items(Joi.string()).optional()
  }).optional(),
  agenda_items: Joi.array().items(Joi.object({
    id: Joi.string().required(),
    title: Joi.string().required(),
    description: Joi.string().optional(),
    duration_minutes: Joi.number().integer().min(1).required(),
    presenter: Joi.string().optional()
  })).optional(),
  documents: Joi.array().items(Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    url: Joi.string().uri().required(),
    type: Joi.string().valid('presentation', 'document', 'spreadsheet', 'other').required()
  })).optional()
});

const updateEventSchema = Joi.object({
  title: Joi.string().min(1).max(255).optional(),
  description: Joi.string().max(1000).optional(),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().optional(),
  location: Joi.string().max(500).optional(),
  is_online: Joi.boolean().optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  participants: Joi.array().items(Joi.object({
    user_id: Joi.string().uuid().required(),
    user_type: Joi.string().valid('client', 'expert', 'admin').required(),
    email: Joi.string().email().required(),
    name: Joi.string().required(),
    status: Joi.string().valid('pending', 'accepted', 'declined', 'tentative').default('pending')
  })).optional(),
  meeting_details: Joi.object({
    platform: Joi.string().valid('google_meet', 'zoom', 'teams', 'other').optional(),
    meeting_url: Joi.string().uri().optional(),
    meeting_id: Joi.string().optional(),
    password: Joi.string().optional(),
    dial_in_numbers: Joi.array().items(Joi.string()).optional()
  }).optional(),
  agenda_items: Joi.array().items(Joi.object({
    id: Joi.string().required(),
    title: Joi.string().required(),
    description: Joi.string().optional(),
    duration_minutes: Joi.number().integer().min(1).required(),
    presenter: Joi.string().optional()
  })).optional(),
  documents: Joi.array().items(Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    url: Joi.string().uri().required(),
    type: Joi.string().valid('presentation', 'document', 'spreadsheet', 'other').required()
  })).optional()
});

const respondToInvitationSchema = Joi.object({
  response: Joi.string().valid('accepted', 'declined', 'tentative').required(),
  notes: Joi.string().max(500).optional()
});

// ============================================================================
// MIDDLEWARE DE VALIDATION
// ============================================================================

const validateCreateEvent = (req: Request, res: Response, next: Function): void => {
  const { error, value } = createEventSchema.validate(req.body);
  if (error) {
    res.status(400).json({
      success: false,
      message: 'Données invalides pour la création d\'événement collaboratif',
      errors: error.details.map(detail => detail.message)
    });
    return;
  }
  req.body = value;
  next();
};

const validateUpdateEvent = (req: Request, res: Response, next: Function): void => {
  const { error, value } = updateEventSchema.validate(req.body);
  if (error) {
    res.status(400).json({
      success: false,
      message: 'Données invalides pour la mise à jour d\'événement',
      errors: error.details.map(detail => detail.message)
    });
    return;
  }
  req.body = value;
  next();
};

const validateRespondToInvitation = (req: Request, res: Response, next: Function): void => {
  const { error, value } = respondToInvitationSchema.validate(req.body);
  if (error) {
    res.status(400).json({
      success: false,
      message: 'Données invalides pour la réponse à l\'invitation',
      errors: error.details.map(detail => detail.message)
    });
    return;
  }
  req.body = value;
  next();
};

// ============================================================================
// ROUTES PRINCIPALES
// ============================================================================

/**
 * POST /api/collaborative-events - Créer un événement collaboratif
 */
router.post('/', 
  
  collaborativeEventsLimiter, 
  validateCreateEvent,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const eventData = req.body;

    try {
      // Vérifier que l'utilisateur est l'organisateur
      if (eventData.organizer.user_id !== authUser.id) {
        return res.status(403).json({
          success: false,
          message: 'Vous ne pouvez créer un événement que pour vous-même'
        });
      }

      const eventId = await collaborativeEventsService.createCollaborativeEvent(eventData);

      return res.status(201).json({
        success: true,
        data: { eventId },
        message: 'Événement collaboratif créé avec succès'
      });
    } catch (error) {
      console.error('❌ Erreur création événement collaboratif:', error);
      return res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Erreur serveur' 
      });
    }
  })
);

/**
 * GET /api/collaborative-events - Lister les événements collaboratifs de l'utilisateur
 */
router.get('/', 
  
  collaborativeEventsLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;

    try {
      const events = await collaborativeEventsService.getUserCollaborativeEvents(
        authUser.id,
        authUser.type
      );

      return res.json({
        success: true,
        data: events,
        message: 'Événements collaboratifs récupérés avec succès'
      });
    } catch (error) {
      console.error('❌ Erreur récupération événements:', error);
      return res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Erreur serveur' 
      });
    }
  })
);

/**
 * GET /api/collaborative-events/stats - Obtenir les statistiques des événements
 */
router.get('/stats', 
  
  collaborativeEventsLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;

    try {
      const stats = await collaborativeEventsService.getCollaborativeEventStats(authUser.id);

      return res.json({
        success: true,
        data: stats,
        message: 'Statistiques récupérées avec succès'
      });
    } catch (error) {
      console.error('❌ Erreur récupération statistiques:', error);
      return res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Erreur serveur' 
      });
    }
  })
);

/**
 * PUT /api/collaborative-events/:id - Mettre à jour un événement collaboratif
 */
router.put('/:id', 
  
  collaborativeEventsLimiter, 
  validateUpdateEvent,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const eventId = req.params.id;
    const updates = req.body;

    try {
      await collaborativeEventsService.updateCollaborativeEvent(eventId, updates, authUser.id);

      return res.json({
        success: true,
        message: 'Événement mis à jour avec succès'
      });
    } catch (error) {
      console.error('❌ Erreur mise à jour événement:', error);
      return res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Erreur serveur' 
      });
    }
  })
);

/**
 * DELETE /api/collaborative-events/:id - Annuler un événement collaboratif
 */
router.delete('/:id', 
  
  collaborativeEventsLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const eventId = req.params.id;

    try {
      await collaborativeEventsService.cancelCollaborativeEvent(eventId, authUser.id);

      return res.json({
        success: true,
        message: 'Événement annulé avec succès'
      });
    } catch (error) {
      console.error('❌ Erreur annulation événement:', error);
      return res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Erreur serveur' 
      });
    }
  })
);

// ============================================================================
// ROUTES D'INVITATIONS
// ============================================================================

/**
 * POST /api/collaborative-events/invitations/:id/respond - Répondre à une invitation
 */
router.post('/invitations/:id/respond', 
  
  collaborativeEventsLimiter, 
  validateRespondToInvitation,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const invitationId = req.params.id;
    const { response, notes } = req.body;

    try {
      await collaborativeEventsService.respondToInvitation(invitationId, authUser.id, response, notes);

      return res.json({
        success: true,
        message: 'Réponse enregistrée avec succès'
      });
    } catch (error) {
      console.error('❌ Erreur réponse invitation:', error);
      return res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Erreur serveur' 
      });
    }
  })
);

/**
 * GET /api/collaborative-events/invitations - Lister les invitations de l'utilisateur
 */
router.get('/invitations', 
  
  collaborativeEventsLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;

    try {
      // Récupérer les invitations de l'utilisateur
      const { data: invitations, error } = await supabase
        .from('EventInvitation')
        .select(`
          *,
          CalendarEvent!inner(
            id,
            title,
            description,
            start_date,
            end_date,
            location,
            is_online,
            meeting_url
          )
        `)
        .eq('user_id', authUser.id)
        .order('sent_at', { ascending: false });

      if (error) throw error;

      return res.json({
        success: true,
        data: invitations || [],
        message: 'Invitations récupérées avec succès'
      });
    } catch (error) {
      console.error('❌ Erreur récupération invitations:', error);
      return res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Erreur serveur' 
      });
    }
  })
);

// ============================================================================
// ROUTES DE RECHERCHE ET FILTRAGE
// ============================================================================

/**
 * GET /api/collaborative-events/search - Rechercher des événements
 */
router.get('/search', 
  
  collaborativeEventsLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { q, status, start_date, end_date, user_type } = req.query;

    try {
      let query = supabase
        .from('RDV')
        .select(`
          *,
          CalendarEventParticipant!inner(user_id, user_type, status)
        `)
        .eq('category', 'collaborative')
        .eq('CalendarEventParticipant.user_id', authUser.id);

      // Filtres
      if (q) {
        query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
      }

      if (status) {
        query = query.eq('CalendarEventParticipant.status', status);
      }

      if (start_date) {
        query = query.gte('start_date', start_date);
      }

      if (end_date) {
        query = query.lte('end_date', end_date);
      }

      if (user_type) {
        query = query.eq('CalendarEventParticipant.user_type', user_type);
      }

      const { data: events, error } = await query.order('start_date', { ascending: true });

      if (error) throw error;

      return res.json({
        success: true,
        data: events || [],
        message: 'Recherche effectuée avec succès'
      });
    } catch (error) {
      console.error('❌ Erreur recherche événements:', error);
      return res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Erreur serveur' 
      });
    }
  })
);

export default router; 