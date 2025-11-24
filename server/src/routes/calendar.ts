import express, { Router, Request, Response } from 'express';

import { AuthUser } from '../types/auth';
import { AuthenticatedRequest } from '../middleware/auth-enhanced';

// Type pour l'utilisateur authentifié avec database_id
type AuthenticatedUser = NonNullable<AuthenticatedRequest['user']>;
import { supabase } from '../lib/supabase';
import { asyncHandler } from '../utils/asyncHandler';
import { rateLimit } from 'express-rate-limit';
import Joi from 'joi';
import { NotificationService } from '../services/NotificationService';

const router = express.Router();

// ============================================================================
// FONCTIONS DE TRANSFORMATION RDV ↔ CalendarEvent (COMPATIBILITÉ)
// ============================================================================

/**
 * Transformer un RDV en format CalendarEvent pour compatibilité API
 */
function transformRDVToCalendarEvent(rdv: any): any {
  const start_date = `${rdv.scheduled_date}T${rdv.scheduled_time}`;
  const end_date = new Date(
    new Date(start_date).getTime() + (rdv.duration_minutes || 60) * 60000
  ).toISOString();
  
  // Extraire les informations des participants si disponibles
  const clientInfo = rdv.client ? {
    id: rdv.client.id,
    first_name: rdv.client.first_name,
    last_name: rdv.client.last_name,
    company_name: rdv.client.company_name,
    full_name: `${rdv.client.first_name || ''} ${rdv.client.last_name || ''}`.trim()
  } : null;

  const expertInfo = rdv.expert ? {
    id: rdv.expert.id,
    first_name: rdv.expert.first_name,
    last_name: rdv.expert.last_name,
    company_name: rdv.expert.company_name,
    full_name: `${rdv.expert.first_name || ''} ${rdv.expert.last_name || ''}`.trim()
  } : null;
  
  return {
    ...rdv,
    start_date,
    end_date,
    is_online: rdv.meeting_type === 'video',
    client_info: clientInfo,
    expert_info: expertInfo,
    // Garder les champs RDV aussi pour compatibilité
  };
}

/**
 * Transformer des données CalendarEvent (API) en format RDV (BDD)
 */
function transformCalendarEventToRDV(eventData: any): any {
  const start_date = new Date(eventData.start_date);
  const end_date = new Date(eventData.end_date);
  const duration_minutes = Math.round((end_date.getTime() - start_date.getTime()) / 60000);
  
  // Convertir priority string vers integer
  const priorityMap: { [key: string]: number } = {
    'low': 1,
    'medium': 2,
    'high': 3,
    'critical': 4
  };
  const priority = typeof eventData.priority === 'string' 
    ? priorityMap[eventData.priority] || 1 
    : (eventData.priority || 1);

  // Déterminer meeting_type (obligatoire)
  const meeting_type = eventData.is_online 
    ? 'video' 
    : (eventData.phone_number ? 'phone' : 'physical');

  // Construire metadata avec type et color
  const metadata = {
    ...(eventData.metadata || {}),
    event_type: eventData.type, // appointment, deadline, meeting, task, reminder
    color: eventData.color || '#3B82F6'
  };

  // Ne garder que les colonnes qui existent dans la table RDV
  return {
    title: eventData.title,
    description: eventData.description || null,
    scheduled_date: start_date.toISOString().split('T')[0],
    scheduled_time: start_date.toISOString().split('T')[1].substring(0, 8),
    duration_minutes,
    meeting_type,
    location: eventData.location || null,
    meeting_url: eventData.meeting_url || null,
    status: 'scheduled', // Valeur par défaut
    category: eventData.category || 'qualification',
    priority,
    metadata,
    notes: eventData.description || null // Dupliquer description dans notes pour compatibilité
  };
}

// ============================================================================
// RATE LIMITING ET SÉCURITÉ
// ============================================================================

// Rate limiting pour les opérations calendrier
const calendarLimiter = rateLimit({
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

// Schéma de validation pour un événement
const eventSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).allow('', null).optional(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().greater(Joi.ref('start_date')).required(),
  type: Joi.string().valid('appointment', 'deadline', 'meeting', 'task', 'reminder').required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  status: Joi.string().valid('pending', 'confirmed', 'completed', 'cancelled').forbidden(),
  category: Joi.string().valid(
    'qualification',
    'presentation_expert',
    'proposition_commerciale',
    'signature',
    'suivi',
    'autre'
  ).default('qualification'),
  dossier_id: Joi.string().uuid().optional(),
  dossier_name: Joi.string().max(255).optional(),
  client_id: Joi.string().uuid().optional(),
  expert_id: Joi.string().uuid().optional(),
  apporteur_id: Joi.string().uuid().optional(),
  location: Joi.string().max(500).allow(null, '').optional(),
  is_online: Joi.boolean().default(false),
  meeting_url: Joi.string().max(500).allow(null, '').optional(),
  phone_number: Joi.string().max(20).optional(),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
  is_recurring: Joi.boolean().default(false),
  recurrence_rule: Joi.string().optional(),
  metadata: Joi.object().default({}),
  participants: Joi.array().items(Joi.object()).optional()
});

// Schéma de validation pour une étape de dossier
const dossierStepSchema = Joi.object({
  dossier_id: Joi.string().uuid().required(),
  dossier_name: Joi.string().max(255).required(),
  step_name: Joi.string().min(1).max(255).required(),
  step_type: Joi.string().valid('validation', 'documentation', 'expertise', 'approval', 'payment').required(),
  due_date: Joi.date().iso().required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  assignee: Joi.string().email().optional(),
  estimated_duration: Joi.number().integer().min(1).optional(),
  progress: Joi.number().min(0).max(100).default(0)
});

// ============================================================================
// MIDDLEWARE DE VALIDATION
// ============================================================================

const validateEvent = (req: Request, res: Response, next: Function) => {
  console.log('🔍 Validation événement - Données reçues:', JSON.stringify(req.body, null, 2));
  console.log('🔍 Headers:', JSON.stringify(req.headers, null, 2));
  
  const { error, value } = eventSchema.validate(req.body, { 
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true
  });
  
  if (error) {
    console.error('❌ Erreur validation événement:', error.details);
    console.error('❌ Données reçues:', req.body);
    console.error('❌ Erreurs détaillées:', error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value,
      type: detail.type
    })));
    
    return res.status(400).json({
      success: false,
      message: 'Données invalides pour la création d\'événement',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      })),
      receivedData: req.body,
      schema: {
        required: ['title', 'start_date', 'end_date', 'type'],
        validTypes: ['appointment', 'deadline', 'meeting', 'task', 'reminder'],
        validPriorities: ['low', 'medium', 'high', 'critical'],
        validStatuses: ['pending', 'confirmed', 'completed', 'cancelled'],
        validCategories: ['client', 'expert', 'admin', 'system', 'collaborative']
      }
    });
  }
  
  console.log('✅ Validation réussie - Données validées:', JSON.stringify(value, null, 2));
  req.body = value;
  return next();
};

const validateDossierStep = (req: Request, res: Response, next: Function) => {
  const { error, value } = dossierStepSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: error.details.map(detail => detail.message)
    });
  }
  req.body = value;
  return next();
};

// ============================================================================
// LOGS D'AUDIT
// ============================================================================

const logCalendarActivity = async (
  userId: string,
  userType: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details: any = {}
) => {
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
        ip_address: '[::1]', // À améliorer avec l'IP réelle
        user_agent: 'Calendar API'
      });
  } catch (error) {
    console.error('Erreur log activité calendrier:', error);
  }
};

// ============================================================================
// ROUTES ÉVÉNEMENTS
// ============================================================================

/**
 * GET /api/calendar/events - Récupérer les événements
 */
router.get('/events', calendarLimiter, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthenticatedUser;
  const { 
    start_date, 
    end_date, 
    type, 
    category,
    limit = 100,
    offset = 0
  } = req.query;

  try {
    let query = supabase
      .from('RDV')
      .select(`
        *,
        client:Client!client_id(id, first_name, last_name, company_name),
        expert:Expert!expert_id(id, first_name, last_name, company_name)
      `)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    // Filtres selon le type d'utilisateur
    if (authUser.type === 'client') {
      // Clients voient leurs événements + événements de leurs experts + événements de leurs dossiers
      const { data: clientDossiers, error: dossiersError } = await supabase
        .from('ClientProduitEligible')
        .select('id, expert_id')
        .eq('clientId', authUser.database_id);

      if (dossiersError) {
        console.error('❌ Erreur récupération dossiers client:', dossiersError);
        return res.status(500).json({ success: false, message: 'Erreur serveur' });
      }

      // Récupérer les IDs des experts assignés
      const expertIds = clientDossiers?.map(d => d.expert_id).filter(Boolean) || [];

      // Construire la condition OR pour les clients
      const orConditions = [`client_id.eq.${authUser.database_id}`];
      
      if (expertIds.length > 0) {
        orConditions.push(...expertIds.map(expertId => `expert_id.eq.${expertId}`));
      }

      query = query.or(orConditions.join(','));

    } else if (authUser.type === 'expert') {
      query = query.eq('expert_id', authUser.database_id);
    } else if (authUser.type === 'apporteur') {
      // Apporteurs voient leurs RDV (où ils sont participants)
      query = query.eq('apporteur_id', authUser.database_id);
    }
    // Admin voit tous les événements

    // Filtres optionnels
    if (start_date) {
      query = query.gte('scheduled_date', (start_date as string).split('T')[0]);
    }
    if (end_date) {
      query = query.lte('scheduled_date', (end_date as string).split('T')[0]);
    }
    if (type) {
      query = query.eq('type', type as string);
    }
    if (category) {
      query = query.eq('category', category as string);
    }
    // Note: dossier_id filter removed - column doesn't exist in RDV table

    const { data: events, error, count } = await query;

    if (error) {
      console.error('❌ Erreur récupération événements:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    // Log de l'activité
    await logCalendarActivity(
      authUser.database_id,
      authUser.type,
      'get_events',
      'event',
      'multiple',
      { filters: req.query }
    );

    // Transformer les RDV en format CalendarEvent pour compatibilité API
    const transformedEvents = (events || []).map(transformRDVToCalendarEvent);
    
    return res.json({
      success: true,
      data: transformedEvents,
      count: count || 0,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: (events?.length || 0) === parseInt(limit as string)
      }
    });
  } catch (error) {
    console.error('❌ Erreur route événements:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

/**
 * POST /api/calendar/events - Créer un événement
 */
router.post('/events', calendarLimiter, validateEvent, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthenticatedUser;
  const eventData = req.body;

  try {
    console.log('📝 Création événement - Données reçues:', eventData);
    
    // Transformer les données CalendarEvent vers format RDV
    const rdvData = transformCalendarEventToRDV(eventData);
    
    console.log('📝 Données RDV transformées:', rdvData);
    
    // Ajouter les informations de création
    const newEvent: any = {
      ...rdvData,
      status: rdvData.status || 'scheduled', // Status par défaut pour RDV
      created_by: authUser.database_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Ajouter l'ID client/expert selon le type d'utilisateur
    // IMPORTANT: client_id est NOT NULL dans la table RDV
    if (authUser.type === 'client') {
      newEvent.client_id = authUser.database_id;
    } else if (authUser.type === 'expert') {
      newEvent.expert_id = authUser.database_id;
      // Si un client_id est fourni, l'utiliser
      if (eventData.client_id) {
        newEvent.client_id = eventData.client_id;
      } else {
        // Sinon, erreur : un expert doit spécifier un client
        console.error('❌ Expert doit spécifier un client_id');
        return res.status(400).json({ 
          success: false, 
          message: 'Vous devez sélectionner un client pour ce rendez-vous',
          field: 'client_id'
        });
      }
    } else if (authUser.type === 'apporteur') {
      newEvent.apporteur_id = authUser.database_id;
      // Pour un apporteur, client_id doit être fourni
      if (eventData.client_id) {
        newEvent.client_id = eventData.client_id;
      } else {
        console.error('❌ Apporteur doit spécifier un client_id');
        return res.status(400).json({ 
          success: false, 
          message: 'Vous devez sélectionner un client/prospect pour ce rendez-vous',
          field: 'client_id'
        });
      }
      // Si un expert_id est fourni, l'ajouter
      if (eventData.expert_id) {
        newEvent.expert_id = eventData.expert_id;
      }
    } else if (authUser.type === 'admin') {
      // Pour un admin, client_id doit être fourni
      if (eventData.client_id) {
        newEvent.client_id = eventData.client_id;
      } else {
        console.error('❌ Admin doit spécifier un client_id');
        return res.status(400).json({ 
          success: false, 
          message: 'Vous devez sélectionner un client pour ce rendez-vous',
          field: 'client_id'
        });
      }
      // Si un expert_id est fourni, l'ajouter
      if (eventData.expert_id) {
        newEvent.expert_id = eventData.expert_id;
      }
      // Si un apporteur_id est fourni, l'ajouter
      if (eventData.apporteur_id) {
        newEvent.apporteur_id = eventData.apporteur_id;
      }
    }

    console.log('📝 Événement à insérer:', newEvent);

    const { data: event, error } = await supabase
      .from('RDV')
      .insert(newEvent)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur création événement:', error);
      console.error('❌ Détails erreur:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur serveur',
        error: error.message 
      });
    }

    // Log de l'activité
    await logCalendarActivity(
      authUser.id,
      authUser.type,
      'create_event',
      'event',
      event.id,
      { eventTitle: event.title }
    );

    // Créer les rappels automatiques si configurés
    if (eventData.reminders && Array.isArray(eventData.reminders)) {
      for (const reminder of eventData.reminders) {
        await supabase
          .from('RDV_Reminders')
          .insert({
            rdv_id: event.id,
            reminder_type: reminder.type,
            minutes_before: reminder.time,
            status: 'pending'
          });
      }
    }

    // Envoyer les notifications aux participants
    try {
      // Construire la date/heure complète depuis RDV
      const eventDateTime = `${event.scheduled_date}T${event.scheduled_time}`;
      const eventDate = new Date(eventDateTime);
      
      // Notification pour l'organisateur
      await NotificationService.sendSystemNotification({
        userId: authUser.id,
        title: 'Rappel événement calendrier',
        message: `Rappel pour l'événement "${event.title}" le ${eventDate.toLocaleDateString('fr-FR')} à ${eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
        metadata: {
          event_title: event.title,
          event_date: eventDate.toLocaleDateString('fr-FR'),
          event_time: eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          event_duration: `${event.duration_minutes || 60} min`,
          event_type: event.type,
          event_location: event.location || 'Non spécifié',
          event_description: event.description || 'Aucune description',
          event_url: `${process.env.FRONTEND_URL}/calendar/event/${event.id}`,
          recipient_name: (authUser as any).name || 'Utilisateur'
        }
      });

      // Notifications pour les participants si spécifiés
      if (eventData.participants && Array.isArray(eventData.participants)) {
        for (const participantId of eventData.participants) {
          if (participantId !== authUser.id) {
            await NotificationService.sendSystemNotification({
              userId: participantId,
              title: 'Invitation événement calendrier',
              message: `Vous êtes invité à l'événement "${event.title}" le ${eventDate.toLocaleDateString('fr-FR')} à ${eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
              metadata: {
                event_title: event.title,
                event_date: eventDate.toLocaleDateString('fr-FR'),
                event_time: eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                event_location: event.location || 'Non spécifié',
                organizer_name: (authUser as any).name || 'Organisateur',
                event_description: event.description || 'Aucune description',
                accept_url: `${process.env.FRONTEND_URL}/calendar/event/${event.id}/accept`,
                decline_url: `${process.env.FRONTEND_URL}/calendar/event/${event.id}/decline`,
                recipient_name: 'Participant' // TODO: Récupérer le nom du participant
              }
            });
          }
        }
      }
    } catch (notificationError) {
      console.warn('⚠️ Erreur envoi notifications calendrier:', notificationError);
      // Ne pas faire échouer la création d'événement si les notifications échouent
    }

    return res.status(201).json({
      success: true,
      data: event,
      message: 'Événement créé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur création événement:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

/**
 * PUT /api/calendar/events/:id - Modifier un événement
 */
router.put('/events/:id', calendarLimiter, validateEvent, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthenticatedUser;
  const { id } = req.params;
  const updates = req.body;

  try {
    // Vérifier que l'événement existe et que l'utilisateur a les droits
    const { data: existingEvent, error: fetchError } = await supabase
      .from('RDV')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingEvent) {
      return res.status(404).json({ success: false, message: 'Événement non trouvé' });
    }

    // Vérifier les permissions
    if (authUser.type === 'client' && existingEvent.client_id !== authUser.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }
    if (authUser.type === 'expert' && existingEvent.expert_id !== authUser.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Mettre à jour l'événement
    const { data: updatedEvent, error } = await supabase
      .from('RDV')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur mise à jour événement:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    // Log de l'activité
    await logCalendarActivity(
      authUser.id,
      authUser.type,
      'update_event',
      'event',
      id,
      { eventTitle: updatedEvent.title }
    );

    return res.json({
      success: true,
      data: updatedEvent,
      message: 'Événement mis à jour avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour événement:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

/**
 * DELETE /api/calendar/events/:id - Supprimer un événement
 */
router.delete('/events/:id', calendarLimiter, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthenticatedUser;
  const { id } = req.params;

  try {
    // Vérifier que l'événement existe et que l'utilisateur a les droits
    const { data: existingEvent, error: fetchError } = await supabase
      .from('RDV')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingEvent) {
      return res.status(404).json({ success: false, message: 'Événement non trouvé' });
    }

    // Vérifier les permissions
    if (authUser.type === 'client' && existingEvent.client_id !== authUser.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }
    if (authUser.type === 'expert' && existingEvent.expert_id !== authUser.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Supprimer l'événement (les rappels et participants seront supprimés en cascade)
    const { error } = await supabase
      .from('RDV')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Erreur suppression événement:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    // Log de l'activité
    await logCalendarActivity(
      authUser.id,
      authUser.type,
      'delete_event',
      'event',
      id,
      { eventTitle: existingEvent.title }
    );

    return res.json({
      success: true,
      message: 'Événement supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur suppression événement:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

// ============================================================================
// ROUTES ÉTAPES DE DOSSIER
// ============================================================================

/**
 * GET /api/calendar/steps - Récupérer les étapes de dossier
 */
router.get('/steps', calendarLimiter, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthenticatedUser;
  const { dossier_id, status, priority, limit = 100, offset = 0 } = req.query;

  try {
    let query = supabase
      .from('DossierStep')
      .select(`
        *,
        ClientProduitEligible (
          id,
          Client (id, email, company_name),
          ProduitEligible (nom, description)
        )
      `)
      .order('due_date', { ascending: true })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    // Filtres selon le type d'utilisateur
    if (authUser.type === 'client') {
      query = query.eq('ClientProduitEligible.Client.id', authUser.id);
    } else if (authUser.type === 'expert') {
      query = query.eq('assignee', authUser.email);
    }

    // Filtres optionnels
    if (dossier_id) {
      query = query.eq('dossier_id', dossier_id as string);
    }
    if (status) {
      query = query.eq('status', status as string);
    }
    if (priority) {
      query = query.eq('priority', priority as string);
    }

    const { data: steps, error, count } = await query;

    if (error) {
      console.error('❌ Erreur récupération étapes:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    // Log de l'activité
    await logCalendarActivity(
      authUser.id,
      authUser.type,
      'get_steps',
      'step',
      'multiple',
      { filters: req.query }
    );

    return res.json({
      success: true,
      data: steps || [],
      count: count || 0,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: (steps?.length || 0) === parseInt(limit as string)
      }
    });
  } catch (error) {
    console.error('❌ Erreur route étapes:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

/**
 * POST /api/calendar/steps - Créer une étape de dossier
 */
router.post('/steps', calendarLimiter, validateDossierStep, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthenticatedUser;
  const stepData = req.body;

  try {
    // Vérifier que le dossier existe et que l'utilisateur a les droits
    const { data: dossier, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select('*, Client(id, email)')
      .eq('id', stepData.dossier_id)
      .single();

    if (dossierError || !dossier) {
      return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
    }

    // Vérifier les permissions
    if (authUser.type === 'client' && dossier.Client.id !== authUser.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Créer l'étape
    const { data: step, error } = await supabase
      .from('DossierStep')
      .insert({
        ...stepData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur création étape:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    // Log de l'activité
    await logCalendarActivity(
      authUser.id,
      authUser.type,
      'create_step',
      'step',
      step.id,
      { stepName: step.step_name, dossierId: step.dossier_id }
    );

    return res.status(201).json({
      success: true,
      data: step,
      message: 'Étape créée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur création étape:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

/**
 * PUT /api/calendar/steps/:id - Modifier une étape de dossier
 */
router.put('/steps/:id', calendarLimiter, validateDossierStep, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthenticatedUser;
  const { id } = req.params;
  const updates = req.body;

  try {
    // Vérifier que l'étape existe et que l'utilisateur a les droits
    const { data: existingStep, error: fetchError } = await supabase
      .from('DossierStep')
      .select(`
        *,
        ClientProduitEligible (
          id,
          Client (id, email)
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !existingStep) {
      return res.status(404).json({ success: false, message: 'Étape non trouvée' });
    }

    // Vérifier les permissions
    if (authUser.type === 'client' && existingStep.ClientProduitEligible.Client.id !== authUser.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }
    if (authUser.type === 'expert' && existingStep.assignee !== authUser.email) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Mettre à jour l'étape
    const { data: updatedStep, error } = await supabase
      .from('DossierStep')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur mise à jour étape:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    // Log de l'activité
    await logCalendarActivity(
      authUser.id,
      authUser.type,
      'update_step',
      'step',
      id,
      { stepName: updatedStep.step_name }
    );

    return res.json({
      success: true,
      data: updatedStep,
      message: 'Étape mise à jour avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour étape:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

/**
 * DELETE /api/calendar/steps/:id - Supprimer une étape de dossier
 */
router.delete('/steps/:id', calendarLimiter, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthenticatedUser;
  const { id } = req.params;

  try {
    // Vérifier que l'étape existe et que l'utilisateur a les droits
    const { data: existingStep, error: fetchError } = await supabase
      .from('DossierStep')
      .select(`
        *,
        ClientProduitEligible (
          id,
          Client (id, email)
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !existingStep) {
      return res.status(404).json({ success: false, message: 'Étape non trouvée' });
    }

    // Vérifier les permissions
    if (authUser.type === 'client' && existingStep.ClientProduitEligible.Client.id !== authUser.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }
    if (authUser.type === 'expert' && existingStep.assignee !== authUser.email) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Supprimer l'étape
    const { error } = await supabase
      .from('DossierStep')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Erreur suppression étape:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    // Log de l'activité
    await logCalendarActivity(
      authUser.id,
      authUser.type,
      'delete_step',
      'step',
      id,
      { stepName: existingStep.step_name }
    );

    return res.json({
      success: true,
      message: 'Étape supprimée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur suppression étape:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

// ============================================================================
// ROUTES STATISTIQUES
// ============================================================================

/**
 * GET /api/calendar/stats - Statistiques du calendrier
 */
router.get('/stats', calendarLimiter, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthenticatedUser;
  const { start_date, end_date } = req.query;

  try {
    // Récupérer les statistiques en parallèle
    const [
      eventsToday,
      meetingsThisWeek,
      overdueDeadlines,
      documentsToValidate
    ] = await Promise.all([
      // Événements aujourd'hui
      (async () => {
        let query = supabase
          .from('RDV')
          .select('*', { count: 'exact' })
          .eq('scheduled_date', new Date().toISOString().split('T')[0]);
        
        if (authUser.type === 'client') {
          query = query.eq('client_id', authUser.database_id);
        } else if (authUser.type === 'expert') {
          query = query.eq('expert_id', authUser.database_id);
        } else if (authUser.type === 'apporteur') {
          query = query.eq('apporteur_id', authUser.database_id);
        }
        
        return query;
      })(),
      
      // Réunions cette semaine
      (async () => {
        let query = supabase
          .from('RDV')
          .select('*', { count: 'exact' })
          .eq('type', 'meeting')
          .gte('scheduled_date', new Date().toISOString().split('T')[0])
          .lte('scheduled_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        
        if (authUser.type === 'client') {
          query = query.eq('client_id', authUser.database_id);
        } else if (authUser.type === 'expert') {
          query = query.eq('expert_id', authUser.database_id);
        } else if (authUser.type === 'apporteur') {
          query = query.eq('apporteur_id', authUser.database_id);
        }
        
        return query;
      })(),
      
      // Échéances en retard
      (async () => {
        let query = supabase
          .from('DossierStep')
          .select('*', { count: 'exact' })
          .lt('due_date', new Date().toISOString())
          .neq('status', 'completed');
        
        if (authUser.type === 'client') {
          query = query.eq('ClientProduitEligible.Client.id', authUser.database_id);
        } else if (authUser.type === 'expert') {
          query = query.eq('assignee', authUser.email);
        }
        
        return query;
      })(),
      
      // Documents à valider
      (async () => {
        let query = supabase
          .from('DossierStep')
          .select('*', { count: 'exact' })
          .eq('step_type', 'validation')
          .eq('status', 'pending');
        
        if (authUser.type === 'client') {
          query = query.eq('ClientProduitEligible.Client.id', authUser.database_id);
        } else if (authUser.type === 'expert') {
          query = query.eq('assignee', authUser.email);
        }
        
        return query;
      })()
    ]);

    // Exécuter les requêtes et récupérer les résultats
    const [eventsTodayResult, meetingsThisWeekResult, overdueDeadlinesResult, documentsToValidateResult] = await Promise.all([
      eventsToday,
      meetingsThisWeek,
      overdueDeadlines,
      documentsToValidate
    ]);

    const stats = {
      eventsToday: eventsTodayResult.count || 0,
      meetingsThisWeek: meetingsThisWeekResult.count || 0,
      overdueDeadlines: overdueDeadlinesResult.count || 0,
      documentsToValidate: documentsToValidateResult.count || 0
    };

    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Erreur statistiques calendrier:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

// ============================================================================
// ROUTES PARTICIPANTS
// ============================================================================

/**
 * POST /api/calendar/events/:id/participants - Ajouter des participants
 */
router.post('/events/:id/participants', calendarLimiter, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthenticatedUser;
  const { id } = req.params;
  const { participants } = req.body;

  if (!Array.isArray(participants)) {
    return res.status(400).json({ success: false, message: 'Participants invalides' });
  }

  try {
    // Vérifier que l'événement existe et que l'utilisateur a les droits
    const { data: event, error: eventError } = await supabase
      .from('RDV')
      .select('*')
      .eq('id', id)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ success: false, message: 'Événement non trouvé' });
    }

    // Vérifier les permissions
    if (authUser.type === 'client' && event.client_id !== authUser.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }
    if (authUser.type === 'expert' && event.expert_id !== authUser.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Ajouter les participants
    const participantData = participants.map((participant: any) => ({
      event_id: id,
      user_id: participant.user_id,
      user_type: participant.user_type,
      user_email: participant.user_email,
      user_name: participant.user_name,
      status: 'pending'
    }));

    const { data: addedParticipants, error } = await supabase
      .from('RDV_Participants')
      .insert(participantData)
      .select();

    if (error) {
      console.error('❌ Erreur ajout participants:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    // Log de l'activité
    await logCalendarActivity(
      authUser.id,
      authUser.type,
      'add_participants',
      'event',
      id,
      { participantCount: participants.length }
    );

    return res.json({
      success: true,
      data: addedParticipants,
      message: 'Participants ajoutés avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur ajout participants:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

// ============================================================================
// ROUTES RAPPELS
// ============================================================================

/**
 * GET /api/calendar/events/:id/reminders - Récupérer les rappels d'un événement
 */
router.get('/events/:id/reminders', calendarLimiter, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthenticatedUser;
  const { id } = req.params;

  try {
    // Vérifier que l'événement existe et que l'utilisateur a les droits
    const { data: event, error: eventError } = await supabase
      .from('RDV')
      .select('*')
      .eq('id', id)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ success: false, message: 'Événement non trouvé' });
    }

    // Vérifier les permissions
    if (authUser.type === 'client' && event.client_id !== authUser.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }
    if (authUser.type === 'expert' && event.expert_id !== authUser.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Récupérer les rappels
    const { data: reminders, error } = await supabase
      .from('RDV_Reminders')
      .select('*')
      .eq('event_id', id)
      .order('time_minutes', { ascending: true });

    if (error) {
      console.error('❌ Erreur récupération rappels:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    return res.json({
      success: true,
      data: reminders || []
    });
  } catch (error) {
    console.error('❌ Erreur route rappels:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

/**
 * POST /api/calendar/reminders - Créer un rappel pour un événement
 */
router.post('/reminders', calendarLimiter, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthenticatedUser;
  const { event_id, type, time_before_event } = req.body;

  // Validation des données
  if (!event_id || !type || !time_before_event) {
    return res.status(400).json({
      success: false,
      message: 'event_id, type et time_before_event sont requis'
    });
  }

  try {
    // Vérifier que l'événement existe et que l'utilisateur a les droits
    const { data: event, error: eventError } = await supabase
      .from('RDV')
      .select('*')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ success: false, message: 'Événement non trouvé' });
    }

    // Vérifier les permissions
    if (authUser.type === 'client' && event.client_id !== authUser.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }
    if (authUser.type === 'expert' && event.expert_id !== authUser.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Créer le rappel
    const { data: reminder, error } = await supabase
      .from('RDV_Reminders')
      .insert({
        event_id,
        type,
        time_minutes: time_before_event,
        created_by: authUser.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur création rappel:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    // Log de l'activité
    await logCalendarActivity(
      authUser.id,
      authUser.type,
      'create_reminder',
      'reminder',
      reminder.id,
      { eventTitle: event.title, reminderType: type }
    );

    return res.status(201).json({
      success: true,
      data: reminder,
      message: 'Rappel créé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur création rappel:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

export default router; 