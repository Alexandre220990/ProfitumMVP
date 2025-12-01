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
import { ClientTimelineService } from '../services/client-timeline-service';
import { DossierTimelineService } from '../services/dossier-timeline-service';
import { EventNotificationSync } from '../services/event-notification-sync';

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
  
  // Extraire color depuis metadata si présent
  const color = rdv.metadata?.color || '#3B82F6';
  
  return {
    ...rdv,
    start_date,
    end_date,
    is_online: rdv.meeting_type === 'video',
    color, // Extraire color depuis metadata pour compatibilité API
    client_info: clientInfo,
    expert_info: expertInfo,
    // Garder les champs RDV aussi pour compatibilité
  };
}

/**
 * Transformer des données CalendarEvent (API) en format RDV (BDD)
 * ⚠️ IMPORTANT: Parser manuellement les dates pour éviter les conversions de fuseau horaire
 */
function transformCalendarEventToRDV(eventData: any): any {
  let scheduled_date: string;
  let scheduled_time: string;
  let duration_minutes: number;
  
  if (eventData.start_date && eventData.end_date) {
    const startStr = String(eventData.start_date);
    
    // Si c'est au format "YYYY-MM-DDTHH:mm" ou "YYYY-MM-DDTHH:mm:ss" (sans fuseau horaire)
    // Détecter si c'est un format local (sans Z ni +) et relativement court
    const hasTimezone = startStr.includes('Z') || startStr.includes('+') || (startStr.includes('-') && startStr.length > 19);
    const isLocalFormat = startStr.includes('T') && !hasTimezone;
    
    if (isLocalFormat) {
      // Parser manuellement pour éviter les conversions de fuseau horaire
      const [datePart, timePart] = startStr.split('T');
      const timeComponents = (timePart || '').split(':');
      const hours = parseInt(timeComponents[0] || '0', 10);
      const minutes = parseInt(timeComponents[1] || '0', 10);
      
      scheduled_date = datePart;
      scheduled_time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      
      // Calculer la durée depuis end_date
      const endStr = String(eventData.end_date);
      const endHasTimezone = endStr.includes('Z') || endStr.includes('+') || (endStr.includes('-') && endStr.length > 19);
      const endIsLocalFormat = endStr.includes('T') && !endHasTimezone;
      
      if (endIsLocalFormat) {
        const [endDatePart, endTimePart] = endStr.split('T');
        const endTimeComponents = (endTimePart || '').split(':');
        const endHours = parseInt(endTimeComponents[0] || '0', 10);
        const endMinutes = parseInt(endTimeComponents[1] || '0', 10);
        
        // Si même jour, calculer directement
        if (datePart === endDatePart) {
          const startTotalMinutes = hours * 60 + minutes;
          const endTotalMinutes = endHours * 60 + endMinutes;
          duration_minutes = Math.max(0, endTotalMinutes - startTotalMinutes);
        } else {
          // Calculer avec les dates complètes
          const startDateObj = new Date(`${datePart}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
          const endDateObj = new Date(`${endDatePart}T${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`);
          duration_minutes = Math.round((endDateObj.getTime() - startDateObj.getTime()) / 60000);
        }
      } else {
        // Fallback : utiliser Date si format ISO avec fuseau horaire
        const startDate = new Date(startStr);
        scheduled_date = startDate.toISOString().split('T')[0];
        scheduled_time = startDate.toISOString().split('T')[1].substring(0, 5);
        const endDate = new Date(eventData.end_date);
        duration_minutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
      }
    } else {
      // Format ISO avec fuseau horaire : utiliser Date normalement
      const startDate = new Date(startStr);
      scheduled_date = startDate.toISOString().split('T')[0];
      scheduled_time = startDate.toISOString().split('T')[1].substring(0, 5);
      const endDate = new Date(eventData.end_date);
      duration_minutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
    }
  } else {
    // Valeurs par défaut si manquantes
    scheduled_date = new Date().toISOString().split('T')[0];
    scheduled_time = '09:00';
    duration_minutes = 60;
  }
  
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

  // Construire metadata avec color et informations complémentaires
  const metadata = {
    ...(eventData.metadata || {}),
    color: eventData.color || '#3B82F6',
    // Stocker les IDs dans metadata pour enrichir l'événement (même si colonnes dédiées existent)
    ...(eventData.client_id && { client_id: eventData.client_id }),
    ...(eventData.expert_id && { expert_id: eventData.expert_id }),
    ...(eventData.apporteur_id && { apporteur_id: eventData.apporteur_id }),
    ...(eventData.dossier_id && { dossier_id: eventData.dossier_id })
  };

  // Ne garder que les colonnes qui existent dans la table RDV
  return {
    title: eventData.title,
    description: eventData.description || null,
    scheduled_date,
    scheduled_time,
    duration_minutes,
    meeting_type,
    location: eventData.location || null,
    meeting_url: eventData.meeting_url || null,
    status: 'scheduled', // Valeur par défaut
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
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  status: Joi.string().valid('pending', 'confirmed', 'completed', 'cancelled').forbidden(),
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
  participants: Joi.array().items(Joi.object({
    user_id: Joi.string().uuid().required(),
    user_type: Joi.string().valid('client', 'expert', 'apporteur', 'admin').required(),
    user_email: Joi.string().email().optional(),
    user_name: Joi.string().optional(),
    status: Joi.string().valid('pending', 'accepted', 'declined', 'tentative').optional()
  })).optional()
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
    } else if (authUser.type === 'admin') {
      // Admins voient uniquement leurs propres RDV (créés par eux)
      query = query.eq('created_by', authUser.database_id);
    }

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

    // Récupérer les participants pour tous les événements
    const eventIds = (events || []).map(e => e.id);
    let participantsMap: Record<string, any[]> = {};
    
    if (eventIds.length > 0) {
      const { data: participants, error: participantsError } = await supabase
        .from('RDV_Participants')
        .select('rdv_id, user_id, user_type, user_name, user_email, status')
        .in('rdv_id', eventIds);

      if (!participantsError && participants) {
        participants.forEach((p: any) => {
          if (!participantsMap[p.rdv_id]) {
            participantsMap[p.rdv_id] = [];
          }
          participantsMap[p.rdv_id].push({
            id: p.user_id,
            name: p.user_name,
            email: p.user_email,
            type: p.user_type,
            status: p.status
          });
        });
      }
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

    // Transformer les RDV en format CalendarEvent pour compatibilité API avec participants
    const transformedEvents = (events || []).map(rdv => {
      const event = transformRDVToCalendarEvent(rdv);
      event.participants = participantsMap[rdv.id] || [];
      return event;
    });
    
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
    // client_id est maintenant optionnel pour permettre des événements personnels
    if (authUser.type === 'client') {
      newEvent.client_id = authUser.database_id;
    } else if (authUser.type === 'expert') {
      newEvent.expert_id = authUser.database_id;
      // Si un client_id est fourni, l'utiliser (optionnel pour événements personnels)
      if (eventData.client_id) {
        newEvent.client_id = eventData.client_id;
      }
    } else if (authUser.type === 'apporteur') {
      newEvent.apporteur_id = authUser.database_id;
      // Si un client_id est fourni, l'utiliser (optionnel)
      if (eventData.client_id) {
        newEvent.client_id = eventData.client_id;
      }
      // Si un expert_id est fourni, l'ajouter
      if (eventData.expert_id) {
        newEvent.expert_id = eventData.expert_id;
      }
    } else if (authUser.type === 'admin') {
      // Pour un admin, client_id est optionnel (peut créer un événement personnel)
      // Ces champs servent à enrichir l'événement et le relier aux timelines
      if (eventData.client_id) {
        newEvent.client_id = eventData.client_id;
      }
      // Si un expert_id est fourni, l'ajouter
      if (eventData.expert_id) {
        newEvent.expert_id = eventData.expert_id;
      }
      // Si un apporteur_id est fourni, l'ajouter
      if (eventData.apporteur_id) {
        newEvent.apporteur_id = eventData.apporteur_id;
      }
      // Si un dossier_id est fourni, le stocker uniquement dans metadata (pas de colonne directe dans RDV)
      if (eventData.dossier_id) {
        // Stocker dans metadata pour traçabilité
        newEvent.metadata = {
          ...(newEvent.metadata || {}),
          dossier_id: eventData.dossier_id
        };
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
        user_type: authUser.type,
        title: 'Rappel événement calendrier',
        message: `Rappel pour l'événement "${event.title}" le ${eventDate.toLocaleDateString('fr-FR')} à ${eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
        type: 'calendar_reminder',
        metadata: {
          event_title: event.title,
          event_date: eventDate.toLocaleDateString('fr-FR'),
          event_time: eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          event_duration: `${event.duration_minutes || 60} min`,
          event_location: event.location || 'Non spécifié',
          event_description: event.description || 'Aucune description',
          event_url: `${process.env.FRONTEND_URL}/calendar/event/${event.id}`,
          recipient_name: (authUser as any).name || 'Utilisateur'
        }
      });

      // Créer les participants dans RDV_Participants si spécifiés
      if (eventData.participants && Array.isArray(eventData.participants) && eventData.participants.length > 0) {
        const participantRecords = [];
        
        for (const participant of eventData.participants) {
          // Récupérer auth_user_id depuis database_id selon le type
          let authUserId: string | null = null;
          
          try {
            if (participant.user_type === 'client') {
              const { data: client } = await supabase
                .from('Client')
                .select('auth_user_id')
                .eq('id', participant.user_id)
                .single();
              authUserId = client?.auth_user_id || null;
            } else if (participant.user_type === 'expert') {
              const { data: expert } = await supabase
                .from('Expert')
                .select('auth_user_id')
                .eq('id', participant.user_id)
                .single();
              authUserId = expert?.auth_user_id || null;
            } else if (participant.user_type === 'apporteur') {
              const { data: apporteur } = await supabase
                .from('ApporteurAffaires')
                .select('auth_user_id')
                .eq('id', participant.user_id)
                .single();
              authUserId = apporteur?.auth_user_id || null;
            } else if (participant.user_type === 'admin') {
              const { data: admin } = await supabase
                .from('Admin')
                .select('auth_user_id')
                .eq('id', participant.user_id)
                .single();
              authUserId = admin?.auth_user_id || null;
            }
          } catch (error) {
            console.warn(`⚠️ Impossible de récupérer auth_user_id pour participant ${participant.user_id}:`, error);
          }

          participantRecords.push({
            rdv_id: event.id,
            user_id: authUserId,
            user_type: participant.user_type,
            user_email: participant.user_email || null,
            user_name: participant.user_name || null,
            status: 'pending',
            created_at: new Date().toISOString()
          });
        }

        if (participantRecords.length > 0) {
          const { error: participantsError } = await supabase
            .from('RDV_Participants')
            .insert(participantRecords);

          if (participantsError) {
            console.error('❌ Erreur création participants:', participantsError);
          } else {
            console.log(`✅ ${participantRecords.length} participant(s) créé(s)`);
          }
        }

        // Envoyer les notifications aux participants
        for (const participant of eventData.participants) {
          // Récupérer auth_user_id pour la notification
          let authUserId: string | null = null;
          
          try {
            if (participant.user_type === 'client') {
              const { data: client } = await supabase
                .from('Client')
                .select('auth_user_id')
                .eq('id', participant.user_id)
                .single();
              authUserId = client?.auth_user_id || null;
            } else if (participant.user_type === 'expert') {
              const { data: expert } = await supabase
                .from('Expert')
                .select('auth_user_id')
                .eq('id', participant.user_id)
                .single();
              authUserId = expert?.auth_user_id || null;
            } else if (participant.user_type === 'apporteur') {
              const { data: apporteur } = await supabase
                .from('ApporteurAffaires')
                .select('auth_user_id')
                .eq('id', participant.user_id)
                .single();
              authUserId = apporteur?.auth_user_id || null;
            } else if (participant.user_type === 'admin') {
              const { data: admin } = await supabase
                .from('Admin')
                .select('auth_user_id')
                .eq('id', participant.user_id)
                .single();
              authUserId = admin?.auth_user_id || null;
            }

            if (authUserId && authUserId !== authUser.id) {
              await NotificationService.sendSystemNotification({
                userId: authUserId,
                user_type: participant.user_type,
                title: 'Invitation événement calendrier',
                message: `Vous êtes invité à l'événement "${event.title}" le ${eventDate.toLocaleDateString('fr-FR')} à ${eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
                type: 'calendar_invitation',
                metadata: {
                  event_title: event.title,
                  event_date: eventDate.toLocaleDateString('fr-FR'),
                  event_time: eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                  event_location: event.location || 'Non spécifié',
                  organizer_name: (authUser as any).name || 'Organisateur',
                  event_description: event.description || 'Aucune description',
                  accept_url: `${process.env.FRONTEND_URL}/calendar/event/${event.id}/accept`,
                  decline_url: `${process.env.FRONTEND_URL}/calendar/event/${event.id}/decline`,
                  recipient_name: participant.user_name || 'Participant'
                }
              });
            }
          } catch (notificationError) {
            console.warn(`⚠️ Erreur notification participant ${participant.user_id}:`, notificationError);
          }
        }
      }
    } catch (notificationError) {
      console.warn('⚠️ Erreur envoi notifications calendrier:', notificationError);
      // Ne pas faire échouer la création d'événement si les notifications échouent
    }

    // Ajouter l'événement aux timelines appropriées (client et/ou dossier)
    try {
      const eventDateTime = `${event.scheduled_date}T${event.scheduled_time}`;
      const eventDate = new Date(eventDateTime);
      
      // Récupérer le nom de l'acteur
      let actorName = 'Système';
      let actorType: 'client' | 'expert' | 'admin' | 'system' | 'apporteur' = 'system';
      
      if (authUser.type === 'admin') {
        actorType = 'admin';
        actorName = (authUser as any).name || 'Administrateur';
      } else if (authUser.type === 'expert') {
        actorType = 'expert';
        actorName = (authUser as any).name || 'Expert';
      } else if (authUser.type === 'apporteur') {
        actorType = 'apporteur';
        actorName = (authUser as any).name || 'Apporteur';
      } else if (authUser.type === 'client') {
        actorType = 'client';
        actorName = (authUser as any).name || 'Client';
      }

      // Créer l'événement dans la timeline client si client_id est présent
      if (event.client_id) {
        await ClientTimelineService.addEvent({
          client_id: event.client_id,
          dossier_id: (event.metadata?.dossier_id) || undefined,
          date: eventDate.toISOString(),
          type: 'rdv',
          actor_type: actorType,
          actor_id: authUser.database_id,
          actor_name: actorName,
          title: `Rendez-vous : ${event.title}`,
          description: event.description || `Rendez-vous prévu le ${eventDate.toLocaleDateString('fr-FR')} à ${eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}${event.location ? ` - ${event.location}` : ''}`,
          metadata: {
            rdv_id: event.id,
            scheduled_date: event.scheduled_date,
            scheduled_time: event.scheduled_time,
            duration_minutes: event.duration_minutes,
            location: event.location,
            meeting_url: event.meeting_url,
            meeting_type: event.meeting_type,
            ...(event.metadata || {})
          },
          icon: '📅',
          color: 'blue',
          action_url: `${process.env.FRONTEND_URL}/admin/agenda-admin?event=${event.id}`
        });
      }

      // Créer l'événement dans la timeline dossier si dossier_id est présent
      if (event.metadata?.dossier_id) {
        const dossierId = event.metadata.dossier_id;
        await DossierTimelineService.addEvent({
          dossier_id: dossierId,
          date: eventDate.toISOString(),
          type: 'rdv',
          actor_type: actorType,
          actor_id: authUser.database_id,
          actor_name: actorName,
          title: `Rendez-vous : ${event.title}`,
          description: event.description || `Rendez-vous prévu le ${eventDate.toLocaleDateString('fr-FR')} à ${eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}${event.location ? ` - ${event.location}` : ''}`,
          metadata: {
            rdv_id: event.id,
            client_id: event.client_id,
            scheduled_date: event.scheduled_date,
            scheduled_time: event.scheduled_time,
            duration_minutes: event.duration_minutes,
            location: event.location,
            meeting_url: event.meeting_url,
            meeting_type: event.meeting_type,
            ...(event.metadata || {})
          },
          icon: '📅',
          color: 'blue',
          action_url: `${process.env.FRONTEND_URL}/admin/agenda-admin?event=${event.id}`
        });
      }
    } catch (timelineError) {
      console.warn('⚠️ Erreur ajout événement aux timelines:', timelineError);
      // Ne pas faire échouer la création d'événement si l'ajout aux timelines échoue
    }

    // Synchroniser les notifications d'événement
    try {
      await EventNotificationSync.syncEventNotifications(event);
    } catch (syncError) {
      console.error('⚠️ Erreur synchronisation notifications événement:', syncError);
      // Ne pas faire échouer la création si la synchronisation échoue
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

    // Transformer les données CalendarEvent vers format RDV
    const transformedUpdates = transformCalendarEventToRDV(updates);
    
    // Fusionner les métadonnées existantes avec les nouvelles
    const existingMetadata = existingEvent.metadata || {};
    const newMetadata = transformedUpdates.metadata || {};
    const mergedMetadata = {
      ...existingMetadata,
      ...newMetadata
    };

    // Construire l'objet de mise à jour avec seulement les colonnes valides de RDV
    const rdvUpdates: any = {};
    
    // Colonnes directes de RDV
    if (transformedUpdates.title !== undefined) rdvUpdates.title = transformedUpdates.title;
    if (transformedUpdates.description !== undefined) rdvUpdates.description = transformedUpdates.description;
    if (transformedUpdates.scheduled_date !== undefined) rdvUpdates.scheduled_date = transformedUpdates.scheduled_date;
    if (transformedUpdates.scheduled_time !== undefined) rdvUpdates.scheduled_time = transformedUpdates.scheduled_time;
    if (transformedUpdates.duration_minutes !== undefined) rdvUpdates.duration_minutes = transformedUpdates.duration_minutes;
    if (transformedUpdates.meeting_type !== undefined) rdvUpdates.meeting_type = transformedUpdates.meeting_type;
    if (transformedUpdates.location !== undefined) rdvUpdates.location = transformedUpdates.location;
    if (transformedUpdates.meeting_url !== undefined) rdvUpdates.meeting_url = transformedUpdates.meeting_url;
    if (transformedUpdates.priority !== undefined) rdvUpdates.priority = transformedUpdates.priority;
    if (transformedUpdates.notes !== undefined) rdvUpdates.notes = transformedUpdates.notes;
    
    // Métadonnées fusionnées
    rdvUpdates.metadata = mergedMetadata;
    
    // Colonnes optionnelles de participants
    if (updates.client_id !== undefined) rdvUpdates.client_id = updates.client_id;
    if (updates.expert_id !== undefined) rdvUpdates.expert_id = updates.expert_id;
    if (updates.apporteur_id !== undefined) rdvUpdates.apporteur_id = updates.apporteur_id;
    
    // Si la date/heure est modifiée et que l'événement était terminé ou annulé, réinitialiser le statut si déplacé vers le futur
    const isDateChanged = transformedUpdates.scheduled_date !== undefined || transformedUpdates.scheduled_time !== undefined;
    if (isDateChanged && (existingEvent.status === 'completed' || existingEvent.status === 'cancelled')) {
      // Calculer la nouvelle date/heure complète
      const newScheduledDate = transformedUpdates.scheduled_date || existingEvent.scheduled_date;
      const newScheduledTime = transformedUpdates.scheduled_time || existingEvent.scheduled_time;
      const newDateTime = new Date(`${newScheduledDate}T${newScheduledTime}`);
      const now = new Date();
      
      // Si la nouvelle date est dans le futur, réinitialiser le statut
      if (newDateTime > now) {
        // Remettre le statut à "scheduled" par défaut quand on déplace un événement terminé/annulé vers le futur
        console.log(`📅 Événement ${id} déplacé vers le futur (${newScheduledDate} ${newScheduledTime}) - Réinitialisation statut de "${existingEvent.status}" à "scheduled"`);
        rdvUpdates.status = 'scheduled';
        
        // Réinitialiser completed_at si présent
        if (existingEvent.completed_at) {
          rdvUpdates.completed_at = null;
        }
      }
    }
    
    rdvUpdates.updated_at = new Date().toISOString();

    // Mettre à jour l'événement
    const { data: updatedEvent, error } = await supabase
      .from('RDV')
      .update(rdvUpdates)
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

    // Transformer l'événement RDV en format CalendarEvent pour la réponse
    const transformedEvent = transformRDVToCalendarEvent(updatedEvent);

    return res.json({
      success: true,
      data: transformedEvent,
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
      rdv_id: id, // Correction: utiliser rdv_id au lieu de event_id
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

    // Formater la date et l'heure pour les notifications
    const formatDateTime = (date: string, time: string): string => {
      try {
        const dateObj = new Date(`${date}T${time}`);
        const day = dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const hour = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        return `${day} à ${hour}`;
      } catch {
        return `${date} à ${time}`;
      }
    };

    const dateTimeStr = formatDateTime(event.scheduled_date, event.scheduled_time);

    // Envoyer des notifications aux nouveaux participants
    // Si l'événement est proposé, envoyer une notification de proposition
    const isProposed = event.status === 'proposed';
    
    for (const participant of participants) {
      try {
        // Ne pas envoyer de notification à l'utilisateur qui ajoute les participants
        if (participant.user_id === authUser.id) {
          continue;
        }

        // Générer l'URL d'action selon le type d'utilisateur
        const getActionUrl = (userType: string): string => {
          switch (userType) {
            case 'admin':
              return `/admin/events/${id}`;
            case 'expert':
              return `/expert/events/${id}`;
            case 'apporteur':
              return `/apporteur/events/${id}`;
            case 'client':
            default:
              return `/events/${id}`;
          }
        };

        const actionUrl = getActionUrl(participant.user_type);

        if (isProposed) {
          // Notification de proposition d'événement
          await supabase
            .from('notification')
            .insert({
              user_id: participant.user_id,
              user_type: participant.user_type,
              notification_type: 'event_proposed',
              title: 'Proposition d\'événement',
              message: `Vous êtes invité à l'événement "${event.title}" le ${dateTimeStr}`,
              priority: 'high',
              status: 'unread',
              is_read: false,
              metadata: {
                event_id: id,
                event_title: event.title,
                event_status: 'proposed',
                scheduled_date: event.scheduled_date,
                scheduled_time: event.scheduled_time,
                scheduled_datetime: dateTimeStr,
                duration_minutes: event.duration_minutes || 60,
                location: event.location,
                meeting_url: event.meeting_url,
                meeting_type: event.meeting_type,
                organizer_name: (authUser as any).name || authUser.email || 'Organisateur',
                organizer_id: authUser.id,
                organizer_type: authUser.type
              },
              action_url: actionUrl,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        } else {
          // Notification d'invitation à un événement confirmé
          await supabase
            .from('notification')
            .insert({
              user_id: participant.user_id,
              user_type: participant.user_type,
              notification_type: 'event_invitation',
              title: 'Invitation à un événement',
              message: `Vous êtes invité à l'événement "${event.title}" le ${dateTimeStr}`,
              priority: 'medium',
              status: 'unread',
              is_read: false,
              metadata: {
                event_id: id,
                event_title: event.title,
                event_status: event.status,
                scheduled_date: event.scheduled_date,
                scheduled_time: event.scheduled_time,
                scheduled_datetime: dateTimeStr,
                duration_minutes: event.duration_minutes || 60,
                location: event.location,
                meeting_url: event.meeting_url,
                meeting_type: event.meeting_type,
                organizer_name: (authUser as any).name || authUser.email || 'Organisateur',
                organizer_id: authUser.id,
                organizer_type: authUser.type
              },
              action_url: actionUrl,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }

        console.log(`✅ Notification envoyée à ${participant.user_type}:${participant.user_id} pour l'événement ${id}`);
      } catch (notificationError) {
        console.warn(`⚠️ Erreur notification participant ${participant.user_id}:`, notificationError);
        // Ne pas faire échouer l'ajout de participants si les notifications échouent
      }
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

/**
 * GET /api/calendar/admins - Récupérer la liste des administrateurs (accessible à tous les utilisateurs authentifiés)
 */
router.get('/admins', calendarLimiter, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  try {
    const { limit = 200 } = req.query;

    const { data: admins, error } = await supabase
      .from('Admin')
      .select('id, name, email, is_active, created_at')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .limit(Number(limit));

    if (error) {
      console.error('❌ Erreur récupération admins:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    return res.json({
      success: true,
      data: {
        admins: admins || []
      }
    });
  } catch (error) {
    console.error('❌ Erreur route admins:', error);
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