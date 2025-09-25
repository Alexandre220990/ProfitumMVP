import { createClient } from '@supabase/supabase-js';
import { 
    ExpertNotificationData, 
    NotificationFilters, 
    ApiResponse 
} from '../types/apporteur';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

export class NotificationService {
    
    // ===== NOTIFICATIONS EXPERT =====
    static async getExpertNotifications(expertId: string, filters: NotificationFilters = {}): Promise<ApiResponse<ExpertNotificationData[]>> {
        try {
            const { page = 1, limit = 20, status, notification_type, priority } = filters;
            const offset = (page - 1) * limit;

            let query = supabase
                .from('ExpertNotification')
                .select(`
                    *,
                    prospect:Prospect(
                        id,
                        company_name,
                        decision_maker_first_name,
                        decision_maker_last_name,
                        decision_maker_email,
                        decision_maker_phone,
                        qualification_score,
                        interest_level,
                        budget_range,
                        timeline,
                        expert_note,
                        status
                    ),
                    apporteur:ApporteurAffaires(
                        id,
                        first_name,
                        last_name,
                        company_name
                    )
                `)
                .eq('expert_id', expertId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            // Filtres
            if (status) {
                query = query.eq('status', status);
            }

            if (notification_type) {
                query = query.eq('notification_type', notification_type);
            }

            if (priority) {
                query = query.eq('priority', priority);
            }

            const { data: notifications, error, count } = await query;

            if (error) throw error;

            return {
                success: true,
                data: notifications || [],
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    total_pages: Math.ceil((count || 0) / limit)
                }
            };

        } catch (error) {
            console.error('Erreur getExpertNotifications:', error);
            return {
                success: false,
                error: 'Erreur lors de la récupération des notifications'
            };
        }
    }

    // ===== MARQUER NOTIFICATION COMME LUE =====
    static async markNotificationAsRead(notificationId: string, expertId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('ExpertNotification')
                .update({
                    status: 'read',
                    read_at: new Date().toISOString()
                })
                .eq('id', notificationId)
                .eq('expert_id', expertId);

            if (error) throw error;

        } catch (error) {
            console.error('Erreur markNotificationAsRead:', error);
            throw new Error('Erreur lors du marquage de la notification');
        }
    }

    // ===== MARQUER NOTIFICATION COMME AGIE =====
    static async markNotificationAsActed(notificationId: string, expertId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('ExpertNotification')
                .update({
                    status: 'acted',
                    acted_at: new Date().toISOString()
                })
                .eq('id', notificationId)
                .eq('expert_id', expertId);

            if (error) throw error;

        } catch (error) {
            console.error('Erreur markNotificationAsActed:', error);
            throw new Error('Erreur lors du marquage de la notification');
        }
    }

    // ===== CRÉER NOTIFICATION =====
    static async createNotification(
        expertId: string,
        prospectId: string,
        apporteurId: string,
        type: string,
        title: string,
        message: string,
        priority: string = 'medium'
    ): Promise<{ success: boolean; notification_id?: string }> {
        try {
            const { data: notification, error } = await supabase
                .from('ExpertNotification')
                .insert({
                    expert_id: expertId,
                    prospect_id: prospectId,
                    apporteur_id: apporteurId,
                    notification_type: type,
                    title,
                    message,
                    priority
                })
                .select('id')
                .single();

            if (error) throw error;

            return {
                success: true,
                notification_id: notification.id
            };

        } catch (error) {
            console.error('Erreur createNotification:', error);
            return {
                success: false
            };
        }
    }

    // ===== NOTIFIER NOUVEAU PROSPECT =====
    static async notifyExpertNewProspect(expertId: string, prospectId: string, apporteurId: string): Promise<{ success: boolean; notification_id?: string }> {
        try {
            // Récupérer les données du prospect
            const { data: prospect, error: prospectError } = await supabase
                .from('Prospect')
                .select('company_name, decision_maker_first_name, decision_maker_last_name, expert_note')
                .eq('id', prospectId)
                .single();

            if (prospectError || !prospect) {
                throw new Error('Prospect non trouvé');
            }

            // Récupérer les données de l'apporteur
            const { data: apporteur, error: apporteurError } = await supabase
                .from('ApporteurAffaires')
                .select('first_name, last_name, company_name')
                .eq('id', apporteurId)
                .single();

            if (apporteurError || !apporteur) {
                throw new Error('Apporteur non trouvé');
            }

            const title = 'Nouveau prospect présélectionné pour vous';
            const message = `Un nouveau prospect chaud vous a été assigné par ${apporteur.first_name} ${apporteur.last_name} (${apporteur.company_name}).

Prospect: ${prospect.company_name}
Décisionnaire: ${prospect.decision_maker_first_name} ${prospect.decision_maker_last_name}
${prospect.expert_note ? `Note: ${prospect.expert_note}` : ''}

Voulez-vous accepter ce prospect ?`;

            return await this.createNotification(
                expertId,
                prospectId,
                apporteurId,
                'prospect_preselected',
                title,
                message,
                'high'
            );

        } catch (error) {
            console.error('Erreur notifyExpertNewProspect:', error);
            return {
                success: false
            };
        }
    }

    // ===== NOTIFIER ACCEPTATION PROSPECT =====
    static async notifyProspectAccepted(prospectId: string, expertId: string): Promise<{ success: boolean }> {
        try {
            // Récupérer les données du prospect et de l'apporteur
            const { data: prospect, error: prospectError } = await supabase
                .from('Prospect')
                .select(`
                    apporteur_id,
                    apporteur:ApporteurAffaires(first_name, last_name, email)
                `)
                .eq('id', prospectId)
                .single();

            if (prospectError || !prospect) {
                throw new Error('Prospect non trouvé');
            }

            // Créer notification pour l'apporteur
            const { error: notificationError } = await supabase
                .from('ExpertNotification')
                .insert({
                    expert_id: prospect.apporteur_id, // L'apporteur recevra la notification
                    prospect_id: prospectId,
                    apporteur_id: prospect.apporteur_id,
                    notification_type: 'prospect_accepted',
                    title: 'Prospect accepté par l\'expert',
                    message: `L'expert a accepté votre prospect. Vous pouvez maintenant planifier une rencontre.`,
                    priority: 'medium'
                });

            if (notificationError) throw notificationError;

            return { success: true };

        } catch (error) {
            console.error('Erreur notifyProspectAccepted:', error);
            return { success: false };
        }
    }

    // ===== NOTIFIER DÉCLINAISON PROSPECT =====
    static async notifyProspectDeclined(prospectId: string, expertId: string, reason: string): Promise<{ success: boolean }> {
        try {
            // Récupérer les données du prospect et de l'apporteur
            const { data: prospect, error: prospectError } = await supabase
                .from('Prospect')
                .select(`
                    apporteur_id,
                    apporteur:ApporteurAffaires(first_name, last_name, email)
                `)
                .eq('id', prospectId)
                .single();

            if (prospectError || !prospect) {
                throw new Error('Prospect non trouvé');
            }

            // Créer notification pour l'apporteur
            const { error: notificationError } = await supabase
                .from('ExpertNotification')
                .insert({
                    expert_id: prospect.apporteur_id, // L'apporteur recevra la notification
                    prospect_id: prospectId,
                    apporteur_id: prospect.apporteur_id,
                    notification_type: 'prospect_declined',
                    title: 'Prospect décliné par l\'expert',
                    message: `L'expert a décliné votre prospect. Raison: ${reason}`,
                    priority: 'medium'
                });

            if (notificationError) throw notificationError;

            return { success: true };

        } catch (error) {
            console.error('Erreur notifyProspectDeclined:', error);
            return { success: false };
        }
    }

    // ===== NOTIFIER RENCONTRE PLANIFIÉE =====
    static async notifyMeetingScheduled(prospectId: string, expertId: string, apporteurId: string): Promise<{ success: boolean }> {
        try {
            // Récupérer les données nécessaires
            const { data: prospect, error: prospectError } = await supabase
                .from('Prospect')
                .select(`
                    company_name,
                    decision_maker_first_name,
                    decision_maker_last_name,
                    apporteur:ApporteurAffaires(first_name, last_name)
                `)
                .eq('id', prospectId)
                .single();

            if (prospectError || !prospect) {
                throw new Error('Prospect non trouvé');
            }

            // Notifier l'apporteur
            const { error: apporteurNotificationError } = await supabase
                .from('ExpertNotification')
                .insert({
                    expert_id: apporteurId, // L'apporteur recevra la notification
                    prospect_id: prospectId,
                    apporteur_id: apporteurId,
                    notification_type: 'meeting_scheduled',
                    title: 'Rencontre planifiée',
                    message: `Une rencontre a été planifiée pour le prospect ${prospect.company_name} (${prospect.decision_maker_first_name} ${prospect.decision_maker_last_name}).`,
                    priority: 'medium'
                });

            if (apporteurNotificationError) throw apporteurNotificationError;

            return { success: true };

        } catch (error) {
            console.error('Erreur notifyMeetingScheduled:', error);
            return { success: false };
        }
    }

    // ===== NETTOYAGE NOTIFICATIONS EXPIRÉES =====
    static async cleanupExpiredNotifications(): Promise<{ success: boolean; deleted_count: number }> {
        try {
            const { data, error } = await supabase
                .from('ExpertNotification')
                .delete()
                .lt('expires_at', new Date().toISOString())
                .select('id');

            if (error) throw error;

            return {
                success: true,
                deleted_count: data?.length || 0
            };

        } catch (error) {
            console.error('Erreur cleanupExpiredNotifications:', error);
            return {
                success: false,
                deleted_count: 0
            };
        }
    }

    // ===== STATISTIQUES NOTIFICATIONS =====
    static async getNotificationStats(expertId: string): Promise<{
        total: number;
        unread: number;
        by_type: Record<string, number>;
        by_priority: Record<string, number>;
    }> {
        try {
            const { data: notifications, error } = await supabase
                .from('ExpertNotification')
                .select('status, notification_type, priority')
                .eq('expert_id', expertId);

            if (error) throw error;

            const total = notifications.length;
            const unread = notifications.filter(n => n.status === 'unread').length;

            const by_type = notifications.reduce((acc, notif) => {
                acc[notif.notification_type] = (acc[notif.notification_type] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const by_priority = notifications.reduce((acc, notif) => {
                acc[notif.priority] = (acc[notif.priority] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            return {
                total,
                unread,
                by_type,
                by_priority
            };

        } catch (error) {
            console.error('Erreur getNotificationStats:', error);
            throw new Error('Erreur lors de la récupération des statistiques');
        }
    }
}