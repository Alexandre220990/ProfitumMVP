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
    category: rdv.category || 'client_rdv',
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
        client_id:Client(id, name, company_name, email, phone_number),
        expert_id:Expert(id, name, email, specializations),
        apporteur_id:ApporteurAffaires(id, first_name, last_name, company_name),
        RDV_Produits(
          *,
          product_id:ProduitEligible(nom, description),
          client_produit_eligible_id:ClientProduitEligible(id, tauxFinal, montantFinal)
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
    }
    // Admin voit tout

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
        client_id:Client(*),
        expert_id:Expert(*),
        apporteur_id:ApporteurAffaires(*),
        RDV_Produits(
          *,
          product_id:ProduitEligible(*),
          client_produit_eligible_id:ClientProduitEligible(*)
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

    // ✅ Validation COMPLÈTE des champs requis
    const requiredFields = ['scheduled_date', 'scheduled_time', 'meeting_type', 'client_id', 'expert_id'];
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

    // ✅ Créer le RDV avec tous les champs requis
    const newRDV = {
      ...rdvData,
      created_by: user.database_id,
      status: rdvData.status || 'proposed',
      category: rdvData.category || 'client_rdv',
      source: user.type === 'apporteur' ? 'apporteur' : user.type,
      priority: rdvData.priority || 2,
      duration_minutes: rdvData.duration_minutes || 30,
      timezone: rdvData.timezone || 'Europe/Paris',
      // ✅ apporteur_id optionnel (nullable depuis correction SQL)
      apporteur_id: rdvData.apporteur_id || (user.type === 'apporteur' ? user.database_id : null)
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
      user.type === 'admin';

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Mettre à jour le RDV
    const { data: updatedRDV, error: updateError } = await supabase
      .from('RDV')
      .update({
        ...updates,
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

    const canDelete = 
      rdv.created_by === user.database_id ||
      user.type === 'admin';

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Seul le créateur ou un admin peut supprimer ce RDV'
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

