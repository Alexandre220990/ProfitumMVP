import express, { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// ROUTES VALIDATION RDV PAR EXPERT
// ============================================================================

/**
 * PUT /api/expert/meetings/:meetingId/respond
 * L'expert répond à une proposition de RDV
 */
router.put('/meetings/:meetingId/respond', async (req: Request, res: Response): Promise<any> => {
  try {
    const { meetingId } = req.params;
    const user = req.user as any;
    
    if (!user || user.type !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux experts'
      });
    }
    
    const { 
      response, // 'accept' | 'propose_alternative'
      alternative_date,
      alternative_time,
      notes
    } = req.body;
    
    if (!response || !['accept', 'propose_alternative'].includes(response)) {
      return res.status(400).json({
        success: false,
        message: 'Réponse invalide (accept ou propose_alternative requis)'
      });
    }
    
    // Récupérer le RDV
    const { data: rdv, error: rdvError } = await supabase
      .from('ClientRDV')
      .select(`
        *,
        Client (id, name, company_name, email, auth_user_id),
        Expert (id, name, email)
      `)
      .eq('id', meetingId)
      .eq('expert_id', user.database_id)
      .single();
    
    if (rdvError || !rdv) {
      return res.status(404).json({
        success: false,
        message: 'RDV non trouvé ou non autorisé'
      });
    }
    
    if (response === 'accept') {
      // Expert accepte le RDV
      const { error: updateError } = await supabase
        .from('ClientRDV')
        .update({
          status: 'confirmed',
          expert_response: 'accept',
          expert_response_at: new Date().toISOString(),
          expert_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', meetingId);
      
      if (updateError) throw updateError;
      
      console.log(`✅ Expert ${user.database_id} a accepté le RDV ${meetingId}`);
      
      // Notifications
      await createNotifications({
        rdv: rdv,
        action: 'accepted',
        apporteur_id: rdv.apporteur_id,
        client_id: rdv.client_id,
        expert_notes: notes
      });
      
      // Email au client
      await sendClientEmailRDVConfirmed(rdv, notes);
      
      return res.json({
        success: true,
        message: 'RDV confirmé',
        data: { rdv_id: meetingId, status: 'confirmed' }
      });
      
    } else if (response === 'propose_alternative') {
      // Expert propose une nouvelle date
      if (!alternative_date || !alternative_time) {
        return res.status(400).json({
          success: false,
          message: 'Date et heure alternatives requises'
        });
      }
      
      const { error: updateError } = await supabase
        .from('ClientRDV')
        .update({
          status: 'pending_client_validation',
          expert_response: 'propose_alternative',
          expert_response_at: new Date().toISOString(),
          alternative_date: alternative_date,
          alternative_time: alternative_time,
          expert_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', meetingId);
      
      if (updateError) throw updateError;
      
      console.log(`📅 Expert ${user.database_id} propose nouvelle date pour RDV ${meetingId}`);
      
      // Notifications
      await createNotifications({
        rdv: rdv,
        action: 'alternative_proposed',
        apporteur_id: rdv.apporteur_id,
        client_id: rdv.client_id,
        alternative_date: alternative_date,
        alternative_time: alternative_time,
        expert_notes: notes
      });
      
      return res.json({
        success: true,
        message: 'Nouvelle date proposée, en attente de validation du client',
        data: { 
          rdv_id: meetingId, 
          status: 'pending_client_validation',
          alternative_date: alternative_date,
          alternative_time: alternative_time
        }
      });
    }
    
    // Cas par défaut (ne devrait jamais arriver grâce à la validation ligne 38)
    return res.status(400).json({
      success: false,
      message: 'Action non reconnue'
    });
    
  } catch (error) {
    console.error('❌ Erreur réponse expert RDV:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur serveur'
    });
  }
});

/**
 * PUT /api/client/meetings/:meetingId/validate-alternative
 * Le client valide (ou refuse) la date alternative proposée par l'expert
 */
router.put('/meetings/:meetingId/validate-alternative', async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;
    const user = req.user as any;
    
    if (!user || user.type !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux clients'
      });
    }
    
    const { accept } = req.body; // true ou false
    
    // Récupérer le RDV
    const { data: rdv, error: rdvError } = await supabase
      .from('ClientRDV')
      .select('*')
      .eq('id', meetingId)
      .eq('client_id', user.database_id)
      .eq('status', 'pending_client_validation')
      .single();
    
    if (rdvError || !rdv) {
      return res.status(404).json({
        success: false,
        message: 'RDV non trouvé ou non en attente de validation'
      });
    }
    
    if (accept) {
      // Client accepte la nouvelle date
      const { error: updateError } = await supabase
        .from('ClientRDV')
        .update({
          status: 'confirmed',
          scheduled_date: rdv.alternative_date,
          scheduled_time: rdv.alternative_time,
          client_validation_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', meetingId);
      
      if (updateError) throw updateError;
      
      // Notifications
      await createNotifications({
        rdv: rdv,
        action: 'alternative_accepted_by_client',
        apporteur_id: rdv.apporteur_id,
        expert_id: rdv.expert_id
      });
      
      return res.json({
        success: true,
        message: 'Nouvelle date confirmée',
        data: { 
          rdv_id: meetingId,
          confirmed_date: rdv.alternative_date,
          confirmed_time: rdv.alternative_time
        }
      });
      
    } else {
      // Client refuse la nouvelle date
      const { error: updateError } = await supabase
        .from('ClientRDV')
        .update({
          status: 'needs_rescheduling',
          client_validation_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', meetingId);
      
      if (updateError) throw updateError;
      
      // Notifications
      await createNotifications({
        rdv: rdv,
        action: 'alternative_refused_by_client',
        apporteur_id: rdv.apporteur_id,
        expert_id: rdv.expert_id
      });
      
      return res.json({
        success: true,
        message: 'Date refusée, reprogrammation nécessaire',
        data: { rdv_id: meetingId, status: 'needs_rescheduling' }
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur validation date alternative:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur serveur'
    });
  }
});

/**
 * GET /api/expert/meetings/pending
 * Récupérer les RDV en attente de validation par l'expert
 */
router.get('/meetings/pending', async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    
    if (!user || user.type !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux experts'
      });
    }
    
    const { data: pendingMeetings, error } = await supabase
      .from('ClientRDV')
      .select(`
        *,
        Client (id, name, company_name, email, phone_number),
        ClientRDV_Produits (
          id,
          product_id,
          priority,
          estimated_duration_minutes,
          ProduitEligible (nom, description)
        )
      `)
      .eq('expert_id', user.database_id)
      .eq('status', 'proposed')
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true });
    
    if (error) throw error;
    
    return res.json({
      success: true,
      data: pendingMeetings || [],
      count: pendingMeetings?.length || 0
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération RDV en attente:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur serveur'
    });
  }
});

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Créer les notifications appropriées selon l'action
 */
async function createNotifications(params: {
  rdv: any;
  action: 'accepted' | 'alternative_proposed' | 'alternative_accepted_by_client' | 'alternative_refused_by_client';
  apporteur_id?: string;
  client_id?: string;
  expert_id?: string;
  alternative_date?: string;
  alternative_time?: string;
  expert_notes?: string;
}): Promise<void> {
  
  const notifications: any[] = [];
  
  if (params.action === 'accepted') {
    // Expert a accepté
    
    // Notif apporteur
    if (params.apporteur_id) {
      notifications.push({
        recipient_id: params.apporteur_id,
        recipient_type: 'apporteur',
        type: 'APPORTEUR_EXPERT_RDV_ACCEPTED',
        title: 'RDV Confirmé',
        message: `${params.rdv.Expert?.name} a accepté le RDV du ${params.rdv.scheduled_date}`,
        data: { rdv_id: params.rdv.id },
        priority: 'medium',
        read: false,
        created_at: new Date().toISOString()
      });
    }
    
    // Notif client
    if (params.client_id) {
      notifications.push({
        recipient_id: params.client_id,
        recipient_type: 'client',
        type: 'CLIENT_RDV_CONFIRMED',
        title: 'RDV Confirmé',
        message: `Votre RDV avec ${params.rdv.Expert?.name} est confirmé le ${params.rdv.scheduled_date} à ${params.rdv.scheduled_time}`,
        data: { rdv_id: params.rdv.id },
        priority: 'high',
        read: false,
        created_at: new Date().toISOString()
      });
    }
    
  } else if (params.action === 'alternative_proposed') {
    // Expert propose nouvelle date
    
    // Notif apporteur
    if (params.apporteur_id) {
      notifications.push({
        recipient_id: params.apporteur_id,
        recipient_type: 'apporteur',
        type: 'APPORTEUR_EXPERT_RDV_ALTERNATIVE',
        title: 'Nouvelle Date Proposée',
        message: `${params.rdv.Expert?.name} propose ${params.alternative_date} à ${params.alternative_time}`,
        data: { 
          rdv_id: params.rdv.id,
          alternative_date: params.alternative_date,
          alternative_time: params.alternative_time
        },
        priority: 'high',
        read: false,
        created_at: new Date().toISOString()
      });
    }
    
    // Notif client
    if (params.client_id) {
      notifications.push({
        recipient_id: params.client_id,
        recipient_type: 'client',
        type: 'CLIENT_RDV_ALTERNATIVE_PROPOSED',
        title: 'Nouvelle Date Proposée',
        message: `L'expert propose le ${params.alternative_date} à ${params.alternative_time} au lieu du ${params.rdv.scheduled_date}`,
        data: { 
          rdv_id: params.rdv.id,
          alternative_date: params.alternative_date,
          alternative_time: params.alternative_time
        },
        priority: 'high',
        read: false,
        created_at: new Date().toISOString()
      });
    }
    
  } else if (params.action === 'alternative_accepted_by_client') {
    // Client accepte la date alternative
    
    // Notif expert
    if (params.expert_id) {
      notifications.push({
        recipient_id: params.expert_id,
        recipient_type: 'expert',
        type: 'EXPERT_RDV_ALTERNATIVE_ACCEPTED',
        title: 'Date Alternative Acceptée',
        message: `Le client a accepté le RDV du ${params.rdv.alternative_date} à ${params.rdv.alternative_time}`,
        data: { rdv_id: params.rdv.id },
        priority: 'high',
        read: false,
        created_at: new Date().toISOString()
      });
    }
    
    // Notif apporteur
    if (params.apporteur_id) {
      notifications.push({
        recipient_id: params.apporteur_id,
        recipient_type: 'apporteur',
        type: 'APPORTEUR_CLIENT_VALIDATED_ALTERNATIVE',
        title: 'Date Alternative Validée',
        message: `Le client a validé la nouvelle date proposée par ${params.rdv.Expert?.name}`,
        data: { rdv_id: params.rdv.id },
        priority: 'medium',
        read: false,
        created_at: new Date().toISOString()
      });
    }
  }
  
  // Insérer toutes les notifications
  if (notifications.length > 0) {
    const { error } = await supabase
      .from('notification')
      .insert(notifications);
    
    if (error) {
      console.error('❌ Erreur création notifications:', error);
    } else {
      console.log(`✅ ${notifications.length} notifications créées`);
    }
  }
}

/**
 * Envoyer email au client pour RDV confirmé
 */
async function sendClientEmailRDVConfirmed(rdv: any, expertNotes?: string): Promise<void> {
  // TODO: Implémenter envoi email avec service EmailService
  console.log(`📧 Email RDV confirmé à envoyer au client ${rdv.client_id}`);
  
  // Structure de l'email :
  // - Confirmation RDV
  // - Date/heure
  // - Expert assigné
  // - Produits à discuter
  // - Lien ajout calendrier (.ics)
  // - Lien accès espace client
}

export default router;

