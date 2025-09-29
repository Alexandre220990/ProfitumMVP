import { createClient } from '@supabase/supabase-js';
import { 
    ProspectFormData, 
    ProspectResponse, 
    ProspectFilters, 
    ApiResponse,
    CreateProspectResponse 
} from '../types/apporteur';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export class ProspectService {
    
    // ===== CRÉATION PROSPECT =====
    static async createProspect(apporteurId: string, prospectData: ProspectFormData): Promise<CreateProspectResponse> {
        try {
            // Validation des données
            const validation = this.validateProspectData(prospectData);
            if (!validation.isValid) {
                throw new Error(`Données invalides: ${validation.errors.join(', ')}`);
            }

            // Créer le prospect
            const { data: prospect, error } = await supabase
                .from('Prospect')
                .insert({
                    apporteur_id: apporteurId,
                    company_name: prospectData.company_name,
                    siren: prospectData.siren,
                    address: prospectData.address,
                    website: prospectData.website,
                    decision_maker_first_name: prospectData.decision_maker_first_name,
                    decision_maker_last_name: prospectData.decision_maker_last_name,
                    decision_maker_email: prospectData.decision_maker_email,
                    decision_maker_phone: prospectData.decision_maker_phone,
                    decision_maker_position: prospectData.decision_maker_position,
                    qualification_score: prospectData.qualification_score,
                    interest_level: prospectData.interest_level,
                    budget_range: prospectData.budget_range,
                    timeline: prospectData.timeline,
                    preselected_expert_id: prospectData.preselected_expert_id,
                    expert_selection_reason: prospectData.expert_selection_reason,
                    expert_note: prospectData.expert_note,
                    source: prospectData.source,
                    notes: prospectData.notes,
                    status: 'qualified'
                })
                .select(`
                    *,
                    expert:Expert(id, name, email, specializations),
                    apporteur:ApporteurAffaires(id, first_name, last_name, company_name)
                `)
                .single();

            if (error) throw error;

            // Si expert présélectionné, créer notification
            let notificationSent = false;
            if (prospectData.preselected_expert_id) {
                const notificationResult = await this.notifyExpertNewProspect(
                    prospectData.preselected_expert_id,
                    prospect.id,
                    apporteurId
                );
                notificationSent = notificationResult.success;
            }

            return {
                prospect,
                notification_sent: notificationSent,
                expert_notified: !!prospectData.preselected_expert_id
            };

        } catch (error) {
            console.error('Erreur createProspect:', error);
            throw new Error('Erreur lors de la création du prospect');
        }
    }

    // ===== RÉCUPÉRATION PROSPECTS =====
    static async getProspects(apporteurId: string, filters: ProspectFilters = {}): Promise<ApiResponse<ProspectResponse[]>> {
        try {
            const { page = 1, limit = 20, status, interest_level, budget_range, timeline, expert_id, source, date_from, date_to } = filters;
            const offset = (page - 1) * limit;

            let query = supabase
                .from('Prospect')
                .select(`
                    *,
                    expert:Expert(id, name, email, specializations),
                    apporteur:ApporteurAffaires(id, first_name, last_name, company_name)
                `)
                .eq('apporteur_id', apporteurId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            // Filtres
            if (status) {
                query = query.eq('status', status);
            }

            if (interest_level) {
                query = query.eq('interest_level', interest_level);
            }

            if (budget_range) {
                query = query.eq('budget_range', budget_range);
            }

            if (timeline) {
                query = query.eq('timeline', timeline);
            }

            if (expert_id) {
                query = query.eq('preselected_expert_id', expert_id);
            }

            if (source) {
                query = query.eq('source', source);
            }

            if (date_from) {
                query = query.gte('created_at', date_from);
            }

            if (date_to) {
                query = query.lte('created_at', date_to);
            }

            const { data: prospects, error, count } = await query;

            if (error) throw error;

            return {
                success: true,
                data: prospects || [],
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    total_pages: Math.ceil((count || 0) / limit)
                }
            };

        } catch (error) {
            console.error('Erreur getProspects:', error);
            return {
                success: false,
                error: 'Erreur lors de la récupération des prospects'
            };
        }
    }

    // ===== DÉTAILS PROSPECT =====
    static async getProspectById(prospectId: string): Promise<ProspectResponse> {
        try {
            const { data: prospect, error } = await supabase
                .from('Prospect')
                .select(`
                    *,
                    expert:Expert(id, name, email, specializations, phone, company_name),
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
                .single();

            if (error) throw error;
            if (!prospect) throw new Error('Prospect non trouvé');

            return prospect;

        } catch (error) {
            console.error('Erreur getProspectById:', error);
            throw new Error('Erreur lors de la récupération du prospect');
        }
    }

    // ===== MISE À JOUR PROSPECT =====
    static async updateProspect(prospectId: string, updateData: Partial<ProspectFormData>): Promise<ProspectResponse> {
        try {
            // Validation des données si présentes
            if (Object.keys(updateData).length > 0) {
                const validation = this.validateProspectData(updateData);
                if (!validation.isValid) {
                    throw new Error(`Données invalides: ${validation.errors.join(', ')}`);
                }
            }

            const { data: prospect, error } = await supabase
                .from('Prospect')
                .update({
                    ...updateData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', prospectId)
                .select(`
                    *,
                    expert:Expert(id, name, email, specializations),
                    apporteur:ApporteurAffaires(id, first_name, last_name, company_name)
                `)
                .single();

            if (error) throw error;
            if (!prospect) throw new Error('Prospect non trouvé');

            return prospect;

        } catch (error) {
            console.error('Erreur updateProspect:', error);
            throw new Error('Erreur lors de la mise à jour du prospect');
        }
    }

    // ===== SUPPRESSION PROSPECT =====
    static async deleteProspect(prospectId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('Prospect')
                .delete()
                .eq('id', prospectId);

            if (error) throw error;

        } catch (error) {
            console.error('Erreur deleteProspect:', error);
            throw new Error('Erreur lors de la suppression du prospect');
        }
    }

    // ===== CONVERSION PROSPECT → CLIENT =====
    static async convertProspectToClient(prospectId: string, apporteurId: string): Promise<{ client_id: string; prospect_id: string }> {
        try {
            // Vérifier que le prospect appartient à l'apporteur
            const { data: prospect, error: prospectError } = await supabase
                .from('Prospect')
                .select('*')
                .eq('id', prospectId)
                .eq('apporteur_id', apporteurId)
                .single();

            if (prospectError || !prospect) {
                throw new Error('Prospect non trouvé ou non autorisé');
            }

            // Créer le client
            const { data: client, error: clientError } = await supabase
                .from('Client')
                .insert({
                    name: `${prospect.decision_maker_first_name} ${prospect.decision_maker_last_name}`,
                    email: prospect.decision_maker_email,
                    phone: prospect.decision_maker_phone,
                    company_name: prospect.company_name,
                    siren: prospect.siren,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select('id')
                .single();

            if (clientError) throw clientError;

            // Enregistrer la conversion
            const { error: conversionError } = await supabase
                .from('ProspectConversion')
                .insert({
                    prospect_id: prospectId,
                    client_id: client.id,
                    converted_at: new Date().toISOString(),
                    conversion_notes: 'Conversion automatique depuis prospect'
                });

            if (conversionError) throw conversionError;

            // Marquer le prospect comme converti
            const { error: updateError } = await supabase
                .from('Prospect')
                .update({ 
                    status: 'converted',
                    updated_at: new Date().toISOString()
                })
                .eq('id', prospectId);

            if (updateError) throw updateError;

            return {
                client_id: client.id,
                prospect_id: prospectId
            };

        } catch (error) {
            console.error('Erreur convertProspectToClient:', error);
            throw new Error('Erreur lors de la conversion du prospect');
        }
    }

    // ===== NOTIFICATION EXPERT =====
    static async notifyExpertNewProspect(expertId: string, prospectId: string, apporteurId: string): Promise<{ success: boolean; notification_id?: string }> {
        try {
            const { data: notification, error } = await supabase
                .from('ExpertNotification')
                .insert({
                    expert_id: expertId,
                    prospect_id: prospectId,
                    apporteur_id: apporteurId,
                    notification_type: 'prospect_preselected',
                    title: 'Nouveau prospect présélectionné pour vous',
                    message: 'Un apporteur d\'affaires vous a présélectionné pour un prospect chaud. Voulez-vous accepter ?',
                    priority: 'high'
                })
                .select('id')
                .single();

            if (error) throw error;

            // Mettre à jour le statut du prospect
            await supabase
                .from('Prospect')
                .update({ 
                    status: 'expert_assigned',
                    expert_contacted_at: new Date().toISOString()
                })
                .eq('id', prospectId);

            return {
                success: true,
                notification_id: notification.id
            };

        } catch (error) {
            console.error('Erreur notifyExpertNewProspect:', error);
            return {
                success: false
            };
        }
    }

    // ===== VALIDATION =====
    private static validateProspectData(data: any): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (data.company_name !== undefined && (!data.company_name || data.company_name.trim().length === 0)) {
            errors.push('Le nom de l\'entreprise est requis');
        }

        if (data.decision_maker_first_name !== undefined && (!data.decision_maker_first_name || data.decision_maker_first_name.trim().length === 0)) {
            errors.push('Le prénom du décisionnaire est requis');
        }

        if (data.decision_maker_last_name !== undefined && (!data.decision_maker_last_name || data.decision_maker_last_name.trim().length === 0)) {
            errors.push('Le nom du décisionnaire est requis');
        }

        if (data.decision_maker_email !== undefined) {
            if (!data.decision_maker_email || !this.isValidEmail(data.decision_maker_email)) {
                errors.push('L\'email du décisionnaire est requis et doit être valide');
            }
        }

        if (data.decision_maker_phone !== undefined && (!data.decision_maker_phone || data.decision_maker_phone.trim().length === 0)) {
            errors.push('Le téléphone du décisionnaire est requis');
        }

        if (data.qualification_score !== undefined && (data.qualification_score < 1 || data.qualification_score > 10)) {
            errors.push('Le score de qualification doit être entre 1 et 10');
        }

        if (data.siren !== undefined && data.siren && !this.isValidSiren(data.siren)) {
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
