import express from 'express';
import { Request, Response } from 'express';
import { authExpert, checkNotificationOwnership, checkMeetingOwnership, ExpertRequest } from '../middleware/auth-apporteur';
import { NotificationService } from '../services/NotificationService';
import { ProspectService } from '../services/ProspectService';

const router = express.Router();

// Middleware d'authentification expert
router.use(authExpert as any);

// ===== NOTIFICATIONS =====
// Récupérer les notifications
router.get('/notifications', async (req: any, res: any): Promise<void> => {
    try {
        const expertId = req.user!.expert_id;
        const filters = req.query;
        
        const result = await NotificationService.getExpertNotifications(expertId, filters);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('Erreur récupération notifications:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des notifications' });
    }
});

// Marquer notification comme lue
router.put('/notifications/:notificationId/read', checkNotificationOwnership as any, async (req: any, res: any): Promise<void> => {
    try {
        const { notificationId } = req.params;
        const expertId = req.user!.expert_id;
        
        await NotificationService.markNotificationAsRead(notificationId, expertId);
        
        res.json({ success: true, message: 'Notification marquée comme lue' });
    } catch (error) {
        console.error('Erreur marquage notification:', error);
        res.status(500).json({ error: 'Erreur lors du marquage de la notification' });
    }
});

// Marquer notification comme agie
router.put('/notifications/:notificationId/acted', checkNotificationOwnership as any, async (req: any, res: any): Promise<void> => {
    try {
        const { notificationId } = req.params;
        const expertId = req.user!.expert_id;
        
        await NotificationService.markNotificationAsActed(notificationId, expertId);
        
        res.json({ success: true, message: 'Notification marquée comme agie' });
    } catch (error) {
        console.error('Erreur marquage notification:', error);
        res.status(500).json({ error: 'Erreur lors du marquage de la notification' });
    }
});

// Statistiques des notifications
router.get('/notifications/stats', async (req: any, res: any): Promise<void> => {
    try {
        const expertId = req.user!.expert_id;
        const stats = await NotificationService.getNotificationStats(expertId);
        
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Erreur récupération stats notifications:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
    }
});

// ===== PROSPECTS =====
// Récupérer les prospects assignés
router.get('/prospects', async (req: any, res: any): Promise<void> => {
    try {
        const expertId = req.user!.expert_id;
        const { status, page = 1, limit = 20 } = req.query;
        
        // Récupérer les prospects où l'expert est présélectionné
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        
        let query = supabase
            .from('Prospect')
            .select(`
                *,
                expert:Expert(id, name, email, specializations),
                apporteur:ApporteurAffaires(id, first_name, last_name, company_name)
            `)
            .eq('preselected_expert_id', expertId)
            .order('created_at', { ascending: false })
            .range((Number(page) - 1) * Number(limit), Number(page) * Number(limit) - 1);

        if (status) {
            query = query.eq('status', status);
        }

        const { data: prospects, error, count } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data: prospects || [],
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: count || 0,
                total_pages: Math.ceil((count || 0) / Number(limit))
            }
        });
    } catch (error) {
        console.error('Erreur récupération prospects expert:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des prospects' });
    }
});

// Détails d'un prospect
router.get('/prospects/:prospectId', async (req: any, res: any): Promise<void> => {
    try {
        const { prospectId } = req.params;
        const expertId = req.user!.expert_id;
        
        // Vérifier que l'expert est bien assigné à ce prospect
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        
        const { data: prospect, error } = await supabase
            .from('Prospect')
            .select(`
                *,
                expert:Expert(id, name, email, specializations),
                apporteur:ApporteurAffaires(id, first_name, last_name, company_name),
                meetings:ProspectMeeting(
                    id,
                    meeting_type,
                    scheduled_at,
                    duration_minutes,
                    location,
                    status,
                    outcome,
                    notes
                )
            `)
            .eq('id', prospectId)
            .eq('preselected_expert_id', expertId)
            .single();

        if (error || !prospect) {
            return res.status(404).json({ error: 'Prospect non trouvé ou non assigné' });
        }

        res.json({ success: true, data: prospect });
    } catch (error) {
        console.error('Erreur récupération prospect:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération du prospect' });
    }
});

// Accepter un prospect
router.post('/prospects/:prospectId/accept', async (req: any, res: any): Promise<void> => {
    try {
        const { prospectId } = req.params;
        const expertId = req.user!.expert_id;
        
        // Mettre à jour le statut du prospect
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        
        const { data: prospect, error: updateError } = await supabase
            .from('Prospect')
            .update({
                expert_response: 'accepted',
                expert_response_at: new Date().toISOString(),
                status: 'expert_assigned'
            })
            .eq('id', prospectId)
            .eq('preselected_expert_id', expertId)
            .select(`
                *,
                apporteur:ApporteurAffaires(id, first_name, last_name, company_name)
            `)
            .single();

        if (updateError || !prospect) {
            return res.status(404).json({ error: 'Prospect non trouvé ou non assigné' });
        }

        // Notifier l'apporteur
        await NotificationService.notifyProspectAccepted(prospectId, expertId);

        res.json({ 
            success: true, 
            data: prospect,
            message: 'Prospect accepté avec succès'
        });
    } catch (error) {
        console.error('Erreur acceptation prospect:', error);
        res.status(500).json({ error: 'Erreur lors de l\'acceptation du prospect' });
    }
});

// Décliner un prospect
router.post('/prospects/:prospectId/decline', async (req: any, res: any): Promise<void> => {
    try {
        const { prospectId } = req.params;
        const { reason } = req.body;
        const expertId = req.user!.expert_id;
        
        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({ error: 'Raison de la déclinaison requise' });
        }
        
        // Mettre à jour le statut du prospect
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        
        const { data: prospect, error: updateError } = await supabase
            .from('Prospect')
            .update({
                expert_response: 'declined',
                expert_response_at: new Date().toISOString(),
                status: 'expert_declined'
            })
            .eq('id', prospectId)
            .eq('preselected_expert_id', expertId)
            .select(`
                *,
                apporteur:ApporteurAffaires(id, first_name, last_name, company_name)
            `)
            .single();

        if (updateError || !prospect) {
            return res.status(404).json({ error: 'Prospect non trouvé ou non assigné' });
        }

        // Notifier l'apporteur
        await NotificationService.notifyProspectDeclined(prospectId, expertId, reason);

        res.json({ 
            success: true, 
            data: prospect,
            message: 'Prospect décliné avec succès'
        });
    } catch (error) {
        console.error('Erreur déclinaison prospect:', error);
        res.status(500).json({ error: 'Erreur lors de la déclinaison du prospect' });
    }
});

// ===== RENCONTRES =====
// Planifier une rencontre
router.post('/meetings', async (req: any, res: any): Promise<void> => {
    try {
        const expertId = req.user!.expert_id;
        const { prospect_id, meeting_type, scheduled_at, duration_minutes, location } = req.body;
        
        // Validation des données
        if (!prospect_id || !meeting_type || !scheduled_at) {
            return res.status(400).json({ error: 'Données de rencontre requises' });
        }
        
        // Vérifier que l'expert est assigné au prospect
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        
        const { data: prospect, error: prospectError } = await supabase
            .from('Prospect')
            .select('apporteur_id, preselected_expert_id')
            .eq('id', prospect_id)
            .eq('preselected_expert_id', expertId)
            .single();

        if (prospectError || !prospect) {
            return res.status(404).json({ error: 'Prospect non trouvé ou non assigné' });
        }

        // Créer la rencontre
        const { data: meeting, error: meetingError } = await supabase
            .from('ProspectMeeting')
            .insert({
                prospect_id,
                expert_id: expertId,
                apporteur_id: prospect.apporteur_id,
                meeting_type,
                scheduled_at,
                duration_minutes: duration_minutes || 60,
                location,
                status: 'scheduled'
            })
            .select(`
                *,
                prospect:Prospect(company_name, decision_maker_first_name, decision_maker_last_name),
                expert:Expert(name, email),
                apporteur:ApporteurAffaires(first_name, last_name, company_name)
            `)
            .single();

        if (meetingError) throw meetingError;

        // Mettre à jour le statut du prospect
        await supabase
            .from('Prospect')
            .update({ status: 'meeting_scheduled' })
            .eq('id', prospect_id);

        // Notifier l'apporteur
        await NotificationService.notifyMeetingScheduled(prospect_id, expertId, prospect.apporteur_id);

        res.status(201).json({ 
            success: true, 
            data: meeting,
            message: 'Rencontre planifiée avec succès'
        });
    } catch (error) {
        console.error('Erreur planification rencontre:', error);
        res.status(500).json({ error: 'Erreur lors de la planification de la rencontre' });
    }
});

// Récupérer les rencontres
router.get('/meetings', async (req: any, res: any): Promise<void> => {
    try {
        const expertId = req.user!.expert_id;
        const { status, page = 1, limit = 20 } = req.query;
        
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        
        let query = supabase
            .from('ProspectMeeting')
            .select(`
                *,
                prospect:Prospect(company_name, decision_maker_first_name, decision_maker_last_name),
                expert:Expert(name, email),
                apporteur:ApporteurAffaires(first_name, last_name, company_name)
            `)
            .eq('expert_id', expertId)
            .order('scheduled_at', { ascending: true })
            .range((Number(page) - 1) * Number(limit), Number(page) * Number(limit) - 1);

        if (status) {
            query = query.eq('status', status);
        }

        const { data: meetings, error, count } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data: meetings || [],
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: count || 0,
                total_pages: Math.ceil((count || 0) / Number(limit))
            }
        });
    } catch (error) {
        console.error('Erreur récupération rencontres:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des rencontres' });
    }
});

// Mettre à jour une rencontre
router.put('/meetings/:meetingId', checkMeetingOwnership as any, async (req: any, res: any): Promise<void> => {
    try {
        const { meetingId } = req.params;
        const updateData = req.body;
        
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        
        const { data: meeting, error } = await supabase
            .from('ProspectMeeting')
            .update({
                ...updateData,
                updated_at: new Date().toISOString()
            })
            .eq('id', meetingId)
            .select(`
                *,
                prospect:Prospect(company_name, decision_maker_first_name, decision_maker_last_name),
                expert:Expert(name, email),
                apporteur:ApporteurAffaires(first_name, last_name, company_name)
            `)
            .single();

        if (error) throw error;

        res.json({ success: true, data: meeting });
    } catch (error) {
        console.error('Erreur mise à jour rencontre:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de la rencontre' });
    }
});

export default router;
