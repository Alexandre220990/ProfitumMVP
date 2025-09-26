import { createClient } from '@supabase/supabase-js';
import { 
    ApporteurDashboard, 
    ApporteurStats, 
    ExpertData, 
    CommissionData, 
    PaginationParams,
    CommissionFilters,
    ApiResponse 
} from '../types/apporteur';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

export class ApporteurService {
    
    // ===== DASHBOARD =====
    static async getDashboard(apporteurId: string): Promise<ApporteurDashboard> {
        try {
            // Métriques prospects
            const { data: prospects, error: prospectsError } = await supabase
                .from('Prospect')
                .select('status, qualification_score, created_at, preselected_expert_id')
                .eq('apporteur_id', apporteurId);

            if (prospectsError) throw prospectsError;

            // Métriques expert
            const { data: meetings, error: meetingsError } = await supabase
                .from('ProspectMeeting')
                .select('status, expert_id')
                .eq('apporteur_id', apporteurId);

            if (meetingsError) throw meetingsError;

            // Métriques commissions
            const { data: commissions, error: commissionsError } = await supabase
                .from('ApporteurCommission')
                .select('status, commission_amount')
                .eq('apporteur_id', apporteurId);

            if (commissionsError) throw commissionsError;

            // Calculs des métriques
            const totalProspects = prospects.length;
            const qualifiedProspects = prospects.filter(p => p.status === 'qualified').length;
            const expertAssignedProspects = prospects.filter(p => p.status === 'expert_assigned').length;
            const meetingScheduledProspects = prospects.filter(p => p.status === 'meeting_scheduled').length;
            const meetingCompletedProspects = prospects.filter(p => p.status === 'meeting_completed').length;
            const convertedProspects = prospects.filter(p => p.status === 'converted').length;
            const lostProspects = prospects.filter(p => p.status === 'lost').length;
            const conversionRate = totalProspects > 0 ? (convertedProspects / totalProspects) * 100 : 0;

            const expertsContacted = new Set(prospects.filter(p => p.preselected_expert_id).map(p => p.preselected_expert_id)).size;
            const meetingsScheduled = meetings.filter(m => m.status === 'scheduled').length;
            const meetingsCompleted = meetings.filter(m => m.status === 'completed').length;

            const pendingCommissions = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0);
            const confirmedCommissions = commissions.filter(c => c.status === 'confirmed').reduce((sum, c) => sum + c.commission_amount, 0);
            const paidCommissions = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commission_amount, 0);
            const totalEarnings = paidCommissions;

            // Pipeline
            const prospectsByStatus = {
                qualified: qualifiedProspects,
                expert_assigned: expertAssignedProspects,
                meeting_scheduled: meetingScheduledProspects,
                meeting_completed: meetingCompletedProspects,
                converted: convertedProspects,
                lost: lostProspects
            };

            // Performance
            const avgQualificationScore = prospects.length > 0 
                ? prospects.reduce((sum, p) => sum + p.qualification_score, 0) / prospects.length 
                : 0;

            // Top experts (simulation - à implémenter avec vraies données)
            const topExperts: Array<{
                expert_id: string;
                expert_name: string;
                prospects_count: number;
                conversion_rate: number;
            }> = [];

            return {
                total_prospects: totalProspects,
                qualified_prospects: qualifiedProspects,
                expert_assigned_prospects: expertAssignedProspects,
                meeting_scheduled_prospects: meetingScheduledProspects,
                meeting_completed_prospects: meetingCompletedProspects,
                converted_prospects: convertedProspects,
                lost_prospects: lostProspects,
                conversion_rate: Math.round(conversionRate * 100) / 100,
                experts_contacted: expertsContacted,
                experts_accepted: 0, // À calculer
                experts_declined: 0, // À calculer
                meetings_scheduled: meetingsScheduled,
                meetings_completed: meetingsCompleted,
                pending_commissions: pendingCommissions,
                confirmed_commissions: confirmedCommissions,
                paid_commissions: paidCommissions,
                total_earnings: totalEarnings,
                prospects_by_status: prospectsByStatus,
                avg_qualification_score: Math.round(avgQualificationScore * 100) / 100,
                avg_conversion_time: 0, // À calculer
                top_experts: topExperts
            };

        } catch (error) {
            console.error('Erreur getDashboard:', error);
            throw new Error('Erreur lors du chargement du dashboard');
        }
    }

    // ===== STATISTIQUES =====
    static async getStats(apporteurId: string, period: string = '30d'): Promise<ApporteurStats> {
        try {
            const dateFrom = this.getDateFromPeriod(period);
            
            const { data: prospects, error: prospectsError } = await supabase
                .from('Prospect')
                .select('status, source, created_at, qualification_score')
                .eq('apporteur_id', apporteurId)
                .gte('created_at', dateFrom);

            if (prospectsError) throw prospectsError;

            const { data: commissions, error: commissionsError } = await supabase
                .from('ApporteurCommission')
                .select('commission_amount, status')
                .eq('apporteur_id', apporteurId)
                .gte('created_at', dateFrom);

            if (commissionsError) throw commissionsError;

            const totalProspects = prospects.length;
            const convertedProspects = prospects.filter(p => p.status === 'converted').length;
            const conversionRate = totalProspects > 0 ? (convertedProspects / totalProspects) * 100 : 0;
            const totalCommissions = commissions.reduce((sum, c) => sum + c.commission_amount, 0);
            const avgCommissionPerProspect = convertedProspects > 0 ? totalCommissions / convertedProspects : 0;

            // Prospects par source
            const prospectsBySource = prospects.reduce((acc, prospect) => {
                const source = prospect.source || 'other';
                if (!acc[source]) {
                    acc[source] = { count: 0, conversions: 0 };
                }
                acc[source].count++;
                if (prospect.status === 'converted') {
                    acc[source].conversions++;
                }
                return acc;
            }, {} as Record<string, { count: number; conversions: number }>);

            const prospectsBySourceArray = Object.entries(prospectsBySource).map(([source, data]) => ({
                source,
                count: data.count,
                conversion_rate: data.count > 0 ? (data.conversions / data.count) * 100 : 0
            }));

            return {
                period,
                total_prospects: totalProspects,
                converted_prospects: convertedProspects,
                conversion_rate: Math.round(conversionRate * 100) / 100,
                total_commissions: totalCommissions,
                avg_commission_per_prospect: Math.round(avgCommissionPerProspect * 100) / 100,
                top_performing_experts: [], // À implémenter
                prospects_by_source: prospectsBySourceArray,
                prospects_by_month: [] // À implémenter
            };

        } catch (error) {
            console.error('Erreur getStats:', error);
            throw new Error('Erreur lors du chargement des statistiques');
        }
    }

    // ===== EXPERTS DISPONIBLES =====
    static async getAvailableExperts(filters: { specialization?: string; location?: string } = {}): Promise<ExpertData[]> {
        try {
            let query = supabase
                .from('Expert')
                .select('id, name, email, phone, company_name, specializations, location, rating, total_assignments, completed_assignments, status, created_at')
                .eq('status', 'active');

            if (filters.specialization) {
                query = query.contains('specializations', [filters.specialization]);
            }

            if (filters.location) {
                query = query.ilike('location', `%${filters.location}%`);
            }

            const { data: experts, error } = await query.order('rating', { ascending: false });

            if (error) throw error;

            return experts.map(expert => ({
                ...expert,
                success_rate: expert.total_assignments > 0 
                    ? (expert.completed_assignments / expert.total_assignments) * 100 
                    : 0
            }));

        } catch (error) {
            console.error('Erreur getAvailableExperts:', error);
            throw new Error('Erreur lors de la récupération des experts');
        }
    }

    // ===== COMMISSIONS =====
    static async getCommissions(apporteurId: string, filters: CommissionFilters = {}): Promise<ApiResponse<CommissionData[]>> {
        try {
            const { page = 1, limit = 20, status, date_from, date_to } = filters;
            const offset = (page - 1) * limit;

            let query = supabase
                .from('ApporteurCommission')
                .select(`
                    *,
                    prospect:Prospect(*),
                    client_produit_eligible:ClientProduitEligible(*)
                `)
                .eq('apporteur_id', apporteurId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (status) {
                query = query.eq('status', status);
            }

            if (date_from) {
                query = query.gte('created_at', date_from);
            }

            if (date_to) {
                query = query.lte('created_at', date_to);
            }

            const { data: commissions, error, count } = await query;

            if (error) throw error;

            return {
                success: true,
                data: commissions || [],
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    total_pages: Math.ceil((count || 0) / limit)
                }
            };

        } catch (error) {
            console.error('Erreur getCommissions:', error);
            return {
                success: false,
                error: 'Erreur lors de la récupération des commissions'
            };
        }
    }

    // ===== UTILITAIRES =====
    private static getDateFromPeriod(period: string): string {
        const now = new Date();
        switch (period) {
            case '7d':
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
            case '30d':
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
            case '90d':
                return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
            case '1y':
                return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
            default:
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        }
    }

    // ===== VALIDATION =====
    static validateProspectData(data: any): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!data.company_name || data.company_name.trim().length === 0) {
            errors.push('Le nom de l\'entreprise est requis');
        }

        if (!data.decision_maker_first_name || data.decision_maker_first_name.trim().length === 0) {
            errors.push('Le prénom du décisionnaire est requis');
        }

        if (!data.decision_maker_last_name || data.decision_maker_last_name.trim().length === 0) {
            errors.push('Le nom du décisionnaire est requis');
        }

        if (!data.decision_maker_email || !this.isValidEmail(data.decision_maker_email)) {
            errors.push('L\'email du décisionnaire est requis et doit être valide');
        }

        if (!data.decision_maker_phone || data.decision_maker_phone.trim().length === 0) {
            errors.push('Le téléphone du décisionnaire est requis');
        }

        if (data.qualification_score && (data.qualification_score < 1 || data.qualification_score > 10)) {
            errors.push('Le score de qualification doit être entre 1 et 10');
        }

        if (data.siren && !this.isValidSiren(data.siren)) {
            errors.push('Le SIREN doit contenir exactement 9 chiffres');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    private static isValidEmail(email: string): boolean {
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        return emailRegex.test(email);
    }

    private static isValidSiren(siren: string): boolean {
        const sirenRegex = /^[0-9]{9}$/;
        return sirenRegex.test(siren);
    }
}
