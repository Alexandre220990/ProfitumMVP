import { SupabaseClient } from '@supabase/supabase-js';

export interface AssignmentData {
    expert_id: string;
    client_id: string;
    produit_id?: string;
    message?: string;
    preferred_date?: string;
    budget?: number;
}

export interface AssignmentUpdateData {
    status?: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
    client_rating?: number;
    client_feedback?: string;
    expert_rating?: number;
    expert_feedback?: string;
    compensation_amount?: number;
    compensation_status?: 'pending' | 'paid' | 'cancelled';
    notes?: string;
}

export interface AssignmentStats {
    total: number;
    pending: number;
    accepted: number;
    completed: number;
    cancelled: number;
    avgRating: number;
    totalRevenue: number;
}

export class AssignmentService {
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    /**
     * Créer une nouvelle assignation
     */
    async createAssignment(data: AssignmentData): Promise<any> {
        try {
            // Vérifier que l'expert est disponible
            const { data: expert, error: expertError } = await this.supabase
                .from('Expert')
                .select('id, status, approval_status, disponibilites')
                .eq('id', data.expert_id)
                .eq('status', 'active')
                .eq('approval_status', 'approved')
                .single();

            if (expertError || !expert) {
                throw new Error('Expert non trouvé ou non disponible');
            }

            // Vérifier la disponibilité
            if (expert.disponibilites && !expert.disponibilites.available) {
                throw new Error('Expert non disponible actuellement');
            }

            // Vérifier le produit si spécifié
            if (data.produit_id) {
                const { data: produit, error: produitError } = await this.supabase
                    .from('ProduitEligible')
                    .select('id')
                    .eq('id', data.produit_id)
                    .single();

                if (produitError || !produit) {
                    throw new Error('Produit non valide');
                }
            }

            // Créer l'assignation
            const { data: assignment, error: assignmentError } = await this.supabase
                .from('ExpertAssignment')
                .insert({
                    expert_id: data.expert_id,
                    client_id: data.client_id,
                    produit_id: data.produit_id,
                    status: 'pending',
                    notes: data.message,
                    compensation_amount: data.budget
                })
                .select(`
                    *,
                    Expert!inner(name, company_name, email),
                    Client!inner(name, company_name),
                    ProduitEligible(*)
                `)
                .single();

            if (assignmentError) {
                throw new Error(`Erreur création assignation: ${assignmentError.message}`);
            }

            // Créer une notification pour l'expert
            await this.createNotification({
                user_id: data.expert_id,
                user_type: 'expert',
                title: 'Nouvelle demande d\'assignation',
                message: `Un client souhaite vous contacter pour une prestation.`,
                notification_type: 'assignment',
                priority: 'high',
                action_url: `/expert/assignments/${assignment.id}`,
                action_data: { assignment_id: assignment.id }
            });

            // Créer un log d'accès
            await this.createAccessLog({
                expert_id: data.expert_id,
                action: 'assignment_created',
                resource_type: 'assignment',
                resource_id: assignment.id,
                success: true
            });

            return assignment;

        } catch (error) {
            console.error('Erreur création assignation:', error);
            throw error;
        }
    }

    /**
     * Mettre à jour le statut d'une assignation
     */
    async updateAssignmentStatus(assignmentId: string, userId: string, status: string, feedback?: string): Promise<any> {
        try {
            // Récupérer l'assignation avec les permissions
            const { data: assignment, error: assignmentError } = await this.supabase
                .from('ExpertAssignment')
                .select(`
                    *,
                    Expert!inner(auth_user_id, name, email),
                    Client!inner(auth_user_id, name, email)
                `)
                .eq('id', assignmentId)
                .single();

            if (assignmentError || !assignment) {
                throw new Error('Assignation non trouvée');
            }

            // Vérifier les permissions
            const isExpert = assignment.Expert.auth_user_id === userId;
            const isClient = assignment.Client.auth_user_id === userId;

            if (!isExpert && !isClient) {
                throw new Error('Accès non autorisé');
            }

            // Vérifier les transitions autorisées
            const allowedTransitions = this.getAllowedStatusTransitions(assignment.status, isExpert ? 'expert' : 'client');
            if (!allowedTransitions.includes(status)) {
                throw new Error(`Transition non autorisée: ${assignment.status} -> ${status}`);
            }

            // Préparer les données de mise à jour
            const updateData: any = { status };

            if (status === 'accepted') {
                updateData.accepted_date = new Date().toISOString();
            } else if (status === 'completed') {
                updateData.completed_date = new Date().toISOString();
            }

            // Ajouter le feedback
            if (feedback) {
                if (isExpert) {
                    updateData.expert_feedback = feedback;
                } else {
                    updateData.client_feedback = feedback;
                }
            }

            // Mettre à jour l'assignation
            const { data: updatedAssignment, error: updateError } = await this.supabase
                .from('ExpertAssignment')
                .update(updateData)
                .eq('id', assignmentId)
                .select()
                .single();

            if (updateError) {
                throw new Error(`Erreur mise à jour: ${updateError.message}`);
            }

            // Créer une notification pour l'autre partie
            const notificationData = {
                user_id: isExpert ? assignment.Client.auth_user_id : assignment.Expert.auth_user_id,
                user_type: isExpert ? 'client' : 'expert',
                title: `Assignation ${status}`,
                message: `Votre assignation a été ${this.getStatusLabel(status)}.`,
                notification_type: 'assignment',
                priority: 'medium',
                action_url: `/assignments/${assignmentId}`,
                action_data: { assignment_id: assignmentId, status }
            };

            await this.createNotification(notificationData);

            // Mettre à jour les statistiques si terminée
            if (status === 'completed') {
                await this.updateExpertStats(assignment.expert_id);
            }

            return updatedAssignment;

        } catch (error) {
            console.error('Erreur mise à jour statut:', error);
            throw error;
        }
    }

    /**
     * Noter une assignation
     */
    async rateAssignment(assignmentId: string, userId: string, rating: number, feedback?: string): Promise<any> {
        try {
            // Validation de la note
            if (rating < 1 || rating > 5) {
                throw new Error('Note invalide (doit être entre 1 et 5)');
            }

            // Récupérer l'assignation
            const { data: assignment, error: assignmentError } = await this.supabase
                .from('ExpertAssignment')
                .select(`
                    *,
                    Expert!inner(auth_user_id),
                    Client!inner(auth_user_id)
                `)
                .eq('id', assignmentId)
                .eq('status', 'completed')
                .single();

            if (assignmentError || !assignment) {
                throw new Error('Assignation non trouvée ou non terminée');
            }

            // Vérifier les permissions
            const isExpert = assignment.Expert.auth_user_id === userId;
            const isClient = assignment.Client.auth_user_id === userId;

            if (!isExpert && !isClient) {
                throw new Error('Accès non autorisé');
            }

            // Préparer les données de mise à jour
            const updateData: any = {};
            if (isExpert) {
                updateData.expert_rating = rating;
                if (feedback) updateData.expert_feedback = feedback;
            } else {
                updateData.client_rating = rating;
                if (feedback) updateData.client_feedback = feedback;
            }

            // Mettre à jour l'assignation
            const { data: updatedAssignment, error: updateError } = await this.supabase
                .from('ExpertAssignment')
                .update(updateData)
                .eq('id', assignmentId)
                .select()
                .single();

            if (updateError) {
                throw new Error(`Erreur notation: ${updateError.message}`);
            }

            // Mettre à jour la note moyenne de l'expert si c'est une note client
            if (isClient) {
                await this.updateExpertRating(assignment.expert_id);
            }

            return updatedAssignment;

        } catch (error) {
            console.error('Erreur notation:', error);
            throw error;
        }
    }

    /**
     * Obtenir les statistiques d'assignation pour un utilisateur
     */
    async getAssignmentStats(userId: string, userType: 'expert' | 'client'): Promise<AssignmentStats> {
        try {
            const { data: assignments, error } = await this.supabase
                .from('ExpertAssignment')
                .select('status, client_rating, expert_rating, compensation_amount')
                .eq(userType === 'expert' ? 'expert_id' : 'client_id', userId);

            if (error) {
                throw new Error(`Erreur récupération stats: ${error.message}`);
            }

            const stats: AssignmentStats = {
                total: assignments?.length || 0,
                pending: assignments?.filter(a => a.status === 'pending').length || 0,
                accepted: assignments?.filter(a => a.status === 'accepted').length || 0,
                completed: assignments?.filter(a => a.status === 'completed').length || 0,
                cancelled: assignments?.filter(a => a.status === 'cancelled').length || 0,
                avgRating: 0,
                totalRevenue: 0
            };

            // Calculer la note moyenne
            const ratings = assignments?.map(a => 
                userType === 'expert' ? a.expert_rating : a.client_rating
            ).filter(r => r !== null) || [];

            if (ratings.length > 0) {
                stats.avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
            }

            // Calculer le revenu total (pour les experts)
            if (userType === 'expert') {
                const completedAssignments = assignments?.filter(a => a.status === 'completed') || [];
                stats.totalRevenue = completedAssignments.reduce((sum, a) => sum + (a.compensation_amount || 0), 0);
            }

            return stats;

        } catch (error) {
            console.error('Erreur stats assignation:', error);
            throw error;
        }
    }

    /**
     * Obtenir les transitions de statut autorisées
     */
    private getAllowedStatusTransitions(currentStatus: string, userType: 'expert' | 'client'): string[] {
        const transitions: Record<string, Record<string, string[]>> = {
            expert: {
                pending: ['accepted', 'rejected'],
                accepted: ['completed'],
                completed: []
            },
            client: {
                pending: ['cancelled'],
                accepted: ['cancelled'],
                completed: []
            }
        };

        return transitions[userType]?.[currentStatus] || [];
    }

    /**
     * Obtenir le libellé d'un statut
     */
    private getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            pending: 'en attente',
            accepted: 'acceptée',
            rejected: 'rejetée',
            completed: 'terminée',
            cancelled: 'annulée'
        };

        return labels[status] || status;
    }

    /**
     * Créer une notification
     */
    private async createNotification(data: any): Promise<void> {
        try {
            await this.supabase
                .from('notification')
                .insert(data);
        } catch (error) {
            console.error('Erreur création notification:', error);
        }
    }

    /**
     * Créer un log d'accès
     */
    private async createAccessLog(data: any): Promise<void> {
        try {
            await this.supabase
                .from('ExpertAccessLog')
                .insert(data);
        } catch (error) {
            console.error('Erreur création log accès:', error);
        }
    }

    /**
     * Mettre à jour les statistiques d'un expert
     */
    private async updateExpertStats(expertId: string): Promise<void> {
        try {
            const { data: stats, error } = await this.supabase
                .from('ExpertAssignment')
                .select('client_rating, status')
                .eq('expert_id', expertId);

            if (error || !stats) return;

            const completedAssignments = stats.filter(s => s.status === 'completed');
            const ratings = completedAssignments.map(s => s.client_rating).filter(r => r !== null);

            if (ratings.length > 0) {
                const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
                
                await this.supabase
                    .from('Expert')
                    .update({ rating: Math.round(avgRating * 10) / 10 })
                    .eq('id', expertId);
            }
        } catch (error) {
            console.error('Erreur mise à jour stats expert:', error);
        }
    }

    /**
     * Mettre à jour la note d'un expert
     */
    private async updateExpertRating(expertId: string): Promise<void> {
        try {
            const { data: ratings, error } = await this.supabase
                .from('ExpertAssignment')
                .select('client_rating')
                .eq('expert_id', expertId)
                .not('client_rating', 'is', null);

            if (error || !ratings || ratings.length === 0) return;

            const avgRating = ratings.reduce((sum, r) => sum + (r.client_rating || 0), 0) / ratings.length;
            
            await this.supabase
                .from('Expert')
                .update({ rating: Math.round(avgRating * 10) / 10 })
                .eq('id', expertId);
        } catch (error) {
            console.error('Erreur mise à jour note expert:', error);
        }
    }
} 