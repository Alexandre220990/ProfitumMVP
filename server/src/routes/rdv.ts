import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { RDVEmailService } from '../services/RDVEmailService';

const router = Router();

// Initialiser Supabase avec les bonnes variables d'environnement
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// TYPES
// ============================================================================

interface AuthenticatedUser {
  id: string;
  database_id: string;
  type: 'client' | 'expert' | 'admin' | 'apporteur';
  email: string;
}

type EventCategory =
  | 'rdv_client'
  | 'reunion_interne'
  | 'suivi_dossier'
  | 'echeance_admin'
  | 'rappel_personnel';

type TimelineEventType =
  | 'rdv_created'
  | 'rdv_completed'
  | 'task_created'
  | 'deadline'
  | 'note';

class RDVValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RDVValidationError';
  }
}

const VALID_CATEGORIES: EventCategory[] = [
  'rdv_client',
  'reunion_interne',
  'suivi_dossier',
  'echeance_admin',
  'rappel_personnel'
];

// Note: Extension globale déjà définie dans types/auth.ts

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Transformer un RDV en format CalendarEvent pour compatibilité
 */
function transformRDVToCalendarEvent(rdv: any): any {
  const startDateTime = `${rdv.scheduled_date}T${rdv.scheduled_time}`;
  const endDateTime = new Date(
    new Date(startDateTime).getTime() + (rdv.duration_minutes || 60) * 60000
  ).toISOString();

  return {
    id: rdv.id,
    title: rdv.title,
    description: rdv.description || rdv.notes,
    start_date: startDateTime,
    end_date: endDateTime,
    location: rdv.location,
    is_online: rdv.meeting_type === 'video',
    meeting_url: rdv.meeting_url,
    color: getStatusColor(rdv.status),
    status: rdv.status,
    type: 'appointment',
    priority: rdv.priority === 4 ? 'critical' : rdv.priority === 3 ? 'high' : rdv.priority === 2 ? 'medium' : 'low',
    category: rdv.category || 'rdv_client',
    client_id: rdv.client_id,
    expert_id: rdv.expert_id,
    created_by: rdv.created_by,
    created_at: rdv.created_at,
    updated_at: rdv.updated_at,
    metadata: {
      source: 'RDV',
      rdv_id: rdv.id,
      apporteur_id: rdv.apporteur_id,
      meeting_type: rdv.meeting_type,
      duration_minutes: rdv.duration_minutes,
      alternative_date: rdv.alternative_date,
      alternative_time: rdv.alternative_time,
      expert_notes: rdv.expert_notes,
      products: rdv.RDV_Produits || [],
      expert: rdv.Expert,
      client: rdv.Client,
      apporteur: rdv.ApporteurAffaires,
      ...rdv.metadata
    }
  };
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'proposed': '#F59E0B',
    'confirmed': '#10B981',
    'completed': '#3B82F6',
    'cancelled': '#EF4444',
    'rescheduled': '#8B5CF6'
  };
  return colors[status] || '#6B7280';
}

function getRDVTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'physical': 'Physique',
    'video': 'Visio',
    'phone': 'Téléphone'
  };
  return labels[type] || type;
}

function sanitizeMetadata(rawMetadata: any) {
  if (!rawMetadata || typeof rawMetadata !== 'object') {
    return {};
  }
  const cloned = { ...rawMetadata };
  if (!Array.isArray(cloned.additional_participants)) {
    cloned.additional_participants = [];
  }
  return cloned;
}

async function fetchCabinetIdForExpert(expertId: string): Promise<string | null> {
  if (!expertId) return null;
  const { data, error } = await supabase
    .from('Expert')
    .select('cabinet_id')
    .eq('id', expertId)
    .single();
  if (error || !data) {
    return null;
  }
  return data.cabinet_id || null;
}

async function fetchCabinetIdForApporteur(apporteurId: string): Promise<string | null> {
  if (!apporteurId) return null;
  const { data, error } = await supabase
    .from('ApporteurAffaires')
    .select('cabinet_id')
    .eq('id', apporteurId)
    .single();
  if (error || !data) {
    return null;
  }
  return data.cabinet_id || null;
}

async function fetchClientProduitEligible(clientProduitEligibleId: string) {
  const { data, error } = await supabase
    .from('ClientProduitEligible')
    .select('id, clientId')
    .eq('id', clientProduitEligibleId)
    .single();

  if (error || !data) {
    throw new RDVValidationError('Dossier ClientProduitEligible introuvable');
  }

  return data;
}

async function validateAndNormalizeRDVData(
  rawData: any,
  user: AuthenticatedUser
): Promise<{
  category: EventCategory;
  client_id: string | null;
  expert_id: string | null;
  apporteur_id: string | null;
  client_produit_eligible_id: string | null;
  metadata: any;
  cabinet_id: string | null;
}> {
  const requestedCategory = rawData?.category as EventCategory | undefined;
  const isValidCategory =
    !!requestedCategory && VALID_CATEGORIES.includes(requestedCategory as EventCategory);
  const category: EventCategory = isValidCategory
    ? (requestedCategory as EventCategory)
    : 'rdv_client';

  let clientId: string | null = rawData?.client_id || null;
  let expertId: string | null = rawData?.expert_id || null;
  let apporteurId: string | null =
    rawData?.apporteur_id || (user.type === 'apporteur' ? user.database_id : null);
  let clientProduitEligibleId: string | null = rawData?.client_produit_eligible_id || null;
  const metadata = sanitizeMetadata(rawData?.metadata);
  const additionalParticipants = metadata.additional_participants as any[];

  // Règles spécifiques
  if (category === 'rdv_client') {
    if (!clientId) {
      throw new RDVValidationError('Un client est requis pour un RDV client');
    }
    if (!expertId && !apporteurId) {
      throw new RDVValidationError('Un expert ou un apporteur est requis pour un RDV client');
    }
  }

  if (category === 'suivi_dossier') {
    if (!clientId) {
      throw new RDVValidationError('Un client est requis pour un suivi de dossier');
    }
    if (!clientProduitEligibleId) {
      throw new RDVValidationError('Un dossier ClientProduitEligible est requis pour un suivi de dossier');
    }
  }

  if (category === 'reunion_interne') {
    if (!additionalParticipants.length) {
      throw new RDVValidationError('Au moins un participant interne est requis pour une réunion interne');
    }
  }

  if (category === 'echeance_admin') {
    if (!clientId && !clientProduitEligibleId) {
      throw new RDVValidationError('Une échéance admin doit être liée à un client ou à un dossier');
    }
  }

  if (category === 'rappel_personnel') {
    clientId = clientId || null;
    expertId = expertId || (user.type === 'expert' ? user.database_id : null);
  }

  let clientProduitRecord: { clientId: string } | null = null;
  if (clientProduitEligibleId) {
    clientProduitRecord = await fetchClientProduitEligible(clientProduitEligibleId);
    if (!clientId) {
      clientId = clientProduitRecord.clientId;
    } else if (clientProduitRecord.clientId !== clientId) {
      throw new RDVValidationError('Le dossier sélectionné ne correspond pas au client fourni');
    }
  }

  if (category === 'suivi_dossier' && !clientProduitEligibleId) {
    throw new RDVValidationError('Le suivi de dossier doit référencer un ClientProduitEligible');
  }

  let cabinetId: string | null = rawData?.cabinet_id || null;

  if (!cabinetId && expertId) {
    cabinetId = await fetchCabinetIdForExpert(expertId);
  }

  if (!cabinetId && apporteurId) {
    cabinetId = await fetchCabinetIdForApporteur(apporteurId);
  }

  return {
    category,
    client_id: clientId,
    expert_id: expertId,
    apporteur_id: apporteurId,
    client_produit_eligible_id: clientProduitEligibleId,
    metadata,
    cabinet_id: cabinetId
  };
}

async function insertTimelineEventFromRDV(
  rdv: any,
  eventType: TimelineEventType,
  metadata: Record<string, any> = {}
) {
  if (!rdv?.id) return;
  const payload = {
    rdv_id: rdv.id,
    client_id: rdv.client_id || null,
    expert_id: rdv.expert_id || null,
    apporteur_id: rdv.apporteur_id || null,
    cabinet_id: rdv.cabinet_id || null,
    client_produit_eligible_id: rdv.client_produit_eligible_id || null,
    event_type: eventType,
    metadata,
    created_at: new Date().toISOString()
  };

  const { error } = await supabase.from('RDV_Timeline').insert(payload);
  if (error) {
    console.error('⚠️ Erreur insertion timeline:', error);
  }
}

// ============================================================================
// ROUTES - RÉCUPÉRATION
// ============================================================================

/**
 * GET /api/rdv - Récupérer tous les RDV de l'utilisateur
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    const { start_date, end_date, status, category, format = 'rdv' } = req.query;

    // Construire la requête
    let query = supabase
      .from('RDV')
      .select(`
        *,
        Client:client_id(id, name, company_name, email, phone_number),
        Expert:expert_id(id, name, email, specializations),
        ApporteurAffaires:apporteur_id(id, first_name, last_name, company_name),
        RDV_Produits(
          *,
          ProduitEligible:product_id(nom, description),
          ClientProduitEligible:client_produit_eligible_id(id, tauxFinal, montantFinal)
        )
      `)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true });

    // Filtrer selon le type d'utilisateur
    if (user.type === 'client') {
      query = query.eq('client_id', user.database_id);
    } else if (user.type === 'expert') {
      query = query.eq('expert_id', user.database_id);
    } else if (user.type === 'apporteur') {
      query = query.eq('apporteur_id', user.database_id);
    } else if (user.type === 'admin') {
      // Admins voient uniquement leurs propres RDV (créés par eux)
      query = query.eq('created_by', user.database_id);
    }

    // Filtres optionnels
    if (start_date) {
      query = query.gte('scheduled_date', start_date as string);
    }
    if (end_date) {
      query = query.lte('scheduled_date', end_date as string);
    }
    if (status) {
      query = query.eq('status', status as string);
    }
    if (category) {
      query = query.eq('category', category as string);
    }

    const { data: rdvs, error } = await query;

    if (error) {
      console.error('❌ Erreur récupération RDV:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des RDV'
      });
    }

    // Transformer en format CalendarEvent si demandé
    const responseData = format === 'calendar' 
      ? rdvs?.map(transformRDVToCalendarEvent) 
      : rdvs;

    return res.json({
      success: true,
      data: responseData || [],
      count: rdvs?.length || 0
    });

  } catch (error) {
    console.error('❌ Erreur route GET /rdv:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * GET /api/rdv/:id - Récupérer un RDV spécifique
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    const { data: rdv, error } = await supabase
      .from('RDV')
      .select(`
        *,
        Client:client_id(*),
        Expert:expert_id(*),
        ApporteurAffaires:apporteur_id(*),
        RDV_Produits(
          *,
          ProduitEligible:product_id(*),
          ClientProduitEligible:client_produit_eligible_id(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !rdv) {
      return res.status(404).json({
        success: false,
        message: 'RDV non trouvé'
      });
    }

    // Vérifier les permissions
    const hasAccess = 
      rdv.client_id === user.database_id ||
      rdv.expert_id === user.database_id ||
      rdv.apporteur_id === user.database_id ||
      user.type === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    return res.json({
      success: true,
      data: rdv
    });

  } catch (error) {
    console.error('❌ Erreur route GET /rdv/:id:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * GET /api/rdv/:id/timeline - Consulter timeline + rapports + tâches
 */
router.get('/:id/timeline', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    const { data: rdv, error: fetchError } = await supabase
      .from('RDV')
      .select('id, client_id, expert_id, apporteur_id, cabinet_id')
      .eq('id', id)
      .single();

    if (fetchError || !rdv) {
      return res.status(404).json({
        success: false,
        message: 'RDV non trouvé'
      });
    }

    const hasAccess =
      rdv.client_id === user.database_id ||
      rdv.expert_id === user.database_id ||
      rdv.apporteur_id === user.database_id ||
      user.type === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const [{ data: timeline, error: timelineError }, { data: reports, error: reportError }, { data: tasks, error: taskError }] =
      await Promise.all([
        supabase
          .from('RDV_Timeline')
          .select('*')
          .eq('rdv_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('RDV_Report')
          .select('*')
          .eq('rdv_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('RDV_Task')
          .select('*')
          .eq('rdv_id', id)
          .order('created_at', { ascending: false })
      ]);

    if (timelineError || reportError || taskError) {
      console.error('❌ Erreur récupération timeline:', timelineError || reportError || taskError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la timeline'
      });
    }

    return res.json({
      success: true,
      data: {
        timeline: timeline || [],
        reports: reports || [],
        tasks: tasks || []
      }
    });

  } catch (error) {
    console.error('❌ Erreur route GET /rdv/:id/timeline:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * GET /api/rdv/pending/validation - RDV en attente de validation (pour experts)
 */
router.get('/pending/validation', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser;

    if (!user || user.type !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux experts'
      });
    }

    const { data: pendingRDVs, error } = await supabase
      .from('RDV')
      .select(`
        *,
        Client(*),
        ApporteurAffaires(*),
        RDV_Produits(
          *,
          ProduitEligible(nom, description)
        )
      `)
      .eq('expert_id', user.database_id)
      .eq('status', 'proposed')
      .order('scheduled_date', { ascending: true });

    if (error) {
      console.error('❌ Erreur récupération RDV en attente:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }

    return res.json({
      success: true,
      data: pendingRDVs || [],
      count: pendingRDVs?.length || 0
    });

  } catch (error) {
    console.error('❌ Erreur route GET /rdv/pending/validation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ============================================================================
// ROUTES - CRÉATION
// ============================================================================

/**
 * POST /api/rdv - Créer un nouveau RDV
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    const rdvData = req.body;

    // ✅ Validation champs de base
    const requiredFields = ['scheduled_date', 'scheduled_time', 'meeting_type'];
    const missingFields = requiredFields.filter(field => !rdvData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Champs requis manquants: ${missingFields.join(', ')}`
      });
    }

    // ✅ Validation meeting_type avec valeurs autorisées
    const validMeetingTypes = ['physical', 'video', 'phone'];
    if (!validMeetingTypes.includes(rdvData.meeting_type)) {
      return res.status(400).json({
        success: false,
        message: `Type de rendez-vous invalide. Valeurs autorisées: ${validMeetingTypes.join(', ')}`
      });
    }

    // ✅ Validation des slots 30min (00:00 ou 00:30)
    const time = rdvData.scheduled_time;
    const minutes = time.split(':')[1];
    if (minutes !== '00' && minutes !== '30') {
      return res.status(400).json({
        success: false,
        message: 'Les RDV doivent commencer à l\'heure pile (:00) ou à la demi (:30)'
      });
    }

    let normalizedData;
    try {
      normalizedData = await validateAndNormalizeRDVData(rdvData, user);
    } catch (error: any) {
      if (error instanceof RDVValidationError) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      throw error;
    }

    // ✅ Créer le RDV avec tous les champs requis
    const newRDV = {
      ...rdvData,
      ...normalizedData,
      created_by: user.database_id,
      status: rdvData.status || 'proposed',
      source: user.type === 'apporteur' ? 'apporteur' : user.type,
      priority: rdvData.priority || 2,
      duration_minutes: rdvData.duration_minutes || 30,
      timezone: rdvData.timezone || 'Europe/Paris'
    };

    // ✅ Générer le titre si absent (meeting_type est garanti maintenant)
    if (!newRDV.title) {
      const typeLabel = getRDVTypeLabel(newRDV.meeting_type);
      newRDV.title = `RDV ${typeLabel}`;
    }

    const { data: rdv, error } = await supabase
      .from('RDV')
      .insert(newRDV)
      .select(`
        *,
        Client(*),
        Expert(*),
        ApporteurAffaires(*)
      `)
      .single();

    if (error) {
      console.error('❌ Erreur création RDV:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du RDV',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    // Créer les liaisons produits si fournis
    if (rdvData.products && Array.isArray(rdvData.products)) {
      const produits = rdvData.products.map((p: any) => ({
        rdv_id: rdv.id,
        produit_eligible_id: p.produit_eligible_id || p.id,
        client_produit_eligible_id: p.client_produit_eligible_id,
        priority: p.priority || 1,
        estimated_duration_minutes: p.estimated_duration_minutes,
        notes: p.notes
      }));

      await supabase
        .from('RDV_Produits')
        .insert(produits);
    }

    await insertTimelineEventFromRDV(rdv, 'rdv_created', {
      category: rdv.category,
      title: rdv.title,
      scheduled_date: rdv.scheduled_date,
      scheduled_time: rdv.scheduled_time,
      meeting_type: rdv.meeting_type
    });

    // Créer notification pour l'expert si RDV proposé
    if (rdv.expert_id && rdv.status === 'proposed') {
      await supabase
        .from('Notification')
        .insert({
          user_id: rdv.expert_id,
          type: 'rdv_proposed',
          title: 'Nouveau RDV proposé',
          message: `Un nouveau RDV a été proposé pour le ${rdv.scheduled_date} à ${rdv.scheduled_time}`,
          metadata: {
            rdv_id: rdv.id,
            client_name: rdv.Client?.name,
            apporteur_id: rdv.apporteur_id
          }
        });
      
      // Envoyer email à l'expert
      try {
        await RDVEmailService.sendRDVNotificationToExpert({
          meeting_id: rdv.id,
          expert_email: rdv.Expert?.email || '',
          expert_name: rdv.Expert?.name || '',
          client_name: rdv.Client?.name || '',
          client_email: rdv.Client?.email || '',
          client_phone: rdv.Client?.phone_number || '',
          company_name: rdv.Client?.company_name || '',
          scheduled_date: new Date(rdv.scheduled_date).toLocaleDateString('fr-FR'),
          scheduled_time: rdv.scheduled_time,
          duration_minutes: rdv.duration_minutes,
          meeting_type: rdv.meeting_type,
          location: rdv.location,
          products: rdv.RDV_Produits?.map((rp: any) => ({
            name: rp.ProduitEligible?.nom || '',
            estimated_savings: 0
          })) || [],
          total_savings: 0,
          products_count: rdv.RDV_Produits?.length || 0,
          qualification_score: 7,
          apporteur_name: rdv.ApporteurAffaires ? `${rdv.ApporteurAffaires.first_name} ${rdv.ApporteurAffaires.last_name}` : '',
          platform_url: process.env.CLIENT_URL || 'https://www.profitum.app'
        });
        console.log('✅ Email notification expert envoyé');
      } catch (emailError) {
        console.error('⚠️ Erreur envoi email expert:', emailError);
        // Ne pas bloquer la création du RDV si l'email échoue
      }
    }

    return res.status(201).json({
      success: true,
      data: rdv,
      message: 'RDV créé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur route POST /rdv:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ============================================================================
// ROUTES - MISE À JOUR
// ============================================================================

/**
 * PUT /api/rdv/:id - Mettre à jour un RDV
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser;
    const { id } = req.params;
    const updates = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    // Vérifier que le RDV existe et que l'utilisateur a les droits
    const { data: existingRDV, error: fetchError } = await supabase
      .from('RDV')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingRDV) {
      return res.status(404).json({
        success: false,
        message: 'RDV non trouvé'
      });
    }

    const canUpdate = 
      existingRDV.client_id === user.database_id ||
      existingRDV.expert_id === user.database_id ||
      existingRDV.apporteur_id === user.database_id ||
      (user.type === 'admin' && existingRDV.created_by === user.database_id);

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const mergedData = { ...existingRDV, ...updates };

    let normalizedUpdates;
    try {
      normalizedUpdates = await validateAndNormalizeRDVData(mergedData, user);
    } catch (error: any) {
      if (error instanceof RDVValidationError) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      throw error;
    }

    // Mettre à jour le RDV
    const { data: updatedRDV, error: updateError } = await supabase
      .from('RDV')
      .update({
        ...updates,
        ...normalizedUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        Client(*),
        Expert(*),
        ApporteurAffaires(*),
        RDV_Produits(*, ProduitEligible(*))
      `)
      .single();

    if (updateError) {
      console.error('❌ Erreur mise à jour RDV:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du RDV'
      });
    }

    if (existingRDV.status !== 'completed' && updatedRDV.status === 'completed') {
      await insertTimelineEventFromRDV(updatedRDV, 'rdv_completed', {
        status: updatedRDV.status,
        completed_at: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      data: updatedRDV,
      message: 'RDV mis à jour avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur route PUT /rdv/:id:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * POST /api/rdv/:id/report - Ajouter un résumé post-RDV
 */
router.post('/:id/report', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    const { data: rdv, error: fetchError } = await supabase
      .from('RDV')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !rdv) {
      return res.status(404).json({
        success: false,
        message: 'RDV non trouvé'
      });
    }

    const isParticipant =
      rdv.client_id === user.database_id ||
      rdv.expert_id === user.database_id ||
      rdv.apporteur_id === user.database_id ||
      user.type === 'admin';

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    if (rdv.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Le RDV doit être complété avant d\'ajouter un résumé'
      });
    }

    const summary: string = req.body?.summary;
    const actionItems = Array.isArray(req.body?.action_items) ? req.body.action_items : [];
    const metadata = typeof req.body?.metadata === 'object' && req.body?.metadata !== null ? req.body.metadata : {};
    const visibility: 'participants' | 'cabinet' | 'internal' =
      ['participants', 'cabinet', 'internal'].includes(req.body?.visibility)
        ? req.body.visibility
        : 'participants';

    if (!summary || typeof summary !== 'string' || summary.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Un résumé est requis'
      });
    }

    const { data: report, error: insertError } = await supabase
      .from('RDV_Report')
      .insert({
        rdv_id: id,
        author_id: user.database_id,
        author_type: user.type,
        summary: summary.trim(),
        action_items: actionItems,
        visibility,
        metadata
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('❌ Erreur création résumé RDV:', insertError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'enregistrement du résumé'
      });
    }

    await insertTimelineEventFromRDV(rdv, 'note', {
      report_id: report.id,
      summary_preview: summary.slice(0, 200),
      author_type: user.type,
      visibility
    });

    return res.status(201).json({
      success: true,
      data: report,
      message: 'Résumé ajouté avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur route POST /rdv/:id/report:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * POST /api/rdv/:id/tasks - Créer une tâche liée au RDV/dossier
 */
router.post('/:id/tasks', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    const { data: rdv, error: fetchError } = await supabase
      .from('RDV')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !rdv) {
      return res.status(404).json({
        success: false,
        message: 'RDV non trouvé'
      });
    }

    const isParticipant =
      rdv.client_id === user.database_id ||
      rdv.expert_id === user.database_id ||
      rdv.apporteur_id === user.database_id ||
      user.type === 'admin';

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const { type, title, description, expert_id, due_date, priority = 2, metadata = {}, client_produit_eligible_id } = req.body || {};

    const validTypes = ['suivi_dossier', 'echeance_admin', 'rappel_personnel'];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type de tâche invalide'
      });
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Un titre est requis'
      });
    }

    const sanitizedMetadata = typeof metadata === 'object' && metadata !== null ? metadata : {};
    const priorityValue = Math.min(4, Math.max(1, Number(priority) || 2));

    let resolvedClientId = rdv.client_id || null;
    let resolvedExpertId = expert_id || rdv.expert_id || null;
    let resolvedCPE = client_produit_eligible_id || rdv.client_produit_eligible_id || null;
    let resolvedDueDate = due_date || null;

    if (type === 'suivi_dossier' && !resolvedCPE) {
      return res.status(400).json({
        success: false,
        message: 'Un dossier ClientProduitEligible est requis pour une tâche de suivi'
      });
    }

    if (type === 'echeance_admin' && !resolvedDueDate) {
      return res.status(400).json({
        success: false,
        message: 'Une date d\'échéance est requise pour une tâche administrative'
      });
    }

    if (type === 'rappel_personnel' && user.type === 'expert') {
      resolvedExpertId = user.database_id;
    }

    const { data: task, error: insertError } = await supabase
      .from('RDV_Task')
      .insert({
        rdv_id: rdv.id,
        type,
        title: title.trim(),
        description: description || null,
        client_id: resolvedClientId,
        expert_id: resolvedExpertId,
        apporteur_id: rdv.apporteur_id,
        cabinet_id: rdv.cabinet_id,
        client_produit_eligible_id: resolvedCPE,
        due_date: resolvedDueDate,
        priority: priorityValue,
        metadata: sanitizedMetadata,
        created_by: user.database_id
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('❌ Erreur création tâche RDV:', insertError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la tâche'
      });
    }

    const timelineEventType: TimelineEventType = type === 'echeance_admin' ? 'deadline' : 'task_created';

    await insertTimelineEventFromRDV(rdv, timelineEventType, {
      task_id: task.id,
      type: task.type,
      title: task.title,
      due_date: task.due_date,
      status: task.status
    });

    return res.status(201).json({
      success: true,
      data: task,
      message: 'Tâche créée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur route POST /rdv/:id/tasks:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * PATCH /api/rdv/tasks/:taskId - Mettre à jour une tâche RDV
 */
router.patch('/tasks/:taskId', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser;
    const { taskId } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    const { data: taskRecord, error: fetchError } = await supabase
      .from('RDV_Task')
      .select(`
        *,
        RDV:rdv_id (
          id,
          client_id,
          expert_id,
          apporteur_id,
          cabinet_id
        )
      `)
      .eq('id', taskId)
      .single();

    if (fetchError || !taskRecord) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    const rdvInfo = taskRecord.RDV;
    const isAuthorized =
      user.type === 'admin' ||
      taskRecord.created_by === user.database_id ||
      taskRecord.expert_id === user.database_id ||
      taskRecord.apporteur_id === user.database_id ||
      (rdvInfo && (
        rdvInfo.client_id === user.database_id ||
        rdvInfo.expert_id === user.database_id ||
        rdvInfo.apporteur_id === user.database_id
      ));

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const updates = req.body || {};
    const allowedStatuses = ['open', 'in_progress', 'done', 'cancelled'];
    const updatePayload: Record<string, any> = {};

    if (updates.status) {
      if (!allowedStatuses.includes(updates.status)) {
        return res.status(400).json({
          success: false,
          message: 'Statut invalide'
        });
      }
      updatePayload.status = updates.status;
      updatePayload.status_updated_at = new Date().toISOString();
    }

    if (updates.due_date) {
      updatePayload.due_date = updates.due_date;
    }

    if (updates.priority) {
      const priorityValue = Math.min(4, Math.max(1, Number(updates.priority) || 2));
      updatePayload.priority = priorityValue;
    }

    if (updates.expert_id) {
      updatePayload.expert_id = updates.expert_id;
    }

    if (typeof updates.description === 'string') {
      updatePayload.description = updates.description;
    }

    if (updates.metadata && typeof updates.metadata === 'object') {
      updatePayload.metadata = updates.metadata;
    }

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune mise à jour valide fournie'
      });
    }

    updatePayload.updated_at = new Date().toISOString();

    const { data: updatedTask, error: updateError } = await supabase
      .from('RDV_Task')
      .update(updatePayload)
      .eq('id', taskId)
      .select('*')
      .single();

    if (updateError) {
      console.error('❌ Erreur mise à jour tâche:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la tâche'
      });
    }

    if (updatePayload.status) {
      await insertTimelineEventFromRDV(
        {
          id: taskRecord.rdv_id,
          client_id: taskRecord.client_id,
          expert_id: taskRecord.expert_id,
          apporteur_id: taskRecord.apporteur_id,
          cabinet_id: taskRecord.cabinet_id,
          client_produit_eligible_id: taskRecord.client_produit_eligible_id
        },
        'note',
        {
          task_id: taskId,
          status: updatePayload.status,
          updated_by: user.database_id
        }
      );
    }

    return res.json({
      success: true,
      data: updatedTask,
      message: 'Tâche mise à jour avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur route PATCH /rdv/tasks/:taskId:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * PUT /api/rdv/:id/validate - Expert valide un RDV
 */
router.put('/:id/validate', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser;
    const { id } = req.params;
    const { action, alternative_date, alternative_time, expert_notes } = req.body;

    if (!user || user.type !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux experts'
      });
    }

    // Vérifier que le RDV existe et appartient à cet expert
    const { data: rdv, error: fetchError } = await supabase
      .from('RDV')
      .select('*')
      .eq('id', id)
      .eq('expert_id', user.database_id)
      .single();

    if (fetchError || !rdv) {
      return res.status(404).json({
        success: false,
        message: 'RDV non trouvé'
      });
    }

    let updateData: any = {
      expert_notes,
      updated_at: new Date().toISOString()
    };

    if (action === 'accept') {
      updateData.status = 'confirmed';
    } else if (action === 'propose_alternative') {
      if (!alternative_date || !alternative_time) {
        return res.status(400).json({
          success: false,
          message: 'Date et heure alternatives requises'
        });
      }
      updateData.original_date = rdv.scheduled_date;
      updateData.original_time = rdv.scheduled_time;
      updateData.alternative_date = alternative_date;
      updateData.alternative_time = alternative_time;
      updateData.status = 'proposed'; // Reste en proposed jusqu'à validation client
    }

    const { data: updatedRDV, error: updateError } = await supabase
      .from('RDV')
      .update(updateData)
      .eq('id', id)
      .select('*, Client(*)')
      .single();

    if (updateError) {
      console.error('❌ Erreur validation RDV:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la validation'
      });
    }

    // Créer notification pour le client/apporteur
    const notifUserId = rdv.apporteur_id || rdv.client_id;
    if (notifUserId) {
      await supabase
        .from('Notification')
        .insert({
          user_id: notifUserId,
          type: action === 'accept' ? 'rdv_confirmed' : 'rdv_alternative_proposed',
          title: action === 'accept' ? 'RDV confirmé' : 'Date alternative proposée',
          message: action === 'accept' 
            ? `Votre RDV du ${rdv.scheduled_date} à ${rdv.scheduled_time} a été confirmé`
            : `Une date alternative a été proposée : ${alternative_date} à ${alternative_time}`,
          metadata: {
            rdv_id: id,
            expert_id: user.database_id
          }
        });
      
      // Envoyer email selon l'action
      try {
        if (action === 'propose_alternative' && rdv.Client) {
          // Email date alternative au client
          await RDVEmailService.sendAlternativeDateProposal({
            meeting_id: rdv.id,
            client_email: rdv.Client.email,
            client_name: rdv.Client.name,
            original_date: new Date(rdv.scheduled_date).toLocaleDateString('fr-FR'),
            original_time: rdv.scheduled_time,
            alternative_date: new Date(alternative_date).toLocaleDateString('fr-FR'),
            alternative_time: alternative_time,
            expert_name: updatedRDV.Expert?.name || '',
            expert_notes: expert_notes,
            products: updatedRDV.RDV_Produits?.map((rp: any) => ({
              name: rp.ProduitEligible?.nom || '',
              estimated_savings: 0
            })) || [],
            apporteur_name: rdv.ApporteurAffaires ? `${rdv.ApporteurAffaires.first_name} ${rdv.ApporteurAffaires.last_name}` : '',
            apporteur_email: rdv.ApporteurAffaires?.email || '',
            platform_url: process.env.CLIENT_URL || 'https://www.profitum.app'
          });
          console.log('✅ Email date alternative envoyé au client');
        }
      } catch (emailError) {
        console.error('⚠️ Erreur envoi email:', emailError);
      }
    }

    return res.json({
      success: true,
      data: updatedRDV,
      message: action === 'accept' ? 'RDV confirmé' : 'Date alternative proposée'
    });

  } catch (error) {
    console.error('❌ Erreur route PUT /rdv/:id/validate:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * PUT /api/rdv/:id/respond - Répondre à un RDV (tous utilisateurs)
 * Actions: accept, refuse, propose_alternative
 */
router.put('/:id/respond', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser;
    const { id } = req.params;
    const { action, alternative_date, alternative_time, refusal_reason, notes } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    // Actions valides
    if (!['accept', 'refuse', 'propose_alternative'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action invalide'
      });
    }

    // Récupérer le RDV
    const { data: rdv, error: fetchError } = await supabase
      .from('RDV')
      .select('*, Client(*), Expert(*), ApporteurAffaires(*)')
      .eq('id', id)
      .single();

    if (fetchError || !rdv) {
      return res.status(404).json({
        success: false,
        message: 'RDV non trouvé'
      });
    }

    // Vérifier que l'utilisateur est participant
    const isParticipant = 
      rdv.client_id === user.database_id ||
      rdv.expert_id === user.database_id ||
      rdv.apporteur_id === user.database_id ||
      user.type === 'admin';

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas participant à ce RDV'
      });
    }

    let updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Gérer l'action
    if (action === 'accept') {
      updateData.status = 'confirmed';
      updateData[`${user.type}_response`] = 'accepted';
      updateData[`${user.type}_response_date`] = new Date().toISOString();
    } else if (action === 'refuse') {
      if (!refusal_reason) {
        return res.status(400).json({
          success: false,
          message: 'Motif de refus requis'
        });
      }
      updateData.status = 'cancelled';
      updateData[`${user.type}_response`] = 'refused';
      updateData[`${user.type}_response_date`] = new Date().toISOString();
      updateData.refusal_reason = refusal_reason;
    } else if (action === 'propose_alternative') {
      if (!alternative_date || !alternative_time) {
        return res.status(400).json({
          success: false,
          message: 'Date et heure alternatives requises'
        });
      }

      // Validation slot 30min
      const minutes = alternative_time.split(':')[1];
      if (minutes !== '00' && minutes !== '30') {
        return res.status(400).json({
          success: false,
          message: 'L\'heure doit être à :00 ou :30'
        });
      }

      updateData.original_date = rdv.scheduled_date;
      updateData.original_time = rdv.scheduled_time;
      updateData.alternative_date = alternative_date;
      updateData.alternative_time = alternative_time;
      updateData[`${user.type}_notes`] = notes;
      updateData.status = 'rescheduled';
    }

    // Mettre à jour le RDV
    const { data: updatedRDV, error: updateError } = await supabase
      .from('RDV')
      .update(updateData)
      .eq('id', id)
      .select('*, Client(*), Expert(*), ApporteurAffaires(*)')
      .single();

    if (updateError) {
      console.error('❌ Erreur réponse RDV:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la réponse'
      });
    }

    // Créer notifications pour les autres participants
    const participants = [
      { id: rdv.client_id, type: 'client' },
      { id: rdv.expert_id, type: 'expert' },
      { id: rdv.apporteur_id, type: 'apporteur' }
    ].filter(p => p.id && p.id !== user.database_id);

    for (const participant of participants) {
      await supabase
        .from('Notification')
        .insert({
          user_id: participant.id,
          type: `rdv_${action}`,
          title: action === 'accept' ? 'RDV confirmé' : action === 'refuse' ? 'RDV refusé' : 'Date alternative proposée',
          message: action === 'accept' 
            ? `Le RDV du ${rdv.scheduled_date} à ${rdv.scheduled_time} a été confirmé`
            : action === 'refuse'
            ? `Le RDV a été refusé. Raison : ${refusal_reason}`
            : `Une date alternative a été proposée : ${alternative_date} à ${alternative_time}`,
          metadata: {
            rdv_id: id,
            action,
            responded_by: user.type
          }
        });
    }

    return res.json({
      success: true,
      data: updatedRDV,
      message: action === 'accept' ? 'RDV confirmé' : action === 'refuse' ? 'RDV refusé' : 'Alternative proposée'
    });

  } catch (error) {
    console.error('❌ Erreur route /rdv/:id/respond:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ============================================================================
// ROUTES - SUPPRESSION
// ============================================================================

/**
 * DELETE /api/rdv/:id - Supprimer un RDV
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    // Vérifier les permissions
    const { data: rdv, error: fetchError } = await supabase
      .from('RDV')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !rdv) {
      return res.status(404).json({
        success: false,
        message: 'RDV non trouvé'
      });
    }

    // Seul le créateur peut supprimer son RDV (y compris les admins)
    const canDelete = rdv.created_by === user.database_id;

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Seul le créateur peut supprimer ce RDV'
      });
    }

    // Supprimer le RDV (cascade supprime aussi RDV_Produits)
    const { error: deleteError } = await supabase
      .from('RDV')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ Erreur suppression RDV:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du RDV'
      });
    }

    return res.json({
      success: true,
      message: 'RDV supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur route DELETE /rdv/:id:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ============================================================================
// POST /rdv/:id/mark-completed - Marquer un RDV comme effectué ou non
// ============================================================================
router.post('/:id/mark-completed', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { completed, cancellation_reason } = req.body;
    const user = (req as any).user;

    if (!user?.database_id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    // Récupérer le RDV
    const { data: rdv, error: fetchError } = await supabase
      .from('RDV')
      .select('*, Client(*), Expert(*), ApporteurAffaires(*)')
      .eq('id', id)
      .single();

    if (fetchError || !rdv) {
      return res.status(404).json({
        success: false,
        message: 'RDV non trouvé'
      });
    }

    // Vérifier que l'utilisateur est participant
    const isParticipant = 
      rdv.client_id === user.database_id ||
      rdv.expert_id === user.database_id ||
      rdv.apporteur_id === user.database_id ||
      user.type === 'admin';

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas participant à ce RDV'
      });
    }

    // Mettre à jour le statut
    const newStatus = completed ? 'completed' : 'cancelled';
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (!completed && cancellation_reason) {
      updateData.cancellation_reason = cancellation_reason;
    }

    const { error: updateError } = await supabase
      .from('RDV')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('❌ Erreur mise à jour RDV:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du RDV'
      });
    }

    // Envoyer notifications aux autres participants
    const participants = [
      rdv.client_id,
      rdv.expert_id,
      rdv.apporteur_id
    ].filter(pid => pid && pid !== user.database_id);

    for (const participantId of participants) {
      const notificationData = {
        user_id: participantId,
        type: completed ? 'rdv_completed' : 'rdv_not_completed',
        title: completed ? 'RDV effectué' : 'RDV non effectué',
        message: completed 
          ? `Le RDV "${rdv.title}" a été marqué comme effectué.`
          : `Le RDV "${rdv.title}" n'a pas eu lieu. Raison: ${cancellation_reason || 'Non spécifiée'}`,
        metadata: {
          rdv_id: id,
          completed,
          cancellation_reason
        }
      };

      await supabase
        .from('Notification')
        .insert(notificationData);
    }

    // Envoyer emails (optionnel - si EmailService est disponible)
    try {
      const emailService = require('../services/EmailService');
      
      for (const participantId of participants) {
        let email = '';
        if (rdv.Client?.id === participantId) email = rdv.Client.email;
        else if (rdv.Expert?.id === participantId) email = rdv.Expert.email;
        else if (rdv.ApporteurAffaires?.id === participantId) email = rdv.ApporteurAffaires.email;

        if (email) {
          await emailService.default.sendEmail(
            email,
            completed ? 'RDV effectué' : 'RDV non effectué',
            completed
              ? `Le RDV "${rdv.title}" prévu le ${rdv.scheduled_date} à ${rdv.scheduled_time} a été marqué comme effectué.`
              : `Le RDV "${rdv.title}" prévu le ${rdv.scheduled_date} à ${rdv.scheduled_time} n'a pas eu lieu.<br>Raison: ${cancellation_reason || 'Non spécifiée'}`
          );
        }
      }
    } catch (emailError) {
      console.error('⚠️ Erreur envoi emails (non bloquant):', emailError);
    }

    return res.json({
      success: true,
      message: completed ? 'RDV marqué comme effectué' : 'RDV marqué comme non effectué',
      data: { id, status: newStatus }
    });

  } catch (error) {
    console.error('❌ Erreur route POST /rdv/:id/mark-completed:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default router;

